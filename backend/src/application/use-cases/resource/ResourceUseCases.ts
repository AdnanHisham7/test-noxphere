// src/application/use-cases/resource/ResourceUseCases.ts
import mongoose from "mongoose";
import { ResourceModel } from "../../../infrastructure/database/models/Resource.model";
import { FranchiseModel } from "../../../infrastructure/database/models/Franchise.model";
import { CloudinaryService } from "../../../infrastructure/services/CloudinaryService";
import { NotFoundError, BadRequestError, ForbiddenError } from "../../../shared/errors/AppError";

// 1GB per academy. Will become a configurable value in a future release —
// kept as a single named constant so that change is a one-line edit.
export const RESOURCE_STORAGE_LIMIT_BYTES = 1 * 1024 * 1024 * 1024;

function toCard(doc: any) {
  const j = doc.toJSON ? doc.toJSON() : doc;
  const uploader = j.uploadedBy && typeof j.uploadedBy === "object" ? j.uploadedBy : undefined;
  return {
    ...j,
    uploadedBy: uploader ? uploader.id ?? uploader._id?.toString() : j.uploadedBy,
    uploadedByName: uploader ? `${uploader.firstName} ${uploader.lastName}` : undefined,
  };
}

export class ResourceUseCases {
  constructor(private cloudinaryService: CloudinaryService) {}

  private async resolveAcademyId(franchiseId: string): Promise<string> {
    const franchise = await FranchiseModel.findById(franchiseId).select("academyId").lean();
    if (!franchise) throw new NotFoundError("Franchise");
    return franchise.academyId.toString();
  }

  async getAcademyStorageUsage(academyId: string): Promise<{ usedBytes: number; limitBytes: number }> {
    const result = await ResourceModel.aggregate([
      { $match: { academyId: new mongoose.Types.ObjectId(academyId), deletedAt: { $exists: false } } },
      { $group: { _id: null, total: { $sum: "$fileSizeBytes" } } },
    ]);
    return { usedBytes: result[0]?.total ?? 0, limitBytes: RESOURCE_STORAGE_LIMIT_BYTES };
  }

  async uploadResource(input: {
    franchiseId: string;
    uploadedBy: string;
    uploadedByRole: string;
    fileBuffer: Buffer;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
  }) {
    const academyId = await this.resolveAcademyId(input.franchiseId);
    const usage = await this.getAcademyStorageUsage(academyId);
    if (usage.usedBytes + input.fileSizeBytes > usage.limitBytes) {
      const remainingMb = Math.max(0, (usage.limitBytes - usage.usedBytes) / (1024 * 1024)).toFixed(1);
      throw new BadRequestError(
        `This academy's storage is full — only ${remainingMb}MB remaining. Ask your manager to remove old resources.`,
      );
    }

    const uploaded = await this.cloudinaryService.uploadBuffer(input.fileBuffer, "coach_resource", input.fileName);

    // A manager's own upload is visible to every coach immediately —
    // requiring a manager to "verify" their own upload would be a
    // pointless loop. Coach uploads still need manager sign-off.
    const autoVerified = input.uploadedByRole === "manager";

    const resource = await ResourceModel.create({
      franchiseId: input.franchiseId,
      academyId,
      uploadedBy: input.uploadedBy,
      fileName: input.fileName,
      fileUrl: uploaded.url,
      publicId: uploaded.publicId,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      verified: autoVerified,
      verifiedBy: autoVerified ? input.uploadedBy : undefined,
      verifiedAt: autoVerified ? new Date() : undefined,
    });
    const populated = await ResourceModel.findById(resource.id).populate("uploadedBy", "firstName lastName");
    return toCard(populated);
  }

  async listForCoach(franchiseId: string, coachId: string) {
    const resources = await ResourceModel.find({
      franchiseId,
      $or: [{ uploadedBy: coachId }, { verified: true }],
    })
      .populate("uploadedBy", "firstName lastName")
      .sort({ createdAt: -1 });
    return resources.map(toCard);
  }

  async listForManager(franchiseId: string) {
    const academyId = await this.resolveAcademyId(franchiseId);
    const [resources, usage] = await Promise.all([
      ResourceModel.find({ franchiseId }).populate("uploadedBy", "firstName lastName").sort({ createdAt: -1 }),
      this.getAcademyStorageUsage(academyId),
    ]);
    return { data: resources.map(toCard), storage: usage };
  }

  async verifyResource(id: string, managerId: string) {
    const resource = await ResourceModel.findById(id);
    if (!resource) throw new NotFoundError("Resource");
    resource.verified = true;
    resource.verifiedBy = managerId as any;
    resource.verifiedAt = new Date();
    await resource.save();
    const populated = await ResourceModel.findById(id).populate("uploadedBy", "firstName lastName");
    return toCard(populated);
  }

  async deleteResource(id: string, requester: { id: string; role: string }) {
    const resource = await ResourceModel.findById(id);
    if (!resource) throw new NotFoundError("Resource");
    const isOwner = resource.uploadedBy.toString() === requester.id;
    const isManager = requester.role === "manager" || requester.role === "super_admin";
    if (!isOwner && !isManager) {
      throw new ForbiddenError("You can only remove your own resources");
    }
    resource.deletedAt = new Date();
    await resource.save();
    await this.cloudinaryService.deleteByUrl(resource.fileUrl, "coach_resource").catch(() => undefined);
  }
}