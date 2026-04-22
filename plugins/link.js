const { isElite } = require('../haykala/elite.js');
const { jidDecode } = require('@whiskeysockets/baileys');

module.exports = {
  command: 'خش',
  description: 'دخول البوت إلى مجموعة عبر رابط (للنخبة فقط)',
  category: 'CONTROL',
  usage: '.خش <رابط المجموعة>',

  async execute(sock, m) {
    try {
      const chatId = m.key.remoteJid;
      const sender = m.key.participant || m.key.remoteJid;

      const senderNumber =
        jidDecode(sender)?.user || sender.split('@')[0];

      // 🔐 تحقق النخبة
      if (!isElite(senderNumber)) {
        return sock.sendMessage(chatId, {
          text: `❌ هذا الأمر مخصص للنخبة فقط.`
        }, { quoted: m });
      }

      // 📩 استخراج النص
      const text =
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption ||
        '';

      // 🔗 استخراج رابط الدعوة
      const match = text.match(/https:\/\/chat\.whatsapp\.com\/([A-Za-z0-9]+)/i);

      if (!match) {
        return sock.sendMessage(chatId, {
          text: `❌ أرسل رابط مجموعة واتساب صحيح.`
        }, { quoted: m });
      }

      const inviteCode = match[1];

      // ⚡ محاولة الدخول
      try {
        await sock.groupAcceptInvite(inviteCode);

        return sock.sendMessage(chatId, {
          text: `╭━━━〔 🟢 تم الدخول 〕━━━╮
┃ ✔️ تم الانضمام للمجموعة بنجاح
┃ ⚡ بواسطة WALTER-X
╰━━━━━━━━━━━━━━╯`
        }, { quoted: m });

      } catch (err) {
        console.error(err);

        return sock.sendMessage(chatId, {
          text: `❌ فشل الانضمام للمجموعة\nقد يكون الرابط غير صالح أو البوت محظور.`
        }, { quoted: m });
      }

    } catch (err) {
      console.error('JOIN ERROR:', err);

      await sock.sendMessage(m.key.remoteJid, {
        text: '❌ SYSTEM ERROR'
      }, { quoted: m });
    }
  }
};