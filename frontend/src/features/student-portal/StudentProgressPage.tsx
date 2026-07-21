// src/features/student-portal/StudentProgressPage.tsx
import React, { useState } from "react";
import { CalendarCheck, Wallet, TrendingUp } from "lucide-react";
import {
  useGetMyAttendanceQuery,
  useGetMyFeesQuery,
  useGetMyPerformanceQuery,
} from "../../store/api/studentPortalApi";
import { NoxPageHeader, NoxSkeleton, NoxEmptyState, NoxStatusBadge, NoxStatCard } from "../../components/portal-ui";

type Tab = "attendance" | "fees" | "performance";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "fees", label: "Fees", icon: Wallet },
  { id: "performance", label: "Performance", icon: TrendingUp },
];

const StudentProgressPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>("attendance");

  return (
    <div>
      <NoxPageHeader eyebrow="Student portal" title="My progress" />

      <div className="flex gap-2 border-b border-white/[0.06] mb-6">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${
                active
                  ? "border-core-400 text-core-400"
                  : "border-transparent text-nox-mid hover:text-nox-high"
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "attendance" && <AttendanceTab />}
      {tab === "fees" && <FeesTab />}
      {tab === "performance" && <PerformanceTab />}
    </div>
  );
};

const AttendanceTab: React.FC = () => {
  const { data, isLoading } = useGetMyAttendanceQuery();

  if (isLoading) return <NoxSkeleton className="h-64" />;
  if (!data || data.records.length === 0) {
    return <NoxEmptyState title="No attendance records yet" body="Sessions will appear here once a coach marks them." />;
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <NoxStatCard label="Present" value={data.summary.present} accent="ion" />
        <NoxStatCard label="Absent" value={data.summary.absent} accent="core" />
        <NoxStatCard label="Late" value={data.summary.late} accent="plasma" />
        <NoxStatCard label="Rate" value={`${data.summary.percentage}%`} accent="ion" />
      </div>
      <div className="nox-card divide-y divide-white/[0.06]">
        {data.records.map((r) => (
          <div key={r._id} className="flex items-center justify-between px-5 py-4">
            <div>
              <div className="text-sm text-nox-high">
                {new Date(r.sessionDate).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              {r.remarks && <div className="text-xs text-nox-low mt-0.5">{r.remarks}</div>}
            </div>
            <NoxStatusBadge status={r.status} />
          </div>
        ))}
      </div>
    </div>
  );
};

const FeesTab: React.FC = () => {
  const { data, isLoading } = useGetMyFeesQuery();

  if (isLoading) return <NoxSkeleton className="h-64" />;
  if (!data || data.length === 0) {
    return <NoxEmptyState title="No fee records yet" body="Fee plans set up by your academy will appear here." />;
  }

  return (
    <div className="space-y-5">
      {data.map((fee) => (
        <div key={fee._id} className="nox-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-orbital text-sm font-medium text-nox-high capitalize">
                {fee.feeType.replace("_", " ")}
              </div>
              <div className="text-xs text-nox-low font-mono mt-0.5">
                ₹{fee.finalAmount.toLocaleString("en-IN")} total
              </div>
            </div>
            <NoxStatusBadge status={fee.overallStatus} />
          </div>
          <div className="space-y-2">
            {fee.installments.map((inst) => (
              <div
                key={inst.installmentNumber}
                className="flex items-center justify-between text-sm bg-white/[0.02] rounded-lg px-3 py-2.5"
              >
                <span className="text-nox-mid">
                  Installment {inst.installmentNumber} · due {new Date(inst.dueDate).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-nox-high font-mono">
                    ₹{inst.paidAmount.toLocaleString("en-IN")} / ₹{inst.amount.toLocaleString("en-IN")}
                  </span>
                  <NoxStatusBadge status={inst.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const PerformanceTab: React.FC = () => {
  const { data, isLoading } = useGetMyPerformanceQuery();

  if (isLoading) return <NoxSkeleton className="h-64" />;
  if (!data || (data.performance.length === 0 && data.remarks.length === 0)) {
    return (
      <NoxEmptyState
        title="No performance records yet"
        body="Assessments and coach notes will show up here as they're added."
      />
    );
  }

  return (
    <div className="space-y-6">
      {data.performance.length > 0 && (
        <div className="nox-card divide-y divide-white/[0.06]">
          {data.performance.map((p) => (
            <div key={p._id} className="px-5 py-4 flex items-center justify-between">
              <span className="text-sm text-nox-high">{new Date(p.createdAt).toLocaleDateString()}</span>
              {typeof p.overallRating === "number" && (
                <span className="font-orbital text-sm font-semibold text-core-400">
                  {p.overallRating.toFixed(1)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {data.remarks.length > 0 && (
        <div>
          <h3 className="font-orbital text-sm font-medium text-nox-high mb-3">Coach notes</h3>
          <div className="nox-card divide-y divide-white/[0.06]">
            {data.remarks.map((r) => (
              <div key={r._id} className="px-5 py-4">
                <div className="text-xs text-nox-low font-mono">{new Date(r.date).toLocaleDateString()}</div>
                <p className="text-sm text-nox-mid mt-1">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProgressPage;
