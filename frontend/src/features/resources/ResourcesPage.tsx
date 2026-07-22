// src/features/resources/ResourcesPage.tsx
import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { FileText, Image as ImageIcon, Upload, CheckCircle2, Clock, Trash2, ExternalLink, HardDrive } from "lucide-react";
import { Button, Card, Badge, Skeleton, EmptyState } from "../../components/ui";
import { RootState } from "../../store";
import { useCurrentFranchiseId } from "../../hooks/useCurrentFranchiseId";
import {
  useGetResourcesQuery,
  useUploadResourceMutation,
  useVerifyResourceMutation,
  useDeleteResourceMutation,
  type Resource,
} from "../../store/api/resourcesApi";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_BYTES = 20 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

const ResourcesPage: React.FC = () => {
  const franchiseId = useCurrentFranchiseId();
  const { user } = useSelector((s: RootState) => s.auth);
  const isManager = user?.role === "manager" || user?.role === "super_admin";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError } = useGetResourcesQuery(
    { franchiseId: franchiseId ?? "" },
    { skip: !franchiseId },
  );
  const [uploadResource, { isLoading: uploading }] = useUploadResourceMutation();
  const [verifyResource] = useVerifyResourceMutation();
  const [deleteResource] = useDeleteResourceMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFileSelected = async (file: File | undefined) => {
    if (!file || !franchiseId) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only PDF, Word, JPEG, PNG, WEBP or GIF files are allowed");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File is too large — the limit is 20MB per file");
      return;
    }
    try {
      await uploadResource({ franchiseId, file }).unwrap();
      toast.success(isManager ? "Resource uploaded" : "Resource uploaded — visible to you until a manager verifies it");
    } catch (err: any) {
      toast.error(err?.data?.message || "Upload failed — try again");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await verifyResource(id).unwrap();
      toast.success("Resource verified — now visible to every coach");
    } catch {
      toast.error("Couldn't verify — try again");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteResource(id).unwrap();
      toast.success("Resource removed");
    } catch {
      toast.error("Couldn't remove — try again");
    } finally {
      setDeletingId(null);
    }
  };

  const storagePercent = data?.storage
    ? Math.min(100, Math.round((data.storage.usedBytes / data.storage.limitBytes) * 100))
    : 0;
  const storageNearFull = storagePercent >= 90;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-black text-2xl text-white uppercase tracking-wide">Resources</h1>
          <p className="text-sm text-slate-400 mt-1">
            {isManager
              ? "Every document and image uploaded by your coaches, for review and verification."
              : "Your uploads, plus anything a manager has verified for the whole coaching staff."}
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            className="hidden"
            onChange={(e) => handleFileSelected(e.target.files?.[0])}
          />
          <Button icon={<Upload size={15} />} loading={uploading} onClick={() => fileInputRef.current?.click()}>
            Upload resource
          </Button>
        </div>
      </div>

      {/* Storage bar — manager/super_admin only */}
      {isManager && data?.storage && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-white font-semibold">
              <HardDrive size={15} className="text-volt-400" />
              Academy storage
            </div>
            <span className={`text-xs font-mono ${storageNearFull ? "text-ember-400" : "text-slate-400"}`}>
              {formatBytes(data.storage.usedBytes)} of {formatBytes(data.storage.limitBytes)} used
            </span>
          </div>
          <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${storageNearFull ? "bg-ember-500" : "bg-volt-400"}`}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
          {storageNearFull && (
            <p className="text-2xs text-ember-400 mt-2">
              Storage is almost full — remove old resources to free up space for new uploads.
            </p>
          )}
        </Card>
      )}

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {isError && <EmptyState title="Couldn't load resources" description="Try refreshing the page." />}

      {!isLoading && !isError && (!data || data.data.length === 0) && (
        <EmptyState
          icon={<Upload size={28} />}
          title="No resources yet"
          description={isManager ? "Once coaches upload documents, they'll show up here for review." : "Upload session plans, drills, or reference documents — they'll stay visible to just you until a manager verifies them."}
        />
      )}

      <div className="space-y-2">
        {data?.data.map((resource) => (
          <ResourceRow
            key={resource.id}
            resource={resource}
            isManager={isManager}
            isOwner={resource.uploadedBy === user?.id}
            deleting={deletingId === resource.id}
            onVerify={() => handleVerify(resource.id)}
            onDelete={() => handleDelete(resource.id)}
          />
        ))}
      </div>
    </div>
  );
};

const ResourceRow: React.FC<{
  resource: Resource;
  isManager: boolean;
  isOwner: boolean;
  deleting: boolean;
  onVerify: () => void;
  onDelete: () => void;
}> = ({ resource, isManager, isOwner, deleting, onVerify, onDelete }) => {
  const isPdf = resource.mimeType === "application/pdf";
  const isDoc = resource.mimeType.includes("word") || resource.mimeType === "application/msword";
  const canDelete = isManager || isOwner;

  return (
    <Card className="p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center shrink-0 text-slate-400">
        {isPdf || isDoc ? <FileText size={18} /> : <ImageIcon size={18} />}
      </div>
      <div className="flex-1 min-w-0">
        <a
          href={resource.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-white hover:text-volt-400 transition-colors truncate flex items-center gap-1.5"
        >
          {resource.fileName}
          <ExternalLink size={12} className="text-slate-500" />
        </a>
        <p className="text-2xs text-slate-500 mt-0.5">
          {resource.uploadedByName ?? "Unknown"} · {formatBytes(resource.fileSizeBytes)} ·{" "}
          {new Date(resource.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
      {resource.verified ? (
        <Badge variant="green" size="sm">
          <span className="inline-flex items-center gap-1"><CheckCircle2 size={11} /> Verified</span>
        </Badge>
      ) : (
        <Badge variant="yellow" size="sm">
          <span className="inline-flex items-center gap-1"><Clock size={11} /> Pending review</span>
        </Badge>
      )}
      {isManager && !resource.verified && (
        <Button size="sm" variant="secondary" onClick={onVerify}>Verify</Button>
      )}
      {canDelete && (
        <button
          onClick={onDelete}
          disabled={deleting}
          className="text-slate-500 hover:text-ember-400 transition-colors p-1.5 disabled:opacity-50"
          aria-label="Remove resource"
        >
          <Trash2 size={15} />
        </button>
      )}
    </Card>
  );
};

export default ResourcesPage;