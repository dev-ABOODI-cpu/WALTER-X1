const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { eliteNumbers } = require('../haykala/elite.js');

// التحقق من النخبة
function isElite(sender) {
    return eliteNumbers.includes(sender.split('@')[0]);
}

module.exports = {
    command: 'topng',
    description: 'تحويل الملصق إلى صورة',

    async execute(sock, m) {
        const chatId = m.key.remoteJid;
        const sender = m.key.participant || m.participant || chatId;

        if (!isElite(sender)) {
            return sock.sendMessage(chatId, {
                text: '🚫 هذا الأمر مخصص للنخبة فقط!'
            }, { quoted: m });
        }

        try {
            const context = m.message?.extendedTextMessage?.contextInfo;

            const sticker =
                m.message?.stickerMessage ||
                context?.quotedMessage?.stickerMessage;

            if (!sticker) {
                return sock.sendMessage(chatId, {
                    text: '❌ أرسل أمرك مع ملصق أو قم بالرد على ملصق!'
                }, { quoted: m });
            }

            // تحميل الملصق
            const stream = await downloadContentFromMessage(sticker, 'sticker');

            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            if (!buffer.length) {
                return sock.sendMessage(chatId, {
                    text: '❌ فشل تحميل الملصق!'
                }, { quoted: m });
            }

            await sock.sendMessage(chatId, {
                image: buffer,
                caption: '🖼️ تم تحويل الملصق إلى صورة بنجاح.'
            }, { quoted: m });

        } catch (error) {
            console.error('❌ error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ حدث خطأ:\n${error.message || error.toString()}`
            }, { quoted: m });
        }
    }
};