import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './core/use-cases/auth/auth.module';
import { RentRequestModule } from './core/use-cases/rent-request/rent-request.module';
import { RoomModule } from './core/use-cases/room/room.module';
import { TenantModule } from './core/use-cases/tenant/tenant.module';
import { ContractModule } from './core/use-cases/contract/contract.module';
import { InvoiceModule } from './core/use-cases/invoice/invoice.module';
import { TasksModule } from './core/use-cases/tasks/tasks.module';
import { IncidentModule } from './core/use-cases/incident/incident.module';
import { NotificationGateway } from './core/use-cases/notification/notification.gateway';
import { NotificationModule } from './core/use-cases/notification/notification.module';
import { OcrModule } from './core/use-cases/ocr/ocr.module';
import { UploadModule } from './core/use-cases/upload/upload.module';
import { PdfModule } from './core/use-cases/pdf/pdf.module';
import { AiModule } from './core/use-cases/ai/ai.module';
import { ViolationModule } from './core/use-cases/violation/violation.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    RentRequestModule,
    RoomModule,
    TenantModule,
    ContractModule,
    InvoiceModule,
    TasksModule,
    IncidentModule,
    NotificationModule,
    OcrModule,
    UploadModule,
    PdfModule,
    AiModule,
    ViolationModule,
  ],
  providers: [NotificationGateway],
})
export class AppModule {}
