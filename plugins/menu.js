const { getPlugins } = require('../handlers/plugins.js');

module.exports = {
  status: "on",
  name: 'Bot Commands',
  command: ['اوامر'],
  category: 'tools',
  description: 'عرض أوامر البوت بتصنيف احترافي',
  hidden: false,
  version: '3.0',

  async execute(sock, msg) {
    try {

      const plugins = getPlugins();
      const user = msg.key.participant || msg.key.remoteJid;

      const categories = {
        control: [],
        system: [],
        general: [],
        fun: [],
        tools: [],
        admin: []
      };

      Object.values(plugins).forEach((p) => {
        if (p.hidden) return;

        const cmd = Array.isArray(p.command)
          ? p.command.join(' | ')
          : p.command;

        const cat = (p.category || 'general').toLowerCase();
        if (!categories[cat]) categories[cat] = [];

        categories[cat].push(cmd);
      });

      const totalCommands = Object.values(categories)
        .reduce((a, b) => a + b.length, 0);

      let menu = `
╭━━━〔 𝐖𝐀𝐋𝐓𝐄𝐑-𝐗 〕━━━╮
┃ 🧠 الاسم     : WALTER-X
┃ ⚙️ الإصدار   : V3.0
┃ 👑 المطور    : Dev ABOODI
┃ ⚡ الحالة    : ACTIVE
┃ 📊 الأوامر   : ${totalCommands}
╰━━━━━━━━━━━━━━━━╯
`;

      const renderCat = (title, list, icon) => {
        menu += `
╭─❖ 「 ${icon} ${title} (${list.length}) 」 ❖─╮
${list.length ? list.map(c => `┃ ➤ ${c}`).join('\n') : '┃ لا يوجد'}
╰──────────────╯
`;
      };

      renderCat('CONTROL', categories.control, '💀');
      renderCat('SYSTEM', categories.system, '🧠');
      renderCat('GENERAL', categories.general, '⚔️');
      renderCat('FUN', categories.fun, '🎭');
      renderCat('TOOLS', categories.tools, '🛠️');
      renderCat('ADMIN', categories.admin, '👑');

      menu += `
╭━━━〔 𝐖𝐀𝐋𝐓𝐄𝐑 𝐒𝐘𝐒𝐓𝐄𝐌 〕━━━╮
┃ 💣 Control. Speed. Precision.
╰━━━━━━━━━━━━━━━━━━╯
`;

      // 🔥 الصورة من رابط مباشر (Img/Postimage)
      const imageUrl = "https://i.postimg.cc/jSzcCWMz/IMG-20260422-WA0007.jpg";

      return await sock.sendMessage(msg.key.remoteJid, {
        image: { url: imageUrl },
        caption: menu,
        mentions: [user]
      }, { quoted: msg });

    } catch (err) {
      console.error(err);

      await sock.sendMessage(msg.key.remoteJid, {
        text: 'SYSTEM ERROR'
      }, { quoted: msg });
    }
  }
};