const { jidDecode } = require('@whiskeysockets/baileys');

const decode = jid =>
  (jidDecode(jid)?.user || jid?.split('@')[0]) + '@s.whatsapp.net';

module.exports = {
    command: ['lid'],
    description: 'Get user ID',
    category: 'CONTROL',
    usage: '.lid [منشن | رقم | رد]',

    async execute(sock, msg, args) {
        try {

            const chat = msg.key.remoteJid;

            const sender =
                msg.key.participant ||
                msg.key.remoteJid;

            const context = msg.message?.extendedTextMessage?.contextInfo || {};

            let target;

            // 1) منشن
            if (Array.isArray(context.mentionedJid) && context.mentionedJid.length) {
                target = context.mentionedJid[0];

            // 2) رد
            } else if (context.participant) {
                target = context.participant;

            // 3) رقم مباشر
            } else if (args?.[0]) {
                const num = args[0].replace(/\D/g, '');
                if (!num) {
                    return sock.sendMessage(chat, {
                        text: '❌ رقم غير صالح'
                    }, { quoted: msg });
                }
                target = `${num}@s.whatsapp.net`;

            // 4) افتراضي (المرسل)
            } else {
                target = sender;
            }

            const number = target.split('@')[0];

            const output =
`╭━━━〔 𝐋𝐈𝐃 𝐒𝐘𝐒𝐓𝐄𝐌 〕━━━╮
┃ 🧠 USER ID
┃ 📱 NUMBER : ${number}
╰━━━━━━━━━━━━━━━━╯`;

            await sock.sendMessage(chat, {
                text: output,
                quoted: msg
            });

        } catch (err) {
            console.error('LID ERROR:', err);

            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ SYSTEM ERROR'
            }, { quoted: msg });
        }
    }
};