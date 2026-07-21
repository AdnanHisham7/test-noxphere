// src/features/students/StudentDetailPage.tsx
import React, { useRef, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { clsx } from "clsx";
import { Button, Badge, Avatar, Modal, Skeleton, EmptyState } from "../../components/ui";
import { toast } from "react-hot-toast";
import mannequinPng from "../../assets/players/mannequin.png";
import { PlayerPlaceholder } from "@/components/ui/PlayerPlaceholder";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "react-qr-code";
import { useGetPlayerCardQuery, useUpdateStudentPhotoMutation } from "../../store/api/studentsApi";
import { useListPlayerMutation } from "../../store/api/transferApi";
import { useUploadImageMutation } from "../../store/api/uploadApi";
import { Camera, Loader2 } from "lucide-react";

const getRatingColor = (r: number) =>
  r >= 9 ? "text-volt-400" : r >= 8 ? "text-field-400" : r >= 7 ? "text-ice-400" : "text-slate-400";

const attendanceColors: Record<string, string> = {
  present: "bg-field-400",
  absent: "bg-ember-400",
  late: "bg-volt-400",
  excused: "bg-ice-400",
};

const attendanceTextColors: Record<string, string> = {
  present: "text-field-400",
  absent: "text-ember-400",
  late: "text-volt-400",
  excused: "text-ice-400",
};

const StudentDetailPage: React.FC = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "performance" | "info">("overview");
  const [transferModal, setTransferModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: card, isLoading, isError } = useGetPlayerCardQuery(id ?? "", { skip: !id });
  const [listPlayer, { isLoading: listing }] = useListPlayerMutation();
  const [uploadImage, { isLoading: uploadingPhoto }] = useUploadImageMutation();
  const [updateStudentPhoto] = useUpdateStudentPhotoMutation();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (file: File | undefined) => {
    if (!file || !id) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Only JPEG, PNG, WEBP or GIF images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image is too large — the limit is 5MB");
      return;
    }
    try {
      const result = await uploadImage({ file, category: "player_photo" }).unwrap();
      await updateStudentPhoto({ id, photo: result.url }).unwrap();
      toast.success("Photo updated");
    } catch (err: any) {
      toast.error(err?.data?.message || "Couldn't update photo — try again");
    }
  };

  const tabs = ["overview", "attendance", "performance", "info"] as const;

  if (!id) return <Navigate to="/students" replace />;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (isError || !card) {
    return (
      <EmptyState
        title="Player not found"
        description="This player may have been removed, or you don't have access."
        action={<Link to="/students" className="text-volt-400 hover:underline text-sm">← Back to Squad</Link>}
      />
    );
  }

  const { student, performances, attendance, remarks } = card;

  // Aggregate skill scores across recent performances into a radar profile
  const skillTotals = new Map<string, { sum: number; count: number }>();
  for (const p of performances) {
    for (const s of p.skillScores) {
      const bucket = skillTotals.get(s.parameter) ?? { sum: 0, count: 0 };
      bucket.sum += s.score;
      bucket.count += 1;
      skillTotals.set(s.parameter, bucket);
    }
  }
  const skillScores = Array.from(skillTotals.entries()).map(([parameter, v]) => ({
    parameter,
    score: Math.round((v.sum / v.count) * 10) / 10,
  }));

  // Session history for the trend line, oldest → newest
  const sessionHistory = [...performances]
    .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime())
    .map((p) => ({
      session: new Date(p.sessionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      score: p.overallScore,
    }));

  const attendanceCounts = {
    present: attendance.filter((a) => a.status === "present").length,
    late: attendance.filter((a) => a.status === "late").length,
    absent: attendance.filter((a) => a.status === "absent").length,
    excused: attendance.filter((a) => a.status === "excused").length,
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    const toastId = toast.loading("Generating High-Res Card...");

    try {
      const pdf = new jsPDF("p", "px", [800, 1130]);
      const sections = cardRef.current.querySelectorAll(".card-page");

      for (let i = 0; i < sections.length; i++) {
        const canvas = await html2canvas(sections[i] as HTMLElement, {
          scale: 3,
          useCORS: true,
          backgroundColor: "#0f172a",
        });

        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`${student.firstName}_${student.lastName}_Card.pdf`);
      toast.success("Card Downloaded!", { id: toastId });
    } catch {
      toast.error("Failed to generate PDF", { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleListOnTransfer = async (price: number, note: string) => {
    try {
      await listPlayer({ studentId: student.id, data: { price, note: note || undefined } }).unwrap();
      toast.success("Player listed on Transfer Wall!");
      setTransferModal(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Couldn't list player — try again");
    }
  };

  const profileUrl = `${window.location.origin}/transfer-wall`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/students" className="hover:text-volt-400 transition-colors">Squad</Link>
        <span>›</span>
        <span className="text-white">{student.firstName} {student.lastName}</span>
      </div>

      {/* Hero section */}
      <div className="card overflow-hidden">
        <div className="h-1 bg-volt-400" />

        <div className="px-6 pt-6 pb-6 md:pt-0 md:pb-0">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* LEFT SIDE */}
            <div className="flex-1 min-w-0 order-2 lg:order-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="font-display font-900 text-white text-3xl uppercase leading-tight tracking-tight">
                    {student.firstName} {student.lastName}
                  </h1>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {student.position ?? "—"} · {student.ageGroup} · #{student.jerseyNumber ?? "—"}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant={student.selectionStatus === "selected" ? "green" : student.selectionStatus === "shortlisted" ? "blue" : "gray"}>
                      {student.selectionStatus.replace("_", " ")}
                    </Badge>
                    {student.transferStatus === "listed" && <Badge variant="blue">↔ On Transfer</Badge>}
                    {student.transferStatus === "sold" && <Badge variant="green">Transferred</Badge>}
                  </div>
                </div>
              </div>

              {/* Quick stat chips */}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span className="stat-badge text-field-400">✓ {student.attendancePercentage}% attendance</span>
                <span className="stat-badge text-slate-400">Enrolled {new Date(student.enrollmentDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-white/5">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={isDownloading ? <span className="animate-spin">🌀</span> : <span>📄</span>}
                  onClick={handleDownloadCard}
                  disabled={isDownloading}
                >
                  {isDownloading ? "Generating..." : "Download Card PDF"}
                </Button>

                {/* HIDDEN CARD TEMPLATE FOR PDF */}
                <div className="fixed left-[-9999px] top-0 bg-black">
                  <div ref={cardRef} className="w-[800px] font-display">
                    {/* FRONT OF CARD: ELITE PERFORMANCE VIEW */}
                    <div
                      className="card-page bg-[#050505] w-[800px] h-[1130px] relative overflow-hidden flex flex-col items-center border-[20px] border-volt-400 p-12"
                      style={{ pageBreakAfter: "always", breakAfter: "page" }}
                    >
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: "radial-gradient(#ccff00 0.5px, transparent 0.5px)", backgroundSize: "24px 24px" }}
                      />
                      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-volt-400/20 rounded-full blur-[120px]" />

                      <div className="z-20 w-full flex justify-between items-start mb-6">
                        <div className="bg-volt-400 h-12 px-6 flex items-center justify-center">
                          <span className="text-black font-black italic text-2xl leading-none relative top-[1px]">ELITE SERIES</span>
                        </div>
                        <div className="text-right">
                          <p className="text-volt-400 font-black text-6xl leading-none">{student.overallRating.toFixed(1)}</p>
                          <p className="text-white/50 text-lg uppercase tracking-widest font-thin mt-1">OVR Rating</p>
                        </div>
                      </div>

                      <div className="relative flex-1 flex items-center justify-center w-full">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[420px] font-900 text-white/[0.03] italic leading-none select-none">
                            {student.jerseyNumber ?? ""}
                          </span>
                        </div>
                        <div className="relative z-10 p-2">
                          <div className="absolute inset-0 border-2 border-volt-400/30 skew-x-[-3deg] scale-105" />
                          <div className="absolute inset-0 border border-volt-400 skew-x-[3deg] scale-100" />
                          <div className="relative bg-gradient-to-b from-white/5 to-transparent p-1 backdrop-blur-sm overflow-hidden">
                            <img
                              src={student.photo ?? mannequinPng}
                              className="h-[550px] relative z-10 drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] object-contain"
                              alt="Player"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="w-full z-20 text-center pb-10">
                        <h1 className="text-8xl font-900 text-white uppercase tracking-tighter leading-none mb-2">{student.lastName}</h1>
                        <p className="text-volt-400 font-900 text-3xl uppercase italic tracking-widest mb-6">{student.firstName}</p>
                        <div className="flex justify-center gap-16">
                          <div className="text-center">
                            <p className="text-white font-900 text-2xl uppercase italic">{student.position ?? "—"}</p>
                            <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.3em]">Position</p>
                          </div>
                          <div className="text-center">
                            <p className="text-white font-900 text-2xl uppercase italic">#{student.jerseyNumber ?? "—"}</p>
                            <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.3em]">Squad No</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BACK OF CARD: ANALYTICS VIEW */}
                    <div
                      className="card-page bg-[#0a0a0a] w-[800px] h-[1130px] relative overflow-hidden flex flex-col border-[20px] border-white/10 p-12"
                      style={{ pageBreakBefore: "always", breakBefore: "page" }}
                    >
                      <div className="flex justify-between items-end border-b-2 border-white/10 pb-8">
                        <div>
                          <h3 className="text-5xl text-white font-900 uppercase tracking-tighter leading-none">
                            Technical <span className="text-volt-400">Breakdown</span>
                          </h3>
                          <p className="text-white/30 font-bold uppercase tracking-[0.4em] mt-2 text-[10px]">
                            Verified Franchise Data • {new Date().getFullYear()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-volt-400 font-mono text-xl">ID-{student.id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>

                      <div className="mt-12 space-y-8">
                        {skillScores.length === 0 && (
                          <p className="text-white/30 text-lg italic">No performance data logged yet.</p>
                        )}
                        {skillScores.map((skill) => (
                          <div key={skill.parameter} className="group">
                            <div className="flex justify-between items-end mb-2">
                              <span className="text-white font-900 uppercase tracking-widest text-lg">{skill.parameter}</span>
                              <span className="text-volt-400 font-900 text-2xl italic">{Math.round(skill.score * 10)}</span>
                            </div>
                            <div className="h-4 bg-white/5 rounded-full overflow-hidden flex">
                              <div className="h-full bg-volt-400 shadow-[0_0_15px_rgba(204,255,0,0.5)]" style={{ width: `${skill.score * 10}%` }} />
                              <div className="h-full bg-white/10 flex-1" />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto grid grid-cols-12 gap-8 pt-12 border-t border-white/10">
                        <div className="col-span-8 grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-white/20 text-[10px] uppercase font-black tracking-widest mb-1">Guardian</p>
                            <p className="text-white font-bold text-lg">{student.guardian.name}</p>
                            <p className="text-volt-400 font-mono text-sm">{student.guardian.phone}</p>
                          </div>
                          <div>
                            <p className="text-white/20 text-[10px] uppercase font-black tracking-widest mb-1">Bio Metrics</p>
                            <p className="text-white font-bold text-lg">Group: {student.medicalInfo.bloodGroup ?? "N/A"}</p>
                            <p className="text-white/40 text-sm italic">{student.ageGroup} Division</p>
                          </div>
                        </div>
                        <div className="col-span-4 flex flex-col items-end">
                          <div className="bg-white p-2 rounded-xl">
                            <QRCode value={profileUrl} size={110} level="H" bgColor="#FFFFFF" fgColor="#000000" />
                          </div>
                          <p className="text-white/30 text-[9px] uppercase font-black mt-3 tracking-tighter text-right">
                            Scan for full digital history<br />and video highlights
                          </p>
                        </div>
                      </div>

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-10">
                        <p className="text-[8px] font-black uppercase tracking-[1em] text-white whitespace-nowrap">
                          AUTHENTIC SCOUT CARD
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {student.transferStatus !== "listed" && student.transferStatus !== "sold" && (
                  <Button size="sm" variant="secondary" icon={<span>↔</span>} onClick={() => setTransferModal(true)}>
                    List on Transfer Wall
                  </Button>
                )}

                <a href={`mailto:${student.guardian.email}`} className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-2">
                  <span>📨</span> Message Guardian
                </a>
              </div>
            </div>

            {/* CENTER IMAGE */}
            <div className="flex justify-center items-center order-1 lg:order-2 py-6">
              <div className="relative flex items-end justify-center w-40 h-52 sm:w-48 sm:h-60">
                {student.photo ? (
                  <img
                    src={student.photo}
                    alt={`${student.firstName} ${student.lastName}`}
                    className="h-full w-auto object-contain object-bottom relative z-10 select-none pointer-events-none border border-volt-400/20 rounded"
                  />
                ) : (
                  <PlayerPlaceholder
                    image={mannequinPng}
                    name={`${student.firstName} ${student.lastName}`}
                    number={student.jerseyNumber ?? 0}
                    nameTop="25%"
                    numberTop="35%"
                    nameSize="14px"
                    numberSize="80px"
                    nameWidth="72%"
                  />
                )}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-1 right-1 z-20 bg-pitch-900/90 hover:bg-volt-400 hover:text-pitch-900 text-white border border-white/10 rounded-full p-2 transition-colors disabled:opacity-60"
                  aria-label="Change photo"
                >
                  {uploadingPhoto ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0])}
                />
              </div>
            </div>

            {/* RIGHT SIDE RATING */}
            <div className="flex flex-col items-center lg:items-end justify-center order-3 text-center lg:text-right">
              <p className={clsx("font-display font-900 text-5xl sm:text-6xl tabular-nums", getRatingColor(student.overallRating))}>
                {student.overallRating.toFixed(1)}
              </p>
              <p className="text-2xs text-slate-500 mt-1 uppercase tracking-wide">Overall Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-pitch-800 p-1 rounded border border-white/5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-4 py-1.5 rounded text-xs font-display font-bold uppercase tracking-wide transition-all duration-150",
              activeTab === tab ? "bg-volt-400 text-pitch-900" : "text-slate-500 hover:text-white",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <p className="section-title mb-4">Skill Profile</p>
            {skillScores.length === 0 ? (
              <EmptyState title="No performance data yet" description="Skill scores appear once a coach logs a session." />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={skillScores}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="parameter" tick={{ fill: "#64748b", fontSize: 10 }} />
                    <Radar dataKey="score" stroke="#ccff00" fill="#ccff00" fillOpacity={0.08} strokeWidth={2} dot={{ fill: "#ccff00", r: 3, strokeWidth: 0 }} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {skillScores.map((s) => (
                    <div key={s.parameter} className="flex items-center gap-2">
                      <span className="text-2xs text-slate-500 w-24">{s.parameter}</span>
                      <div className="flex-1 h-1.5 bg-pitch-600 rounded-full overflow-hidden">
                        <div className="h-full bg-volt-400 transition-all duration-500" style={{ width: `${s.score * 10}%` }} />
                      </div>
                      <span className="font-display font-bold text-xs text-volt-400 w-6 text-right">{s.score}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="card p-5">
            <p className="section-title mb-4">Performance Trend</p>
            {sessionHistory.length === 0 ? (
              <EmptyState title="No sessions logged yet" description="Trend appears once performance is recorded." />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={sessionHistory}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="session" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1a1a24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 12 }} />
                  <Line type="monotone" dataKey="score" stroke="#ccff00" strokeWidth={2} dot={{ fill: "#ccff00", r: 4, strokeWidth: 0 }} activeDot={{ fill: "#ccff00", r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            )}

            <div className="mt-4 space-y-2">
              <p className="section-title">Recent Remarks</p>
              {remarks.length === 0 && <p className="text-xs text-slate-500">No coach remarks yet.</p>}
              {remarks.slice(0, 5).map((r) => (
                <div key={r._id} className="bg-pitch-700 rounded p-3 border-l-2 border-volt-400">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xs text-volt-400 font-semibold">
                      {r.coachId ? `${r.coachId.firstName} ${r.coachId.lastName}` : "Coach"}
                    </span>
                    <span className="text-2xs text-slate-600">
                      {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 italic">"{r.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Attendance tab */}
      {activeTab === "attendance" && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="section-title">Attendance History</p>
            <span className="font-display font-extrabold text-field-400 text-2xl">{student.attendancePercentage}%</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
            {[
              { label: "Present", value: attendanceCounts.present, color: "text-field-400" },
              { label: "Late", value: attendanceCounts.late, color: "text-volt-400" },
              { label: "Absent", value: attendanceCounts.absent, color: "text-ember-400" },
              { label: "Excused", value: attendanceCounts.excused, color: "text-ice-400" },
            ].map((s) => (
              <div key={s.label} className="card p-3 text-center">
                <p className={clsx("font-display font-900 text-2xl", s.color)}>{s.value}</p>
                <p className="text-2xs text-slate-500 uppercase tracking-wide mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {attendance.length === 0 ? (
            <EmptyState title="No attendance recorded yet" />
          ) : (
            <div className="space-y-2">
              {attendance.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-white/4">
                  <div className={clsx("w-2 h-2 rounded-full", attendanceColors[entry.status])} />
                  <span className="text-sm text-slate-300 flex-1">
                    {new Date(entry.sessionDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span className={clsx("text-xs font-semibold uppercase", attendanceTextColors[entry.status])}>
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Performance tab */}
      {activeTab === "performance" && (
        <div className="space-y-4">
          {performances.length === 0 ? (
            <EmptyState title="No sessions logged yet" description="Coaches can log performance from the coach portal." />
          ) : (
            [...performances]
              .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
              .map((session) => (
                <div key={session._id} className="card p-4 flex items-center justify-between">
                  <span className="text-sm text-slate-300">
                    {new Date(session.sessionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-1.5 bg-pitch-600 rounded-full overflow-hidden">
                      <div className="h-full bg-volt-400" style={{ width: `${(session.overallScore / 10) * 100}%` }} />
                    </div>
                    <span className="font-display font-extrabold text-volt-400 text-lg w-8 text-right">
                      {session.overallScore.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* Info tab */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Date of Birth", value: new Date(student.dateOfBirth).toLocaleDateString("en-IN") },
            { label: "Enrolled", value: new Date(student.enrollmentDate).toLocaleDateString("en-IN") },
            { label: "Blood Group", value: student.medicalInfo.bloodGroup || "Not on file" },
            { label: "Emergency Contact", value: `${student.medicalInfo.emergencyContactName} — ${student.medicalInfo.emergencyContactPhone}` },
            { label: "Guardian", value: student.guardian.name },
            { label: "Guardian Phone", value: student.guardian.phone },
            { label: "Guardian Email", value: student.guardian.email },
            { label: "Allergies", value: student.medicalInfo.allergies?.length ? student.medicalInfo.allergies.join(", ") : "None" },
            { label: "Medical Conditions", value: student.medicalInfo.medicalConditions?.length ? student.medicalInfo.medicalConditions.join(", ") : "None" },
            { label: "Jersey Size", value: student.jerseySize || "Not on file" },
          ].map((item) => (
            <div key={item.label} className="card p-4">
              <p className="section-title mb-1">{item.label}</p>
              <p className="text-sm text-slate-200">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Transfer Wall modal */}
      <TransferListingModal
        isOpen={transferModal}
        onClose={() => setTransferModal(false)}
        studentName={`${student.firstName} ${student.lastName}`}
        position={student.position}
        rating={student.overallRating}
        listing={listing}
        onSubmit={handleListOnTransfer}
      />
    </div>
  );
};

const TransferListingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  position?: string;
  rating: number;
  listing: boolean;
  onSubmit: (price: number, note: string) => void;
}> = ({ isOpen, onClose, studentName, position, rating, listing, onSubmit }) => {
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="List on Transfer Wall" size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-3 bg-pitch-700 rounded p-3">
          <Avatar name={studentName} size="md" />
          <div>
            <p className="font-display font-bold text-white">{studentName}</p>
            <p className="text-xs text-slate-500">{position ?? "—"} · Rating {rating.toFixed(1)}</p>
          </div>
        </div>
        <div>
          <label className="label">Transfer Price (₹)</label>
          <input type="number" className="input" placeholder="15000" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <label className="label">Coach Note (for buyers)</label>
          <textarea
            className="input min-h-20 resize-none"
            placeholder="Describe the player's strengths and achievements..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 p-3 bg-ice-400/5 border border-ice-400/15 rounded">
          <span className="text-ice-400 text-sm">↔</span>
          <p className="text-xs text-ice-400">This player will be visible on the public Transfer Wall portal</p>
        </div>
        <div className="flex gap-3">
          <Button
            className="flex-1"
            loading={listing}
            onClick={() => {
              const p = parseFloat(price);
              if (!p || p <= 0) {
                toast.error("Enter a valid transfer price");
                return;
              }
              onSubmit(p, note);
            }}
          >
            List on Transfer Wall
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
};

export default StudentDetailPage;