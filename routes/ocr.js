const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database/db');
const { requireAuth } = require('./auth');

// Claude API 配置
const CONFIG_FILE = path.join(__dirname, '..', 'data', 'config.json');
let CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';
try {
  if (fs.existsSync(CONFIG_FILE)) {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    if (cfg.claude_api_key) CLAUDE_API_KEY = cfg.claude_api_key;
  }
} catch(e) {}
// 从环境变量写入配置文件
if (process.env.CLAUDE_API_KEY && !CLAUDE_API_KEY) {
  CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
}
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', new Date().toISOString().split('T')[0]);
    fs.ensureDirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});

const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

// 上传报价图片
router.post('/upload', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '未选择文件' });
    const { warranty_type, price_date } = req.body;
    const url = `/uploads/${path.basename(path.dirname(req.file.path))}/${req.file.filename}`;
    const dateStr = price_date || new Date().toISOString().split('T')[0];

    // 记录上传
    const uploadResult = db.prepare(
      'INSERT INTO ocr_uploads (file_name, file_path, file_type, warranty_type, price_date, status, uploaded_by) VALUES (?,?,?,?,?,?,?)'
    ).run(req.file.originalname, url, req.file.mimetype, warranty_type || '', dateStr, 'uploaded', req.adminUser?.username || '');

    // 如果有 Claude API Key，自动 OCR 解析
    if (CLAUDE_API_KEY) {
      try {
        const ocrResult = await parsePriceImage(req.file.path, warranty_type || 'warranty', dateStr);
        if (ocrResult.success && ocrResult.prices.length > 0) {
          // 自动入库
          const stmt = db.prepare(`
            INSERT INTO daily_prices (device_id, warranty_type, storage, condition_grade, price, price_date, source_image)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(device_id, warranty_type, storage, condition_grade, price_date)
            DO UPDATE SET price = excluded.price, source_image = excluded.source_image
          `);
          const batch = db.transaction((rows) => {
            let count = 0;
            for (const r of rows) {
              stmt.run(r.device_id, r.warranty_type, r.storage, r.condition_grade, r.price, r.price_date, url);
              count++;
            }
            return count;
          });
          const count = batch(ocrResult.prices);

          // 更新上传记录
          db.prepare('UPDATE ocr_uploads SET rows_parsed = ?, status = ? WHERE id = ?')
            .run(count, 'parsed', uploadResult.lastInsertRowid);

          return res.json({
            success: true,
            data: { url, fileName: req.file.originalname, parsed: count, prices: ocrResult.prices }
          });
        }
      } catch (ocrErr) {
        console.error('OCR解析失败:', ocrErr.message);
        db.prepare('UPDATE ocr_uploads SET status = ? WHERE id = ?')
          .run('ocr_failed', uploadResult.lastInsertRowid);
      }
    }

    res.json({
      success: true,
      data: { url, fileName: req.file.originalname, parsed: 0, message: CLAUDE_API_KEY ? 'OCR解析失败，请手动录入' : '未配置Claude API Key，请手动录入' }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '上传失败' });
  }
});

// 手动触发OCR解析（对已上传的图片）
router.post('/parse/:uploadId', requireAuth, async (req, res) => {
  try {
    if (!CLAUDE_API_KEY) return res.status(400).json({ error: '未配置 Claude API Key' });

    const upload = db.prepare('SELECT * FROM ocr_uploads WHERE id = ?').get(req.params.uploadId);
    if (!upload) return res.status(404).json({ error: '上传记录不存在' });

    const filePath = path.join(__dirname, '..', upload.file_path.replace(/^\//, ''));
    const ocrResult = await parsePriceImage(filePath, upload.warranty_type, upload.price_date);

    if (ocrResult.success && ocrResult.prices.length > 0) {
      const stmt = db.prepare(`
        INSERT INTO daily_prices (device_id, warranty_type, storage, condition_grade, price, price_date, source_image)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(device_id, warranty_type, storage, condition_grade, price_date)
        DO UPDATE SET price = excluded.price, source_image = excluded.source_image
      `);
      const batch = db.transaction((rows) => {
        let count = 0;
        for (const r of rows) {
          stmt.run(r.device_id, r.warranty_type, r.storage, r.condition_grade, r.price, r.price_date, upload.file_path);
          count++;
        }
        return count;
      });
      const count = batch(ocrResult.prices);

      db.prepare('UPDATE ocr_uploads SET rows_parsed = ?, status = ? WHERE id = ?')
        .run(count, 'parsed', upload.id);

      res.json({ success: true, data: { parsed: count, prices: ocrResult.prices } });
    } else {
      res.json({ success: false, error: 'OCR未识别到报价数据' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '解析失败' });
  }
});

// 获取上传历史
router.get('/history', requireAuth, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM ocr_uploads ORDER BY created_at DESC LIMIT 50').all();
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取历史失败' });
  }
});

// 删除上传记录
router.delete('/:uploadId', requireAuth, (req, res) => {
  try {
    const uploadId = req.params.uploadId;
    
    const upload = db.prepare('SELECT * FROM ocr_uploads WHERE id = ?').get(uploadId);
    if (!upload) {
      return res.status(404).json({ error: '上传记录不存在' });
    }
    
    // 删除文件
    if (upload.file_path) {
      const filePath = path.join(__dirname, '..', upload.file_path.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.removeSync(filePath);
      }
    }
    
    // 删除数据库记录
    db.prepare('DELETE FROM ocr_uploads WHERE id = ?').run(uploadId);
    
    console.log(`🗑️  管理员 ${req.adminUser.username} 删除上传记录: ${upload.file_name} (ID: ${uploadId})`);
    
    res.json({ success: true, message: '上传记录已删除' });
  } catch (err) {
    console.error('删除上传记录失败:', err);
    res.status(500).json({ error: '删除失败' });
  }
});

// 手动写入解析后的报价数据
router.post('/import', requireAuth, (req, res) => {
  try {
    const { prices, warranty_type, price_date, source_image } = req.body;
    if (!Array.isArray(prices) || prices.length === 0) return res.status(400).json({ error: '无报价数据' });

    const stmt = db.prepare(`
      INSERT INTO daily_prices (device_id, warranty_type, storage, condition_grade, price, price_date, source_image)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(device_id, warranty_type, storage, condition_grade, price_date)
      DO UPDATE SET price = excluded.price, source_image = excluded.source_image
    `);

    const batch = db.transaction((rows) => {
      let count = 0;
      for (const r of rows) {
        stmt.run(r.device_id, warranty_type || r.warranty_type, r.storage, r.condition_grade, r.price, price_date || r.price_date, source_image || '');
        count++;
      }
      return count;
    });

    const count = batch(prices);
    res.json({ success: true, data: { imported: count } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '导入失败' });
  }
});

// ===== Claude Vision OCR 解析 =====
async function parsePriceImage(imagePath, warrantyType, priceDate) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  const ext = path.extname(imagePath).toLowerCase();
  const mediaType = ext === '.png' ? 'image/png' : 'image/jpeg';

  // 获取所有设备ID映射
  const devices = db.prepare('SELECT device_id, name, model_code FROM devices').all();
  const deviceMap = {};
  for (const d of devices) {
    deviceMap[d.name] = d.device_id;
    if (d.model_code) deviceMap[d.model_code] = d.device_id;
  }

  const prompt = `你是一个报价表OCR解析器。请分析这张苹果设备回收报价表图片，提取所有报价数据。

请以JSON数组格式返回，每个元素包含：
- device_name: 设备名称（如 "iPhone 16 Pro Max"、"iPad Air 7 11寸"、"AirPods Pro 2"）
- storage: 容量（如 "256GB"、"128GB"、"-" 表示无容量区分）
- condition_grade: 成色等级，统一映射为：高保充新=S, 靓机=A, 小花=B, 大花=C, 外爆=D, 内爆可测=E
- price: 价格（纯数字）

规则：
1. 只返回JSON数组，不要其他文字
2. 如果某个成色等级没有价格（显示"-"或空），跳过该条
3. "询价"的项目跳过
4. 容量统一用大写GB/TB格式

示例输出：
[{"device_name":"iPhone 16 Pro Max","storage":"256GB","condition_grade":"A","price":6050}]`;

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: prompt }
        ]
      }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error: ${response.status} ${errText}`);
  }

  const result = await response.json();
  const text = result.content?.[0]?.text || '';

  // 提取JSON数组
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return { success: false, prices: [] };

  const parsed = JSON.parse(jsonMatch[0]);

  // 映射设备名到 device_id
  const prices = [];
  for (const item of parsed) {
    let deviceId = deviceMap[item.device_name];
    if (!deviceId) {
      // 模糊匹配
      const nameLower = item.device_name.toLowerCase();
      for (const [name, id] of Object.entries(deviceMap)) {
        if (name.toLowerCase().includes(nameLower) || nameLower.includes(name.toLowerCase())) {
          deviceId = id;
          break;
        }
      }
    }
    if (!deviceId) {
      console.warn(`未匹配设备: ${item.device_name}`);
      continue;
    }

    prices.push({
      device_id: deviceId,
      warranty_type: warrantyType,
      storage: item.storage || '-',
      condition_grade: item.condition_grade,
      price: parseInt(item.price) || 0,
      price_date: priceDate,
    });
  }

  return { success: true, prices };
}

module.exports = router;
