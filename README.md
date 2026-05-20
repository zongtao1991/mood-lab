# Mood Lab - 情绪实验室全栈项目

一个功能丰富的全栈个人主页项目，包含苹果回收估价、摄影风格展示、AI 项目展示等功能。

## 功能特性

### 📱 苹果回收估价系统
- 设备管理：支持 iPhone、iPad、AirPods、Apple Watch 等多种设备
- 报价管理：按日期、保修类型（在保/过保）管理设备报价
- 扣费规则：自定义设备状态扣费规则
- OCR 识别：支持上传报价图片自动识别（需配置 Claude API）
- 询价功能：用户可以提交询价请求

### 📸 摄影风格展示
- 多种摄影风格分类展示
- 风格详情和参数说明
- 支持搜索和筛选

### 🤖 AI 项目展示
- 项目卡片展示
- 项目状态管理（概念/开发中/已完成）
- 项目详情和功能介绍

### 🔐 安全特性
- **JWT 认证**：使用 JSON Web Token 进行身份验证
- **密码哈希**：使用 bcrypt 算法安全存储密码
- **速率限制**：防止暴力破解和 API 滥用
- **安全头**：使用 Helmet 设置 HTTP 安全头
- **CORS 配置**：灵活的跨域资源共享策略
- **输入验证**：防止注入攻击和恶意输入
- **操作日志**：所有管理员操作记录审计日志

## 技术栈

### 后端
- **Node.js** - 运行时环境
- **Express.js** - Web 框架
- **SQLite** - 数据库（使用 better-sqlite3）
- **JWT** - 身份验证
- **bcryptjs** - 密码哈希
- **Helmet** - 安全中间件
- **express-rate-limit** - 速率限制
- **multer** - 文件上传处理

### 前端
- **原生 HTML/CSS/JavaScript** - 无需构建工具
- **响应式设计** - 支持移动端和桌面端
- **本地存储** - Token 持久化存储

## 安装和配置

### 环境要求
- Node.js >= 16.0.0
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd mood-lab
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，配置您的参数
# 重要：请务必修改 JWT_SECRET 和默认管理员密码
```

4. **初始化数据库（首次运行）**
```bash
npm run init-db
```

5. **启动开发服务器**
```bash
npm run dev
```

### 环境变量配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 服务器端口 | 3000 |
| `NODE_ENV` | 运行环境 | development |
| `DB_PATH` | 数据库文件路径 | ./data/mood-lab.db |
| `JWT_SECRET` | JWT 签名密钥（请使用强随机字符串） | 无 |
| `JWT_EXPIRES_IN` | JWT 过期时间 | 24h |
| `ADMIN_USERNAME` | 默认管理员用户名 | admin |
| `ADMIN_PASSWORD` | 默认管理员密码 | 无 |
| `CLAUDE_API_KEY` | Claude API 密钥（用于 OCR 识别） | 无 |
| `CORS_ORIGINS` | CORS 允许的来源（多个用逗号分隔） | http://localhost:3000 |
| `MAX_UPLOAD_SIZE` | 最大上传文件大小 | 10MB |
| `DAILY_UPLOAD_QUOTA` | 每日上传配额 | 10 |

## 使用方法

### 访问应用

- **主页**：http://localhost:3000
- **管理后台**：http://localhost:3000/admin

### 默认管理员凭据

- 用户名：`admin`
- 密码：您在 `.env` 中设置的 `ADMIN_PASSWORD`

**重要**：首次登录后请立即修改默认密码！

### 常用脚本命令

```bash
# 启动开发服务器（带热重载）
npm run dev

# 启动生产服务器
npm start

# 初始化数据库
npm run init-db

# 运行数据库迁移
npm run migrate-db

# 生成密码哈希（用于手动创建管理员）
npm run hash-password <your-password>
```

## API 文档

### 认证 API

#### 登录
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your-password"
}

Response:
{
  "success": true,
  "data": {
    "username": "admin",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "24h"
  }
}
```

#### 获取用户信息
```
GET /api/auth/me
Authorization: Bearer <token>
```

#### 登出
```
POST /api/auth/logout
Authorization: Bearer <token>
```

### 设备管理 API

#### 获取所有设备
```
GET /api/devices
```

#### 添加设备（需要认证）
```
POST /api/devices
Authorization: Bearer <token>
Content-Type: application/json
```

#### 更新设备（需要认证）
```
PUT /api/devices/:id
Authorization: Bearer <token>
Content-Type: application/json
```

#### 删除设备（需要认证）
```
DELETE /api/devices/:id
Authorization: Bearer <token>
```

### 报价管理 API

#### 获取报价概览
```
GET /api/prices/overview
```

#### 批量更新报价（需要认证）
```
POST /api/prices/batch
Authorization: Bearer <token>
Content-Type: application/json
```

### 询价 API

#### 提交询价
```
POST /api/inquiries
Content-Type: application/json
```

#### 获取所有询价（需要认证）
```
GET /api/inquiries
Authorization: Bearer <token>
```

#### 更新询价状态（需要认证）
```
PUT /api/inquiries/:id/status
Authorization: Bearer <token>
Content-Type: application/json
```

#### 删除询价（需要认证）
```
DELETE /api/inquiries/:id
Authorization: Bearer <token>
```

### 上传 API

#### 上传图片（需要认证）
```
POST /api/ocr/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- image: 文件
- warranty_type: warranty | expired
- price_date: YYYY-MM-DD
```

#### 获取上传历史（需要认证）
```
GET /api/ocr/history
Authorization: Bearer <token>
```

## 安全特性详解

### 1. JWT 认证
- 使用 HS256 算法签名
- Token 包含用户 ID、用户名和签发时间
- 支持过期时间配置（默认 24 小时）
- 所有管理 API 都需要 Bearer Token 认证

### 2. 密码安全
- 使用 bcrypt 算法进行密码哈希
- 盐值轮数：10 轮
- 支持明文密码自动迁移（首次登录时自动转为哈希存储）

### 3. 速率限制
- **通用 API**：100 次请求 / 15 分钟
- **登录 API**：10 次请求 / 15 分钟
- 超出限制返回 429 状态码

### 4. 安全头（Helmet）
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- Referrer-Policy
- Cross-Origin-Opener-Policy

### 5. CORS 配置
- 支持配置多个允许的来源
- 开发环境允许所有来源
- 生产环境严格限制允许的来源

### 6. 输入验证
- 用户名：字母数字和下划线，3-20 字符
- 密码：至少 6 字符
- 手机号：中国大陆手机号格式验证
- 所有输入都经过清理，防止 XSS 和注入攻击

## 项目结构

```
mood-lab/
├── data/                    # 数据目录
│   ├── config.json         # 配置文件
│   └── mood-lab.db         # SQLite 数据库
├── database/                # 数据库模块
│   └── db.js               # 数据库连接和初始化
├── public/                  # 静态文件
│   ├── admin/              # 管理后台
│   │   └── index.html
│   └── index.html          # 主页
├── routes/                  # API 路由
│   ├── auth.js             # 认证路由
│   ├── deductions.js        # 扣费规则路由
│   ├── devices.js          # 设备管理路由
│   ├── inquiries.js         # 询价路由
│   ├── ocr.js              # OCR 上传路由
│   ├── phones.js           # 手机管理路由
│   ├── prices.js           # 报价管理路由
│   ├── projects.js         # AI 项目路由
│   ├── recipes.js          # 摄影风格路由
│   └── upload.js           # 文件上传路由
├── scripts/                 # 脚本文件
│   ├── init-db.js          # 数据库初始化
│   ├── migrate-db.js       # 数据库迁移
│   ├── seed-apple.js       # 苹果设备数据种子
│   ├── seed-apple-recycle.js # 回收数据种子
│   └── seed-supplement.js  # 补充数据种子
├── uploads/                 # 上传文件目录
├── .env                     # 环境变量（不提交到 git）
├── .env.example             # 环境变量示例
├── .gitignore              # Git 忽略规则
├── package.json            # 项目配置
├── README.md               # 项目文档
└── server.js               # 主服务器文件
```

## 开发指南

### 添加新的 API 路由

1. 在 `routes/` 目录下创建新的路由文件
2. 在 `server.js` 中引入并挂载路由
3. 为需要认证的端点添加 `requireAuth` 中间件

示例：
```javascript
// routes/myroute.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('./auth');
const { sanitizeInput } = require('./auth');

// 公开 API
router.get('/', (req, res) => {
  res.json({ success: true, data: [] });
});

// 需要认证的 API
router.post('/', requireAuth, (req, res) => {
  const data = sanitizeInput(req.body.data);
  // 处理逻辑...
  res.json({ success: true });
});

module.exports = router;
```

### 数据库迁移

当需要修改数据库结构时：

1. 在 `scripts/migrate-db.js` 中添加迁移逻辑
2. 运行迁移命令：`npm run migrate-db`

注意：SQLite 的 ALTER TABLE 有一些限制，如不支持添加带 `DEFAULT CURRENT_TIMESTAMP` 的列。

## 部署建议

### 生产环境配置

1. **环境变量**
   ```bash
   NODE_ENV=production
   JWT_SECRET=<your-strong-secret-key-at-least-32-chars>
   ADMIN_PASSWORD=<your-strong-admin-password>
   CORS_ORIGINS=https://your-domain.com
   ```

2. **安全建议**
   - 使用 HTTPS（建议使用 Let's Encrypt）
   - 配置反向代理（Nginx）
   - 限制数据库文件权限
   - 定期备份数据库
   - 监控服务器日志

3. **性能优化**
   - 启用 gzip 压缩
   - 配置静态文件缓存
   - 考虑使用 Redis 缓存热点数据
   - 数据库查询添加适当的索引

### Docker 部署

可以创建 Dockerfile 来容器化部署：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

VOLUME ["/app/data", "/app/uploads"]

CMD ["npm", "start"]
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 `data/` 目录权限
   - 检查 `DB_PATH` 环境变量

2. **登录失败**
   - 检查管理员凭据是否正确
   - 检查数据库中是否有管理员账户
   - 检查 JWT_SECRET 是否配置

3. **API 401 错误**
   - 检查是否在请求头中发送了 Bearer Token
   - 检查 Token 是否已过期
   - 检查 JWT_SECRET 是否一致

4. **CORS 错误**
   - 检查 `CORS_ORIGINS` 环境变量
   - 确保前端域名在允许列表中

5. **文件上传失败**
   - 检查 `uploads/` 目录权限
   - 检查 `MAX_UPLOAD_SIZE` 配置
   - 检查文件类型是否被允许

### 日志查看

- 开发环境：控制台输出
- 生产环境：建议配置日志记录器
- 所有管理员操作都会记录到控制台

## 更新日志

### v1.1.0
- ✅ 实现 JWT 身份验证
- ✅ 添加 bcrypt 密码哈希
- ✅ 集成 Helmet 安全中间件
- ✅ 添加速率限制
- ✅ 配置 CORS 策略
- ✅ 添加输入验证和清理
- ✅ 实现操作日志记录
- ✅ 创建环境变量管理
- ✅ 统一数据库访问方式
- ✅ 修复数据库迁移问题

### v1.0.0
- 初始版本发布
- 基础功能实现

## 贡献指南

1. Fork 项目
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

MIT License - 详见 LICENSE 文件

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。

---

**⚠️ 安全提醒**：
- 请务必修改默认的 JWT_SECRET 和管理员密码
- 生产环境请使用 HTTPS
- 定期更新依赖包以修复安全漏洞
- 不要将 `.env` 文件提交到版本控制系统
