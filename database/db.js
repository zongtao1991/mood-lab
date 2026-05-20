const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs-extra');

const dataDir = path.join(__dirname, '..', 'data');
fs.ensureDirSync(dataDir);

const dbPath = path.join(dataDir, 'mood-lab.db');
const db = new Database(dbPath);

console.log('✅ 数据库连接成功');

// 启用 WAL 模式提高并发性能
db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      name_en TEXT,
      category TEXT,
      colors TEXT,
      tones TEXT,
      albums TEXT,
      tracks TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      icon TEXT,
      status TEXT DEFAULT 'concept',
      description TEXT,
      features TEXT,
      actions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS phones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      series TEXT DEFAULT '',
      model TEXT,
      icon TEXT,
      storage_options TEXT,
      specs TEXT,
      condition TEXT,
      color TEXT DEFAULT '',
      condition_desc TEXT,
      price INTEGER,
      original_price INTEGER,
      features TEXT,
      image_path TEXT,
      in_stock INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS phone_pricing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_id TEXT NOT NULL,
      storage TEXT NOT NULL,
      condition_grade TEXT NOT NULL,
      recycle_price INTEGER DEFAULT 0,
      sell_price INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(phone_id, storage, condition_grade)
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inquiry_id TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      phone_id TEXT,
      storage TEXT,
      condition_grade TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      contact_wechat TEXT,
      images TEXT,
      user_note TEXT,
      estimated_price INTEGER,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_identifier TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT,
      file_size INTEGER,
      upload_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_uploads_user_date ON uploads(user_identifier, upload_date);
    CREATE INDEX IF NOT EXISTS idx_recipes_recipe_id ON recipes(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_projects_project_id ON projects(project_id);
    CREATE INDEX IF NOT EXISTS idx_phones_phone_id ON phones(phone_id);
    CREATE INDEX IF NOT EXISTS idx_phones_series ON phones(series);
    CREATE INDEX IF NOT EXISTS idx_pricing_phone ON phone_pricing(phone_id);
    CREATE INDEX IF NOT EXISTS idx_pricing_lookup ON phone_pricing(phone_id, storage, condition_grade);

    -- 苹果回收估价系统表
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      model_code TEXT,
      icon TEXT DEFAULT '📱',
      storage_options TEXT DEFAULT '[]',
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      warranty_type TEXT NOT NULL,
      storage TEXT NOT NULL,
      condition_grade TEXT NOT NULL,
      price INTEGER NOT NULL,
      price_date DATE NOT NULL,
      source_image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(device_id, warranty_type, storage, condition_grade, price_date)
    );

    CREATE TABLE IF NOT EXISTS deduction_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      rule_name TEXT NOT NULL,
      description TEXT,
      deduction_amount INTEGER NOT NULL DEFAULT 0,
      deduction_type TEXT DEFAULT 'fixed',
      active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ocr_uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT NOT NULL,
      file_path TEXT,
      file_type TEXT,
      warranty_type TEXT,
      price_date DATE,
      rows_parsed INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      uploaded_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_prices_lookup ON daily_prices(device_id, warranty_type, storage, condition_grade, price_date);
    CREATE INDEX IF NOT EXISTS idx_prices_date ON daily_prices(price_date);
    CREATE INDEX IF NOT EXISTS idx_devices_cat ON devices(category);
    CREATE INDEX IF NOT EXISTS idx_deduction_cat ON deduction_rules(category);

    -- 多图片支持表
    CREATE TABLE IF NOT EXISTS phone_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_id TEXT NOT NULL,
      image_path TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_phone_images_phone ON phone_images(phone_id);

    -- 感官调配器维度配置
    CREATE TABLE IF NOT EXISTS mixer_dimensions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dim_key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      label TEXT,
      type TEXT DEFAULT 'select',
      icon TEXT DEFAULT '🎵',
      min_val INTEGER DEFAULT 0,
      max_val INTEGER DEFAULT 100,
      step INTEGER DEFAULT 1,
      weight REAL DEFAULT 0.1,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mixer_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dimension_id INTEGER NOT NULL,
      option_value TEXT NOT NULL,
      option_label TEXT NOT NULL,
      icon TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dimension_id) REFERENCES mixer_dimensions(id)
    );

    CREATE TABLE IF NOT EXISTS mixer_recipe_weights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      option_id INTEGER NOT NULL,
      recipe_idx INTEGER NOT NULL,
      weight REAL DEFAULT 0,
      FOREIGN KEY (option_id) REFERENCES mixer_options(id)
    );

    CREATE INDEX IF NOT EXISTS idx_mixer_options_dim ON mixer_options(dimension_id);
    CREATE INDEX IF NOT EXISTS idx_mixer_weights_option ON mixer_recipe_weights(option_id);
  `);

  console.log('✅ 数据库表初始化完成');

  // 迁移：添加 color 列到 phones 表（如果不存在）
  try {
    db.prepare("SELECT color FROM phones LIMIT 1").get();
  } catch (e) {
    db.exec("ALTER TABLE phones ADD COLUMN color TEXT DEFAULT ''");
    console.log('✅ 迁移：已添加 color 列到 phones 表');
  }

  // 初始化默认设置
  const defaultSettings = [
    { key: 'contact_name', value: '自由创作者' },
    { key: 'contact_tagline', value: '摄影师 · AI 开发者 · 手机交易商' },
    { key: 'contact_phone', value: '15279139669' },
    { key: 'contact_email', value: 'admin@example.com' },
    { key: 'contact_wechat', value: 'your_wechat_id' },
    { key: 'contact_avatar', value: '👨‍💻' },
    { key: 'contact_wechat_qr', value: '' },
    { key: 'upload_daily_quota', value: '10' },
    { key: 'upload_enabled', value: '1' }
  ];

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO site_settings (setting_key, setting_value)
    VALUES (?, ?)
  `);

  defaultSettings.forEach(s => {
    insertSetting.run(s.key, s.value);
  });

  console.log('✅ 默认设置初始化完成');

  // Seed mixer dimensions
  const existingDims = db.prepare('SELECT COUNT(*) as c FROM mixer_dimensions').get();
  if (existingDims.c === 0) {
    const insertDim = db.prepare(`INSERT INTO mixer_dimensions (dim_key, name, label, type, icon, min_val, max_val, weight, sort_order) VALUES (?,?,?,?,?,?,?,?,?)`);
    const insertOpt = db.prepare(`INSERT INTO mixer_options (dimension_id, option_value, option_label, icon, sort_order) VALUES (?,?,?,?,?)`);
    const insertWeight = db.prepare(`INSERT INTO mixer_recipe_weights (option_id, recipe_idx, weight) VALUES (?,?,?)`);

    // Existing dimensions (sound, touch, light) as select type
    const soundId = insertDim.run('sound', '听觉', 'Sound', 'select', '🔊', 0, 100, 0.25, 1).lastInsertRowid;
    const touchId = insertDim.run('touch', '触觉', 'Touch', 'select', '✋', 0, 100, 0.20, 2).lastInsertRowid;
    const lightId = insertDim.run('light', '光线', 'Light', 'select', '💡', 0, 100, 0.25, 3).lastInsertRowid;

    // Sound options
    const soundOptions = [
      { value: 'tape-hiss', label: '磁带嘶嘶 — 老书房的午后', icon: '📼', weights: [1.0, 0, 0, 0.4, 1.0, 0, 0.15] },
      { value: 'digital-distortion', label: '数字失真 — 凌晨三点的 IDE', icon: '💻', weights: [0, 1.0, 0.3, 0, 0, 0, 0.15] },
      { value: 'industrial-metal', label: '工业金属 — 废弃工厂的回响', icon: '⚙️', weights: [0, 0.1, 1.0, 0, 0, 0.35, 0] },
      { value: 'felt-piano', label: '绒布钢琴 — 雪后清晨的教堂', icon: '🎹', weights: [0.15, 0.3, 0, 1.0, 0, 0.2, 0] },
      { value: 'vinyl-crackle', label: '黑胶爆裂 — 70年代客厅', icon: '📀', weights: [0.45, 0, 0, 0.15, 1.0, 0, 0] },
      { value: 'citypop-bass', label: 'Citypop 贝斯 — 80年代东京街头', icon: '🌈', weights: [0.1, 0, 0, 0, 0.2, 1.0, 0] },
      { value: 'drum-pulse', label: '鼓点脉冲 — 午夜俱乐部', icon: '🥁', weights: [0, 0.1, 0.4, 0, 0, 0.3, 1.0] }
    ];
    soundOptions.forEach((opt, i) => {
      const optId = insertOpt.run(soundId, opt.value, opt.label, opt.icon, i).lastInsertRowid;
      opt.weights.forEach((w, ri) => { if (w > 0) insertWeight.run(optId, ri, w); });
    });

    // Touch options
    const touchOptions = [
      { value: 'dusty-pages', label: '泛黄书页 — 二手书店角落', icon: '📚', weights: [1.0, 0, 0, 0.4, 0, 0, 0.1] },
      { value: 'frost-glass', label: '磨砂玻璃 — 冬日车窗', icon: '❄️', weights: [0, 1.0, 0, 0.3, 0, 0, 0.15] },
      { value: 'rusty-iron', label: '生锈钢铁 — 废弃机器', icon: '🔩', weights: [0, 0.1, 1.0, 0, 0, 0.35, 0] },
      { value: 'birch-moss', label: '白桦树皮 — 北欧森林', icon: '🌿', weights: [0, 0.25, 0, 1.0, 0, 0.15, 0] },
      { value: 'old-album', label: '黑胶封套 — 岁月留声', icon: '📀', weights: [0.5, 0, 0, 0.1, 1.0, 0, 0] },
      { value: 'pool-water', label: '泳池水面 — 夏日午后', icon: '💧', weights: [0, 0.2, 0, 0, 0.1, 1.0, 0] },
      { value: 'black-velvet', label: '黑色丝绒 — 奢华质感', icon: '🖤', weights: [0, 0, 0.3, 0, 0.1, 0, 1.0] }
    ];
    touchOptions.forEach((opt, i) => {
      const optId = insertOpt.run(touchId, opt.value, opt.label, opt.icon, i).lastInsertRowid;
      opt.weights.forEach((w, ri) => { if (w > 0) insertWeight.run(optId, ri, w); });
    });

    // Light options
    const lightOptions = [
      { value: 'amber-sunset', label: '琥珀夕阳 — 黄金时刻', icon: '🌅', weights: [1.0, 0, 0, 0, 0.5, 0.1, 0] },
      { value: 'overexposed-winter', label: '过曝冬日 — 刺眼雪白', icon: '❄️', weights: [0, 1.0, 0, 0.35, 0, 0, 0.1] },
      { value: 'glitch-neon', label: '故障霓虹 — 赛博都市', icon: '🟦', weights: [0, 0, 1.0, 0, 0, 0.3, 0.15] },
      { value: 'arctic-diffused', label: '北极漫射 — 柔和均匀', icon: '🌨️', weights: [0, 0.4, 0, 1.0, 0, 0.1, 0] },
      { value: 'linen-warm', label: '亚麻暖光 — 窗边阅读', icon: '☀️', weights: [0.45, 0, 0, 0.15, 1.0, 0, 0] },
      { value: 'noon-hard', label: '正午硬光 — 锐利阴影', icon: '🌞', weights: [0.1, 0.2, 0, 0, 0, 1.0, 0] },
      { value: 'rembrandt-side', label: '伦勃朗侧光 — 戏剧明暗', icon: '🎨', weights: [0, 0, 0.25, 0.15, 0, 0.2, 1.0] }
    ];
    lightOptions.forEach((opt, i) => {
      const optId = insertOpt.run(lightId, opt.value, opt.label, opt.icon, i).lastInsertRowid;
      opt.weights.forEach((w, ri) => { if (w > 0) insertWeight.run(optId, ri, w); });
    });

    // New dimensions
    const tempId = insertDim.run('temperature', '温度', 'Temperature', 'slider', '🌡️', -100, 100, 0.10, 4).lastInsertRowid;
    const densityId = insertDim.run('density', '密度', 'Density', 'slider', '🔲', 0, 100, 0.10, 5).lastInsertRowid;
    const rhythmId = insertDim.run('rhythm', '节奏', 'Rhythm', 'slider', '🥁', 0, 100, 0.05, 6).lastInsertRowid;
    const emotionId = insertDim.run('emotion', '情绪', 'Emotion', 'tag', '🎭', 0, 100, 0.05, 7).lastInsertRowid;

    // Emotion tags
    const emotionTags = [
      { value: 'nostalgic', label: '怀旧', weights: [1.0, 0, 0, 0, 0.8, 0, 0] },
      { value: 'lonely', label: '孤独', weights: [0, 1.0, 0, 0.3, 0, 0, 0] },
      { value: 'warm', label: '温暖', weights: [0.3, 0, 0, 0.5, 0.8, 0, 0] },
      { value: 'restless', label: '躁动', weights: [0, 0, 0.8, 0, 0, 0.5, 0.7] },
      { value: 'serene', label: '宁静', weights: [0, 0.3, 0, 1.0, 0, 0, 0] },
      { value: 'mysterious', label: '神秘', weights: [0, 0, 0.5, 0, 0, 0.2, 1.0] }
    ];
    emotionTags.forEach((opt, i) => {
      const optId = insertOpt.run(emotionId, opt.value, opt.label, '', i).lastInsertRowid;
      opt.weights.forEach((w, ri) => { if (w > 0) insertWeight.run(optId, ri, w); });
    });

    console.log('✅ 感官维度初始化完成');
  }
}

module.exports = { db, initDatabase };
