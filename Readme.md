# Polaxis (Polaris × Axis)

> 以北极星为轴的坐标系 —— 简易 HTML 静态页面托管平台。

本项目是一个基于 **Next.js + Supabase + shadcn/ui** 的轻量级托管平台。用户上传 HTML 文件，获得永久不变的访问坐标（URL）。

## 核心理念
**Polaxis** = **Polaris** (北极星：不漂移的方向) × **Axis** (轴：坐标系统)

## 技术栈
- **Framework**: Next.js 14+ (App Router)
- **UI**: shadcn/ui
- **Auth & DB**: Supabase (Auth, Postgres, Storage)
- **Hosting**: Vercel

## 快速开始

### 1. 环境准备
确保安装 `node`, `git` 和 `just`。

### 2. 初始化
```bash
just install
cp .env.example .env.local # 需自行配置 Supabase Key
```

### 3. 开发
```bash
just dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。
