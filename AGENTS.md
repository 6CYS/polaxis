# Repository Guidelines

## 项目结构与模块
- `src/app` 采用 App Router：`(auth)/login` 负责登录，`(dashboard)/dashboard` 为后台框架，`s/[user]/[slug]/` 路由处理代理 Supabase 中的 HTML；`middleware.ts` 控制受保护区域。
- `src/components` 包含后台导航（`dashboard/mobile-nav.tsx`, `sidebar.tsx`, `user-nav.tsx`）与 shadcn 生成的 UI（`ui/`）；优先从 `@/components/ui/*` 引入基础组件。
- `src/lib/supabase.ts` 提供共享客户端；按 `tsconfig.json` 使用 `@/` 路径别名引用工具与模块。
- `docs/` 有产品/架构/SQL 文档；`scripts/` 提供环境检测与初始化；`supabase/` 预留迁移与类型；`public/` 放置静态资源。

## 构建、测试与开发命令
- 开发：`just dev` 或 `npm run dev`（默认 http://localhost:3000）。
- 构建/运行：`just build`/`npm run build` 生成产物，`npm run start` 本地模拟生产。
- 质量：`npm run lint` 使用 Next ESLint 配置；合并前修复告警。
- 辅助：`just check-env` 校验 Node/Git/Just/npm；`just install` 等价 `npm install`。
- 数据库：`supabase db push` 推送本地 SQL（需安装 Supabase CLI）。

## 编码风格与命名
- TypeScript 开启 `strict`，避免 `any`，明确服务端与客户端边界。
- React 组件用 PascalCase；路由段文件小写（`page.tsx`/`layout.tsx`/`route.ts`）。
- 默认 2 空格缩进；按 `next`、第三方、`@/` 顺序分组导入。
- 样式用 Tailwind 与 shadcn/ui，倾向组合而非自定义全局 CSS。
- 秘钥隔离：仅服务端读取 `SUPABASE_SERVICE_ROLE_KEY`，客户端仅用 `NEXT_PUBLIC_*`。

## 测试指南
- 目前无自动化测试，依赖 `npm run lint` 与手动回归（登录、后台导航、站点代理链路）；改动鉴权、存储路径或中间件时必做冒烟。
- 如增补测试，可就近放置或用 `__tests__`，覆盖上传/代理路径与 RLS 相关分支，必要时用 Supabase CLI 本地验证策略。
- 记录缺陷复现步骤、示例请求、期望与实际响应，以及关键环境变量，方便团队复盘。

## 提交与 PR 规范
- 沿用历史的 Conventional Commit 前缀：`feat:`, `fix:`, `chore:` 等，使用祈使句。
- PR 需说明目的、关联 issue/文档（如有）、已跑命令（lint/构建）、界面变更附截图或 GIF。
- 变更保持小而聚焦；当初始化或行为有调整时同步更新文档（`Readme.md`、`docs/*.md`、`AGENTS.md`）。

## 架构与协作提示
- 站点访问采用代理模式：所有 HTML 需经 `/s/[user]/[slug]/route.ts` 下发，避免直接暴露 Storage Public URL，并为后续统计与自定义域名留钩子。
- Supabase Bucket `sites` 应保持私有；路径约定 `sites/{user_id}/{site_id}/index.html`，上传/读取均需带当前会话或服务端密钥。
- 需要新队友快速上手时，引导先读 `PROJECT_CONTEXT.md` 与 `docs/02_系统架构设计.md`，理解数据表前缀 `po_`、RLS 策略和代理流程。

## 安全与配置
- `.env.local` 必填 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、服务端专用 `SUPABASE_SERVICE_ROLE_KEY`，切勿提交。
- Supabase Storage 路径规范：`sites/{user_id}/{site_id}/index.html`；外部访问须经 `/s/[user]/[slug]/route.ts` 代理以确保权限与日志。
- 新环境缺脚手架可运行 `just init`；升级工具链后复跑 `just check-env` 确认依赖。
