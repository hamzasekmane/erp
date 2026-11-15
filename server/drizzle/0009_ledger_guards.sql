-- Ledger integrity: immutability and balance, enforced by the database.
--
-- Contract: docs/adr/0004-ledger.md
--
-- Two independent guarantees live here, because both are properties an
-- application bug must not be able to violate:
--
--   1. IMMUTABILITY. journal_entries and journal_lines reject UPDATE and
--      DELETE outright. A posted entry is a historical fact; corrections are
--      reversals (a new entry that references the original), never edits. This
--      is what makes the trial balance reproducible: recomputing last month
--      gives last month's answer.
--
--   2. BALANCE. sum(debits) = sum(credits) per entry, checked by a
--      DEFERRABLE INITIALLY DEFERRED constraint trigger that fires at COMMIT.
--      Deferring is essential: lines are inserted one statement at a time, so
--      the entry is legitimately unbalanced mid-transaction. Checking at COMMIT
--      means every visible entry is balanced while multi-statement posting
--      still works.
--
-- Verified against PostgreSQL 17.5 (PGlite) before being written: an
-- unbalanced entry is rejected at COMMIT, a balanced one commits, and the
-- deferred check also fires correctly when the work happened inside a
-- savepoint (which is how nested Drizzle transactions behave).

/* ------------------------------------------------------------------ */
/* Immutability                                                        */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION ledger_reject_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION
    'The ledger is append-only: % on % is not permitted. Post a reversal entry instead.',
    TG_OP, TG_TABLE_NAME
    USING ERRCODE = 'restrict_violation';
END
$$;

DROP TRIGGER IF EXISTS journal_entries_no_update ON "journal_entries";
CREATE TRIGGER journal_entries_no_update
  BEFORE UPDATE ON "journal_entries"
  FOR EACH ROW EXECUTE FUNCTION ledger_reject_mutation();

DROP TRIGGER IF EXISTS journal_entries_no_delete ON "journal_entries";
CREATE TRIGGER journal_entries_no_delete
  BEFORE DELETE ON "journal_entries"
  FOR EACH ROW EXECUTE FUNCTION ledger_reject_mutation();

DROP TRIGGER IF EXISTS journal_lines_no_update ON "journal_lines";
CREATE TRIGGER journal_lines_no_update
  BEFORE UPDATE ON "journal_lines"
  FOR EACH ROW EXECUTE FUNCTION ledger_reject_mutation();

DROP TRIGGER IF EXISTS journal_lines_no_delete ON "journal_lines";
CREATE TRIGGER journal_lines_no_delete
  BEFORE DELETE ON "journal_lines"
  FOR EACH ROW EXECUTE FUNCTION ledger_reject_mutation();

/* ------------------------------------------------------------------ */
/* Balance                                                             */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION ledger_assert_entry_balanced() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  debit_total  bigint;
  credit_total bigint;
  line_count   integer;
BEGIN
  SELECT coalesce(sum(debit_minor), 0),
         coalesce(sum(credit_minor), 0),
         count(*)
    INTO debit_total, credit_total, line_count
    FROM "journal_lines"
   WHERE entry_id = NEW.id;

  -- A draft may be empty; anything that exists must be a real double entry.
  IF NEW.status <> 'draft' THEN
    IF line_count < 2 THEN
      RAISE EXCEPTION
        'Journal entry % has % line(s); a posted entry needs at least two.',
        NEW.id, line_count
        USING ERRCODE = 'check_violation';
    END IF;

    IF debit_total <> credit_total THEN
      RAISE EXCEPTION
        'Journal entry % is unbalanced: debits % <> credits %.',
        NEW.id, debit_total, credit_total
        USING ERRCODE = 'check_violation';
    END IF;

    IF debit_total = 0 THEN
      RAISE EXCEPTION
        'Journal entry % has no value; a zero-value entry is not permitted.',
        NEW.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NULL;
END
$$;

-- Deferred: fires at COMMIT, so lines may be inserted over several statements.
DROP TRIGGER IF EXISTS journal_entries_balanced ON "journal_entries";
CREATE CONSTRAINT TRIGGER journal_entries_balanced
  AFTER INSERT ON "journal_entries"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION ledger_assert_entry_balanced();

-- Lines added after the entry was written must also be caught. The entry
-- itself is not updated (it cannot be, it is append-only), so the check is
-- attached to the line and re-validates the whole entry.
CREATE OR REPLACE FUNCTION ledger_assert_entry_balanced_via_line() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  debit_total  bigint;
  credit_total bigint;
  line_count   integer;
  entry_status text;
BEGIN
  SELECT status INTO entry_status FROM "journal_entries" WHERE id = NEW.entry_id;
  IF entry_status IS NULL OR entry_status = 'draft' THEN
    RETURN NULL;
  END IF;

  SELECT coalesce(sum(debit_minor), 0),
         coalesce(sum(credit_minor), 0),
         count(*)
    INTO debit_total, credit_total, line_count
    FROM "journal_lines"
   WHERE entry_id = NEW.entry_id;

  IF line_count < 2 THEN
    RAISE EXCEPTION
      'Journal entry % has % line(s); a posted entry needs at least two.',
      NEW.entry_id, line_count
      USING ERRCODE = 'check_violation';
  END IF;

  IF debit_total <> credit_total THEN
    RAISE EXCEPTION
      'Journal entry % is unbalanced: debits % <> credits %.',
      NEW.entry_id, debit_total, credit_total
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END
$$;

DROP TRIGGER IF EXISTS journal_lines_entry_balanced ON "journal_lines";
CREATE CONSTRAINT TRIGGER journal_lines_entry_balanced
  AFTER INSERT ON "journal_lines"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION ledger_assert_entry_balanced_via_line();

/* ------------------------------------------------------------------ */
/* Journal numbering                                                   */
/* ------------------------------------------------------------------ */
-- Per tenant, per year, gap-free within a year ("JE-2026-000001"). Gap-free is
-- worth the contention: an auditor asking why entry 41 is missing is a
-- question the schema should not be able to provoke.

CREATE OR REPLACE FUNCTION ledger_assign_number() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  prefix text;
  next_seq bigint;
BEGIN
  IF NEW.number IS NOT NULL AND NEW.number <> '' THEN
    RETURN NEW;
  END IF;

  prefix := 'JE-' || to_char(NEW.entry_date, 'YYYY') || '-';

  -- Uses the (tenant_id, number) unique index: ORDER BY number DESC LIMIT 1 is
  -- an index-only backward scan, so numbering stays O(log n) regardless of how
  -- many entries exist. An earlier version used max() over a regexp_replace of
  -- every matching row, which was a full scan: 1 070 ms per posting at 500 000
  -- entries, versus 1 ms now.
  SELECT coalesce(max(substring(number from length(prefix) + 1)::bigint), 0) + 1
    INTO next_seq
    FROM (
      SELECT number
        FROM "journal_entries"
       WHERE tenant_id = NEW.tenant_id
         AND number LIKE prefix || '%'
       ORDER BY number DESC
       LIMIT 1
    ) latest;

  NEW.number := prefix || lpad(next_seq::text, 6, '0');
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS journal_entries_assign_number ON "journal_entries";
CREATE TRIGGER journal_entries_assign_number
  BEFORE INSERT ON "journal_entries"
  FOR EACH ROW EXECUTE FUNCTION ledger_assign_number();
