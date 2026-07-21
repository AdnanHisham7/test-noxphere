// src/features/performance/PerformancePage.tsx
import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { TrendingUp, CalendarCheck } from "lucide-react";
import { Card, Badge, Skeleton, EmptyState } from "../../components/ui";
import { useCurrentFranchiseId } from "../../hooks/useCurrentFranchiseId";
import { useListTeamsQuery } from "../../store/api/teamsApi";
import { useListPerformanceQuery } from "../../store/api/adminPerformanceApi";
import { useGetSessionsQuery } from "../../store/api/scheduleApi";

const PerformancePage: React.FC = () => {
  const franchiseId = useCurrentFranchiseId();
  const [searchParams] = useSearchParams();
  const { data: teams } = useListTeamsQuery({ franchiseId: franchiseId ?? "" }, { skip: !franchiseId });
  const [teamId, setTeamId] = useState<string>(searchParams.get("teamId") ?? "");

  const { data: sessions, isLoading: sessionsLoading } = useGetSessionsQuery(
    { franchiseId: franchiseId ?? "", teamId: teamId || undefined },
    { skip: !franchiseId },
  );
  const { data: records, isLoading, isError } = useListPerformanceQuery(
    { franchiseId: franchiseId ?? "", teamId: teamId || undefined },
    { skip: !franchiseId },
  );

  if (!franchiseId) {
    return (
      <EmptyState
        icon={<TrendingUp size={28} />}
        title="No franchise selected"
        description="Select a franchise from the top bar to view performance."
      />
    );
  }

  const nonCancelled = [...(sessions ?? [])]
    .filter((s) => s.status !== "cancelled")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wide">Performance</h1>
          <p className="text-sm text-slate-400 mt-1">Performance is logged against a scheduled session</p>
        </div>
        <select className="input !w-auto" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          <option value="">All teams</option>
          {(teams ?? []).map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Sessions to log */}
      <div>
        <p className="section-title mb-3">Recent sessions</p>
        {sessionsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : nonCancelled.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck size={28} />}
            title="No sessions scheduled"
            description="Schedule a session first — performance is logged against it."
            action={<Link to="/schedule" className="text-volt-400 hover:underline text-sm">Go to Schedule →</Link>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nonCancelled.map((s) => (
              <Link
                key={s.id}
                to={`/schedule/${s.id}/roster`}
                className="card p-4 hover:border-volt-400/30 transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display font-bold text-white uppercase tracking-wide text-sm">{s.teamName ?? "Team"}</p>
                  <Badge variant={s.status === "completed" ? "green" : "blue"} size="sm">{s.status}</Badge>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  {new Date(s.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <p className="section-title mb-3">Logged history</p>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded" />)}</div>
        ) : isError ? (
          <EmptyState title="Couldn't load performance history" />
        ) : !records?.length ? (
          <EmptyState title="No performance logged yet" description="Log performance from a scheduled session above." />
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-pitch-700/30">
                  <th className="text-left px-4 py-3 section-title">Player</th>
                  <th className="text-left px-4 py-3 section-title hidden sm:table-cell">Date</th>
                  <th className="text-center px-4 py-3 section-title">Score</th>
                  <th className="text-left px-4 py-3 section-title hidden md:table-cell">Coach</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r._id} className={i % 2 === 0 ? "" : "bg-white/1"}>
                    <td className="px-4 py-3 text-sm text-white">{r.studentId.firstName} {r.studentId.lastName}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden sm:table-cell">
                      {new Date(r.sessionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-4 py-3 text-center font-display font-bold text-volt-400">{r.overallScore.toFixed(1)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell">
                      {r.coachId ? `${r.coachId.firstName} ${r.coachId.lastName}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PerformancePage;
