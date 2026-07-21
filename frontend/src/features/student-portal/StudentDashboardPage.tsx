// src/features/student-portal/StudentDashboardPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { CalendarCheck, TrendingUp, Wallet, MessageSquare } from "lucide-react";
import { RootState } from "../../store";
import { useGetMyDashboardQuery } from "../../store/api/studentPortalApi";
import { NoxPageHeader, NoxStatCard, NoxSkeleton, NoxEmptyState, NoxStatusBadge } from "../../components/portal-ui";

const StudentDashboardPage: React.FC = () => {
  const user = useSelector((s: RootState) => s.auth.user);
  const { data, isLoading, isError } = useGetMyDashboardQuery();

  return (
    <div>
      <NoxPageHeader
        eyebrow="Student portal"
        title={`Hey${user?.firstName ? `, ${user.firstName}` : ""}`}
        subtitle="Your attendance, fees and coach feedback, all in one place."
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
          title="No student record linked yet"
          body="Once your academy links this account to your student profile, your dashboard will show up here."
        />
      )}

      {data && (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <NoxStatCard
              label="Attendance"
              value={`${data.profile.attendancePercentage}%`}
              icon={<CalendarCheck size={18} />}
              accent="ion"
            />
            <NoxStatCard
              label="Rating"
              value={data.profile.overallRating?.toFixed(1) ?? "—"}
              icon={<TrendingUp size={18} />}
              accent="plasma"
            />
            <NoxStatCard
              label="Today"
              value={data.todayStatus ?? "Not marked"}
              icon={<Wallet size={18} />}
              accent="core"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="font-orbital text-lg font-medium text-nox-high mb-4">Fee reminders</h2>
              {[...data.overdueFees, ...data.upcomingFees].length === 0 ? (
                <NoxEmptyState title="You're all caught up" body="No pending fee installments right now." />
              ) : (
                <div className="nox-card divide-y divide-white/[0.06]">
                  {[...data.overdueFees, ...data.upcomingFees].map((f, i) => {
                    const isOverdue = data.overdueFees.includes(f);
                    return (
                      <div key={i} className="flex items-center justify-between px-5 py-4">
                        <div>
                          <div className="text-sm text-nox-high">Installment {f.installmentNumber}</div>
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
              )}
            </div>

            <div>
              <h2 className="font-orbital text-lg font-medium text-nox-high mb-4 flex items-center gap-2">
                <MessageSquare size={17} className="text-core-400" />
                Recent coach notes
              </h2>
              {data.recentRemarks.length === 0 ? (
                <NoxEmptyState title="No notes yet" body="Coach feedback will appear here as it's added." />
              ) : (
                <div className="nox-card divide-y divide-white/[0.06]">
                  {data.recentRemarks.map((r) => (
                    <div key={r._id} className="px-5 py-4">
                      <div className="text-xs text-nox-low font-mono">
                        {new Date(r.date).toLocaleDateString()}
                      </div>
                      <p className="text-sm text-nox-mid mt-1">{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <Link to="/student/progress" className="nox-btn-secondary">
              View full attendance &amp; performance
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentDashboardPage;
