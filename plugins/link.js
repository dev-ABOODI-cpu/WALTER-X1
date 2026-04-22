const { isElite } = require('../haykala/elite.js');
const { jidDecode } = require('@whiskeysockets/baileys');

module.exports = {
  command: 'خش',
  description: 'الدخول لمجموعة عبر رابط دعوة (للنخبة فقط).',
  category: 'tools',
  usage: '.خش <رابط>',

  async execute(sock, m, args) {
    try {
      const chatId = m.key.remoteJid;

      // 🔹 رقم المرسل بشكل آمن
      const fullJid = m.key.participant || m.key.remoteJid || '';
      let senderNumber = '';

      try {
        const decoded = jidDecode(fullJid);
        senderNumber = decoded?.user || fullJid.split('@')[0];
      } catch (e) {
        senderNumber = fullJid.split('@')[0];
      }

      // 🔒 تحقق النخبة
      if (!isElite(senderNumber)) {
        return await sock.sendMessage(chatId, {
          text: '🚫 هذا الأمر مخصص للنخبة فقط.'
        }, { quoted: m });
      }

      // 🔹 استخراج النص من كل أنواع الرسائل
      const getText = (m) => {
        if (!m.message) return '';

        const msg = m.message;

        return (
          msg.conversation ||
          msg.extendedTextMessage?.text ||
          msg.imageMessage?.caption ||
          msg.videoMessage?.caption ||
          msg.documentMessage?.caption ||
          ''
        );
      };

      // 🔥 حل نهائي لمشكلة args
      const argsSafe = Array.isArray(args) ? args : [];

      let text = '';
      if (argsSafe.length > 0) {
        text = argsSafe.join(' ');
      } else {
        text = getText(m);
      }

      // 🔍 استخراج كود الدعوة
      const regex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i;
      const match = text.match(regex);

      if (!match) {
        return await sock.sendMessage(chatId, {
          text: '❌ أرسل رابط مجموعة صحيح مثل:\nhttps://chat.whatsapp.com/XXXX'
        }, { quoted: m });
      }

      const inviteCode = match[1];

      // 🚀 محاولة الانضمام
      let result = null;

      try {
        result = await sock.groupAcceptInvite(inviteCode);
      } catch (e1) {
        console.log('primary join error:', e1);

        try {
          result = await sock.groupAcceptInviteV4(inviteCode);
        } catch (e2) {
          console.log('fallback join error:', e2);
        }
      }

      // 📩 الرد النهائي
      if (result) {
        await sock.sendMessage(chatId, {
          text: '✅ تم الانضمام إلى المجموعة بنجاح!'
        }, { quoted: m });
      } else {
        await sock.sendMessage(chatId, {
          text: '⚠️ لم يتم الانضمام.\nقد يكون الرابط منتهي أو المجموعة خاصة جداً.'
        }, { quoted: m });
      }

    } catch (err) {
      console.log('❌ FULL ERROR:', err);

      await sock.sendMessage(m.key.remoteJid, {
        text: '❌ حدث خطأ أثناء تنفيذ الأمر:\n' + (err?.message || 'Unknown error')
      }, { quoted: m });
    }
  }
};