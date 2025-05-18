require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const keepAlive = require('./server.js');

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

const PREFIX = '!'; // Thay đổi prefix thành !

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
  bikip: 2 * 60 * 60 * 1000, // 2 hours
  tuluyen: 60 * 60 * 1000,   // 1 hour
  duocvien: 30 * 60 * 1000,  // 30 minutes
  linhthu: 24 * 60 * 60 * 1000,  // 24 hours
  bicanh: 6 * 60 * 60 * 1000,    // 6 hours
  boss: 0  // No cooldown for viewing boss
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

// Thêm hệ thống linh thú
const LINH_THU_TYPES = {
  'Hỏa Kỳ Lân': { power: 100, element: 'hỏa' },
  'Băng Phượng Hoàng': { power: 100, element: 'băng' },
  'Lôi Long': { power: 100, element: 'lôi' },
  'Mộc Quy': { power: 100, element: 'mộc' },
  'Thổ Nham Thú': { power: 100, element: 'thổ' }
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
      coins: 100,
      items: [],
      canhGioi: CANH_GIOI[0],
      linhThu: null  // Thêm trường linhThu
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
        channel.send(`🔥 BOSS ${bosses.current} đã xuất hiện! Hãy sử dụng tu!attack để tấn công!`);
      }
    });
  }
}

client.on('ready', () => {
  console.log(`Đăng nhập thành công: ${client.user.tag}!`);
  // Start boss spawn timer
  setInterval(spawnBoss, 30 * 60 * 1000); // Every 30 minutes
  spawnBoss(); // Spawn first boss immediately
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  try {
    switch(command) {
      case 'batdau':
        handleStartCommand(message);
        break;
      case 'trangthai':
        handleStatusCommand(message);
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
      case 'haithuoc':
        handleDuocVienCommand(message);
        break;
      case 'linhthu':
        handleLinhThuCommand(message);
        break;
      case 'thonphe':
        handleThonPheCommand(message);
        break;
      case 'thongthu':
        handleLinhThuInfoCommand(message);
        break;
      case 'bicanh':
        handleBiCanhCommand(message);
        break;
      case 'boss':
        handleBossCommand(message);
        break;
      case 'danhboss':
        handleAttackBossCommand(message);
        break;
      case 'trogiup':
        handleHelpCommand(message);
        break;
    }
  } catch (error) {
    console.error(error);
    message.reply('❌ Có lỗi xảy ra khi thực hiện lệnh.');
  }
});

function handleStartCommand(message) {
  const userId = message.author.id;
  if (client.userData.has(userId)) {
    message.reply('❌ Ngươi đã đăng ký tu tiên rồi! Hãy dùng tu!status để xem thông tin.');
    return;
  }

  client.userData.set(userId, {
    level: 1,
    exp: 0,
    coins: 100,
    items: [],
    canhGioi: CANH_GIOI[0]
  });

  message.reply(`
🎊 Chào mừng ${message.author.username} bước vào con đường tu tiên!

📝 **Thông tin cơ bản:**
🔰 Cảnh giới: ${CANH_GIOI[0]}
💰 Tiền: 100
📊 EXP: 0/100

❓ Dùng tu!help để xem hướng dẫn chi tiết
  `);
}

function handleStatusCommand(message) {
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
🌿 Hái thuốc: ${formatCooldown(checkCooldown(userId, 'duocvien'))}
🐉 Thu phục: ${formatCooldown(checkCooldown(userId, 'linhthu'))}
🏯 Khám phá: ${formatCooldown(checkCooldown(userId, 'bicanh'))}
`;

  message.reply(statusEmbed);
}

function handleHelpCommand(message) {
  const helpText = `
**📜 Hướng Dẫn Tu Tiên**

🎮 **Lệnh cơ bản:**
!batdau - Bắt đầu con đường tu tiên
!trangthai - Xem thông tin tu vi
!trogiup - Xem hướng dẫn

🧘 **Tu luyện & Phát triển:**
!tu - Tu luyện tăng exp (1h/lần)
!bikip - Học bí kíp (30p/lần)
!haithuoc - Hái thuốc (30p/lần)

🌍 **Thám hiểm:**
!linhthu - Thu phục linh thú (24h/lần)
!bicanh - Khám phá bí cảnh (24h/lần)

⚔️ **Chiến đấu:**
!pvp @người_chơi - Luận bàn với đạo hữu (5p/lần)
!boss - Xem thông tin boss
!danhboss - Tấn công boss (3 lần/boss)

💡 **Lưu ý:**
- Boss xuất hiện mỗi 30 phút
- Mỗi người được đánh boss 3 lần
- Boss cần 10 lần tấn công để hạ gục
- Người kết liễu boss nhận phần thưởng đặc biệt
`;
  message.reply(helpText);
}

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

  // Tính sức mạnh cơ bản của người chơi
  const baseUserPower = userData.level * (Math.random() + 0.5);
  const baseTargetPower = targetData.level * (Math.random() + 0.5);

  // Tính thêm sức mạnh từ linh thú
  let userBeastPower = 0;
  let targetBeastPower = 0;

  if (userData.linhThu) {
    userBeastPower = userData.linhThu.power * 0.3; // Linh thú đóng góp 30% sức mạnh
  }
  if (targetData.linhThu) {
    targetBeastPower = targetData.linhThu.power * 0.3;
  }

  // Tổng sức mạnh
  const totalUserPower = baseUserPower + userBeastPower;
  const totalTargetPower = baseTargetPower + targetBeastPower;

  let result;
  if (totalUserPower > totalTargetPower) {
    result = `🏆 ${message.author} đã chiến thắng ${target}!\n` +
             `💪 Sức mạnh: ${totalUserPower.toFixed(1)} > ${totalTargetPower.toFixed(1)}\n` +
             `📊 Chi tiết:\n` +
             `👤 ${message.author.username}: ${baseUserPower.toFixed(1)} + ${userBeastPower.toFixed(1)} (Linh thú)\n` +
             `👤 ${target.username}: ${baseTargetPower.toFixed(1)} + ${targetBeastPower.toFixed(1)} (Linh thú)`;
    userData.coins += 100;
  } else {
    result = `💀 ${message.author} đã thua ${target}!\n` +
             `💪 Sức mạnh: ${totalUserPower.toFixed(1)} < ${totalTargetPower.toFixed(1)}\n` +
             `📊 Chi tiết:\n` +
             `👤 ${message.author.username}: ${baseUserPower.toFixed(1)} + ${userBeastPower.toFixed(1)} (Linh thú)\n` +
             `👤 ${target.username}: ${baseTargetPower.toFixed(1)} + ${targetBeastPower.toFixed(1)} (Linh thú)`;
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
  const userData = getUserData(userId);
  
  // Kiểm tra nếu đã có linh thú
  if (userData.linhThu) {
    message.reply(`🐾 Bạn đã có ${userData.linhThu.name} (Cấp ${userData.linhThu.level}) rồi!\nDùng !thonphe để tìm linh thú khác thôn phệ.`);
    return;
  }

  const cooldownTime = checkCooldown(userId, 'linhthu');
  if (cooldownTime > 0) {
    const hours = Math.floor(cooldownTime / 3600);
    const minutes = Math.floor((cooldownTime % 3600) / 60);
    message.reply(`Bạn cần đợi ${hours}h${minutes}m nữa để thu phục linh thú tiếp.`);
    return;
  }

  const success = Math.random() < 0.5;
  if (success) {
    // Chọn ngẫu nhiên một loại linh thú
    const linhThuTypes = Object.keys(LINH_THU_TYPES);
    const randomType = linhThuTypes[Math.floor(Math.random() * linhThuTypes.length)];
    const linhThuInfo = LINH_THU_TYPES[randomType];
    
    // Tạo linh thú mới
    userData.linhThu = {
      name: randomType,
      level: 1,
      exp: 0,
      element: linhThuInfo.element,
      power: linhThuInfo.power
    };

    const expGain = Math.floor(Math.random() * 100) + 100;
    userData.exp += expGain;
    message.reply(`🐉 Thu phục linh thú thành công!\n🎊 Bạn đã thu phục được ${randomType} (${linhThuInfo.element})!\n📊 EXP +${expGain}\n🔋 EXP hiện tại: ${userData.exp}/${userData.level * 100}`);
  } else {
    message.reply('❌ Thu phục linh thú thất bại! Hãy thử lại sau 24 giờ.');
  }
  
  client.cooldowns.linhthu.set(userId, Date.now());
}

function handleThonPheCommand(message) {
  const userId = message.author.id;
  const userData = getUserData(userId);

  if (!userData.linhThu) {
    message.reply('❌ Bạn chưa có linh thú nào để thôn phệ!');
    return;
  }

  const cooldownTime = checkCooldown(userId, 'linhthu');
  if (cooldownTime > 0) {
    const hours = Math.floor(cooldownTime / 3600);
    const minutes = Math.floor((cooldownTime % 3600) / 60);
    message.reply(`Bạn cần đợi ${hours}h${minutes}m nữa để thôn phệ tiếp.`);
    return;
  }

  // Tìm linh thú để thôn phệ
  const success = Math.random() < 0.4; // 40% cơ hội thành công
  if (success) {
    const expGain = Math.floor(Math.random() * 50) + 50;
    userData.linhThu.exp += expGain;
    
    // Kiểm tra level up cho linh thú
    if (userData.linhThu.exp >= userData.linhThu.level * 150) {
      userData.linhThu.level += 1;
      userData.linhThu.exp = 0;
      userData.linhThu.power += 20;
      
      message.reply(`🎊 Chúc mừng! ${userData.linhThu.name} đã đột phá lên cấp ${userData.linhThu.level}!\n💪 Sức mạnh tăng lên ${userData.linhThu.power}!`);
    } else {
      message.reply(`✨ Thôn phệ thành công!\n📊 Linh thú EXP +${expGain}\n🔋 Linh thú EXP: ${userData.linhThu.exp}/${userData.linhThu.level * 150}`);
    }
  } else {
    message.reply('❌ Thôn phệ thất bại! Hãy thử lại sau 24 giờ.');
  }

  client.cooldowns.linhthu.set(userId, Date.now());
}

function handleLinhThuInfoCommand(message) {
  const userId = message.author.id;
  const userData = getUserData(userId);

  if (!userData.linhThu) {
    message.reply('❌ Bạn chưa có linh thú nào!');
    return;
  }

  const linhThu = userData.linhThu;
  const powerContribution = (linhThu.power * 0.3).toFixed(1);
  
  message.reply(`
🐾 **Thông Tin Linh Thú**
Tên: ${linhThu.name}
Cấp độ: ${linhThu.level}
Nguyên tố: ${linhThu.element}
Sức mạnh: ${linhThu.power}
Đóng góp sức mạnh: +${powerContribution} (30% sức mạnh linh thú)
EXP: ${linhThu.exp}/${linhThu.level * 150}
  `);
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

function formatCooldown(seconds) {
  if (seconds <= 0) return '✅ Sẵn sàng';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) return `⏳ ${hours}h${minutes}m`;
  if (minutes > 0) return `⏳ ${minutes}m${remainingSeconds}s`;
  return `⏳ ${remainingSeconds}s`;
}

// Start server and login bot
keepAlive();
client.login(process.env.TOKEN);
