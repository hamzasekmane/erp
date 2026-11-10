"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { apiBaseUrl } from "@/app/lib/apiBase";

export interface HrEmployee {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  departmentId: string | null;
  department: string | null;
  position: string | null;
  contractType: "cdi" | "cdd" | "intern" | "freelance";
  hireDate: string;
  salary: number;
  status: "active" | "inactive" | "terminated";
}

export interface HrDepartment {
  id: string;
  name: string;
  code?: string | null;
}

export interface HrActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

async function hrRequest(path: string, init?: RequestInit) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return { ok: false, status: 401, body: { message: "Session expirée, reconnectez-vous." } as Record<string, unknown> };
  }
  try {
    const res = await fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
    const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    return { ok: res.ok, status: res.status, body: body ?? {} };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: { message: error instanceof Error ? error.message : "Erreur réseau" } as Record<string, unknown>,
    };
  }
}

function normalizeEmployee(raw: Record<string, unknown>): HrEmployee {
  return {
    id: String(raw.id ?? raw._id ?? ""),
    code: String(raw.code ?? ""),
    firstName: String(raw.firstName ?? ""),
    lastName: String(raw.lastName ?? ""),
    email: (raw.email as string | null) ?? null,
    phone: (raw.phone as string | null) ?? null,
    departmentId: (raw.departmentId as string | null) ?? null,
    department: (raw.department as string | null) ?? null,
    position: (raw.position as string | null) ?? null,
    contractType: (raw.contractType as HrEmployee["contractType"]) ?? "cdi",
    hireDate: String(raw.hireDate ?? ""),
    salary: Number(raw.salary ?? 0),
    status: (raw.status as HrEmployee["status"]) ?? "active",
  };
}

export async function listEmployeesAction(
  params: { search?: string; status?: string; departmentId?: string; page?: number; limit?: number } = {},
): Promise<{ success: boolean; employees: HrEmployee[]; pagination: { total: number; page: number; limit: number; pages: number } | null; message?: string }> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.departmentId) query.set("departmentId", params.departmentId);
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 100));

  const { ok, body } = await hrRequest(`/hr/employees?${query.toString()}`);
  const rows = Array.isArray(body.data) ? (body.data as Record<string, unknown>[]) : [];
  return {
    success: ok,
    employees: rows.map(normalizeEmployee),
    pagination: (body.pagination as { total: number; page: number; limit: number; pages: number } | undefined) ?? null,
    message: ok ? undefined : String(body.message ?? "Impossible de charger les employés."),
  };
}

export async function listDepartmentsAction(): Promise<{ success: boolean; departments: HrDepartment[] }> {
  const { ok, body } = await hrRequest("/hr/departments?limit=100");
  const rows = Array.isArray(body.data) ? (body.data as Record<string, unknown>[]) : [];
  return {
    success: ok,
    departments: rows.map((row) => ({ id: String(row.id ?? row._id ?? ""), name: String(row.name ?? ""), code: (row.code as string | null) ?? null })),
  };
}

async function resolveDepartmentId(name?: string): Promise<string | null> {
  if (!name) return null;
  const { departments } = await listDepartmentsAction();
  const match = departments.find((department) => department.name.toLowerCase() === name.toLowerCase());
  if (match) return match.id;
  const created = await hrRequest("/hr/departments", { method: "POST", body: JSON.stringify({ name }) });
  const data = created.body.data as Record<string, unknown> | undefined;
  return data ? String(data.id ?? data._id ?? "") : null;
}

export async function createEmployeeAction(input: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  position?: string;
  departmentName?: string;
  contractType?: string;
  hireDate?: string;
  salary?: number;
}): Promise<HrActionResult<HrEmployee>> {
  if (!input.firstName?.trim() || !input.lastName?.trim()) {
    return { success: false, message: "Le prénom et le nom sont obligatoires." };
  }

  const contractType = input.contractType === "stage" ? "intern" : input.contractType || "cdi";
  const departmentId = await resolveDepartmentId(input.departmentName);
  const payload = {
    code: `EMP-${Date.now().toString().slice(-8)}`,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    departmentId,
    position: input.position?.trim() || null,
    contractType,
    hireDate: input.hireDate || new Date().toISOString().slice(0, 10),
    salary: Number(input.salary) || 0,
    address: input.address?.trim() || null,
  };

  const { ok, body } = await hrRequest("/hr/employees", { method: "POST", body: JSON.stringify(payload) });
  if (!ok) {
    return { success: false, message: String(body.message ?? "Création impossible.") };
  }
  revalidatePath("/dashboard/hr/employees");
  return { success: true, message: "Employé créé", data: normalizeEmployee(body.data as Record<string, unknown>) };
}

export async function updateEmployeeAction(
  id: string,
  patch: Partial<{ firstName: string; lastName: string; email: string; phone: string; position: string; contractType: string; salary: number; status: string }>,
): Promise<HrActionResult> {
  const { ok, body } = await hrRequest(`/hr/employees/${id}`, { method: "PUT", body: JSON.stringify(patch) });
  if (ok) revalidatePath("/dashboard/hr/employees");
  return { success: ok, message: ok ? "Employé mis à jour" : String(body.message ?? "Mise à jour impossible.") };
}

export async function deleteEmployeeAction(id: string): Promise<HrActionResult> {
  const { ok, body } = await hrRequest(`/hr/employees/${id}`, { method: "DELETE" });
  if (ok) revalidatePath("/dashboard/hr/employees");
  return { success: ok, message: ok ? "Employé supprimé" : String(body.message ?? "Suppression impossible.") };
}

export async function employeesStatsAction(): Promise<{
  success: boolean;
  stats: { totalEmployees: number; activeEmployees: number; monthlyPayroll: number; byDepartment: Array<{ department: string; count: number }> } | null;
}> {
  const { ok, body } = await hrRequest("/hr/employees/stats");
  return { success: ok, stats: ok ? (body.data as never) : null };
}

/* ---------------------------------- Leaves --------------------------------- */

export interface HrLeave {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reason: string | null;
}

export async function listLeavesAction(params: { status?: string } = {}): Promise<{ success: boolean; leaves: HrLeave[]; message?: string }> {
  const query = new URLSearchParams({ limit: "100", page: "1" });
  if (params.status) query.set("status", params.status);
  const { ok, body } = await hrRequest(`/hr/leaves?${query.toString()}`);
  const rows = Array.isArray(body.data) ? (body.data as Record<string, unknown>[]) : [];
  return {
    success: ok,
    message: ok ? undefined : String(body.message ?? "Impossible de charger les congés."),
    leaves: rows.map((row) => ({
      id: String(row.id ?? ""),
      employeeId: String(row.employeeId ?? ""),
      employeeName: String(row.employeeName ?? ""),
      type: String(row.type ?? "annual"),
      startDate: String(row.startDate ?? ""),
      endDate: String(row.endDate ?? ""),
      days: Number(row.days ?? 0),
      status: (row.status as HrLeave["status"]) ?? "pending",
      reason: (row.reason as string | null) ?? null,
    })),
  };
}

export async function createLeaveAction(input: { employeeId: string; type: string; startDate: string; endDate: string; days: number; reason?: string }): Promise<HrActionResult> {
  const { ok, body } = await hrRequest("/hr/leaves", { method: "POST", body: JSON.stringify(input) });
  if (ok) revalidatePath("/dashboard/hr/leaves");
  return { success: ok, message: ok ? "Demande de congé enregistrée" : String(body.message ?? "Création impossible.") };
}

export async function decideLeaveAction(id: string, status: "approved" | "rejected" | "cancelled"): Promise<HrActionResult> {
  const { ok, body } = await hrRequest(`/hr/leaves/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
  if (ok) revalidatePath("/dashboard/hr/leaves");
  return { success: ok, message: ok ? "Demande mise à jour" : String(body.message ?? "Mise à jour impossible.") };
}

/* -------------------------------- Attendance ------------------------------- */

export interface HrAttendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
}

export async function listAttendanceAction(params: { date?: string } = {}): Promise<{ success: boolean; records: HrAttendance[]; message?: string }> {
  const query = new URLSearchParams({ limit: "200", page: "1" });
  if (params.date) query.set("date", params.date);
  const { ok, body } = await hrRequest(`/hr/attendance?${query.toString()}`);
  const rows = Array.isArray(body.data) ? (body.data as Record<string, unknown>[]) : [];
  return {
    success: ok,
    message: ok ? undefined : String(body.message ?? "Impossible de charger les présences."),
    records: rows.map((row) => ({
      id: String(row.id ?? ""),
      employeeId: String(row.employeeId ?? ""),
      employeeName: String(row.employeeName ?? ""),
      date: String(row.date ?? ""),
      checkIn: (row.checkIn as string | null) ?? null,
      checkOut: (row.checkOut as string | null) ?? null,
      status: String(row.status ?? "present"),
    })),
  };
}

export async function markAttendanceAction(input: { employeeId: string; date: string; checkIn?: string; checkOut?: string; status?: string }): Promise<HrActionResult> {
  const { ok, body } = await hrRequest("/hr/attendance", { method: "POST", body: JSON.stringify(input) });
  if (ok) revalidatePath("/dashboard/hr/attendance");
  return { success: ok, message: ok ? "Pointage enregistré" : String(body.message ?? "Pointage impossible.") };
}

/* --------------------------------- Payroll --------------------------------- */

export interface HrPayrollLine {
  employeeId: string;
  name: string;
  department: string | null;
  baseSalary: number;
  leaveDays: number;
  deduction: number;
  netSalary: number;
}

export async function payrollAction(month?: string): Promise<{
  success: boolean;
  month: string | null;
  lines: HrPayrollLine[];
  totals: { gross: number; net: number } | null;
  message?: string;
}> {
  const query = month ? `?month=${encodeURIComponent(month)}` : "";
  const { ok, body } = await hrRequest(`/hr/payroll${query}`);
  const data = body.data as
    | { month?: string; lines?: HrPayrollLine[]; totalGross?: number; totalNet?: number }
    | undefined;
  return {
    success: ok,
    month: data?.month ?? null,
    lines: Array.isArray(data?.lines) ? data!.lines : [],
    totals: data ? { gross: Number(data.totalGross ?? 0), net: Number(data.totalNet ?? 0) } : null,
    message: ok ? undefined : String(body.message ?? "Impossible de charger la paie."),
  };
}

/* -------------------------------- Contracts -------------------------------- */

export interface HrContract {
  id: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string | null;
  status: string;
  salary?: number;
}

export async function listContractsAction(): Promise<{ success: boolean; contracts: HrContract[]; message?: string }> {
  const { ok, body } = await hrRequest("/hr/contracts");
  const rows = Array.isArray(body.data) ? (body.data as Record<string, unknown>[]) : [];
  return {
    success: ok,
    message: ok ? undefined : String(body.message ?? "Impossible de charger les contrats."),
    contracts: rows.map((row) => ({
      id: String(row.id ?? ""),
      employeeId: String(row.employeeId ?? ""),
      type: String(row.type ?? "cdi"),
      startDate: String(row.startDate ?? ""),
      endDate: (row.endDate as string | null) ?? null,
      status: String(row.status ?? "active"),
      salary: row.salary === undefined ? undefined : Number(row.salary),
    })),
  };
}

export async function createContractAction(input: { employeeId: string; type: string; startDate: string; endDate?: string; salary?: number; notes?: string }): Promise<HrActionResult> {
  const { ok, body } = await hrRequest("/hr/contracts", { method: "POST", body: JSON.stringify(input) });
  if (ok) revalidatePath("/dashboard/hr/contracts");
  return { success: ok, message: ok ? "Contrat enregistré" : String(body.message ?? "Création impossible.") };
}

/* ------------------------------- Departments ------------------------------- */

export async function createDepartmentAction(input: { name: string; description?: string }): Promise<HrActionResult<HrDepartment>> {
  const { ok, body } = await hrRequest("/hr/departments", { method: "POST", body: JSON.stringify(input) });
  if (ok) revalidatePath("/dashboard/hr/departments");
  const data = body.data as Record<string, unknown> | undefined;
  return {
    success: ok,
    message: ok ? "Département créé" : String(body.message ?? "Création impossible."),
    data: data ? { id: String(data.id ?? ""), name: String(data.name ?? "") } : undefined,
  };
}

export async function updateDepartmentAction(id: string, input: { name?: string; description?: string }): Promise<HrActionResult> {
  const { ok, body } = await hrRequest(`/hr/departments/${id}`, { method: "PUT", body: JSON.stringify(input) });
  if (ok) revalidatePath("/dashboard/hr/departments");
  return { success: ok, message: ok ? "Département mis à jour" : String(body.message ?? "Mise à jour impossible.") };
}

export async function deleteDepartmentAction(id: string): Promise<HrActionResult> {
  const { ok, body } = await hrRequest(`/hr/departments/${id}`, { method: "DELETE" });
  if (ok) revalidatePath("/dashboard/hr/departments");
  return { success: ok, message: ok ? "Département supprimé" : String(body.message ?? "Suppression impossible.") };
}
