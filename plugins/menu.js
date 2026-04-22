const { getPlugins } = require('../handlers/plugins.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  status: "on",
  name: 'Fancy Commands',
  command: ['اوامر'],
  category: 'tools',
  description: 'قائمة جميع أوامر البوت بشكل احترافي',
  hidden: false,
  version: '5.3',

  async execute(sock, msg) {
    try {
      const zarfData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'zarf.json')));
      const plugins = getPlugins();

      // جمع الأوامر حسب الفئات
      const categories = {};
      Object.values(plugins).forEach(plugin => {
        if (plugin.hidden) return;
        const category = plugin.category || 'عام';
        const cmd = Array.isArray(plugin.command) ? plugin.command[0] : plugin.command;
        if (!categories[category]) categories[category] = [];

        const displayName = plugin.name && plugin.name !== cmd ? `${plugin.name} | ${cmd}` : `${cmd}`;
        categories[category].push(`➤ ${displayName}`);
      });

      const sortedCategories = Object.keys(categories);

      // بناء القائمة الجديدة VIP
      let menu = `
╭━━━〔 𝐖𝐀𝐋𝐓𝐄𝐑-𝐗 〕━━━╮
┃ الاسم     : WALTER-X
┃ الإصدار   : V3.0
┃ المطور    : ABOODI
┃ الحالة    : ACTIVE
┃ السرعة    : %speed%
┃ الأوامر   : %totalcmds%
╰━━━━━━━━━━━━━━━━╯

╭─❖ 「 SYSTEM INFO 」 ❖─╮
┃ بوت واتساب متعدد الوظائف
┃ إدارة قروبات + حماية + أدوات ذكية
┃ أداء سريع ومستقر
╰──────────────────╯
`;

      // إضافة الأقسام
      for (const cat of sortedCategories) {
        menu += `
╭─❖ 「 ${cat.toUpperCase()} 」 ❖─╮
${categories[cat].join('\n')}
╰──────────────╯
`;
      }

      menu += `
╭━━━〔 WALTER SYSTEM 〕━━━╮
┃ Control • Speed • Precision
┃ بوت احترافي بإدارة متقدمة
╰━━━━━━━━━━━━━━━━━━╯

┏━━━〔 ABOODI 〕━━━┓
`;

      // تحقق من إرسال صورة
      let sendOptions = { text: menu };

      if (zarfData.media?.status === 'on' && zarfData.media.image) {
        const imgPath = path.join(process.cwd(), zarfData.media.image);
        if (fs.existsSync(imgPath)) {
          sendOptions = { image: fs.readFileSync(imgPath), caption: menu };
        }
      }

      // إرسال القائمة
      await sock.sendMessage(msg.key.remoteJid, sendOptions, { quoted: msg });

    } catch (error) {
      console.error('Fancy Menu Error:', error);
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: 'حدث خطأ أثناء إنشاء القائمة.' },
        { quoted: msg }
      );
    }
  }
};