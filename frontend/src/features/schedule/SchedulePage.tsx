import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  CalendarDays,
  Plus,
  MapPin,
  Trash2,
  Bell,
  Users,
  Layers,
  Search,
  Filter,
  MoreVertical,
  Clock,
  AlertTriangle,
  X,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button, Badge, Modal, Input, Skeleton, EmptyState } from "../../components/ui";
import { RootState } from "../../store";
import { useCurrentFranchiseId } from "../../hooks/useCurrentFranchiseId";
import { useListTeamsQuery } from "../../store/api/teamsApi";
import { useGetUsersQuery } from "../../store/api/usersApi";
import { useGetFranchiseByIdQuery } from "../../store/api/franchiseApi";
import {
  useGetSessionsQuery,
  useCreateSessionMutation,
  useCancelSessionMutation,
  useChangeSessionLocationMutation,
  useDeleteSessionMutation,
  useAlertAllGuardiansMutation,
  type Session,
} from "../../store/api/scheduleApi";

const STATUS_VARIANT: Record<Session["status"], "green" | "blue" | "gray" | "red"> = {
  upcoming: "blue",
  ongoing: "green",
  completed: "gray",
  cancelled: "red",
};

const TYPE_LABEL: Record<Session["type"], string> = {
  training: "Training",
  match: "Match",
  trial: "Trial",
  fitness: "Fitness",
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const SchedulePage: React.FC = () => {
  const franchiseId = useCurrentFranchiseId();
  const navigate = useNavigate();
  const { user } = useSelector((s: RootState) => s.auth);
  const isCoach = user?.role === "coach";
  const canBroadcast = user?.permissions?.canSendNotifications === true;
  const canHardDelete = user?.role === "super_admin" || user?.role === "manager";

  // State
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [showCreate, setShowCreate] = useState(false);
  const [locationModalSession, setLocationModalSession] = useState<Session | null>(null);
  const [cancelModalSession, setCancelModalSession] = useState<Session | null>(null);
  const [confirmBroadcastModal, setConfirmBroadcastModal] = useState(false);

  // Queries
  const { data: allTeams } = useListTeamsQuery({ franchiseId: franchiseId ?? "" }, { skip: !franchiseId });
  const teams = isCoach ? (allTeams ?? []).filter((t) => t.coach?._id === user?.id) : allTeams ?? [];
  const { data: franchise } = useGetFranchiseByIdQuery(franchiseId ?? "", { skip: !franchiseId });
  const { data: coachesResult } = useGetUsersQuery(
    { roles: "coach", franchiseId: franchiseId ?? "", isActive: "true", limit: 100 },
    { skip: !franchiseId || isCoach }
  );
  const coaches = coachesResult?.data ?? [];

  const { data: sessions = [], isLoading, isError } = useGetSessionsQuery(
    {
      franchiseId: franchiseId ?? "",
      ...(isCoach && user?.id ? { coachId: user.id } : {}),
      ...(selectedDate ? { from: selectedDate, to: selectedDate } : {}),
    },
    { skip: !franchiseId }
  );

  const sessionsList = Array.isArray(sessions) ? sessions : [];

  // Mutations
  const [createSession, { isLoading: creating }] = useCreateSessionMutation();
  const [cancelSession, { isLoading: cancelling }] = useCancelSessionMutation();
  const [changeLocation, { isLoading: changingLocation }] = useChangeSessionLocationMutation();
  const [deleteSession] = useDeleteSessionMutation();
  const [alertAllGuardians, { isLoading: alerting }] = useAlertAllGuardiansMutation();

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessionsList.filter((s) => {
      const targetName = (s.teamName || s.category || "").toLowerCase();
      const loc = (s.location || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || targetName.includes(query) || loc.includes(query);
      const matchesType = typeFilter === "all" || s.type === typeFilter;
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [sessionsList, searchQuery, typeFilter, statusFilter]);

  // Operational KPIs
  const kpis = useMemo(() => {
    const total = sessionsList.length;
    const ongoing = sessionsList.filter((s) => s.status === "ongoing").length;
    const completed = sessionsList.filter((s) => s.status === "completed").length;
    const upcoming = sessionsList.filter((s) => s.status === "upcoming").length;
    return { total, ongoing, completed, upcoming };
  }, [sessionsList]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this session permanently? This action cannot be undone.")) return;
    try {
      await deleteSession(id).unwrap();
      toast.success("Session removed permanently");
    } catch {
      toast.error("Couldn't remove session — please try again");
    }
  };

  const handleAlertAll = async () => {
    if (!franchiseId) return;
    try {
      const res = await alertAllGuardians({ franchiseId }).unwrap();
      toast.success(`Broadcasting alert sent to ${res.notified} guardian${res.notified === 1 ? "" : "s"}`);
      setConfirmBroadcastModal(false);
    } catch {
      toast.error("Couldn't send broadcast alert — try again");
    }
  };

  if (!franchiseId) {
    return (
      <EmptyState
        icon={<CalendarDays size={32} />}
        title="No franchise selected"
        description="Select an active franchise from the header bar to manage operational schedules."
      />
    );
  }

  return (
    <div className="space-y-6 text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <CalendarDays className="text-volt-400" size={24} /> Schedule Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Operational session dispatcher, field utilization, and roster attendance tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canBroadcast && (
            <Button
              variant="secondary"
              icon={<Bell size={15} />}
              onClick={() => setConfirmBroadcastModal(true)}
              className="text-xs font-semibold"
            >
              Broadcast Alert
            </Button>
          )}
          <Button icon={<Plus size={15} />} onClick={() => setShowCreate(true)} className="text-xs font-semibold">
            New Session
          </Button>
        </div>
      </div>

      {/* Metric Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-pitch-800/80 border border-white/5">
          <span className="text-2xs font-mono uppercase text-slate-400">Total Today</span>
          <p className="text-xl font-bold font-mono text-white mt-0.5">{kpis.total}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-pitch-800/80 border border-white/5">
          <span className="text-2xs font-mono uppercase text-emerald-400">Ongoing</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{kpis.ongoing}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-pitch-800/80 border border-white/5">
          <span className="text-2xs font-mono uppercase text-volt-400">Upcoming</span>
          <p className="text-xl font-bold font-mono text-volt-400 mt-0.5">{kpis.upcoming}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-pitch-800/80 border border-white/5">
          <span className="text-2xs font-mono uppercase text-slate-400">Completed</span>
          <p className="text-xl font-bold font-mono text-slate-300 mt-0.5">{kpis.completed}</p>
        </div>
      </div>

      {/* Operational Search & Filter Bar */}
      <div className="p-3 rounded-xl bg-pitch-800 border border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by team, category, venue..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-pitch-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-volt-400"
            />
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-pitch-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-volt-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-pitch-900 border border-white/10 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="training">Training</option>
            <option value="match">Match</option>
            <option value="trial">Trial</option>
            <option value="fitness">Fitness</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-pitch-900 border border-white/10 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      )}

      {isError && <EmptyState title="Couldn't load schedule" description="Error connecting to operational server." />}

      {!isLoading && !isError && filteredSessions.length === 0 && (
        <EmptyState
          icon={<CalendarDays size={28} />}
          title="No matching sessions"
          description="Try broadening your date selection or search query parameters."
          action={
            <Button onClick={() => setShowCreate(true)} className="text-xs">
              Schedule New Session
            </Button>
          }
        />
      )}

      {!isLoading && !isError && filteredSessions.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-pitch-800/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-pitch-900/80 border-b border-white/10 text-slate-400 font-mono uppercase text-2xs tracking-wider">
                <tr>
                  <th className="py-3 px-4">Time Window</th>
                  <th className="py-3 px-4">Target / Group</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Location & Field</th>
                  <th className="py-3 px-4">Coach</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Time Window */}
                    <td className="py-3.5 px-4 text-white font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-500" />
                        <span>
                          {session.startTime} – {session.endTime}
                        </span>
                      </div>
                    </td>

                    {/* Target / Group */}
                    <td className="py-3.5 px-4 font-sans font-medium text-slate-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {session.targetType === "category" ? (
                          <Layers size={14} className="text-volt-400" />
                        ) : (
                          <Users size={14} className="text-volt-400" />
                        )}
                        <span>{session.teamName || session.category || "Unassigned"}</span>
                        {session.targetType === "category" && (
                          <Badge variant="blue" size="sm">
                            Category
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Session Type */}
                    <td className="py-3.5 px-4 font-sans whitespace-nowrap">
                      <Badge variant="gray" size="sm">
                        {TYPE_LABEL[session.type]}
                      </Badge>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 font-sans text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-500" />
                        <span>
                          {session.location} {session.fieldNumber ? `(${session.fieldNumber})` : ""}
                        </span>
                      </div>
                    </td>

                    {/* Coach */}
                    <td className="py-3.5 px-4 font-sans text-slate-400 whitespace-nowrap">
                      {session.coach ? `Coach ${session.coach}` : "—"}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 font-sans whitespace-nowrap">
                      <Badge variant={STATUS_VARIANT[session.status]} size="sm">
                        {session.status}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 font-sans text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {session.status !== "cancelled" && (
                          <button
                            onClick={() => navigate(`/schedule/${session.id}/roster`)}
                            className="px-2.5 py-1 rounded bg-volt-400/10 hover:bg-volt-400/20 text-volt-400 text-xs font-semibold border border-volt-400/20 transition-all"
                          >
                            Mark Attendance
                          </button>
                        )}

                        {session.status !== "cancelled" && session.status !== "completed" && (
                          <>
                            <button
                              onClick={() => setLocationModalSession(session)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-white/5 transition-all"
                            >
                              Venue
                            </button>
                            <button
                              onClick={() => setCancelModalSession(session)}
                              className="px-2 py-1 rounded bg-ember-500/10 hover:bg-ember-500/20 text-ember-400 text-xs border border-ember-500/20 transition-all"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {canHardDelete && (
                          <button
                            onClick={() => handleDelete(session.id)}
                            className="p-1 text-slate-500 hover:text-ember-400 transition-colors"
                            title="Delete session"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Broadcast Alert Confirmation Modal */}
      {confirmBroadcastModal && (
        <Modal isOpen onClose={() => setConfirmBroadcastModal(false)} title="Broadcast Emergency Alert" size="sm">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-400" />
              <p>
                This action will send an immediate push notification to <strong>all registered guardians</strong> across the franchise. Use only for schedule delays or emergency announcements.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmBroadcastModal(false)} className="text-xs">
                Abort
              </Button>
              <Button loading={alerting} onClick={handleAlertAll} className="text-xs bg-amber-500 hover:bg-amber-600 text-pitch-900">
                Confirm Broadcast
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Session Modal */}
      {showCreate && (
        <CreateSessionModal
          franchiseId={franchiseId}
          teams={teams ?? []}
          categories={franchise?.ageGroups ?? []}
          coaches={coaches}
          isCoach={isCoach}
          currentUser={user ? { id: user.id, firstName: user.firstName, lastName: user.lastName } : undefined}
          onClose={() => setShowCreate(false)}
          onCreate={async (input) => {
            try {
              await createSession(input).unwrap();
              toast.success("Session scheduled successfully");
              setShowCreate(false);
            } catch (err: any) {
              toast.error(err?.data?.message || "Couldn't schedule session — try again");
            }
          }}
          creating={creating}
        />
      )}

      {/* Change Location Modal */}
      {locationModalSession && (
        <Modal isOpen onClose={() => setLocationModalSession(null)} title="Update Venue Location" size="sm">
          <LocationForm
            session={locationModalSession}
            saving={changingLocation}
            onSave={async (location, fieldNumber) => {
              try {
                await changeLocation({
                  id: locationModalSession.id,
                  location,
                  fieldNumber,
                  notifyGuardians: true,
                }).unwrap();
                toast.success("Location updated — guardians notified");
                setLocationModalSession(null);
              } catch {
                toast.error("Couldn't update location — try again");
              }
            }}
          />
        </Modal>
      )}

      {/* Cancel Session Modal */}
      {cancelModalSession && (
        <Modal isOpen onClose={() => setCancelModalSession(null)} title="Cancel Operational Session" size="sm">
          <CancelForm
            saving={cancelling}
            onCancel={async (reason) => {
              try {
                await cancelSession({ id: cancelModalSession.id, reason }).unwrap();
                toast.success("Session cancelled — guardians notified");
                setCancelModalSession(null);
              } catch {
                toast.error("Couldn't cancel session — try again");
              }
            }}
          />
        </Modal>
      )}
    </div>
  );
};

/* --- SUB COMPONENTS --- */

const CreateSessionModal: React.FC<{
  franchiseId: string;
  teams: { id: string; name: string; coach?: { _id: string; firstName: string; lastName: string } }[];
  categories: string[];
  coaches: { id: string; firstName: string; lastName: string }[];
  isCoach: boolean;
  currentUser?: { id: string; firstName: string; lastName: string };
  onClose: () => void;
  onCreate: (input: {
    franchiseId: string;
    targetType: "team" | "category";
    teamId?: string;
    category?: string;
    coachId?: string;
    type: Session["type"];
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    fieldNumber?: string;
  }) => void;
  creating: boolean;
}> = ({ franchiseId, teams, categories, coaches, isCoach, currentUser, onClose, onCreate, creating }) => {
  // A coach can only ever schedule a session for a team assigned to them —
  // category-wide sessions are a manager/super_admin-only concept, so a
  // coach's targetType is permanently "team" and the toggle is never shown.
  const [targetType, setTargetType] = useState<"team" | "category">(
    isCoach || teams.length > 0 ? "team" : "category",
  );
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [category, setCategory] = useState(categories[0] ?? "");
  const selectedTeam = teams.find((t) => t.id === teamId);
  const [coachId, setCoachId] = useState(isCoach ? currentUser?.id ?? "" : selectedTeam?.coach?._id ?? "");
  const [type, setType] = useState<Session["type"]>("training");
  const [date, setDate] = useState(todayStr());
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("17:30");
  const [location, setLocation] = useState("");
  const [fieldNumber, setFieldNumber] = useState("");

  const isTeamTarget = isCoach || targetType === "team";
  const hasNoAssignedTeams = isCoach && teams.length === 0;

  const handleTeamChange = (id: string) => {
    setTeamId(id);
    if (!isCoach) {
      const t = teams.find((tm) => tm.id === id);
      setCoachId(t?.coach?._id ?? "");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasNoAssignedTeams) return toast.error("You have no team assigned yet — contact your manager");
    if (isTeamTarget && !teamId) return toast.error("Select a team");
    if (!isTeamTarget && !category) return toast.error("Select a category");
    if (!isCoach && !coachId) return toast.error("Select a coach");
    if (!location || !date || !startTime || !endTime) return toast.error("Fill in all required fields");
    if (endTime <= startTime) return toast.error("End time must be after start time");

    onCreate({
      franchiseId,
      targetType: isTeamTarget ? "team" : "category",
      teamId: isTeamTarget ? teamId : undefined,
      category: !isTeamTarget ? category : undefined,
      coachId: isCoach ? currentUser?.id : coachId,
      type,
      date,
      startTime,
      endTime,
      location,
      fieldNumber: fieldNumber || undefined,
    });
  };

  return (
    <Modal isOpen onClose={onClose} title="New Session" size="md">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {!isCoach && (
          <div>
            <label className="block text-2xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Schedule Target
            </label>
            <div className="flex items-center gap-1 bg-pitch-900 p-1 rounded-lg border border-white/5 w-fit">
              {(["team", "category"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTargetType(t)}
                  className={
                    targetType === t
                      ? "px-3 py-1.5 rounded-md text-xs font-bold uppercase bg-volt-400 text-pitch-900 flex items-center gap-1.5"
                      : "px-3 py-1.5 rounded-md text-xs font-bold uppercase text-slate-400 hover:text-white flex items-center gap-1.5"
                  }
                >
                  {t === "team" ? <Users size={12} /> : <Layers size={12} />}
                  {t === "team" ? "A Team" : "Age Category"}
                </button>
              ))}
            </div>
          </div>
        )}

        {isTeamTarget ? (
          hasNoAssignedTeams ? (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-2xs">
              You have no team assigned yet. Contact your manager to get a team assigned before scheduling sessions.
            </div>
          ) : (
            <div>
              <label className="block text-2xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Team</label>
              <select
                value={teamId}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-pitch-900 border border-white/10 text-white focus:outline-none"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )
        ) : (
          <div>
            <label className="block text-2xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-pitch-900 border border-white/10 text-white focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {!isCoach && (
          <div>
            <label className="block text-2xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Assigned Coach
            </label>
            <select
              value={coachId}
              onChange={(e) => setCoachId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-pitch-900 border border-white/10 text-white focus:outline-none"
              required
            >
              <option value="">Select a coach</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-2xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
            Session Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Session["type"])}
            className="w-full px-3 py-2 rounded-lg bg-pitch-900 border border-white/10 text-white focus:outline-none"
          >
            <option value="training">Training</option>
            <option value="match">Match</option>
            <option value="trial">Trial</option>
            <option value="fitness">Fitness</option>
          </select>
        </div>

        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Start Time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          <Input label="End Time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
        </div>

        <Input label="Location / Venue" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Main Pitch" required />
        <Input label="Field Number (Optional)" value={fieldNumber} onChange={(e) => setFieldNumber(e.target.value)} placeholder="e.g. Field A" />

        <Button
          type="submit"
          loading={creating}
          disabled={hasNoAssignedTeams}
          className="w-full text-xs font-semibold"
        >
          Schedule Session
        </Button>
      </form>
    </Modal>
  );
};

const LocationForm: React.FC<{
  session: Session;
  saving: boolean;
  onSave: (location: string, fieldNumber?: string) => void;
}> = ({ session, saving, onSave }) => {
  const [location, setLocation] = useState(session.location);
  const [fieldNumber, setFieldNumber] = useState(session.fieldNumber ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!location) return toast.error("Location is required");
        onSave(location, fieldNumber || undefined);
      }}
      className="space-y-4 text-xs"
    >
      <Input label="Venue / Location" value={location} onChange={(e) => setLocation(e.target.value)} required />
      <Input label="Field Number (Optional)" value={fieldNumber} onChange={(e) => setFieldNumber(e.target.value)} />
      <p className="text-2xs text-slate-400">Guardians will receive an automated venue update push notification.</p>
      <Button type="submit" loading={saving} className="w-full text-xs font-semibold">
        Update Venue Location
      </Button>
    </form>
  );
};

const CancelForm: React.FC<{ saving: boolean; onCancel: (reason: string) => void }> = ({ saving, onCancel }) => {
  const [reason, setReason] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!reason.trim()) return toast.error("Reason is required");
        onCancel(reason.trim());
      }}
      className="space-y-4 text-xs"
    >
      <Input
        label="Reason for Cancellation"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. Adverse weather conditions"
        required
      />
      <p className="text-2xs text-slate-400">Guardians will receive an emergency cancellation push notification.</p>
      <Button type="submit" variant="danger" loading={saving} className="w-full text-xs font-semibold">
        Confirm Cancellation
      </Button>
    </form>
  );
};

export default SchedulePage;