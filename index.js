require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const keepAlive = require('./server.js');

// Khởi tạo client với đầy đủ intents cần thiết
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.GuildPresences
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
    Partials.Reaction
  ]
});

// Ngăn chặn các sự kiện mặc định
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

client.on('error', error => {
  console.error('Discord client error:', error);
});

client.on('warn', info => {
  console.log('Discord client warning:', info);
});

// Prefix và cấu hình
const CONFIG = {
  prefix: '!',
  maxBossHits: 10,
  bossSpawnInterval: 30 * 60 * 1000, // 30 phút
};

// Cooldowns và collections
const cooldowns = {
  pvp: new Collection(),
  bikip: new Collection(),
  tuluyen: new Collection(),
  haithuoc: new Collection(),
  linhthu: new Collection(),
  bicanh: new Collection(),
  boss: new Collection()
};

const userData = new Collection();

// Thời gian cooldown (ms)
const COOLDOWNS = {
  pvp: 5 * 60 * 1000,        // 5 phút
  bikip: 2 * 60 * 60 * 1000, // 2 giờ
  tuluyen: 60 * 60 * 1000,   // 1 giờ
  haithuoc: 30 * 60 * 1000,  // 30 phút
  linhthu: 24 * 60 * 60 * 1000,  // 24 giờ
  bicanh: 6 * 60 * 60 * 1000,    // 6 giờ
  boss: 0
};

// Cảnh giới tu tiên
const CANH_GIOI = [
  'Phàm Nhân',
  'Luyện Khí',
  'Trúc Cơ',
  'Kim Đan',
  'Nguyên Anh',
  'Hóa Thần',
  'Luyện Hư',
  'Hợp Thể',
  'Đại Thừa',
  'Độ Kiếp'
];

// Hệ thống linh thú
const LINH_THU_TYPES = {
  'Hỏa Kỳ Lân': { power: 100, element: 'hỏa' },
  'Băng Phượng Hoàng': { power: 100, element: 'băng' },
  'Lôi Long': { power: 100, element: 'lôi' },
  'Mộc Quy': { power: 100, element: 'mộc' },
  'Thổ Nham Thú': { power: 100, element: 'thổ' }
};

// Hệ thống boss
const bosses = {
  current: null,
  hits: 0,
  maxHits: 10,
  types: [
    'Huyết Nguyệt Ma Vương',
    'Thiên Ngoại Tà Tiên',
    'Cổ Tiên Thánh Thú'
  ]
};

// Utility functions
function checkCooldown(userId, command) {
  const cooldownTime = COOLDOWNS[command];
  const timestamps = cooldowns[command];
  
  if (timestamps.has(userId)) {
    const expirationTime = timestamps.get(userId) + cooldownTime;
    if (Date.now() < expirationTime) {
      return Math.round((expirationTime - Date.now()) / 1000);
    }
  }
  return 0;
}

function getUserData(userId) {
  if (!userData.has(userId)) {
    userData.set(userId, {
      level: 1,
      exp: 0,
      coins: 100,
      items: [],
      canhGioi: CANH_GIOI[0],
      linhThu: null
    });
  }
  return userData.get(userId);
}

function formatCooldown(seconds) {
  if (seconds <= 0) return '✅ Sẵn sàng';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) return `⏳ ${hours}h${minutes}m`;
  if (minutes > 0) return `⏳ ${minutes}m${remainingSeconds}s`;
  return `⏳ ${remainingSeconds}s`;
}

// Command handlers
const commands = {
  batdau: (message) => {
    const userId = message.author.id;
    if (userData.has(userId)) {
      message.reply('❌ Ngươi đã đăng ký tu tiên rồi! Hãy dùng !trangthai để xem thông tin.');
      return;
    }

    userData.set(userId, {
      level: 1,
      exp: 0,
      coins: 100,
      items: [],
      canhGioi: CANH_GIOI[0],
      linhThu: null
    });

    message.reply(`
🎊 Chào mừng ${message.author.username} bước vào con đường tu tiên!

📝 **Thông tin cơ bản:**
🔰 Cảnh giới: ${CANH_GIOI[0]}
💰 Tiền: 100
📊 EXP: 0/100

❓ Dùng !trogiup để xem hướng dẫn chi tiết
    `);
  },

  trangthai: (message) => {
    const userId = message.author.id;
    const userData = getUserData(userId);
    
    if (!userData) {
      message.reply('❌ Ngươi chưa bắt đầu tu tiên! Hãy dùng !batdau để đăng ký.');
      return;
    }

    const nextLevel = userData.level * 100;
    
    const statusEmbed = `
**🔮 Bảng Thông Tin Tu Tiên**
👤 Đạo hữu: ${message.author.username}
⭐ Cảnh giới: ${CANH_GIOI[userData.level - 1]}
📊 Tu vi: ${userData.exp}/${nextLevel}
💰 Linh thạch: ${userData.coins}

**⏳ Thời gian chờ:**
⚔️ PvP: ${formatCooldown(checkCooldown(userId, 'pvp'))}
📚 Học bí kíp: ${formatCooldown(checkCooldown(userId, 'bikip'))}
🧘 Tu luyện: ${formatCooldown(checkCooldown(userId, 'tuluyen'))}
🌿 Hái thuốc: ${formatCooldown(checkCooldown(userId, 'haithuoc'))}
🐉 Thu phục: ${formatCooldown(checkCooldown(userId, 'linhthu'))}
🏯 Khám phá: ${formatCooldown(checkCooldown(userId, 'bicanh'))}
    `;

    message.reply(statusEmbed);
  },

  tu: (message) => {
    const userId = message.author.id;
    const cooldownTime = checkCooldown(userId, 'tuluyen');
    
    if (cooldownTime > 0) {
      const minutes = Math.floor(cooldownTime / 60);
      const seconds = cooldownTime % 60;
      message.reply(`Bạn cần đợi ${minutes}p${seconds}s nữa để tu luyện tiếp.`);
      return;
    }

    const userData = getUserData(userId);
    const expGain = Math.floor(Math.random() * 50) + 50;
    userData.exp += expGain;
    
    if (userData.exp >= userData.level * 100) {
      userData.level += 1;
      userData.exp = 0;
      message.reply(`🎊 Chúc mừng! Bạn đã đột phá lên cảnh giới ${userData.level}!\n💪 Tu vi tăng mạnh!`);
    } else {
      message.reply(`⚡ Tu luyện thành công!\n📊 EXP +${expGain}\n🔋 EXP hiện tại: ${userData.exp}/${userData.level * 100}`);
    }

    cooldowns.tuluyen.set(userId, Date.now());
  },

  // ... Thêm các command handlers khác tương tự ...

  trogiup: (message) => {
    const helpText = `
**📜 Hướng Dẫn Tu Tiên**

🎮 **Lệnh cơ bản:**
!batdau - Bắt đầu con đường tu tiên
!trangthai - Xem thông tin tu vi
!trogiup - Xem hướng dẫn

🧘 **Tu luyện & Phát triển:**
!tu - Tu luyện tăng exp (1h/lần)
!bikip - Học bí kíp (2h/lần)
!haithuoc - Hái thuốc (30p/lần)

🌍 **Thám hiểm:**
!linhthu - Thu phục linh thú (24h/lần)
!bicanh - Khám phá bí cảnh (6h/lần)

⚔️ **Chiến đấu:**
!pvp @người_chơi - Luận bàn với đạo hữu (5p/lần)
!boss - Xem thông tin boss
!danhboss - Tấn công boss (3 lần/boss)

🐾 **Linh thú:**
!thonphe - Thôn phệ linh thú khác
!thongthu - Xem thông tin linh thú

💡 **Lưu ý:**
- Boss xuất hiện mỗi 30 phút
- Mỗi người được đánh boss 3 lần
- Boss cần 10 lần tấn công để hạ gục
- Người kết liễu boss nhận phần thưởng đặc biệt
    `;
    message.reply(helpText);
  }
};

// Event handlers
client.once('ready', () => {
  console.log(`Đăng nhập thành công: ${client.user.tag}!`);
  setInterval(spawnBoss, CONFIG.bossSpawnInterval);
  spawnBoss();
});

client.on('messageCreate', async (message) => {
  try {
    // Bỏ qua tin nhắn từ bot
    if (message.author.bot) return;

    // Bỏ qua tin nhắn không bắt đầu bằng prefix
    if (!message.content.startsWith(CONFIG.prefix)) return;

    // Parse command và arguments
    const args = message.content.slice(CONFIG.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Chỉ thực thi các lệnh đã được định nghĩa
    if (commands[command]) {
      try {
        await commands[command](message, args);
      } catch (error) {
        console.error(`Error executing command ${command}:`, error);
        message.reply('❌ Có lỗi xảy ra khi thực hiện lệnh.').catch(console.error);
      }
    }
    // Không làm gì cả nếu lệnh không tồn tại
  } catch (error) {
    console.error('Error in messageCreate event:', error);
  }
});

// Thêm event handler cho interactionCreate
client.on('interactionCreate', async (interaction) => {
  try {
    if (!interaction.isCommand()) return;
    // Bỏ qua tất cả các interaction commands
    return;
  } catch (error) {
    console.error('Error in interactionCreate event:', error);
  }
});

// Boss system
function spawnBoss() {
  if (!bosses.current) {
    bosses.current = bosses.types[Math.floor(Math.random() * bosses.types.length)];
    bosses.hits = 0;
    client.guilds.cache.forEach(guild => {
      const channel = guild.channels.cache.find(ch => 
        ch.name.includes('boss') || ch.name.includes('general') || ch.name.includes('chung')
      );
      if (channel) {
        channel.send(`🔥 BOSS ${bosses.current} đã xuất hiện! Hãy sử dụng !danhboss để tấn công!`);
      }
    });
  }
}

// Start bot
keepAlive();
client.login(process.env.TOKEN); 
