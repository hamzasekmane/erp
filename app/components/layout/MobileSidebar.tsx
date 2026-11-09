"use client";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";

interface MobileSidebarProps {
  user?: {
    name: string;
    role: string;
    avatar?: string;
    id?: string;
    _id?: string;
  } | null;
}

export default function MobileSidebar({ user }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("mobile-sidebar-open");
    } else {
      document.body.style.overflow = "unset";
      document.body.classList.remove("mobile-sidebar-open");
    }

    return () => {
      document.body.style.overflow = "unset";
      document.body.classList.remove("mobile-sidebar-open");
    };
  }, [isOpen]);

  // Close sidebar on window resize (if screen becomes desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all shadow-sm"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] transition-opacity animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Sidebar Panel */}
          <div className="fixed top-0 left-0 h-full w-80 z-[101] bg-[var(--background)] shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            {/* Close Button */}
            <div className="sticky top-0 bg-[var(--background)] z-20 border-b border-[var(--border)] p-4 flex items-center justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-[var(--card-bg)] rounded-lg transition-colors group"
                aria-label="Close menu"
              >
                <X
                  size={20}
                  className="text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors"
                />
              </button>
            </div>

            {/* Sidebar Content - Without its own mobile button */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="relative">
                {/* Override the mobile button in the Sidebar component */}
                <style jsx global>{`
                  .lg\\:hidden.fixed.top-4.left-4 {
                    display: none !important;
                  }
                `}</style>
                <Sidebar user={user} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}