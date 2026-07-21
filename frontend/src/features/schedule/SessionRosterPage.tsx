// src/features/schedule/SessionRosterPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { toast } from "react-hot-toast";
import { clsx } from "clsx";
import { Button, Badge, Avatar, Skeleton, EmptyState } from "../../components/ui";
import {
  useGetSessionRosterQuery,
  useMarkSessionAttendanceMutation,
  useLogSessionPerformanceMutation,
  type RosterPlayer,
} from "../../store/api/scheduleApi";

const ATTENDANCE_OPTIONS: { value: "present" | "absent" | "late" | "excused"; label: string; color: string }[] = [
  { value: "present", label: "Present", color: "field" },
  { value: "late", label: "Late", color: "volt" },
  { value: "absent", label: "Absent", color: "ember" },
  { value: "excused", label: "Excused", color: "ice" },
];

type Tab = "attendance" | "performance";

const SessionRosterPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [tab, setTab] = useState<Tab>("attendance");

  const { data, isLoading, isError } = useGetSessionRosterQuery(sessionId ?? "", { skip: !sessionId });
  const [markAttendance, { isLoading: savingAttendance }] = useMarkSessionAttendanceMutation();
  const [logPerformance, { isLoading: savingPerformance }] = useLogSessionPerformanceMutation();

  const [attendancePending, setAttendancePending] = useState<Record<string, string>>({});
  const [scoresPending, setScoresPending] = useState<Record<string, Record<string, number>>>({});
  const [remarksPending, setRemarksPending] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data) return;
    // Seed pending performance scores for anyone not yet recorded, so the
    // sliders have sensible defaults instead of starting blank.
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

  if (!sessionId) return <Navigate to="/schedule" replace />;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={<CalendarDays size={28} />}
        title="Session not found"
        description="This session may have been removed."
        action={<Link to="/schedule" className="text-volt-400 hover:underline text-sm">← Back to Schedule</Link>}
      />
    );
  }

  const { session, roster, skillParameters } = data;
  const isCancelled = session.status === "cancelled";

  const setAttendanceStatus = (studentId: string, status: string) => {
    setAttendancePending((p) => ({ ...p, [studentId]: status }));
  };

  const getAttendanceStatus = (p: RosterPlayer) => attendancePending[p.studentId] ?? p.attendanceStatus ?? "";

  const markedCount = roster.filter((p) => getAttendanceStatus(p)).length;

  const handleSaveAttendance = async () => {
    const records = roster
      .filter((p) => getAttendanceStatus(p))
      .map((p) => ({ studentId: p.studentId, status: getAttendanceStatus(p) as any }));
    if (!records.length) {
      toast.error("Mark at least one student first");
      return;
    }
    try {
      await markAttendance({ id: sessionId, records }).unwrap();
      toast.success("Attendance saved");
      setAttendancePending({});
    } catch (err: any) {
      toast.error(err?.data?.message || "Couldn't save attendance — try again");
    }
  };

  const setScore = (studentId: string, parameter: string, value: number) => {
    setScoresPending((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] ?? Object.fromEntries(skillParameters.map((p) => [p, 7]))), [parameter]: value },
    }));
  };

  const scoredCount = roster.filter((p) => p.performanceRecorded || scoresPending[p.studentId]).length;

  const handleSavePerformance = async () => {
    const records = roster
      .filter((p) => scoresPending[p.studentId])
      .map((p) => ({
        studentId: p.studentId,
        skillScores: skillParameters.map((parameter) => ({
          parameter,
          score: scoresPending[p.studentId][parameter] ?? 7,
        })),
        remarks: remarksPending[p.studentId] || undefined,
      }));
    if (!records.length) {
      toast.error("Score at least one student first");
      return;
    }
    try {
      await logPerformance({ id: sessionId, records }).unwrap();
      toast.success("Performance logged");
    } catch (err: any) {
      toast.error(err?.data?.message || "Couldn't log performance — try again");
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/schedule" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={15} /> Back to Schedule
      </Link>

      {/* Session header */}
      <div className="card p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-extrabold text-white text-xl uppercase tracking-wide">
                {session.targetType === "category" ? (session.category ?? "Category") : (session.teamName ?? "Team")}
              </h1>
              <Badge variant="gray" size="sm">{session.type}</Badge>
              <Badge variant={session.status === "completed" ? "green" : session.status === "cancelled" ? "red" : "blue"} size="sm">
                {session.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1">
              {new Date(session.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              {" · "}{session.startTime}–{session.endTime}
              {" · "}{session.location}
            </p>
          </div>
        </div>
      </div>

      {isCancelled && (
        <EmptyState
          title="This session was cancelled"
          description="Attendance and performance can't be recorded for a cancelled session."
        />
      )}

      {!isCancelled && (
        <>
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-pitch-800 p-1 rounded border border-white/5 w-fit">
            {(["attendance", "performance"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx(
                  "px-4 py-1.5 rounded text-xs font-display font-bold uppercase tracking-wide transition-all duration-150",
                  tab === t ? "bg-volt-400 text-pitch-900" : "text-slate-500 hover:text-white",
                )}
              >
                {t === "attendance" ? "Attendance" : "Performance"}
              </button>
            ))}
          </div>

          {roster.length === 0 ? (
            <EmptyState title="No players on this team" description="Assign students to this team to take attendance." />
          ) : tab === "attendance" ? (
            <>
              <div className="card divide-y divide-white/5">
                {roster.map((p) => (
                  <div key={p.studentId} className="flex items-center justify-between gap-4 px-5 py-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${p.firstName} ${p.lastName}`} src={p.photo} size="sm" />
                      <div>
                        <p className="text-sm text-white font-medium">{p.firstName} {p.lastName}</p>
                        <p className="text-2xs text-slate-500">{p.position ?? "—"}{p.jerseyNumber ? ` · #${p.jerseyNumber}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ATTENDANCE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setAttendanceStatus(p.studentId, opt.value)}
                          className={
                            getAttendanceStatus(p) === opt.value
                              ? "px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide bg-volt-400 text-pitch-900"
                              : "px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide border border-white/10 text-slate-400 hover:border-white/30 hover:text-white transition-colors"
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">{markedCount} / {roster.length} marked</span>
                <Button loading={savingAttendance} onClick={handleSaveAttendance}>Save attendance</Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                {skillParameters.length === 0 && (
                  <EmptyState
                    title="No skill parameters configured"
                    description="Ask your academy manager to set up skill parameters before logging performance."
                  />
                )}
                {skillParameters.length > 0 && roster.map((p) => {
                  const scores = scoresPending[p.studentId] ?? Object.fromEntries(skillParameters.map((s) => [s, 7]));
                  return (
                    <div key={p.studentId} className="card p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={`${p.firstName} ${p.lastName}`} src={p.photo} size="sm" />
                          <p className="text-sm text-white font-medium">{p.firstName} {p.lastName}</p>
                        </div>
                        {p.performanceRecorded && !scoresPending[p.studentId] && (
                          <Badge variant="green" size="sm">Logged · {p.overallScore?.toFixed(1)}</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {skillParameters.map((param) => (
                          <div key={param}>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-slate-400">{param}</span>
                              <span className="font-mono text-volt-400">{scores[param]}/10</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={10}
                              value={scores[param]}
                              onChange={(e) => setScore(p.studentId, param, Number(e.target.value))}
                              className="w-full accent-[#ccff00]"
                            />
                          </div>
                        ))}
                      </div>
                      <textarea
                        value={remarksPending[p.studentId] ?? p.performanceRemarks ?? ""}
                        onChange={(e) => setRemarksPending((r) => ({ ...r, [p.studentId]: e.target.value }))}
                        placeholder="Session notes (optional)"
                        rows={2}
                        className="input mt-3 w-full resize-none"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">{scoredCount} / {roster.length} scored</span>
                <Button loading={savingPerformance} disabled={skillParameters.length === 0} onClick={handleSavePerformance}>Save performance</Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default SessionRosterPage;