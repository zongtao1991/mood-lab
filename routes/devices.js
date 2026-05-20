const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { requireAuth, sanitizeInput } = require('./auth');

router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM devices 
      WHERE active = 1 
      ORDER BY category, sort_order
    `).all();
    
    const grouped = {};
    for (const r of rows) {
      if (!grouped[r.category]) grouped[r.category] = [];
      grouped[r.category].push({
        id: r.device_id,
        name: r.name,
        code: r.model_code || '',
        storage: JSON.parse(r.storage_options || '[]'),
        icon: r.icon,
        sortOrder: r.sort_order
      });
    }
    
    res.json({ success: true, data: grouped });
  } catch (err) {
    console.error('获取设备列表失败:', err);
    res.status(500).json({ error: '获取数据失败' });
  }
});

router.get('/all', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT p.*, d.name, d.icon, d.category, d.storage_options, d.sort_order
      FROM daily_prices p
      JOIN devices d ON p.device_id = d.device_id
      WHERE d.active = 1
      ORDER BY d.category, d.sort_order, p.warranty_type, p.storage, p.condition_grade
    `).all();
    
    const result = {};
    for (const r of rows) {
      if (!result[r.category]) result[r.category] = {};
      if (!result[r.category][r.device_id]) {
        result[r.category][r.device_id] = {
          name: r.name,
          icon: r.icon,
          sortOrder: r.sort_order,
          storageOptions: JSON.parse(r.storage_options || '[]'),
          pricing: {},
        };
      }
      const dev = result[r.category][r.device_id];
      if (!dev.pricing[r.storage]) dev.pricing[r.storage] = {};
      dev.pricing[r.storage][r.condition_grade] = {
        price: r.price,
        warranty: r.warranty_type,
        date: r.price_date
      };
    }
    
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('获取全部报价失败:', err);
    res.status(500).json({ error: '获取数据失败' });
  }
});

router.get('/:deviceId', (req, res) => {
  try {
    const device = db.prepare('SELECT * FROM devices WHERE device_id = ?').get(req.params.deviceId);
    
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }
    
    res.json({ 
      success: true, 
      data: {
        id: device.device_id,
        name: device.name,
        category: device.category,
        modelCode: device.model_code,
        icon: device.icon,
        storage: JSON.parse(device.storage_options || '[]'),
        sortOrder: device.sort_order,
        active: device.active === 1
      }
    });
  } catch (err) {
    console.error('获取设备信息失败:', err);
    res.status(500).json({ error: '获取数据失败' });
  }
});

router.get('/:deviceId/storages', (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const latestDate = db.prepare(`
      SELECT MAX(price_date) as d FROM daily_prices WHERE device_id = ?
    `).get(deviceId);
    
    if (!latestDate || !latestDate.d) {
      const device = db.prepare('SELECT storage_options FROM devices WHERE device_id = ?').get(deviceId);
      if (device && device.storage_options) {
        const storages = JSON.parse(device.storage_options || '[]');
        return res.json({ success: true, data: storages });
      }
      return res.json({ success: true, data: ['128GB', '256GB', '512GB', '1TB'] });
    }
    
    const rows = db.prepare(`
      SELECT DISTINCT storage FROM daily_prices 
      WHERE device_id = ? AND price_date = ?
      ORDER BY storage
    `).all(deviceId, latestDate.d);
    
    const storages = rows.map(r => r.storage);
    res.json({ success: true, data: storages });
  } catch (err) {
    console.error('获取设备存储容量失败:', err);
    res.status(500).json({ error: '获取数据失败' });
  }
});

router.get('/:deviceId/pricing', (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const latestDate = db.prepare(`
      SELECT MAX(price_date) as d FROM daily_prices WHERE device_id = ?
    `).get(deviceId);
    
    if (!latestDate || !latestDate.d) {
      return res.json({ success: true, data: [] });
    }
    
    const rows = db.prepare(`
      SELECT * FROM daily_prices 
      WHERE device_id = ? AND price_date = ?
      ORDER BY warranty_type, storage, condition_grade
    `).all(deviceId, latestDate.d);
    
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('获取设备报价失败:', err);
    res.status(500).json({ error: '获取报价失败' });
  }
});

router.post('/', requireAuth, (req, res) => {
  try {
    let { device_id, category, name, model_code, icon, storage_options, sort_order, active } = req.body;
    
    device_id = sanitizeInput(device_id);
    category = sanitizeInput(category);
    name = sanitizeInput(name);
    model_code = sanitizeInput(model_code);
    icon = sanitizeInput(icon) || '📱';
    
    if (!device_id || !name || !category) {
      return res.status(400).json({ error: '缺少必要字段' });
    }
    
    const result = db.prepare(`
      INSERT INTO devices (device_id, category, name, model_code, icon, storage_options, sort_order, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      device_id, category, name, model_code || '', icon,
      JSON.stringify(storage_options || []),
      sort_order || 0,
      active !== false ? 1 : 0
    );
    
    console.log(`📱 管理员 ${req.adminUser.username} 添加设备: ${name} (${device_id})`);
    
    res.json({ success: true, data: { id: result.lastInsertRowid, device_id } });
  } catch (err) {
    console.error('添加设备失败:', err);
    if (err.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ error: '设备ID已存在' });
    }
    res.status(500).json({ error: '添加失败' });
  }
});

router.put('/:deviceId', requireAuth, (req, res) => {
  try {
    const { name, category, model_code, icon, storage_options, sort_order, active } = req.body;
    const deviceId = req.params.deviceId;
    
    const result = db.prepare(`
      UPDATE devices SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        model_code = COALESCE(?, model_code),
        icon = COALESCE(?, icon),
        storage_options = COALESCE(?, storage_options),
        sort_order = COALESCE(?, sort_order),
        active = COALESCE(?, active),
        updated_at = CURRENT_TIMESTAMP
      WHERE device_id = ?
    `).run(
      name, category, model_code, icon,
      storage_options ? JSON.stringify(storage_options) : undefined,
      sort_order,
      active !== undefined ? (active ? 1 : 0) : undefined,
      deviceId
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '设备不存在' });
    }
    
    console.log(`📱 管理员 ${req.adminUser.username} 更新设备: ${deviceId}`);
    
    res.json({ success: true });
  } catch (err) {
    console.error('更新设备失败:', err);
    res.status(500).json({ error: '更新失败' });
  }
});

router.delete('/:deviceId', requireAuth, (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    
    const device = db.prepare('SELECT name FROM devices WHERE device_id = ?').get(deviceId);
    
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }
    
    db.prepare('DELETE FROM daily_prices WHERE device_id = ?').run(deviceId);
    db.prepare('DELETE FROM devices WHERE device_id = ?').run(deviceId);
    
    console.log(`🗑️  管理员 ${req.adminUser.username} 删除设备: ${device.name} (${deviceId})`);
    
    res.json({ success: true, message: '设备已删除' });
  } catch (err) {
    console.error('删除设备失败:', err);
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;
