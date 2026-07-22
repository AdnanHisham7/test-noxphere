import {
  IAcademyRepository,
  PaginationOptions,
  PaginatedResult,
} from "../../../domain/repositories/IAcademyRepository";
import { AcademyEntity, CreateAcademyEntity } from "../../../domain/entities/Academy.entity";
import { AcademyModel, AcademyDocument } from "../models/Academy.model";

export class MongoAcademyRepository implements IAcademyRepository {
  private toEntity(doc: AcademyDocument): AcademyEntity {
    const manager = doc.managerId as any;

    return {
      id: doc.id,
      name: doc.name,
      academyCode: doc.academyCode,

      manager:
        typeof manager === "object" && manager.firstName
          ? {
              id: manager._id.toString(),
              firstName: manager.firstName,
              lastName: manager.lastName,
              email: manager.email,
            }
          : undefined,

      location: doc.location,
      ageGroups: doc.ageGroups,
      maxStudents: doc.maxStudents,
      isActive: doc.isActive,
      transferWallEnabled: doc.transferWallEnabled,
      alertBeforeMinutes: doc.alertBeforeMinutes,
      notificationAlertAfterMinutes: doc.notificationAlertAfterMinutes,
      skillParameters: doc.skillParameters,
      deletedAt: doc.deletedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async findById(id: string): Promise<AcademyEntity | null> {
    const doc = await AcademyModel.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findByCode(code: string): Promise<AcademyEntity | null> {
    const doc = await AcademyModel.findOne({ academyCode: code });
    return doc ? this.toEntity(doc) : null;
  }

  async findByManagerId(managerId: string): Promise<AcademyEntity | null> {
    const doc = await AcademyModel.findOne({ managerId });
    return doc ? this.toEntity(doc) : null;
  }

  async findAll(
    filters: { isActive?: boolean; search?: string } = {},
    options: PaginationOptions = { page: 1, limit: 20 },
  ): Promise<PaginatedResult<AcademyEntity>> {
    const query: any = {};
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { academyCode: { $regex: filters.search, $options: "i" } },
      ];
    }

    const skip = (options.page - 1) * options.limit;
    const [docs, total] = await Promise.all([
      AcademyModel.find(query)
        .populate("managerId", "firstName lastName email")
        .skip(skip)
        .limit(options.limit)
        .sort({ createdAt: -1 }),
      AcademyModel.countDocuments(query),
    ]);

    return {
      data: docs.map((d) => this.toEntity(d)),
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async create(data: CreateAcademyEntity): Promise<AcademyEntity> {
    const doc = await AcademyModel.create(data);
    return this.toEntity(doc);
  }

  async update(
    id: string,
    updates: Partial<AcademyEntity>,
  ): Promise<AcademyEntity | null> {
    const doc = await AcademyModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    return doc ? this.toEntity(doc) : null;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await AcademyModel.findByIdAndUpdate(id, {
      deletedAt: new Date(),
      isActive: false,
    });
    return result !== null;
  }
}