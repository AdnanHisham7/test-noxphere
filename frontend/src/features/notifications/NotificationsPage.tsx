// src/features/notifications/NotificationsPage.tsx
import React, { useState } from "react";
import { Bell, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { Card, Badge, Button, Input, Modal, Skeleton, EmptyState } from "../../components/ui";
import { useCurrentFranchiseId } from "../../hooks/useCurrentFranchiseId";
import {
  useListNotificationsQuery,
  useCreateNotificationMutation,
  AdminNotification,
} from "../../store/api/adminNotificationsApi";

const AUDIENCE_LABEL: Record<AdminNotification["audience"], string> = {
  all: "Everyone",
  guardians: "Guardians",
  coaches: "Coaches",
  students: "Students",
  team: "One team",
};

const NotificationsPage: React.FC = () => {
  const franchiseId = useCurrentFranchiseId();
  const { data, isLoading, isError } = useListNotificationsQuery(
    { franchiseId: franchiseId ?? "" },
    { skip: !franchiseId },
  );
  const [showCompose, setShowCompose] = useState(false);

  if (!franchiseId) {
    return <EmptyState icon={<Bell size={28} />} title="No franchise selected" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wide">Notifications</h1>
          <p className="text-sm text-slate-400 mt-1">Updates sent to guardians, coaches and students</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowCompose(true)}>
          Compose
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      )}

      {isError && <EmptyState title="Couldn't load notifications" description="Please try again shortly." />}

      {data && data.items.length === 0 && (
        <EmptyState
          icon={<Bell size={28} />}
          title="No notifications sent yet"
          description="Compose your first update to guardians, coaches or students."
          action={<Button onClick={() => setShowCompose(true)}>Compose</Button>}
        />
      )}

      <div className="space-y-3">
        {(data?.items ?? []).map((n) => (
          <Card key={n.id} className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-display font-semibold text-white">{n.title}</h3>
              <Badge variant="blue">{AUDIENCE_LABEL[n.audience]}</Badge>
            </div>
            <p className="text-sm text-slate-400 mt-2">{n.body}</p>
            <p className="text-xs text-slate-600 font-mono mt-3">
              {new Date(n.createdAt).toLocaleString()} · {n.readBy.length} read
            </p>
          </Card>
        ))}
      </div>

      {franchiseId && (
        <ComposeModal isOpen={showCompose} onClose={() => setShowCompose(false)} franchiseId={franchiseId} />
      )}
    </div>
  );
};

const ComposeModal: React.FC<{ isOpen: boolean; onClose: () => void; franchiseId: string }> = ({
  isOpen,
  onClose,
  franchiseId,
}) => {
  const [createNotification, { isLoading }] = useCreateNotificationMutation();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<AdminNotification["audience"]>("all");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    try {
      await createNotification({ franchiseId, title, body, audience }).unwrap();
      toast.success("Notification sent");
      onClose();
      setTitle("");
      setBody("");
    } catch {
      toast.error("Couldn't send notification — try again");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compose notification" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <div className="space-y-1.5">
          <label className="label">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="input resize-none"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="label">Audience</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as AdminNotification["audience"])}
            className="input"
          >
            <option value="all">Everyone</option>
            <option value="guardians">Guardians</option>
            <option value="coaches">Coaches</option>
            <option value="students">Students</option>
          </select>
        </div>
        <Button type="submit" loading={isLoading} className="w-full">
          Send
        </Button>
      </form>
    </Modal>
  );
};

export default NotificationsPage;
