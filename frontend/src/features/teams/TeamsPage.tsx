// src/features/teams/TeamsPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Trash2, Swords } from "lucide-react";
import { toast } from "react-hot-toast";
import { Card, Button, Input, Modal, Badge, Skeleton, EmptyState, ImageUploadField } from "../../components/ui";
import { useCurrentFranchiseId } from "../../hooks/useCurrentFranchiseId";
import {
  useListTeamsQuery,
  useCreateTeamMutation,
  useDeleteTeamMutation,
  useGetTeamByIdQuery,
  useUpdateTeamMutation,
  type Team,
} from "../../store/api/teamsApi";
import { useGetUsersQuery } from "../../store/api/usersApi";

const TeamsPage: React.FC = () => {
  const navigate = useNavigate();
  const franchiseId = useCurrentFranchiseId();
  const { data: teams, isLoading, isError } = useListTeamsQuery(
    { franchiseId: franchiseId ?? "" },
    { skip: !franchiseId },
  );
  const { data: coachesResult } = useGetUsersQuery(
    { roles: "coach", franchiseId: franchiseId ?? "", isActive: "true", limit: 100 },
    { skip: !franchiseId },
  );
  const coaches = coachesResult?.data ?? [];
  const [createTeam, { isLoading: creating }] = useCreateTeamMutation();
  const [updateTeam] = useUpdateTeamMutation();
  const [deleteTeam] = useDeleteTeamMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [coachId, setCoachId] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [bannerUrl, setBannerUrl] = useState<string | undefined>(undefined);
  const [primaryColor, setPrimaryColor] = useState("#1f2937");
  const [secondaryColor, setSecondaryColor] = useState("#334155");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [brandingTeamId, setBrandingTeamId] = useState<string | null>(null);

  const resetCreateForm = () => {
    setName(""); setAgeGroup(""); setCoachId("");
    setLogoUrl(undefined); setBannerUrl(undefined);
    setPrimaryColor("#1f2937"); setSecondaryColor("#334155");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!franchiseId || !name || !ageGroup) return;
    try {
      await createTeam({
        name,
        ageGroup,
        franchiseId,
        coachId: coachId || undefined,
        logoUrl,
        bannerUrl,
        primaryColor,
        secondaryColor,
      }).unwrap();
      toast.success("Team created");
      setShowCreate(false);
      resetCreateForm();
    } catch {
      toast.error("Couldn't create team — try again");
    }
  };

  const handleAssignCoach = async (teamId: string, newCoachId: string) => {
    try {
      await updateTeam({ id: teamId, body: { coachId: newCoachId || undefined } }).unwrap();
      toast.success(newCoachId ? "Coach assigned" : "Coach removed");
    } catch {
      toast.error("Couldn't update coach — try again");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTeam(id).unwrap();
      toast.success("Team removed");
    } catch {
      toast.error("Couldn't remove team — try again");
    }
  };

  if (!franchiseId) {
    return (
      <EmptyState
        icon={<Users size={28} />}
        title="No franchise selected"
        description="Select a franchise from the top bar to manage teams."
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wide">Teams</h1>
          <p className="text-sm text-slate-400 mt-1">Batches and squads for this franchise</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
          New team
        </Button>
      </div>

      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState icon={<Users size={28} />} title="Couldn't load teams" description="Please try again shortly." />
      )}

      {teams && teams.length === 0 && (
        <EmptyState
          icon={<Users size={28} />}
          title="No teams yet"
          description="Create your first team to start assigning students and coaches."
          action={<Button onClick={() => setShowCreate(true)}>Create a team</Button>}
        />
      )}

      {teams && teams.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Card key={team.id} className="p-0 flex flex-col overflow-hidden">
              <div
                className="h-14 w-full relative"
                style={{ backgroundImage: `linear-gradient(135deg, ${team.primaryColor ?? "#1f2937"}, ${team.secondaryColor ?? "#334155"})` }}
              >
                {team.bannerUrl && (
                  <img src={team.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
                )}
              </div>
              <div className="p-5 flex flex-col flex-1 -mt-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={`${team.name} logo`}
                        className="w-12 h-12 rounded-lg object-cover border-2 border-pitch-900 bg-pitch-900 shrink-0"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-pitch-900 shrink-0 flex items-center justify-center"
                        style={{ backgroundImage: `linear-gradient(135deg, ${team.primaryColor ?? "#1f2937"}, ${team.secondaryColor ?? "#334155"})` }}
                      >
                        <Users size={18} className="text-white/70" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-display font-bold text-white uppercase tracking-wide leading-tight">{team.name}</h3>
                      <Badge variant="blue">{team.ageGroup}</Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(team.id)}
                    className="text-slate-500 hover:text-ember-400 transition-colors p-1"
                    aria-label="Delete team"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <p className="text-sm text-slate-400 mt-3">
                  {team.coach ? `${team.coach.firstName} ${team.coach.lastName}` : "No coach assigned"}
                </p>
                <select
                  value={team.coach?._id ?? ""}
                  onChange={(e) => handleAssignCoach(team.id, e.target.value)}
                  className="input !w-full !text-xs mt-2"
                >
                  <option value="">No coach assigned</option>
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
                <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-slate-500 font-mono">{team.studentCount} students</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setBrandingTeamId(team.id)}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Edit branding
                    </button>
                    <button
                      onClick={() => setSelectedTeamId(team.id)}
                      className="text-xs text-volt-400 hover:text-volt-300 transition-colors"
                    >
                      View roster →
                    </button>
                    <button
                      onClick={() => team.studentCount >= 10 && navigate(`/teams/${team.id}/manage`)}
                      disabled={team.studentCount < 10}
                      title={team.studentCount < 10 ? "Needs at least 10 players to unlock" : "Open the tactics console"}
                      className="text-xs flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors disabled:text-slate-600 disabled:cursor-not-allowed"
                    >
                      <Swords size={12} /> Manage team
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New team" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Team name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. U-15 Eagles" required />
          <Input label="Age group" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} placeholder="e.g. U-15" required />
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Coach (optional)
            </label>
            <select value={coachId} onChange={(e) => setCoachId(e.target.value)} className="input !w-full">
              <option value="">Assign later</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ImageUploadField label="Team logo (optional)" category="team_logo" value={logoUrl} onChange={setLogoUrl} shape="square" />
            <ImageUploadField label="Team banner (optional)" category="team_banner" value={bannerUrl} onChange={setBannerUrl} shape="wide" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Team colors</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-9 h-9 bg-transparent border border-white/10 rounded cursor-pointer" />
                <span className="text-2xs font-mono text-slate-400">{primaryColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-9 h-9 bg-transparent border border-white/10 rounded cursor-pointer" />
                <span className="text-2xs font-mono text-slate-400">{secondaryColor}</span>
              </div>
              <div
                className="flex-1 h-9 rounded border border-white/10"
                style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              />
            </div>
            <p className="text-2xs text-slate-500 mt-1.5">Used as the gradient theme across this team's pages.</p>
          </div>

          <Button type="submit" loading={creating} className="w-full">
            Create team
          </Button>
        </form>
      </Modal>

      {selectedTeamId && (
        <TeamRosterModal teamId={selectedTeamId} onClose={() => setSelectedTeamId(null)} />
      )}

      {brandingTeamId && (
        <TeamBrandingModal
          team={teams?.find((t) => t.id === brandingTeamId) ?? null}
          onClose={() => setBrandingTeamId(null)}
        />
      )}
    </div>
  );
};

const TeamRosterModal: React.FC<{ teamId: string; onClose: () => void }> = ({ teamId, onClose }) => {
  const { data: team, isLoading } = useGetTeamByIdQuery(teamId);

  return (
    <Modal isOpen onClose={onClose} title={team?.name ?? "Team roster"} size="lg">
      {isLoading && <Skeleton className="h-40" />}
      {team && team.students.length === 0 && (
        <EmptyState title="No students on this team yet" description="Assign students to this team from the Students page." />
      )}
      {team && team.students.length > 0 && (
        <div className="space-y-2">
          {team.students.map((s) => (
            <div key={s._id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03]">
              <span className="text-sm text-white">
                {s.firstName} {s.lastName}
              </span>
              <span className="text-xs text-slate-500 font-mono">{s.attendancePercentage}% attendance</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default TeamsPage;

const TeamBrandingModal: React.FC<{ team: Team | null; onClose: () => void }> = ({ team, onClose }) => {
  const [updateTeam, { isLoading: saving }] = useUpdateTeamMutation();
  const [logoUrl, setLogoUrl] = useState(team?.logoUrl);
  const [bannerUrl, setBannerUrl] = useState(team?.bannerUrl);
  const [primaryColor, setPrimaryColor] = useState(team?.primaryColor ?? "#1f2937");
  const [secondaryColor, setSecondaryColor] = useState(team?.secondaryColor ?? "#334155");

  if (!team) return null;

  const handleSave = async () => {
    try {
      await updateTeam({ id: team.id, body: { logoUrl, bannerUrl, primaryColor, secondaryColor } }).unwrap();
      toast.success("Team branding updated");
      onClose();
    } catch {
      toast.error("Couldn't update branding — try again");
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Edit ${team.name} branding`} size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <ImageUploadField label="Team logo" category="team_logo" value={logoUrl} onChange={setLogoUrl} shape="square" />
          <ImageUploadField label="Team banner" category="team_banner" value={bannerUrl} onChange={setBannerUrl} shape="wide" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Team colors</label>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-9 h-9 bg-transparent border border-white/10 rounded cursor-pointer" />
              <span className="text-2xs font-mono text-slate-400">{primaryColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-9 h-9 bg-transparent border border-white/10 rounded cursor-pointer" />
              <span className="text-2xs font-mono text-slate-400">{secondaryColor}</span>
            </div>
            <div
              className="flex-1 h-9 rounded border border-white/10"
              style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            />
          </div>
        </div>
        <Button loading={saving} onClick={handleSave} className="w-full">Save branding</Button>
      </div>
    </Modal>
  );
};