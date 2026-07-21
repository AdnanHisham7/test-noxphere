// src/features/teams/TeamsPage.tsx
import React, { useState } from "react";
import { Plus, Users, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Card, Button, Input, Modal, Badge, Skeleton, EmptyState } from "../../components/ui";
import { useCurrentFranchiseId } from "../../hooks/useCurrentFranchiseId";
import {
  useListTeamsQuery,
  useCreateTeamMutation,
  useDeleteTeamMutation,
  useGetTeamByIdQuery,
  useUpdateTeamMutation,
} from "../../store/api/teamsApi";
import { useGetUsersQuery } from "../../store/api/usersApi";

const TeamsPage: React.FC = () => {
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
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!franchiseId || !name || !ageGroup) return;
    try {
      await createTeam({ name, ageGroup, franchiseId, coachId: coachId || undefined }).unwrap();
      toast.success("Team created");
      setShowCreate(false);
      setName("");
      setAgeGroup("");
      setCoachId("");
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
            <Card key={team.id} className="p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-bold text-white uppercase tracking-wide">{team.name}</h3>
                  <Badge variant="blue">{team.ageGroup}</Badge>
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
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">{team.studentCount} students</span>
                <button
                  onClick={() => setSelectedTeamId(team.id)}
                  className="text-xs text-volt-400 hover:text-volt-300 transition-colors"
                >
                  View roster →
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New team" size="sm">
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
          <Button type="submit" loading={creating} className="w-full">
            Create team
          </Button>
        </form>
      </Modal>

      {selectedTeamId && (
        <TeamRosterModal teamId={selectedTeamId} onClose={() => setSelectedTeamId(null)} />
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
