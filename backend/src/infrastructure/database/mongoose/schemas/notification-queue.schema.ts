import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NotificationQueueDocument = NotificationQueue & Document;

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true, collection: 'notification_queue' })
export class NotificationQueue {
  @Prop({ required: true, index: true })
  landlordId: string; // Tenant isolation (landlord scoping)

  @Prop({ required: true, index: true })
  recipientId: string; // The user ID receiving this notification

  @Prop()
  recipientEmail?: string; // Recipient's target email address

  @Prop()
  recipientPhone?: string; // Recipient's target phone number

  @Prop({ required: true, enum: NotificationChannel })
  channel: NotificationChannel; // Channel through which this is delivered

  @Prop({ required: true })
  title: string; // Title / Subject

  @Prop({ required: true })
  content: string; // Body message

  @Prop({ type: MongooseSchema.Types.Map, of: MongooseSchema.Types.Mixed })
  payload?: Map<string, any>; // Extra payload (e.g. redirect URL, data payloads)

  @Prop({ required: true, enum: NotificationStatus, default: NotificationStatus.PENDING, index: true })
  status: NotificationStatus; // Current status of the dispatch job

  @Prop({ default: 0 })
  retryCount: number; // For retry mechanisms upon failure

  @Prop()
  errorLog?: string; // Error log trace if the message delivery fails

  @Prop({ required: true, default: Date.now, index: true })
  scheduledAt: Date; // Scheduled send date, supports delayed execution

  @Prop()
  sentAt?: Date; // Timestamp marking actual delivery
}

export const NotificationQueueSchema = SchemaFactory.createForClass(NotificationQueue);

// Compound indexes optimized for queue consumers and dashboard lists
NotificationQueueSchema.index({ status: 1, scheduledAt: 1 });
NotificationQueueSchema.index({ landlordId: 1, recipientId: 1 });
NotificationQueueSchema.index({ landlordId: 1, status: 1 });
