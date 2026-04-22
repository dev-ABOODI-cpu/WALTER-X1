const { jidDecode } = require('@whiskeysockets/baileys');
const { isElite } = require('../haykala/elite.js');

const decode = jid =>
  (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

module.exports = {
  command: 'نسخ',
  description: 'نسخ جهات اتصال أعضاء المجموعة',
  usage: '.نسخ',

  async execute(sock, msg) {
    try {

      const groupJid = msg.key.remoteJid;
      const sender = decode(msg.key.participant || groupJid);
      const senderNum = sender.split('@')[0];

      // 📌 داخل مجموعة فقط
      if (!groupJid.endsWith('@g.us')) {
        return sock.sendMessage(groupJid, {
          text: '❌ هذا الأمر للمجموعات فقط'
        }, { quoted: msg });
      }

      // 🔐 نخبة فقط
      if (!isElite(senderNum)) {
        return sock.sendMessage(groupJid, {
          text: '❌ ليس لديك صلاحية'
        }, { quoted: msg });
      }

      const meta = await sock.groupMetadata(groupJid);

      const groupName = meta.subject || 'GROUP';

      // 🧠 استخراج اسم نظيف
      const cleanName = groupName
        .replace(/[^\w\u0600-\u06FF\s]/g, '')
        .split(' ')[0] || 'Group';

      const participants = meta.participants || [];

      if (!participants.length) {
        return sock.sendMessage(groupJid, {
          text: '❌ لا يوجد أعضاء'
        }, { quoted: msg });
      }

      await sock.sendMessage(groupJid, {
        text: '⏳ BACKUP STARTING...'
      }, { quoted: msg });

      let batch = [];
      let count = 1;

      for (const p of participants) {

        const phone = p.id.split('@')[0];

        const name = `${cleanName}_${count}`;

        batch.push({
          displayName: name,
          vcard:
`BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL;TYPE=CELL;waid=${phone}:+${phone}
END:VCARD`
        });

        count++;

        // 📦 إرسال دفعة كل 50
        if (batch.length === 50) {
          await sock.sendMessage(groupJid, {
            contacts: {
              displayName: 'GROUP BACKUP',
              contacts: batch
            }
          }, { quoted: msg });

          batch = [];
          await new Promise(r => setTimeout(r, 800));
        }
      }

      // 📦 إرسال الباقي
      if (batch.length) {
        await sock.sendMessage(groupJid, {
          contacts: {
            displayName: 'GROUP BACKUP',
            contacts: batch
          }
        }, { quoted: msg });
      }

      // 💀 نهاية العملية
      await sock.sendMessage(groupJid, {
        text: `╔══════════════╗
║ BACKUP DONE  ║
║ ${participants.length} USERS ║
╚══════════════╝`
      }, { quoted: msg });

    } catch (err) {
      console.error(err);

      await sock.sendMessage(msg.key.remoteJid, {
        text: 'SYSTEM ERROR'
      }, { quoted: msg });
    }
  }
};