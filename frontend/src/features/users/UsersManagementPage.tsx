// src/features/users/UsersManagementPage.tsx
import React, { useState } from "react";
import { clsx } from "clsx";
import { Users, Plus, Trash2, KeyRound, Power } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button, Input, Badge, Avatar, Modal, Skeleton, EmptyState } from "../../components/ui";
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useToggleUserActiveMutation,
  useResetUserPasswordMutation,
  useDeleteUserMutation,
  type UserRole,
} from "../../store/api/usersApi";
import { franchiseApi } from "../../store/api/franchiseApi";

const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: "Super Admin",
  manager: "Manager",
  coach: "Coach",
  student: "Student",
  guardian: "Guardian",
};

const ROLE_BADGE: Record<UserRole, "green" | "blue" | "yellow" | "gray" | "red"> = {
  super_admin: "red",
  manager: "blue",
  coach: "green",
  student: "yellow",
  guardian: "gray",
};

const UsersManagementPage: React.FC = () => {
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [passwordModalUser, setPasswordModalUser] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, isError } = useGetUsersQuery({
    roles: roleFilter || undefined,
    search: search || undefined,
    limit: 50,
  });
  const users = data?.data ?? [];

  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [toggleActive] = useToggleUserActiveMutation();
  const [resetPassword, { isLoading: resetting }] = useResetUserPasswordMutation();
  const [deleteUser] = useDeleteUserMutation();

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleActive(id).unwrap();
      toast.success(isActive ? "User deactivated" : "User activated");
    } catch {
      toast.error("Couldn't update user — try again");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Permanently remove ${name}? This cannot be undone.`)) return;
    try {
      await deleteUser(id).unwrap();
      toast.success("User removed");
    } catch (err: any) {
      toast.error(err?.data?.message || "Couldn't remove user — try again");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="section-title mb-1">Platform</p>
          <h1 className="font-display font-extrabold text-white text-2xl uppercase tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{isLoading ? "Loading…" : `${data?.total ?? 0} accounts across all academies`}</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>New user</Button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <Input placeholder="Search name or email..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<span className="text-xs">🔍</span>} />
        </div>
        <div className="min-w-40">
          <select className="input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
      )}

      {isError && <EmptyState title="Couldn't load users" description="Please try again shortly." />}

      {!isLoading && users.length === 0 && (
        <EmptyState icon={<Users size={28} />} title="No users found" description="Try adjusting your filters, or create a new account." />
      )}

      {!isLoading && users.length > 0 && (
        <div className="card overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-pitch-700/30">
                <th className="text-left px-5 py-3 section-title">User</th>
                <th className="text-left px-5 py-3 section-title hidden sm:table-cell">Role</th>
                <th className="text-left px-5 py-3 section-title hidden md:table-cell">Phone</th>
                <th className="text-center px-5 py-3 section-title">Status</th>
                <th className="px-5 py-3 section-title text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className={clsx("border-b border-white/4 hover:bg-white/2 transition-colors", i % 2 === 0 ? "" : "bg-white/1")}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${u.firstName} ${u.lastName}`} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-white">{u.firstName} {u.lastName}</p>
                        <p className="text-2xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <Badge variant={ROLE_BADGE[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-400 hidden md:table-cell">{u.phone || "—"}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={clsx("text-xs font-semibold", u.isActive ? "text-field-400" : "text-ember-400")}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setPasswordModalUser({ id: u.id, name: `${u.firstName} ${u.lastName}` })}
                        className="text-slate-500 hover:text-ice-400 transition-colors"
                        aria-label="Reset password"
                        title="Reset password"
                      >
                        <KeyRound size={14} />
                      </button>
                      <button
                        onClick={() => handleToggle(u.id, u.isActive)}
                        className={clsx("transition-colors", u.isActive ? "text-slate-500 hover:text-volt-400" : "text-field-400 hover:text-field-300")}
                        aria-label={u.isActive ? "Deactivate" : "Activate"}
                        title={u.isActive ? "Deactivate" : "Activate"}
                      >
                        <Power size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, `${u.firstName} ${u.lastName}`)}
                        className="text-slate-500 hover:text-ember-400 transition-colors"
                        aria-label="Remove user"
                        title="Remove user"
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

      <CreateUserModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        creating={creating}
        onCreate={async (body) => {
          try {
            await createUser(body).unwrap();
            toast.success("User created");
            setShowCreate(false);
          } catch (err: any) {
            toast.error(err?.data?.message || "Couldn't create user — try again");
          }
        }}
      />

      {passwordModalUser && (
        <Modal isOpen onClose={() => setPasswordModalUser(null)} title={`Reset password — ${passwordModalUser.name}`} size="sm">
          <ResetPasswordForm
            saving={resetting}
            onSave={async (newPassword) => {
              try {
                await resetPassword({ id: passwordModalUser.id, newPassword }).unwrap();
                toast.success("Password reset");
                setPasswordModalUser(null);
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

const CreateUserModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  creating: boolean;
  onCreate: (body: { email: string; password: string; role: UserRole; firstName: string; lastName: string; phone?: string; franchiseId?: string }) => void;
}> = ({ isOpen, onClose, creating, onCreate }) => {
  const { data: franchises } = franchiseApi.useGetFranchisesQuery({ isActive: true });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("manager");
  const [phone, setPhone] = useState("");
  const [franchiseId, setFranchiseId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || password.length < 8) {
      toast.error("Fill in all required fields (password min. 8 characters)");
      return;
    }
    onCreate({ email, password, role, firstName, lastName, phone: phone || undefined, franchiseId: franchiseId || undefined });
    setFirstName(""); setLastName(""); setEmail(""); setPassword(""); setPhone(""); setFranchiseId("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create new user" size="md">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        <div className="sm:col-span-2">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <Input label="Temporary password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
        <Input label="Phone (optional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <div>
          <label className="label">Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Franchise (optional)</label>
          <select className="input" value={franchiseId} onChange={(e) => setFranchiseId(e.target.value)}>
            <option value="">Unassigned</option>
            {(franchises ?? []).map((f) => (
              <option key={f.id} value={f.id}>{f.academyName ? `${f.academyName} — ${f.name}` : f.name}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2 flex gap-3 pt-2">
          <Button type="submit" className="flex-1" loading={creating}>Create user</Button>
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

export default UsersManagementPage;
