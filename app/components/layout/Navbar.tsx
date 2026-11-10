"use client";

import { usePathname } from "next/navigation";
import {
  Sun,
  Moon,
  ChevronRight,
  LogOut,
  Terminal,
  Home,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { logout } from "@/app/actions/logout";
import NotificationBell from "@/app/components/Dashboard/NotificationBell";
import Sidebar from "./Sidebar";

interface NavbarProps {
  user: {
    name: string;
    role: string;
    avatar?: string;
    email?: string;
    token?: string;
    id?: string;
    _id?: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fermer le menu mobile lors du changement de route
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Empêcher le scroll du body quand le menu est ouvert
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Fermer le tiroir mobile avec la touche Échap
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileMenuOpen]);

  // Get breadcrumb segments
  const segments = pathname
    .split("/")
    .filter((item) => item !== "" && item !== "dashboard");

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const userId = user?.id || user?._id || "";
  const userName = user?.name?.split(" ")[0]?.toUpperCase() || "ADMIN";
  const userRole = user?.role?.toUpperCase() || "ADMIN";
  const userEmail = user?.email || user?.name || "Administrateur";
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "A";

  const handleLogout = async () => {
    await logout();
  };

  // Format breadcrumb segment
  const formatSegment = (segment: string) => {
    return segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <header className="h-20 bg-[var(--background)] border-b border-[var(--border)] px-8" />
    );
  }

  return (
    <>
      <header className="h-16 md:h-20 bg-[var(--navbar-bg)] backdrop-blur-md border-b border-[var(--border)] sticky top-0 z-30 px-3 sm:px-4 md:px-8 flex items-center justify-between gap-2 transition-all duration-300">
        
        {/* ===== LEFT SECTION ===== */}
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
          
          {/* BOUTON MENU MOBILE */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden shrink-0 p-2 text-[var(--foreground)] hover:bg-[var(--accent)]/10 rounded-xl transition-colors"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Breadcrumbs */}
          <div className="hidden sm:flex items-center gap-1.5 md:gap-2 text-[var(--foreground-muted)] overflow-x-auto custom-scrollbar pb-1 min-w-0">
            
            {/* Dashboard Root */}
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              <Home size={12} className="text-[var(--foreground-muted)]" />
              <span className="text-[10px] md:text-xs font-black text-[var(--accent)] uppercase tracking-wider whitespace-nowrap">
                DASHBOARD
              </span>
            </div>

            {/* Dynamic Breadcrumbs */}
            {segments.length > 0 && (
              <>
                <ChevronRight size={12} className="text-[var(--foreground-muted)]/40 flex-shrink-0" />

                {segments.map((segment, index) => {
                  const isLast = index === segments.length - 1;
                  const formattedSegment = formatSegment(segment);

                  return (
                    <div key={index} className="flex items-center gap-2">
                      <span
                        className={`
                          text-[10px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200
                          ${isLast
                            ? "text-[var(--foreground)] bg-[var(--accent)]/10 px-2 py-1 rounded-md border border-[var(--accent)]/30"
                            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer"
                          }
                        `}
                      >
                        {formattedSegment}
                      </span>

                      {!isLast && (
                        <ChevronRight
                          size={12}
                          className="text-[var(--foreground-muted)]/40 flex-shrink-0"
                        />
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* ===== RIGHT SECTION ===== */}
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-bg)] hover:bg-[var(--card-bg)]/80 transition-all duration-300 overflow-hidden"
            aria-label="Toggle theme"
          >
            <span className={`
              absolute transition-all duration-300 transform
              ${resolvedTheme === "dark" 
                ? "opacity-0 rotate-90 scale-50" 
                : "opacity-100 rotate-0 scale-100"
              }
            `}>
              <Sun size={18} className="text-amber-400" />
            </span>

            <span className={`
              absolute transition-all duration-300 transform
              ${resolvedTheme === "dark" 
                ? "opacity-100 rotate-0 scale-100" 
                : "opacity-0 -rotate-90 scale-50"
              }
            `}>
              <Moon size={18} className="text-[var(--accent)]" />
            </span>
          </button>

          {/* Notifications */}
          {user?.token && userId && (
            <NotificationBell token={user.token} userId={userId} />
          )}

          {/* Divider */}
          <div className="hidden md:block w-px h-8 bg-[var(--border)]" />

          {/* User Section */}
          <div className="flex items-center gap-3 pl-1">

            {/* User Info (Desktop) */}
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-xs md:text-sm font-black text-[var(--foreground)] uppercase">
                  {userName}
                </span>

                <span className="text-[8px] md:text-[10px] font-bold text-[var(--accent)] uppercase bg-[var(--accent)]/10 px-2 py-0.5 rounded-md border border-[var(--accent)]/30">
                  {userRole}
                </span>
              </div>

              <p className="text-[9px] md:text-[11px] text-[var(--foreground-muted)] uppercase mt-0.5 truncate max-w-[150px]">
                {userEmail}
              </p>
            </div>

            {/* Avatar */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] to-blue-600 rounded-xl opacity-20 group-hover:opacity-30 blur transition duration-500" />

              <div className="relative w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-[var(--background-secondary)] to-[var(--card-bg-solid)] flex items-center justify-center text-[var(--foreground)] shadow-lg border-2 border-[var(--border)] group-hover:scale-105 transition-transform duration-300">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <span className="text-sm md:text-lg font-black text-[var(--accent)]">
                    {userInitial}
                  </span>
                )}
              </div>
            </div>

            {/* Logout Button (Mobile) */}
            <button
              onClick={handleLogout}
              className="sm:hidden p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ===== MOBILE DRAWER OVERLAY ===== */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ animation: 'fadeIn 0.3s ease forwards' }}
          />
          
          {/* Sidebar Container */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-[var(--background)] shadow-2xl overflow-y-auto"
            style={{ animation: 'slideInLeft 0.3s ease forwards' }}
          >
            <Sidebar user={user} />
          </div>
        </div>
      )}

      {/* Styles pour les animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}