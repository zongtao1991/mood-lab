const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { requireAuth, sanitizeInput } = require('./auth');

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM projects ORDER BY id').all();
    const projects = rows.map(row => ({
      id: row.project_id, name: row.name, icon: row.icon, status: row.status,
      desc: row.description, features: JSON.parse(row.features || '[]'), actions: JSON.parse(row.actions || '[]')
    }));
    res.json({ success: true, data: projects });
  } catch (err) {
    console.error('获取 AI 项目失败:', err);
    res.status(500).json({ error: '获取数据失败' });
  }
});

router.get('/:projectId', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM projects WHERE project_id = ?').get(req.params.projectId);
    if (!row) return res.status(404).json({ error: 'AI 项目不存在' });
    const project = {
      id: row.project_id, name: row.name, icon: row.icon, status: row.status,
      desc: row.description, features: JSON.parse(row.features || '[]'), actions: JSON.parse(row.actions || '[]')
    };
    res.json({ success: true, data: project });
  } catch (err) {
    console.error('获取 AI 项目失败:', err);
    res.status(500).json({ error: '获取数据失败' });
  }
});

router.post('/', requireAuth, (req, res) => {
  try {
    let { project_id, name, icon, status, description, features, actions } = req.body;
    
    project_id = sanitizeInput(project_id);
    name = sanitizeInput(name);
    icon = sanitizeInput(icon) || '';
    status = sanitizeInput(status) || 'concept';
    description = sanitizeInput(description) || '';
    
    if (!project_id || !name) {
      return res.status(400).json({ error: '缺少必要字段' });
    }

    const result = db.prepare(`
      INSERT INTO projects (project_id, name, icon, status, description, features, actions)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      project_id, name, icon, status, description,
      JSON.stringify(features || []), JSON.stringify(actions || [])
    );
    
    console.log(`🤖 管理员 ${req.adminUser.username} 添加 AI 项目: ${name} (${project_id})`);
    
    res.json({ success: true, data: { id: result.lastInsertRowid, project_id } });
  } catch (err) {
    console.error('添加 AI 项目失败:', err);
    if (err.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ error: '项目ID已存在' });
    }
    res.status(500).json({ error: '添加失败' });
  }
});

router.put('/:projectId', requireAuth, (req, res) => {
  try {
    const { name, icon, status, description, features, actions } = req.body;
    const projectId = req.params.projectId;
    
    const result = db.prepare(`
      UPDATE projects SET
        name = COALESCE(?, name),
        icon = COALESCE(?, icon),
        status = COALESCE(?, status),
        description = COALESCE(?, description),
        features = COALESCE(?, features),
        actions = COALESCE(?, actions),
        updated_at = CURRENT_TIMESTAMP
      WHERE project_id = ?
    `).run(
      name, icon, status, description,
      features ? JSON.stringify(features) : undefined,
      actions ? JSON.stringify(actions) : undefined,
      projectId
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'AI 项目不存在' });
    }
    
    console.log(`🤖 管理员 ${req.adminUser.username} 更新 AI 项目: ${projectId}`);
    
    res.json({ success: true });
  } catch (err) {
    console.error('更新 AI 项目失败:', err);
    res.status(500).json({ error: '更新失败' });
  }
});

router.delete('/:projectId', requireAuth, (req, res) => {
  try {
    const projectId = req.params.projectId;
    
    const project = db.prepare('SELECT name FROM projects WHERE project_id = ?').get(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'AI 项目不存在' });
    }
    
    const result = db.prepare('DELETE FROM projects WHERE project_id = ?').run(projectId);
    
    console.log(`🗑️  管理员 ${req.adminUser.username} 删除 AI 项目: ${project.name} (${projectId})`);
    
    res.json({ success: true, message: 'AI 项目已删除' });
  } catch (err) {
    console.error('删除 AI 项目失败:', err);
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;
