#!/bin/bash
set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 开始初始化 Polaxis 开发环境...${NC}\n"

# ==========================================
# 1. Next.js 项目脚手架
# ==========================================
if [ -f "package.json" ]; then
    echo -e "${YELLOW}⚠️  package.json 已存在，跳过 Next.js 初始化。${NC}"
else
    echo -e "${GREEN}📦 初始化 Next.js (TypeScript + Tailwind + App Router)...${NC}"
    
    # 临时目录策略，绕过 npm 命名限制
    TEMP_APP_NAME="polaxis-app"
    npx -y create-next-app@latest "$TEMP_APP_NAME" \
        --typescript \
        --tailwind \
        --eslint \
        --app \
        --src-dir \
        --import-alias "@/*" \
        --use-npm \
        --no-git
        
    echo -e "${GREEN}🚚 移动文件到根目录...${NC}"
    mv "$TEMP_APP_NAME"/* .
    mv "$TEMP_APP_NAME"/.* . 2>/dev/null || true
    rmdir "$TEMP_APP_NAME"
fi

# ==========================================
# 2. 安装项目依赖
# ==========================================
echo -e "\n${GREEN}📦 安装依赖 (Supabase, Lucide, Tailwind Merge)...${NC}"
npm install clsx tailwind-merge lucide-react @supabase/supabase-js

# ==========================================
# 3. 初始化 shadcn/ui
# ==========================================
if [ ! -f "components.json" ]; then
    echo -e "\n${GREEN}🎨 初始化 shadcn/ui...${NC}"
    # 使用新版命令
    npx -y shadcn@latest init -d
else
    echo -e "${YELLOW}✅ shadcn/ui 已配置${NC}"
fi

# ==========================================
# 4. 目录结构规范化 (Ensure src/)
# ==========================================
echo -e "\n${GREEN}📂 规范目录结构...${NC}"

# 确保核心目录存在
mkdir -p src/lib
mkdir -p src/components
mkdir -p src/app/\(auth\)/login
mkdir -p src/app/\(dashboard\)/dashboard

# 清理根目录残留 (如果 shadcn 错误生成在根目录)
if [ -d "app" ] && [ -d "src/app" ]; then
    echo -e "${YELLOW}🧹 清理根目录冗余 app/ 文件夹...${NC}"
    rm -rf app
fi
if [ -d "lib" ] && [ -d "src/lib" ]; then
    echo -e "${YELLOW}🧹 清理根目录冗余 lib/ 文件夹...${NC}"
    rm -rf lib
fi

# ==========================================
# 5. 生成 Supabase Client (src/lib/supabase.ts)
# ==========================================
if [ ! -f "src/lib/supabase.ts" ]; then
    echo -e "\n${GREEN}🔌 生成 Supabase 客户端代码...${NC}"
    cat > src/lib/supabase.ts <<EOF
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
EOF
fi

# ==========================================
# 6. 配置环境变量 (.env.local)
# ==========================================
echo -e "\n${GREEN}🔑 检查环境变量...${NC}"
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  未找到 .env.local，创建模板...${NC}"
    cat > .env.local <<EOF
# Supabase 连接信息 (请替换为您的真实 Key)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Service Role Key (仅服务端使用)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EOF
    echo -e "${RED}👉 请务必手动编辑 .env.local 填入 Supabase Key！${NC}"
else
    echo -e "${GREEN}✅ .env.local 已存在${NC}"
fi

echo -e "\n------------------------------------------------"
echo -e "${GREEN}🎉 开发环境准备就绪！${NC}"
echo -e "接下来请运行: ${BLUE}npm run dev${NC}"
