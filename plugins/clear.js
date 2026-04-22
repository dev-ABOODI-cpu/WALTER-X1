const fs = require('fs');
const path = require('path');

module.exports = {
  command: 'تنظيف',
  description: 'تنظيف ملفات الجلسة بدون التأثير على الاتصال',
  usage: '.تنظيف',

  async execute(sock, msg) {
    try {

      const chatId = msg.key.remoteJid;
      const sessionFolder = path.join(process.cwd(), 'ملف_الاتصال');

      if (!fs.existsSync(sessionFolder)) {
        return sock.sendMessage(chatId, {
          text: '❌ مجلد الجلسة غير موجود'
        }, { quoted: msg });
      }

      let files = fs.readdirSync(sessionFolder);

      if (!files.length) {
        return sock.sendMessage(chatId, {
          text: '✅ الجلسة نظيفة بالفعل'
        }, { quoted: msg });
      }

      // 🧠 حماية ملفات Baileys المهمة
      const safeFiles = files.filter(f =>
        !f.includes('creds') &&
        !f.includes('session') &&
        !f.endsWith('.json')
      );

      if (!safeFiles.length) {
        return sock.sendMessage(chatId, {
          text: '⚠️ لا يوجد ملفات قابلة للحذف'
        }, { quoted: msg });
      }

      await sock.sendMessage(chatId, {
        text: '🧹 CLEANING SYSTEM STARTED...'
      }, { quoted: msg });

      let deleted = 0;

      for (const file of safeFiles) {
        try {
          const filePath = path.join(sessionFolder, file);

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            deleted++;
          }

        } catch (e) {
          // تجاهل الخطأ
        }
      }

      return sock.sendMessage(chatId, {
        text: `╔══════════════╗
║ CLEAN DONE   ║
║ FILES REMOVED: ${deleted}
╚══════════════╝`
      }, { quoted: msg });

    } catch (error) {
      console.error('CLEAN ERROR:', error);

      await sock.sendMessage(msg.key.remoteJid, {
        text: 'SYSTEM ERROR'
      }, { quoted: msg });
    }
  }
};