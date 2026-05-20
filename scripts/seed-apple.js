/**
 * 苹果设备种子数据 — 填充 phones + phone_pricing 表
 * 用法: node scripts/seed-apple.js
 */
const { db, initDatabase } = require('../database/db');

const devices = [
  { id: 'iphone-16-pro-max', series: 'iPhone', name: 'iPhone 16 Pro Max', storage: ['256GB','512GB','1TB'], icon: '📱', sort: 1 },
  { id: 'iphone-16-pro', series: 'iPhone', name: 'iPhone 16 Pro', storage: ['128GB','256GB','512GB','1TB'], icon: '📱', sort: 2 },
  { id: 'iphone-16-plus', series: 'iPhone', name: 'iPhone 16 Plus', storage: ['128GB','256GB','512GB'], icon: '📱', sort: 3 },
  { id: 'iphone-16', series: 'iPhone', name: 'iPhone 16', storage: ['128GB','256GB','512GB'], icon: '📱', sort: 4 },
  { id: 'iphone-15-pro-max', series: 'iPhone', name: 'iPhone 15 Pro Max', storage: ['256GB','512GB','1TB'], icon: '📱', sort: 5 },
  { id: 'iphone-15-pro', series: 'iPhone', name: 'iPhone 15 Pro', storage: ['128GB','256GB','512GB','1TB'], icon: '📱', sort: 6 },
  { id: 'iphone-15-plus', series: 'iPhone', name: 'iPhone 15 Plus', storage: ['128GB','256GB','512GB'], icon: '📱', sort: 7 },
  { id: 'iphone-15', series: 'iPhone', name: 'iPhone 15', storage: ['128GB','256GB','512GB'], icon: '📱', sort: 8 },
  { id: 'iphone-14-pro-max', series: 'iPhone', name: 'iPhone 14 Pro Max', storage: ['128GB','256GB','512GB','1TB'], icon: '📱', sort: 9 },
  { id: 'iphone-14-pro', series: 'iPhone', name: 'iPhone 14 Pro', storage: ['128GB','256GB','512GB','1TB'], icon: '📱', sort: 10 },
  { id: 'iphone-14-plus', series: 'iPhone', name: 'iPhone 14 Plus', storage: ['128GB','256GB','512GB'], icon: '📱', sort: 11 },
  { id: 'iphone-14', series: 'iPhone', name: 'iPhone 14', storage: ['128GB','256GB','512GB'], icon: '📱', sort: 12 },
  { id: 'iphone-13-pro-max', series: 'iPhone', name: 'iPhone 13 Pro Max', storage: ['128GB','256GB','512GB','1TB'], icon: '📱', sort: 13 },
  { id: 'iphone-13-pro', series: 'iPhone', name: 'iPhone 13 Pro', storage: ['128GB','256GB','512GB','1TB'], icon: '📱', sort: 14 },
  { id: 'iphone-13', series: 'iPhone', name: 'iPhone 13', storage: ['128GB','256GB','512GB'], icon: '📱', sort: 15 },
  { id: 'iphone-se-3', series: 'iPhone', name: 'iPhone SE (第3代)', storage: ['64GB','128GB','256GB'], icon: '📱', sort: 16 },
  { id: 'ipad-pro-m4', series: 'iPad', name: 'iPad Pro M4', storage: ['256GB','512GB','1TB','2TB'], icon: '📟', sort: 1 },
  { id: 'ipad-air-m2', series: 'iPad', name: 'iPad Air M2', storage: ['128GB','256GB','512GB','1TB'], icon: '📟', sort: 2 },
  { id: 'ipad-10', series: 'iPad', name: 'iPad (第10代)', storage: ['64GB','256GB'], icon: '📟', sort: 3 },
  { id: 'ipad-mini-7', series: 'iPad', name: 'iPad mini (第7代)', storage: ['128GB','256GB','512GB'], icon: '📟', sort: 4 },
  { id: 'macbook-pro-m4-max', series: 'MacBook', name: 'MacBook Pro M4 Max', storage: ['512GB','1TB','2TB','4TB'], icon: '💻', sort: 1 },
  { id: 'macbook-pro-m4-pro', series: 'MacBook', name: 'MacBook Pro M4 Pro', storage: ['512GB','1TB','2TB'], icon: '💻', sort: 2 },
  { id: 'macbook-pro-m4', series: 'MacBook', name: 'MacBook Pro M4', storage: ['512GB','1TB'], icon: '💻', sort: 3 },
  { id: 'macbook-air-m3', series: 'MacBook', name: 'MacBook Air M3', storage: ['256GB','512GB','1TB','2TB'], icon: '💻', sort: 4 },
  { id: 'macbook-air-m2', series: 'MacBook', name: 'MacBook Air M2', storage: ['256GB','512GB','1TB','2TB'], icon: '💻', sort: 5 },
  { id: 'apple-watch-ultra-2', series: 'Apple Watch', name: 'Apple Watch Ultra 2', storage: ['64GB'], icon: '⌚', sort: 1 },
  { id: 'apple-watch-series-10', series: 'Apple Watch', name: 'Apple Watch Series 10', storage: ['64GB'], icon: '⌚', sort: 2 },
  { id: 'apple-watch-se-2', series: 'Apple Watch', name: 'Apple Watch SE (第2代)', storage: ['32GB'], icon: '⌚', sort: 3 },
  { id: 'airpods-pro-2', series: 'AirPods', name: 'AirPods Pro 2', storage: ['-'], icon: '🎧', sort: 1 },
  { id: 'airpods-4', series: 'AirPods', name: 'AirPods 4', storage: ['-'], icon: '🎧', sort: 2 },
  { id: 'airpods-max', series: 'AirPods', name: 'AirPods Max', storage: ['-'], icon: '🎧', sort: 3 },
  { id: 'imac-m4', series: 'Mac', name: 'iMac M4', storage: ['256GB','512GB','1TB','2TB'], icon: '🖥️', sort: 1 },
  { id: 'mac-mini-m4', series: 'Mac', name: 'Mac mini M4', storage: ['256GB','512GB','1TB','2TB'], icon: '🖥️', sort: 2 },
  { id: 'mac-studio-m2-ultra', series: 'Mac', name: 'Mac Studio M2 Ultra', storage: ['512GB','1TB','2TB','4TB','8TB'], icon: '🖥️', sort: 3 },
];

const conditions = ['S', 'A', 'B', 'C'];
const condFactor = { S: 1.0, A: 0.85, B: 0.7, C: 0.5 };
const sellMarkup = 1.25;

const baseRecycle = {
  'iphone-16-pro-max': { '256GB': 7500, '512GB': 8500, '1TB': 9500 },
  'iphone-16-pro': { '128GB': 5800, '256GB': 6500, '512GB': 7500, '1TB': 8500 },
  'iphone-16-plus': { '128GB': 4800, '256GB': 5300, '512GB': 6200 },
  'iphone-16': { '128GB': 4200, '256GB': 4700, '512GB': 5500 },
  'iphone-15-pro-max': { '256GB': 6000, '512GB': 6800, '1TB': 7800 },
  'iphone-15-pro': { '128GB': 4800, '256GB': 5300, '512GB': 6200, '1TB': 7000 },
  'iphone-15-plus': { '128GB': 3800, '256GB': 4200, '512GB': 5000 },
  'iphone-15': { '128GB': 3300, '256GB': 3700, '512GB': 4400 },
  'iphone-14-pro-max': { '128GB': 4800, '256GB': 5300, '512GB': 6000, '1TB': 6800 },
  'iphone-14-pro': { '128GB': 4000, '256GB': 4400, '512GB': 5200, '1TB': 5800 },
  'iphone-14-plus': { '128GB': 3000, '256GB': 3400, '512GB': 4000 },
  'iphone-14': { '128GB': 2600, '256GB': 3000, '512GB': 3600 },
  'iphone-13-pro-max': { '128GB': 3800, '256GB': 4200, '512GB': 4800, '1TB': 5400 },
  'iphone-13-pro': { '128GB': 3200, '256GB': 3600, '512GB': 4200, '1TB': 4700 },
  'iphone-13': { '128GB': 2400, '256GB': 2800, '512GB': 3400 },
  'iphone-se-3': { '64GB': 1200, '128GB': 1500, '256GB': 1800 },
  'ipad-pro-m4': { '256GB': 6500, '512GB': 7500, '1TB': 8800, '2TB': 10500 },
  'ipad-air-m2': { '128GB': 3800, '256GB': 4300, '512GB': 5200, '1TB': 6200 },
  'ipad-10': { '64GB': 2000, '256GB': 2600 },
  'ipad-mini-7': { '128GB': 3200, '256GB': 3700, '512GB': 4500 },
  'macbook-pro-m4-max': { '512GB': 18000, '1TB': 20000, '2TB': 23000, '4TB': 27000 },
  'macbook-pro-m4-pro': { '512GB': 13000, '1TB': 15000, '2TB': 18000 },
  'macbook-pro-m4': { '512GB': 10000, '1TB': 11500 },
  'macbook-air-m3': { '256GB': 6500, '512GB': 7500, '1TB': 8800, '2TB': 10500 },
  'macbook-air-m2': { '256GB': 5200, '512GB': 6000, '1TB': 7200, '2TB': 8500 },
  'apple-watch-ultra-2': { '64GB': 4200 },
  'apple-watch-series-10': { '64GB': 2200 },
  'apple-watch-se-2': { '32GB': 1000 },
  'airpods-pro-2': { '-': 1000 },
  'airpods-4': { '-': 600 },
  'airpods-max': { '-': 2500 },
  'imac-m4': { '256GB': 8000, '512GB': 9500, '1TB': 11000, '2TB': 13000 },
  'mac-mini-m4': { '256GB': 3500, '512GB': 4200, '1TB': 5200, '2TB': 6500 },
  'mac-studio-m2-ultra': { '512GB': 18000, '1TB': 20000, '2TB': 23000, '4TB': 27000, '8TB': 33000 },
};

initDatabase();

db.exec('DELETE FROM phone_pricing; DELETE FROM phones;');

const devStmt = db.prepare(`INSERT INTO phones (phone_id, name, series, icon, storage_options, sort_order, in_stock) VALUES (?,?,?,?,?,?,1)`);
const priceStmt = db.prepare(`INSERT INTO phone_pricing (phone_id, storage, condition_grade, recycle_price, sell_price) VALUES (?,?,?,?,?)`);

const insertMany = db.transaction((devices) => {
  for (const d of devices) {
    devStmt.run(d.id, d.name, d.series, d.icon, JSON.stringify(d.storage), d.sort);
    const prices = baseRecycle[d.id];
    if (!prices) continue;
    for (const [storage, base] of Object.entries(prices)) {
      for (const cond of conditions) {
        const recycle = Math.round(base * condFactor[cond] / 10) * 10;
        const sell = Math.round(recycle * sellMarkup / 10) * 10;
        priceStmt.run(d.id, storage, cond, recycle, sell);
      }
    }
  }
});

insertMany(devices);
console.log(`✅ 已写入 ${devices.length} 个苹果设备及报价`);
