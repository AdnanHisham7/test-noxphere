// src/shared/utils/ResponseHandler.ts
import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  timestamp: string;
}

export class ResponseHandler {
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200,
    meta?: ApiResponse['meta']
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      ...(meta && { meta }),
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message = 'Created successfully'): Response {
    return this.success(res, data, message, 201);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number,
    message = 'Success'
  ): Response {
    return this.success(res, data, message, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }

  static noContent(res: Response, message = 'Deleted successfully'): Response {
    return res.status(200).json({
      success: true,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  static error(
    res: Response,
    message: string,
    statusCode = 500,
    errors?: Record<string, string>[]
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      ...(errors && { errors }),
    };
    return res.status(statusCode).json(response);
  }
}
