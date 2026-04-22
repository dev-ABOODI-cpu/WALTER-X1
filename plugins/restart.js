const { isElite } = require('../haykala/elite');
const { jidDecode } = require('@whiskeysockets/baileys');
const chalk = require('chalk');

const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

module.exports = {
  command: 'ريستارت',
  description: 'إعادة تشغيل البوت (آمن للنخبة فقط)',
  category: 'SYSTEM',
  
  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;
    const sender = decode(msg.key.participant || msg.participant || chatId);
    const senderNum = sender.split('@')[0];

    if (!(await isElite(senderNum))) {
      return sock.sendMessage(chatId, {
        text: '🚫 هذا الأمر للنخبة فقط.'
      }, { quoted: msg });
    }

    await sock.sendMessage(chatId, {
      text: '🔄 جاري إعادة تشغيل البوت...'
    }, { quoted: msg });

    console.log(
      chalk.bgYellow.black('[ SYSTEM ]'),
      'Restart triggered by:',
      senderNum
    );

    setTimeout(() => {
      // لو تستخدم PM2
      if (process.send) {
        process.send('restart');
      }

      // fallback آمن
      process.exit(0);
    }, 1500);
  }
};