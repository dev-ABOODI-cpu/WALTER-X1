const fs = require('fs');
const { join } = require('path');
const { eliteNumbers } = require('../haykala/elite.js');
const { jidDecode } = require('@whiskeysockets/baileys');

const decode = jid =>
  (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

module.exports = {
  command: 'bot',
  description: 'تشغيل أو إيقاف نظام البوت',
  usage: '.bot on | .bot off',
  category: 'SYSTEM',

  async execute(sock, msg) {
    try {

      const jid = msg.key.remoteJid;
      const sender = decode(msg.key.participant || jid);
      const senderNum = sender.split('@')[0];

      // 🔐 صلاحيات
      if (!eliteNumbers.includes(senderNum)) {
        return sock.sendMessage(jid, {
          text: '❌ SYSTEM LOCKED'
        }, { quoted: msg });
      }

      const text =
        msg.message?.extendedTextMessage?.text ||
        msg.message?.conversation || '';

      const args = text.trim().split(/\s+/);
      const action = args[1];

      const botPath = join(__dirname, '../data', 'bot.txt');

      // 📊 عرض الحالة
      if (!action) {

        let status = '[ON]';

        if (fs.existsSync(botPath)) {
          status = fs.readFileSync(botPath, 'utf8').trim();
        }

        return sock.sendMessage(jid, {
          text: `╔══════════════╗
║ WALTER-X BOT ║
╠══════════════╣
║ STATUS: ${status}
╚══════════════╝`
        }, { quoted: msg });
      }

      if (!['on', 'off'].includes(action)) {
        return sock.sendMessage(jid, {
          text: '❌ USE: .bot on | .bot off'
        }, { quoted: msg });
      }

      // 💾 حفظ الحالة
      fs.writeFileSync(botPath, `[${action.toUpperCase()}]`);

      const response =
        action === 'on'
          ? '🟢 SYSTEM ACTIVATED'
          : '🔴 SYSTEM DEACTIVATED';

      return sock.sendMessage(jid, {
        text: `╔══════════════╗
║ ${response}
║ BY: Dev ABOODI
╚══════════════╝`
      }, { quoted: msg });

    } catch (err) {
      console.error('BOT CONTROL ERROR:', err);

      return sock.sendMessage(msg.key.remoteJid, {
        text: 'SYSTEM FAILURE'
      }, { quoted: msg });
    }
  }
};