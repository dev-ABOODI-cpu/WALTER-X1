const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
  command: 'ع',
  category: 'عام',
  description: 'فتح الوسائط المخفية + view once + الستوري',

  async execute(sock, msg) {
    try {
      const chatId = msg.key.remoteJid;

      let quoted =
        msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (!quoted) {
        return sock.sendMessage(chatId, {
          text: '❌ لازم ترد على صورة / فيديو / ستوري وتكتب (ع)'
        }, { quoted: msg });
      }

      // =========================
      // 🔥 فتح view once + المخفي
      // =========================
      let media = quoted;

      // View Once
      if (quoted.viewOnceMessageV2) {
        media = quoted.viewOnceMessageV2.message;
      } else if (quoted.viewOnceMessage) {
        media = quoted.viewOnceMessage.message;
      }

      // Ephemeral (رسائل تختفي)
      if (quoted.ephemeralMessage) {
        media = quoted.ephemeralMessage.message;
      }

      const type = Object.keys(media)[0];

      if (!type) {
        return sock.sendMessage(chatId, {
          text: '❌ لا يوجد محتوى مدعوم'
        }, { quoted: msg });
      }

      // =========================
      // 📌 دعم الستوري (Status)
      // =========================
      if (chatId === 'status@broadcast') {
        return sock.sendMessage(chatId, {
          text: '⚠️ لا يمكن عرض ستوري مباشرة من واتساب'
        }, { quoted: msg });
      }

      if (!['imageMessage', 'videoMessage', 'audioMessage'].includes(type)) {
        return sock.sendMessage(chatId, {
          text: '❌ النوع غير مدعوم'
        }, { quoted: msg });
      }

      const buffer = await downloadMediaMessage(
        { message: media },
        'buffer',
        {},
        { reuploadRequest: sock.updateMediaMessage }
      );

      // =========================
      // 📤 الإرسال
      // =========================
      if (type === 'imageMessage') {
        return sock.sendMessage(chatId, {
          image: buffer,
          caption: media.imageMessage?.caption || '🖼️ View Once / Hidden Image'
        }, { quoted: msg });

      } else if (type === 'videoMessage') {
        return sock.sendMessage(chatId, {
          video: buffer,
          caption: media.videoMessage?.caption || '🎥 View Once / Hidden Video'
        }, { quoted: msg });

      } else if (type === 'audioMessage') {
        return sock.sendMessage(chatId, {
          audio: buffer,
          mimetype: 'audio/mp4',
          ptt: true
        }, { quoted: msg });
      }

    } catch (err) {
      console.error(err);
      return sock.sendMessage(msg.key.remoteJid, {
        text: '❌ فشل فتح الوسائط المخفية'
      }, { quoted: msg });
    }
  }
};