const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const SALT_ROUNDS = 10;

function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim();
}

function validateUsername(username) {
  if (!username || typeof username !== 'string') return false;
  if (username.length < 2 || username.length > 50) return false;
  return /^[a-zA-Z0-9_]+$/.test(username);
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6;
}

router.post('/login', (req, res) => {
  try {
    let { username, password } = req.body;
    
    username = sanitizeInput(username);
    password = sanitizeInput(password);
    
    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }
    
    if (!validateUsername(username)) {
      return res.status(400).json({ error: '用户名格式不正确' });
    }
    
    const user = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
    
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    let passwordValid = false;
    
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      passwordValid = bcrypt.compareSync(password, user.password);
    } else {
      passwordValid = (password === user.password);
      
      if (passwordValid) {
        const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
        db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hashedPassword, user.id);
        console.log(`🔄 用户 ${username} 的密码已自动迁移为哈希存储`);
      }
    }
    
    if (!passwordValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const token = generateToken(user);
    
    db.prepare('UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    
    console.log(`✅ 用户 ${username} 登录成功`);
    
    res.json({ 
      success: true, 
      data: { 
        username: user.username, 
        token,
        expiresIn: JWT_EXPIRES_IN
      } 
    });
    
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未登录或认证已过期' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: '认证已过期，请重新登录' });
    }
    
    const user = db.prepare('SELECT * FROM admins WHERE id = ?').get(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    req.adminUser = {
      id: user.id,
      username: user.username
    };
    
    next();
    
  } catch (error) {
    console.error('认证中间件错误:', error);
    res.status(401).json({ error: '认证失效，请重新登录' });
  }
}

function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.adminUser = null;
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      req.adminUser = null;
      return next();
    }
    
    const user = db.prepare('SELECT * FROM admins WHERE id = ?').get(decoded.id);
    
    req.adminUser = user ? {
      id: user.id,
      username: user.username
    } : null;
    
    next();
    
  } catch (error) {
    req.adminUser = null;
    next();
  }
}

router.post('/change-password', requireAuth, (req, res) => {
  try {
    let { oldPassword, newPassword } = req.body;
    
    oldPassword = sanitizeInput(oldPassword);
    newPassword = sanitizeInput(newPassword);
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '请输入旧密码和新密码' });
    }
    
    if (!validatePassword(newPassword)) {
      return res.status(400).json({ error: '新密码长度至少为6位' });
    }
    
    const user = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.adminUser.id);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    let oldPasswordValid = false;
    
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      oldPasswordValid = bcrypt.compareSync(oldPassword, user.password);
    } else {
      oldPasswordValid = (oldPassword === user.password);
    }
    
    if (!oldPasswordValid) {
      return res.status(401).json({ error: '旧密码错误' });
    }
    
    const hashedNewPassword = bcrypt.hashSync(newPassword, SALT_ROUNDS);
    
    db.prepare(`
      UPDATE admins 
      SET password = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(hashedNewPassword, req.adminUser.id);
    
    console.log(`🔑 用户 ${req.adminUser.username} 密码修改成功`);
    
    res.json({ success: true, message: '密码修改成功' });
    
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ error: '修改密码失败，请稍后重试' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, created_at, last_login_at FROM admins WHERE id = ?').get(req.adminUser.id);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({ 
      success: true, 
      data: {
        id: user.id,
        username: user.username,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at
      }
    });
    
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

router.post('/logout', requireAuth, (req, res) => {
  console.log(`👋 用户 ${req.adminUser.username} 登出`);
  res.json({ success: true, message: '已登出' });
});

router.post('/hash-password', (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: '请提供密码' });
    }
    
    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
    
    res.json({ 
      success: true, 
      data: { 
        original: password,
        hash: hashedPassword 
      } 
    });
    
  } catch (error) {
    console.error('哈希密码错误:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

module.exports = router;
module.exports.requireAuth = requireAuth;
module.exports.optionalAuth = optionalAuth;
module.exports.generateToken = generateToken;
module.exports.verifyToken = verifyToken;
module.exports.sanitizeInput = sanitizeInput;
