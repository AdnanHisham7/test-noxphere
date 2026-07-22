import { AcademyEntity, CreateAcademyEntity } from "../entities/Academy.entity";

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IAcademyRepository {
  findById(id: string): Promise<AcademyEntity | null>;
  findByCode(code: string): Promise<AcademyEntity | null>;
  findByManagerId(managerId: string): Promise<AcademyEntity | null>;
  findAll(
    filters?: { isActive?: boolean; search?: string },
    options?: PaginationOptions,
  ): Promise<PaginatedResult<AcademyEntity>>;
  create(
    academy: Omit<AcademyEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<AcademyEntity>;
  update(
    id: string,
    updates: Partial<AcademyEntity>,
  ): Promise<AcademyEntity | null>;
  softDelete(id: string): Promise<boolean>;
}
