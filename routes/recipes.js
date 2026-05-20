const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { requireAuth, sanitizeInput } = require('./auth');

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM recipes ORDER BY id').all();
    const recipes = rows.map(row => ({
      id: row.recipe_id,
      name: row.name,
      nameEn: row.name_en,
      category: row.category,
      colors: JSON.parse(row.colors || '[]'),
      tones: JSON.parse(row.tones || '[]'),
      albums: JSON.parse(row.albums || '[]'),
      tracks: JSON.parse(row.tracks || '[]'),
      desc: row.description
    }));
    res.json({ success: true, data: recipes });
  } catch (err) {
    console.error('获取摄影风格失败:', err);
    res.status(500).json({ error: '获取数据失败' });
  }
});

router.get('/:recipeId', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM recipes WHERE recipe_id = ?').get(req.params.recipeId);
    if (!row) return res.status(404).json({ error: '摄影风格不存在' });
    const recipe = {
      id: row.recipe_id, name: row.name, nameEn: row.name_en, category: row.category,
      colors: JSON.parse(row.colors || '[]'), tones: JSON.parse(row.tones || '[]'),
      albums: JSON.parse(row.albums || '[]'), tracks: JSON.parse(row.tracks || '[]'), desc: row.description
    };
    res.json({ success: true, data: recipe });
  } catch (err) {
    console.error('获取摄影风格失败:', err);
    res.status(500).json({ error: '获取数据失败' });
  }
});

router.post('/', requireAuth, (req, res) => {
  try {
    let { recipe_id, name, name_en, category, colors, tones, albums, tracks, description } = req.body;
    
    recipe_id = sanitizeInput(recipe_id);
    name = sanitizeInput(name);
    name_en = sanitizeInput(name_en) || '';
    category = sanitizeInput(category) || '';
    description = sanitizeInput(description) || '';
    
    if (!recipe_id || !name) {
      return res.status(400).json({ error: '缺少必要字段' });
    }

    const result = db.prepare(`
      INSERT INTO recipes (recipe_id, name, name_en, category, colors, tones, albums, tracks, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      recipe_id, name, name_en, category,
      JSON.stringify(colors || []), JSON.stringify(tones || []),
      JSON.stringify(albums || []), JSON.stringify(tracks || []), description
    );
    
    console.log(`🎨 管理员 ${req.adminUser.username} 添加摄影风格: ${name} (${recipe_id})`);
    
    res.json({ success: true, data: { id: result.lastInsertRowid, recipe_id } });
  } catch (err) {
    console.error('添加摄影风格失败:', err);
    if (err.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ error: '风格ID已存在' });
    }
    res.status(500).json({ error: '添加失败' });
  }
});

router.put('/:recipeId', requireAuth, (req, res) => {
  try {
    const { name, name_en, category, colors, tones, albums, tracks, description } = req.body;
    const recipeId = req.params.recipeId;
    
    const result = db.prepare(`
      UPDATE recipes SET
        name = COALESCE(?, name),
        name_en = COALESCE(?, name_en),
        category = COALESCE(?, category),
        colors = COALESCE(?, colors),
        tones = COALESCE(?, tones),
        albums = COALESCE(?, albums),
        tracks = COALESCE(?, tracks),
        description = COALESCE(?, description),
        updated_at = CURRENT_TIMESTAMP
      WHERE recipe_id = ?
    `).run(
      name, name_en, category,
      colors ? JSON.stringify(colors) : undefined,
      tones ? JSON.stringify(tones) : undefined,
      albums ? JSON.stringify(albums) : undefined,
      tracks ? JSON.stringify(tracks) : undefined,
      description, recipeId
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '摄影风格不存在' });
    }
    
    console.log(`🎨 管理员 ${req.adminUser.username} 更新摄影风格: ${recipeId}`);
    
    res.json({ success: true });
  } catch (err) {
    console.error('更新摄影风格失败:', err);
    res.status(500).json({ error: '更新失败' });
  }
});

router.delete('/:recipeId', requireAuth, (req, res) => {
  try {
    const recipeId = req.params.recipeId;
    
    const recipe = db.prepare('SELECT name FROM recipes WHERE recipe_id = ?').get(recipeId);
    
    if (!recipe) {
      return res.status(404).json({ error: '摄影风格不存在' });
    }
    
    const result = db.prepare('DELETE FROM recipes WHERE recipe_id = ?').run(recipeId);
    
    console.log(`🗑️  管理员 ${req.adminUser.username} 删除摄影风格: ${recipe.name} (${recipeId})`);
    
    res.json({ success: true, message: '摄影风格已删除' });
  } catch (err) {
    console.error('删除摄影风格失败:', err);
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;
