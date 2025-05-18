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

// Collections for cooldowns
client.cooldowns = {
  pvp: new Collection(),
  bikip: new Collection(),
  tuluyen: new Collection(),
  duocvien: new Collection(),
  linhthu: new Collection(),
  bicanh: new Collection(),
  boss: new Collection()
};

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
      case 'boss':
        handleBossCommand(message);
        break;
      case 'danhboss':
        handleAttackBossCommand(message);
        break;
      case 'help':
        handleHelpCommand(message);
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

function handleHelpCommand(message) {
  const helpText = `
**Danh sách lệnh:**
!boss - Xem thông tin boss hiện tại
!danhboss - Tấn công boss (mỗi người 3 lần/ngày)
!help - Hiển thị danh sách lệnh

**Thông tin boss:**
- Boss xuất hiện mỗi 30 phút
- Mỗi người được đánh 3 lần
- Boss cần 10 lần tấn công để hạ gục
- Người kết liễu boss nhận phần thưởng đặc biệt
  `;
  message.reply(helpText);
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
