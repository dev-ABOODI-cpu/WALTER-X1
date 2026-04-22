module.exports = {
  command: 'تعريف',
  category: 'SYSTEM',
  description: 'عرض معلومات البوت والمطور',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;

    // 🔥 صورة التعريف (رابط مباشر)
    const imageUrl = "https://i.postimg.cc/x1JCPHwC/2dfc23ad39e7c072b3eaf820253b8caa.jpg";

    // 👑 المطور
    const developerNumber = '249112727808';
    const developerJid = `${developerNumber}@s.whatsapp.net`;

    const text =
`╭━〔 ABOUT SYSTEM 〕━╮
┃
┃ 👑 المطور : @${developerNumber}
┃ 🤖 البوت : WALTER-X
┃ ⚙️ الإصدار : V3.0.0
┃ 📅 السنوات : 2024 - 2026 ©
┃
┃ 💡 بوت واتساب متعدد الوظائف
┃ ⚡ إدارة • أدوات • ألعاب • ترفيه
┃
┃ ─────────────
┃ “الكود ليس مجرد أوامر،
┃ بل فكرة تتحول لواقع”
╰━━━━━━━━━━━━━━╯`;

    try {
      return await sock.sendMessage(chatId, {
        image: { url: imageUrl },
        caption: text,
        mentions: [developerJid]
      }, { quoted: msg });

    } catch (err) {
      console.error(err);

      return await sock.sendMessage(chatId, {
        text: '❌ حدث خطأ أثناء عرض التعريف'
      }, { quoted: msg });
    }
  }
};