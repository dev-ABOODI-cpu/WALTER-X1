const { isElite } = require('../haykala/elite.js');
const { jidDecode } = require('@whiskeysockets/baileys');

const decode = jid =>
  (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

module.exports = {
  command: 'ارسل',
  description: 'إرسال رسالة لأي رقم (للنخبة فقط)',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;
    const sender = decode(msg.key.participant || chatId);
    const senderNum = sender.split('@')[0];

    if (!isElite(senderNum)) {
      return sock.sendMessage(chatId, {
        text: '❌ هذا الأمر للنخبة فقط.'
      }, { quoted: msg });
    }

    const body = msg.message?.extendedTextMessage?.text || msg.message?.conversation || '';
    const args = body.trim().split(' ').slice(1);

    if (args.length < 2) {
      return sock.sendMessage(chatId, {
        text: '❌ الاستخدام:\n.ارسل 966XXXXXXXXX نص الرسالة'
      }, { quoted: msg });
    }

    const rawNumber = args[0].replace(/[^0-9]/g, '');
    const message = args.slice(1).join(' ');

    const jid = rawNumber + '@s.whatsapp.net';

    try {
      // 🔍 تحقق هل الرقم موجود على واتساب
      const [result] = await sock.onWhatsApp(jid);

      if (!result || !result.exists) {
        return sock.sendMessage(chatId, {
          text: '❌ هذا الرقم غير موجود على واتساب.'
        }, { quoted: msg });
      }

      await sock.sendMessage(jid, { text: message });

      return sock.sendMessage(chatId, {
        text: `✅ تم إرسال الرسالة إلى: +${rawNumber}`
      }, { quoted: msg });

    } catch (error) {
      console.error(error);
      return sock.sendMessage(chatId, {
        text: '❌ فشل الإرسال، حاول لاحقاً.'
      }, { quoted: msg });
    }
  }
};