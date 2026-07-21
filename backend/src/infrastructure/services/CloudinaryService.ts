// src/infrastructure/services/CloudinaryService.ts
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { config } from "../../config/app.config";
import { BadRequestError } from "../../shared/errors/AppError";
import { logger } from "../../shared/utils/logger";

export type UploadCategory =
  | "player_photo"
  | "team_logo"
  | "team_banner"
  | "coach_resource";

const FOLDER_BY_CATEGORY: Record<UploadCategory, string> = {
  player_photo: "noxphere/players/photos",
  team_logo: "noxphere/teams/logos",
  team_banner: "noxphere/teams/banners",
  coach_resource: "noxphere/resources",
};

// Resources (documents/PDFs) are handled as "raw" uploads on Cloudinary;
// everything else is an image.
const RESOURCE_TYPE_BY_CATEGORY: Record<UploadCategory, "image" | "raw"> = {
  player_photo: "image",
  team_logo: "image",
  team_banner: "image",
  coach_resource: "raw",
};

let configured = false;

function ensureConfigured() {
  if (configured) return;
  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
    logger.warn(
      "Cloudinary credentials are not set — image/document uploads will fail until CLOUDINARY_* env vars are provided.",
    );
  }
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
  configured = true;
}

export class CloudinaryService {
  async uploadBuffer(
    buffer: Buffer,
    category: UploadCategory,
    originalFilename: string,
  ): Promise<{ url: string; publicId: string; bytes: number; format?: string }> {
    ensureConfigured();

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: FOLDER_BY_CATEGORY[category],
          resource_type: RESOURCE_TYPE_BY_CATEGORY[category],
          use_filename: true,
          unique_filename: true,
          filename_override: originalFilename,
          overwrite: false,
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            logger.error("Cloudinary upload failed", error);
            reject(new BadRequestError("Image upload failed — please try again"));
            return;
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            bytes: result.bytes,
            format: result.format,
          });
        },
      );
      stream.end(buffer);
    });
  }

  async deleteByUrl(url: string, category: UploadCategory): Promise<void> {
    ensureConfigured();
    const publicId = this.extractPublicId(url);
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: RESOURCE_TYPE_BY_CATEGORY[category],
      });
    } catch (error) {
      // Deleting the old asset is best-effort cleanup — if it fails we
      // don't want that to block whatever the caller was actually doing
      // (e.g. saving a new photo url).
      logger.warn(`Couldn't delete previous Cloudinary asset for ${url}`, error);
    }
  }

  private extractPublicId(url: string): string | null {
    // e.g. https://res.cloudinary.com/<cloud>/image/upload/v169.../noxphere/players/photos/abc123.jpg
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
    return match ? match[1] : null;
  }
}

export const cloudinaryService = new CloudinaryService();