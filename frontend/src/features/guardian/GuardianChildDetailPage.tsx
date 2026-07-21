// src/features/guardian/GuardianChildDetailPage.tsx
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CalendarCheck, Wallet, TrendingUp } from "lucide-react";
import {
  useGetChildProfileQuery,
  useGetChildAttendanceQuery,
  useGetChildFeesQuery,
  useGetChildPerformanceQuery,
} from "../../store/api/guardianApi";
import { NoxSkeleton, NoxEmptyState, NoxStatusBadge, NoxStatCard } from "../../components/portal-ui";

type Tab = "attendance" | "fees" | "performance";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "fees", label: "Fees", icon: Wallet },
  { id: "performance", label: "Performance", icon: TrendingUp },
];

const GuardianChildDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const studentId = id!;
  const [tab, setTab] = useState<Tab>("attendance");

  const { data: profile, isLoading: profileLoading } = useGetChildProfileQuery(studentId);

  return (
    <div>
      <Link
        to="/guardian/dashboard"
        className="inline-flex items-center gap-2 text-sm text-nox-mid hover:text-nox-high transition-colors mb-6"
      >
        <ArrowLeft size={15} /> Back to dashboard
      </Link>

      {profileLoading && <NoxSkeleton className="h-24 mb-8" />}

      {profile && (
        <div className="nox-card p-6 mb-8 flex flex-wrap items-center gap-5 justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center justify-center w-14 h-14 rounded-full bg-core-400/[0.12] text-core-400 font-orbital font-semibold text-lg">
              {profile.firstName.charAt(0)}
              {profile.lastName.charAt(0)}
            </span>
            <div>
              <h1 className="font-orbital text-xl font-semibold text-nox-high">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-sm text-nox-mid mt-0.5">
                {profile.teamId?.name ?? profile.ageGroup}
                {profile.position ? ` · ${profile.position}` : ""}
                {profile.jerseyNumber ? ` · #${profile.jerseyNumber}` : ""}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <NoxStatCard label="Attendance" value={`${profile.attendancePercentage}%`} accent="ion" />
            <NoxStatCard label="Rating" value={profile.overallRating?.toFixed(1) ?? "—"} accent="plasma" />
          </div>
        </div>
      )}

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

      {tab === "attendance" && <AttendanceTab studentId={studentId} />}
      {tab === "fees" && <FeesTab studentId={studentId} />}
      {tab === "performance" && <PerformanceTab studentId={studentId} />}
    </div>
  );
};

const AttendanceTab: React.FC<{ studentId: string }> = ({ studentId }) => {
  const { data, isLoading } = useGetChildAttendanceQuery({ studentId });

  if (isLoading) return <NoxSkeleton className="h-64" />;
  if (!data || data.records.length === 0) {
    return (
      <NoxEmptyState title="No attendance records yet" body="Sessions will appear here once marked by a coach." />
    );
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

const FeesTab: React.FC<{ studentId: string }> = ({ studentId }) => {
  const { data, isLoading } = useGetChildFeesQuery(studentId);

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
                  Installment {inst.installmentNumber} · due{" "}
                  {new Date(inst.dueDate).toLocaleDateString()}
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

const PerformanceTab: React.FC<{ studentId: string }> = ({ studentId }) => {
  const { data, isLoading } = useGetChildPerformanceQuery(studentId);

  if (isLoading) return <NoxSkeleton className="h-64" />;
  if (!data || data.length === 0) {
    return (
      <NoxEmptyState
        title="No performance records yet"
        body="Coach assessments and session notes will show up here as they're added."
      />
    );
  }

  return (
    <div className="nox-card divide-y divide-white/[0.06]">
      {data.map((p) => (
        <div key={p._id} className="px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-nox-high">
              {new Date(p.createdAt).toLocaleDateString()}
            </span>
            {typeof p.overallRating === "number" && (
              <span className="font-orbital text-sm font-semibold text-core-400">
                {p.overallRating.toFixed(1)}
              </span>
            )}
          </div>
          {p.notes && <p className="text-xs text-nox-mid mt-1.5">{String(p.notes)}</p>}
        </div>
      ))}
    </div>
  );
};

export default GuardianChildDetailPage;
