# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Polaxis** - 轻量级 HTML 静态页面托管平台。用户上传 HTML 文件后通过 `https://app.com/s/{username}/{slug}` 访问。

**技术栈**: Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Supabase (Auth/PostgreSQL/Storage) + Vercel

## Common Commands

```bash
# 开发
just dev                # 启动开发服务器 (localhost:3000)
just build              # 生产构建
just lint               # ESLint 检查
just check-env          # 验证开发环境

# 数据库
just db-push            # Supabase 迁移推送 (需 Supabase CLI)

# 辅助
just install            # npm install
just init               # 项目初始化脚本
```

## Architecture

### 路由结构

```
src/app/
├── (app)/              # 仪表盘区域 (需登录)
│   ├── dashboard/      # 首页统计
│   ├── sites/          # 站点管理
│   └── users/          # 用户管理 (仅管理员)
├── (auth)/login/       # 登录页面
└── s/[user]/[slug]/    # 站点代理 (核心)
    └── route.ts        # HTML 代理转发
```

### 核心设计模式

**代理模式 (Proxy Pattern)**: 所有站点访问必须经过 `/s/[user]/[slug]/route.ts` 代理，禁止直接暴露 Supabase Storage Public URL。原因：安全性、访问统计、自定义域名扩展。

**Storage 路径约定**: `sites/{user_id}/{site_id}/index.html`

### Supabase 客户端区分

| 客户端 | 文件 | 用途 |
|--------|------|------|
| Browser | `lib/supabase.ts` | 登录/登出、客户端查询 |
| Server | `lib/supabase-server.ts` | Server Actions (遵循 RLS) |
| Admin | `lib/supabase-server.ts` | 代理转发、文件上传 (绕过 RLS) |

### Server Actions

- **站点**: `lib/actions/sites.ts` - createSite, updateSite, deleteSite, uploadSiteFile
- **用户**: `lib/actions/users.ts` - getUsers, createUser, updateUser, deleteUser (管理员)

## Database

**表前缀**: `po_`

**po_sites 表结构**:
- `id` (uuid), `user_id` (uuid FK), `name`, `slug`, `description`, `created_at`, `updated_at`
- 唯一约束: `(user_id, slug)`
- RLS: SELECT 公开, INSERT/UPDATE/DELETE 仅所有者

## Coding Conventions

- **TypeScript**: strict 模式，禁止 `any`
- **导入顺序**: next → 第三方 → `@/` 路径别名
- **组件**: 优先 Server Components，客户端组件显式标记 `'use client'`
- **样式**: Tailwind CSS mobile-first，使用 `cn()` 合并 className
- **UI 组件**: 从 `@/components/ui/*` 引入 shadcn/ui 组件
- **表单**: react-hook-form + Zod，后端必须重新验证
- **提交**: Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`)

## Environment Variables

```bash
# .env.local (必需)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...    # 前端公钥
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # 仅服务端
```

## Key Files Reference

| 概念 | 文件 |
|------|------|
| 路由守卫 | `src/proxy.ts` + `src/lib/middleware.ts` |
| 站点代理 | `src/app/s/[user]/[slug]/route.ts` |
| 数据库类型 | `src/lib/database.types.ts` |
| 全局样式 | `src/app/globals.css` |
| shadcn 配置 | `components.json` |

## Testing

目前无自动化测试。修改认证、存储路径或中间件后需手动冒烟测试：
1. 登录/登出流程
2. 站点 CRUD + 文件上传
3. 代理访问 `/s/username/slug`
4. RLS 权限隔离验证

## Documentation

- `docs/01_产品需求文档.md` - 产品定义
- `docs/02_系统架构设计.md` - 架构设计
- `docs/03_数据库与存储设计.md` - 数据模型
- `docs/04_开发指南.md` - 开发指南
