"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const API_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000/api";

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
    const res = await fetch(`${API_URL}${path}`, {
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
