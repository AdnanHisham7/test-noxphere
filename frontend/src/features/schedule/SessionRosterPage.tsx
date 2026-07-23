import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Save, Zap } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button, Badge, Avatar, Skeleton, EmptyState } from "../../components/ui";
import {
  useGetSessionRosterQuery,
  useMarkSessionAttendanceMutation,
  useLogSessionPerformanceMutation,
  type RosterPlayer,
} from "../../store/api/scheduleApi";

const ATTENDANCE_OPTIONS = [
  { value: "present", label: "P", fullLabel: "Present", activeBg: "bg-emerald-500 text-pitch-900 font-bold" },
  { value: "late", label: "L", fullLabel: "Late", activeBg: "bg-amber-400 text-pitch-900 font-bold" },
  { value: "absent", label: "A", fullLabel: "Absent", activeBg: "bg-ember-500 text-white font-bold" },
  { value: "excused", label: "E", fullLabel: "Excused", activeBg: "bg-ice-400 text-pitch-900 font-bold" },
] as const;

const SessionRosterPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();

  // 1. ALL HOOKS MUST BE DECLARED FIRST
  const { data, isLoading, isError } = useGetSessionRosterQuery(sessionId ?? "", { skip: !sessionId });
  const [markAttendance, { isLoading: savingAttendance }] = useMarkSessionAttendanceMutation();
  const [logPerformance, { isLoading: savingPerformance }] = useLogSessionPerformanceMutation();

  const [attendancePending, setAttendancePending] = useState<Record<string, string>>({});
  const [scoresPending, setScoresPending] = useState<Record<string, Record<string, number>>>({});
  const [remarksPending, setRemarksPending] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data) return;
    setScoresPending((prev) => {
      const next = { ...prev };
      for (const p of data.roster) {
        if (next[p.studentId]) continue;
        if (p.skillScores) {
          next[p.studentId] = Object.fromEntries(p.skillScores.map((s) => [s.parameter, s.score]));
        }
      }
      return next;
    });
  }, [data]);

  // Safe fallback arrays before checks
  const roster = data?.roster ?? [];
  const skillParameters = data?.skillParameters ?? [];

  // attendanceMetrics hook moved BEFORE any early returns
  const attendanceMetrics = useMemo(() => {
    let present = 0,
      late = 0,
      absent = 0,
      excused = 0,
      unmarked = 0;

    roster.forEach((p) => {
      const status = attendancePending[p.studentId] ?? p.attendanceStatus ?? "";
      if (status === "present") present++;
      else if (status === "late") late++;
      else if (status === "absent") absent++;
      else if (status === "excused") excused++;
      else unmarked++;
    });

    return { present, late, absent, excused, unmarked };
  }, [roster, attendancePending]);

  // Helper functions
  const getAttendanceStatus = (p: RosterPlayer) => attendancePending[p.studentId] ?? p.attendanceStatus ?? "";

  const setScore = (studentId: string, parameter: string, value: number) => {
    setScoresPending((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] ?? Object.fromEntries(skillParameters.map((p) => [p, 7]))),
        [parameter]: value,
      },
    }));
  };

  // Bulk operation: Mark all unmarked as Present
  const handleMarkAllPresent = () => {
    const updated = { ...attendancePending };
    roster.forEach((p) => {
      if (!getAttendanceStatus(p)) {
        updated[p.studentId] = "present";
      }
    });
    setAttendancePending(updated);
    toast.success("Marked all unmarked athletes as Present");
  };

  // Unified Save Workflow
  const handleSaveAll = async () => {
    if (!sessionId) return;
    try {
      // 1. Submit Attendance
      const attendanceRecords = roster
        .filter((p) => getAttendanceStatus(p))
        .map((p) => ({ studentId: p.studentId, status: getAttendanceStatus(p) as any }));

      if (attendanceRecords.length > 0) {
        await markAttendance({ id: sessionId, records: attendanceRecords }).unwrap();
      }

      // 2. Submit Performance Evaluation
      const performanceRecords = roster
        .filter((p) => scoresPending[p.studentId])
        .map((p) => ({
          studentId: p.studentId,
          skillScores: skillParameters.map((parameter) => ({
            parameter,
            score: scoresPending[p.studentId][parameter] ?? 7,
          })),
          remarks: remarksPending[p.studentId] || undefined,
        }));

      if (performanceRecords.length > 0) {
        await logPerformance({ id: sessionId, records: performanceRecords }).unwrap();
      }

      toast.success("Session roster and evaluations saved");
    } catch (err: any) {
      toast.error(err?.data?.message || "Couldn't save roster changes — try again");
    }
  };

  // 2. EARLY RETURNS ARE SAFELY PLACED NOW
  if (!sessionId) return <Navigate to="/schedule" replace />;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    console.log(isError, data);
    return (
      <EmptyState
        icon={<CalendarDays size={28} />}
        title="Session not found"
        description="This session may have been removed or relocated."
        action={
          <Link to="/schedule" className="text-volt-400 hover:underline text-xs">
            ← Return to Schedule
          </Link>
        }
      />
    );
  }

  const { session } = data;
  const isCancelled = session.status === "cancelled";

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <Link to="/schedule" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-2">
            <ArrowLeft size={14} /> Back to Schedule
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display font-bold text-xl text-white uppercase tracking-wide">
              {session.targetType === "category" ? (session.category ?? "Category") : (session.teamName ?? "Team")}
            </h1>
            <Badge variant="gray" size="sm">
              {session.type}
            </Badge>
            <Badge
              variant={session.status === "completed" ? "green" : session.status === "cancelled" ? "red" : "blue"}
              size="sm"
            >
              {session.status}
            </Badge>
          </div>
          <p className="text-2xs text-slate-400 font-mono mt-1">
            {new Date(session.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            {" · "}
            {session.startTime}–{session.endTime}
            {" · "}
            {session.location}
          </p>
        </div>

        {!isCancelled && (
          <Button
            loading={savingAttendance || savingPerformance}
            onClick={handleSaveAll}
            icon={<Save size={15} />}
            className="text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-pitch-900"
          >
            Save All Updates
          </Button>
        )}
      </div>

      {isCancelled ? (
        <EmptyState
          title="Session Cancelled"
          description="Attendance and skill evaluations are locked for cancelled operational sessions."
        />
      ) : roster.length === 0 ? (
        <EmptyState title="No athletes assigned" description="Assign players to this team to log roster operational data." />
      ) : (
        <>
          {/* Operational Metrics & Quick Actions Bar */}
          <div className="p-3.5 rounded-xl bg-pitch-800 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 font-mono">
              <span className="text-emerald-400">P: {attendanceMetrics.present}</span>
              <span className="text-amber-400">L: {attendanceMetrics.late}</span>
              <span className="text-ember-400">A: {attendanceMetrics.absent}</span>
              <span className="text-ice-400">E: {attendanceMetrics.excused}</span>
              <span className="text-slate-500">Unmarked: {attendanceMetrics.unmarked}</span>
            </div>

            <button
              onClick={handleMarkAllPresent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-volt-400/10 hover:bg-volt-400/20 text-volt-400 font-semibold border border-volt-400/20 transition-all text-xs"
            >
              <Zap size={14} /> Quick Mark Remaining Present
            </button>
          </div>

          {/* Unified Operational Grid */}
          <div className="rounded-xl border border-white/10 bg-pitch-800/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-pitch-900/80 border-b border-white/10 text-slate-400 font-mono uppercase text-2xs tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Athlete Details</th>
                    <th className="py-3 px-4">Attendance Status</th>
                    <th className="py-3 px-4">Skill Evaluations (0 - 10)</th>
                    <th className="py-3 px-4">Session Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {roster.map((player) => {
                    const currentStatus = getAttendanceStatus(player);
                    const scores = scoresPending[player.studentId] ?? Object.fromEntries(skillParameters.map((s) => [s, 7]));

                    return (
                      <tr key={player.studentId} className="hover:bg-white/[0.02] transition-colors">
                        {/* Player Identification */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar name={`${player.firstName} ${player.lastName}`} src={player.photo} size="sm" />
                            <div>
                              <p className="text-xs font-semibold text-white">
                                {player.firstName} {player.lastName}
                              </p>
                              <p className="text-2xs font-mono text-slate-500">
                                #{player.jerseyNumber || "N/A"} · {player.position || "Athlete"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* High-Touch Attendance Toggles */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="inline-flex rounded-lg bg-pitch-900 p-1 border border-white/10 gap-1">
                            {ATTENDANCE_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setAttendancePending((p) => ({ ...p, [player.studentId]: opt.value }))}
                                className={`w-7 h-7 rounded text-xs transition-all ${
                                  currentStatus === opt.value
                                    ? opt.activeBg
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                                }`}
                                title={opt.fullLabel}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </td>

                        {/* Skill Rating Chips */}
                        <td className="py-3.5 px-4">
                          {skillParameters.length === 0 ? (
                            <span className="text-2xs text-slate-500 italic">No skills configured</span>
                          ) : (
                            <div className="space-y-2">
                              {skillParameters.map((param) => (
                                <div key={param} className="flex items-center gap-2">
                                  <span className="w-24 text-2xs text-slate-400 truncate">{param}</span>
                                  <div className="flex items-center gap-1">
                                    {[5, 6, 7, 8, 9, 10].map((scoreVal) => (
                                      <button
                                        key={scoreVal}
                                        type="button"
                                        onClick={() => setScore(player.studentId, param, scoreVal)}
                                        className={`w-6 h-6 rounded text-2xs font-mono transition-all ${
                                          scores[param] === scoreVal
                                            ? "bg-volt-400 text-pitch-900 font-bold"
                                            : "bg-pitch-900 text-slate-400 hover:bg-white/10"
                                        }`}
                                      >
                                        {scoreVal}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Operational Remarks */}
                        <td className="py-3.5 px-4">
                          <textarea
                            value={remarksPending[player.studentId] ?? player.performanceRemarks ?? ""}
                            onChange={(e) =>
                              setRemarksPending((r) => ({ ...r, [player.studentId]: e.target.value }))
                            }
                            placeholder="Session notes..."
                            rows={1}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-pitch-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-volt-400 resize-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SessionRosterPage;