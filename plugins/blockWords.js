const fs = require('fs');
const path = require('path');
const { isElite } = require('../haykala/elite.js');

// 📁 المسار
const dataDir = path.join(__dirname, '..', 'data');
const filePath = path.join(dataDir, 'bannedWords.json');

// إنشاء الملفات لو مش موجودة
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify([]));

module.exports = {
  command: "حظر",
  description: "إضافة كلمة إلى قائمة الحظر",
  usage: ".حظر [كلمة]",
  category: 'CONTROL',
  async execute(sock, msg) {
    try {

      const jid = msg.key.remoteJid;
      const sender = msg.key.participant || jid;

      // 🔐 صلاحية
      if (!isElite(sender)) {
        return sock.sendMessage(jid, {
          text: '❌ SYSTEM LOCKED'
        }, { quoted: msg });
      }

      const text =
        msg.message?.extendedTextMessage?.text ||
        msg.message?.conversation || '';

      const word = text.replace('.حظر', '').trim().toLowerCase();

      if (!word) {
        return sock.sendMessage(jid, {
          text: '❌ اكتب الكلمة المراد حظرها'
        }, { quoted: msg });
      }

      let banned = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // 🧠 منع التكرار
      if (banned.includes(word)) {
        return sock.sendMessage(jid, {
          text: `⚠️ "${word}" موجودة بالفعل`
        }, { quoted: msg });
      }

      banned.push(word);

      fs.writeFileSync(filePath, JSON.stringify(banned, null, 2));

      return sock.sendMessage(jid, {
        text: `╔══════════════╗
║ WORD BANNED  ║
╠══════════════╣
║ ${word}
╚══════════════╝`
      }, { quoted: msg });

    } catch (err) {
      console.error(err);

      return sock.sendMessage(msg.key.remoteJid, {
        text: 'SYSTEM ERROR'
      }, { quoted: msg });
    }
  }
};