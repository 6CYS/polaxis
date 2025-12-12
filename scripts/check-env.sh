#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 开始检查开发环境...${NC}\n"

ERROR_COUNT=0

# 1. 检查 Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1 | tr -d 'v')
    if [ "$MAJOR_VERSION" -ge 18 ]; then
        echo -e "${GREEN}OK ($NODE_VERSION)${NC}"
    else
        echo -e "${RED}版本过低 ($NODE_VERSION)${NC}"
        echo -e "  -> 请升级到 Node.js 18 或更高版本: https://nodejs.org/"
        ((ERROR_COUNT++))
    fi
else
    echo -e "${RED}未安装${NC}"
    echo -e "  -> 请安装 Node.js: https://nodejs.org/"
    ((ERROR_COUNT++))
fi

# 2. 检查 Git
echo -n "Checking Git...     "
if command -v git &> /dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}未安装${NC}"
    echo -e "  -> 请安装 Git: https://git-scm.com/"
    ((ERROR_COUNT++))
fi

# 3. 检查 Just
echo -n "Checking Just...    "
if command -v just &> /dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}未安装 (可选，但推荐)${NC}"
    echo -e "  -> macOS: brew install just"
    echo -e "  -> 其他: https://github.com/casey/just"
    # Just 不是强制的，不计入 Error
fi

# 4. 检查包管理器 (优先 npm)
echo -n "Checking npm...     "
if command -v npm &> /dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}未安装${NC}"
    ((ERROR_COUNT++))
fi

echo -e "\n-----------------------------------"

if [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ 环境检查通过！你可以开始初始化项目了。${NC}"
    echo -e "下一步: 运行 'npx create-next-app@latest . ' (如果在空目录) 或相关初始化命令。"
    exit 0
else
    echo -e "${RED}❌ 发现 $ERROR_COUNT 个问题，请先修复上述问题再继续。${NC}"
    exit 1
fi
