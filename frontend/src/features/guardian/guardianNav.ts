// src/features/guardian/guardianNav.ts
import { LayoutDashboard } from "lucide-react";
import type { PortalNavItem } from "../../components/layout/PortalLayout";

export const GUARDIAN_NAV_ITEMS: PortalNavItem[] = [
  { to: "/guardian/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
];
