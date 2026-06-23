# Smart Boarding House Management System (Rental SaaS)
## Clean Architecture Directory Structure Design

Dự án này sử dụng mô hình **Clean Architecture** (Architecture độc lập Framework ở mức Core) cho Backend (NestJS) và cấu trúc **Modular & Domain-Driven** cho Frontend (NextJS 14 App Router) nhằm đảm bảo khả năng bảo mật dữ liệu multi-tenancy, khả năng mở rộng và bảo trì lâu dài.

---

## 1. Backend (NestJS) Directory Structure

Cấu trúc thư mục NestJS dưới đây tuân thủ các nguyên tắc Clean Architecture / Hexagonal Architecture (Ports and Adapters). Core Business Logic (Domain & Use Cases) hoàn toàn độc lập với database (Prisma/Mongoose), mailer, hay các framework bên ngoài.

```text
backend/
├── prisma/
│   ├── schema.prisma              # File cấu hình Database PostgreSQL (Prisma ORM)
│   └── migrations/                # Chứa các file migration của PostgreSQL
├── src/
│   ├── app.module.ts              # Module gốc khởi chạy ứng dụng
│   ├── main.ts                    # Entrypoint của ứng dụng NestJS
│   │
│   ├── core/                      # CORE LAYER: Chứa Logic nghiệp vụ cốt lõi (Domain & Application)
│   │   ├── domain/                # Lớp Domain: Độc lập hoàn toàn, mô tả thực thể và nghiệp vụ chính
│   │   │   ├── models/            # Domain Entities (e.g., user.model.ts, room.model.ts, contract.model.ts)
│   │   │   ├── types/             # Domain Types và Enums dùng chung
│   │   │   └── repositories/      # Interfaces / Ports cho các Repositories (e.g., user-repository.interface.ts)
│   │   │
│   │   └── use-cases/             # Lớp Use Cases (Application logic): Điều hướng luồng dữ liệu
│   │       ├── auth/              # Use cases xử lý Đăng nhập, Đăng ký, Đổi mật khẩu
│   │       ├── landlord/          # Quản lý thông tin Chủ trọ (Landlord profile)
│   │       ├── room/              # Xem danh sách, tạo mới, chỉnh sửa, xóa phòng trọ
│   │       ├── contract/          # Tạo hợp đồng, gia hạn, thanh lý hợp đồng
│   │       └── invoice/           # Tạo hóa đơn hàng tháng, xử lý thanh toán hóa đơn
│   │
│   ├── infrastructure/            # INFRASTRUCTURE LAYER (Adapters): Triển khai kỹ thuật cụ thể bên ngoài
│   │   ├── database/              # Quản lý kết nối và các lớp Repository cụ thể (Prisma & Mongoose)
│   │   │   ├── prisma/            # Triển khai cụ thể các interface repository bằng PostgreSQL thông qua Prisma
│   │   │   │   ├── prisma.service.ts
│   │   │   │   └── repositories/  # e.g., prisma-room.repository.ts implement IRoomRepository
│   │   │   └── mongoose/          # Triển khai cụ thể các hoạt động lưu trữ MongoDB (ActivityLog, Notification)
│   │   │       ├── mongoose.module.ts
│   │   │       ├── schemas/       # Định nghĩa các MongoDB Mongoose Schemas
│   │   │       │   ├── activity-log.schema.ts
│   │   │       │   └── notification-queue.schema.ts
│   │   │       └── repositories/  # e.g., mongoose-activity-log.repository.ts
│   │   │
│   │   ├── config/                # Cấu hình biến môi trường, JWT, Mongo URI, Postgres credentials
│   │   ├── logger/                # Hệ thống ghi log (Winston/Pino) tích hợp NestJS Logger
│   │   └── services/              # Các dịch vụ bên thứ ba (SMS Twilio, Mailer nodemailer/AWS SES, S3 Storage)
│   │
│   └── presentation/              # PRESENTATION LAYER: Giao tiếp với Client (HTTP API, WebSockets)
│       ├── controllers/           # HTTP Controllers (e.g., room.controller.ts, invoice.controller.ts)
│       ├── dtos/                  # Data Transfer Objects (Validation chi tiết request body)
│       │   ├── auth/
│       │   ├── room/
│       │   ├── contract/
│       │   └── invoice/
│       ├── guards/                # AuthGuard (JWT), RolesGuard, và đặc biệt là TenantGuard (xác thực LandlordId)
│       ├── interceptors/          # TransformResponse, LoggingInterceptor
│       └── pipes/                 # Custom validation và transformation pipes
│
├── test/                          # Unit tests & E2E tests
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## 2. Frontend (NextJS 14 - App Router) Directory Structure

Frontend được thiết kế phân chia Module theo vai trò truy cập (Public Landing Page vs Private Admin Dashboard cho Landlord vs Portal cho Tenant) kết hợp với các Shared Components và Hooks dùng chung để tối ưu mã nguồn.

```text
frontend/
├── public/                        # Chứa static assets (images, logos, fonts, icons)
├── src/
│   ├── app/                       # NEXTJS APP ROUTER: Định nghĩa routing của ứng dụng
│   │   ├── layout.tsx             # Root layout cấu hình font, context providers, toast notifications
│   │   ├── page.tsx               # Main Landing Page (Giới thiệu sản phẩm SaaS, Bảng giá)
│   │   │
│   │   ├── (public)/              # ROUTE GROUP PUBLIC: Các trang không cần đăng nhập
│   │   │   ├── layout.tsx         # Layout công khai (Header, Footer chung)
│   │   │   ├── rooms/             # Xem danh sách phòng trống, chi tiết phòng dành cho khách thuê
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   └── contact/           # Form gửi thông tin tư vấn/hỗ trợ
│   │   │
│   │   ├── (auth)/                # ROUTE GROUP AUTH: Đăng ký & Đăng nhập
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   │
│   │   ├── admin/                 # ROUTE PRIVATE: Dashboard dành riêng cho Chủ trọ (Landlord)
│   │   │   ├── layout.tsx         # Sidebar Navigation, Topbar, User profile menu
│   │   │   ├── page.tsx           # Báo cáo tổng quan (Doanh thu, tỉ lệ lấp đầy, thông báo cần xử lý)
│   │   │   ├── rooms/             # Quản lý danh sách phòng, trạng thái phòng
│   │   │   ├── tenants/           # Danh sách khách thuê trọ
│   │   │   ├── contracts/         # Tạo và theo dõi hợp đồng thuê trọ
│   │   │   └── invoices/          # Lập hóa đơn dịch vụ, điện nước, theo dõi trạng thái thanh toán
│   │   │
│   │   └── tenant/                # ROUTE PRIVATE: Portal dành cho khách thuê trọ (Tenant)
│   │       ├── layout.tsx         # Layout đơn giản dành cho Tenant
│   │       ├── page.tsx           # Tổng quan hợp đồng của họ & hóa đơn cần thanh toán
│   │       ├── billing/           # Xem lịch sử thanh toán hóa đơn
│   │       └── ticket/            # Gửi yêu cầu sửa chữa phòng, báo cáo sự cố
│   │
│   ├── core/                      # CORE LAYER: Quản lý interfaces, business logic client
│   │   ├── domain/                # Interfaces & Types định nghĩa các thực thể (User, Room, Contract, Invoice)
│   │   └── use-cases/             # Logic Client (e.g., tính toán tổng hóa đơn điện nước tạm tính)
│   │
│   ├── infrastructure/            # INFRASTRUCTURE LAYER: Giao tiếp API và Lưu trữ cục bộ
│   │   ├── api/                   # API Clients (Axios instance tự động đính kèm Bearer Token & Landlord-Id)
│   │   │   ├── auth.api.ts
│   │   │   ├── room.api.ts
│   │   │   └── invoice.api.ts
│   │   └── stores/                # Quản lý State Global (Zustand: authStore, landlordStore, UIStore)
│   │
│   ├── components/                # COMPONENT LAYER: Chứa các UI components tái sử dụng
│   │   ├── ui/                    # Thư viện UI primitives (Shadcn UI, Jolly UI)
│   │   ├── common/                # FormInput, CustomModal, TableWrapper, LoadingSpinner
│   │   ├── landing/               # Các block giao diện cho Landing Page (Hero, Features, Pricing)
│   │   └── admin/                 # Admin components (MetricCard, RevenueChart, RoomStatusGrid)
│   │
│   ├── hooks/                     # Custom React Hooks (useAuth, useLocalStorage, useTenantFilter)
│   ├── lib/                       # Config thư viện và utilities (utils.ts cho tailwind-merge, cn)
│   └── styles/                    # Global CSS, Tailwind CSS configurations
│
├── tailwind.config.js             # Cấu hình Tailwind CSS
├── tsconfig.json                  # Cấu hình TypeScript
├── package.json                   # dependencies (React, Next, Tailwind, Radix/Shadcn, Jolly UI)
└── postcss.config.js
```
