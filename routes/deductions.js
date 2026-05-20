const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { requireAuth } = require('./auth');

// 获取扣费规则（公开，客户端展示用）
router.get('/', (req, res) => {
  try {
    const { category } = req.query;
    let rows;
    if (category) {
      rows = db.prepare('SELECT * FROM deduction_rules WHERE category = ? AND active = 1 ORDER BY sort_order').all(category);
    } else {
      rows = db.prepare('SELECT * FROM deduction_rules WHERE active = 1 ORDER BY category, sort_order').all();
    }
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取扣费规则失败' });
  }
});

// 添加扣费规则
router.post('/', requireAuth, (req, res) => {
  try {
    const { category, rule_name, description, deduction_amount, deduction_type, sort_order } = req.body;
    if (!category || !rule_name) return res.status(400).json({ error: '缺少必要字段' });
    const result = db.prepare(
      'INSERT INTO deduction_rules (category, rule_name, description, deduction_amount, deduction_type, sort_order) VALUES (?,?,?,?,?,?)'
    ).run(category, rule_name, description || '', deduction_amount || 0, deduction_type || 'fixed', sort_order || 0);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '添加失败' });
  }
});

// 更新扣费规则
router.put('/:id', requireAuth, (req, res) => {
  try {
    const { rule_name, description, deduction_amount, deduction_type, sort_order, active } = req.body;
    const result = db.prepare(`
      UPDATE deduction_rules SET
      rule_name = COALESCE(?, rule_name),
      description = COALESCE(?, description),
      deduction_amount = COALESCE(?, deduction_amount),
      deduction_type = COALESCE(?, deduction_type),
      sort_order = COALESCE(?, sort_order),
      active = COALESCE(?, active)
      WHERE id = ?
    `).run(rule_name, description, deduction_amount, deduction_type, sort_order, active, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: '规则不存在' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '更新失败' });
  }
});

// 删除扣费规则
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM deduction_rules WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: '规则不存在' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;
