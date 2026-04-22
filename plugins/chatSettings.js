const { isElite } = require('../haykala/elite.js');
const { jidDecode } = require('@whiskeysockets/baileys');

const decode = jid =>
  (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

module.exports = {
  command: 'شات',
  description: 'فتح أو قفل الشات في المجموعة',
  usage: '.شات فتح | .شات قفل',

  async execute(sock, msg) {
    try {

      const groupJid = msg.key.remoteJid;
      const sender = decode(msg.key.participant || groupJid);
      const senderNum = sender.split('@')[0];

      if (!groupJid.endsWith('@g.us')) {
        return sock.sendMessage(groupJid, {
          text: '❌ هذا الأمر للمجموعات فقط'
        }, { quoted: msg });
      }

      if (!isElite(senderNum)) {
        return sock.sendMessage(groupJid, {
          text: '❌ ليس لديك صلاحية'
        }, { quoted: msg });
      }

      const text =
        msg.message?.extendedTextMessage?.text ||
        msg.message?.conversation || '';

      const args = text.trim().split(/\s+/);
      const action = args[1];

      if (!action) {
        return sock.sendMessage(groupJid, {
          text: '❌ الاستخدام:\n.شات فتح\n.شات قفل'
        }, { quoted: msg });
      }

      let statusText = '';

      if (action === 'فتح') {

        await sock.groupSettingUpdate(groupJid, 'not_announcement');
        statusText = '🟢 CHAT OPENED';

      } else if (action === 'قفل') {

        await sock.groupSettingUpdate(groupJid, 'announcement');
        statusText = '🔴 CHAT CLOSED';

      } else {
        return sock.sendMessage(groupJid, {
          text: '❌ خيار غير معروف'
        }, { quoted: msg });
      }

      // 💀 رد احترافي
      return sock.sendMessage(groupJid, {
        text: `╔══════════════╗
║ WALTER-X SYS ║
╠══════════════╣
║ STATUS: ${statusText}
║ BY: Dev ABOODI
╚══════════════╝`
      }, { quoted: msg });

    } catch (err) {
      console.error('CHAT ERROR:', err);

      return sock.sendMessage(msg.key.remoteJid, {
        text: 'SYSTEM FAILURE'
      }, { quoted: msg });
    }
  }
};