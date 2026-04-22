const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

// أوقات الصلاة (ساعة ودقيقة)
const prayerSchedule = [
  { name: 'الفجر', hour: 5, minute: 15, decor: '🌅 ✦ 🌙' },
  { name: 'الظهر', hour: 12, minute: 30, decor: '☀️ ✦ 🕌' },
  { name: 'العصر', hour: 15, minute: 45, decor: '🌇 ✦ 🕊️' },
  { name: 'المغرب', hour: 18, minute: 20, decor: '🌆 ✦ 🕌' },
  { name: 'العشاء', hour: 19, minute: 45, decor: '🌌 ✦ 🌙' }
];

module.exports = {
  status: "on",
  name: 'Auto Prayer Reminder',
  command: [],
  category: 'tools',
  description: 'تذكير تلقائي بمواقيت الصلاة مع صورة مزخرفة ومنشن مخفي لجميع الأعضاء',
  hidden: true,
  version: '1.1',

  async execute(sock, msg) {
    try {
      const imagePath = path.join(process.cwd(), 'prayer.jpeg');

      const sendPrayerReminder = async (chatId, prayer) => {
        const chatInfo = await sock.groupMetadata(chatId); 
        const allMembers = chatInfo.participants.map(p => p.id); // منشن مخفي للجميع

        const prayerText =
`${prayer.decor} \`${prayer.name}\` ${prayer.decor}
✨ حان وقت الصلاة الآن ✨
⏳ اغتنم وقت الطاعات وابدأ صلاتك بخشوع
"من حافظ على صلاته، فقد حافظ على قلبه ونوره"`;

        await sock.sendMessage(chatId, {
          image: fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null,
          caption: prayerText,
          mentionedJid: allMembers
        });
      };

      // تحقق كل دقيقة
      cron.schedule('* * * * *', async () => {
        const now = new Date();
        for (const prayer of prayerSchedule) {
          if (now.getHours() === prayer.hour && now.getMinutes() === prayer.minute) {
            const chatId = msg.key.remoteJid;
            await sendPrayerReminder(chatId, prayer);
          }
        }
      });

      console.log('✅ Auto Prayer Reminder جاهز مع زخارف وفخامة لكل صلاة + منشن مخفي لكل الأعضاء');
    } catch (error) {
      console.error('❌ Auto Prayer Error:', error);
    }
  }
};