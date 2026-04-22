const os = require('os');
const fs = require('fs');
const path = require('path');

module.exports = {
  command: 'حالة',
  category: 'SYSTEM',
  
  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;

    try {
      const start = Date.now();

      await sock.sendMessage(chatId, {
        text: '🔄 جاري تجهيز لوحة التحكم...'
      }, { quoted: msg });

      const ping = Date.now() - start;

      const uptime = process.uptime();
      const uptimeFormatted = new Date(uptime * 1000).toISOString().substr(11, 8);

      const ramUsed = (process.memoryUsage().rss / 1024 / 1024);
      const totalRAM = (os.totalmem() / 1024 / 1024);
      const cpu = os.loadavg()[0];

      let groups = 0;
      let users = 0;

      try {
        const chats = await sock.groupFetchAllParticipating();
        groups = Object.keys(chats).length;

        users = Object.values(chats)
          .reduce((a, g) => a + (g.participants?.length || 0), 0);
      } catch {}

      // 📌 مسار الصورة (نفس اسم الأمر)
      const imagePath = path.join('/storage/emulated/0/.bot/bot', 'state.png');

      // لو الصورة موجودة → نرسلها
      if (fs.existsSync(imagePath)) {
        const image = fs.readFileSync(imagePath);

        return sock.sendMessage(chatId, {
          image,
          caption:
`╭━━━〔 لوحة التحكم 〕━━━╮
┃ ⚡ Ping: ${ping}ms
┃ ⏱ Uptime: ${uptimeFormatted}
┃ 🧠 RAM: ${ramUsed.toFixed(1)} / ${totalRAM.toFixed(1)} MB
┃ ⚙ CPU: ${cpu.toFixed(2)}
┃ 👥 Groups: ${groups}
┃ 👤 Users: ${users}
┃ 🟢 Status: ONLINE
╰━━━━━━━━━━━━━━╯`
        }, { quoted: msg });
      }

      // ❌ لو الصورة مش موجودة → fallback نصي
      return sock.sendMessage(chatId, {
        text:
`╭━━━〔 لوحة التحكم 〕━━━╮
┃ ⚡ Ping: ${ping}ms
┃ ⏱ Uptime: ${uptimeFormatted}
┃ 🧠 RAM: ${ramUsed.toFixed(1)} / ${totalRAM.toFixed(1)} MB
┃ ⚙ CPU: ${cpu.toFixed(2)}
┃ 👥 Groups: ${groups}
┃ 👤 Users: ${users}
┃ 🟢 Status: ONLINE
╰━━━━━━━━━━━━━━╯`
      }, { quoted: msg });

    } catch (err) {
      console.error(err);

      await sock.sendMessage(chatId, {
        text: '❌ فشل إنشاء لوحة التحكم.'
      }, { quoted: msg });
    }
  }
};