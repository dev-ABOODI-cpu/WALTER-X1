module.exports = {
    command: 'تست',
    description: 'اختبار البوت',
    usage: '.test',
    category: 'tools',

    async execute(sock, msg) {
        try {
            const chatId = msg.key.remoteJid;

            const sender =
                msg.key.participant ||
                msg.participant ||
                msg.key.remoteJid;

            const decoratedText = `𝐀𝐁𝐎𝐎𝐃𝐈 ﹗ 𝐈𝐒 𝐖𝐎𝐑𝐊𝐈𝐍𝐆 𝐍𝐎𝐖 ✅`;

            await sock.sendMessage(chatId, {
                text: decoratedText,
                mentions: [sender]
            }, { quoted: msg });

        } catch (error) {
            console.error('❌ Error executing test:', error);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ حدث خطأ:\n${error.message || error.toString()}`
            }, { quoted: msg });
        }
    }
};