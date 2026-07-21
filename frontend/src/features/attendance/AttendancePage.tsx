// src/features/attendance/AttendancePage.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Users } from "lucide-react";
import { Badge, Skeleton, EmptyState } from "../../components/ui";
import { useCurrentFranchiseId } from "../../hooks/useCurrentFranchiseId";
import { useListTeamsQuery } from "../../store/api/teamsApi";
import { useGetSessionsQuery } from "../../store/api/scheduleApi";

const AttendancePage: React.FC = () => {
  const franchiseId = useCurrentFranchiseId();
  const [teamId, setTeamId] = useState("");

  const { data: teams } = useListTeamsQuery({ franchiseId: franchiseId ?? "" }, { skip: !franchiseId });
  const { data: sessions, isLoading, isError } = useGetSessionsQuery(
    { franchiseId: franchiseId ?? "", teamId: teamId || undefined },
    { skip: !franchiseId },
  );

  if (!franchiseId) {
    return (
      <EmptyState
        icon={<Users size={28} />}
        title="No franchise selected"
        description="Select a franchise from the top bar to manage attendance."
      />
    );
  }

  const nonCancelled = (sessions ?? []).filter((s) => s.status !== "cancelled");
  const sorted = [...nonCancelled].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wide">Attendance</h1>
          <p className="text-sm text-slate-400 mt-1">
            Attendance can only be marked against a scheduled session — pick one below
          </p>
        </div>
        <select className="input !w-auto" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          <option value="">All teams</option>
          {(teams ?? []).map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      )}

      {isError && <EmptyState title="Couldn't load sessions" description="Please try again shortly." />}

      {!isLoading && sorted.length === 0 && (
        <EmptyState
          icon={<CalendarCheck size={28} />}
          title="No sessions scheduled"
          description="Schedule a training session or match first — attendance is marked against it."
          action={<Link to="/schedule" className="text-volt-400 hover:underline text-sm">Go to Schedule →</Link>}
        />
      )}

      {!isLoading && sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((s) => (
            <Link
              key={s.id}
              to={`/schedule/${s.id}/roster`}
              className="card p-4 flex items-center justify-between hover:border-volt-400/30 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display font-bold text-white uppercase tracking-wide text-sm">{s.teamName ?? "Team"}</p>
                  <Badge variant="gray" size="sm">{s.type}</Badge>
                  <Badge variant={s.status === "completed" ? "green" : "blue"} size="sm">
                    {s.status === "completed" ? "Marked" : "Not marked"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  {new Date(s.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                  {" · "}{s.startTime}–{s.endTime}{" · "}{s.location}
                </p>
              </div>
              <span className="text-xs text-volt-400">Mark →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
