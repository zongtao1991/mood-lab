require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDatabase, db } = require('./database/db');
const bcrypt = require('bcryptjs');

const uploadsDir = path.join(__dirname, 'uploads');
const publicDir = path.join(__dirname, 'public');
fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(publicDir);

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes(origin) || !isProduction) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"]
    }
  } : false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors(corsOptions));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', strictLimiter);

app.use(express.json({ limit: process.env.MAX_UPLOAD_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_UPLOAD_SIZE || '10mb' }));

app.use((req, res, next) => {
  const now = new Date().toISOString();
  const method = req.method.padEnd(6, ' ');
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  console.log(`[${now}] ${method} ${url} - ${ip}`);
  next();
});

app.use(express.static(publicDir, {
  maxAge: isProduction ? '1d' : 0,
  etag: true
}));
app.use('/uploads', express.static(uploadsDir, {
  maxAge: isProduction ? '7d' : 0,
  etag: true
}));

initDatabase();

function initAdminUser() {
  try {
    const existingAdmin = db.prepare('SELECT * FROM admins LIMIT 1').get();
    
    if (!existingAdmin) {
      const username = process.env.ADMIN_USERNAME || 'admin';
      const password = process.env.ADMIN_PASSWORD || 'change_this_password';
      const saltRounds = 10;
      const passwordHash = bcrypt.hashSync(password, saltRounds);
      
      db.prepare(`
        INSERT INTO admins (username, password, created_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `).run(username, passwordHash);
      
      console.log('✅ 默认管理员账户已创建');
      console.log(`   用户名: ${username}`);
      console.log('   ⚠️  请立即修改默认密码！');
    }
  } catch (error) {
    console.error('初始化管理员账户失败:', error);
  }
}

initAdminUser();

const recipesRouter = require('./routes/recipes');
const projectsRouter = require('./routes/projects');
const phonesRouter = require('./routes/phones');
const uploadRouter = require('./routes/upload');
const inquiriesRouter = require('./routes/inquiries');

app.use('/api/recipes', recipesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/phones', phonesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/inquiries', inquiriesRouter);

const authRouter = require('./routes/auth');
const devicesRouter = require('./routes/devices');
const pricesRouter = require('./routes/prices');
const deductionsRouter = require('./routes/deductions');
const ocrRouter = require('./routes/ocr');
const settingsRouter = require('./routes/settings');

app.use('/api/auth', authRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/prices', pricesRouter);
app.use('/api/deductions', deductionsRouter);
app.use('/api/ocr', ocrRouter);
app.use('/api/settings', settingsRouter);

const mixerRouter = require('./routes/mixer');
app.use('/api/mixer', mixerRouter);

const musicRouter = require('./routes/music');
app.use('/api/music', musicRouter);

app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(publicDir, 'admin', 'index.html')));
app.get('/admin/*', (req, res) => res.sendFile(path.join(publicDir, 'admin', 'index.html')));

app.use((err, req, res, next) => {
  console.error('❌ 错误:', err.message);
  console.error(err.stack);
  
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: '请求体格式错误' });
  }
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: '跨域请求被拒绝' });
  }
  
  const statusCode = err.statusCode || 500;
  const errorMessage = isProduction ? '服务器内部错误' : err.message;
  
  res.status(statusCode).json({ 
    error: errorMessage,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API 接口不存在' });
  } else {
    res.status(404).sendFile(path.join(publicDir, 'index.html'));
  }
});

const server = app.listen(PORT, () => {
  console.log('\n🚀 情绪实验室 已启动');
  console.log('═══════════════════════════════════════');
  console.log(`   环境: ${NODE_ENV}`);
  console.log(`   端口: ${PORT}`);
  console.log('═══════════════════════════════════════');
  console.log(`   主页: http://localhost:${PORT}`);
  console.log(`   管理后台: http://localhost:${PORT}/admin`);
  console.log(`   静态文件: ${publicDir}`);
  console.log(`   上传目录: ${uploadsDir}`);
  console.log('═══════════════════════════════════════\n');
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    db.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    db.close();
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});

module.exports = app;
