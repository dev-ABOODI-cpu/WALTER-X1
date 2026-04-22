const fs = require('fs');
const path = require('path');
const { isElite } = require('../haykala/elite.js');

const dataDir = path.join(__dirname, '..', 'data');
const muteFilePath = path.join(dataDir, 'muted.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(muteFilePath)) fs.writeFileSync(muteFilePath, JSON.stringify([]));

let mutedCache = new Set(loadMuted());
let listenerRegistered = false;

// تحميل
function loadMuted() {
  try {
    return JSON.parse(fs.readFileSync(muteFilePath));
  } catch {
    return [];
  }
}

// حفظ + تحديث كاش
function saveMuted(data) {
  fs.writeFileSync(muteFilePath, JSON.stringify(data, null, 2));
  mutedCache = new Set(data);
}

// تسجيل المراقب مرة واحدة فقط
function registerWatcher(sock) {
  if (listenerRegistered) return;

  listenerRegistered = true;

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      const sender = msg.key.participant || msg.key.remoteJid;

      if (!mutedCache.has(sender)) continue;

      try {
        await sock.sendMessage(msg.key.remoteJid, {
          delete: {
            remoteJid: msg.key.remoteJid,
            fromMe: false,
            id: msg.key.id,
            participant: msg.key.participant
          }
        });
      } catch (e) {
        console.log('Mute delete error:', e.message);
      }
    }
  });
}

module.exports = {
  command: 'كتم',
  description: 'كتم أو إلغاء كتم عضو (للنخبة فقط)',

  async execute(sock, m) {
    const chatId = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;

    if (!isElite(sender)) return;

    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
    const args = text.trim().split(/\s+/).slice(1);
    const action = args[0];

    const context = m.message?.extendedTextMessage?.contextInfo;
    const target = context?.mentionedJid?.[0] || context?.participant;

    let muted = loadMuted();

    // حالة
    if (action === 'حالة') {
      if (!muted.length) {
        return sock.sendMessage(chatId, { text: 'ℹ️ لا يوجد مكتومين.' }, { quoted: m });
      }

      return sock.sendMessage(chatId, {
        text: muted.map(n => `- @${n.split('@')[0]}`).join('\n'),
        mentions: muted
      }, { quoted: m });
    }

    // حذف الكل
    if (action === 'تحرير') {
      muted = [];
      saveMuted(muted);
      listenerRegistered = false;

      return sock.sendMessage(chatId, {
        text: '✅ تم مسح جميع المكتومين.'
      }, { quoted: m });
    }

    // إلغاء كتم
    if (action === 'الغاء') {
      if (!target) {
        return sock.sendMessage(chatId, {
          text: '❌ لم يتم تحديد شخص.'
        }, { quoted: m });
      }

      muted = muted.filter(x => x !== target);
      saveMuted(muted);

      return sock.sendMessage(chatId, {
        text: '✅ تم فك الكتم.'
      }, { quoted: m });
    }

    // كتم جديد
    if (!target) {
      return sock.sendMessage(chatId, {
        text: '❌ استخدم منشن أو رد.'
      }, { quoted: m });
    }

    if (muted.includes(target)) {
      return sock.sendMessage(chatId, {
        text: 'ℹ️ الشخص مكتوم بالفعل.'
      }, { quoted: m });
    }

    muted.push(target);
    saveMuted(muted);

    registerWatcher(sock);

    return sock.sendMessage(chatId, {
      text: '🔇 تم كتم العضو.'
    }, { quoted: m });
  }
};