// src/application/use-cases/transfer/TransferUseCases.ts
import { TransferListingModel } from "../../../infrastructure/database/models/TransferListing.model";
import { TransferRequestModel } from "../../../infrastructure/database/models/TransferRequest.model";
import { StudentModel } from "../../../infrastructure/database/models/Student.model";
import { FranchiseModel } from "../../../infrastructure/database/models/Franchise.model";
import { AcademyModel } from "../../../infrastructure/database/models/Academy.model";
import { notificationService } from "../../../infrastructure/services/NotificationService";
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from "../../../shared/errors/AppError";

interface ListPlayerInput {
  studentId: string;
  managerId: string;
  price: number;
  currency?: string;
  note?: string;
  skills?: string[];
  highlights?: string[];
  isPublic?: boolean;
  expiresAt?: string;
}

function listingCard(listing: any) {
  const j = listing.toJSON ? listing.toJSON() : listing;
  const student = j.studentId && typeof j.studentId === "object" ? j.studentId : undefined;
  const academy = j.fromFranchiseId && typeof j.fromFranchiseId === "object" ? j.fromFranchiseId : undefined;
  return {
    ...j,
    studentId: student ? student.id ?? student._id?.toString() : j.studentId,
    fromFranchiseId: academy ? academy.id ?? academy._id?.toString() : j.fromFranchiseId,
    fromFranchise: academy ? { id: academy.id ?? academy._id?.toString(), name: academy.name } : undefined,
    student: student
      ? {
          id: student.id ?? student._id?.toString(),
          firstName: student.firstName,
          lastName: student.lastName,
          position: student.position,
          ageGroup: student.ageGroup,
          photo: student.photo,
          overallRating: student.overallRating,
          attendancePercentage: student.attendancePercentage,
        }
      : undefined,
  };
}

export class TransferUseCases {
  /**
   * Every listing is denormalized with its academyId at creation time so
   * public browsing can filter without a join per request. The toggle
   * itself lives on Academy and can change after a listing exists, so we
   * always re-check the *current* Academy state here rather than trusting
   * the stored academyId to mean "still enabled".
   */
  private async getDisabledAcademyIds(): Promise<string[]> {
    const disabled = await AcademyModel.find({ transferWallEnabled: false }).select("_id").lean();
    return disabled.map((a) => a._id.toString());
  }

  private async resolveAcademyForFranchise(franchiseId: string) {
    const franchise = await FranchiseModel.findById(franchiseId).select("academyId").lean();
    if (!franchise) throw new NotFoundError("Franchise");
    const academy = await AcademyModel.findById(franchise.academyId).select("transferWallEnabled").lean();
    if (!academy) throw new NotFoundError("Academy");
    return academy;
  }

  async getPublicListings(filters: {
    page: number;
    limit: number;
    search?: string;
    minRating?: number;
    maxPrice?: number;
    position?: string;
    ageGroup?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const query: Record<string, unknown> = { isActive: true, isPublic: true };
    if (filters.minRating) query.overallRating = { $gte: filters.minRating };
    if (filters.maxPrice) query.price = { $lte: filters.maxPrice };

    const disabledAcademyIds = await this.getDisabledAcademyIds();
    if (disabledAcademyIds.length > 0) {
      query.academyId = { $nin: disabledAcademyIds };
    }

    const studentMatch: Record<string, unknown> = {};
    if (filters.position) studentMatch.position = filters.position;
    if (filters.ageGroup) studentMatch.ageGroup = filters.ageGroup;
    if (filters.search) {
      studentMatch.$or = [
        { firstName: { $regex: filters.search, $options: "i" } },
        { lastName: { $regex: filters.search, $options: "i" } },
      ];
    }

    let studentIds: string[] | undefined;
    if (Object.keys(studentMatch).length > 0) {
      const students = await StudentModel.find(studentMatch).select("_id");
      studentIds = students.map((s) => s._id.toString());
      query.studentId = { $in: studentIds };
    }

    const [listings, total] = await Promise.all([
      TransferListingModel.find(query)
        .populate("studentId", "firstName lastName position ageGroup photo overallRating attendancePercentage")
        .populate("fromFranchiseId", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      TransferListingModel.countDocuments(query),
    ]);

    return {
      data: listings.map(listingCard),
      total,
      page,
      limit,
    };
  }

  async getListingById(id: string) {
    const listing = await TransferListingModel.findById(id)
      .populate(
        "studentId",
        "firstName lastName position ageGroup photo overallRating attendancePercentage medicalInfo",
      )
      .populate("fromFranchiseId", "name");
    if (!listing) throw new NotFoundError("Transfer listing");
    const academy = await AcademyModel.findById(listing.academyId).select("transferWallEnabled").lean();
    if (!academy || !academy.transferWallEnabled) throw new NotFoundError("Transfer listing");
    listing.viewCount += 1;
    await listing.save();
    return listingCard(listing);
  }

  async listPlayer(input: ListPlayerInput) {
    if (!input.price || input.price <= 0) {
      throw new BadRequestError("A valid asking price is required");
    }
    const student = await StudentModel.findById(input.studentId);
    if (!student) throw new NotFoundError("Student");

    const academy = await this.resolveAcademyForFranchise(student.franchiseId.toString());
    if (!academy.transferWallEnabled) {
      throw new ForbiddenError("The transfer wall is disabled for your academy — contact your platform admin");
    }

    const existing = await TransferListingModel.findOne({ studentId: input.studentId, isActive: true });
    if (existing) throw new ConflictError("This player is already listed on the transfer wall");

    const listing = await TransferListingModel.create({
      studentId: input.studentId,
      fromFranchiseId: student.franchiseId,
      academyId: academy._id,
      fromManagerId: input.managerId,
      price: input.price,
      currency: input.currency ?? "INR",
      note: input.note,
      skills: input.skills ?? [],
      highlights: input.highlights ?? [],
      overallRating: student.overallRating,
      isPublic: input.isPublic ?? true,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    });

    student.transferStatus = "listed";
    student.transferPrice = input.price;
    student.transferNote = input.note;
    student.transferListedAt = new Date();
    await student.save();

    return listingCard(listing);
  }

  async updateListing(id: string, managerId: string, updates: Partial<ListPlayerInput>) {
    const listing = await TransferListingModel.findById(id);
    if (!listing) throw new NotFoundError("Transfer listing");
    if (listing.fromManagerId.toString() !== managerId) {
      throw new ForbiddenError("You can only edit your own listings");
    }
    if (updates.price !== undefined) {
      if (updates.price <= 0) throw new BadRequestError("A valid asking price is required");
      listing.price = updates.price;
    }
    if (updates.note !== undefined) listing.note = updates.note;
    if (updates.skills !== undefined) listing.skills = updates.skills;
    if (updates.highlights !== undefined) listing.highlights = updates.highlights;
    if (updates.isPublic !== undefined) listing.isPublic = updates.isPublic;
    if (updates.expiresAt !== undefined) listing.expiresAt = new Date(updates.expiresAt);
    await listing.save();

    if (updates.price !== undefined) {
      await StudentModel.findByIdAndUpdate(listing.studentId, { transferPrice: updates.price });
    }
    return listingCard(listing);
  }

  async removeListing(id: string, managerId: string): Promise<void> {
    const listing = await TransferListingModel.findById(id);
    if (!listing) throw new NotFoundError("Transfer listing");
    if (listing.fromManagerId.toString() !== managerId) {
      throw new ForbiddenError("You can only remove your own listings");
    }
    listing.isActive = false;
    await listing.save();
    await StudentModel.findByIdAndUpdate(listing.studentId, {
      transferStatus: "not_listed",
      transferPrice: undefined,
      transferListedAt: undefined,
    });
    await TransferRequestModel.updateMany(
      { listingId: id, status: "pending" },
      { status: "cancelled", respondedAt: new Date() },
    );
  }

  async requestTransfer(input: {
    listingId: string;
    toManagerId: string;
    offeredPrice: number;
    message?: string;
  }) {
    const listing = await TransferListingModel.findById(input.listingId);
    if (!listing || !listing.isActive) throw new NotFoundError("Transfer listing");
    const academy = await AcademyModel.findById(listing.academyId).select("transferWallEnabled").lean();
    if (!academy || !academy.transferWallEnabled) throw new NotFoundError("Transfer listing");
    if (listing.fromManagerId.toString() === input.toManagerId) {
      throw new BadRequestError("You cannot request your own listed player");
    }
    if (!input.offeredPrice || input.offeredPrice <= 0) {
      throw new BadRequestError("A valid offer price is required");
    }
    const existing = await TransferRequestModel.findOne({
      listingId: input.listingId,
      toManagerId: input.toManagerId,
      status: "pending",
    });
    if (existing) throw new ConflictError("You already have a pending request for this player");

    const request = await TransferRequestModel.create({
      listingId: input.listingId,
      studentId: listing.studentId,
      fromFranchiseId: listing.fromFranchiseId,
      fromManagerId: listing.fromManagerId,
      toManagerId: input.toManagerId,
      offeredPrice: input.offeredPrice,
      currency: listing.currency,
      message: input.message,
    });

    await notificationService
      .send({
        userIds: [listing.fromManagerId.toString()],
        type: "transfer_request",
        title: "New transfer request",
        body: `You have a new offer of ${listing.currency} ${input.offeredPrice} for a listed player.`,
        channels: ["push", "email"],
      })
      .catch(() => undefined);

    return request.toJSON();
  }

  async respondToTransfer(
    requestId: string,
    managerId: string,
    action: "accept" | "reject",
    responseNote?: string,
  ) {
    if (action !== "accept" && action !== "reject") {
      throw new BadRequestError("action must be 'accept' or 'reject'");
    }
    const request = await TransferRequestModel.findById(requestId);
    if (!request) throw new NotFoundError("Transfer request");
    if (request.fromManagerId.toString() !== managerId) {
      throw new ForbiddenError("Only the listing owner can respond to this request");
    }
    if (request.status !== "pending") {
      throw new ConflictError("This request has already been responded to");
    }

    request.status = action === "accept" ? "accepted" : "rejected";
    request.responseNote = responseNote;
    request.respondedAt = new Date();

    if (action === "accept") {
      request.completedAt = new Date();
      await StudentModel.findByIdAndUpdate(request.studentId, {
        transferStatus: "sold",
        coachId: undefined,
        teamId: undefined,
      });
      await TransferListingModel.findByIdAndUpdate(request.listingId, { isActive: false });
      await TransferRequestModel.updateMany(
        { listingId: request.listingId, status: "pending", _id: { $ne: request.id } },
        { status: "cancelled", respondedAt: new Date() },
      );
    }
    await request.save();

    await notificationService
      .send({
        userIds: [request.toManagerId.toString()],
        type: action === "accept" ? "transfer_accepted" : "transfer_rejected",
        title: `Transfer request ${action}ed`,
        body: responseNote || `Your transfer request has been ${action}ed.`,
        channels: ["push", "email"],
      })
      .catch(() => undefined);

    return request.toJSON();
  }

  async getManagerListings(managerId: string, opts: { page: number; limit: number }) {
    const page = opts.page || 1;
    const limit = opts.limit || 20;
    const query = { fromManagerId: managerId, isActive: true };
    const [listings, total] = await Promise.all([
      TransferListingModel.find(query)
        .populate("studentId", "firstName lastName position ageGroup photo overallRating")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      TransferListingModel.countDocuments(query),
    ]);
    return { data: listings.map(listingCard), total, page, limit };
  }

  async getIncomingRequests(managerId: string) {
    const requests = await TransferRequestModel.find({ fromManagerId: managerId })
      .populate("studentId", "firstName lastName position ageGroup photo")
      .populate("toManagerId", "firstName lastName email")
      .sort({ createdAt: -1 });
    return requests.map((r) => r.toJSON());
  }

  async getOutgoingRequests(managerId: string) {
    const requests = await TransferRequestModel.find({ toManagerId: managerId })
      .populate("studentId", "firstName lastName position ageGroup photo")
      .populate("fromManagerId", "firstName lastName email")
      .sort({ createdAt: -1 });
    return requests.map((r) => r.toJSON());
  }
}