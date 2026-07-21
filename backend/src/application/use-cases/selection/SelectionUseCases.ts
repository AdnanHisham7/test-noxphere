// src/application/use-cases/selection/SelectionUseCases.ts
import { StudentModel } from "../../../infrastructure/database/models/Student.model";
import { notificationService } from "../../../infrastructure/services/NotificationService";
import { NotFoundError, BadRequestError } from "../../../shared/errors/AppError";
import { UpdateSelectionStatusDto, NotifySelectionDto } from "../../dtos/selection.dto";

const VOTE_BY_STATUS: Record<string, string> = {
  selected: "Recommended",
  shortlisted: "Recommended",
  on_hold: "On Hold",
  not_selected: "Not Recommended",
  released: "Not Recommended",
  pending: "Pending Review",
};

function toCard(doc: any) {
  const j = doc.toJSON ? doc.toJSON() : doc;
  return {
    id: j.id,
    name: `${j.firstName} ${j.lastName}`,
    position: j.position ?? "—",
    ageGroup: j.ageGroup,
    rating: j.overallRating,
    coachVote: VOTE_BY_STATUS[j.selectionStatus] ?? "Pending Review",
    coachNote: j.selectionFeedback ?? "",
    status: j.selectionStatus,
    phase: j.selectionPhase ?? null,
    photo: j.photo,
  };
}

export class SelectionUseCases {
  async listForSelection(franchiseId: string, phase?: string, ageGroup?: string) {
    if (!franchiseId) throw new BadRequestError("franchiseId is required");
    const query: Record<string, unknown> = { franchiseId, isActive: true };
    if (phase) query.selectionPhase = phase;
    if (ageGroup) query.ageGroup = ageGroup;
    const students = await StudentModel.find(query).sort({ overallRating: -1 });
    return students.map(toCard);
  }

  async updateStatus(studentId: string, dto: UpdateSelectionStatusDto, updatedBy: string) {
    const student = await StudentModel.findById(studentId);
    if (!student) throw new NotFoundError("Student");
    student.selectionStatus = dto.status;
    if (dto.feedback !== undefined) student.selectionFeedback = dto.feedback;
    if (dto.phase !== undefined) student.selectionPhase = dto.phase;
    await student.save();

    const guardianIds = student.guardianIds.map((g) => g.toString());
    if (guardianIds.length > 0) {
      await notificationService.send({
        userIds: guardianIds,
        type: "selection_updated",
        title: "Selection status updated",
        body: `${student.firstName}'s selection status is now "${dto.status.replace("_", " ")}".`,
        channels: ["push"],
      }).catch(() => undefined);
    }

    return toCard(student);
  }

  async notifyAll(dto: NotifySelectionDto, notifiedBy: string) {
    const query: Record<string, unknown> = { franchiseId: dto.franchiseId, isActive: true };
    if (dto.phase) query.selectionPhase = dto.phase;
    const students = await StudentModel.find(query);
    const guardianIds = Array.from(
      new Set(students.flatMap((s) => s.guardianIds.map((g) => g.toString()))),
    );
    if (guardianIds.length === 0) return { notified: 0 };
    await notificationService.send({
      userIds: guardianIds,
      type: "selection_updated",
      title: "Selection update",
      body: dto.message,
      franchiseId: dto.franchiseId,
      channels: ["push"],
    });
    return { notified: guardianIds.length };
  }
}
