const { isElite } = require('../haykala/elite');

module.exports = {
  command: 'خفض',
  category: 'admin',
  description: 'إزالة مشرف من المجموعة (للنخبة)',

  async execute(sock, msg, args = []) {
    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!chatId.endsWith('@g.us')) {
      return sock.sendMessage(chatId, {
        text: '❌ هذا الأمر يعمل فقط في المجموعات.'
      }, { quoted: msg });
    }

    if (!isElite(sender)) {
      return sock.sendMessage(chatId, {
        text: '❌ هذا الأمر مخصص للنخبة فقط.'
      }, { quoted: msg });
    }

    const metadata = await sock.groupMetadata(chatId);

    let target;

    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const replied = msg.message?.extendedTextMessage?.contextInfo?.participant;

    if (mentioned?.length) {
      target = mentioned[0];
    } else if (replied) {
      target = replied;
    } else if (args[0]) {
      const num = args[0].replace(/\D/g, '');
      target = num ? `${num}@s.whatsapp.net` : null;
    }

    if (!target) {
      return sock.sendMessage(chatId, {
        text: '❌ حدد شخص عبر منشن أو رد أو رقم.'
      }, { quoted: msg });
    }

    const member = metadata.participants.find(p => p.id === target);

    if (!member) {
      return sock.sendMessage(chatId, {
        text: '❌ العضو غير موجود في المجموعة.'
      }, { quoted: msg });
    }

    const isAdmin = member.admin === 'admin' || member.admin === 'superadmin';

    if (!isAdmin) {
      return sock.sendMessage(chatId, {
        text: '❌ هذا العضو ليس مشرفاً أصلاً!'
      }, { quoted: msg });
    }

    try {
      await sock.groupParticipantsUpdate(chatId, [target], 'demote');

      return sock.sendMessage(chatId, {
        text: `✅ تم إزالة الإشراف عن @${target.split('@')[0]}`,
        mentions: [target]
      }, { quoted: msg });

    } catch (error) {
      return sock.sendMessage(chatId, {
        text: `❌ فشل تنفيذ الأمر:\n${error.message || error.toString()}`
      }, { quoted: msg });
    }
  }
};