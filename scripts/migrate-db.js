const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs-extra');

const dataDir = path.join(__dirname, '..', 'data');
fs.ensureDirSync(dataDir);

const dbPath = path.join(dataDir, 'mood-lab.db');
const db = new Database(dbPath);

console.log('🔄 开始数据库迁移...\n');

function columnExists(tableName, columnName) {
  try {
    const result = db.prepare(`PRAGMA table_info(${tableName})`).all();
    return result.some(col => col.name === columnName);
  } catch (error) {
    return false;
  }
}

function addColumnIfNotExists(tableName, columnName, columnDef) {
  if (!columnExists(tableName, columnName)) {
    console.log(`   添加列: ${tableName}.${columnName}`);
    try {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
      console.log(`   ✅ ${tableName}.${columnName} 添加成功`);
      return true;
    } catch (error) {
      console.log(`   ⚠️ 添加失败，尝试替代方案...`);
      try {
        const simpleDef = columnDef.replace(/DEFAULT CURRENT_TIMESTAMP/gi, '').trim();
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${simpleDef}`);
        console.log(`   ✅ ${tableName}.${columnName} 添加成功（无默认值）`);
        return true;
      } catch (error2) {
        console.error(`   ❌ 添加失败: ${error2.message}`);
        return false;
      }
    }
  } else {
    console.log(`   ℹ️ ${tableName}.${columnName} 已存在`);
    return false;
  }
}

function createIndexIfNotExists(indexName, tableName, columns) {
  try {
    const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='index' AND name=?`).get(indexName);
    if (!result) {
      const columnsStr = columns.join(', ');
      console.log(`   创建索引: ${indexName}`);
      db.exec(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName}(${columnsStr})`);
      console.log(`   ✅ 索引 ${indexName} 创建成功`);
    } else {
      console.log(`   ℹ️ 索引 ${indexName} 已存在`);
    }
  } catch (error) {
    console.error(`   ❌ 创建索引失败: ${error.message}`);
  }
}

try {
  console.log('📋 检查表结构...\n');
  
  console.log('1. 检查 admins 表:');
  addColumnIfNotExists('admins', 'updated_at', 'DATETIME');
  addColumnIfNotExists('admins', 'last_login_at', 'DATETIME');
  console.log('');
  
  console.log('2. 检查 inquiries 表:');
  addColumnIfNotExists('inquiries', 'updated_at', 'DATETIME');
  console.log('');
  
  console.log('3. 检查 uploads 表:');
  addColumnIfNotExists('uploads', 'updated_at', 'DATETIME');
  console.log('');
  
  console.log('4. 检查 ocr_uploads 表:');
  addColumnIfNotExists('ocr_uploads', 'updated_at', 'DATETIME');
  console.log('');
  
  console.log('5. 检查 devices 表:');
  addColumnIfNotExists('devices', 'updated_at', 'DATETIME');
  console.log('');
  
  console.log('6. 检查 daily_prices 表:');
  addColumnIfNotExists('daily_prices', 'updated_at', 'DATETIME');
  console.log('');
  
  console.log('7. 检查 deduction_rules 表:');
  addColumnIfNotExists('deduction_rules', 'updated_at', 'DATETIME');
  console.log('');
  
  console.log('8. 创建额外索引:');
  createIndexIfNotExists('idx_admins_username', 'admins', ['username']);
  createIndexIfNotExists('idx_inquiries_status', 'inquiries', ['status']);
  createIndexIfNotExists('idx_inquiries_created_at', 'inquiries', ['created_at']);
  console.log('');
  
  console.log('✅ 数据库迁移完成！');
  console.log('\n📊 迁移摘要:');
  console.log('   - 添加了 updated_at 字段到多个表');
  console.log('   - 添加了 last_login_at 字段到 admins 表');
  console.log('   - 创建了额外的性能索引');
  
} catch (error) {
  console.error('\n❌ 迁移失败:', error.message);
  console.error(error.stack);
  process.exit(1);
} finally {
  db.close();
}
