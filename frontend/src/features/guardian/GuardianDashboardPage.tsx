// src/features/guardian/GuardianDashboardPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Users, CheckCircle2, AlertTriangle, Wallet } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useGetGuardianDashboardQuery } from "../../store/api/guardianApi";
import { NoxPageHeader, NoxStatCard, NoxSkeleton, NoxEmptyState, NoxStatusBadge } from "../../components/portal-ui";

const GuardianDashboardPage: React.FC = () => {
  const user = useSelector((s: RootState) => s.auth.user);
  const { data, isLoading, isError } = useGetGuardianDashboardQuery();

  const attendanceByStudent = new Map((data?.todayAttendance ?? []).map((a) => [a.studentId, a.status]));

  return (
    <div>
      <NoxPageHeader
        eyebrow="Guardian portal"
        title={`Welcome back${user?.firstName ? `, ${user.firstName}` : ""}`}
        subtitle="Here's how things are looking today."
      />

      {isLoading && (
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <NoxSkeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {isError && (
        <NoxEmptyState
          title="Couldn't load your dashboard"
          body="Please refresh the page, or try again shortly."
        />
      )}

      {data && (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <NoxStatCard label="Children" value={data.children.length} icon={<Users size={18} />} accent="ion" />
            <NoxStatCard
              label="Overdue fees"
              value={data.overdueFees.length}
              icon={<AlertTriangle size={18} />}
              accent={data.overdueFees.length ? "core" : "ion"}
            />
            <NoxStatCard
              label="Due within 14 days"
              value={data.upcomingFees.length}
              icon={<Wallet size={18} />}
              accent="plasma"
            />
          </div>

          {data.children.length === 0 ? (
            <NoxEmptyState
              title="No children linked yet"
              body="Once your academy links a student to your account, they'll show up here."
              icon={<Users size={28} />}
            />
          ) : (
            <>
              <h2 className="font-orbital text-lg font-medium text-nox-high mb-4">Your children</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {data.children.map((child) => {
                  const todayStatus = attendanceByStudent.get(child.id);
                  return (
                    <Link
                      key={child.id}
                      to={`/guardian/children/${child.id}`}
                      className="nox-card p-5 block hover:border-core-400/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-11 h-11 rounded-full bg-core-400/[0.12] text-core-400 font-orbital font-semibold">
                          {child.firstName.charAt(0)}
                          {child.lastName.charAt(0)}
                        </span>
                        <div>
                          <div className="font-orbital text-sm font-medium text-nox-high">
                            {child.firstName} {child.lastName}
                          </div>
                          <div className="text-[11px] text-nox-low font-mono">
                            {child.attendancePercentage}% attendance
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-nox-mid">Today</span>
                        {todayStatus ? (
                          <NoxStatusBadge status={todayStatus} />
                        ) : (
                          <span className="text-xs text-nox-low font-mono">Not marked</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {(data.overdueFees.length > 0 || data.upcomingFees.length > 0) && (
            <div>
              <h2 className="font-orbital text-lg font-medium text-nox-high mb-4 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-core-400" />
                Fee reminders
              </h2>
              <div className="nox-card divide-y divide-white/[0.06]">
                {[...data.overdueFees, ...data.upcomingFees].map((f, i) => {
                  const child = data.children.find((c) => c.id === f.studentId);
                  const isOverdue = data.overdueFees.includes(f);
                  return (
                    <div key={i} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <div className="text-sm text-nox-high">
                          {child ? `${child.firstName} ${child.lastName}` : "Student"} — installment{" "}
                          {f.installmentNumber}
                        </div>
                        <div className="text-xs text-nox-low font-mono mt-0.5">
                          Due {new Date(f.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-orbital text-sm font-semibold text-nox-high">
                          ₹{f.amount.toLocaleString("en-IN")}
                        </div>
                        <NoxStatusBadge status={isOverdue ? "overdue" : "pending"} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GuardianDashboardPage;
