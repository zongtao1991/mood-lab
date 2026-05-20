const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const { requireAuth, sanitizeInput } = require('./auth');

function validatePhone(phone) {
  if (!phone) return false;
  return /^1[3-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

router.get('/', requireAuth, (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM inquiries WHERE 1=1';
    const params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit) || 50, parseInt(offset) || 0);
    
    const rows = db.prepare(query).all(...params);
    
    const inquiries = rows.map(row => ({
      ...row,
      images: JSON.parse(row.images || '[]')
    }));
    
    const countQuery = status 
      ? 'SELECT COUNT(*) as total FROM inquiries WHERE status = ?'
      : 'SELECT COUNT(*) as total FROM inquiries';
    const countResult = status 
      ? db.prepare(countQuery).get(status)
      : db.prepare(countQuery).get();
    
    res.json({ 
      success: true, 
      data: inquiries,
      pagination: {
        total: countResult.total,
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0
      }
    });
  } catch (err) {
    console.error('获取询价列表失败:', err);
    res.status(500).json({ error: '获取数据失败' });
  }
});

router.post('/', (req, res) => {
  try {
    let {
      type, phone_id, storage, condition_grade,
      contact_name, contact_phone, contact_wechat,
      images, user_note, estimated_price
    } = req.body;
    
    type = sanitizeInput(type);
    phone_id = sanitizeInput(phone_id) || '';
    storage = sanitizeInput(storage) || '';
    condition_grade = sanitizeInput(condition_grade) || '';
    contact_name = sanitizeInput(contact_name) || '';
    contact_phone = sanitizeInput(contact_phone) || '';
    contact_wechat = sanitizeInput(contact_wechat) || '';
    user_note = sanitizeInput(user_note) || '';
    
    if (!type || !['recycle', 'sell'].includes(type)) {
      return res.status(400).json({ error: 'type 必须为 recycle 或 sell' });
    }
    
    if (!contact_phone && !contact_wechat) {
      return res.status(400).json({ error: '请提供联系方式（手机号或微信号）' });
    }
    
    if (contact_phone && !validatePhone(contact_phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }
    
    const inquiryId = `INQ-${Date.now()}-${uuidv4().slice(0, 6)}`;
    
    db.prepare(`
      INSERT INTO inquiries
      (inquiry_id, type, phone_id, storage, condition_grade,
       contact_name, contact_phone, contact_wechat, images, user_note, estimated_price, status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      inquiryId, type, phone_id, storage, condition_grade,
      contact_name, contact_phone, contact_wechat,
      JSON.stringify(images || []), user_note, estimated_price || 0, 'pending'
    );
    
    console.log(`📝 新询价单提交: ${inquiryId} (${type})`);
    
    res.json({ success: true, data: { inquiryId } });
  } catch (err) {
    console.error('提交询价失败:', err);
    res.status(500).json({ error: '提交失败' });
  }
});

router.get('/:inquiryId', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM inquiries WHERE inquiry_id = ?').get(req.params.inquiryId);
    if (!row) return res.status(404).json({ error: '询价单不存在' });
    row.images = JSON.parse(row.images || '[]');
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('查询失败:', err);
    res.status(500).json({ error: '查询失败' });
  }
});

router.put('/:inquiryId/status', requireAuth, (req, res) => {
  try {
    const { status, note } = req.body;
    const inquiryId = req.params.inquiryId;
    
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: '无效的状态值' });
    }
    
    const result = db.prepare(`
      UPDATE inquiries 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE inquiry_id = ?
    `).run(status, inquiryId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '询价单不存在' });
    }
    
    console.log(`📝 管理员 ${req.adminUser.username} 更新询价单状态: ${inquiryId} -> ${status}`);
    
    res.json({ success: true, message: '状态已更新' });
  } catch (err) {
    console.error('更新询价状态失败:', err);
    res.status(500).json({ error: '更新失败' });
  }
});

router.delete('/:inquiryId', requireAuth, (req, res) => {
  try {
    const inquiryId = req.params.inquiryId;
    
    const inquiry = db.prepare('SELECT inquiry_id FROM inquiries WHERE inquiry_id = ?').get(inquiryId);
    
    if (!inquiry) {
      return res.status(404).json({ error: '询价单不存在' });
    }
    
    const result = db.prepare('DELETE FROM inquiries WHERE inquiry_id = ?').run(inquiryId);
    
    console.log(`🗑️  管理员 ${req.adminUser.username} 删除询价单: ${inquiryId}`);
    
    res.json({ success: true, message: '询价单已删除' });
  } catch (err) {
    console.error('删除询价单失败:', err);
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;
