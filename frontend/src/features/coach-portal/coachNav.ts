// src/features/coach-portal/coachNav.ts
import { LayoutDashboard } from "lucide-react";
import type { PortalNavItem } from "../../components/layout/PortalLayout";

export const COACH_NAV_ITEMS: PortalNavItem[] = [
  { to: "/coach/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
];
