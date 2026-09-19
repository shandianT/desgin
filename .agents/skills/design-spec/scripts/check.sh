#!/usr/bin/env sh
# 转发到仓库统一入口；技能里只保留这一行，避免第二套脚本
cd "$(dirname "$0")/../../../.." && node tools/check.mjs "$@"
