/**
 * 补充 iPad / AirPods / Watch 报价数据（基于海峡回收 2026/5/6 全新+蓝牙报价图）
 * 用法: node scripts/seed-supplement.js
 */
const { db, initDatabase } = require('../database/db');
initDatabase();

const today = '2026-05-06';

// ========== iPad 在保报价（从全新报价图提取，预激活价作为S级参考）==========
const ipadPrices = {
  'ipad-air7-11': {
    warranty: {
      '128GB': { S: 3800, A: 3600, B: 3400, C: 3000, D: 2800, E: 2200 },
      '256GB': { S: 4300, A: 4100, B: 3850, C: 3400, D: 3200, E: 2500 },
      '512GB': { S: 5200, A: 4950, B: 4650, C: 4100, D: 3900, E: 3100 },
      '1TB':   { S: 6200, A: 5900, B: 5550, C: 4900, D: 4650, E: 3700 },
    },
    expired: {
      '128GB': { A: 3500, B: 3300, C: 2850, D: 2650, E: 2100 },
      '256GB': { A: 4000, B: 3750, C: 3250, D: 3050, E: 2400 },
      '512GB': { A: 4900, B: 4600, C: 4000, D: 3800, E: 3000 },
      '1TB':   { A: 5850, B: 5500, C: 4800, D: 4550, E: 3600 },
    }
  },
  'ipad-mini7': {
    warranty: {
      '128GB': { S: 3200, A: 3050, B: 2880, C: 2550, D: 2400, E: 1900 },
      '256GB': { S: 3700, A: 3500, B: 3300, C: 2900, D: 2750, E: 2150 },
      '512GB': { S: 4500, A: 4280, B: 4020, C: 3550, D: 3380, E: 2650 },
    },
    expired: {
      '128GB': { A: 2950, B: 2780, C: 2450, D: 2300, E: 1800 },
      '256GB': { A: 3400, B: 3200, C: 2780, D: 2620, E: 2050 },
      '512GB': { A: 4200, B: 3950, C: 3480, D: 3300, E: 2580 },
    }
  },
  'ipad-pro-11-2025': {
    warranty: {
      '256GB': { S: 6500, A: 6200, B: 5850, C: 5200, D: 4950, E: 3900 },
      '512GB': { S: 7500, A: 7150, B: 6730, C: 5950, D: 5650, E: 4500 },
      '1TB':   { S: 8800, A: 8400, B: 7900, C: 7000, D: 6650, E: 5300 },
      '2TB':   { S: 10500, A: 10000, B: 9400, C: 8350, D: 7950, E: 6300 },
    },
    expired: {
      '256GB': { A: 6000, B: 5650, C: 5000, D: 4750, E: 3750 },
      '512GB': { A: 6950, B: 6550, C: 5800, D: 5500, E: 4350 },
      '1TB':   { A: 8200, B: 7700, C: 6800, D: 6450, E: 5150 },
      '2TB':   { A: 9800, B: 9200, C: 8150, D: 7750, E: 6150 },
    }
  },
  'ipad-air8-11': {
    warranty: {
      '128GB': { S: 4200, A: 4000, B: 3770, C: 3350, D: 3180, E: 2500 },
      '256GB': { S: 4800, A: 4580, B: 4300, C: 3800, D: 3620, E: 2850 },
      '512GB': { S: 5800, A: 5520, B: 5200, C: 4600, D: 4380, E: 3450 },
      '1TB':   { S: 6800, A: 6480, B: 6100, C: 5400, D: 5150, E: 4050 },
    },
    expired: {
      '128GB': { A: 3850, B: 3650, C: 3200, D: 3050, E: 2400 },
      '256GB': { A: 4450, B: 4200, C: 3680, D: 3500, E: 2750 },
      '512GB': { A: 5400, B: 5100, C: 4500, D: 4280, E: 3380 },
      '1TB':   { A: 6350, B: 5980, C: 5280, D: 5020, E: 3950 },
    }
  },
  'ipad-11-2025': {
    warranty: {
      '128GB': { S: 2800, A: 2680, B: 2520, C: 2230, D: 2120, E: 1670 },
      '256GB': { S: 3300, A: 3150, B: 2960, C: 2620, D: 2500, E: 1970 },
      '512GB': { S: 4100, A: 3920, B: 3680, C: 3260, D: 3100, E: 2450 },
    },
    expired: {
      '128GB': { A: 2550, B: 2400, C: 2120, D: 2000, E: 1580 },
      '256GB': { A: 3050, B: 2880, C: 2520, D: 2400, E: 1880 },
      '512GB': { A: 3800, B: 3600, C: 3180, D: 3020, E: 2380 },
    }
  },
};

// ========== AirPods 报价（从蓝牙报价图提取）==========
const airpodsPrices = {
  'airpods-max': {
    warranty: { '-': { S: 2800, A: 2600, B: 2300, C: 1900, D: 1600, E: 1200 } },
    expired:  { '-': { A: 2500, B: 2200, C: 1800, D: 1500, E: 1100 } },
  },
  'airpods-pro3': {
    warranty: { '-': { S: 1500, A: 1400, B: 1250, C: 1050, D: 900, E: 650 } },
    expired:  { '-': { A: 1350, B: 1200, C: 1000, D: 850, E: 600 } },
  },
  'airpods-pro2': {
    warranty: { '-': { S: 1200, A: 1100, B: 980, C: 820, D: 700, E: 500 } },
    expired:  { '-': { A: 1050, B: 950, C: 780, D: 650, E: 460 } },
  },
  'airpods-pro1': {
    warranty: { '-': { S: 700, A: 650, B: 580, C: 480, D: 400, E: 280 } },
    expired:  { '-': { A: 600, B: 530, C: 440, D: 360, E: 250 } },
  },
  'airpods-4': {
    warranty: { '-': { S: 900, A: 840, B: 750, C: 630, D: 530, E: 380 } },
    expired:  { '-': { A: 800, B: 720, C: 600, D: 500, E: 350 } },
  },
  'airpods-3': {
    warranty: { '-': { S: 600, A: 560, B: 500, C: 420, D: 350, E: 250 } },
    expired:  { '-': { A: 520, B: 470, C: 390, D: 320, E: 220 } },
  },
  'airpods-2': {
    warranty: { '-': { S: 400, A: 370, B: 330, C: 280, D: 230, E: 160 } },
    expired:  { '-': { A: 350, B: 310, C: 260, D: 210, E: 150 } },
  },
};

// ========== Apple Watch 报价 ==========
const watchPrices = {
  'apple-watch-ultra2': {
    warranty: { '-': { S: 4200, A: 4000, B: 3760, C: 3320, D: 3160, E: 2500 } },
    expired:  { '-': { A: 3900, B: 3680, C: 3250, D: 3100, E: 2400 } },
  },
  'apple-watch-s10': {
    warranty: { '-': { S: 2200, A: 2100, B: 1970, C: 1740, D: 1660, E: 1310 } },
    expired:  { '-': { A: 2000, B: 1880, C: 1660, D: 1580, E: 1240 } },
  },
  'apple-watch-se2': {
    warranty: { '-': { S: 1000, A: 950, B: 890, C: 790, D: 750, E: 590 } },
    expired:  { '-': { A: 900, B: 850, C: 750, D: 710, E: 550 } },
  },
};

// ========== 按系列区分的扣费规则 ==========
const seriesDeductions = [
  // iPhone 17 系列
  { cat: 'iPhone 17', name: '蓝色差价', desc: '256G蓝色-400，512G/1T蓝色-800，2T蓝色-1000', amount: 400, type: 'fixed', sort: 1 },
  { cat: 'iPhone 17', name: '无全套配件', desc: '缺少包装盒/充电器等', amount: 100, type: 'fixed', sort: 2 },
  // iPhone 16 系列
  { cat: 'iPhone 16', name: '金色差价', desc: '金色机型统一扣费', amount: 100, type: 'fixed', sort: 1 },
  { cat: 'iPhone 16', name: '无全套配件', desc: '缺少包装盒/充电器等', amount: 100, type: 'fixed', sort: 2 },
  { cat: 'iPhone 16', name: '充电次数0或≥11次', desc: '加价100', amount: -100, type: 'fixed', sort: 3 },
  { cat: 'iPhone 16', name: '充电次数≤10次', desc: '加价50', amount: -50, type: 'fixed', sort: 4 },
  // iPhone 15 系列
  { cat: 'iPhone 15', name: '蓝色差价', desc: '蓝色机型扣费，后盖破当大花收', amount: 100, type: 'fixed', sort: 1 },
  { cat: 'iPhone 15', name: '电池健康<95%', desc: '扣100', amount: 100, type: 'fixed', sort: 2 },
  { cat: 'iPhone 15', name: '电池健康90%-95%', desc: '扣150', amount: 150, type: 'fixed', sort: 3 },
  { cat: 'iPhone 15', name: '内爆壳机', desc: '内爆壳机加钱', amount: -200, type: 'fixed', sort: 4 },
  // iPhone 14/13/12/11/SE 通用
  { cat: 'iPhone 老款', name: '面容损坏', desc: 'Face ID 无法使用', amount: 600, type: 'fixed', sort: 1 },
  { cat: 'iPhone 老款', name: '后摄像头损坏', desc: '后置摄像头故障', amount: 450, type: 'fixed', sort: 2 },
  { cat: 'iPhone 老款', name: '屏幕大碎', desc: '屏幕大面积碎裂', amount: 300, type: 'fixed', sort: 3 },
  { cat: 'iPhone 老款', name: '换过屏幕', desc: '非原装屏幕', amount: 80, type: 'fixed', sort: 4 },
  { cat: 'iPhone 老款', name: '电池低于70%', desc: '电池严重老化', amount: 200, type: 'fixed', sort: 5 },
  { cat: 'iPhone 老款', name: '金色差价', desc: '金色机型扣费', amount: 100, type: 'fixed', sort: 6 },
  // iPad
  { cat: 'iPad', name: '屏幕碎裂', desc: 'iPad屏幕损坏', amount: 500, type: 'fixed', sort: 1 },
  { cat: 'iPad', name: 'WiFi故障', desc: 'WiFi模块异常', amount: 200, type: 'fixed', sort: 2 },
  { cat: 'iPad', name: 'Apple Pencil缺失', desc: 'Pro机型配套笔丢失', amount: 300, type: 'fixed', sort: 3 },
  // AirPods
  { cat: 'AirPods', name: '充电盒损坏', desc: '充电盒无法使用', amount: 200, type: 'fixed', sort: 1 },
  { cat: 'AirPods', name: '单耳缺失', desc: '只有一只耳机', amount: 300, type: 'fixed', sort: 2 },
  { cat: 'AirPods', name: '降噪失效', desc: '主动降噪功能异常', amount: 150, type: 'fixed', sort: 3 },
  // Apple Watch
  { cat: 'Apple Watch', name: '屏幕碎裂', desc: '表盘屏幕损坏', amount: 300, type: 'fixed', sort: 1 },
  { cat: 'Apple Watch', name: '表带缺失', desc: '原装表带丢失', amount: 50, type: 'fixed', sort: 2 },
  { cat: 'Apple Watch', name: '传感器故障', desc: '心率/血氧传感器异常', amount: 200, type: 'fixed', sort: 3 },
];

// ========== 执行 ==========
const priceStmt = db.prepare(`
  INSERT INTO daily_prices (device_id, warranty_type, storage, condition_grade, price, price_date)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(device_id, warranty_type, storage, condition_grade, price_date)
  DO UPDATE SET price = excluded.price
`);

const deductStmt = db.prepare('INSERT INTO deduction_rules (category, rule_name, description, deduction_amount, deduction_type, sort_order) VALUES (?,?,?,?,?,?)');

const seed = db.transaction(() => {
  // 清空旧扣费规则，重写
  db.exec('DELETE FROM deduction_rules');

  // iPad 报价
  for (const [devId, data] of Object.entries(ipadPrices)) {
    for (const [storage, grades] of Object.entries(data.warranty)) {
      for (const [grade, price] of Object.entries(grades)) {
        priceStmt.run(devId, 'warranty', storage, grade, price, today);
      }
    }
    for (const [storage, grades] of Object.entries(data.expired)) {
      for (const [grade, price] of Object.entries(grades)) {
        priceStmt.run(devId, 'expired', storage, grade, price, today);
      }
    }
  }

  // AirPods 报价
  for (const [devId, data] of Object.entries(airpodsPrices)) {
    for (const [storage, grades] of Object.entries(data.warranty)) {
      for (const [grade, price] of Object.entries(grades)) {
        priceStmt.run(devId, 'warranty', storage, grade, price, today);
      }
    }
    for (const [storage, grades] of Object.entries(data.expired)) {
      for (const [grade, price] of Object.entries(grades)) {
        priceStmt.run(devId, 'expired', storage, grade, price, today);
      }
    }
  }

  // Apple Watch 报价
  for (const [devId, data] of Object.entries(watchPrices)) {
    for (const [storage, grades] of Object.entries(data.warranty)) {
      for (const [grade, price] of Object.entries(grades)) {
        priceStmt.run(devId, 'warranty', storage, grade, price, today);
      }
    }
    for (const [storage, grades] of Object.entries(data.expired)) {
      for (const [grade, price] of Object.entries(grades)) {
        priceStmt.run(devId, 'expired', storage, grade, price, today);
      }
    }
  }

  // 按系列扣费规则
  for (const r of seriesDeductions) {
    deductStmt.run(r.cat, r.name, r.desc, r.amount, r.type, r.sort);
  }
});

seed();

const counts = {
  prices: db.prepare('SELECT COUNT(*) as c FROM daily_prices').get().c,
  deductions: db.prepare('SELECT COUNT(*) as c FROM deduction_rules').get().c,
  byCat: db.prepare('SELECT d.category, COUNT(p.id) as c FROM devices d LEFT JOIN daily_prices p ON d.device_id = p.device_id GROUP BY d.category').all(),
};
console.log('✅ 补充完成');
console.log(`   报价总数: ${counts.prices}`);
console.log(`   扣费规则: ${counts.deductions}`);
counts.byCat.forEach(r => console.log(`   ${r.category}: ${r.c} 条报价`));
