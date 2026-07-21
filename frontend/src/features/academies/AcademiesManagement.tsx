// src/features/academies/AcademiesManagement.tsx
import React, { useState, useEffect } from "react";
import { clsx } from "clsx";
import { toast } from "react-hot-toast";
import {
  LayoutGrid,
  List,
  Plus,
  Home,
  Zap,
  Trophy,
  Power,
  Settings,
  X,
  Loader2,
} from "lucide-react";
import { Button, Input, Modal, Badge, StatCard } from "../../components/ui";
import { baseApi } from "../../store/api/baseApi";
import { academyApi } from "@/store/api/academyApi";
import { Academy, AcademyConfigPayload, CreateAcademyPayload } from "./types";

// Hooks
const useGetAcademies = academyApi.useGetAcademiesQuery;
const useCreateAcademy = academyApi.useCreateAcademyMutation;
const useUpdateAcademyConfig = academyApi.useUpdateAcademyConfigMutation;
const useToggleAcademyStatus = academyApi.useToggleAcademyStatusMutation;
const useDeleteAcademy = academyApi.useDeleteAcademyMutation;

// Helper to get manager full name
const getManagerName = (academy: Academy): string => {
  if (academy.manager)
    return `${academy.manager.firstName} ${academy.manager.lastName}`;
  return "No Manager Assigned";
};

// ==================== Component ====================
const AcademiesManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAcademy, setSelectedAcademy] = useState<Academy | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined,
  );

  // API hooks
  const {
    data: academiesData,
    isLoading,
    isError,
    refetch,
  } = useGetAcademies({
    search: searchTerm || undefined,
    isActive: activeFilter,
    page: 1,
    limit: 100,
  });
  const [createAcademy, { isLoading: isCreating }] = useCreateAcademy();
  const [updateConfig, { isLoading: isUpdatingConfig }] =
    useUpdateAcademyConfig();
  const [toggleStatus, { isLoading: isToggling }] = useToggleAcademyStatus();
  const [deleteAcademy] = useDeleteAcademy();

  const academies = academiesData?.data || [];

  // Derived KPIs
  const totalCapacity = academies.reduce((sum, a) => sum + a.maxStudents, 0);
  const activeCount = academies.filter((a) => a.isActive).length;
  const activePercentage = academies.length
    ? (activeCount / academies.length) * 100
    : 0;
  // TODO: total students would come from a separate API – placeholder
  const totalStudents = "—";

  // Toggle status handler
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleStatus(id).unwrap();
      toast.success(`Academy ${currentStatus ? "deactivated" : "activated"}`);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to toggle status");
    }
  };

  // Add Academy form state
  const [newAcademyForm, setNewAcademyForm] = useState({
    name: "",
    academyCode: "",
    location: {
      name: "",
      address: "",
      latitude: 0,
      longitude: 0,
      fieldNumber: "",
    },
    ageGroups: "",
    maxStudents: 100,
    alertBeforeMinutes: 60,
    notificationAlertAfterMinutes: 15,
    skillParameters:
      "Dribbling, Passing, Shooting, Speed, Tactical Awareness, Attitude",
    manager: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const handleAddSubmit = async () => {
    const payload: CreateAcademyPayload = {
      name: newAcademyForm.name,
      academyCode: newAcademyForm.academyCode || undefined,
      location: {
        ...newAcademyForm.location,
        latitude: Number(newAcademyForm.location.latitude),
        longitude: Number(newAcademyForm.location.longitude),
      },
      ageGroups: newAcademyForm.ageGroups
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
      maxStudents: Number(newAcademyForm.maxStudents),
      alertBeforeMinutes: Number(newAcademyForm.alertBeforeMinutes),
      notificationAlertAfterMinutes: Number(
        newAcademyForm.notificationAlertAfterMinutes,
      ),
      skillParameters: newAcademyForm.skillParameters
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      manager: newAcademyForm.manager,
    };

    try {
      await createAcademy(payload).unwrap();
      toast.success("Academy created — a default franchise was set up automatically");
      setIsAddModalOpen(false);
      // Reset form
      setNewAcademyForm({
        name: "",
        academyCode: "",
        location: {
          name: "",
          address: "",
          latitude: 0,
          longitude: 0,
          fieldNumber: "",
        },
        ageGroups: "",
        maxStudents: 100,
        alertBeforeMinutes: 60,
        notificationAlertAfterMinutes: 15,
        skillParameters:
          "Dribbling, Passing, Shooting, Speed, Tactical Awareness, Attitude",
        manager: { firstName: "", lastName: "", email: "", password: "" },
      });
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create academy");
    }
  };

  // Configuration form state
  const [configForm, setConfigForm] = useState<AcademyConfigPayload>({});

  useEffect(() => {
    if (selectedAcademy) {
      setConfigForm({
        maxStudents: selectedAcademy.maxStudents,
        ageGroups: selectedAcademy.ageGroups,
        alertBeforeMinutes: selectedAcademy.alertBeforeMinutes,
        notificationAlertAfterMinutes:
          selectedAcademy.notificationAlertAfterMinutes,
        skillParameters: selectedAcademy.skillParameters,
        isActive: selectedAcademy.isActive,
      });
    }
  }, [selectedAcademy]);

  const handleConfigSave = async () => {
    if (!selectedAcademy) return;
    try {
      await updateConfig({
        id: selectedAcademy.id,
        config: configForm,
      }).unwrap();
      toast.success("Configuration saved");
      setConfigModalOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save configuration");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-volt-400" size={32} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card p-8 text-center">
        <p className="text-ember-400">Failed to load academies.</p>
        <Button variant="secondary" onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <p className="section-title mb-1">Infrastructure</p>
          <h1 className="font-display font-extrabold text-white text-2xl uppercase tracking-tight">
            Academies Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {academies.length} total branches
          </p>
        </div>
        <div className="flex gap-2">
          {/* Search & Filter */}
          <Input
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-48"
          />
          <select
            className="bg-pitch-700 border border-white/5 rounded px-2 py-1 text-sm"
            value={
              activeFilter === undefined
                ? "all"
                : activeFilter
                  ? "active"
                  : "inactive"
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === "all") setActiveFilter(undefined);
              else if (val === "active") setActiveFilter(true);
              else setActiveFilter(false);
            }}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="flex bg-pitch-700 p-1 rounded border border-white/5">
            <button
              onClick={() => setViewMode("table")}
              className={clsx(
                "p-1.5 rounded transition-all",
                viewMode === "table"
                  ? "bg-white/10 text-white"
                  : "text-slate-500 hover:text-slate-300",
              )}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={clsx(
                "p-1.5 rounded transition-all",
                viewMode === "card"
                  ? "bg-white/10 text-white"
                  : "text-slate-500 hover:text-slate-300",
              )}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            icon={<Plus size={18} />}
          >
            New Academy
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Capacity"
          value={totalCapacity.toString()}
          sublabel="Across all branches"
          icon={<Home size={20} />}
          accent="ice"
        />
        <StatCard
          label="Active Status"
          value={`${Math.round(activePercentage)}%`}
          sublabel="Operational uptime"
          icon={<Zap size={20} />}
          accent="field"
        />
        <StatCard
          label="Total Students"
          value={totalStudents}
          sublabel="Current enrollment"
          icon={<Trophy size={20} />}
          accent="volt"
        />
      </div>

      {/* Table Mode */}
      {viewMode === "table" && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-pitch-700/50">
                <th className="text-left px-5 py-3 section-title">Academy</th>
                <th className="text-left px-5 py-3 section-title">Code</th>
                <th className="text-left px-5 py-3 section-title">Manager</th>
                <th className="text-center px-5 py-3 section-title">Status</th>
                <th className="text-right px-5 py-3 section-title">Actions</th>
              </tr>
            </thead>
            <tbody>
              {academies.map((academy) => (
                <tr
                  key={academy.id}
                  className="border-b border-white/4 hover:bg-white/2 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-pitch-700 flex items-center justify-center text-xs font-bold text-volt-400 border border-white/5">
                        {academy.name.charAt(0)}
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {academy.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-mono text-slate-400">
                    {academy.academyCode}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {getManagerName(academy)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Badge variant={academy.isActive ? "green" : "red"}>
                      {academy.isActive ? "Active" : "Offline"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() =>
                          handleToggleStatus(academy.id, academy.isActive)
                        }
                        disabled={isToggling}
                        className={clsx(
                          "p-2 rounded border transition-all",
                          academy.isActive
                            ? "border-ember-400/20 text-ember-400 hover:bg-ember-400/10"
                            : "border-field-400/20 text-field-400 hover:bg-field-400/10",
                          isToggling && "opacity-50 cursor-not-allowed",
                        )}
                        title={academy.isActive ? "Deactivate" : "Activate"}
                      >
                        {academy.isActive ? (
                          <Power size={14} />
                        ) : (
                          <Zap size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAcademy(academy);
                          setConfigModalOpen(true);
                        }}
                        className="p-2 rounded border border-white/5 text-volt-400 hover:bg-volt-400/10 transition-all"
                        title="Configuration"
                      >
                        <Settings size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {academies.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    No academies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Card Mode */}
      {viewMode === "card" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {academies.map((academy) => (
            <div
              key={academy.id}
              className="card p-5 border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-pitch-700 flex items-center justify-center font-display font-black text-volt-400 text-xl">
                    {academy.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{academy.name}</h3>
                    <p className="text-2xs text-slate-500 uppercase tracking-widest">
                      {academy.academyCode}
                    </p>
                  </div>
                </div>
                <Badge variant={academy.isActive ? "green" : "red"}>
                  {academy.isActive ? "Active" : "Offline"}
                </Badge>
              </div>
              <div className="mt-6 flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 text-xs"
                  size="sm"
                  onClick={() => {
                    setSelectedAcademy(academy);
                    setConfigModalOpen(true);
                  }}
                  icon={<Settings size={14} />}
                >
                  Configuration
                </Button>
                <button
                  onClick={() =>
                    handleToggleStatus(academy.id, academy.isActive)
                  }
                  disabled={isToggling}
                  className={clsx(
                    "px-4 rounded border transition-all text-xs font-bold uppercase flex items-center gap-2",
                    academy.isActive
                      ? "border-ember-400/20 text-ember-400 bg-ember-400/5 hover:bg-ember-400/10"
                      : "border-field-400/20 text-field-400 bg-field-400/5 hover:bg-field-400/10",
                    isToggling && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {academy.isActive ? (
                    <>
                      <Power size={12} /> Disable
                    </>
                  ) : (
                    <>
                      <Zap size={12} /> Enable
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Academy Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Academy"
        size="md"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Academy Name"
              value={newAcademyForm.name}
              onChange={(e) =>
                setNewAcademyForm({ ...newAcademyForm, name: e.target.value })
              }
              required
            />
            <Input
              label="Short Code (optional)"
              value={newAcademyForm.academyCode}
              onChange={(e) =>
                setNewAcademyForm({
                  ...newAcademyForm,
                  academyCode: e.target.value,
                })
              }
            />
          </div>

          <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-3">
            <p className="text-xs font-bold text-volt-400 uppercase tracking-tight">
              Manager Account
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                value={newAcademyForm.manager.firstName}
                onChange={(e) =>
                  setNewAcademyForm({
                    ...newAcademyForm,
                    manager: {
                      ...newAcademyForm.manager,
                      firstName: e.target.value,
                    },
                  })
                }
                required
              />
              <Input
                label="Last Name"
                value={newAcademyForm.manager.lastName}
                onChange={(e) =>
                  setNewAcademyForm({
                    ...newAcademyForm,
                    manager: {
                      ...newAcademyForm.manager,
                      lastName: e.target.value,
                    },
                  })
                }
                required
              />
            </div>
            <Input
              label="Manager Email"
              type="email"
              value={newAcademyForm.manager.email}
              onChange={(e) =>
                setNewAcademyForm({
                  ...newAcademyForm,
                  manager: { ...newAcademyForm.manager, email: e.target.value },
                })
              }
              required
            />
            <Input
              label="Initial Password"
              type="password"
              value={newAcademyForm.manager.password}
              onChange={(e) =>
                setNewAcademyForm({
                  ...newAcademyForm,
                  manager: {
                    ...newAcademyForm.manager,
                    password: e.target.value,
                  },
                })
              }
              required
            />
          </div>

          <div className="bg-pitch-700/50 p-3 rounded-lg border border-white/5 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
              Location Details
            </p>
            <Input
              label="Venue Name"
              value={newAcademyForm.location.name}
              onChange={(e) =>
                setNewAcademyForm({
                  ...newAcademyForm,
                  location: {
                    ...newAcademyForm.location,
                    name: e.target.value,
                  },
                })
              }
              required
            />
            <Input
              label="Full Address"
              value={newAcademyForm.location.address}
              onChange={(e) =>
                setNewAcademyForm({
                  ...newAcademyForm,
                  location: {
                    ...newAcademyForm.location,
                    address: e.target.value,
                  },
                })
              }
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Latitude"
                type="number"
                value={newAcademyForm.location.latitude}
                onChange={(e) =>
                  setNewAcademyForm({
                    ...newAcademyForm,
                    location: {
                      ...newAcademyForm.location,
                      latitude: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                required
              />
              <Input
                label="Longitude"
                type="number"
                value={newAcademyForm.location.longitude}
                onChange={(e) =>
                  setNewAcademyForm({
                    ...newAcademyForm,
                    location: {
                      ...newAcademyForm.location,
                      longitude: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                required
              />
            </div>
            <Input
              label="Field Number (optional)"
              value={newAcademyForm.location.fieldNumber}
              onChange={(e) =>
                setNewAcademyForm({
                  ...newAcademyForm,
                  location: {
                    ...newAcademyForm.location,
                    fieldNumber: e.target.value,
                  },
                })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Max Students"
              type="number"
              value={newAcademyForm.maxStudents}
              onChange={(e) =>
                setNewAcademyForm({
                  ...newAcademyForm,
                  maxStudents: parseInt(e.target.value) || 0,
                })
              }
            />
            <Input
              label="Age Groups (comma separated)"
              value={newAcademyForm.ageGroups}
              onChange={(e) =>
                setNewAcademyForm({
                  ...newAcademyForm,
                  ageGroups: e.target.value,
                })
              }
              placeholder="U-12, U-14, U-16"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Pre-Session Alert (mins)"
              type="number"
              value={newAcademyForm.alertBeforeMinutes}
              onChange={(e) =>
                setNewAcademyForm({
                  ...newAcademyForm,
                  alertBeforeMinutes: parseInt(e.target.value) || 0,
                })
              }
            />
            <Input
              label="Post-Session Alert (mins)"
              type="number"
              value={newAcademyForm.notificationAlertAfterMinutes}
              onChange={(e) =>
                setNewAcademyForm({
                  ...newAcademyForm,
                  notificationAlertAfterMinutes: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
          <Input
            label="Skill Parameters (comma separated)"
            value={newAcademyForm.skillParameters}
            onChange={(e) =>
              setNewAcademyForm({
                ...newAcademyForm,
                skillParameters: e.target.value,
              })
            }
          />

          <div className="flex gap-3 mt-6">
            <Button
              className="flex-1"
              onClick={handleAddSubmit}
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "Create Academy"
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Configuration Modal */}
      {selectedAcademy && (
        <Modal
          isOpen={configModalOpen}
          onClose={() => setConfigModalOpen(false)}
          title={`Config: ${selectedAcademy.name}`}
          size="md"
        >
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="section-title">Capacity & Eligibility</p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Max Students"
                  type="number"
                  value={configForm.maxStudents ?? selectedAcademy.maxStudents}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      maxStudents: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <Input
                  label="Age Groups (Comma separated)"
                  value={
                    configForm.ageGroups?.join(", ") ??
                    selectedAcademy.ageGroups.join(", ")
                  }
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      ageGroups: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="section-title">Automation & Alerts</p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Pre-Session Alert (Mins)"
                  type="number"
                  value={
                    configForm.alertBeforeMinutes ??
                    selectedAcademy.alertBeforeMinutes
                  }
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      alertBeforeMinutes: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <Input
                  label="Post-Session Alert (Mins)"
                  type="number"
                  value={
                    configForm.notificationAlertAfterMinutes ??
                    selectedAcademy.notificationAlertAfterMinutes
                  }
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      notificationAlertAfterMinutes:
                        parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="section-title text-volt-400">Skill Parameters</p>
              <div className="flex flex-wrap gap-2 p-3 bg-white/5 rounded border border-white/5">
                {(
                  configForm.skillParameters ?? selectedAcademy.skillParameters
                ).map((skill, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-pitch-700 px-2 py-1 rounded text-xs text-white"
                  >
                    {skill}
                    <button
                      type="button"
                      className="text-ember-400 hover:text-ember-300"
                      onClick={() => {
                        const newSkills = (
                          configForm.skillParameters ??
                          selectedAcademy.skillParameters
                        ).filter((_, i) => i !== idx);
                        setConfigForm({
                          ...configForm,
                          skillParameters: newSkills,
                        });
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-xs text-volt-400 font-bold px-2 flex items-center gap-1 hover:text-volt-300"
                  onClick={() => {
                    const newSkill = prompt("Enter new skill parameter:");
                    if (newSkill) {
                      const current =
                        configForm.skillParameters ??
                        selectedAcademy.skillParameters;
                      setConfigForm({
                        ...configForm,
                        skillParameters: [...current, newSkill],
                      });
                    }
                  }}
                >
                  <Plus size={12} /> Add
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-ember-400/5 border border-ember-400/20 rounded">
              <div>
                <p className="text-sm font-bold text-white">Active Status</p>
                <p className="text-2xs text-slate-500">
                  Toggle visibility for enrollment
                </p>
              </div>
              <input
                type="checkbox"
                checked={configForm.isActive ?? selectedAcademy.isActive}
                onChange={(e) =>
                  setConfigForm({ ...configForm, isActive: e.target.checked })
                }
                className="w-5 h-5 accent-field-400"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                className="flex-1"
                onClick={handleConfigSave}
                disabled={isUpdatingConfig}
              >
                {isUpdatingConfig ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfigModalOpen(false)}
              >
                Discard
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AcademiesManagement;
