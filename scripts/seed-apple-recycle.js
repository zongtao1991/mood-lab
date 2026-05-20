/**
 * 种子数据 — 基于海峡回收2026/5/6报价
 * 用法: node scripts/seed.js
 */
const { db, initDatabase } = require('../database/db');
const bcrypt = null; // 简单密码，不加密

initDatabase();

// ========== 设备数据 ==========
const devices = [
  // iPhone 在保
  { id: 'iphone-17-pro-max', cat: 'iPhone', name: 'iPhone 17 Pro Max', code: 'A3527', icon: '📱', sort: 1 },
  { id: 'iphone-17-pro', cat: 'iPhone', name: 'iPhone 17 Pro', code: 'A3524', icon: '📱', sort: 2 },
  { id: 'iphone-17', cat: 'iPhone', name: 'iPhone 17', code: 'A3521', icon: '📱', sort: 3 },
  { id: 'iphone-17-air', cat: 'iPhone', name: 'iPhone 17 Air', code: 'A3518', icon: '📱', sort: 4 },
  { id: 'iphone-17e', cat: 'iPhone', name: 'iPhone 17e', code: 'A3635', icon: '📱', sort: 5 },
  { id: 'iphone-16-pro-max', cat: 'iPhone', name: 'iPhone 16 Pro Max', code: 'A3297', icon: '📱', sort: 6 },
  { id: 'iphone-16-pro', cat: 'iPhone', name: 'iPhone 16 Pro', code: 'A3294', icon: '📱', sort: 7 },
  { id: 'iphone-16-plus', cat: 'iPhone', name: 'iPhone 16 Plus', code: 'A3291', icon: '📱', sort: 8 },
  { id: 'iphone-16', cat: 'iPhone', name: 'iPhone 16', code: 'A3288', icon: '📱', sort: 9 },
  { id: 'iphone-16e', cat: 'iPhone', name: 'iPhone 16e', code: 'A3410', icon: '📱', sort: 10 },
  { id: 'iphone-15-pro-max', cat: 'iPhone', name: 'iPhone 15 Pro Max', code: 'A3108', icon: '📱', sort: 11 },
  { id: 'iphone-15-pro', cat: 'iPhone', name: 'iPhone 15 Pro', code: 'A3104', icon: '📱', sort: 12 },
  { id: 'iphone-15-plus', cat: 'iPhone', name: 'iPhone 15 Plus', code: 'A3096', icon: '📱', sort: 13 },
  { id: 'iphone-15', cat: 'iPhone', name: 'iPhone 15', code: 'A3092', icon: '📱', sort: 14 },
  // 过保追加老款
  { id: 'iphone-14-pro-max', cat: 'iPhone', name: 'iPhone 14 Pro Max', code: 'A2896', icon: '📱', sort: 15 },
  { id: 'iphone-14-pro', cat: 'iPhone', name: 'iPhone 14 Pro', code: 'A2892', icon: '📱', sort: 16 },
  { id: 'iphone-14-plus', cat: 'iPhone', name: 'iPhone 14 Plus', code: 'A2888', icon: '📱', sort: 17 },
  { id: 'iphone-14', cat: 'iPhone', name: 'iPhone 14', code: 'A2884', icon: '📱', sort: 18 },
  { id: 'iphone-13-pro-max', cat: 'iPhone', name: 'iPhone 13 Pro Max', code: 'A2644', icon: '📱', sort: 19 },
  { id: 'iphone-13-pro', cat: 'iPhone', name: 'iPhone 13 Pro', code: 'A2636', icon: '📱', sort: 20 },
  { id: 'iphone-13', cat: 'iPhone', name: 'iPhone 13', code: 'A2634', icon: '📱', sort: 21 },
  { id: 'iphone-13-mini', cat: 'iPhone', name: 'iPhone 13 mini', code: 'A2628', icon: '📱', sort: 22 },
  { id: 'iphone-12-pro-max', cat: 'iPhone', name: 'iPhone 12 Pro Max', code: 'A2412', icon: '📱', sort: 23 },
  { id: 'iphone-12-pro', cat: 'iPhone', name: 'iPhone 12 Pro', code: 'A2408', icon: '📱', sort: 24 },
  { id: 'iphone-12', cat: 'iPhone', name: 'iPhone 12', code: 'A2404', icon: '📱', sort: 25 },
  { id: 'iphone-12-mini', cat: 'iPhone', name: 'iPhone 12 mini', code: 'A2400', icon: '📱', sort: 26 },
  { id: 'iphone-se3', cat: 'iPhone', name: 'iPhone SE 3', code: 'A2785', icon: '📱', sort: 27 },
  { id: 'iphone-se2', cat: 'iPhone', name: 'iPhone SE 2', code: 'A2298', icon: '📱', sort: 28 },
  { id: 'iphone-11-pro-max', cat: 'iPhone', name: 'iPhone 11 Pro Max', code: 'A2220', icon: '📱', sort: 29 },
  { id: 'iphone-11-pro', cat: 'iPhone', name: 'iPhone 11 Pro', code: 'A2217', icon: '📱', sort: 30 },
  { id: 'iphone-11', cat: 'iPhone', name: 'iPhone 11', code: 'A2223', icon: '📱', sort: 31 },

  // iPad
  { id: 'ipad-air7-11', cat: 'iPad', name: 'iPad Air 7 11寸', icon: '📟', sort: 1 },
  { id: 'ipad-mini7', cat: 'iPad', name: 'iPad mini 7 8.3寸', icon: '📟', sort: 2 },
  { id: 'ipad-pro-11-2025', cat: 'iPad', name: 'iPad Pro 11寸 2025', icon: '📟', sort: 3 },
  { id: 'ipad-air8-11', cat: 'iPad', name: 'iPad Air 8 11寸', icon: '📟', sort: 4 },
  { id: 'ipad-11-2025', cat: 'iPad', name: 'iPad 11寸 2025', icon: '📟', sort: 5 },

  // AirPods
  { id: 'airpods-max', cat: 'AirPods', name: 'AirPods Max', icon: '🎧', sort: 1 },
  { id: 'airpods-pro3', cat: 'AirPods', name: 'AirPods Pro 3', icon: '🎧', sort: 2 },
  { id: 'airpods-pro2', cat: 'AirPods', name: 'AirPods Pro 2', icon: '🎧', sort: 3 },
  { id: 'airpods-pro1', cat: 'AirPods', name: 'AirPods Pro 1', icon: '🎧', sort: 4 },
  { id: 'airpods-4', cat: 'AirPods', name: 'AirPods 4', icon: '🎧', sort: 5 },
  { id: 'airpods-3', cat: 'AirPods', name: 'AirPods 3', icon: '🎧', sort: 6 },
  { id: 'airpods-2', cat: 'AirPods', name: 'AirPods 2', icon: '🎧', sort: 7 },

  // Apple Watch
  { id: 'apple-watch-ultra2', cat: 'Apple Watch', name: 'Apple Watch Ultra 2', icon: '⌚', sort: 1 },
  { id: 'apple-watch-s10', cat: 'Apple Watch', name: 'Apple Watch Series 10', icon: '⌚', sort: 2 },
  { id: 'apple-watch-se2', cat: 'Apple Watch', name: 'Apple Watch SE 2', icon: '⌚', sort: 3 },
];

// ========== 在保报价（2026/5/6）==========
// 成色: S=高保充新, A=靓机, B=小花, C=大花, D=外爆, E=内爆可测
const warrantyPrices = {
  'iphone-17-pro-max': {
    '256GB': { S:8100, A:7900, B:7700, C:6900, D:6700, E:5500 },
    '512GB': { S:9150, A:8950, B:8650, C:7950, D:7750, E:6550 },
    '1TB':   { S:10400, A:10000, B:9700, C:9100, D:8900, E:7700 },
    '2TB':   { S:12200, A:11800, B:11400, C:10300, D:10100, E:8900 },
  },
  'iphone-17-pro': {
    '256GB': { S:7100, A:6900, B:6700, C:6100, D:5900, E:4850 },
    '512GB': { S:8550, A:8300, B:7900, C:7200, D:7000, E:6050 },
    '1TB':   { S:9650, A:9250, B:8950, C:8150, D:7950, E:6850 },
  },
  'iphone-17': {
    '256GB': { S:4450, A:4300, B:4100, C:3650, D:3500, E:2650 },
    '512GB': { S:6050, A:5850, B:5550, C:5000, D:4850, E:3800 },
  },
  'iphone-17-air': {
    '256GB': { S:4500, A:4300, B:4100, C:3400, D:3250, E:2200 },
    '512GB': { S:5650, A:5450, B:5250, C:4500, D:4350, E:3100 },
    '1TB':   { S:6300, A:6100, B:5900, C:5200, D:5000, E:3750 },
  },
  'iphone-17e': {
    '256GB': { S:3350, A:3150, B:2950, C:2450, D:2350, E:1500 },
    '512GB': { S:4800, A:4600, B:4400, C:3600, D:3450, E:2550 },
  },
  'iphone-16-pro-max': {
    '256GB': { S:6400, A:6050, B:5850, C:5000, D:4850, E:3700 },
    '512GB': { S:7000, A:6800, B:6550, C:5500, D:5350, E:4350 },
    '1TB':   { S:7400, A:7200, B:6900, C:5900, D:5750, E:4650 },
  },
  'iphone-16-pro': {
    '128GB': { S:4350, A:4250, B:4100, C:3450, D:3300, E:2650 },
    '256GB': { S:5600, A:5250, B:5050, C:4250, D:4100, E:3250 },
    '512GB': { S:6300, A:6100, B:5850, C:5000, D:4800, E:3900 },
    '1TB':   { S:6600, A:6400, B:6100, C:5250, D:5050, E:4200 },
  },
  'iphone-16-plus': {
    '128GB': { S:3800, A:3700, B:3450, C:3000, D:2900, E:2400 },
    '256GB': { S:4450, A:4300, B:3950, C:3550, D:3450, E:2800 },
    '512GB': { S:4900, A:4650, B:4350, C:4000, D:3850, E:3300 },
  },
  'iphone-16': {
    '128GB': { S:3450, A:3350, B:3200, C:2800, D:2700, E:2100 },
    '256GB': { S:3900, A:3700, B:3550, C:3100, D:3000, E:2400 },
    '512GB': { S:4400, A:4200, B:4050, C:3600, D:3500, E:2900 },
  },
  'iphone-16e': {
    '128GB': { S:2400, A:2300, B:2150, C:1700, D:1600, E:1100 },
    '256GB': { S:2800, A:2700, B:2550, C:2050, D:1950, E:1400 },
    '512GB': { S:3300, A:3200, B:3050, C:2500, D:2400, E:1750 },
  },
  'iphone-15-pro-max': {
    '256GB': { A:4550, B:4400, C:3850, D:3700, E:2950 },
    '512GB': { A:5050, B:4900, C:4300, D:4150, E:3350 },
    '1TB':   { A:5400, B:5200, C:4550, D:4400, E:3550 },
  },
  'iphone-15-pro': {
    '128GB': { A:3450, B:3300, C:2900, D:2800, E:2150 },
    '256GB': { A:3850, B:3700, C:3300, D:3200, E:2450 },
    '512GB': { A:4500, B:4250, C:3700, D:3600, E:2750 },
    '1TB':   { A:4650, B:4450, C:3950, D:3850, E:2950 },
  },
  'iphone-15-plus': {
    '128GB': { A:3050, B:2900, C:2550, D:2450, E:1900 },
    '256GB': { A:3400, B:3250, C:2900, D:2800, E:2200 },
    '512GB': { A:3800, B:3650, C:3250, D:3150, E:2500 },
  },
  'iphone-15': {
    '128GB': { A:2650, B:2500, C:2200, D:2100, E:1600 },
    '256GB': { A:2950, B:2800, C:2500, D:2400, E:1850 },
    '512GB': { A:3300, B:3150, C:2800, D:2700, E:2100 },
  },
};

// ========== 过保报价（2026/5/6）==========
const expiredPrices = {
  'iphone-16-pro-max': {
    '256GB': { A:5950, B:5750, C:4900, D:4750, E:3600 },
    '512GB': { A:6550, B:6300, C:5300, D:5150, E:4150 },
    '1TB':   { A:7000, B:6700, C:5700, D:5550, E:4450 },
  },
  'iphone-16-pro': {
    '128GB': { A:4150, B:4000, C:3350, D:3200, E:2550 },
    '256GB': { A:5100, B:4850, C:4050, D:3900, E:3050 },
    '512GB': { A:5900, B:5650, C:4800, D:4600, E:3700 },
    '1TB':   { A:6200, B:5900, C:5050, D:4850, E:4000 },
  },
  'iphone-16-plus': {
    '128GB': { A:3600, B:3450, C:2900, D:2800, E:2300 },
    '256GB': { A:4200, B:4000, C:3450, D:3350, E:2700 },
    '512GB': { A:4650, B:4400, C:3900, D:3750, E:3200 },
  },
  'iphone-16': {
    '128GB': { A:3300, B:3150, C:2700, D:2600, E:2000 },
    '256GB': { A:3700, B:3500, C:3000, D:2900, E:2300 },
    '512GB': { A:4200, B:4000, C:3500, D:3400, E:2800 },
  },
  'iphone-16e': {
    '128GB': { A:2300, B:2150, C:1650, D:1550, E:1050 },
    '256GB': { A:2700, B:2550, C:2000, D:1900, E:1350 },
    '512GB': { A:3200, B:3050, C:2450, D:2350, E:1700 },
  },
  'iphone-15-pro-max': {
    '256GB': { A:4350, B:4200, C:3650, D:3500, E:2750 },
    '512GB': { A:4850, B:4700, C:4100, D:3950, E:3150 },
    '1TB':   { A:5200, B:5000, C:4350, D:4200, E:3350 },
  },
  'iphone-15-pro': {
    '128GB': { A:3300, B:3150, C:2750, D:2650, E:2000 },
    '256GB': { A:3650, B:3500, C:3100, D:3000, E:2300 },
    '512GB': { A:4300, B:4050, C:3500, D:3400, E:2600 },
    '1TB':   { A:4450, B:4250, C:3750, D:3650, E:2800 },
  },
  'iphone-15-plus': {
    '128GB': { A:2900, B:2750, C:2400, D:2300, E:1750 },
    '256GB': { A:3250, B:3100, C:2750, D:2650, E:2050 },
    '512GB': { A:3650, B:3500, C:3100, D:3000, E:2350 },
  },
  'iphone-15': {
    '128GB': { A:2500, B:2350, C:2050, D:1950, E:1450 },
    '256GB': { A:2800, B:2650, C:2350, D:2250, E:1700 },
    '512GB': { A:3150, B:3000, C:2650, D:2550, E:1950 },
  },
  'iphone-14-pro-max': {
    '128GB': { A:3500, B:3350, C:2900, D:2800, E:2200 },
    '256GB': { A:3800, B:3650, C:3200, D:3100, E:2450 },
    '512GB': { A:4200, B:4050, C:3550, D:3400, E:2700 },
    '1TB':   { A:4500, B:4350, C:3800, D:3650, E:2900 },
  },
  'iphone-14-pro': {
    '128GB': { A:2800, B:2650, C:2300, D:2200, E:1700 },
    '256GB': { A:3100, B:2950, C:2600, D:2500, E:1950 },
    '512GB': { A:3500, B:3350, C:2950, D:2850, E:2250 },
    '1TB':   { A:3700, B:3550, C:3100, D:3000, E:2400 },
  },
  'iphone-14-plus': {
    '128GB': { A:2350, B:2200, C:1900, D:1800, E:1350 },
    '256GB': { A:2650, B:2500, C:2200, D:2100, E:1600 },
    '512GB': { A:2950, B:2800, C:2500, D:2400, E:1850 },
  },
  'iphone-14': {
    '128GB': { A:2100, B:1950, C:1700, D:1600, E:1200 },
    '256GB': { A:2400, B:2250, C:2000, D:1900, E:1450 },
    '512GB': { A:2700, B:2550, C:2250, D:2150, E:1650 },
  },
  'iphone-13-pro-max': {
    '128GB': { A:2800, B:2650, C:2300, D:2200, E:1700 },
    '256GB': { A:3100, B:2950, C:2600, D:2500, E:1950 },
    '512GB': { A:3400, B:3250, C:2850, D:2750, E:2150 },
    '1TB':   { A:3600, B:3450, C:3050, D:2950, E:2300 },
  },
  'iphone-13-pro': {
    '128GB': { A:2300, B:2150, C:1850, D:1750, E:1350 },
    '256GB': { A:2600, B:2450, C:2150, D:2050, E:1600 },
    '512GB': { A:2900, B:2750, C:2450, D:2350, E:1850 },
    '1TB':   { A:3050, B:2900, C:2600, D:2500, E:1950 },
  },
  'iphone-13': {
    '128GB': { A:1800, B:1700, C:1450, D:1350, E:1050 },
    '256GB': { A:2050, B:1950, C:1700, D:1600, E:1250 },
    '512GB': { A:2300, B:2200, C:1950, D:1850, E:1450 },
  },
  'iphone-13-mini': {
    '128GB': { A:1550, B:1450, C:1250, D:1150, E:900 },
    '256GB': { A:1750, B:1650, C:1450, D:1350, E:1050 },
    '512GB': { A:1950, B:1850, C:1650, D:1550, E:1200 },
  },
  'iphone-12-pro-max': {
    '128GB': { A:1800, B:1600, C:1200, D:1100, E:900 },
    '256GB': { A:1900, B:1700, C:1400, D:1300, E:1100 },
    '512GB': { A:1950, B:1750, C:1450, D:1350, E:1150 },
  },
  'iphone-12-pro': {
    '128GB': { A:1350, B:1250, C:1000, D:900, E:800 },
    '256GB': { A:1450, B:1350, C:1050, D:950, E:850 },
    '512GB': { A:1500, B:1400, C:1100, D:1000, E:900 },
  },
  'iphone-12': {
    '64GB':  { A:900, B:800, C:700, D:650, E:550 },
    '128GB': { A:1000, B:850, C:750, D:700, E:600 },
    '256GB': { A:1100, B:950, C:850, D:800, E:700 },
  },
  'iphone-12-mini': {
    '64GB':  { A:750, B:650, C:450, D:400, E:300 },
    '128GB': { A:850, B:750, C:550, D:500, E:400 },
    '256GB': { A:950, B:850, C:650, D:600, E:500 },
  },
  'iphone-se3': {
    '64GB':  { A:550, B:550, C:450, D:400, E:300 },
    '128GB': { A:750, B:650, C:550, D:500, E:400 },
    '256GB': { A:800, B:700, C:600, D:550, E:450 },
  },
  'iphone-se2': {
    '64GB':  { A:400, B:350, C:300, D:250, E:200 },
    '128GB': { A:500, B:450, C:350, D:300, E:250 },
    '256GB': { A:600, B:500, C:400, D:350, E:300 },
  },
  'iphone-11-pro-max': {
    '64GB':  { A:1100, B:1000, C:800, D:700, E:650 },
    '256GB': { A:1200, B:1100, C:900, D:800, E:750 },
    '512GB': { A:1250, B:1150, C:950, D:850, E:800 },
  },
  'iphone-11-pro': {
    '64GB':  { A:850, B:750, C:600, D:550, E:500 },
    '256GB': { A:1050, B:950, C:800, D:750, E:700 },
    '512GB': { A:1100, B:1000, C:850, D:800, E:750 },
  },
  'iphone-11': {
    '64GB':  { A:750, B:750, C:600, D:550, E:500 },
    '128GB': { A:850, B:750, C:600, D:550, E:500 },
    '256GB': { A:900, B:800, C:700, D:650, E:600 },
  },
};

// ========== 默认扣费规则 ==========
const defaultDeductions = [
  { cat: 'iPhone', name: '颜色差价(金色)', desc: '金色机型统一扣费', amount: 100, type: 'fixed', sort: 1 },
  { cat: 'iPhone', name: '颜色差价(蓝色)', desc: '蓝色机型扣费（部分型号）', amount: 400, type: 'fixed', sort: 2 },
  { cat: 'iPhone', name: '无全套配件', desc: '缺少包装盒/充电器等', amount: 100, type: 'fixed', sort: 3 },
  { cat: 'iPhone', name: '电池健康<95%', desc: '电池容量低于95%', amount: 100, type: 'fixed', sort: 4 },
  { cat: 'iPhone', name: '电池健康<90%', desc: '电池容量低于90%', amount: 150, type: 'fixed', sort: 5 },
  { cat: 'iPhone', name: '面容损坏', desc: 'Face ID 无法使用', amount: 600, type: 'fixed', sort: 6 },
  { cat: 'iPhone', name: '后摄像头损坏', desc: '后置摄像头故障', amount: 450, type: 'fixed', sort: 7 },
  { cat: 'iPhone', name: '屏幕大碎', desc: '屏幕大面积碎裂', amount: 300, type: 'fixed', sort: 8 },
  { cat: 'iPhone', name: '换过屏幕', desc: '非原装屏幕', amount: 80, type: 'fixed', sort: 9 },
  { cat: 'iPhone', name: '电池低于70%', desc: '电池严重老化', amount: 200, type: 'fixed', sort: 10 },
  { cat: 'iPad', name: '屏幕碎裂', desc: 'iPad屏幕损坏', amount: 500, type: 'fixed', sort: 1 },
  { cat: 'iPad', name: 'WiFi故障', desc: 'WiFi模块异常', amount: 200, type: 'fixed', sort: 2 },
  { cat: 'AirPods', name: '充电盒损坏', desc: '充电盒无法使用', amount: 200, type: 'fixed', sort: 1 },
  { cat: 'AirPods', name: '单耳缺失', desc: '只有一只耳机', amount: 300, type: 'fixed', sort: 2 },
  { cat: 'Apple Watch', name: '屏幕碎裂', desc: '表盘屏幕损坏', amount: 300, type: 'fixed', sort: 1 },
  { cat: 'Apple Watch', name: '表带缺失', desc: '原装表带丢失', amount: 50, type: 'fixed', sort: 2 },
];

// ========== 默认管理员 ==========
const defaultAdmin = { username: 'admin', password: 'admin' };

// ========== 执行写入 ==========
const today = '2026-05-06';

db.exec('DELETE FROM daily_prices; DELETE FROM devices; DELETE FROM deduction_rules; DELETE FROM admins;');

const devStmt = db.prepare('INSERT INTO devices (device_id, category, name, model_code, icon, sort_order) VALUES (?,?,?,?,?,?)');
const priceStmt = db.prepare('INSERT INTO daily_prices (device_id, warranty_type, storage, condition_grade, price, price_date) VALUES (?,?,?,?,?,?)');
const deductStmt = db.prepare('INSERT INTO deduction_rules (category, rule_name, description, deduction_amount, deduction_type, sort_order) VALUES (?,?,?,?,?,?)');
const adminStmt = db.prepare('INSERT INTO admins (username, password) VALUES (?,?)');

const seed = db.transaction(() => {
  // 设备
  for (const d of devices) {
    devStmt.run(d.id, d.cat, d.name, d.code || '', d.icon, d.sort);
  }

  // 在保报价
  for (const [devId, storages] of Object.entries(warrantyPrices)) {
    for (const [storage, grades] of Object.entries(storages)) {
      for (const [grade, price] of Object.entries(grades)) {
        priceStmt.run(devId, 'warranty', storage, grade, price, today);
      }
    }
  }

  // 过保报价
  for (const [devId, storages] of Object.entries(expiredPrices)) {
    for (const [storage, grades] of Object.entries(storages)) {
      for (const [grade, price] of Object.entries(grades)) {
        priceStmt.run(devId, 'expired', storage, grade, price, today);
      }
    }
  }

  // 扣费规则
  for (const r of defaultDeductions) {
    deductStmt.run(r.cat, r.name, r.desc, r.amount, r.type, r.sort);
  }

  // 管理员
  adminStmt.run(defaultAdmin.username, defaultAdmin.password);
});

seed();

const priceCount = db.prepare('SELECT COUNT(*) as c FROM daily_prices').get().c;
console.log(`✅ 已写入 ${devices.length} 个设备、${priceCount} 条报价、${defaultDeductions.length} 条扣费规则、1 个管理员`);
