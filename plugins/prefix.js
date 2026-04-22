const fs = require('fs');
const path = require('path');
const { isElite } = require('../haykala/elite.js');

const prefixFile = path.join(__dirname, '../data/prefix.json');

module.exports = {
  command: 'بريفكس',
  category: 'SYSTEM',
  description: 'تغيير البريفكس (آمن)',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderNum = sender.split('@')[0];

    if (!isElite(senderNum)) {
      return sock.sendMessage(chatId, {
        text: '❌ هذا الأمر للنخبة فقط'
      }, { quoted: msg });
    }

    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const args = text.trim().split(/\s+/);

    const newPrefix = args[1];

    if (!newPrefix) {
      const current = fs.existsSync(prefixFile)
        ? fs.readFileSync(prefixFile, 'utf8')
        : '.';

      return sock.sendMessage(chatId, {
        text: `📌 البريفكس الحالي: ${current}`
      }, { quoted: msg });
    }

    const finalPrefix = newPrefix === 'فارغ' ? '' : newPrefix;

    fs.writeFileSync(prefixFile, finalPrefix);

    return sock.sendMessage(chatId, {
      text: `✅ تم تغيير البريفكس إلى: ${finalPrefix || 'فارغ'}`
    }, { quoted: msg });
  }
};