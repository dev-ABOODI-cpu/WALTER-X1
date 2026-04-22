const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const pino = require('pino');
const path = require('path');
const chalk = require('chalk');
const readline = require('readline');
const { exec } = require('child_process');
const logger = require('./utils/console');

const handler = require('./handlers/handler'); // ✅ load once
const elite = require('./haykala/elite');

const question = text => new Promise(resolve => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(text, answer => {
        rl.close();
        resolve(answer);
    });
});

// ================= WALTER X UI =================
const asciiArt = `
${chalk.hex('#FFD700')('██╗    ██╗ █████╗ ██╗     ████████╗███████╗██████╗     ██╗  ██╗')}
${chalk.hex('#FFD700')('██║    ██║██╔══██╗██║     ╚══██╔══╝██╔════╝██╔══██╗    ╚██╗██╔╝')}
${chalk.hex('#FFD700')('██║ █╗ ██║███████║██║        ██║   █████╗  ██████╔╝     ╚███╔╝ ')}
${chalk.hex('#FFD700')('██║███╗██║██╔══██║██║        ██║   ██╔══╝  ██╔══██╗     ██╔██╗ ')}
${chalk.hex('#FFD700')('╚███╔███╔╝██║  ██║███████╗   ██║   ███████╗██║  ██║    ██╔╝ ██╗')}
${chalk.hex('#FFD700')(' ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝    ╚═╝  ╚═╝')}
`;

async function startBot() {
    try {
        console.clear();
        console.log(asciiArt);
        console.log(chalk.hex('#FFD700').bold('\nWELCOME TO WALTER X SYSTEM\n'));
        console.log(chalk.hex('#FFD700')('Status: ONLINE | Version: V3.0 | Mode: ACTIVE\n'));

        const sessionDir = path.join(__dirname, 'ملف_الاتصال');
        await fs.ensureDir(sessionDir);

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            browser: ['MacOS', 'Chrome', '1.0.0'],
            logger: pino({ level: 'silent' }),
            markOnlineOnConnect: true
        });

        // ================= CONNECTION =================
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                logger.success('BOT CONNECTED');

                try {
                    const botNumber = sock.user.id.split(':')[0].replace(/[^0-9]/g, '');
                    const jid = `${botNumber}@s.whatsapp.net`;

                    const [info] = await sock.onWhatsApp(jid);

                    if (info?.lid) {
                        await elite.addEliteNumber(botNumber);
                        await elite.addEliteNumber(info.lid.replace(/[^0-9]/g, ''));
                    }

                    logger.info('Elite system loaded');
                    handler.handleMessagesLoader(sock);

                } catch (e) {
                    logger.error(e.message);
                }
            }

            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;

                if (reason === DisconnectReason.loggedOut) {
                    logger.error('Logged out');
                    process.exit(1);
                } else {
                    logger.warn('Reconnecting...');
                    setTimeout(startBot, 4000);
                }
            }
        });

        // ================= MESSAGES =================
        sock.ev.on('messages.upsert', async (m) => {
            try {
                await handler.handleMessages(sock, m);
            } catch (err) {
                logger.error(err.message);
            }
        });

        sock.ev.on('creds.update', saveCreds);

        // ================= PAIRING =================
        if (!sock.authState.creds.registered) {
            let phone = await question('Enter phone: ');
            phone = phone.replace(/[^0-9]/g, '');

            const code = await sock.requestPairingCode(phone);
            console.log('PAIRING CODE:', code);
        }

    } catch (err) {
        logger.error(err.message);
        setTimeout(startBot, 5000);
    }
}

startBot();