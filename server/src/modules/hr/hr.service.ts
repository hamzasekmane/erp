import { Injectable } from "@nestjs/common";
import { and, asc, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { getDb } from "../../db/client";
import { attendanceRecords, departments, employeeContracts, employees, leaveRequests } from "../../db/schema";
import { audit } from "../../shared/audit";
import { AppError } from "../../shared/errors";
import { newId } from "../../shared/ids";
import { paginate } from "../../shared/http";
import { fromMinor, toMinor } from "../../shared/money";

type Ctx = { tenantId: string; userId: string; ip?: string | null; userAgent?: string | null };

@Injectable()
export class HrService {
  /* ---------------------------- departments --------------------------- */

  async listDepartments(ctx: Ctx) {
    const db = getDb();
    const rows = await db
      .select({
        department: departments,
        employeeCount: sql<number>`(select count(*)::int from employees e where e.department_id = ${departments.id} and e.deleted_at is null)`,
      })
      .from(departments)
      .where(and(eq(departments.tenantId, ctx.tenantId), isNull(departments.deletedAt)))
      .orderBy(asc(departments.name));
    return rows.map(({ department, employeeCount }) => ({
      _id: department.id,
      id: department.id,
      name: department.name,
      description: department.description,
      managerId: department.managerId,
      employeeCount: Number(employeeCount),
    }));
  }

  async createDepartment(ctx: Ctx, input: { name: string; description?: string | null; managerId?: string | null }) {
    const db = getDb();
    const id = newId();
    await db.insert(departments).values({ id, tenantId: ctx.tenantId, name: input.name.trim(), description: input.description ?? null, managerId: input.managerId ?? null });
    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "hr.department_created", entity: "department", entityId: id, ip: ctx.ip, userAgent: ctx.userAgent });
    return { _id: id, id, name: input.name.trim(), description: input.description ?? null, managerId: input.managerId ?? null, employeeCount: 0 };
  }

  async updateDepartment(ctx: Ctx, id: string, input: { name?: string; description?: string | null; managerId?: string | null }) {
    const db = getDb();
    const patch: Partial<typeof departments.$inferInsert> = { updatedAt: new Date() };
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.description !== undefined) patch.description = input.description ?? null;
    if (input.managerId !== undefined) patch.managerId = input.managerId ?? null;
    await db.update(departments).set(patch).where(and(eq(departments.id, id), eq(departments.tenantId, ctx.tenantId)));
    return { success: true };
  }

  async removeDepartment(ctx: Ctx, id: string) {
    const db = getDb();
    const [used] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(eq(employees.tenantId, ctx.tenantId), eq(employees.departmentId, id), isNull(employees.deletedAt)))
      .limit(1);
    if (used) throw AppError.unprocessable("DEPARTMENT_IN_USE", "Ce département contient encore des employés.");
    await db.update(departments).set({ deletedAt: new Date(), updatedAt: new Date() }).where(and(eq(departments.id, id), eq(departments.tenantId, ctx.tenantId)));
    return { success: true };
  }

  /* ----------------------------- employees ---------------------------- */

  async listEmployees(
    ctx: Ctx,
    query: { page: number; limit: number; offset: number; search?: string; departmentId?: string; status?: string },
  ) {
    const db = getDb();
    const filters: SQL[] = [eq(employees.tenantId, ctx.tenantId), isNull(employees.deletedAt)];
    if (query.departmentId) filters.push(eq(employees.departmentId, query.departmentId));
    if (query.status) filters.push(eq(employees.status, query.status));
    if (query.search) {
      const term = `%${query.search.toLowerCase()}%`;
      const search = or(
        sql`lower(${employees.firstName}) like ${term}`,
        sql`lower(${employees.lastName}) like ${term}`,
        sql`lower(${employees.code}) like ${term}`,
        sql`lower(coalesce(${employees.email}, '')) like ${term}`,
      );
      if (search) filters.push(search);
    }
    const where = and(...filters);
    const [rows, [countRow]] = await Promise.all([
      db
        .select({ employee: employees, departmentName: departments.name })
        .from(employees)
        .leftJoin(departments, eq(departments.id, employees.departmentId))
        .where(where)
        .orderBy(desc(employees.createdAt))
        .limit(query.limit)
        .offset(query.offset),
      db.select({ count: sql<number>`count(*)::int` }).from(employees).where(where),
    ]);

    return {
      items: rows.map(({ employee, departmentName }) => ({
        _id: employee.id,
        id: employee.id,
        code: employee.code,
        firstName: employee.firstName,
        lastName: employee.lastName,
        name: `${employee.firstName} ${employee.lastName}`.trim(),
        email: employee.email,
        phone: employee.phone,
        departmentId: employee.departmentId,
        department: departmentName,
        position: employee.position,
        contractType: employee.contractType,
        hireDate: employee.hireDate,
        salary: fromMinor(Number(employee.salaryMinor)),
        status: employee.status,
        createdAt: employee.createdAt.toISOString(),
      })),
      pagination: paginate(countRow?.count ?? 0, query.page, query.limit),
    };
  }

  async createEmployee(
    ctx: Ctx,
    input: {
      code: string;
      firstName: string;
      lastName: string;
      email?: string | null;
      phone?: string | null;
      departmentId?: string | null;
      position?: string;
      contractType?: string;
      hireDate: string;
      salary?: number;
      address?: string | null;
      notes?: string | null;
    },
  ) {
    const db = getDb();
    const id = newId();
    await db.insert(employees).values({
      id,
      tenantId: ctx.tenantId,
      code: input.code.trim(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email ?? null,
      phone: input.phone ?? null,
      departmentId: input.departmentId ?? null,
      position: input.position ?? "",
      contractType: (input.contractType ?? "cdi") as string,
      hireDate: input.hireDate.slice(0, 10),
      salaryMinor: toMinor(input.salary ?? 0),
      status: "active",
      address: input.address ?? null,
      notes: input.notes ?? null,
    });
    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "hr.employee_created", entity: "employee", entityId: id, after: { code: input.code }, ip: ctx.ip, userAgent: ctx.userAgent });
    return { _id: id, id };
  }

  async updateEmployee(ctx: Ctx, id: string, input: Record<string, unknown>) {
    const db = getDb();
    const patch: Partial<typeof employees.$inferInsert> = { updatedAt: new Date() };
    const map: Array<[string, keyof typeof employees.$inferInsert]> = [
      ["code", "code"],
      ["firstName", "firstName"],
      ["lastName", "lastName"],
      ["email", "email"],
      ["phone", "phone"],
      ["departmentId", "departmentId"],
      ["position", "position"],
      ["contractType", "contractType"],
      ["status", "status"],
      ["address", "address"],
      ["notes", "notes"],
    ];
    for (const [key, column] of map) {
      if (input[key] !== undefined) (patch as Record<string, unknown>)[column] = input[key] ?? null;
    }
    if (input.hireDate !== undefined) patch.hireDate = String(input.hireDate).slice(0, 10);
    if (input.salary !== undefined) patch.salaryMinor = toMinor(Number(input.salary));
    await db.update(employees).set(patch).where(and(eq(employees.id, id), eq(employees.tenantId, ctx.tenantId)));
    return { success: true };
  }

  async removeEmployee(ctx: Ctx, id: string) {
    const db = getDb();
    await db
      .update(employees)
      .set({ deletedAt: new Date(), status: "terminated", updatedAt: new Date() })
      .where(and(eq(employees.id, id), eq(employees.tenantId, ctx.tenantId)));
    return { success: true };
  }

  async employeeStats(ctx: Ctx) {
    const db = getDb();
    const [row] = await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`coalesce(sum(case when ${employees.status} = 'active' then 1 else 0 end), 0)::int`,
        payroll: sql<number>`coalesce(sum(case when ${employees.status} = 'active' then ${employees.salaryMinor} else 0 end), 0)::bigint`,
      })
      .from(employees)
      .where(and(eq(employees.tenantId, ctx.tenantId), isNull(employees.deletedAt)));
    const byDepartment = await db
      .select({ department: departments.name, count: sql<number>`count(*)::int` })
      .from(employees)
      .leftJoin(departments, eq(departments.id, employees.departmentId))
      .where(and(eq(employees.tenantId, ctx.tenantId), isNull(employees.deletedAt)))
      .groupBy(departments.name);
    return {
      totalEmployees: Number(row?.total ?? 0),
      activeEmployees: Number(row?.active ?? 0),
      monthlyPayroll: fromMinor(Number(row?.payroll ?? 0)),
      byDepartment: byDepartment.map((entry) => ({ department: entry.department ?? "Sans département", count: Number(entry.count) })),
    };
  }

  /* ----------------------------- contracts ---------------------------- */

  async listContracts(ctx: Ctx, employeeId?: string) {
    const db = getDb();
    const filters: SQL[] = [eq(employeeContracts.tenantId, ctx.tenantId)];
    if (employeeId) filters.push(eq(employeeContracts.employeeId, employeeId));
    const rows = await db.select().from(employeeContracts).where(and(...filters)).orderBy(desc(employeeContracts.startDate));
    return rows.map((row) => ({
      _id: row.id,
      id: row.id,
      employeeId: row.employeeId,
      type: row.type,
      startDate: row.startDate,
      endDate: row.endDate,
      salary: fromMinor(Number(row.salaryMinor)),
      status: row.status,
      notes: row.notes,
    }));
  }

  async createContract(ctx: Ctx, input: { employeeId: string; type: string; startDate: string; endDate?: string | null; salary?: number; notes?: string | null }) {
    const db = getDb();
    const id = newId();
    await db.insert(employeeContracts).values({
      id,
      tenantId: ctx.tenantId,
      employeeId: input.employeeId,
      type: input.type,
      startDate: input.startDate.slice(0, 10),
      endDate: input.endDate ? input.endDate.slice(0, 10) : null,
      salaryMinor: toMinor(input.salary ?? 0),
      notes: input.notes ?? null,
    });
    return { _id: id, id };
  }

  /* ------------------------------ leaves ------------------------------ */

  async listLeaves(ctx: Ctx, query: { page: number; limit: number; offset: number; status?: string }) {
    const db = getDb();
    const filters: SQL[] = [eq(leaveRequests.tenantId, ctx.tenantId)];
    if (query.status) filters.push(eq(leaveRequests.status, query.status));
    const where = and(...filters);
    const [rows, [countRow]] = await Promise.all([
      db
        .select({ leave: leaveRequests, firstName: employees.firstName, lastName: employees.lastName })
        .from(leaveRequests)
        .leftJoin(employees, eq(employees.id, leaveRequests.employeeId))
        .where(where)
        .orderBy(desc(leaveRequests.createdAt))
        .limit(query.limit)
        .offset(query.offset),
      db.select({ count: sql<number>`count(*)::int` }).from(leaveRequests).where(where),
    ]);
    return {
      items: rows.map(({ leave, firstName, lastName }) => ({
        _id: leave.id,
        id: leave.id,
        employeeId: leave.employeeId,
        employeeName: `${firstName ?? ""} ${lastName ?? ""}`.trim(),
        type: leave.type,
        startDate: leave.startDate,
        endDate: leave.endDate,
        days: Number(leave.days),
        status: leave.status,
        reason: leave.reason,
        createdAt: leave.createdAt.toISOString(),
      })),
      pagination: paginate(countRow?.count ?? 0, query.page, query.limit),
    };
  }

  async requestLeave(ctx: Ctx, input: { employeeId: string; type: string; startDate: string; endDate: string; days?: number; reason?: string }) {
    const db = getDb();
    const id = newId();
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    const days = input.days ?? Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);
    await db.insert(leaveRequests).values({
      id,
      tenantId: ctx.tenantId,
      employeeId: input.employeeId,
      type: input.type,
      startDate: input.startDate.slice(0, 10),
      endDate: input.endDate.slice(0, 10),
      days: String(days),
      reason: input.reason ?? null,
    });
    return { _id: id, id };
  }

  async decideLeave(ctx: Ctx, id: string, status: "approved" | "rejected" | "cancelled") {
    const db = getDb();
    await db
      .update(leaveRequests)
      .set({ status, decidedBy: ctx.userId, decidedAt: new Date() })
      .where(and(eq(leaveRequests.id, id), eq(leaveRequests.tenantId, ctx.tenantId)));
    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: `hr.leave_${status}`, entity: "leave_request", entityId: id, ip: ctx.ip, userAgent: ctx.userAgent });
    return { success: true };
  }

  /* ---------------------------- attendance ---------------------------- */

  async listAttendance(ctx: Ctx, query: { date?: string; employeeId?: string; page: number; limit: number; offset: number }) {
    const db = getDb();
    const filters: SQL[] = [eq(attendanceRecords.tenantId, ctx.tenantId)];
    if (query.date) filters.push(eq(attendanceRecords.date, query.date.slice(0, 10)));
    if (query.employeeId) filters.push(eq(attendanceRecords.employeeId, query.employeeId));
    const where = and(...filters);
    const [rows, [countRow]] = await Promise.all([
      db
        .select({ record: attendanceRecords, firstName: employees.firstName, lastName: employees.lastName })
        .from(attendanceRecords)
        .leftJoin(employees, eq(employees.id, attendanceRecords.employeeId))
        .where(where)
        .orderBy(desc(attendanceRecords.date))
        .limit(query.limit)
        .offset(query.offset),
      db.select({ count: sql<number>`count(*)::int` }).from(attendanceRecords).where(where),
    ]);
    return {
      items: rows.map(({ record, firstName, lastName }) => ({
        _id: record.id,
        id: record.id,
        employeeId: record.employeeId,
        employeeName: `${firstName ?? ""} ${lastName ?? ""}`.trim(),
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        status: record.status,
        notes: record.notes,
      })),
      pagination: paginate(countRow?.count ?? 0, query.page, query.limit),
    };
  }

  async markAttendance(ctx: Ctx, input: { employeeId: string; date: string; checkIn?: string; checkOut?: string; status?: string; notes?: string }) {
    const db = getDb();
    const date = input.date.slice(0, 10);
    const [existing] = await db
      .select()
      .from(attendanceRecords)
      .where(and(eq(attendanceRecords.tenantId, ctx.tenantId), eq(attendanceRecords.employeeId, input.employeeId), eq(attendanceRecords.date, date)))
      .limit(1);
    if (existing) {
      await db
        .update(attendanceRecords)
        .set({ checkIn: input.checkIn ?? existing.checkIn, checkOut: input.checkOut ?? existing.checkOut, status: input.status ?? existing.status, notes: input.notes ?? existing.notes })
        .where(eq(attendanceRecords.id, existing.id));
      return { _id: existing.id, id: existing.id };
    }
    const id = newId();
    await db.insert(attendanceRecords).values({
      id,
      tenantId: ctx.tenantId,
      employeeId: input.employeeId,
      date,
      checkIn: input.checkIn ?? null,
      checkOut: input.checkOut ?? null,
      status: input.status ?? "present",
      notes: input.notes ?? null,
    });
    return { _id: id, id };
  }

  /* ------------------------------ payroll ----------------------------- */

  async payroll(ctx: Ctx, month?: string) {
    const db = getDb();
    const target = month && /^\d{4}-\d{2}$/.test(month) ? month : new Date().toISOString().slice(0, 7);
    const rows = await db
      .select({ employee: employees, departmentName: departments.name })
      .from(employees)
      .leftJoin(departments, eq(departments.id, employees.departmentId))
      .where(and(eq(employees.tenantId, ctx.tenantId), isNull(employees.deletedAt), eq(employees.status, "active")))
      .orderBy(asc(employees.lastName));

    const [yearPart, monthPart] = target.split("-").map(Number);
    const monthStart = `${target}-01`;
    const monthEnd = new Date(Date.UTC(yearPart!, monthPart!, 0)).toISOString().slice(0, 10);
    const leaveRows = await db
      .select({ employeeId: leaveRequests.employeeId, days: sql<number>`coalesce(sum(${leaveRequests.days}), 0)::numeric` })
      .from(leaveRequests)
      .where(and(eq(leaveRequests.tenantId, ctx.tenantId), eq(leaveRequests.status, "approved"), gte(leaveRequests.startDate, monthStart), lte(leaveRequests.startDate, monthEnd)))
      .groupBy(leaveRequests.employeeId);
    const leaveMap = new Map(leaveRows.map((row) => [row.employeeId, Number(row.days)]));

    const lines = rows.map(({ employee, departmentName }) => {
      const base = Number(employee.salaryMinor);
      const unpaidDays = leaveMap.get(employee.id) ?? 0;
      const dailyRate = base / 30;
      const deduction = Math.round(dailyRate * unpaidDays);
      return {
        employeeId: employee.id,
        name: `${employee.firstName} ${employee.lastName}`.trim(),
        department: departmentName,
        baseSalary: fromMinor(base),
        leaveDays: unpaidDays,
        deduction: fromMinor(deduction),
        netSalary: fromMinor(Math.max(0, base - deduction)),
      };
    });

    return {
      month: target,
      totalGross: lines.reduce((sum, line) => sum + line.baseSalary, 0),
      totalNet: lines.reduce((sum, line) => sum + line.netSalary, 0),
      lines,
    };
  }
}
