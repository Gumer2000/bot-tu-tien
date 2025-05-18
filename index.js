require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const express = require('express');
const app = express();

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction]
});

// Collections for cooldowns and user data
client.cooldowns = {
  pvp: new Collection(),
  bikip: new Collection(),
  tuluyen: new Collection(),
  duocvien: new Collection(),
  linhthu: new Collection(),
  bicanh: new Collection(),
  boss: new Collection()
};

client.userData = new Collection();

// Cooldown times in milliseconds
const COOLDOWNS = {
  pvp: 5 * 60 * 1000,        // 5 minutes
  bikip: 30 * 60 * 1000,     // 30 minutes
  tuluyen: 60 * 60 * 1000,   // 1 hour
  duocvien: 30 * 60 * 1000,  // 30 minutes
  linhthu: 24 * 60 * 60 * 1000,  // 24 hours
  bicanh: 24 * 60 * 60 * 1000,   // 24 hours
  boss: 0  // No cooldown for viewing boss
};

// Boss system
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

// Check cooldown function
function checkCooldown(userId, command) {
  const cooldownTime = COOLDOWNS[command];
  const timestamps = client.cooldowns[command];
  
  if (timestamps.has(userId)) {
    const expirationTime = timestamps.get(userId) + cooldownTime;
    if (Date.now() < expirationTime) {
      const timeLeft = (expirationTime - Date.now()) / 1000;
      return Math.round(timeLeft);
    }
  }
  return 0;
}

// Get or create user data
function getUserData(userId) {
  if (!client.userData.has(userId)) {
    client.userData.set(userId, {
      level: 1,
      exp: 0,
      coins: 0,
      items: []
    });
  }
  return client.userData.get(userId);
}

// Spawn boss every 30 minutes
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

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  // Start boss spawn timer
  setInterval(spawnBoss, 30 * 60 * 1000); // Every 30 minutes
  spawnBoss(); // Spawn first boss immediately
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Command handler
  try {
    switch(command) {
      case 'help':
        handleHelpCommand(message);
        break;
      case 'boss':
        handleBossCommand(message);
        break;
      case 'danhboss':
        handleAttackBossCommand(message);
        break;
      case 'tu':
        handleTuLuyenCommand(message);
        break;
      case 'pvp':
        handlePvPCommand(message, args);
        break;
      case 'bikip':
        handleBiKipCommand(message);
        break;
      case 'duocvien':
        handleDuocVienCommand(message);
        break;
      case 'linhthu':
        handleLinhThuCommand(message);
        break;
      case 'bicanh':
        handleBiCanhCommand(message);
        break;
      case 'info':
        handleInfoCommand(message);
        break;
      case 'huongdantuluyen':
        handleTutorialCommand(message, args);
        break;
      default:
        message.reply('Lệnh không hợp lệ. Sử dụng !help để xem danh sách lệnh.');
    }
  } catch (error) {
    console.error(error);
    message.reply('Có lỗi xảy ra khi thực hiện lệnh.');
  }
});

// Boss command handlers
function handleBossCommand(message) {
  if (!bosses.current) {
    message.reply('Hiện tại không có Boss nào xuất hiện.');
    return;
  }
  
  message.reply(`Boss hiện tại: ${bosses.current}\nSố đòn đã chịu: ${bosses.hits}/${bosses.maxHits}`);
}

function handleAttackBossCommand(message) {
  if (!bosses.current) {
    message.reply('Không có Boss nào để tấn công.');
    return;
  }

  const userId = message.author.id;
  const userHits = client.cooldowns.boss.get(userId) || 0;

  if (userHits >= 3) {
    message.reply('Bạn đã hết lượt tấn công Boss hôm nay.');
    return;
  }

  bosses.hits++;
  client.cooldowns.boss.set(userId, userHits + 1);

  if (bosses.hits >= bosses.maxHits) {
    message.reply(`🎉 Chúc mừng! Bạn đã kết liễu ${bosses.current}!\n💎 Phần thưởng đặc biệt đã được trao tặng.`);
    bosses.current = null;
    bosses.hits = 0;
    // Spawn new boss after 5 minutes
    setTimeout(spawnBoss, 5 * 60 * 1000);
  } else {
    message.reply(`⚔️ Tấn công thành công! Boss còn ${bosses.maxHits - bosses.hits} đòn nữa sẽ gục.`);
  }
}

function handleTuLuyenCommand(message) {
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

  client.cooldowns.tuluyen.set(userId, Date.now());
}

function handlePvPCommand(message, args) {
  const userId = message.author.id;
  const cooldownTime = checkCooldown(userId, 'pvp');
  
  if (cooldownTime > 0) {
    const minutes = Math.floor(cooldownTime / 60);
    const seconds = cooldownTime % 60;
    message.reply(`Bạn cần đợi ${minutes}p${seconds}s nữa để PvP tiếp.`);
    return;
  }

  const target = message.mentions.users.first();
  if (!target) {
    message.reply('Vui lòng tag người chơi bạn muốn thách đấu. Ví dụ: !pvp @tên_người_chơi');
    return;
  }

  if (target.bot) {
    message.reply('Không thể thách đấu với bot!');
    return;
  }

  const userData = getUserData(userId);
  const targetData = getUserData(target.id);

  const userPower = userData.level * (Math.random() + 0.5);
  const targetPower = targetData.level * (Math.random() + 0.5);

  let result;
  if (userPower > targetPower) {
    result = `🏆 ${message.author} đã chiến thắng ${target}!\n💪 Sức mạnh: ${userPower.toFixed(1)} > ${targetPower.toFixed(1)}`;
    userData.coins += 100;
  } else {
    result = `💀 ${message.author} đã thua ${target}!\n💪 Sức mạnh: ${userPower.toFixed(1)} < ${targetPower.toFixed(1)}`;
  }

  message.reply(result);
  client.cooldowns.pvp.set(userId, Date.now());
}

function handleBiKipCommand(message) {
  const userId = message.author.id;
  const cooldownTime = checkCooldown(userId, 'bikip');
  
  if (cooldownTime > 0) {
    const minutes = Math.floor(cooldownTime / 60);
    const seconds = cooldownTime % 60;
    message.reply(`Bạn cần đợi ${minutes}p${seconds}s nữa để học bí kíp tiếp.`);
    return;
  }

  const userData = getUserData(userId);
  const expGain = Math.floor(Math.random() * 30) + 20;
  userData.exp += expGain;
  
  message.reply(`📚 Học bí kíp thành công!\n📊 EXP +${expGain}\n🔋 EXP hiện tại: ${userData.exp}/${userData.level * 100}`);
  client.cooldowns.bikip.set(userId, Date.now());
}

function handleDuocVienCommand(message) {
  const userId = message.author.id;
  const cooldownTime = checkCooldown(userId, 'duocvien');
  
  if (cooldownTime > 0) {
    const minutes = Math.floor(cooldownTime / 60);
    const seconds = cooldownTime % 60;
    message.reply(`Bạn cần đợi ${minutes}p${seconds}s nữa để hái dược viên tiếp.`);
    return;
  }

  const userData = getUserData(userId);
  const coins = Math.floor(Math.random() * 50) + 50;
  userData.coins += coins;
  
  message.reply(`🌿 Hái dược viên thành công!\n💰 Coins +${coins}\n👛 Coins hiện tại: ${userData.coins}`);
  client.cooldowns.duocvien.set(userId, Date.now());
}

function handleLinhThuCommand(message) {
  const userId = message.author.id;
  const cooldownTime = checkCooldown(userId, 'linhthu');
  
  if (cooldownTime > 0) {
    const hours = Math.floor(cooldownTime / 3600);
    const minutes = Math.floor((cooldownTime % 3600) / 60);
    message.reply(`Bạn cần đợi ${hours}h${minutes}m nữa để thu phục linh thú tiếp.`);
    return;
  }

  const userData = getUserData(userId);
  const success = Math.random() < 0.5;
  
  if (success) {
    const expGain = Math.floor(Math.random() * 100) + 100;
    userData.exp += expGain;
    message.reply(`🐉 Thu phục linh thú thành công!\n📊 EXP +${expGain}\n🔋 EXP hiện tại: ${userData.exp}/${userData.level * 100}`);
  } else {
    message.reply('❌ Thu phục linh thú thất bại! Hãy thử lại sau 24 giờ.');
  }
  
  client.cooldowns.linhthu.set(userId, Date.now());
}

function handleBiCanhCommand(message) {
  const userId = message.author.id;
  const cooldownTime = checkCooldown(userId, 'bicanh');
  
  if (cooldownTime > 0) {
    const hours = Math.floor(cooldownTime / 3600);
    const minutes = Math.floor((cooldownTime % 3600) / 60);
    message.reply(`Bạn cần đợi ${hours}h${minutes}m nữa để khám phá bí cảnh tiếp.`);
    return;
  }

  const userData = getUserData(userId);
  const rewards = {
    exp: Math.floor(Math.random() * 200) + 100,
    coins: Math.floor(Math.random() * 100) + 100
  };
  
  userData.exp += rewards.exp;
  userData.coins += rewards.coins;
  
  message.reply(`🏯 Khám phá bí cảnh thành công!\n📊 EXP +${rewards.exp}\n💰 Coins +${rewards.coins}\n🔋 EXP hiện tại: ${userData.exp}/${userData.level * 100}\n👛 Coins hiện tại: ${userData.coins}`);
  client.cooldowns.bicanh.set(userId, Date.now());
}

function handleInfoCommand(message) {
  const userId = message.author.id;
  const userData = getUserData(userId);
  
  const infoEmbed = `
**Thông tin tu luyện của ${message.author.username}**
🏆 Cảnh giới: ${userData.level}
📊 EXP: ${userData.exp}/${userData.level * 100}
💰 Coins: ${userData.coins}

**Cooldown còn lại:**
⚔️ PvP: ${formatCooldown(checkCooldown(userId, 'pvp'))}
📚 Bí kíp: ${formatCooldown(checkCooldown(userId, 'bikip'))}
🧘 Tu luyện: ${formatCooldown(checkCooldown(userId, 'tuluyen'))}
🌿 Dược viên: ${formatCooldown(checkCooldown(userId, 'duocvien'))}
🐉 Linh thú: ${formatCooldown(checkCooldown(userId, 'linhthu'))}
🏯 Bí cảnh: ${formatCooldown(checkCooldown(userId, 'bicanh'))}
`;
  
  message.reply(infoEmbed);
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

function handleHelpCommand(message) {
  const helpText = `
**Danh sách lệnh Tu Tiên:**

🎮 **Lệnh cơ bản:**
!info - Xem thông tin tu luyện
!help - Hiển thị danh sách lệnh

🧘 **Tu luyện (1 giờ/lần):**
!tu - Tu luyện tăng exp

⚔️ **PvP (5 phút/lần):**
!pvp @người_chơi - Thách đấu người chơi khác

📚 **Hoạt động (30 phút/lần):**
!bikip - Học bí kíp
!duocvien - Hái dược viên

🐉 **Hoạt động (24 giờ/lần):**
!linhthu - Thu phục linh thú
!bicanh - Khám phá bí cảnh

🔥 **Boss thế giới:**
!boss - Xem thông tin boss
!danhboss - Tấn công boss (3 lần/boss)

💡 **Thông tin thêm:**
- Boss xuất hiện mỗi 30 phút
- Mỗi người được đánh boss 3 lần
- Boss cần 10 lần tấn công để hạ gục
- Người kết liễu boss nhận phần thưởng đặc biệt
`;
  message.reply(helpText);
}

function handleTutorialCommand(message, args) {
  const topic = args[0]?.toLowerCase();
  
  switch(topic) {
    case 'co_ban':
      message.reply(`
**Hướng dẫn cơ bản Tu Tiên:**

1️⃣ **Bắt đầu tu luyện:**
- Sử dụng !tu để tu luyện tăng exp
- Mỗi lần tu luyện nhận 50-100 exp
- Đủ exp sẽ tự động đột phá cảnh giới
- Cooldown: 1 giờ/lần

2️⃣ **Tăng cường sức mạnh:**
- Học bí kíp (!bikip) - 30 phút/lần
- Thu thập dược viên (!duocvien) - 30 phút/lần
- Thu phục linh thú (!linhthu) - 24 giờ/lần
- Khám phá bí cảnh (!bicanh) - 24 giờ/lần

3️⃣ **Tương tác:**
- PvP với người chơi khác (!pvp @người_chơi)
- Đánh boss thế giới (!danhboss)
- Xem thông tin cá nhân (!info)
      `);
      break;

    case 'canh_gioi':
      message.reply(`
**Hệ thống cảnh giới Tu Tiên:**

🔰 **Cấp độ và yêu cầu EXP:**
- Mỗi cấp yêu cầu: Cấp × 100 EXP
- Ví dụ: 
  + Cấp 1 → 2: 100 EXP
  + Cấp 2 → 3: 200 EXP
  + Cấp 3 → 4: 300 EXP

💪 **Sức mạnh theo cấp:**
- Mỗi cấp tăng sức mạnh cơ bản
- Ảnh hưởng đến kết quả PvP
- Tăng tỷ lệ thành công các hoạt động
      `);
      break;

    case 'linh_thao':
      message.reply(`
**Hệ thống Linh Thảo:**

🌿 **Thu thập dược viên:**
- Lệnh: !duocvien
- Cooldown: 30 phút/lần
- Phần thưởng: 50-100 Coins
- Coins dùng để mua vật phẩm (sắp ra mắt)

💊 **Sử dụng dược viên:**
- Tăng tốc độ tu luyện
- Tăng tỷ lệ thành công
- Chức năng đang phát triển
      `);
      break;

    case 'nhiem_vu':
      message.reply(`
**Hệ thống nhiệm vụ:**

🎯 **Boss thế giới:**
- Xuất hiện mỗi 30 phút
- Mỗi người được đánh 3 lần
- Cần 10 lần tấn công để hạ gục
- Phần thưởng đặc biệt cho người kết liễu

🎁 **Phần thưởng:**
- EXP từ tu luyện và hoạt động
- Coins từ dược viên và bí cảnh
- Phần thưởng đặc biệt từ boss
      `);
      break;

    case 'meo_choi':
      message.reply(`
**Mẹo chơi Tu Tiên:**

💡 **Tối ưu thời gian:**
- Tu luyện ngay khi hết cooldown
- Kết hợp nhiều hoạt động khác nhau
- Tham gia đánh boss khi có thể

🔥 **Tăng tốc phát triển:**
- Ưu tiên tu luyện và học bí kíp
- Thu thập dược viên đều đặn
- Tham gia PvP để kiếm thêm coins

🤝 **Liên minh:**
- Kết bạn với người chơi khác
- Cùng nhau đánh boss
- Chia sẻ tài nguyên và kinh nghiệm
      `);
      break;

    default:
      message.reply(`
**Hướng dẫn Tu Tiên**

Sử dụng lệnh sau để xem hướng dẫn chi tiết:
!huongdantuluyen co_ban - Hướng dẫn cơ bản
!huongdantuluyen canh_gioi - Thông tin cảnh giới
!huongdantuluyen linh_thao - Hệ thống linh thảo
!huongdantuluyen nhiem_vu - Nhiệm vụ & phần thưởng
!huongdantuluyen meo_choi - Mẹo chơi & chiến thuật
      `);
  }
}

// Keep bot alive on Replit
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(3000, () => {
  console.log('Web server running on port 3000');
});

// Login bot
client.login(process.env.TOKEN);
