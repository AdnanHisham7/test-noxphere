// src/features/students/StudentsPage.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { clsx } from "clsx";
import { Shuffle, Users, Trash2 } from "lucide-react";
import {
  Button,
  Input,
  Badge,
  Avatar,
  EmptyState,
  Modal,
  Skeleton,
  ImageUploadField,
} from "../../components/ui";
import { toast } from "react-hot-toast";
import mannequinPng from "../../assets/players/mannequin.png";
import { PlayerPlaceholder } from "@/components/ui/PlayerPlaceholder";
import { useCurrentFranchiseId } from "../../hooks/useCurrentFranchiseId";
import { useListTeamsQuery } from "../../store/api/teamsApi";
import {
  useGetStudentsQuery,
  useCreateStudentMutation,
  useDeleteStudentMutation,
  type Student,
  type SelectionStatus,
} from "../../store/api/studentsApi";

interface PlayerCardContentProps {
  student: Student;
  teamName: string;
  getRatingColor: (r: number) => string;
  selectionBadge: typeof selectionBadge;
}

const PlayerCardContent: React.FC<PlayerCardContentProps> = ({
  student,
  teamName,
  getRatingColor,
  selectionBadge,
}) => {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 z-10" />

      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-start justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-[0.5px] text-white/50 font-semibold">
            {student.position ?? "—"}
          </p>
          <h3 className="font-display font-black uppercase leading-none text-white text-base mt-1">
            {student.firstName}
            <br />
            {student.lastName}
          </h3>
        </div>

        <div className="text-right">
          <p className="text-[9px] text-white/40 uppercase tracking-wider">Rating</p>
          <div className={clsx("font-display text-3xl font-black leading-none", getRatingColor(student.overallRating))}>
            {student.overallRating.toFixed(1)}
          </div>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
        <span className="font-display font-black text-[110px] leading-none text-white/[0.06] select-none">
          {student.jerseyNumber ?? "—"}
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 p-2.5">
        <div className="mb-2">
          <div className="flex items-center justify-between text-[9px] mb-1">
            <span className="text-white/45 uppercase tracking-wider">Attendance</span>
            <span
              className={
                student.attendancePercentage >= 90
                  ? "text-field-400"
                  : student.attendancePercentage >= 75
                    ? "text-volt-400"
                    : "text-ember-400"
              }
            >
              {student.attendancePercentage}%
            </span>
          </div>
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className={clsx(
                "h-full rounded-full",
                student.attendancePercentage >= 90
                  ? "bg-field-400"
                  : student.attendancePercentage >= 75
                    ? "bg-volt-400"
                    : "bg-ember-400",
              )}
              style={{ width: `${student.attendancePercentage}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant={selectionBadge[student.selectionStatus].variant} size="sm">
            {selectionBadge[student.selectionStatus].label}
          </Badge>

          <div className="text-right">
            <p className="text-[9px] text-white/40 uppercase">Team</p>
            <p className="text-xs text-white font-medium">{teamName}</p>
          </div>
        </div>
      </div>

      {student.transferStatus === "listed" && (
        <div className="absolute top-2.5 right-2.5 z-30">
          <span className="pill-blue text-2xs">↔ LISTED</span>
        </div>
      )}
    </>
  );
};

const selectionBadge: Record<SelectionStatus, { label: string; variant: "green" | "blue" | "yellow" | "gray" | "red" }> = {
  selected: { label: "Selected", variant: "green" },
  shortlisted: { label: "Shortlisted", variant: "blue" },
  pending: { label: "Pending", variant: "gray" },
  on_hold: { label: "On Hold", variant: "yellow" },
  not_selected: { label: "Not Selected", variant: "red" },
  released: { label: "Released", variant: "gray" },
};

const getRatingColor = (r: number) =>
  r >= 9 ? "text-volt-400" : r >= 8 ? "text-field-400" : r >= 7 ? "text-ice-400" : "text-slate-400";

type ViewMode = "grid" | "list";

const emptyGuardian = { name: "", phone: "", email: "" };
const emptyMedical = { emergencyContactName: "", emergencyContactPhone: "", bloodGroup: "", allergies: "", medicalConditions: "" };

const StudentsPage: React.FC = () => {
  const franchiseId = useCurrentFranchiseId();
  const [search, setSearch] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterAge, setFilterAge] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showPhotoCards, setShowPhotoCards] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: teams } = useListTeamsQuery({ franchiseId: franchiseId ?? "" }, { skip: !franchiseId });
  const teamNameOf = (teamId?: string) => teams?.find((t) => t.id === teamId)?.name ?? "Unassigned";

  const { data, isLoading, isError } = useGetStudentsQuery(
    {
      franchiseId: franchiseId ?? "",
      search: search || undefined,
      teamId: filterTeam || undefined,
      ageGroup: filterAge || undefined,
      selectionStatus: filterStatus || undefined,
      limit: 100,
    },
    { skip: !franchiseId },
  );
  const students = data?.items ?? [];

  const [createStudent, { isLoading: creating }] = useCreateStudentMutation();
  const [deleteStudent] = useDeleteStudentMutation();

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from the franchise? This cannot be undone.`)) return;
    try {
      await deleteStudent(id).unwrap();
      toast.success("Player removed");
    } catch {
      toast.error("Couldn't remove player — try again");
    }
  };

  if (!franchiseId) {
    return (
      <EmptyState
        icon={<Users size={28} />}
        title="No franchise selected"
        description="Select a franchise from the top bar to manage its squad."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="section-title mb-1">Management</p>
          <h1 className="font-display font-extrabold text-white text-2xl uppercase tracking-tight">Squad</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isLoading ? "Loading…" : `${data?.total ?? 0} players enrolled`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" icon={<span>+</span>} onClick={() => setShowAddModal(true)}>
            Add Player
          </Button>
        </div>
      </div>

      {/* Filters + view toggle */}
      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<span className="text-xs">🔍</span>}
          />
        </div>
        <div className="min-w-32">
          <select className="input" value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)}>
            <option value="">All Teams</option>
            {(teams ?? []).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="min-w-32">
          <select className="input" value={filterAge} onChange={(e) => setFilterAge(e.target.value)}>
            <option value="">All Ages</option>
            {["U-13", "U-15", "U-17", "U-19", "U-21"].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="min-w-40">
          <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="selected">Selected</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="pending">Pending</option>
            <option value="on_hold">On Hold</option>
            <option value="not_selected">Not Selected</option>
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowPhotoCards((prev) => !prev)}
            className="h-10 w-10 flex items-center justify-center rounded-xl border border-white/10 bg-pitch-700 text-slate-300 hover:text-white hover:border-volt-400/30 hover:bg-pitch-600 transition-all duration-300"
            title={showPhotoCards ? "Show placeholder cards" : "Show player photos"}
          >
            <Shuffle className="h-4 w-4" />
          </button>

          <div className="flex items-center bg-pitch-700 rounded border border-white/10 overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={clsx("px-3 py-2 text-xs transition-colors", viewMode === "grid" ? "bg-volt-400 text-pitch-900 font-bold" : "text-slate-400 hover:text-white")}
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={clsx("px-3 py-2 text-xs transition-colors", viewMode === "list" ? "bg-volt-400 text-pitch-900 font-bold" : "text-slate-400 hover:text-white")}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {students.length} player{students.length !== 1 ? "s" : ""} found
        </p>
        {(search || filterTeam || filterAge || filterStatus) && (
          <button
            onClick={() => { setSearch(""); setFilterTeam(""); setFilterAge(""); setFilterStatus(""); }}
            className="text-xs text-volt-400 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="aspect-[2/3] rounded-3xl" />)}
        </div>
      )}

      {isError && <EmptyState title="Couldn't load the squad" description="Please try again shortly." />}

      {!isLoading && students.length === 0 && (
        <EmptyState
          icon="⚽"
          title="No players found"
          description={search || filterTeam || filterAge || filterStatus ? "Try adjusting your filters" : "Add your first player to get started"}
          action={!search && !filterTeam && !filterAge && !filterStatus ? <Button onClick={() => setShowAddModal(true)}>Add Player</Button> : undefined}
        />
      )}

      {/* Grid view */}
      {!isLoading && viewMode === "grid" && students.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
          {students.map((student) => (
            <Link
              key={student.id}
              to={`/students/${student.id}`}
              className="relative aspect-[2/3] [perspective:2000px] overflow-hidden rounded-3xl border border-white/5 bg-black group transition-all duration-300 hover:border-volt-400/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-volt-400/10"
            >
              <div
                className="relative h-full w-full [transform-style:preserve-3d] transition-transform duration-700"
                style={{ transform: showPhotoCards ? "rotateY(0deg)" : "rotateY(180deg)" }}
              >
                <div className="absolute inset-0 rounded-3xl overflow-hidden [backface-visibility:hidden]">
                  <div className="absolute inset-0">
                    {student.photo ? (
                      <img
                        src={student.photo}
                        alt={`${student.firstName} ${student.lastName}`}
                        className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <PlayerPlaceholder
                        image={mannequinPng}
                        name={`${student.firstName} ${student.lastName}`}
                        number={student.jerseyNumber ?? 0}
                        className="h-full w-full px-6 pb-14"
                        nameTop="28%"
                        numberTop="32%"
                        nameSize="11px"
                        numberSize="65px"
                        nameWidth="75%"
                      />
                    )}
                  </div>
                  <PlayerCardContent
                    student={student}
                    teamName={teamNameOf(student.teamId)}
                    getRatingColor={getRatingColor}
                    selectionBadge={selectionBadge}
                  />
                </div>

                <div className="absolute inset-0 rounded-3xl overflow-hidden [transform:rotateY(180deg)] [backface-visibility:hidden]">
                  <div className="absolute inset-0">
                    <PlayerPlaceholder
                      image={mannequinPng}
                      name={`${student.firstName} ${student.lastName}`}
                      number={student.jerseyNumber ?? 0}
                      className="h-full w-full px-6 pb-14"
                      nameTop="30%"
                      numberTop="36%"
                      nameSize="11px"
                      numberSize="65px"
                      nameWidth="75%"
                    />
                  </div>
                  <PlayerCardContent
                    student={student}
                    teamName={teamNameOf(student.teamId)}
                    getRatingColor={getRatingColor}
                    selectionBadge={selectionBadge}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* List view */}
      {!isLoading && viewMode === "list" && students.length > 0 && (
        <div className="card overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 section-title">Player</th>
                <th className="text-left px-4 py-3 section-title hidden sm:table-cell">Position</th>
                <th className="text-left px-4 py-3 section-title hidden md:table-cell">Team</th>
                <th className="text-center px-4 py-3 section-title">Rating</th>
                <th className="text-center px-4 py-3 section-title hidden lg:table-cell">Attendance</th>
                <th className="text-left px-4 py-3 section-title hidden xl:table-cell">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {students.map((student, i) => (
                <tr key={student.id} className={clsx("border-b border-white/4 hover:bg-white/2 transition-colors", i % 2 === 0 && "bg-white/1")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${student.firstName} ${student.lastName}`} src={student.photo} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-white">{student.firstName} {student.lastName}</p>
                        <p className="text-2xs text-slate-500">#{student.jerseyNumber ?? "—"} · {student.ageGroup}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400 hidden sm:table-cell">{student.position ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-400 hidden md:table-cell">{teamNameOf(student.teamId)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={clsx("font-display font-extrabold text-lg", getRatingColor(student.overallRating))}>
                      {student.overallRating.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <span className={student.attendancePercentage >= 90 ? "text-field-400 text-sm font-semibold" : student.attendancePercentage >= 75 ? "text-volt-400 text-sm font-semibold" : "text-ember-400 text-sm font-semibold"}>
                      {student.attendancePercentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <Badge variant={selectionBadge[student.selectionStatus].variant}>
                      {selectionBadge[student.selectionStatus].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link to={`/students/${student.id}`} className="text-xs text-volt-400 hover:underline">
                        View →
                      </Link>
                      <button
                        onClick={() => handleDelete(student.id, `${student.firstName} ${student.lastName}`)}
                        className="text-slate-500 hover:text-ember-400 transition-colors"
                        aria-label="Remove player"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Student Modal */}
      <AddPlayerModal
        franchiseId={franchiseId}
        teams={teams ?? []}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreate={async (body) => {
          try {
            await createStudent(body).unwrap();
            toast.success("Player enrolled! A guardian account has been created.");
            setShowAddModal(false);
          } catch (err: any) {
            toast.error(err?.data?.message || "Couldn't enroll player — try again");
          }
        }}
        creating={creating}
      />
    </div>
  );
};

const AddPlayerModal: React.FC<{
  franchiseId: string;
  teams: { id: string; name: string }[];
  isOpen: boolean;
  onClose: () => void;
  onCreate: (body: any) => void;
  creating: boolean;
}> = ({ franchiseId, teams, isOpen, onClose, onCreate, creating }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [ageGroup, setAgeGroup] = useState("U-13");
  const [position, setPosition] = useState("Forward");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [teamId, setTeamId] = useState("");
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [guardian, setGuardian] = useState(emptyGuardian);
  const [medical, setMedical] = useState(emptyMedical);

  const reset = () => {
    setFirstName(""); setLastName(""); setDob(""); setAgeGroup("U-13"); setPosition("Forward");
    setJerseyNumber(""); setTeamId(""); setPhoto(undefined); setGuardian(emptyGuardian); setMedical(emptyMedical);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !dob || !guardian.name || !guardian.phone || !guardian.email || !medical.emergencyContactName || !medical.emergencyContactPhone) {
      toast.error("Fill in all required fields");
      return;
    }
    onCreate({
      email: guardian.email,
      firstName,
      lastName,
      dateOfBirth: new Date(dob).toISOString(),
      ageGroup,
      franchiseId,
      teamId: teamId || undefined,
      jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : undefined,
      position,
      photo,
      guardian,
      medicalInfo: {
        bloodGroup: medical.bloodGroup || undefined,
        allergies: medical.allergies ? medical.allergies.split(",").map((s) => s.trim()).filter(Boolean) : [],
        medicalConditions: medical.medicalConditions ? medical.medicalConditions.split(",").map((s) => s.trim()).filter(Boolean) : [],
        emergencyContactName: medical.emergencyContactName,
        emergencyContactPhone: medical.emergencyContactPhone,
      },
    });
    reset();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enroll New Player" size="xl">
      <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-6">
        
        {/* Responsive Content Grid: Stacks on mobile, splits into 2 columns on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
          
          {/* COLUMN 1: Player info & Guardians */}
          <div className="space-y-4">
            <div>
              <p className="section-title mb-3 text-volt-400">Player Info</p>
              <ImageUploadField
                label="Player photo (optional)"
                category="player_photo"
                value={photo}
                onChange={setPhoto}
                shape="circle"
                helperText="Shown on the player's card throughout the app. Can be added later too."
              />
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Arjun" required />
                <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Mehta" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Date of Birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
              <div>
                <label className="label">Age Group</label>
                <select className="input w-full" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
                  {["U-13", "U-15", "U-17", "U-19", "U-21"].map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="label">Position</label>
                <select className="input w-full" value={position} onChange={(e) => setPosition(e.target.value)}>
                  {["Forward", "Midfielder", "Defender", "Goalkeeper"].map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <Input label="Jersey" type="number" min={1} max={99} value={jerseyNumber} onChange={(e) => setJerseyNumber(e.target.value)} placeholder="9" />
            </div>

            <div>
              <label className="label">Team (optional)</label>
              <select className="input w-full" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                <option value="">Assign later</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="border-t border-white/5 pt-4 mt-2">
              <p className="section-title mb-3 text-volt-400">Guardian Details</p>
              <div className="space-y-3">
                <Input label="Guardian Name" value={guardian.name} onChange={(e) => setGuardian({ ...guardian, name: e.target.value })} placeholder="Parent full name" required />
                <Input label="Guardian Phone" type="tel" value={guardian.phone} onChange={(e) => setGuardian({ ...guardian, phone: e.target.value })} placeholder="+91 9876543210" required />
                <div>
                  <Input label="Guardian Email" type="email" value={guardian.email} onChange={(e) => setGuardian({ ...guardian, email: e.target.value })} placeholder="parent@email.com" required />
                  <p className="text-[10px] text-slate-500 mt-1">A guardian portal login will be automatically generated.</p>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Emergency & Medical details */}
          <div className="space-y-4 md:border-l md:border-white/5 md:pl-6 h-full">
            <div>
              <p className="section-title mb-3 text-volt-400">Emergency & Medical</p>
              <div className="space-y-3">
                <Input label="Emergency Contact Name" value={medical.emergencyContactName} onChange={(e) => setMedical({ ...medical, emergencyContactName: e.target.value })} required />
                <Input label="Emergency Contact Phone" type="tel" value={medical.emergencyContactPhone} onChange={(e) => setMedical({ ...medical, emergencyContactPhone: e.target.value })} required />
                <Input label="Blood Group (optional)" value={medical.bloodGroup} onChange={(e) => setMedical({ ...medical, bloodGroup: e.target.value })} placeholder="O+" />
                <Input label="Allergies (comma separated)" value={medical.allergies} onChange={(e) => setMedical({ ...medical, allergies: e.target.value })} placeholder="Peanuts, Dust" />
                <Input label="Medical Conditions (comma separated)" value={medical.medicalConditions} onChange={(e) => setMedical({ ...medical, medicalConditions: e.target.value })} placeholder="Asthma" />
              </div>
            </div>
          </div>

        </div>

        {/* Fixed Footer Buttons Container */}
        <div className="flex flex-row gap-3 pt-4 border-t border-white/5 flex-shrink-0 justify-end">
          <Button type="button" variant="secondary" onClick={onClose} className="px-5">Cancel</Button>
          <Button type="submit" loading={creating} className="px-8 bg-volt-400 text-pitch-900 font-bold hover:bg-volt-300">Enroll Player</Button>
        </div>
      </form>
    </Modal>
  );
};

export default StudentsPage;