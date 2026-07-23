// src/features/coaches/CoachesManagementPage.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { clsx } from "clsx";
import { UserCog, Plus, KeyRound, Power, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button, Input, Badge, Avatar, Modal, Skeleton, EmptyState } from "../../components/ui";
import { useCurrentFranchiseId } from "../../hooks/useCurrentFranchiseId";
import { useListTeamsQuery } from "../../store/api/teamsApi";
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useToggleUserActiveMutation,
  useResetUserPasswordMutation,
} from "../../store/api/usersApi";

const CoachesManagementPage: React.FC = () => {
  const franchiseId = useCurrentFranchiseId();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [passwordModal, setPasswordModal] = useState<{ id: string; name: string } | null>(null);

  const { data: coachesResult, isLoading, isError } = useGetUsersQuery(
    { roles: "coach", franchiseId: franchiseId ?? "", search: search || undefined, limit: 100 },
    { skip: !franchiseId },
  );
  const coaches = coachesResult?.data ?? [];

  const { data: teams } = useListTeamsQuery({ franchiseId: franchiseId ?? "" }, { skip: !franchiseId });
  const teamsByCoach = new Map<string, string[]>();
  for (const t of teams ?? []) {
    if (!t.coach?._id) continue;
    const list = teamsByCoach.get(t.coach._id) ?? [];
    list.push(t.name);
    teamsByCoach.set(t.coach._id, list);
  }

  const [createCoach, { isLoading: creating }] = useCreateUserMutation();
  const [toggleActive] = useToggleUserActiveMutation();
  const [resetPassword, { isLoading: resetting }] = useResetUserPasswordMutation();

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleActive(id).unwrap();
      toast.success(isActive ? "Coach deactivated" : "Coach activated");
    } catch {
      toast.error("Couldn't update coach — try again");
    }
  };

  if (!franchiseId) {
    return (
      <EmptyState
        icon={<UserCog size={28} />}
        title="No franchise selected"
        description="Select a franchise from the top bar to manage coaches."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="section-title mb-1">Staff</p>
          <h1 className="font-display font-extrabold text-white text-2xl uppercase tracking-tight">Coaches</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isLoading ? "Loading…" : `${coachesResult?.total ?? 0} coaches in this franchise`}
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>New coach</Button>
      </div>

      <div className="card p-4">
        <Input
          placeholder="Search coaches..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      )}

      {isError && <EmptyState title="Couldn't load coaches" description="Please try again shortly." />}

      {!isLoading && coaches.length === 0 && (
        <EmptyState
          icon={<UserCog size={28} />}
          title="No coaches yet"
          description="Add a coach account, then assign them to a team from the Teams page."
          action={<Button onClick={() => setShowCreate(true)}>New coach</Button>}
        />
      )}

      {!isLoading && coaches.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches.map((c) => {
            const teamNames = teamsByCoach.get(c.id) ?? [];
            return (
              <div key={c.id} className="card p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={`${c.firstName} ${c.lastName}`} size="md" />
                    <div className="min-w-0">
                      <p className="font-display font-bold text-white truncate">{c.firstName} {c.lastName}</p>
                      <p className="text-2xs text-slate-500 truncate">{c.email}</p>
                    </div>
                  </div>
                  <Badge variant={c.isActive ? "green" : "gray"} size="sm">{c.isActive ? "Active" : "Inactive"}</Badge>
                </div>

                <div>
                  <p className="text-2xs text-slate-500 uppercase tracking-wide mb-1">Assigned teams</p>
                  {teamNames.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      No team yet — <Link to="/teams" className="text-volt-400 hover:underline">assign one →</Link>
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {teamNames.map((n) => (
                        <span key={n} className="pill-blue text-2xs">{n}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <button
                    onClick={() => setPasswordModal({ id: c.id, name: `${c.firstName} ${c.lastName}` })}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-ice-400 transition-colors"
                  >
                    <KeyRound size={13} /> Reset password
                  </button>
                  <button
                    onClick={() => handleToggle(c.id, c.isActive)}
                    className={clsx("flex items-center gap-1.5 text-xs transition-colors ml-auto", c.isActive ? "text-slate-400 hover:text-volt-400" : "text-field-400 hover:text-field-300")}
                  >
                    <Power size={13} /> {c.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateCoachModal
          franchiseId={franchiseId}
          onClose={() => setShowCreate(false)}
          creating={creating}
          onCreate={async (body) => {
            try {
              await createCoach(body).unwrap();
              toast.success("Coach created — assign them to a team from the Teams page");
              setShowCreate(false);
            } catch (err: any) {
              toast.error(err?.data?.message || "Couldn't create coach — try again");
            }
          }}
        />
      )}

      {passwordModal && (
        <Modal isOpen onClose={() => setPasswordModal(null)} title={`Reset password — ${passwordModal.name}`} size="sm">
          <ResetPasswordForm
            saving={resetting}
            onSave={async (newPassword) => {
              try {
                await resetPassword({ id: passwordModal.id, newPassword }).unwrap();
                toast.success("Password reset");
                setPasswordModal(null);
              } catch (err: any) {
                toast.error(err?.data?.message || "Couldn't reset password — try again");
              }
            }}
          />
        </Modal>
      )}
    </div>
  );
};

const CreateCoachModal: React.FC<{
  franchiseId: string;
  onClose: () => void;
  creating: boolean;
  onCreate: (body: { email: string; password: string; role: "coach"; firstName: string; lastName: string; phone?: string; franchiseId: string }) => void;
}> = ({ franchiseId, onClose, creating, onCreate }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || password.length < 8) {
      toast.error("Fill in all required fields (password min. 8 characters)");
      return;
    }
    onCreate({ email, password, role: "coach", firstName, lastName, phone: phone || undefined, franchiseId });
  };

  return (
    <Modal isOpen onClose={onClose} title="New coach" size="md">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        <div className="sm:col-span-2">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <Input label="Temporary password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
        <Input label="Phone (optional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <div className="sm:col-span-2 flex gap-3 pt-2">
          <Button type="submit" className="flex-1" loading={creating}>Create coach</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
};

const ResetPasswordForm: React.FC<{ saving: boolean; onSave: (password: string) => void }> = ({ saving, onSave }) => {
  const [password, setPassword] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (password.length < 8) {
          toast.error("Password must be at least 8 characters");
          return;
        }
        onSave(password);
      }}
      className="space-y-4"
    >
      <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
      <Button type="submit" loading={saving} className="w-full">Reset password</Button>
    </form>
  );
};

export default CoachesManagementPage;
