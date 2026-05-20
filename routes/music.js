const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { requireAuth } = require('./auth');
const path = require('path');
const fs = require('fs-extra');
const https = require('https');

const MUSIC_DIR = path.join(__dirname, '..', 'music');

// 初始化音乐表
function initMusicTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS music_tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist TEXT DEFAULT '',
      file_path TEXT,
      freesound_id INTEGER,
      source TEXT DEFAULT 'local',
      duration REAL DEFAULT 0,
      tags TEXT DEFAULT '[]',
      mood_tags TEXT DEFAULT '[]',
      preview_url TEXT,
      download_url TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS music_style_mapping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dim_key TEXT NOT NULL,
      option_value TEXT NOT NULL,
      music_tag TEXT NOT NULL,
      weight REAL DEFAULT 1.0,
      UNIQUE(dim_key, option_value, music_tag)
    );

    CREATE TABLE IF NOT EXISTS music_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_music_source ON music_tracks(source);
    CREATE INDEX IF NOT EXISTS idx_music_active ON music_tracks(active);
    CREATE INDEX IF NOT EXISTS idx_music_mapping ON music_style_mapping(dim_key, option_value);
  `);

  // 默认设置
  const defaults = [
    { key: 'freesound_api_key', value: '' },
    { key: 'music_enabled', value: '1' },
    { key: 'music_volume', value: '30' },
    { key: 'music_auto_play', value: '1' },
    { key: 'music_fade_duration', value: '2000' }
  ];
  const ins = db.prepare('INSERT OR IGNORE INTO music_settings (key, value) VALUES (?, ?)');
  defaults.forEach(s => ins.run(s.key, s.value));

  // 默认风格映射：维度选项 → 音乐标签
  const existingCount = db.prepare('SELECT COUNT(*) as c FROM music_style_mapping').get().c;
  if (existingCount === 0) {
    const insMap = db.prepare('INSERT OR IGNORE INTO music_style_mapping (dim_key, option_value, music_tag, weight) VALUES (?,?,?,?)');
    const mappings = [
      // 听觉 → 音乐风格
      ['sound', 'tape-hiss', 'lo-fi', 1.0], ['sound', 'tape-hiss', 'ambient', 0.6],
      ['sound', 'digital-distortion', 'electronic', 1.0], ['sound', 'digital-distortion', 'glitch', 0.8],
      ['sound', 'industrial-metal', 'industrial', 1.0], ['sound', 'industrial-metal', 'noise', 0.7],
      ['sound', 'felt-piano', 'classical', 1.0], ['sound', 'felt-piano', 'ambient', 0.8],
      ['sound', 'vinyl-crackle', 'jazz', 0.8], ['sound', 'vinyl-crackle', 'lo-fi', 1.0],
      ['sound', 'citypop-bass', 'funk', 0.8], ['sound', 'citypop-bass', 'synth-pop', 1.0],
      ['sound', 'drum-pulse', 'electronic', 0.8], ['sound', 'drum-pulse', 'techno', 1.0],
      // 触觉 → 情绪
      ['touch', 'dusty-pages', 'nostalgic', 1.0], ['touch', 'dusty-pages', 'warm', 0.7],
      ['touch', 'frost-glass', 'cold', 1.0], ['touch', 'frost-glass', 'minimal', 0.8],
      ['touch', 'rusty-iron', 'dark', 0.8], ['touch', 'rusty-iron', 'industrial', 1.0],
      ['touch', 'birch-moss', 'nature', 1.0], ['touch', 'birch-moss', 'peaceful', 0.8],
      ['touch', 'old-album', 'nostalgic', 1.0], ['touch', 'old-album', 'vintage', 0.9],
      ['touch', 'pool-water', 'dreamy', 1.0], ['touch', 'pool-water', 'summer', 0.8],
      ['touch', 'black-velvet', 'dark', 0.8], ['touch', 'black-velvet', 'luxury', 1.0],
      // 光线 → 氛围
      ['light', 'amber-sunset', 'warm', 1.0], ['light', 'amber-sunset', 'golden', 0.8],
      ['light', 'overexposed-winter', 'cold', 1.0], ['light', 'overexposed-winter', 'bright', 0.7],
      ['light', 'glitch-neon', 'cyberpunk', 1.0], ['light', 'glitch-neon', 'electronic', 0.8],
      ['light', 'arctic-diffused', 'ambient', 1.0], ['light', 'arctic-diffused', 'minimal', 0.8],
      ['light', 'linen-warm', 'acoustic', 0.8], ['light', 'linen-warm', 'warm', 1.0],
      ['light', 'noon-hard', 'bright', 1.0], ['light', 'noon-hard', 'energetic', 0.7],
      ['light', 'rembrandt-side', 'dramatic', 1.0], ['light', 'rembrandt-side', 'cinematic', 0.9],
      // 情绪
      ['emotion', 'nostalgic', 'nostalgic', 1.0],
      ['emotion', 'lonely', 'melancholic', 1.0],
      ['emotion', 'warm', 'warm', 1.0],
      ['emotion', 'restless', 'energetic', 1.0],
      ['emotion', 'serene', 'peaceful', 1.0],
      ['emotion', 'mysterious', 'dark', 0.8], ['emotion', 'mysterious', 'cinematic', 1.0],
    ];
    mappings.forEach(m => insMap.run(...m));
    console.log('✅ 音乐风格映射初始化完成');
  }
}

// 扫描本地音乐目录
function scanLocalMusic() {
  fs.ensureDirSync(MUSIC_DIR);
  const files = fs.readdirSync(MUSIC_DIR).filter(f => /\.(mp3|wav|ogg|m4a|flac)$/i.test(f));
  const existingLocal = db.prepare("SELECT file_path FROM music_tracks WHERE source = 'local'").all().map(r => r.file_path);

  const ins = db.prepare('INSERT OR IGNORE INTO music_tracks (title, file_path, source, tags, mood_tags) VALUES (?,?,?,?,?)');
  let added = 0;
  files.forEach(f => {
    const fullPath = path.join(MUSIC_DIR, f);
    if (!existingLocal.includes(fullPath)) {
      const title = path.basename(f, path.extname(f));
      ins.run(title, fullPath, 'local', '[]', '[]');
      added++;
    }
  });
  if (added > 0) console.log(`✅ 扫描到 ${added} 首本地音乐`);
}

// Freesound API 代理
function freesoundSearch(query, apiKey) {
  return new Promise((resolve, reject) => {
    const url = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&fields=id,name,description,duration,previews,tags&page_size=5&token=${apiKey}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.results || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// GET /api/music/match - 根据当前调配参数匹配音乐
router.get('/match', (req, res) => {
  try {
    const { sound, touch, light, temperature, density, rhythm, emotion } = req.query;
    const musicEnabled = db.prepare("SELECT value FROM music_settings WHERE key = 'music_enabled'").get();
    if (!musicEnabled || musicEnabled.value !== '1') {
      return res.json({ success: true, data: [], enabled: false });
    }

    // 收集所有音乐标签
    const musicTags = new Map(); // tag -> weight
    const params = { sound, touch, light, temperature, density, rhythm, emotion };

    Object.entries(params).forEach(([dimKey, val]) => {
      if (!val) return;
      if (dimKey === 'emotion') {
        // 多选，逗号分隔
        val.split(',').forEach(v => {
          const mappings = db.prepare('SELECT music_tag, weight FROM music_style_mapping WHERE dim_key = ? AND option_value = ?')
            .all(dimKey, v.trim());
          mappings.forEach(m => {
            musicTags.set(m.music_tag, (musicTags.get(m.music_tag) || 0) + m.weight);
          });
        });
      } else {
        const mappings = db.prepare('SELECT music_tag, weight FROM music_style_mapping WHERE dim_key = ? AND option_value = ?')
          .all(dimKey, val);
        mappings.forEach(m => {
          musicTags.set(m.music_tag, (musicTags.get(m.music_tag) || 0) + m.weight);
        });
      }
    });

    // 本地音乐匹配
    const localTracks = db.prepare("SELECT * FROM music_tracks WHERE source = 'local' AND active = 1").all();
    const scoredLocal = localTracks.map(track => {
      let score = 0;
      const trackTags = JSON.parse(track.tags || '[]');
      const trackMoods = JSON.parse(track.mood_tags || '[]');
      const allTrackTags = [...trackTags, ...trackMoods];
      musicTags.forEach((weight, tag) => {
        if (allTrackTags.includes(tag)) score += weight;
      });
      return { ...track, score, source: 'local' };
    }).filter(t => t.score > 0).sort((a, b) => b.score - a.score);

    // Freesound 在线搜索（如果配置了 API Key）
    let freesoundResults = [];
    const apiKey = db.prepare("SELECT value FROM music_settings WHERE key = 'freesound_api_key'").get();
    if (apiKey && apiKey.value) {
      // 取权重最高的2个标签作为搜索关键词
      const topTags = [...musicTags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(e => e[0]);
      // 搜索暂不阻塞响应，返回本地结果先
    }

    const volume = db.prepare("SELECT value FROM music_settings WHERE key = 'music_volume'").get();
    const autoPlay = db.prepare("SELECT value FROM music_settings WHERE key = 'music_auto_play'").get();
    const fadeDuration = db.prepare("SELECT value FROM music_settings WHERE key = 'music_fade_duration'").get();

    res.json({
      success: true,
      data: scoredLocal.slice(0, 5),
      freesound: freesoundResults,
      settings: {
        volume: volume ? parseInt(volume.value) : 30,
        autoPlay: autoPlay ? autoPlay.value === '1' : true,
        fadeDuration: fadeDuration ? parseInt(fadeDuration.value) : 2000
      },
      matchedTags: Object.fromEntries(musicTags)
    });
  } catch (err) {
    console.error('匹配音乐失败:', err);
    res.status(500).json({ error: '匹配失败' });
  }
});

// GET /api/music/freesound - 在线搜索
router.get('/freesound', async (req, res) => {
  try {
    const { query } = req.query;
    const apiKey = db.prepare("SELECT value FROM music_settings WHERE key = 'freesound_api_key'").get();
    if (!apiKey || !apiKey.value) {
      return res.json({ success: true, data: [], message: '未配置 Freesound API Key' });
    }
    const results = await freesoundSearch(query, apiKey.value);
    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Freesound 搜索失败:', err);
    res.status(500).json({ error: '搜索失败' });
  }
});

// GET /api/music/local - 列出本地音乐
router.get('/local', (req, res) => {
  try {
    scanLocalMusic();
    const tracks = db.prepare("SELECT * FROM music_tracks WHERE source = 'local' ORDER BY created_at DESC").all();
    res.json({ success: true, data: tracks });
  } catch (err) {
    console.error('获取本地音乐失败:', err);
    res.status(500).json({ error: '获取失败' });
  }
});

// GET /api/music/stream/:id - 音乐流
router.get('/stream/:id', (req, res) => {
  try {
    const track = db.prepare('SELECT * FROM music_tracks WHERE id = ?').get(req.params.id);
    if (!track || !track.file_path) return res.status(404).json({ error: '未找到' });
    if (!fs.existsSync(track.file_path)) return res.status(404).json({ error: '文件不存在' });

    const stat = fs.statSync(track.file_path);
    const ext = path.extname(track.file_path).toLowerCase();
    const mimeMap = { '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.flac': 'audio/flac' };
    const mime = mimeMap[ext] || 'audio/mpeg';

    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes'
    });
    fs.createReadStream(track.file_path).pipe(res);
  } catch (err) {
    res.status(500).json({ error: '播放失败' });
  }
});

// Admin: 获取设置
router.get('/admin/settings', requireAuth, (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM music_settings').all();
    const obj = {};
    settings.forEach(s => obj[s.key] = s.value);
    res.json({ success: true, data: obj });
  } catch (err) {
    res.status(500).json({ error: '获取失败' });
  }
});

// Admin: 更新设置
router.put('/admin/settings', requireAuth, (req, res) => {
  try {
    const upsert = db.prepare('INSERT OR REPLACE INTO music_settings (key, value) VALUES (?, ?)');
    Object.entries(req.body).forEach(([key, value]) => {
      upsert.run(key, String(value));
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '更新失败' });
  }
});

// Admin: 更新音乐标签
router.put('/admin/tracks/:id/tags', requireAuth, (req, res) => {
  try {
    const { tags, mood_tags } = req.body;
    db.prepare('UPDATE music_tracks SET tags = COALESCE(?, tags), mood_tags = COALESCE(?, mood_tags) WHERE id = ?')
      .run(tags ? JSON.stringify(tags) : null, mood_tags ? JSON.stringify(mood_tags) : null, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '更新失败' });
  }
});

// Admin: 获取风格映射
router.get('/admin/mappings', requireAuth, (req, res) => {
  try {
    const mappings = db.prepare('SELECT * FROM music_style_mapping ORDER BY dim_key, option_value').all();
    res.json({ success: true, data: mappings });
  } catch (err) {
    res.status(500).json({ error: '获取失败' });
  }
});

// Admin: 更新风格映射
router.put('/admin/mappings/:id', requireAuth, (req, res) => {
  try {
    const { music_tag, weight } = req.body;
    db.prepare('UPDATE music_style_mapping SET music_tag = COALESCE(?, music_tag), weight = COALESCE(?, weight) WHERE id = ?')
      .run(music_tag, weight, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '更新失败' });
  }
});

// 初始化
initMusicTables();
scanLocalMusic();

module.exports = router;
