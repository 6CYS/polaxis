# PROJECT_CONTEXT.md - AI 协作上下文

本文档旨在为协同工作的 AI 助手（如 Claude, ChatGPT）提供项目的上下文信息、技术约束和代码规范，以确保生成的代码符合项目标准。

## 1. 项目概况
**项目名称**: PolarisOrbit (HTML Hosting Platform)
**核心目标**: 这是一个简易的 HTML 静态页面托管平台。用户可以注册、上传 HTML 文件，并通过 `https://app.com/s/{username}/{slug}` 路径进行访问。

## 2. 核心技术栈 (不可随意更改)
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS.
- **UI Framework**: shadcn/ui.
- **Backend/Database**: Supabase (Auth, PostgreSQL, Storage).
- **Hosting**: Vercel.

## 3. 数据模型约定
主要数据表前缀为 `po_`。
- **User**: 使用 Supabase Auth (`auth.users`)。
- **Sites**: 表名 `po_sites`。
  - 字段: `id`, `user_id`, `name`, `slug`, `created_at`。

## 4. 关键实现路径
### 4.1 站点访问代理 (Proxy Pattern)
所有站点访问 **必须** 通过 Next.js Route Handler (`/app/s/[...]/route.ts`) 进行代理转发，**禁止** 直接使用 Supabase Storage 的 Public URL。
- 原因：为了安全性、访问统计及未来扩展自定义域名。
- 实现：API 使用 `SUPABASE_SERVICE_ROLE_KEY` (仅服务端) 从 Storage 下载文件流并返回。

### 4.2 文件存储路径
Supabase Storage Bucket: `sites`
Path Pattern: `{user_id}/{site_id}/index.html`

## 5. 编码规范 (Coding Standards)
- **组件**: 优先使用 shadcn/ui 组件 (`import { Button } from "@/components/ui/button"`).
- **文件结构**: 使用 Next.js App Router 结构 (`app/page.tsx`, `app/layout.tsx`).
- **样式**: mobile-first, 使用 Tailwind Utility Classes。
- **类型安全**: 必须定义 interface/type，避免使用 `any`。

## 6. 常用 Prompt 提示
当你（AI）生成代码时：
1. 总是先检查 `docs/` 下的设计文档，特别是数据库字段名 (`po_sites`)。
2. 对于 Supabase 客户端创建，请区分 **Browser Client** (用于组件) 和 **Server Client** (用于 Server Actions/Route Handlers)。
3. 如果涉及到文件上传，请记住 Bucket 是私有的。
