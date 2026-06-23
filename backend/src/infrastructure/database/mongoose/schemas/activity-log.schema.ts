import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ActivityLogDocument = ActivityLog & Document;

@Schema({ timestamps: true, collection: 'activity_logs' })
export class ActivityLog {
  @Prop({ required: true, index: true })
  landlordId: string; // Multi-tenancy context (owner landlord of this log)

  @Prop({ required: true, index: true })
  userId: string; // The user who performed the action

  @Prop({ required: true })
  userName: string; // Cached/denormalized username for quick lookup without relations

  @Prop({ required: true })
  action: string; // Action type (e.g., 'CREATE_ROOM', 'UPDATE_CONTRACT', 'PAY_INVOICE')

  @Prop({ required: true })
  module: string; // Scoped module (e.g., 'ROOM', 'CONTRACT', 'INVOICE', 'AUTH')

  @Prop({ required: true })
  description: string; // Human-readable description of the log entry

  @Prop({ type: MongooseSchema.Types.Map, of: MongooseSchema.Types.Mixed })
  metadata?: Map<string, any>; // Flexible extra payload (e.g. before/after states, changed fields)

  @Prop()
  ipAddress?: string; // IP Address of the requester

  @Prop()
  userAgent?: string; // Browser User Agent
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);

// Compound indexes for common queries in the admin control panels
ActivityLogSchema.index({ landlordId: 1, createdAt: -1 });
ActivityLogSchema.index({ landlordId: 1, userId: 1 });
ActivityLogSchema.index({ landlordId: 1, module: 1 });
