// src/features/franchises/FranchiseManagementPage.tsx
import React, { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Building2, Plus, Power, Trash2, ListChecks, X, Pencil } from "lucide-react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { Button, Input, Badge, Modal, Skeleton, EmptyState } from "../../components/ui";
import { RootState } from "../../store";
import { useCurrentFranchiseId } from "../../hooks/useCurrentFranchiseId";
import { academyApi } from "../../store/api/academyApi";
import {
  useGetFranchisesQuery,
  useGetFranchiseByIdQuery,
  useCreateFranchiseMutation,
  useUpdateFranchiseMutation,
  useToggleFranchiseActiveMutation,
  useDeleteFranchiseMutation,
  type Franchise,
} from "../../store/api/franchiseApi";

const FranchiseManagementPage: React.FC = () => {
  const { user } = useSelector((s: RootState) => s.auth);
  const isSuperAdmin = user?.role === "super_admin";

  // Manager: resolve their own academy via their current franchise.
  const currentFranchiseId = useCurrentFranchiseId();
  const { data: currentFranchise } = useGetFranchiseByIdQuery(currentFranchiseId ?? "", {
    skip: !currentFranchiseId || isSuperAdmin,
  });

  // Super admin: pick any academy from a dropdown.
  const { data: academiesResult } = academyApi.useGetAcademiesQuery(
    { isActive: true, limit: 100 },
    { skip: !isSuperAdmin },
  );
  const academies = academiesResult?.data ?? [];
  const [selectedAcademyId, setSelectedAcademyId] = useState("");

  const activeAcademyId = isSuperAdmin ? selectedAcademyId : currentFranchise?.academyId;

  const { data: franchises, isLoading, isError } = useGetFranchisesQuery(
    activeAcademyId ? { academyId: activeAcademyId } : undefined,
    { skip: !activeAcademyId },
  );

  const [createFranchise, { isLoading: creating }] = useCreateFranchiseMutation();
  const [toggleActive] = useToggleFranchiseActiveMutation();
  const [deleteFranchise] = useDeleteFranchiseMutation();
  const [showCreate, setShowCreate] = useState(false);
  const [editingFranchise, setEditingFranchise] = useState<Franchise | null>(null);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);

  const openSkillModal = (franchise: Franchise) => {
    setEditingFranchise(franchise);
    setIsSkillModalOpen(true);
  };
  const closeSkillModal = () => {
    setIsSkillModalOpen(false);
    setEditingFranchise(null);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleActive(id).unwrap();
      toast.success(isActive ? "Franchise deactivated" : "Franchise activated");
    } catch {
      toast.error("Couldn't update franchise — try again");
    }
  };

  const handleDelete = async (f: Franchise) => {
    if (!activeAcademyId) return;
    if (!window.confirm(`Remove "${f.name}"? This cannot be undone.`)) return;
    try {
      await deleteFranchise({ id: f.id, academyId: activeAcademyId }).unwrap();
      toast.success("Franchise removed");
    } catch (err: any) {
      toast.error(err?.data?.message || "Couldn't remove franchise — try again");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="section-title mb-1">Structure</p>
          <h1 className="font-display font-extrabold text-white text-2xl uppercase tracking-tight">Franchises</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isSuperAdmin
              ? "Manage the operational franchises under any academy"
              : "Manage the franchises under your academy"}
          </p>
        </div>
        {activeAcademyId && (
          <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>New franchise</Button>
        )}
      </div>

      {isSuperAdmin && (
        <div className="card p-4 flex items-end gap-3">
          <div className="min-w-64">
            <label className="label">Academy</label>
            <select className="input" value={selectedAcademyId} onChange={(e) => setSelectedAcademyId(e.target.value)}>
              <option value="">Select an academy…</option>
              {academies.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {!activeAcademyId && (
        <EmptyState
          icon={<Building2 size={28} />}
          title={isSuperAdmin ? "Select an academy" : "No academy found"}
          description={isSuperAdmin ? "Choose an academy above to see its franchises." : "Your account isn't linked to an academy yet."}
        />
      )}

      {activeAcademyId && isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      )}

      {activeAcademyId && isError && (
        <EmptyState title="Couldn't load franchises" description="Please try again shortly." />
      )}

      {activeAcademyId && !isLoading && franchises?.length === 0 && (
        <EmptyState
          icon={<Building2 size={28} />}
          title="No franchises yet"
          description="Every academy needs at least one franchise for students, teams, and sessions to belong to."
          action={<Button onClick={() => setShowCreate(true)}>Create franchise</Button>}
        />
      )}

      {activeAcademyId && !isLoading && franchises && franchises.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {franchises.map((f) => (
            <div key={f.id} className="card p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display font-bold text-white truncate">{f.name}</p>
                  <p className="text-2xs text-slate-500 font-mono">{f.franchiseCode}</p>
                </div>
                <Badge variant={f.isActive ? "green" : "gray"} size="sm">{f.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              <p className="text-xs text-slate-400">{f.location?.name}</p>
              <div className="flex items-center gap-3 text-2xs text-slate-500">
                <span>Max {f.maxStudents} students</span>
                {f.ageGroups?.length > 0 && <span>· {f.ageGroups.join(", ")}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-2xs text-slate-500">Skills:</span>
                {f.skillParameters?.length ? (
                  f.skillParameters.map((skill) => (
                    <Badge key={skill} variant="gray" size="sm">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-2xs text-slate-500 italic">None set</span>
                )}
                <button
                  onClick={() => openSkillModal(f)}
                  className="ml-auto text-slate-400 hover:text-volt-400 transition-colors"
                  title="Manage skills"
                >
                  <Pencil size={14} />
                </button>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                <button
                  onClick={() => handleToggle(f.id, f.isActive)}
                  className={clsx("flex items-center gap-1.5 text-xs transition-colors", f.isActive ? "text-slate-400 hover:text-volt-400" : "text-field-400 hover:text-field-300")}
                >
                  <Power size={13} />
                  {f.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => handleDelete(f)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-ember-400 transition-colors ml-auto"
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && activeAcademyId && (
        <CreateFranchiseModal
          academyId={activeAcademyId}
          onClose={() => setShowCreate(false)}
          creating={creating}
          onCreate={async (body) => {
            try {
              await createFranchise(body).unwrap();
              toast.success("Franchise created");
              setShowCreate(false);
            } catch (err: any) {
              toast.error(err?.data?.message || "Couldn't create franchise — try again");
            }
          }}
        />
      )}

      {isSkillModalOpen && editingFranchise && (
        <FranchiseSkillModal
          franchise={editingFranchise}
          onClose={closeSkillModal}
        />
      )}
    </div>
  );
};

const CreateFranchiseModal: React.FC<{
  academyId: string;
  onClose: () => void;
  creating: boolean;
  onCreate: (body: {
    academyId: string;
    name: string;
    location: { name: string; address: string; latitude: number; longitude: number; fieldNumber?: string };
    maxStudents?: number;
  }) => void;
}> = ({ academyId, onClose, creating, onCreate }) => {
  const [name, setName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [maxStudents, setMaxStudents] = useState("100");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !locationName || !address) {
      toast.error("Fill in all required fields");
      return;
    }
    onCreate({
      academyId,
      name,
      location: { name: locationName, address, latitude: 0, longitude: 0 },
      maxStudents: parseInt(maxStudents, 10) || 100,
    });
  };

  return (
    <Modal isOpen onClose={onClose} title="New franchise" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Franchise name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Downtown Franchise" required />
        <Input label="Location name" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g. Downtown Sports Complex" required />
        <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" required />
        <Input label="Max students" type="number" min={1} value={maxStudents} onChange={(e) => setMaxStudents(e.target.value)} />
        <div className="flex gap-3 pt-2">
          <Button type="submit" className="flex-1" loading={creating}>Create franchise</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
};

const FranchiseSkillModal: React.FC<{
  franchise: Franchise;
  onClose: () => void;
}> = ({ franchise, onClose }) => {
  const [updateFranchise, { isLoading }] = useUpdateFranchiseMutation();
  const [skills, setSkills] = useState<string[]>(franchise.skillParameters || []);
  const [newSkill, setNewSkill] = useState("");
  const [dirty, setDirty] = useState(false);

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("That skill already exists");
      return;
    }
    setSkills((prev) => [...prev, trimmed]);
    setNewSkill("");
    setDirty(true);
  };

  const removeSkill = (idx: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  };

  const handleSave = async () => {
    if (skills.length === 0) {
      toast.error("Keep at least one skill parameter");
      return;
    }
    try {
      await updateFranchise({
        id: franchise.id,
        data: { skillParameters: skills },
      }).unwrap();
      toast.success("Skills updated for this franchise");
      setDirty(false);
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Update failed");
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Manage skills – ${franchise.name}`} size="md">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 p-3 bg-white/5 rounded border border-white/5">
          {skills.map((skill, idx) => (
            <div key={`${skill}-${idx}`} className="flex items-center gap-2 bg-pitch-700 px-2 py-1 rounded text-xs text-white">
              {skill}
              <button type="button" className="text-ember-400 hover:text-ember-300" onClick={() => removeSkill(idx)}>
                <X size={12} />
              </button>
            </div>
          ))}
          {skills.length === 0 && (
            <p className="text-2xs text-slate-500">No skills defined for this franchise.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            className="input flex-1"
            placeholder="e.g. Dribbling"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
          />
          <Button type="button" variant="secondary" icon={<Plus size={14} />} onClick={addSkill}>
            Add
          </Button>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" loading={isLoading} onClick={handleSave} disabled={!dirty}>
            Save changes
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FranchiseManagementPage;