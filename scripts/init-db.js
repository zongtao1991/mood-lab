const { db, initDatabase } = require('../database/db');

// 默认数据
const defaultRecipes = [
  {
    recipe_id: 'peninsula-tin',
    name: '半岛铁盒',
    name_en: 'Peninsula Tin Box',
    category: '怀旧叙事',
    colors: JSON.stringify(['#C4A265','#8B7355','#D4A76A','#6B5B3E']),
    tones: JSON.stringify(['低对比度','高噪点','黄褐色暖调','16:9 宽画幅','叙事感']),
    albums: JSON.stringify(['周杰伦《八度空间》','早期华语流行乐磁带封面']),
    tracks: JSON.stringify(['《反方向的钟》','《爱在西元前》']),
    description: '阳光斜射进堆满杂物的旧书店，空气中的微尘在逆光中飞舞，时间仿佛在此刻停滞。'
  },
  {
    recipe_id: 'ice-echo',
    name: '冰面下的回声',
    name_en: 'Echo Beneath the Ice',
    category: '清冷疏离',
    colors: JSON.stringify(['#E8EDF2','#B0C4D8','#8FA5B8','#D3DCE6']),
    tones: JSON.stringify(['高调曝光','极低饱和度','冷灰蓝偏移','负空间留白','前景失焦']),
    albums: JSON.stringify(['Radiohead《OK Computer》','Bon Iver《For Emma, Forever Ago》']),
    tracks: JSON.stringify(['Everything In Its Right Place','Skinny Love']),
    description: '空旷的郊区停车场，一个人的背影正消失在过曝的白色尽头。呼出的雾气是画面中唯一的温度证据。'
  },
  {
    recipe_id: 'neon-rust',
    name: '霓虹锈蚀',
    name_en: 'Neon Corrosion',
    category: '赛博工业',
    colors: JSON.stringify(['#00BCD4','#FF6B35','#1A1A2E','#E94560']),
    tones: JSON.stringify(['高对比度硬光','青橙互补色','锐利几何阴影','色差噪点','2.39:1 超宽幅']),
    albums: JSON.stringify(['Nine Inch Nails《The Downward Spiral》','Perturbator《Dangerous Days》']),
    tracks: JSON.stringify(['Closer','Tears in Rain (Vangelis)']),
    description: '雨夜工业区的高架桥下，一盏故障霓虹灯以不规则频率闪烁青红光。积水中映出倒置的扭曲城市。'
  },
  {
    recipe_id: 'birch-breath',
    name: '白桦呼吸',
    name_en: 'Birch Breath',
    category: '北欧极简',
    colors: JSON.stringify(['#F5F0EB','#D4C5B5','#E8E0D8','#A89B8C']),
    tones: JSON.stringify(['极简构图','大面积负空间','自然灰调','米白基底','柔焦去锐化']),
    albums: JSON.stringify(['Sigur Rós《( )》','Ólafur Arnalds《Island Songs》']),
    tracks: JSON.stringify(['Svefn-g-englar','Near Light']),
    description: '一间只放置了一把温莎椅的全白房间，窗外是没有尽头的雪原。光线不像照射，更像水一样缓慢漫进室内。'
  },
  {
    recipe_id: 'faded-postcard',
    name: '褪色明信片',
    name_en: 'Faded Postcard',
    category: '怀旧叙事',
    colors: JSON.stringify(['#E8A87C','#D4956B','#C17B5A','#A0522D']),
    tones: JSON.stringify(['Kodak Gold 200','自然过曝','明显暗角','橙红暖偏移','胶片颗粒']),
    albums: JSON.stringify(['Fleetwood Mac《Rumours》','Lana Del Rey《Born to Die》']),
    tracks: JSON.stringify(['Dreams','Video Games']),
    description: '70年代加州太平洋海岸公路旁的汽车旅馆黄昏，阳光把一切都染成蜜糖色，远处的公路延伸到热浪蒸腾的地平线。'
  },
  {
    recipe_id: 'tropical-gravity',
    name: '热带引力',
    name_en: 'Tropical Gravity',
    category: '夏日多巴胺',
    colors: JSON.stringify(['#0047AB','#FF69B4','#FFE135','#00CED1']),
    tones: JSON.stringify(['高饱和度','硬光硬影','Y2K 质感','撞色色块','闪光灯红眼']),
    albums: JSON.stringify(['竹内まりや《Variety》','Dua Lipa《Future Nostalgia》']),
    tracks: JSON.stringify(['Plastic Love','Levitating']),
    description: '棕榈树下的露天泳池派对正午时分，阳光穿透玻璃杯把液体照得像熔化的宝石。水面的反光在白色天花板上疯狂跳舞。'
  },
  {
    recipe_id: 'velvet-abyss',
    name: '天鹅绒深渊',
    name_en: 'Velvet Abyss',
    category: '暗黑电影质感',
    colors: JSON.stringify(['#1A0A0A','#8B0000','#2C1810','#4A0E0E']),
    tones: JSON.stringify(['极低调布光','深黑 80%','Chiaroscuro','单色双色调','变形宽银幕']),
    albums: JSON.stringify(['Massive Attack《Mezzanine》','The Weeknd《After Hours》']),
    tracks: JSON.stringify(['Angel','After Hours']),
    description: '午夜空旷的酒店走廊尽头，一束从半掩房门漏出的暗红色光线像刀一样切开黑暗。走廊地毯上有烟雾在缓缓翻涌。'
  }
];

const defaultProjects = [
  {
    project_id: 'smart-photo-assistant',
    name: '智能摄影助手',
    icon: '📸',
    status: 'active',
    description: '基于 AI 的摄影风格推荐和后期处理助手。分析您的照片，自动推荐最佳的调色方案和构图建议。',
    features: JSON.stringify(['风格识别', '智能调色', '构图分析', '批量处理']),
    actions: JSON.stringify([
      { label: '立即体验', type: 'primary', link: '#' },
      { label: '查看文档', type: 'secondary', link: '#' }
    ])
  },
  {
    project_id: 'mood-agent',
    name: '情绪分析 Agent',
    icon: '🎭',
    status: 'beta',
    description: '一个能够理解人类情绪的智能 Agent。通过文本分析、语音识别和表情检测，精准捕捉用户的情绪状态。',
    features: JSON.stringify(['文本情绪分析', '语音情感识别', '表情检测', '多模态融合']),
    actions: JSON.stringify([
      { label: '申请 Beta 测试', type: 'primary', link: '#' },
      { label: '技术架构', type: 'secondary', link: '#' }
    ])
  },
  {
    project_id: 'content-generator',
    name: '内容生成引擎',
    icon: '✍️',
    status: 'active',
    description: '一站式内容创作平台。从文案到图片，从视频脚本到社交媒体帖子，AI 助您高效创作。',
    features: JSON.stringify(['文案撰写', '图片生成', '视频脚本', '社交媒体']),
    actions: JSON.stringify([
      { label: '开始创作', type: 'primary', link: '#' },
      { label: '作品展示', type: 'secondary', link: '#' }
    ])
  },
  {
    project_id: 'code-assistant',
    name: '代码智能助手',
    icon: '💻',
    status: 'concept',
    description: '专为开发者设计的 AI 编程助手。理解代码意图，提供智能补全、错误检测和重构建议。',
    features: JSON.stringify(['智能补全', '错误检测', '代码重构', '文档生成']),
    actions: JSON.stringify([
      { label: '关注进展', type: 'primary', link: '#' },
      { label: '技术栈', type: 'secondary', link: '#' }
    ])
  }
];

const defaultPhones = [
  {
    phone_id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    model: 'A3108',
    icon: '🍎',
    specs: JSON.stringify(['256GB', '深空黑', 'A17 Pro 芯片']),
    condition: '99 新',
    condition_desc: '几乎全新，使用时间不超过 1 个月，无任何划痕',
    price: 8999,
    original_price: 9999,
    features: JSON.stringify(['支持验机', '7 天无理由', '一年质保']),
    in_stock: 1
  },
  {
    phone_id: 'samsung-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    model: 'SM-S9280',
    icon: '📱',
    specs: JSON.stringify(['512GB', '钛灰色', '骁龙 8 Gen 3']),
    condition: '95 新',
    condition_desc: '轻微使用痕迹，屏幕无划痕，电池健康度 95%',
    price: 6999,
    original_price: 8999,
    features: JSON.stringify(['支持验机', '7 天无理由', '半年质保']),
    in_stock: 1
  },
  {
    phone_id: 'iphone-14-pro',
    name: 'iPhone 14 Pro',
    model: 'A2892',
    icon: '🍎',
    specs: JSON.stringify(['128GB', '暗夜紫', 'A16 仿生']),
    condition: '95 新',
    condition_desc: '正常使用痕迹，屏幕完好，电池健康度 92%',
    price: 4999,
    original_price: 7999,
    features: JSON.stringify(['支持验机', '7 天无理由', '半年质保']),
    in_stock: 1
  },
  {
    phone_id: 'xiaomi-14-ultra',
    name: 'Xiaomi 14 Ultra',
    model: '24031PN0DC',
    icon: '🔴',
    specs: JSON.stringify(['256GB', '黑色', '骁龙 8 Gen 3']),
    condition: '98 新',
    condition_desc: '几乎全新，仅拆封未使用，配件齐全',
    price: 4299,
    original_price: 5999,
    features: JSON.stringify(['支持验机', '7 天无理由', '一年质保']),
    in_stock: 1
  }
];

// 插入数据函数
function insertRecipe(recipe) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO recipes 
    (recipe_id, name, name_en, category, colors, tones, albums, tracks, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    recipe.recipe_id,
    recipe.name,
    recipe.name_en,
    recipe.category,
    recipe.colors,
    recipe.tones,
    recipe.albums,
    recipe.tracks,
    recipe.description
  );
}

function insertProject(project) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO projects 
    (project_id, name, icon, status, description, features, actions)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    project.project_id,
    project.name,
    project.icon,
    project.status,
    project.description,
    project.features,
    project.actions
  );
}

function insertPhone(phone) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO phones 
    (phone_id, name, model, icon, specs, condition, condition_desc, price, original_price, features, in_stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    phone.phone_id,
    phone.name,
    phone.model,
    phone.icon,
    phone.specs,
    phone.condition,
    phone.condition_desc,
    phone.price,
    phone.original_price,
    phone.features,
    phone.in_stock
  );
}

// 主初始化函数
function initData() {
  try {
    initDatabase();
    
    console.log('📥 开始导入默认数据...');
    
    // 导入摄影风格
    for (const recipe of defaultRecipes) {
      insertRecipe(recipe);
      console.log(`✅ 已导入摄影风格: ${recipe.name}`);
    }
    
    // 导入 AI 项目
    for (const project of defaultProjects) {
      insertProject(project);
      console.log(`✅ 已导入 AI 项目: ${project.name}`);
    }
    
    // 导入手机库存
    for (const phone of defaultPhones) {
      insertPhone(phone);
      console.log(`✅ 已导入手机库存: ${phone.name}`);
    }
    
    console.log('\n🎉 所有数据导入完成！');
    db.close();
    
  } catch (error) {
    console.error('❌ 数据导入失败:', error);
    process.exit(1);
  }
}

// 执行初始化
initData();
