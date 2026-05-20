const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database/db');
const { requireAuth, sanitizeInput } = require('./auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'settings');
    fs.ensureDirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// 获取所有设置
router.get('/', (req, res) => {
  try {
    const settings = db.prepare('SELECT setting_key, setting_value FROM site_settings').all();
    const result = {};
    settings.forEach(s => {
      result[s.setting_key] = s.setting_value;
    });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('获取设置失败:', err);
    res.status(500).json({ error: '获取设置失败' });
  }
});

// 获取公开设置（不需要登录）
router.get('/public', (req, res) => {
  try {
    const publicKeys = [
      'contact_name',
      'contact_tagline',
      'contact_phone',
      'contact_email',
      'contact_wechat',
      'contact_avatar',
      'contact_wechat_qr'
    ];
    
    const settings = db.prepare(`
      SELECT setting_key, setting_value 
      FROM site_settings 
      WHERE setting_key IN (${publicKeys.map(() => '?').join(',')})
    `).all(publicKeys);
    
    const result = {};
    settings.forEach(s => {
      result[s.setting_key] = s.setting_value;
    });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('获取公开设置失败:', err);
    res.status(500).json({ error: '获取设置失败' });
  }
});

// 更新设置
router.put('/', requireAuth, (req, res) => {
  try {
    const updates = req.body;
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: '无效的请求数据' });
    }

    const updateStmt = db.prepare(`
      UPDATE site_settings 
      SET setting_value = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE setting_key = ?
    `);

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO site_settings (setting_key, setting_value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);

    const transaction = db.transaction((items) => {
      for (const [key, value] of Object.entries(items)) {
        const safeKey = sanitizeInput(key);
        const safeValue = sanitizeInput(String(value));
        insertStmt.run(safeKey, safeValue);
      }
    });

    transaction(updates);
    
    console.log(`⚙️  管理员 ${req.adminUser.username} 更新了网站设置`);
    
    res.json({ success: true, message: '设置已更新' });
  } catch (err) {
    console.error('更新设置失败:', err);
    res.status(500).json({ error: '更新设置失败' });
  }
});

// 更新单个设置
router.put('/:key', requireAuth, (req, res) => {
  try {
    const key = req.params.key;
    const value = req.body.value;

    if (value === undefined || value === null) {
      return res.status(400).json({ error: '值不能为空' });
    }

    const safeKey = sanitizeInput(key);
    const safeValue = sanitizeInput(String(value));

    db.prepare(`
      INSERT OR REPLACE INTO site_settings (setting_key, setting_value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).run(safeKey, safeValue);
    
    console.log(`⚙️  管理员 ${req.adminUser.username} 更新了设置: ${key}`);
    
    res.json({ success: true, message: '设置已更新' });
  } catch (err) {
    console.error('更新设置失败:', err);
    res.status(500).json({ error: '更新设置失败' });
  }
});

// 上传微信二维码
router.post('/upload-wechat-qr', requireAuth, upload.single('qr-image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的图片' });
    }

    const oldQr = db.prepare(`
      SELECT setting_value FROM site_settings WHERE setting_key = 'contact_wechat_qr'
    `).get();

    if (oldQr && oldQr.setting_value) {
      const oldPath = path.join(__dirname, '..', oldQr.setting_value);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const relativePath = `/uploads/settings/${req.file.filename}`;
    
    db.prepare(`
      INSERT OR REPLACE INTO site_settings (setting_key, setting_value, updated_at)
      VALUES ('contact_wechat_qr', ?, CURRENT_TIMESTAMP)
    `).run(relativePath);
    
    console.log(`⚙️  管理员 ${req.adminUser.username} 上传了微信二维码`);
    
    res.json({ success: true, message: '上传成功', data: { path: relativePath } });
  } catch (err) {
    console.error('上传微信二维码失败:', err);
    res.status(500).json({ error: '上传失败' });
  }
});

module.exports = router;
