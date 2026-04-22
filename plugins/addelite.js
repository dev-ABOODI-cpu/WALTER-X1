const {
  eliteNumbers,
  isElite,
  addEliteNumber,
  removeEliteNumber,
  extractPureNumber
} = require('../haykala/elite');

module.exports = {
  command: 'نخبة',
  description: 'إدارة قائمة النخبة (WALTER-X)',
  usage: '.نخبة اضف | ازل | عرض',

  async execute(sock, msg) {
    try {

      const jid = msg.key.remoteJid;

      const sender = extractPureNumber(
        msg.key.participant || jid
      );

      // 🔐 صلاحية
      if (!isElite(sender)) {
        return sock.sendMessage(jid, {
          text: '❌ SYSTEM LOCKED'
        }, { quoted: msg });
      }

      const text =
        msg.message?.extendedTextMessage?.text ||
        msg.message?.conversation || '';

      const args = text.trim().split(/\s+/);
      const action = args[1];

      // 📊 عرض القائمة
      if (!action || action === 'عرض') {

        const list = eliteNumbers.length
          ? eliteNumbers.map((n, i) => `┃ ${i + 1}. ${n}`).join('\n')
          : '┃ لا يوجد أعضاء';

        return sock.sendMessage(jid, {
          text: `╔══════════════╗
║ ELITE SYSTEM ║
╠══════════════╣
${list}
╚══════════════╝`
        }, { quoted: msg });
      }

      // ❌ تحقق من العملية
      if (!['اضف', 'ازل'].includes(action)) {
        return sock.sendMessage(jid, {
          text: '❌ الاستخدام: .نخبة اضف | ازل | عرض'
        }, { quoted: msg });
      }

      // 🎯 تحديد الهدف
      let target =
        msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
        msg.message?.extendedTextMessage?.contextInfo?.participant ||
        (args[2] ? args[2].replace(/[^0-9]/g, '') : null);

      if (!target) {
        return sock.sendMessage(jid, {
          text: '❌ حدد شخص (منشن أو رد أو رقم)'
        }, { quoted: msg });
      }

      const number = extractPureNumber(target);

      // 🧠 حماية النظام
      if (number === sender) {
        return sock.sendMessage(jid, {
          text: '❌ لا يمكنك تعديل نفسك'
        }, { quoted: msg });
      }

      // ➕ إضافة
      if (action === 'اضف') {

        if (eliteNumbers.includes(number)) {
          return sock.sendMessage(jid, {
            text: `⚠️ ${number} موجود بالفعل`
          }, { quoted: msg });
        }

        addEliteNumber(number);

        return sock.sendMessage(jid, {
          text: `╔══════════════╗
║ ELITE ADDED  ║
╠══════════════╣
║ ${number}
╚══════════════╝`
        }, { quoted: msg });
      }

      // ➖ إزالة
      if (action === 'ازل') {

        if (!eliteNumbers.includes(number)) {
          return sock.sendMessage(jid, {
            text: `⚠️ غير موجود`
          }, { quoted: msg });
        }

        removeEliteNumber(number);

        return sock.sendMessage(jid, {
          text: `╔══════════════╗
║ ELITE REMOVED║
╠══════════════╣
║ ${number}
╚══════════════╝`
        }, { quoted: msg });
      }

    } catch (err) {
      console.error(err);

      return sock.sendMessage(msg.key.remoteJid, {
        text: 'SYSTEM ERROR'
      }, { quoted: msg });
    }
  }
};