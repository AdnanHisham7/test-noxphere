// src/App.tsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider, useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";
import { store, RootState } from "./store";
import { MainLayout } from "./components/layout/MainLayout";
import { PortalLayout } from "./components/layout/PortalLayout";
import { Spinner } from "./components/ui";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import RoleProtectedRoute from "./components/layout/RoleProtectedRoute";
import { GUARDIAN_NAV_ITEMS } from "./features/guardian/guardianNav";
import { STUDENT_NAV_ITEMS } from "./features/student-portal/studentNav";

// Lazy loaded pages
const LandingPage = lazy(() => import("./features/landing/LandingPage"));
const LoginPage = lazy(() => import("./features/auth/LoginPage"));
const DashboardPage = lazy(() => import("./features/dashboard/DashboardPage"));
const StudentsPage = lazy(() => import("./features/students/StudentsPage"));
const StudentDetailPage = lazy(
  () => import("./features/students/StudentDetailPage"),
);
const TransferWallPage = lazy(
  () => import("./features/transfer-wall/TransferWallPage"),
);
const FeesPage = lazy(() => import("./features/fees/FeesPage"));
const TeamsPage = lazy(() => import("./features/teams/TeamsPage"));
const TeamManagePage = lazy(() => import("./features/teams/TeamManagePage"));
const ResourcesPage = lazy(() => import("./features/resources/ResourcesPage"));
const SelectionPage = lazy(() => import("@/features/selection/SelectionPage"));
const SchedulePage = lazy(() => import("./features/schedule/SchedulePage"));
const SessionRosterPage = lazy(() => import("./features/schedule/SessionRosterPage"));
const NotificationsPage = lazy(
  () => import("./features/notifications/NotificationsPage"),
);
const AcademiesManagement = lazy(
  () => import("./features/academies/AcademiesManagement"),
);
const UsersManagementPage = lazy(
  () => import("./features/users/UsersManagementPage"),
);
const FinancePage = lazy(() => import("./features/finance/FinancePage"));
const FranchiseManagementPage = lazy(
  () => import("./features/franchises/FranchiseManagementPage"),
);
const CoachesManagementPage = lazy(
  () => import("./features/coaches/CoachesManagementPage"),
);
const GuardianDashboardPage = lazy(
  () => import("./features/guardian/GuardianDashboardPage"),
);
const GuardianChildDetailPage = lazy(
  () => import("./features/guardian/GuardianChildDetailPage"),
);
const StudentDashboardPage = lazy(
  () => import("./features/student-portal/StudentDashboardPage"),
);
const StudentProgressPage = lazy(
  () => import("./features/student-portal/StudentProgressPage"),
);
const CoachDashboardPage = lazy(
  () => import("./features/coach-portal/CoachDashboardPage"),
);
const CoachStudentPanelPage = lazy(
  () => import("./features/coach-portal/CoachStudentPanelPage"),
);

const PageLoader = () => (
  <div className="min-h-screen bg-pitch-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 bg-volt-400 rounded flex items-center justify-center">
        <span className="font-display font-900 text-pitch-900 text-base">
          FC
        </span>
      </div>
      <Spinner size="md" />
    </div>
  </div>
);

const RoleAwareRedirect: React.FC = () => {
  const user = useSelector((s: RootState) => s.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "guardian") return <Navigate to="/guardian/dashboard" replace />;
  if (user.role === "student") return <Navigate to="/student/dashboard" replace />;
  if (user.role === "coach") return <Navigate to="/coach/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

const DashboardRouter: React.FC = () => {
  const user = useSelector((s: RootState) => s.auth.user);
  if (user?.role === "guardian") return <Navigate to="/guardian/dashboard" replace />;
  if (user?.role === "student") return <Navigate to="/student/dashboard" replace />;
  if (user?.role === "coach") return <Navigate to="/coach/dashboard" replace />;
  return <DashboardPage />;
};

const App: React.FC = () => (
  <Provider store={store}>
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1a1a24",
            color: "#e2e8f0",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "6px",
            fontSize: "13px",
          },
          success: {
            iconTheme: { primary: "#ccff00", secondary: "#0a0a0f" },
          },
          error: {
            iconTheme: { primary: "#ff6b35", secondary: "#0a0a0f" },
          },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/transfer-wall" element={<TransferWallPage />} />

          {/* Authenticated */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              {/* Everyone logged in */}
              <Route path="/dashboard" element={<DashboardRouter />} />
              <Route path="/notifications" element={<NotificationsPage />} />

              {/* Manager + Coach */}
              <Route
                element={
                  <RoleProtectedRoute allowedRoles={["manager", "coach"]} />
                }
              >
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/students/:id" element={<StudentDetailPage />} />

                <Route path="/selection" element={<SelectionPage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/schedule/:sessionId/roster" element={<SessionRosterPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
              </Route>

              {/* Coach only — same MainLayout shell/Sidebar as everyone else,
                  not a separate portal chrome */}
              <Route
                element={<RoleProtectedRoute allowedRoles={["coach"]} />}
              >
                <Route path="/coach/dashboard" element={<CoachDashboardPage />} />
                <Route path="/coach/students/:id" element={<CoachStudentPanelPage />} />
              </Route>

              {/* Manager only */}
              <Route
                element={<RoleProtectedRoute allowedRoles={["manager"]} />}
              >
                <Route path="/fees" element={<FeesPage />} />
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/teams/:id/manage" element={<TeamManagePage />} />
                <Route path="/coaches" element={<CoachesManagementPage />} />
              </Route>

              {/* Manager + Super Admin */}
              <Route
                element={
                  <RoleProtectedRoute allowedRoles={["manager", "super_admin"]} />
                }
              >
                <Route path="/franchises" element={<FranchiseManagementPage />} />
              </Route>

              {/* Super Admin only */}
              <Route
                element={<RoleProtectedRoute allowedRoles={["super_admin"]} />}
              >
                <Route path="/academies" element={<AcademiesManagement />} />
                <Route path="/users" element={<UsersManagementPage />} />
                <Route path="/finance" element={<FinancePage />} />
              </Route>
            </Route>
          </Route>

          {/* Guardian portal — separate shell, new design system */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleProtectedRoute allowedRoles={["guardian"]} />}>
              <Route
                element={<PortalLayout navItems={GUARDIAN_NAV_ITEMS} portalLabel="Guardian portal" />}
              >
                <Route path="/guardian/dashboard" element={<GuardianDashboardPage />} />
                <Route path="/guardian/children/:id" element={<GuardianChildDetailPage />} />
              </Route>
            </Route>
          </Route>

          {/* Student portal — same shell, own data only */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleProtectedRoute allowedRoles={["student"]} />}>
              <Route
                element={<PortalLayout navItems={STUDENT_NAV_ITEMS} portalLabel="Student portal" />}
              >
                <Route path="/student/dashboard" element={<StudentDashboardPage />} />
                <Route path="/student/progress" element={<StudentProgressPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<RoleAwareRedirect />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </Provider>
);

export default App;