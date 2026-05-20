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
    const dir = path.join(__dirname, '..', 'uploads', 'products');
    fs.ensureDirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 },
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

router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT p.*, d.name, d.icon, d.series, d.storage_options, d.sort_order
      FROM phone_pricing p
      JOIN phones d ON p.phone_id = d.phone_id
      WHERE d.in_stock = 1
      ORDER BY d.series, d.sort_order, p.storage, p.condition_grade
    `).all();

    const result = {};
    for (const r of rows) {
      if (!result[r.series]) result[r.series] = {};
      if (!result[r.series][r.phone_id]) {
        result[r.series][r.phone_id] = {
          name: r.name,
          icon: r.icon,
          sortOrder: r.sort_order,
          storageOptions: JSON.parse(r.storage_options || '[]'),
          pricing: {},
        };
      }
      const dev = result[r.series][r.phone_id];
      if (!dev.pricing[r.storage]) dev.pricing[r.storage] = {};
      dev.pricing[r.storage][r.condition_grade] = {
        recycle: r.recycle_price,
        sell: r.sell_price,
      };
    }
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('获取手机数据失败:', err);
    res.status(500).json({ error: '获取数据失败' });
  }
});

router.get('/list', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM phones WHERE in_stock = 1 ORDER BY series, sort_order').all();
    const grouped = {};
    for (const r of rows) {
      if (!grouped[r.series]) grouped[r.series] = [];
      grouped[r.series].push({
        id: r.phone_id,
        name: r.name,
        storage: JSON.parse(r.storage_options || '[]'),
        icon: r.icon,
      });
    }
    res.json({ success: true, data: grouped });
  } catch (err) {
    console.error('获取设备列表失败:', err);
    res.status(500).json({ error: '获取数据失败' });
  }
});

// 批量上下架（必须在 /:phoneId 路由之前）
router.put('/batch/stock', requireAuth, (req, res) => {
  try {
    const { phone_ids, in_stock } = req.body;
    if (!Array.isArray(phone_ids)) return res.status(400).json({ error: 'phone_ids 必须是数组' });
    const stmt = db.prepare('UPDATE phones SET in_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE phone_id = ?');
    let count = 0;
    phone_ids.forEach(id => {
      const r = stmt.run(in_stock ? 1 : 0, id);
      count += r.changes;
    });
    res.json({ success: true, data: { updated: count } });
  } catch (err) {
    console.error('批量操作失败:', err);
    res.status(500).json({ error: '批量操作失败' });
  }
});

router.get('/:phoneId/pricing', (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM phone_pricing WHERE phone_id = ? ORDER BY storage, condition_grade'
    ).all(req.params.phoneId);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('获取报价失败:', err);
    res.status(500).json({ error: '获取报价失败' });
  }
});

router.post('/', requireAuth, (req, res) => {
  try {
    let { phone_id, name, series, icon, storage_options, specs, condition, color, condition_desc, price, original_price, features, image_path, in_stock } = req.body;
    
    phone_id = sanitizeInput(phone_id);
    name = sanitizeInput(name);
    series = sanitizeInput(series) || '';
    icon = sanitizeInput(icon) || '📱';
    condition = sanitizeInput(condition) || '';
    condition_desc = sanitizeInput(condition_desc) || '';
    image_path = sanitizeInput(image_path) || '';
    color = sanitizeInput(color) || '';
    
    if (!phone_id || !name) {
      return res.status(400).json({ error: '缺少必要字段' });
    }

    const result = db.prepare(`
      INSERT INTO phones (phone_id, name, series, model, icon, storage_options, specs, condition, color, condition_desc, price, original_price, features, image_path, in_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      phone_id, name, series, '', icon,
      JSON.stringify(storage_options || []),
      JSON.stringify(specs || []),
      condition, color, condition_desc,
      price || 0, original_price || 0,
      JSON.stringify(features || []),
      image_path, in_stock !== false ? 1 : 0
    );
    
    console.log(`📱 管理员 ${req.adminUser.username} 添加手机: ${name} (${phone_id})`);
    
    res.json({ success: true, data: { id: result.lastInsertRowid, phone_id } });
  } catch (err) {
    console.error('添加设备失败:', err);
    if (err.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ error: '设备ID已存在' });
    }
    res.status(500).json({ error: '添加失败' });
  }
});

router.put('/:phoneId', requireAuth, (req, res) => {
  try {
    const { name, series, model, icon, storage_options, price, in_stock, color } = req.body;
    const phoneId = req.params.phoneId;
    
    const result = db.prepare(`
      UPDATE phones SET
        name = COALESCE(?, name),
        series = COALESCE(?, series),
        model = COALESCE(?, model),
        icon = COALESCE(?, icon),
        storage_options = COALESCE(?, storage_options),
        price = COALESCE(?, price),
        in_stock = COALESCE(?, in_stock),
        color = COALESCE(?, color),
        updated_at = CURRENT_TIMESTAMP
      WHERE phone_id = ?
    `).run(
      name, series, model, icon,
      storage_options ? JSON.stringify(storage_options) : undefined,
      price, in_stock !== undefined ? (in_stock ? 1 : 0) : undefined, color,
      phoneId
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '设备不存在' });
    }
    
    console.log(`📱 管理员 ${req.adminUser.username} 更新手机: ${phoneId}`);
    
    res.json({ success: true });
  } catch (err) {
    console.error('更新设备失败:', err);
    res.status(500).json({ error: '更新失败' });
  }
});

router.post('/:phoneId/pricing', requireAuth, (req, res) => {
  try {
    let { storage, condition_grade, recycle_price, sell_price } = req.body;
    const phoneId = req.params.phoneId;
    
    storage = sanitizeInput(storage);
    condition_grade = sanitizeInput(condition_grade);
    
    if (!storage || !condition_grade) {
      return res.status(400).json({ error: '缺少 storage 或 condition_grade' });
    }

    db.prepare(`
      INSERT INTO phone_pricing (phone_id, storage, condition_grade, recycle_price, sell_price)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(phone_id, storage, condition_grade)
      DO UPDATE SET recycle_price = excluded.recycle_price, sell_price = excluded.sell_price, updated_at = CURRENT_TIMESTAMP
    `).run(phoneId, storage, condition_grade, recycle_price || 0, sell_price || 0);
    
    console.log(`💰 管理员 ${req.adminUser.username} 更新报价: ${phoneId}/${storage}/${condition_grade}`);
    
    res.json({ success: true });
  } catch (err) {
    console.error('更新报价失败:', err);
    res.status(500).json({ error: '更新报价失败' });
  }
});

// 删除单条定价
router.delete('/:phoneId/pricing', requireAuth, (req, res) => {
  try {
    const phoneId = req.params.phoneId;
    const { storage, condition_grade } = req.body;
    if (!storage || !condition_grade) {
      return res.status(400).json({ error: '缺少 storage 或 condition_grade' });
    }
    const result = db.prepare(
      'DELETE FROM phone_pricing WHERE phone_id = ? AND storage = ? AND condition_grade = ?'
    ).run(phoneId, storage, condition_grade);
    if (result.changes === 0) {
      return res.status(404).json({ error: '未找到对应定价' });
    }
    console.log(`🗑️ 管理员 ${req.adminUser.username} 删除定价: ${phoneId}/${storage}/${condition_grade}`);
    res.json({ success: true, message: '定价已删除' });
  } catch (err) {
    console.error('删除定价失败:', err);
    res.status(500).json({ error: '删除失败' });
  }
});

router.delete('/:phoneId', requireAuth, (req, res) => {
  try {
    const phoneId = req.params.phoneId;
    
    const phone = db.prepare('SELECT name, image_path FROM phones WHERE phone_id = ?').get(phoneId);
    
    if (!phone) {
      return res.status(404).json({ error: '设备不存在' });
    }
    
    // 删除图片文件
    if (phone.image_path) {
      const oldPath = path.join(__dirname, '..', phone.image_path.replace(/^\//, ''));
      if (fs.existsSync(oldPath)) {
        fs.removeSync(oldPath);
      }
    }
    
    db.prepare('DELETE FROM phone_pricing WHERE phone_id = ?').run(phoneId);
    const result = db.prepare('DELETE FROM phones WHERE phone_id = ?').run(phoneId);
    
    console.log(`🗑️  管理员 ${req.adminUser.username} 删除手机: ${phone.name} (${phoneId})`);
    
    res.json({ success: true, message: '设备已删除' });
  } catch (err) {
    console.error('删除设备失败:', err);
    res.status(500).json({ error: '删除失败' });
  }
});

// 上传设备图片
router.post('/:phoneId/image', requireAuth, upload.single('image'), (req, res) => {
  try {
    const phoneId = req.params.phoneId;
    
    if (!req.file) {
      return res.status(400).json({ error: '未选择文件' });
    }
    
    const phone = db.prepare('SELECT name, image_path FROM phones WHERE phone_id = ?').get(phoneId);
    
    if (!phone) {
      // 删除刚上传的文件
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        fs.removeSync(filePath);
      }
      return res.status(404).json({ error: '设备不存在' });
    }
    
    // 删除旧图片
    if (phone.image_path) {
      const oldPath = path.join(__dirname, '..', phone.image_path.replace(/^\//, ''));
      if (fs.existsSync(oldPath)) {
        fs.removeSync(oldPath);
      }
    }
    
    const imagePath = `/uploads/products/${req.file.filename}`;
    
    db.prepare('UPDATE phones SET image_path = ?, updated_at = CURRENT_TIMESTAMP WHERE phone_id = ?').run(imagePath, phoneId);
    
    console.log(`📷 管理员 ${req.adminUser.username} 上传图片: ${phone.name} (${phoneId}) -> ${imagePath}`);
    
    res.json({
      success: true,
      data: {
        image_path: imagePath,
        file_name: req.file.originalname
      }
    });
  } catch (err) {
    console.error('上传图片失败:', err);
    res.status(500).json({ error: '上传失败' });
  }
});

// 删除设备图片
router.delete('/:phoneId/image', requireAuth, (req, res) => {
  try {
    const phoneId = req.params.phoneId;
    
    const phone = db.prepare('SELECT name, image_path FROM phones WHERE phone_id = ?').get(phoneId);
    
    if (!phone) {
      return res.status(404).json({ error: '设备不存在' });
    }
    
    if (!phone.image_path) {
      return res.status(400).json({ error: '设备没有图片' });
    }
    
    // 删除图片文件
    const oldPath = path.join(__dirname, '..', phone.image_path.replace(/^\//, ''));
    if (fs.existsSync(oldPath)) {
      fs.removeSync(oldPath);
    }
    
    db.prepare('UPDATE phones SET image_path = NULL, updated_at = CURRENT_TIMESTAMP WHERE phone_id = ?').run(phoneId);
    
    console.log(`🗑️  管理员 ${req.adminUser.username} 删除图片: ${phone.name} (${phoneId})`);
    
    res.json({ success: true, message: '图片已删除' });
  } catch (err) {
    console.error('删除图片失败:', err);
    res.status(500).json({ error: '删除失败' });
  }
});

// 批量获取设备信息（包含最低售价）
router.get('/list/with-pricing', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        p.*,
        MIN(pp.sell_price) as min_price,
        MAX(pp.sell_price) as max_price
      FROM phones p
      LEFT JOIN phone_pricing pp ON p.phone_id = pp.phone_id
      WHERE p.in_stock = 1
      GROUP BY p.phone_id
      ORDER BY 
        CASE p.series 
          WHEN 'iPhone' THEN 1 
          WHEN 'iPad' THEN 2 
          WHEN 'MacBook' THEN 3 
          WHEN 'Mac' THEN 4 
          WHEN 'AirPods' THEN 5 
          WHEN 'Apple Watch' THEN 6 
          ELSE 7 
        END,
        p.sort_order
    `).all();

    const grouped = {};
    for (const r of rows) {
      const series = r.series || '其他';
      if (!grouped[series]) grouped[series] = [];
      grouped[series].push({
        id: r.phone_id,
        name: r.name,
        series: r.series,
        icon: r.icon,
        color: r.color || '',
        min_price: r.min_price,
        max_price: r.max_price,
        image_path: r.image_path,
        in_stock: r.in_stock === 1,
        sort_order: r.sort_order,
        storage_options: JSON.parse(r.storage_options || '[]')
      });
    }

    res.json({ success: true, data: grouped });
  } catch (err) {
    console.error('获取设备列表失败:', err);
    res.status(500).json({ error: '获取数据失败' });
  }
});

// 上下架状态切换
router.put('/:phoneId/stock', requireAuth, (req, res) => {
  try {
    const phoneId = req.params.phoneId;
    const phone = db.prepare('SELECT in_stock FROM phones WHERE phone_id = ?').get(phoneId);
    if (!phone) {
      return res.status(404).json({ error: '设备不存在' });
    }
    const newStatus = phone.in_stock ? 0 : 1;
    db.prepare('UPDATE phones SET in_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE phone_id = ?').run(newStatus, phoneId);
    res.json({ success: true, data: { in_stock: newStatus === 1 } });
  } catch (err) {
    console.error('切换库存状态失败:', err);
    res.status(500).json({ error: '操作失败' });
  }
});

// 重置图标为默认 emoji
router.put('/:phoneId/icon/reset', requireAuth, (req, res) => {
  try {
    const phoneId = req.params.phoneId;
    const result = db.prepare('UPDATE phones SET image_path = NULL, updated_at = CURRENT_TIMESTAMP WHERE phone_id = ?').run(phoneId);
    if (result.changes === 0) {
      return res.status(404).json({ error: '设备不存在' });
    }
    console.log(`🔄 管理员 ${req.adminUser.username} 重置图标: ${phoneId}`);
    res.json({ success: true, message: '图标已重置为默认' });
  } catch (err) {
    console.error('重置图标失败:', err);
    res.status(500).json({ error: '操作失败' });
  }
});

// 批量上传多图片
router.post('/:phoneId/images', requireAuth, upload.array('images', 10), (req, res) => {
  try {
    const phoneId = req.params.phoneId;
    const phone = db.prepare('SELECT name, image_path FROM phones WHERE phone_id = ?').get(phoneId);
    if (!phone) {
      // 删除刚上传的文件
      if (req.files) {
        req.files.forEach(f => { if (fs.existsSync(f.path)) fs.removeSync(f.path); });
      }
      return res.status(404).json({ error: '设备不存在' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '未选择文件' });
    }

    const insertStmt = db.prepare('INSERT INTO phone_images (phone_id, image_path, sort_order) VALUES (?, ?, ?)');
    const uploadedPaths = [];
    let maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM phone_images WHERE phone_id = ?').get(phoneId);
    let sortOrder = (maxOrder && maxOrder.m != null) ? maxOrder.m + 1 : 0;

    req.files.forEach(file => {
      const imagePath = `/uploads/products/${file.filename}`;
      insertStmt.run(phoneId, imagePath, sortOrder++);
      uploadedPaths.push(imagePath);
    });

    // 如果是第一张图片且设备没有图标，自动设置为图标
    if (!phone.image_path && uploadedPaths.length > 0) {
      db.prepare('UPDATE phones SET image_path = ?, updated_at = CURRENT_TIMESTAMP WHERE phone_id = ?').run(uploadedPaths[0], phoneId);
    }

    console.log(`📷 管理员 ${req.adminUser.username} 上传 ${uploadedPaths.length} 张图片: ${phone.name} (${phoneId})`);
    res.json({ success: true, data: { images: uploadedPaths } });
  } catch (err) {
    console.error('批量上传图片失败:', err);
    res.status(500).json({ error: '上传失败' });
  }
});

// 获取设备所有图片
router.get('/:phoneId/images', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, image_path, sort_order FROM phone_images WHERE phone_id = ? ORDER BY sort_order').all(req.params.phoneId);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('获取图片列表失败:', err);
    res.status(500).json({ error: '获取失败' });
  }
});

// 删除指定图片
router.delete('/:phoneId/images/:imageId', requireAuth, (req, res) => {
  try {
    const { phoneId, imageId } = req.params;
    const img = db.prepare('SELECT * FROM phone_images WHERE id = ? AND phone_id = ?').get(imageId, phoneId);
    if (!img) {
      return res.status(404).json({ error: '图片不存在' });
    }
    // 删除文件
    const filePath = path.join(__dirname, '..', img.image_path.replace(/^\//, ''));
    if (fs.existsSync(filePath)) {
      fs.removeSync(filePath);
    }
    db.prepare('DELETE FROM phone_images WHERE id = ?').run(imageId);
    // 如果删除的是设备主图，重置为下一张或 NULL
    const phone = db.prepare('SELECT image_path FROM phones WHERE phone_id = ?').get(phoneId);
    if (phone && phone.image_path === img.image_path) {
      const next = db.prepare('SELECT image_path FROM phone_images WHERE phone_id = ? ORDER BY sort_order LIMIT 1').get(phoneId);
      db.prepare('UPDATE phones SET image_path = ?, updated_at = CURRENT_TIMESTAMP WHERE phone_id = ?').run(next ? next.image_path : null, phoneId);
    }
    console.log(`🗑️ 管理员 ${req.adminUser.username} 删除图片 #${imageId}: ${phoneId}`);
    res.json({ success: true, message: '图片已删除' });
  } catch (err) {
    console.error('删除图片失败:', err);
    res.status(500).json({ error: '删除失败' });
  }
});

// 批量上下架

module.exports = router;
