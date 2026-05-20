const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { requireAuth } = require('./auth');

// Get all active dimensions with options (public)
router.get('/dimensions', (req, res) => {
  try {
    const dims = db.prepare('SELECT * FROM mixer_dimensions WHERE active = 1 ORDER BY sort_order').all();
    const result = dims.map(dim => {
      const options = db.prepare('SELECT * FROM mixer_options WHERE dimension_id = ? AND active = 1 ORDER BY sort_order').all(dim.id);
      return { ...dim, options };
    });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('获取维度失败:', err);
    res.status(500).json({ error: '获取维度失败' });
  }
});

// Get weights for matching (public)
router.get('/weights', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT mo.option_value, mo.dimension_id, md.dim_key, mrw.recipe_idx, mrw.weight
      FROM mixer_recipe_weights mrw
      JOIN mixer_options mo ON mrw.option_id = mo.id
      JOIN mixer_dimensions md ON mo.dimension_id = md.id
      WHERE md.active = 1 AND mo.active = 1
    `).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('获取权重失败:', err);
    res.status(500).json({ error: '获取权重失败' });
  }
});

// Admin: Get all dimensions (including inactive)
router.get('/admin/dimensions', requireAuth, (req, res) => {
  try {
    const dims = db.prepare('SELECT * FROM mixer_dimensions ORDER BY sort_order').all();
    const result = dims.map(dim => {
      const options = db.prepare('SELECT * FROM mixer_options WHERE dimension_id = ? ORDER BY sort_order').all(dim.id);
      return { ...dim, options };
    });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('获取维度失败:', err);
    res.status(500).json({ error: '获取失败' });
  }
});

// Admin: Update dimension
router.put('/admin/dimensions/:id', requireAuth, (req, res) => {
  try {
    const { name, label, icon, weight, sort_order, active } = req.body;
    db.prepare(`UPDATE mixer_dimensions SET name=COALESCE(?,name), label=COALESCE(?,label), icon=COALESCE(?,icon), weight=COALESCE(?,weight), sort_order=COALESCE(?,sort_order), active=COALESCE(?,active) WHERE id=?`)
      .run(name, label, icon, weight, sort_order, active !== undefined ? (active ? 1 : 0) : undefined, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('更新维度失败:', err);
    res.status(500).json({ error: '更新失败' });
  }
});

// Admin: Add option to dimension
router.post('/admin/dimensions/:dimId/options', requireAuth, (req, res) => {
  try {
    const { option_value, option_label, icon, sort_order } = req.body;
    if (!option_value || !option_label) return res.status(400).json({ error: '缺少必要字段' });
    const r = db.prepare('INSERT INTO mixer_options (dimension_id, option_value, option_label, icon, sort_order) VALUES (?,?,?,?,?)')
      .run(req.params.dimId, option_value, option_label, icon || '', sort_order || 0);
    res.json({ success: true, data: { id: r.lastInsertRowid } });
  } catch (err) {
    console.error('添加选项失败:', err);
    res.status(500).json({ error: '添加失败' });
  }
});

// Admin: Update option
router.put('/admin/options/:id', requireAuth, (req, res) => {
  try {
    const { option_label, icon, sort_order, active } = req.body;
    db.prepare('UPDATE mixer_options SET option_label=COALESCE(?,option_label), icon=COALESCE(?,icon), sort_order=COALESCE(?,sort_order), active=COALESCE(?,active) WHERE id=?')
      .run(option_label, icon, sort_order, active !== undefined ? (active ? 1 : 0) : undefined, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('更新选项失败:', err);
    res.status(500).json({ error: '更新失败' });
  }
});

// Admin: Delete option
router.delete('/admin/options/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM mixer_recipe_weights WHERE option_id = ?').run(req.params.id);
    db.prepare('DELETE FROM mixer_options WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('删除选项失败:', err);
    res.status(500).json({ error: '删除失败' });
  }
});

// Admin: Update recipe weight
router.put('/admin/weights', requireAuth, (req, res) => {
  try {
    const { option_id, recipe_idx, weight } = req.body;
    // Check if weight already exists
    const existing = db.prepare('SELECT id FROM mixer_recipe_weights WHERE option_id = ? AND recipe_idx = ?').get(option_id, recipe_idx);
    if (existing) {
      db.prepare('UPDATE mixer_recipe_weights SET weight = ? WHERE id = ?').run(weight, existing.id);
    } else {
      db.prepare('INSERT INTO mixer_recipe_weights (option_id, recipe_idx, weight) VALUES (?,?,?)').run(option_id, recipe_idx, weight);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('更新权重失败:', err);
    res.status(500).json({ error: '更新权重失败' });
  }
});

module.exports = router;
