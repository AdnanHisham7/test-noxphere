import { IAcademyRepository } from "../../../domain/repositories/IAcademyRepository";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import {
  AcademyEntity,
  Location,
} from "../../../domain/entities/Academy.entity";
import { FranchiseEntity } from "../../../domain/entities/Franchise.entity";
import { FranchiseModel, FranchiseDocument } from "../../../infrastructure/database/models/Franchise.model";
import { UserEntity, UserRole } from "../../../domain/entities/User.entity";
import {
  CreateAcademyDto,
  UpdateAcademyDto,
  AcademyConfigDto,
} from "../../dtos/academy.dto";
import {
  AppError,
  ConflictError,
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "../../../shared/errors/AppError";
import bcrypt from "bcryptjs";

function toFranchiseEntity(doc: FranchiseDocument): FranchiseEntity {
  const json = doc.toJSON() as any;
  return {
    id: json.id,
    academyId: json.academyId?.toString?.() ?? json.academyId,
    name: json.name,
    franchiseCode: json.franchiseCode,
    managerId: json.managerId?.toString?.(),
    location: json.location,
    sessionTimes: json.sessionTimes ?? [],
    ageGroups: json.ageGroups ?? [],
    skillLevels: json.skillLevels ?? [],
    maxStudents: json.maxStudents,
    isActive: json.isActive,
    alertBeforeMinutes: json.alertBeforeMinutes,
    notificationAlertAfterMinutes: json.notificationAlertAfterMinutes,
    skillParameters: json.skillParameters ?? [],
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
  };
}

export class AcademyUseCases {
  constructor(
    private readonly academyRepository: IAcademyRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async createAcademy(dto: CreateAcademyDto): Promise<AcademyEntity & { defaultFranchise: FranchiseEntity }> {
    // 1. Check if academy code already exists (if provided)
    if (dto.academyCode) {
      const existing = await this.academyRepository.findByCode(dto.academyCode);
      if (existing) throw new ConflictError("Academy code already exists");
    }

    // 2. Check if manager email already exists
    const existingUser = await this.userRepository.findByEmail(
      dto.manager.email,
    );
    if (existingUser)
      throw new ConflictError("Manager email already registered");

    // 3. Create the manager user (franchiseId is attached once the
    // franchise below exists)
    const passwordHash = await bcrypt.hash(dto.manager.password, 12);
    const managerUser = await this.userRepository.create({
      email: dto.manager.email.toLowerCase(),
      passwordHash,
      role: "manager" as UserRole,
      firstName: dto.manager.firstName,
      lastName: dto.manager.lastName,
      phone: undefined,
      isActive: true,
      isEmailVerified: false,
      permissions: {
        canManageUsers: true,
        canManageFranchises: true,
        canManageSessions: true,
        canManageFinance: true,
        canViewReports: true,
        canManageAttendance: true,
        canManagePerformance: true,
        canManageSelection: true,
        canSendNotifications: true,
      },
      fcmTokens: [],
    });

    // 4. Generate unique academy code if not provided
    let academyCode = dto.academyCode;
    if (!academyCode) {
      academyCode = await this.generateUniqueCode(dto.name);
    }

    // 5. Create academy
    const academy = await this.academyRepository.create({
      name: dto.name,
      academyCode,
      managerId: managerUser.id,
      location: dto.location,
      ageGroups: dto.ageGroups,
      maxStudents: dto.maxStudents,
      isActive: true,
      alertBeforeMinutes: dto.alertBeforeMinutes,
      notificationAlertAfterMinutes: dto.notificationAlertAfterMinutes,
      skillParameters: dto.skillParameters,
    });

    // 6. Auto-create a single default franchise under this academy. Every
    // academy needs at least one operational franchise for students, teams,
    // sessions, fees etc. to be scoped into — managers and coaches work
    // within a franchise, not the academy record directly.
    const franchiseCode = await this.generateUniqueFranchiseCode(dto.name);
    const defaultFranchise = await FranchiseModel.create({
      academyId: academy.id,
      name: `${dto.name} — Main Franchise`,
      franchiseCode,
      managerId: managerUser.id,
      location: dto.location,
      ageGroups: dto.ageGroups,
      maxStudents: dto.maxStudents,
      isActive: true,
      alertBeforeMinutes: dto.alertBeforeMinutes,
      notificationAlertAfterMinutes: dto.notificationAlertAfterMinutes,
      skillParameters: dto.skillParameters,
    });

    // 7. Attach the new franchise to the manager so it's auto-selected the
    // moment they log in.
    await this.userRepository.update(managerUser.id, { franchiseId: defaultFranchise.id } as Partial<UserEntity>);

    return {
      ...academy,
      defaultFranchise: toFranchiseEntity(defaultFranchise),
    };
  }

  async getAcademyById(id: string): Promise<AcademyEntity> {
    const academy = await this.academyRepository.findById(id);
    if (!academy) throw new NotFoundError("Academy");
    return academy;
  }

  async getAllAcademies(
    filters: { isActive?: boolean; search?: string },
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: AcademyEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.academyRepository.findAll(filters, { page, limit });
  }

  async updateAcademy(
    id: string,
    dto: UpdateAcademyDto,
  ): Promise<AcademyEntity> {
    const academy = await this.academyRepository.findById(id);
    if (!academy) throw new NotFoundError("Academy");

    // If location updates are partial, merge with existing

    let locationUpdate: Location | undefined;
    if (dto.location) {
      locationUpdate = {
        ...academy.location,
        ...dto.location,
      };
    }

    const updated = await this.academyRepository.update(id, {
      ...dto,
      location: locationUpdate,
    });
    if (!updated) throw new NotFoundError("Academy");
    return updated;
  }

  async updateAcademyConfig(
    id: string,
    dto: AcademyConfigDto,
    requester?: { role: string; franchiseId?: string },
  ): Promise<AcademyEntity> {
    const academy = await this.academyRepository.findById(id);
    if (!academy) throw new NotFoundError("Academy");

    // A manager may only edit the academy their own franchise belongs to.
    // super_admin is unrestricted. This is what makes skillParameters
    // genuinely "defined by the manager of the academy" rather than only
    // reachable through the super_admin-only Academies page.
    if (requester && requester.role === "manager") {
      if (!requester.franchiseId) {
        throw new ForbiddenError("Your account isn't linked to a franchise");
      }
      const franchise = await FranchiseModel.findById(requester.franchiseId).select("academyId").lean();
      if (!franchise || franchise.academyId.toString() !== id) {
        throw new ForbiddenError("You can only configure your own academy");
      }
    }

    const updated = await this.academyRepository.update(id, dto);
    if (!updated) throw new NotFoundError("Academy");
    return updated;
  }

  async toggleAcademyStatus(id: string): Promise<AcademyEntity> {
    const academy = await this.academyRepository.findById(id);
    if (!academy) throw new NotFoundError("Academy");

    const updated = await this.academyRepository.update(id, {
      isActive: !academy.isActive,
    });
    if (!updated) throw new NotFoundError("Academy");
    return updated;
  }

  async deleteAcademy(id: string): Promise<void> {
    const academy = await this.academyRepository.findById(id);
    if (!academy) throw new NotFoundError("Academy");

    const deleted = await this.academyRepository.softDelete(id);
    if (!deleted) throw new BadRequestError("Could not delete academy");
  }

  private async generateUniqueFranchiseCode(baseName: string): Promise<string> {
    const prefix = baseName
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
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

  private async generateUniqueCode(baseName: string): Promise<string> {
    const prefix = baseName
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
    const random = Math.floor(1000 + Math.random() * 9000);
    let code = `${prefix}${random}`;
    let exists = await this.academyRepository.findByCode(code);
    let counter = 1;
    while (exists) {
      code = `${prefix}${random}${counter}`;
      exists = await this.academyRepository.findByCode(code);
      counter++;
    }
    return code;
  }
}