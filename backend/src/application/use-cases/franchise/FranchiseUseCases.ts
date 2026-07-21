// src/application/use-cases/franchise/FranchiseUseCases.ts
import { FranchiseModel, FranchiseDocument } from "../../../infrastructure/database/models/Franchise.model";
import { AcademyModel } from "../../../infrastructure/database/models/Academy.model";
import { NotFoundError, ConflictError } from "../../../shared/errors/AppError";
import { CreateFranchiseDto, UpdateFranchiseDto } from "../../dtos/franchise.dto";

function toCard(doc: FranchiseDocument) {
  const j = doc.toJSON() as any;
  return {
    id: j.id,
    academyId: j.academyId?.toString ? j.academyId.toString() : j.academyId,
    name: j.name,
    franchiseCode: j.franchiseCode,
    managerId: j.managerId?.toString ? j.managerId.toString() : j.managerId,
    location: j.location,
    ageGroups: j.ageGroups,
    maxStudents: j.maxStudents,
    isActive: j.isActive,
    alertBeforeMinutes: j.alertBeforeMinutes,
    notificationAlertAfterMinutes: j.notificationAlertAfterMinutes,
    skillParameters: j.skillParameters,
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
  };
}

async function generateCode(baseName: string): Promise<string> {
  const prefix = baseName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  let code = `${prefix}-F-${random}`;
  let exists = await FranchiseModel.findOne({ franchiseCode: code });
  let counter = 1;
  while (exists) {
    code = `${prefix}-F-${random}${counter}`;
    exists = await FranchiseModel.findOne({ franchiseCode: code });
    counter++;
  }
  return code;
}

export class FranchiseUseCases {
  async list(filters: { academyId?: string; isActive?: boolean } = {}) {
    const query: Record<string, unknown> = {};
    if (filters.academyId) query.academyId = filters.academyId;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    const franchises = await FranchiseModel.find(query)
      .populate("academyId", "name")
      .sort({ createdAt: 1 });
    return franchises.map((f) => {
      const card = toCard(f);
      const academy = (f as any).academyId;
      return {
        ...card,
        academyId: academy?._id ? academy._id.toString() : card.academyId,
        academyName: academy?.name,
      };
    });
  }

  async getById(id: string) {
    const franchise = await FranchiseModel.findById(id);
    if (!franchise) throw new NotFoundError("Franchise");
    return toCard(franchise);
  }

  async create(dto: CreateFranchiseDto) {
    const academy = await AcademyModel.findById(dto.academyId);
    if (!academy) throw new NotFoundError("Academy");

    const franchiseCode = await generateCode(dto.name);
    const franchise = await FranchiseModel.create({
      academyId: dto.academyId,
      name: dto.name,
      franchiseCode,
      managerId: dto.managerId,
      location: dto.location,
      ageGroups: dto.ageGroups,
      maxStudents: dto.maxStudents,
      alertBeforeMinutes: dto.alertBeforeMinutes,
      notificationAlertAfterMinutes: dto.notificationAlertAfterMinutes,
      skillParameters: dto.skillParameters ?? academy.skillParameters,
      isActive: true,
    });
    return toCard(franchise);
  }

  async update(id: string, dto: UpdateFranchiseDto) {
    const franchise = await FranchiseModel.findById(id);
    if (!franchise) throw new NotFoundError("Franchise");

    if (dto.name !== undefined) franchise.name = dto.name;
    if (dto.managerId !== undefined) franchise.managerId = dto.managerId as any;
    if (dto.location) franchise.location = { ...franchise.location, ...dto.location } as any;
    if (dto.ageGroups !== undefined) franchise.ageGroups = dto.ageGroups;
    if (dto.maxStudents !== undefined) franchise.maxStudents = dto.maxStudents;
    if (dto.alertBeforeMinutes !== undefined) franchise.alertBeforeMinutes = dto.alertBeforeMinutes;
    if (dto.notificationAlertAfterMinutes !== undefined) franchise.notificationAlertAfterMinutes = dto.notificationAlertAfterMinutes;
    if (dto.skillParameters !== undefined) franchise.skillParameters = dto.skillParameters;

    await franchise.save();
    return toCard(franchise);
  }

  async toggleActive(id: string) {
    const franchise = await FranchiseModel.findById(id);
    if (!franchise) throw new NotFoundError("Franchise");
    franchise.isActive = !franchise.isActive;
    await franchise.save();
    return toCard(franchise);
  }

  async delete(id: string, academyId: string): Promise<void> {
    const remaining = await FranchiseModel.countDocuments({ academyId, isActive: true });
    const franchise = await FranchiseModel.findById(id);
    if (!franchise) throw new NotFoundError("Franchise");
    if (remaining <= 1 && franchise.isActive) {
      throw new ConflictError("Cannot delete the only active franchise in an academy");
    }
    franchise.deletedAt = new Date();
    franchise.isActive = false;
    await franchise.save();
  }
}
