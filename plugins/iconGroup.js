const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { isElite } = require('../haykala/elite.js');

module.exports = {
  command: 'icon',
  description: 'تغيير صورة المجموعة (للنخبة فقط)',
  usage: '.icon (صورة أو رد على صورة)',

  async execute(sock, msg) {
    try {

      const chatId = msg.key.remoteJid;
      const sender = msg.key.participant || msg.key.remoteJid;

      // 🔐 تحقق النخبة
      if (!isElite(sender)) {
        return await sock.sendMessage(chatId, {
          text: `╔══════════════╗
║ ACCESS DENIED ║
║ ELITE ONLY    ║
╚══════════════╝`
        }, { quoted: msg });
      }

      // 📩 استخراج الصورة (رسالة أو رد)
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      const imageMsg =
        msg.message?.imageMessage ||
        quoted?.imageMessage;

      if (!imageMsg) {
        return await sock.sendMessage(chatId, {
          text: `╔══════════════╗
║ NO IMAGE FOUND ║
╚══════════════╝`
        }, { quoted: msg });
      }

      // 📥 تحميل الصورة
      const buffer = await downloadMediaMessage(
        { message: quoted || msg.message },
        'buffer',
        {}
      );

      // 📁 مجلد مؤقت آمن
      const tempDir = path.join(__dirname, '../temp');

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const inputPath = path.join(tempDir, 'icon_input.jpg');
      const outputPath = path.join(tempDir, 'icon_output.jpg');

      fs.writeFileSync(inputPath, buffer);

      // ⚡ تحويل الصورة (اختياري)
      exec(`convert ${inputPath} ${outputPath}`, async (err) => {
        try {

          // لو فشل التحويل نستخدم الأصل
          const finalPath = err ? inputPath : outputPath;

          await sock.updateProfilePicture(chatId, {
            url: finalPath
          });

          // 🧹 تنظيف الملفات
          if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

          await sock.sendMessage(chatId, {
            text: `╔══════════════╗
║ ICON UPDATED ║
║ SUCCESSFUL   ║
╚══════════════╝`
          }, { quoted: msg });

        } catch (e) {
          console.error(e);

          await sock.sendMessage(chatId, {
            text: '❌ فشل في تعيين صورة المجموعة.'
          }, { quoted: msg });
        }
      });

    } catch (error) {
      console.error('ICON ERROR:', error);

      await sock.sendMessage(msg.key.remoteJid, {
        text: 'SYSTEM ERROR'
      }, { quoted: msg });
    }
  }
};