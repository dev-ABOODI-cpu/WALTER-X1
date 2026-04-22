const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
  command: 'تحميل',
  description: 'تحميل فيديو أو صوت من يوتيوب / تيك توك / إنستغرام',
  usage: '.تحميل فيديو|صوت [الرابط]',

  async execute(sock, msg, args) {
    try {

      const chatId = msg.key.remoteJid;

      // 📩 دعم كل أنواع الرسائل
      const text =
        msg.message?.extendedTextMessage?.text ||
        msg.message?.conversation ||
        '';

      if (!text.startsWith('.تحميل')) {
        return;
      }

      const parts = text.split(' ');
      const type = parts[1]?.toLowerCase();
      const url = parts.slice(2).join(' ').trim();

      if (!type || !url) {
        return sock.sendMessage(chatId, {
          text: `❌ الاستخدام:
.تحميل فيديو [رابط]
.تحميل صوت [رابط]`
        }, { quoted: msg });
      }

      if (!url.startsWith('http')) {
        return sock.sendMessage(chatId, {
          text: '❌ الرابط غير صالح'
        }, { quoted: msg });
      }

      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const id = Date.now();

      const videoFile = path.join(tempDir, `${id}.mp4`);
      const audioFile = path.join(tempDir, `${id}.mp3`);

      await sock.sendMessage(chatId, {
        text: '⏳ DOWNLOADING...'
      }, { quoted: msg });

      const cleanup = (file) => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      };

      // ================= VIDEO =================
      if (type === 'فيديو') {

        exec(`yt-dlp -f mp4 -o "${videoFile}" "${url}"`, async (err) => {

          if (err || !fs.existsSync(videoFile)) {
            cleanup(videoFile);

            return sock.sendMessage(chatId, {
              text: '❌ فشل تحميل الفيديو'
            }, { quoted: msg });
          }

          try {
            await sock.sendMessage(chatId, {
              video: fs.readFileSync(videoFile),
              caption: `WALTER-X DOWNLOAD\nVIDEO READY`
            }, { quoted: msg });

          } catch (e) {
            console.error(e);
          } finally {
            cleanup(videoFile);
          }
        });

        return;
      }

      // ================= AUDIO =================
      if (type === 'صوت') {

        exec(`yt-dlp -x --audio-format mp3 -o "${audioFile}" "${url}"`, async (err) => {

          if (err || !fs.existsSync(audioFile)) {
            cleanup(audioFile);

            return sock.sendMessage(chatId, {
              text: '❌ فشل تحميل الصوت'
            }, { quoted: msg });
          }

          try {
            await sock.sendMessage(chatId, {
              audio: fs.readFileSync(audioFile),
              mimetype: 'audio/mpeg'
            }, { quoted: msg });

          } catch (e) {
            console.error(e);
          } finally {
            cleanup(audioFile);
          }
        });

        return;
      }

      // ================= INVALID TYPE =================
      return sock.sendMessage(chatId, {
        text: '❌ اختر: فيديو أو صوت'
      }, { quoted: msg });

    } catch (err) {
      console.error('DOWNLOAD ERROR:', err);

      await sock.sendMessage(msg.key.remoteJid, {
        text: 'SYSTEM ERROR'
      }, { quoted: msg });
    }
  }
};