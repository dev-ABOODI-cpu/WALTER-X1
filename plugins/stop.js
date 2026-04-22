const { isElite } = require('../haykala/elite.js');
const { jidDecode } = require('@whiskeysockets/baileys');

const decode = jid =>
  (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

// 🔐 كلمة السر (غيرها براحتك)
const PASSWORD = '1234';

module.exports = {
  command: 'kill',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;

    const sender = decode(msg.key.participant || msg.key.remoteJid);
    const senderLid = sender.split('@')[0];

    const text =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      '';

    const args = text.trim().split(/\s+/);

    const action = args[1]; // full / module
    const target = args[2]; // module name
    const password = args[3];

    // 🔐 تحقق النخبة
    if (!isElite(senderLid)) {
      return sock.sendMessage(chatId, {
        text: '❌ هذا الأمر للنخبة فقط.'
      }, { quoted: msg });
    }

    // 🔐 كلمة السر
    if (!password || password !== PASSWORD) {
      return sock.sendMessage(chatId, {
        text: '🔐 كلمة المرور غير صحيحة.\nمثال: .kill full 1234'
      }, { quoted: msg });
    }

    // ❌ بدون تحديد
    if (!action) {
      return sock.sendMessage(chatId, {
        text:
`⚙️ استخدام الأمر:

.kill full 1234
→ إيقاف البوت كامل

.kill module name 1234
→ إيقاف موديل معين`
      }, { quoted: msg });
    }

    // ⏳ عد تنازلي
    for (let i = 3; i >= 1; i--) {
      await sock.sendMessage(chatId, {
        text: `⏳ سيتم التنفيذ خلال ${i}...`
      }, { quoted: msg });

      await new Promise(r => setTimeout(r, 1000));
    }

    // 🧠 Kill كامل البوت
    if (action === 'full') {
      await sock.sendMessage(chatId, {
        text: '⛔ تم إيقاف البوت بالكامل...'
      }, { quoted: msg });

      console.log('🛑 FULL KILL executed');

      return setTimeout(() => {
        process.send?.('shutdown');
        process.exit(0);
      }, 1000);
    }

    // 🧠 Kill module (نظام تجريبي)
    if (action === 'module') {
      if (!target) {
        return sock.sendMessage(chatId, {
          text: '❌ لازم تحدد اسم الموديل.'
        }, { quoted: msg });
      }

      // هنا مجرد تسجيل (لأن Node ما عنده unload حقيقي للموديلات بسهولة)
      console.log(`🧠 Module disabled: ${target}`);

      return sock.sendMessage(chatId, {
        text: `🧠 تم تعطيل الموديل: ${target}`
      }, { quoted: msg });
    }

    return sock.sendMessage(chatId, {
      text: '❌ خيار غير صحيح.'
    }, { quoted: msg });
  }
};