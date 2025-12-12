# Justfile for PolarisOrbit

# 默认命令：列出所有可用命令
default:
    @just --list

# 检查开发环境
check-env:
    ./scripts/check-env.sh

# 安装依赖
install:
    npm install

# 启动开发服务器
dev:
    npm run dev

# 构建生产版本
build:
    npm run build

# 启动生产服务
start:
    npm run start

# 运行 Lint 检查
lint:
    npm run lint

# 初始化数据库 (运行 Supabase migration 或 SQL)
# 注意：这需要安装 supabase cli
db-push:
    supabase db push

# 快速提交代码 (小心使用)
commit m:
    git add .
    git commit -m "{{m}}"
