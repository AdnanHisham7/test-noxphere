// src/components/layout/PortalLayout.tsx
import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { RootState } from "../../store";
import { clearCredentials } from "../../store/slices/authSlice";

export interface PortalNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface PortalLayoutProps {
  navItems: PortalNavItem[];
  portalLabel: string;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ navItems, portalLabel }) => {
  const user = useSelector((s: RootState) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(clearCredentials());
    navigate("/login", { replace: true });
  };

  const initials = user ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}` : "";

  return (
    <div className="nox-landing min-h-screen flex">
      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 py-3 bg-ink-950/95 backdrop-blur border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-orbit-cta">
            <span className="absolute inset-0 rounded-full border border-white/30" />
          </span>
          <span className="font-orbital font-semibold text-nox-high">Noxphere</span>
        </div>
        <button onClick={() => setMobileOpen((v) => !v)} className="text-nox-mid p-2">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 w-64 flex-shrink-0 border-r border-white/[0.06] bg-ink-900 flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="hidden md:flex items-center gap-2 px-6 py-6">
          <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-orbit-cta shadow-core-glow">
            <span className="absolute inset-0 rounded-full border border-white/30" />
          </span>
          <div>
            <div className="font-orbital font-semibold text-nox-high leading-tight">Noxphere</div>
            <div className="text-[10px] font-mono uppercase tracking-wide text-nox-low">{portalLabel}</div>
          </div>
        </div>

        <nav className="flex-1 px-3 mt-4 md:mt-0 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    isActive
                      ? "bg-core-400/[0.1] text-core-400 border border-core-400/20"
                      : "text-nox-mid hover:text-nox-high hover:bg-white/[0.03] border border-transparent"
                  }`
                }
              >
                <Icon size={17} strokeWidth={1.75} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/[0.06] flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-ion-400/15 text-ion-300 font-orbital text-xs font-semibold">
            {initials || "?"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-nox-high truncate">
              {user ? `${user.firstName} ${user.lastName}` : ""}
            </div>
            <div className="text-[11px] text-nox-low capitalize">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Sign out"
            className="text-nox-low hover:text-nox-high transition-colors p-1.5"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Content */}
      <main className="flex-1 min-w-0 pt-16 md:pt-0">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default PortalLayout;
