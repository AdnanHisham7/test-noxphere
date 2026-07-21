import { PerformanceModel } from "../../../infrastructure/database/models/Performance.model";
import { BadRequestError } from "../../../shared/errors/AppError";

export class AdminPerformanceUseCases {
  async list(franchiseId: string, filters: { teamId?: string; studentId?: string } = {}) {
    if (!franchiseId) throw new BadRequestError("franchiseId is required");
    const query: Record<string, unknown> = { franchiseId };
    if (filters.teamId) query.teamId = filters.teamId;
    if (filters.studentId) query.studentId = filters.studentId;

    return PerformanceModel.find(query)
      .populate("studentId", "firstName lastName photo")
      .populate("coachId", "firstName lastName")
      .sort({ sessionDate: -1 })
      .limit(200)
      .lean();
  }
}
