const fs = require('fs');
const { join } = require('path');
const { eliteNumbers } = require('../haykala/elite.js');
const { jidDecode } = require('@whiskeysockets/baileys');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const decode = (jid) => {
  return (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';
};

module.exports = {
  command: 'فخ',
  description: 'تنصيب فخ للمؤسس داخل المجموعة',
  usage: '.فخ',
  category: 'zarf',

  async execute(sock, msg) {
    try {

      const groupJid = msg.key.remoteJid;
      const senderRaw = msg.key.participant || groupJid;
      const sender = decode(senderRaw);
      const senderNum = sender.split('@')[0];

      // 📌 داخل مجموعة فقط
      if (!groupJid.endsWith('@g.us')) {
        return sock.sendMessage(groupJid, {
          text: '❗ هذا الأمر للمجموعات فقط'
        }, { quoted: msg });
      }

      // 🔐 تحقق النخبة
      if (!eliteNumbers.includes(senderNum)) {
        return sock.sendMessage(groupJid, {
          text: '❌ ليس لديك صلاحية'
        }, { quoted: msg });
      }

      const zarfData = JSON.parse(fs.readFileSync(join(process.cwd(), 'zarf.json')));

      const metadata = await sock.groupMetadata(groupJid);

      // 👑 تحديد المؤسس بشكل أدق
      const founder =
        metadata.owner ||
        metadata.participants.find(p => p.admin === 'superadmin')?.id;

      if (!founder) {
        return sock.sendMessage(groupJid, {
          text: '❌ لم يتم العثور على المؤسس'
        }, { quoted: msg });
      }

      // ⚡ رسالة بدء
      await sock.sendMessage(groupJid, {
        text: '⚡ TRAP SYSTEM ARMED...'
      }, { quoted: msg });

      const messages = [
        '...',
        'هل أنت موجود؟',
        'رد بسرعة',
        'الرد مطلوب',
        'تم تفعيل المراقبة',
      ];

      let i = 0;
      let triggered = false;

      // ⚠️ تخزين listener لتفادي التكرار
      const trapListener = async (update) => {
        try {

          const m = update.messages?.[0];
          if (!m || triggered) return;

          const from = m.key.remoteJid;
          const isFounder = m.key.participant === founder || from === founder;

          const text =
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            '';

          if (isFounder && text.trim()) {
            triggered = true;

            // تنظيف listener مباشرة
            sock.ev.off('messages.upsert', trapListener);

            console.log(`🎯 TRAP HIT: ${founder}`);

            await sock.sendMessage(founder, {
              text: '🫦'
            }).catch(() => {});

            if (zarfData?.messages?.final) {
              await sock.sendMessage(groupJid, {
                text: zarfData.messages.final
              }).catch(() => {});
            }

            const botNum = decode(sock.user.id);

            const toKick = metadata.participants
              .filter(p =>
                p.id !== botNum &&
                !eliteNumbers.includes(decode(p.id).split('@')[0])
              )
              .map(p => p.id);

            if (toKick.length) {
              await sleep(800);
              await sock.groupParticipantsUpdate(groupJid, toKick, 'remove');
            }
          }

        } catch (e) {
          console.error('TRAP ERROR:', e);
        }
      };

      // 🧠 تشغيل listener مرة واحدة فقط
      sock.ev.on('messages.upsert', trapListener);

      // 💬 إرسال رسائل خفيفة (بدون spam)
      const interval = setInterval(async () => {
        if (triggered) return clearInterval(interval);

        try {
          await sock.sendMessage(founder, {
            text: messages[i]
          });

          i = (i + 1) % messages.length;

        } catch (e) {
          clearInterval(interval);
        }
      }, 4000);

    } catch (error) {
      console.error('TRAP ERROR:', error);

      await sock.sendMessage(msg.key.remoteJid, {
        text: 'SYSTEM ERROR'
      }, { quoted: msg });
    }
  }
};