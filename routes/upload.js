const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database/db');
const { requireAuth } = require('./auth');

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const uploadDir = path.join(__dirname, '..', 'uploads', dateStr);
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('不支持的文件格式，仅支持 JPEG、PNG、WebP 和 GIF'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

function getUserIdentifier(req) {
  return req.ip || req.connection.remoteAddress || 'unknown';
}

function getQuotaLimit() {
  try {
    const row = db.prepare("SELECT setting_value FROM site_settings WHERE setting_key = 'upload_daily_quota'").get();
    return row ? parseInt(row.setting_value) || 10 : 10;
  } catch(e) { return 10; }
}

function isUploadEnabled() {
  try {
    const row = db.prepare("SELECT setting_value FROM site_settings WHERE setting_key = 'upload_enabled'").get();
    return row ? row.setting_value === '1' : true;
  } catch(e) { return true; }
}

function checkQuota(userIdentifier) {
  const today = new Date().toISOString().split('T')[0];
  const quota = getQuotaLimit();
  const row = db.prepare('SELECT COUNT(*) as count FROM uploads WHERE user_identifier = ? AND upload_date = ?').get(userIdentifier, today);
  const used = row.count || 0;
  return { used, remaining: Math.max(0, quota - used), quota };
}

function recordUpload(userIdentifier, fileName, filePath, fileSize) {
  const today = new Date().toISOString().split('T')[0];
  db.prepare('INSERT INTO uploads (user_identifier, file_name, file_path, file_size, upload_date) VALUES (?,?,?,?,?)').run(userIdentifier, fileName, filePath, fileSize, today);
}

router.get('/quota', (req, res) => {
  try {
    const quotaInfo = checkQuota(getUserIdentifier(req));
    res.json({ success: true, data: quotaInfo });
  } catch (error) {
    console.error('获取配额信息失败:', error);
    res.status(500).json({ error: '获取配额信息失败' });
  }
});

router.post('/single', async (req, res) => {
  try {
    if (!isUploadEnabled()) return res.status(403).json({ error: '上传功能已关闭' });
    const userIdentifier = getUserIdentifier(req);
    const quotaInfo = checkQuota(userIdentifier);
    if (quotaInfo.remaining <= 0) return res.status(429).json({ error: '今日上传配额已用完', quota: quotaInfo });

    const singleUpload = upload.single('image');
    singleUpload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: '文件大小超过限制 (最大 10MB)' });
        return res.status(400).json({ error: `上传错误: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (!req.file) return res.status(400).json({ error: '没有选择文件' });

      recordUpload(userIdentifier, req.file.filename, req.file.path, req.file.size);
      const updatedQuota = checkQuota(userIdentifier);

      res.json({
        success: true,
        data: {
          fileName: req.file.filename,
          originalName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          url: `/uploads/${path.basename(path.dirname(req.file.path))}/${req.file.filename}`
        },
        quota: updatedQuota
      });
    });
  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

router.post('/multiple', async (req, res) => {
  try {
    if (!isUploadEnabled()) return res.status(403).json({ error: '上传功能已关闭' });
    const userIdentifier = getUserIdentifier(req);
    const quotaInfo = checkQuota(userIdentifier);
    if (quotaInfo.remaining <= 0) return res.status(429).json({ error: '今日上传配额已用完', quota: quotaInfo });

    const maxFiles = Math.min(quotaInfo.remaining, 5);
    const multiUpload = upload.array('images', maxFiles);

    multiUpload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: '文件大小超过限制 (最大 10MB)' });
        if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ error: `超过最大文件数量限制 (最多 ${maxFiles} 张)` });
        return res.status(400).json({ error: `上传错误: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (!req.files || req.files.length === 0) return res.status(400).json({ error: '没有选择文件' });

      const uploadedFiles = [];
      for (const file of req.files) {
        recordUpload(userIdentifier, file.filename, file.path, file.size);
        uploadedFiles.push({
          fileName: file.filename,
          originalName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          url: `/uploads/${path.basename(path.dirname(file.path))}/${file.filename}`
        });
      }

      res.json({ success: true, data: uploadedFiles, quota: checkQuota(userIdentifier) });
    });
  } catch (error) {
    console.error('批量上传失败:', error);
    res.status(500).json({ error: '批量上传失败' });
  }
});

router.get('/history', (req, res) => {
  try {
    const userIdentifier = getUserIdentifier(req);
    const rows = db.prepare('SELECT * FROM uploads WHERE user_identifier = ? ORDER BY created_at DESC LIMIT 50').all(userIdentifier);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('获取上传历史失败:', error);
    res.status(500).json({ error: '获取上传历史失败' });
  }
});

// Admin endpoints
router.get('/admin/list', requireAuth, (req, res) => {
  try {
    const { limit = 100, offset = 0, date } = req.query;
    let query = 'SELECT * FROM uploads';
    const params = [];
    if (date) { query += ' WHERE upload_date = ?'; params.push(date); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const rows = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as c FROM uploads' + (date ? ' WHERE upload_date = ?' : '')).get(...(date ? [date] : []));
    res.json({ success: true, data: rows, total: total.c });
  } catch(e) { res.status(500).json({ error: '获取失败' }); }
});

router.delete('/admin/:id', requireAuth, (req, res) => {
  try {
    const row = db.prepare('SELECT file_path FROM uploads WHERE id = ?').get(req.params.id);
    if (row && row.file_path && fs.existsSync(row.file_path)) fs.unlinkSync(row.file_path);
    db.prepare('DELETE FROM uploads WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: '删除失败' }); }
});

router.post('/admin/reset-quota', requireAuth, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const r = db.prepare('DELETE FROM uploads WHERE upload_date = ?').run(today);
    res.json({ success: true, data: { cleared: r.changes } });
  } catch(e) { res.status(500).json({ error: '重置失败' }); }
});

module.exports = router;
