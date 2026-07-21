import { NotificationModel, NotificationAudience } from "../../../infrastructure/database/models/Notification.model";
import { NotFoundError, BadRequestError } from "../../../shared/errors/AppError";

export interface CreateNotificationInput {
  franchiseId: string;
  title: string;
  body: string;
  audience: NotificationAudience;
  teamId?: string;
}

export class AdminNotificationUseCases {
  async create(input: CreateNotificationInput, createdBy: string) {
    if (!input.title || !input.body) throw new BadRequestError("title and body are required");
    const notification = await NotificationModel.create({ ...input, createdBy, readBy: [] });
    return notification.toJSON();
  }

  async list(franchiseId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      NotificationModel.find({ franchiseId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      NotificationModel.countDocuments({ franchiseId }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markRead(id: string, userId: string) {
    const notification = await NotificationModel.findByIdAndUpdate(
      id,
      { $addToSet: { readBy: userId } },
      { new: true },
    );
    if (!notification) throw new NotFoundError("Notification not found");
    return notification.toJSON();
  }
}
