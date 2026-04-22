const { extractPureNumber } = require('../haykala/elite');

module.exports = {
  command: 'بطاقة',
  category: 'tools',
  description: 'عرض بطاقة احترافية للمستخدم',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;

    try {
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        '';

      const parts = text.trim().split(/\s+/);

      const mentioned =
        msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;

      const replied =
        msg.message?.extendedTextMessage?.contextInfo?.participant;

      let target;

      if (mentioned?.length) {
        target = mentioned[0];
      } else if (replied) {
        target = replied;
      } else if (parts[1] && /^\d{5,}$/.test(parts[1])) {
        const num = extractPureNumber(parts[1]);
        target = `${num}@s.whatsapp.net`;
      } else {
        target = msg.key.participant || msg.key.remoteJid;
      }

      // 🧠 استخراج الرقم الخام
      const rawNumber = target.split('@')[0];

      // 🖼️ صورة البروفايل
      let pp;
      try {
        pp = await sock.profilePictureUrl(target, "image");
      } catch {
        pp = "https://i.ibb.co/7JQrJJx/avatar-contact.png";
      }

      // 🆔 UID (آخر 4 أرقام)
      
      const card = `
╭━━━〔 𝐔𝐒𝐄𝐑 𝐂𝐀𝐑𝐃 〕━━━╮
┃ 👤 الاسم : @${rawNumber}
┃ 🧠 الحالة : Active User
┃ ⚡ النوع : WhatsApp Member
┃ 👑 الرتبة : ${msg.key.fromMe ? "OWNER" : "USER"}
┃ 🧾 ID   : ${target}
╰━━━━━━━━━━━━━━━━━━╯

╭━━〔 𝐒𝐘𝐒𝐓𝐄𝐌 𝐒𝐓𝐀𝐓𝐔𝐒 〕━━╮
┃ 🔒 الأمان : Protected
┃ ⚙️ البوت : ONLINE
┃ 🧬 المحرك : Walter Core
╰━━━━━━━━━━━━━━━━━━╯
`.trim();

      return sock.sendMessage(chatId, {
        image: { url: pp },
        caption: card,
        mentions: [target]
      }, { quoted: msg });

    } catch (err) {
      console.error(err);

      return sock.sendMessage(chatId, {
        text: '❌ حدث خطأ أثناء إنشاء البطاقة.'
      }, { quoted: msg });
    }
  }
};