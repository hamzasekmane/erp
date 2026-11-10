// app/dashboard/layout.tsx
import Sidebar from "@/app/components/layout/Sidebar";
import Navbar from "@/app/components/layout/Navbar";
import dashboardService from "@/app/services/dashboard/dashboard.service";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import DashboardSkeleton from "@/app/components/ui/DashboardSkeleton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) redirect("/login");

  let user = null;
  try {
    const userProfile = await dashboardService.getUserProfile(token);
    if (!userProfile) redirect("/login");
    user = { ...userProfile, token };
  } catch (err) {
    console.error("Auth Error:", err);
    redirect("/login");
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[var(--background)]" dir="ltr">
      {/* Sidebar – unchanged */}
      <aside className="hidden lg:block lg:w-64 xl:w-70 flex-shrink-0 border-r border-[var(--border)] bg-[var(--navbar-bg)] backdrop-blur-xl h-full overflow-y-auto custom-scrollbar">
        <Suspense fallback={<div className="p-4 text-[var(--foreground-muted)]">Chargement...</div>}>
          <Sidebar user={user} />
        </Suspense>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-dvh overflow-hidden bg-[var(--background)]">
        {/* Navbar – you can also reduce its height in its own component */}
        <Suspense fallback={<div className="h-16 bg-[var(--navbar-bg)] border-b border-[var(--border)]" />}>
          <Navbar user={user} />
        </Suspense>

        {/* Main content – reduced padding to save vertical space */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4 custom-scrollbar">
          {/* Background decorative blobs – adjusted to not cause overflow */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
            <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-[var(--accent)]/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] bg-[var(--accent)]/3 rounded-full blur-[120px]" />
            <div className="absolute top-[30%] left-[10%] w-[250px] h-[250px] bg-[var(--accent)]/5 rounded-full blur-[100px]" />
          </div>

          <Suspense fallback={<DashboardSkeleton />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}