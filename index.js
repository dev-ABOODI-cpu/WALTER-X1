const { fork } = require('child_process');
const { join } = require('path');
const fs = require('fs-extra');
const logger = require('./utils/console');

const maxRetries = 3;
const retryDelay = 5000;

let isRunning = false;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function handleConnection(retry = 0) {

    if (isRunning) return;
    isRunning = true;

    const connectionFolder = join(process.cwd(), 'ملف_الاتصال');

    if (!fs.existsSync(connectionFolder)) {
        logger.warn('⚠️ ملف الاتصال غير موجود، المتابعة بدون إعدادات إضافية...');
    }

    logger.info('🚀 بدء تشغيل البوت...');

    const child = fork(join(__dirname, 'main.js'), [], {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        env: {
            ...process.env,
            CONNECTION_FOLDER: connectionFolder
        }
    });

    let alive = false;

    child.on('message', (data) => {

        if (data === 'ready') {
            alive = true;
            logger.success('✅ البوت شغال بنجاح');
        }

        if (data === 'reset') {
            logger.warn('🔄 إعادة تشغيل بطلب داخلي...');
            child.kill();
            isRunning = false;
            setTimeout(() => handleConnection(0), 2000);
        }

        if (data === 'uptime') {
            child.send(process.uptime());
        }
    });

    child.on('exit', async (code) => {

        isRunning = false;

        if (code === 0) {
            logger.info('✅ تم إيقاف البوت بشكل طبيعي');
            return;
        }

        if (code === 429) {
            logger.warn('⚠️ Rate limit، انتظار...');
            await delay(10000);
            return handleConnection(retry);
        }

        if (retry < maxRetries) {
            logger.warn(`♻️ إعادة تشغيل (${retry + 1}/${maxRetries})`);
            await delay(retryDelay);
            return handleConnection(retry + 1);
        }

        logger.error('❌ فشل تشغيل البوت بعد محاولات كثيرة');
        process.exit(1);
    });

    child.on('error', async (err) => {
        isRunning = false;
        logger.error(`❌ Child error: ${err.message}`);

        if (retry < maxRetries) {
            await delay(retryDelay);
            return handleConnection(retry + 1);
        }
    });

    // safety watchdog
    setTimeout(() => {
        if (!alive) {
            logger.error('❌ البوت لم يرسل ready في الوقت المحدد');
            child.kill();
            isRunning = false;
            handleConnection(retry + 1);
        }
    }, 15000);
}

process.on('SIGINT', () => process.exit());

process.on('uncaughtException', (err) => {
    logger.error('❌ Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
    logger.error('❌ Unhandled Rejection:', reason);
});

logger.info('📦 بدء تشغيل النظام...');
handleConnection();