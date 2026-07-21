// src/features/schedule/SchedulePage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { CalendarDays, Plus, MapPin, Trash2, Bell, Users, Layers } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button, Card, Badge, Modal, Input, Skeleton, EmptyState } from "../../components/ui";
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

  const [dateFilter, setDateFilter] = useState<"all" | string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [locationModalSession, setLocationModalSession] = useState<Session | null>(null);
  const [cancelModalSession, setCancelModalSession] = useState<Session | null>(null);

  const { data: allTeams } = useListTeamsQuery({ franchiseId: franchiseId ?? "" }, { skip: !franchiseId });
  // A coach only ever schedules for the team(s) they've been assigned —
  // not every team in the franchise.
  const teams = isCoach ? (allTeams ?? []).filter((t) => t.coach?._id === user?.id) : allTeams ?? [];
  const { data: franchise } = useGetFranchiseByIdQuery(franchiseId ?? "", { skip: !franchiseId });
  const { data: coachesResult } = useGetUsersQuery(
    { roles: "coach", franchiseId: franchiseId ?? "", isActive: "true", limit: 100 },
    { skip: !franchiseId || isCoach },
  );
  const coaches = coachesResult?.data ?? [];

  const { data: sessions = [], isLoading, isError } = useGetSessionsQuery(
    {
      franchiseId: franchiseId ?? "",
      ...(isCoach && user?.id ? { coachId: user.id } : {}),
      ...(dateFilter !== "all" && { from: dateFilter, to: dateFilter }),
    },
    { skip: !franchiseId },
  );

  const sessionsList = Array.isArray(sessions) ? sessions : [];
  const uniqueDates = Array.from(new Set(sessionsList.map((s) => s.date))).sort();
  
  const [createSession, { isLoading: creating }] = useCreateSessionMutation();
  const [cancelSession, { isLoading: cancelling }] = useCancelSessionMutation();
  const [changeLocation, { isLoading: changingLocation }] = useChangeSessionLocationMutation();
  const [deleteSession] = useDeleteSessionMutation();
  const [alertAllGuardians, { isLoading: alerting }] = useAlertAllGuardiansMutation();

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this session permanently? This cannot be undone.")) return;
    try {
      await deleteSession(id).unwrap();
      toast.success("Session removed");
    } catch {
      toast.error("Couldn't remove session — try again");
    }
  };

  const handleAlertAll = async () => {
    if (!franchiseId) return;
    try {
      const res = await alertAllGuardians({ franchiseId }).unwrap();
      toast.success(`Notified ${res.notified} guardian${res.notified === 1 ? "" : "s"}`);
    } catch {
      toast.error("Couldn't send alert — try again");
    }
  };

  if (!franchiseId) {
    return (
      <EmptyState
        icon={<CalendarDays size={28} />}
        title="No franchise selected"
        description="Select a franchise from the top bar to manage its schedule."
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wide">Schedule</h1>
          <p className="text-sm text-slate-400 mt-1">
            {isLoading ? "Loading sessions…" : `${sessions?.length ?? 0} sessions scheduled`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canBroadcast && (
            <Button
              variant="secondary"
              icon={<Bell size={16} />}
              loading={alerting}
              onClick={handleAlertAll}
            >
              Alert all guardians
            </Button>
          )}
          <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
            New session
          </Button>
        </div>
      </div>

      {/* Date filter chips */}
      {uniqueDates.length > 0 && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <button
            onClick={() => setDateFilter("all")}
            className={
              dateFilter === "all"
                ? "px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide bg-volt-400 text-pitch-900"
                : "px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide border border-white/10 text-slate-400 hover:border-white/30 hover:text-white transition-colors"
            }
          >
            All dates
          </button>
          {uniqueDates.map((d) => (
            <button
              key={d}
              onClick={() => setDateFilter(d)}
              className={
                dateFilter === d
                  ? "px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide bg-volt-400 text-pitch-900"
                  : "px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide border border-white/10 text-slate-400 hover:border-white/30 hover:text-white transition-colors"
              }
            >
              {new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      )}

      {isError && (
        <EmptyState title="Couldn't load the schedule" description="Please try again shortly." />
      )}

      {!isLoading && sessionsList.length === 0 && (
        <EmptyState
          icon={<CalendarDays size={28} />}
          title="No sessions scheduled"
          description="Schedule your first training session or match."
          action={<Button onClick={() => setShowCreate(true)}>New session</Button>}
        />
      )}

      {!isLoading && sessionsList.length > 0 && (
        <div className="space-y-3">
          {sessionsList.map((session) => (
            <Card key={session.id} className="p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-start gap-4">
                  <div
                    className="w-1 self-stretch rounded-full flex-shrink-0"
                    style={{ backgroundColor: session.categoryColor ?? "#ccff00" }}
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                        {session.targetType === "category" ? (
                          <>
                            <Layers size={14} className="text-volt-400" />
                            {session.category ?? "Category"}
                          </>
                        ) : (
                          <>
                            <Users size={14} className="text-volt-400" />
                            {session.teamName ?? "Team"}
                          </>
                        )}
                      </h3>
                      {session.targetType === "category" && (
                        <Badge variant="blue" size="sm">Category</Badge>
                      )}
                      <Badge variant="gray" size="sm">{TYPE_LABEL[session.type]}</Badge>
                      <Badge variant={STATUS_VARIANT[session.status]} size="sm">
                        {session.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      {new Date(session.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                      {" · "}
                      {session.startTime}–{session.endTime}
                      {session.coach ? ` · Coach ${session.coach}` : ""}
                    </p>
                    <p className="text-sm text-slate-300 mt-2 flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-500" />
                      {session.location}{session.fieldNumber ? ` (${session.fieldNumber})` : ""}
                    </p>
                    {session.status === "cancelled" && session.cancelReason && (
                      <p className="text-xs text-ember-400 mt-1.5">Cancelled: {session.cancelReason}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {session.status !== "cancelled" && (
                    <button
                      onClick={() => navigate(`/schedule/${session.id}/roster`)}
                      className="text-xs text-volt-400 hover:text-volt-300 transition-colors px-2 py-1"
                    >
                      Mark attendance & performance
                    </button>
                  )}
                  {session.status !== "cancelled" && session.status !== "completed" && (
                    <>
                      <button
                        onClick={() => setLocationModalSession(session)}
                        className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1"
                      >
                        Change location
                      </button>
                      <button
                        onClick={() => setCancelModalSession(session)}
                        className="text-xs text-ember-400 hover:text-ember-300 transition-colors px-2 py-1"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {canHardDelete && (
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="text-slate-500 hover:text-ember-400 transition-colors p-1"
                      aria-label="Delete session"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

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
              toast.success("Session scheduled");
              setShowCreate(false);
            } catch (err: any) {
              toast.error(err?.data?.message || "Couldn't schedule session — try again");
            }
          }}
          creating={creating}
        />
      )}

      {locationModalSession && (
        <Modal isOpen onClose={() => setLocationModalSession(null)} title="Change location" size="sm">
          <LocationForm
            session={locationModalSession}
            saving={changingLocation}
            onSave={async (location, fieldNumber) => {
              try {
                await changeLocation({ id: locationModalSession.id, location, fieldNumber, notifyGuardians: true }).unwrap();
                toast.success("Location updated — guardians notified");
                setLocationModalSession(null);
              } catch {
                toast.error("Couldn't update location — try again");
              }
            }}
          />
        </Modal>
      )}

      {cancelModalSession && (
        <Modal isOpen onClose={() => setCancelModalSession(null)} title="Cancel session" size="sm">
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

const CreateSessionModal: React.FC<{
  franchiseId: string;
  teams: { id: string; name: string; coach?: { _id: string; firstName: string; lastName: string } }[];
  categories: string[];
  coaches: { id: string; firstName: string; lastName: string }[];
  isCoach: boolean;
  currentUser?: { id: string; firstName: string; lastName: string };
  onClose: () => void;
  onCreate: (input: {
    franchiseId: string; targetType: "team" | "category"; teamId?: string; category?: string; coachId?: string;
    type: Session["type"]; date: string; startTime: string; endTime: string; location: string; fieldNumber?: string;
  }) => void;
  creating: boolean;
}> = ({ franchiseId, teams, categories, coaches, isCoach, currentUser, onClose, onCreate, creating }) => {
  const [targetType, setTargetType] = useState<"team" | "category">(teams.length > 0 ? "team" : "category");
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

  const handleTeamChange = (id: string) => {
    setTeamId(id);
    if (!isCoach) {
      const t = teams.find((tm) => tm.id === id);
      setCoachId(t?.coach?._id ?? "");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetType === "team" && !teamId) {
      toast.error("Select a team");
      return;
    }
    if (targetType === "category" && !category) {
      toast.error("Select a category");
      return;
    }
    if (!isCoach && !coachId) {
      toast.error("Select a coach");
      return;
    }
    if (!location || !date || !startTime || !endTime) {
      toast.error("Fill in all required fields");
      return;
    }
    if (endTime <= startTime) {
      toast.error("End time must be after start time");
      return;
    }
    onCreate({
      franchiseId,
      targetType,
      teamId: targetType === "team" ? teamId : undefined,
      category: targetType === "category" ? category : undefined,
      coachId: isCoach ? currentUser?.id : coachId,
      type,
      date,
      startTime,
      endTime,
      location,
      fieldNumber: fieldNumber || undefined,
    });
  };

  if (teams.length === 0 && categories.length === 0) {
    return (
      <Modal isOpen onClose={onClose} title="New session" size="sm">
        <EmptyState
          title="No teams or categories yet"
          description={isCoach ? "You aren't assigned to a team yet — ask your manager to assign one." : "Create a team, or configure age-group categories on this franchise, before scheduling sessions."}
        />
      </Modal>
    );
  }

  return (
    <Modal isOpen onClose={onClose} title="New session" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Schedule for</label>
          <div className="flex items-center gap-1 bg-pitch-800 p-1 rounded border border-white/5 w-fit">
            {(["team", "category"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTargetType(t)}
                className={
                  targetType === t
                    ? "px-4 py-1.5 rounded text-xs font-display font-bold uppercase tracking-wide bg-volt-400 text-pitch-900 flex items-center gap-1.5"
                    : "px-4 py-1.5 rounded text-xs font-display font-bold uppercase tracking-wide text-slate-500 hover:text-white flex items-center gap-1.5"
                }
              >
                {t === "team" ? <Users size={12} /> : <Layers size={12} />}
                {t === "team" ? "A team" : "A category"}
              </button>
            ))}
          </div>
          <p className="text-2xs text-slate-500 mt-1.5">
            {targetType === "team"
              ? "Only players on this team are assigned to the session."
              : "Every active player in this age group is assigned — including players not yet on a team."}
          </p>
        </div>

        {targetType === "team" ? (
          teams.length === 0 ? (
            <EmptyState
              title={isCoach ? "No team assigned" : "No teams yet"}
              description={isCoach ? "Ask your manager to assign you to a team." : "Create a team first from the Teams page."}
            />
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Team</label>
              <select value={teamId} onChange={(e) => handleTeamChange(e.target.value)} className="input !w-full">
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )
        ) : categories.length === 0 ? (
          <EmptyState title="No categories configured" description="Add age groups to this franchise first (Franchises page)." />
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input !w-full">
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {!isCoach && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Coach</label>
            <select value={coachId} onChange={(e) => setCoachId(e.target.value)} className="input !w-full" required>
              <option value="">Select a coach</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Session type</label>
          <select value={type} onChange={(e) => setType(e.target.value as Session["type"])} className="input !w-full">
            <option value="training">Training</option>
            <option value="match">Match</option>
            <option value="trial">Trial</option>
            <option value="fitness">Fitness</option>
          </select>
        </div>
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          <Input label="End time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
        </div>
        <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Downtown Field" required />
        <Input label="Field number (optional)" value={fieldNumber} onChange={(e) => setFieldNumber(e.target.value)} placeholder="e.g. Field A" />
        <Button type="submit" loading={creating} className="w-full">Schedule session</Button>
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
        if (!location) {
          toast.error("Location is required");
          return;
        }
        onSave(location, fieldNumber || undefined);
      }}
      className="space-y-4"
    >
      <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} required />
      <Input label="Field number (optional)" value={fieldNumber} onChange={(e) => setFieldNumber(e.target.value)} />
      <p className="text-xs text-slate-500">Guardians of this team will be notified of the change.</p>
      <Button type="submit" loading={saving} className="w-full">Update location</Button>
    </form>
  );
};

const CancelForm: React.FC<{ saving: boolean; onCancel: (reason: string) => void }> = ({ saving, onCancel }) => {
  const [reason, setReason] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!reason.trim()) {
          toast.error("Please provide a reason");
          return;
        }
        onCancel(reason.trim());
      }}
      className="space-y-4"
    >
      <Input label="Reason for cancellation" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Heavy rain forecast" required />
      <p className="text-xs text-slate-500">Guardians of this team will be notified immediately.</p>
      <Button type="submit" variant="danger" loading={saving} className="w-full">Cancel session</Button>
    </form>
  );
};

export default SchedulePage;