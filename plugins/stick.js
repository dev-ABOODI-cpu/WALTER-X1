const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
  command: 'ملصق',

  async execute(sock, m) {
    const chatId = m.key.remoteJid;

    try {
      const contextInfo = m.message?.extendedTextMessage?.contextInfo;

      if (!contextInfo?.quotedMessage?.imageMessage) {
        return sock.sendMessage(chatId, {
          text: '⚠️ لازم ترد على صورة عشان تتحول لملصق.'
        }, { quoted: m });
      }

      const quotedMsg = contextInfo.quotedMessage.imageMessage;

      const stream = await downloadContentFromMessage(quotedMsg, 'image');

      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      if (!buffer.length) {
        return sock.sendMessage(chatId, {
          text: '⚠️ فشل تحميل الصورة.'
        }, { quoted: m });
      }

      // 🔥 ملفات عشوائية عشان ما يحصل تضارب
      const id = Date.now();
      const inputPath = path.join(process.cwd(), `temp-${id}.jpg`);
      const outputPath = path.join(process.cwd(), `temp-${id}.webp`);

      fs.writeFileSync(inputPath, buffer);

      const cmd = `ffmpeg -y -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease" -c:v libwebp -preset default -qscale 80 "${outputPath}"`;

      exec(cmd, async (error) => {
        if (error) {
          console.error(error);
          cleanup();
          return sock.sendMessage(chatId, {
            text: '❌ خطأ في تحويل الصورة.'
          }, { quoted: m });
        }

        try {
          const webpBuffer = fs.readFileSync(outputPath);

          await sock.sendMessage(chatId, {
            sticker: webpBuffer
          }, { quoted: m });

        } catch (e) {
          console.error(e);
          sock.sendMessage(chatId, {
            text: '❌ خطأ أثناء إرسال الملصق.'
          }, { quoted: m });
        }

        cleanup();
      });

      function cleanup() {
        try {
          if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch {}
      }

    } catch (err) {
      console.error(err);
      sock.sendMessage(chatId, {
        text: '❌ حدث خطأ أثناء معالجة الملصق.'
      }, { quoted: m });
    }
  }
};