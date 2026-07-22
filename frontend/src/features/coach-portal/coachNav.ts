// src/features/coach-portal/coachNav.ts
import { LayoutDashboard, Shirt, Target, CalendarClock, FolderOpen, Bell } from "lucide-react";
import type { PortalNavItem } from "../../components/layout/PortalLayout";

export const COACH_NAV_ITEMS: PortalNavItem[] = [
  { to: "/coach/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/students", label: "Squad", icon: Shirt },
  { to: "/selection", label: "Selection", icon: Target },
  { to: "/schedule", label: "Sessions", icon: CalendarClock },
  { to: "/resources", label: "Resources", icon: FolderOpen },
  { to: "/notifications", label: "Alerts", icon: Bell },
];