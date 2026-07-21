// src/features/coach-portal/CoachStudentPanelPage.tsx
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CalendarCheck } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useGetStudentBasicQuery,
  useAddCoachRemarkMutation,
} from "../../store/api/coachPortalApi";
import { NoxSkeleton, NoxStatCard } from "../../components/portal-ui";

const CoachStudentPanelPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const studentId = id!;
  const { data: student, isLoading } = useGetStudentBasicQuery(studentId);

  const [note, setNote] = useState("");
  const [addRemark, { isLoading: savingRemark }] = useAddCoachRemarkMutation();

  const submitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    try {
      await addRemark({ studentId, text: note.trim() }).unwrap();
      toast.success("Note added");
      setNote("");
    } catch {
      toast.error("Couldn't add note — try again");
    }
  };

  return (
    <div>
      <Link
        to="/coach/dashboard"
        className="inline-flex items-center gap-2 text-sm text-nox-mid hover:text-nox-high transition-colors mb-6"
      >
        <ArrowLeft size={15} /> Back to dashboard
      </Link>

      {isLoading && <NoxSkeleton className="h-24 mb-8" />}

      {student && (
        <div className="nox-card p-6 mb-8 flex flex-wrap items-center gap-5 justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center justify-center w-14 h-14 rounded-full bg-core-400/[0.12] text-core-400 font-orbital font-semibold text-lg">
              {student.firstName.charAt(0)}
              {student.lastName.charAt(0)}
            </span>
            <div>
              <h1 className="font-orbital text-xl font-semibold text-nox-high">
                {student.firstName} {student.lastName}
              </h1>
              <p className="text-sm text-nox-mid mt-0.5">
                {student.position ?? "—"}
                {student.jerseyNumber ? ` · #${student.jerseyNumber}` : ""}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <NoxStatCard label="Attendance" value={`${student.attendancePercentage}%`} accent="ion" />
            <NoxStatCard label="Rating" value={student.overallRating?.toFixed(1) ?? "—"} accent="plasma" />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Attendance and performance now live entirely on the scheduled
            session's roster — they can't be recorded from here, since
            that would mean scoring a player outside of any real session. */}
        <div className="nox-card p-6 flex flex-col items-start">
          <div className="flex items-center gap-2 mb-3">
            <CalendarCheck size={18} className="text-core-400" />
            <h2 className="font-orbital text-base font-medium text-nox-high">Mark attendance & performance</h2>
          </div>
          <p className="text-sm text-nox-mid mb-5">
            Attendance and performance scores are recorded against a scheduled session, not from a
            player's profile — this keeps every record tied to a session that actually happened.
          </p>
          <Link to="/schedule" className="nox-btn-primary">
            Go to Schedule →
          </Link>
        </div>

        <form onSubmit={submitNote} className="nox-card p-6">
          <h2 className="font-orbital text-base font-medium text-nox-high mb-5">Add a note</h2>
          <p className="text-sm text-nox-mid mb-4">
            Visible to the guardian and student — for progress notes, behaviour or anything worth flagging.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Great improvement on first touch this week"
            rows={5}
            className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-nox-high placeholder:text-nox-low focus:outline-none focus:border-core-400/50 resize-none"
          />
          <button
            type="submit"
            disabled={savingRemark || !note.trim()}
            className="nox-btn-secondary mt-4 w-full"
          >
            {savingRemark ? "Saving…" : "Add note"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CoachStudentPanelPage;
