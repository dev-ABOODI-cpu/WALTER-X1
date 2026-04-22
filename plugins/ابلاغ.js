const { isElite } = require('../haykala/elite.js');

module.exports = {
    command: 'ابلاغ',
    description: 'إرسال بلاغات بعد للرد على رسالة.',
    category: 'tools',
    usage: '.ابلاغ [عدد بين 1 و200] (يجب الرد)',

    async execute(sock, msg) {
        const sender = msg.key.participant || msg.key.remoteJid;
        const senderNum = sender.split('@')[0];

        if (!isElite(senderNum)) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: '❌ هذا الأمر مخصص للنخبة فقط.'
            }, { quoted: msg });
        }

        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        const args = text.trim().split(/\s+/);
        const count = parseInt(args[1]) || 1;

        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const quotedMsg = ctxInfo?.quotedMessage;

        if (!ctxInfo || !ctxInfo.stanzaId || !ctxInfo.participant || !quotedMsg) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: '⚠️ يجب الرد على رسالة لاستخدام هذا الأمر.'
            }, { quoted: msg });
        }

        if (isNaN(count) || count < 1 || count > 200) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: '⚠️ الرجاء تحديد عدد صحيح بين 1 و200.\nمثال: `.ابلاغ 10`'
            }, { quoted: msg });
        }

        const quoted = {
            key: {
                remoteJid: msg.key.remoteJid,
                fromMe: false,
                id: ctxInfo.stanzaId,
                participant: ctxInfo.participant
            },
            message: quotedMsg
        };

        for (let i = 1; i <= count; i++) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `📣 تم الإبلاغ رقم ${i}...`,
            }, { quoted });

            await new Promise(r => setTimeout(r, 300)); // تخفيف الضغط على السيرفر
        }

        return sock.sendMessage(msg.key.remoteJid, {
            text: `✅ تم إرسال ${count} بلاغ وهمي.`,
        }, { quoted: msg });
    }
};