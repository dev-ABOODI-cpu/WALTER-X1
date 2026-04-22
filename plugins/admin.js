const { isElite } = require('../haykala/elite');

module.exports = {
  command: 'ادمن',
  category: 'admin',
  description: 'ترقية عضو إلى مشرف (نظام WALTER-X)',

  async execute(sock, msg, args = []) {
    try {

      const chatId = msg.key.remoteJid;

      if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, {
          text: '❌ هذا الأمر للمجموعات فقط'
        }, { quoted: msg });
      }

      const sender = msg.key.participant || msg.key.remoteJid;

      if (!isElite(sender)) {
        return sock.sendMessage(chatId, {
          text: '❌ SYSTEM LOCKED'
        }, { quoted: msg });
      }

      const meta = await sock.groupMetadata(chatId);

      // 🧠 تحديد الهدف (ترتيب أولوية واضح)
      let target =
        msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
        msg.message?.extendedTextMessage?.contextInfo?.participant ||
        (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : sender);

      // ❌ التحقق من العضو
      const member = meta.participants.find(p => p.id === target);

      if (!member) {
        return sock.sendMessage(chatId, {
          text: '❌ العضو غير موجود'
        }, { quoted: msg });
      }

      // ⚡ لو هو admin بالفعل
      if (member.admin === 'admin') {
        return sock.sendMessage(chatId, {
          text: `⚠️ @${target.split('@')[0]} بالفعل مشرف`,
          mentions: [target]
        }, { quoted: msg });
      }

      // 🧠 حماية البوت من فقدان السيطرة (اختياري)
      const botId = sock.user.id;
      if (target === botId) {
        return sock.sendMessage(chatId, {
          text: '❌ لا يمكن تعديل البوت'
        }, { quoted: msg });
      }

      // 🚀 تنفيذ الترقية
      await sock.groupParticipantsUpdate(chatId, [target], 'promote');

      return sock.sendMessage(chatId, {
        text: `╔══════════════╗
║ PROMOTED ✔️  ║
╠══════════════╣
║ USER: @${target.split('@')[0]}
║ STATUS: ADMIN
╚══════════════╝`,
        mentions: [target]
      }, { quoted: msg });

    } catch (err) {
      console.error(err);

      return sock.sendMessage(msg.key.remoteJid, {
        text: 'SYSTEM ERROR'
      }, { quoted: msg });
    }
  }
};