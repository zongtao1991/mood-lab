/**
 * 种子脚本：填充回收估价系统设备数据 + 示例报价
 * 运行方式：node scripts/seed-devices.js
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs-extra');

const dataDir = path.join(__dirname, '..', 'data');
fs.ensureDirSync(dataDir);
const dbPath = path.join(dataDir, 'mood-lab.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// ===== 设备数据 =====
const devices = [
  // iPhone
  { device_id: 'iphone-17-pro-max', category: 'iPhone', name: 'iPhone 17 Pro Max', model_code: '', icon: '📱', storage_options: '["256GB","512GB","1TB"]', sort_order: 1 },
  { device_id: 'iphone-17-pro', category: 'iPhone', name: 'iPhone 17 Pro', model_code: '', icon: '📱', storage_options: '["128GB","256GB","512GB","1TB"]', sort_order: 2 },
  { device_id: 'iphone-17', category: 'iPhone', name: 'iPhone 17', model_code: '', icon: '📱', storage_options: '["128GB","256GB","512GB"]', sort_order: 3 },
  { device_id: 'iphone-16-pro-max', category: 'iPhone', name: 'iPhone 16 Pro Max', model_code: '', icon: '📱', storage_options: '["256GB","512GB","1TB"]', sort_order: 4 },
  { device_id: 'iphone-16-pro', category: 'iPhone', name: 'iPhone 16 Pro', model_code: '', icon: '📱', storage_options: '["128GB","256GB","512GB","1TB"]', sort_order: 5 },
  { device_id: 'iphone-16', category: 'iPhone', name: 'iPhone 16', model_code: '', icon: '📱', storage_options: '["128GB","256GB","512GB"]', sort_order: 6 },
  { device_id: 'iphone-15-pro-max', category: 'iPhone', name: 'iPhone 15 Pro Max', model_code: '', icon: '📱', storage_options: '["256GB","512GB","1TB"]', sort_order: 7 },
  { device_id: 'iphone-15-pro', category: 'iPhone', name: 'iPhone 15 Pro', model_code: '', icon: '📱', storage_options: '["128GB","256GB","512GB","1TB"]', sort_order: 8 },
  { device_id: 'iphone-15', category: 'iPhone', name: 'iPhone 15', model_code: '', icon: '📱', storage_options: '["128GB","256GB","512GB"]', sort_order: 9 },
  { device_id: 'iphone-14-pro-max', category: 'iPhone', name: 'iPhone 14 Pro Max', model_code: '', icon: '📱', storage_options: '["128GB","256GB","512GB","1TB"]', sort_order: 10 },
  { device_id: 'iphone-14', category: 'iPhone', name: 'iPhone 14', model_code: '', icon: '📱', storage_options: '["128GB","256GB","512GB"]', sort_order: 11 },
  { device_id: 'iphone-13', category: 'iPhone', name: 'iPhone 13', model_code: '', icon: '📱', storage_options: '["128GB","256GB","512GB"]', sort_order: 12 },
  { device_id: 'iphone-se-3', category: 'iPhone', name: 'iPhone SE 3', model_code: '', icon: '📱', storage_options: '["64GB","128GB","256GB"]', sort_order: 13 },

  // iPad
  { device_id: 'ipad-pro-m4', category: 'iPad', name: 'iPad Pro M4', model_code: '', icon: '📟', storage_options: '["256GB","512GB","1TB","2TB"]', sort_order: 1 },
  { device_id: 'ipad-air-m2', category: 'iPad', name: 'iPad Air M2', model_code: '', icon: '📟', storage_options: '["128GB","256GB","512GB","1TB"]', sort_order: 2 },
  { device_id: 'ipad-10', category: 'iPad', name: 'iPad 10', model_code: '', icon: '📟', storage_options: '["64GB","256GB"]', sort_order: 3 },
  { device_id: 'ipad-mini-7', category: 'iPad', name: 'iPad mini 7', model_code: '', icon: '📟', storage_options: '["128GB","256GB","512GB"]', sort_order: 4 },

  // AirPods
  { device_id: 'airpods-pro-2', category: 'AirPods', name: 'AirPods Pro 2', model_code: '', icon: '🎧', storage_options: '["-"]', sort_order: 1 },
  { device_id: 'airpods-4', category: 'AirPods', name: 'AirPods 4', model_code: '', icon: '🎧', storage_options: '["-"]', sort_order: 2 },
  { device_id: 'airpods-max', category: 'AirPods', name: 'AirPods Max', model_code: '', icon: '🎧', storage_options: '["-"]', sort_order: 3 },

  // Apple Watch
  { device_id: 'apple-watch-ultra-2', category: 'Apple Watch', name: 'Apple Watch Ultra 2', model_code: '', icon: '⌚', storage_options: '["64GB"]', sort_order: 1 },
  { device_id: 'apple-watch-series-10', category: 'Apple Watch', name: 'Apple Watch Series 10', model_code: '', icon: '⌚', storage_options: '["64GB"]', sort_order: 2 },
  { device_id: 'apple-watch-se-2', category: 'Apple Watch', name: 'Apple Watch SE 2', model_code: '', icon: '⌚', storage_options: '["32GB"]', sort_order: 3 },
];

// ===== 示例报价（今天的日期） =====
const today = new Date().toISOString().split('T')[0];
const grades = ['S', 'A', 'B', 'C', 'D'];

// iPhone 16 Pro Max 报价
const iphone16ProMaxPrices = {
  '256GB': { warranty: [7500, 6380, 5250, 3750, 2500], expired: [6000, 5100, 4200, 3000, 2000] },
  '512GB': { warranty: [8500, 7230, 5950, 4250, 2830], expired: [6800, 5780, 4760, 3400, 2270] },
  '1TB':   { warranty: [9500, 8080, 6650, 4750, 3170], expired: [7600, 6460, 5320, 3800, 2530] }
};

// iPhone 16 Pro 报价
const iphone16ProPrices = {
  '128GB': { warranty: [5800, 4930, 4060, 2900, 1930], expired: [4640, 3940, 3250, 2320, 1550] },
  '256GB': { warranty: [6500, 5530, 4550, 3250, 2170], expired: [5200, 4420, 3640, 2600, 1730] },
  '512GB': { warranty: [7500, 6380, 5250, 3750, 2500], expired: [6000, 5100, 4200, 3000, 2000] },
  '1TB':   { warranty: [8500, 7230, 5950, 4250, 2830], expired: [6800, 5780, 4760, 3400, 2270] }
};

// iPhone 15 Pro Max 报价
const iphone15ProMaxPrices = {
  '256GB': { warranty: [6000, 5100, 4200, 3000, 2000], expired: [4800, 4080, 3360, 2400, 1600] },
  '512GB': { warranty: [6800, 5780, 4760, 3400, 2270], expired: [5440, 4620, 3810, 2720, 1810] },
  '1TB':   { warranty: [7800, 6630, 5460, 3900, 2600], expired: [6240, 5300, 4370, 3120, 2080] }
};

// ===== 插入数据 =====
console.log('🌱 开始种子数据写入...');

// 插入设备（忽略重复）
const insertDevice = db.prepare(`
  INSERT OR IGNORE INTO devices (device_id, category, name, model_code, icon, storage_options, sort_order, active)
  VALUES (?, ?, ?, ?, ?, ?, ?, 1)
`);

const insertPrice = db.prepare(`
  INSERT OR REPLACE INTO daily_prices (device_id, warranty_type, storage, condition_grade, price, price_date)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const batch = db.transaction(() => {
  // 写入设备
  for (const d of devices) {
    insertDevice.run(d.device_id, d.category, d.name, d.model_code, d.icon, d.storage_options, d.sort_order);
  }
  console.log(`✅ 已写入 ${devices.length} 个设备`);

  // 写入 iPhone 16 Pro Max 报价
  for (const [storage, data] of Object.entries(iphone16ProMaxPrices)) {
    for (let i = 0; i < grades.length; i++) {
      insertPrice.run('iphone-16-pro-max', 'warranty', storage, grades[i], data.warranty[i], today);
      insertPrice.run('iphone-16-pro-max', 'expired', storage, grades[i], data.expired[i], today);
    }
  }
  console.log('✅ 已写入 iPhone 16 Pro Max 报价');

  // 写入 iPhone 16 Pro 报价
  for (const [storage, data] of Object.entries(iphone16ProPrices)) {
    for (let i = 0; i < grades.length; i++) {
      insertPrice.run('iphone-16-pro', 'warranty', storage, grades[i], data.warranty[i], today);
      insertPrice.run('iphone-16-pro', 'expired', storage, grades[i], data.expired[i], today);
    }
  }
  console.log('✅ 已写入 iPhone 16 Pro 报价');

  // 写入 iPhone 15 Pro Max 报价
  for (const [storage, data] of Object.entries(iphone15ProMaxPrices)) {
    for (let i = 0; i < grades.length; i++) {
      insertPrice.run('iphone-15-pro-max', 'warranty', storage, grades[i], data.warranty[i], today);
      insertPrice.run('iphone-15-pro-max', 'expired', storage, grades[i], data.expired[i], today);
    }
  }
  console.log('✅ 已写入 iPhone 15 Pro Max 报价');
});

batch();

console.log('\n🎉 种子数据写入完成！');
console.log(`   设备数量: ${devices.length}`);
console.log(`   报价日期: ${today}`);
console.log(`   报价设备: iPhone 16 Pro Max, iPhone 16 Pro, iPhone 15 Pro Max`);
console.log(`   每设备: 2种保修类型 × 各容量 × 5种成色`);

db.close();
process.exit(0);
