const fs = require('fs');
const path = require('path');
const { isElite } = require('../haykala/elite.js');
const { jidDecode } = require('@whiskeysockets/baileys');

const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

const warnings = {};
const activeGroups = new Set();

// 📁 بيانات الكلمات الممنوعة
const dataDir = path.join(__dirname, '..', 'data');
const filePath = path.join(dataDir, 'bannedWords.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify([]), 'utf8');

// 🔥 تحميل الكلمات مرة واحدة فقط (تحسين الأداء)
let bannedWords = JSON.parse(fs.readFileSync(filePath, 'utf8'));

fs.watchFile(filePath, () => {
  try {
    bannedWords = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log('🔄 تم تحديث قائمة الكلمات الممنوعة');
  } catch (e) {
    console.error('خطأ في تحديث الكلمات:', e.message);
  }
});

module.exports = {
  command: 'ربيهم',
  description: 'حذف الرسائل + طرد بعد 3 تحذيرات',

  async execute(sock, msg) {
    const groupJid = msg.key.remoteJid;
    const sender = decode(msg.key.participant || groupJid);
    const senderLid = sender.split('@')[0];

    if (!groupJid.endsWith('@g.us')) {
      return sock.sendMessage(groupJid, {
        text: '❗ هذا الأمر يعمل فقط داخل المجموعات.'
      }, { quoted: msg });
    }

    if (!isElite(senderLid)) {
      return sock.sendMessage(groupJid, {
        text: '❌ ليس لديك صلاحية لاستخدام هذا الأمر.'
      }, { quoted: msg });
    }

    if (activeGroups.has(groupJid)) {
      return sock.sendMessage(groupJid, {
        text: "✅ المراقبة مفعّلة بالفعل."
      }, { quoted: msg });
    }

    activeGroups.add(groupJid);

    await sock.sendMessage(groupJid, {
      text: '👁️‍🗨️ تم تفعيل نظام "ربيهم" بنجاح.'
    });

    // 🚨 تسجيل الحدث مرة واحدة فقط
    if (!sock._bannedListenerAdded) {
      sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const m of messages) {
          if (!m.message || m.key.fromMe) continue;

          const chat = m.key.remoteJid;
          if (!activeGroups.has(chat)) continue;

          const sender = m.key.participant || chat;

          const text =
            m.message.conversation ||
            m.message.extendedTextMessage?.text ||
            '';

          const cleanText = text.toLowerCase();

          const found = bannedWords.find(w =>
            cleanText.includes(w.toLowerCase())
          );

          if (found) {
            try {
              await sock.sendMessage(chat, {
                delete: {
                  remoteJid: chat,
                  fromMe: false,
                  id: m.key.id,
                  participant: sender
                }
              });

              warnings[sender] = (warnings[sender] || 0) + 1;

              if (warnings[sender] < 3) {
                await sock.sendMessage(chat, {
                  text: `⚠️ تحذير ${warnings[sender]}/3`
                });
              } else {
                await sock.groupParticipantsUpdate(chat, [sender], 'remove');
                await sock.sendMessage(chat, {
                  text: '🚫 تم طرد العضو بسبب تكرار المخالفات.'
                });

                delete warnings[sender];
              }

            } catch (err) {
              console.error('خطأ في الحذف:', err.message);
            }
          }
        }
      });

      sock._bannedListenerAdded = true;
    }
  }
};