const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { requireAuth } = require('./auth');

// 估价 API（客户端用）
router.get('/estimate', (req, res) => {
  try {
    const { device_id, warranty, storage, grade } = req.query;
    if (!device_id || !warranty || !storage || !grade) {
      return res.status(400).json({ error: '缺少参数' });
    }

    const warrantyType = warranty === 'warranty' ? 'warranty' : 'expired';

    // 获取最新日期的报价
    const latestDate = db.prepare(
      'SELECT MAX(price_date) as d FROM daily_prices WHERE device_id = ? AND warranty_type = ?'
    ).get(device_id, warrantyType);

    if (!latestDate || !latestDate.d) {
      return res.json({ success: true, data: { price: null, message: '暂无该机型报价' } });
    }

    const row = db.prepare(
      'SELECT * FROM daily_prices WHERE device_id = ? AND warranty_type = ? AND storage = ? AND condition_grade = ? AND price_date = ?'
    ).get(device_id, warrantyType, storage, grade, latestDate.d);

    if (!row) {
      // 尝试找相近成色
      const grades = ['S', 'A', 'B', 'C', 'D', 'E'];
      const gradeIdx = grades.indexOf(grade);
      let fallback = null;
      for (let i = gradeIdx + 1; i < grades.length; i++) {
        fallback = db.prepare(
          'SELECT * FROM daily_prices WHERE device_id = ? AND warranty_type = ? AND storage = ? AND condition_grade = ? AND price_date = ?'
        ).get(device_id, warrantyType, storage, grades[i], latestDate.d);
        if (fallback) break;
      }
      if (!fallback) {
        for (let i = gradeIdx - 1; i >= 0; i--) {
          fallback = db.prepare(
            'SELECT * FROM daily_prices WHERE device_id = ? AND warranty_type = ? AND storage = ? AND condition_grade = ? AND price_date = ?'
          ).get(device_id, warrantyType, storage, grades[i], latestDate.d);
          if (fallback) break;
        }
      }
      return res.json({
        success: true,
        data: fallback
          ? { price: fallback.price, date: fallback.price_date, grade: fallback.condition_grade, note: `该成色无报价，显示${fallback.condition_grade}级参考价` }
          : { price: null, message: '暂无该配置报价' }
      });
    }

    // 获取扣费规则 - 按系列匹配
    const device = db.prepare('SELECT name, category FROM devices WHERE device_id = ?').get(device_id);
    let deductions = [];
    if (device) {
      // 从设备名提取系列名，如 "iPhone 17 Pro Max" → "iPhone 17"
      const nameMatch = device.name.match(/^(iPhone|iPad|AirPods|Apple Watch)\s*(\w+)?/);
      const seriesGuess = nameMatch ? `${nameMatch[1]} ${nameMatch[2] || ''}`.trim() : device.category;

      // 先找精确系列匹配，再找品类兜底
      deductions = db.prepare(
        'SELECT * FROM deduction_rules WHERE category = ? AND active = 1 ORDER BY sort_order'
      ).all(seriesGuess);

      if (deductions.length === 0) {
        // 兜底：按大品类匹配（如 "iPhone 老款" 或 "iPad"）
        const broadCat = device.category;
        deductions = db.prepare(
          'SELECT * FROM deduction_rules WHERE category = ? AND active = 1 ORDER BY sort_order'
        ).all(broadCat);
      }

      // 如果还是没找到，用最宽泛的匹配
      if (deductions.length === 0 && device.category === 'iPhone') {
        deductions = db.prepare(
          'SELECT * FROM deduction_rules WHERE category = ? AND active = 1 ORDER BY sort_order'
        ).all('iPhone 老款');
      }
    }

    res.json({
      success: true,
      data: {
        price: row.price,
        date: row.price_date,
        grade: row.condition_grade,
        deductions
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '估价失败' });
  }
});

// 获取某设备全部报价（管理后台用）
router.get('/device/:deviceId', requireAuth, (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM daily_prices WHERE device_id = ? ORDER BY warranty_type, storage, condition_grade'
    ).all(req.params.deviceId);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取报价失败' });
  }
});

// 批量更新报价（管理后台用）
router.post('/batch', requireAuth, (req, res) => {
  try {
    const { prices } = req.body; // [{ device_id, warranty_type, storage, condition_grade, price, price_date }]
    if (!Array.isArray(prices) || prices.length === 0) return res.status(400).json({ error: '无数据' });

    const stmt = db.prepare(`
      INSERT INTO daily_prices (device_id, warranty_type, storage, condition_grade, price, price_date)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(device_id, warranty_type, storage, condition_grade, price_date)
      DO UPDATE SET price = excluded.price
    `);

    const batch = db.transaction((rows) => {
      let count = 0;
      for (const r of rows) {
        stmt.run(r.device_id, r.warranty_type, r.storage, r.condition_grade, r.price, r.price_date);
        count++;
      }
      return count;
    });

    const count = batch(prices);
    res.json({ success: true, data: { updated: count } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '更新报价失败' });
  }
});

// 获取所有报价概览（管理后台用）
router.get('/overview', requireAuth, (req, res) => {
  try {
    const dates = db.prepare('SELECT DISTINCT price_date FROM daily_prices ORDER BY price_date DESC LIMIT 10').all();
    const latest = dates[0]?.price_date;
    if (!latest) return res.json({ success: true, data: { dates: [], prices: [] } });

    const prices = db.prepare(`
      SELECT p.*, d.name as device_name, d.category
      FROM daily_prices p
      JOIN devices d ON p.device_id = d.device_id
      WHERE p.price_date = ?
      ORDER BY d.category, d.sort_order, p.warranty_type, p.storage, p.condition_grade
    `).all(latest);

    res.json({ success: true, data: { dates: dates.map(d => d.price_date), prices } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取概览失败' });
  }
});

// 删除单条报价
router.delete('/single', requireAuth, (req, res) => {
  try {
    const { device_id, warranty_type, storage, condition_grade, price_date } = req.body;
    if (!device_id || !warranty_type || !storage || !condition_grade || !price_date) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    const result = db.prepare(
      'DELETE FROM daily_prices WHERE device_id = ? AND warranty_type = ? AND storage = ? AND condition_grade = ? AND price_date = ?'
    ).run(device_id, warranty_type, storage, condition_grade, price_date);
    if (result.changes === 0) {
      return res.status(404).json({ error: '未找到对应报价' });
    }
    console.log(`🗑️ 管理员删除报价: ${device_id}/${warranty_type}/${storage}/${condition_grade}/${price_date}`);
    res.json({ success: true, message: '报价已删除' });
  } catch (err) {
    console.error('删除报价失败:', err);
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;
