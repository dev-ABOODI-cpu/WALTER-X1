const { isElite } = require('../haykala/elite.js');
const { jidDecode } = require('@whiskeysockets/baileys');
const fs = require('fs');
const { join } = require('path');
const fetch = require('node-fetch');

const decode = jid =>
  (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

// 🧠 تنظيف اسم الملف
const cleanName = (name) => name.replace(/[^\w\u0600-\u06FF\-]/g, '_');

module.exports = {
  command: 'نسخة',
  description: 'نظام نسخ ولصق وحذف المجموعات (Elite فقط)',
  usage: '.نسخة نسخ|لصق|حذف|حافظة [اسم]',

  async execute(sock, msg) {
    try {

      const groupJid = msg.key.remoteJid;
      const sender = decode(msg.key.participant || groupJid);
      const senderNum = sender.split('@')[0];

      // 📌 داخل جروب فقط
      if (!groupJid.endsWith('@g.us')) {
        return sock.sendMessage(groupJid, {
          text: '❗ هذا الأمر للمجموعات فقط'
        }, { quoted: msg });
      }

      // 🔐 نخبة فقط
      if (!isElite(senderNum)) {
        return sock.sendMessage(groupJid, {
          text: `╔══════════════╗
║ ACCESS DENIED ║
║ ELITE ONLY    ║
╚══════════════╝`
        }, { quoted: msg });
      }

      const body =
        msg.message?.extendedTextMessage?.text ||
        msg.message?.conversation ||
        '';

      const args = body.trim().split(/\s+/);
      const action = args[1]?.toLowerCase();
      const nameRaw = args.slice(2).join(' ').trim();
      const name = cleanName(nameRaw);

      const baseDir = join(process.cwd(), 'tmp', 'copy-group');

      // 📁 إنشاء مجلد أساسي
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }

      if (!action) {
        return sock.sendMessage(groupJid, {
          text: '❌ استخدم: .نسخة نسخ|لصق|حذف|حافظة'
        }, { quoted: msg });
      }

      // ===================== 📥 COPY =====================
      if (action === 'نسخ') {
        if (!name) {
          return sock.sendMessage(groupJid, {
            text: '❗ اكتب اسم النسخة'
          }, { quoted: msg });
        }

        const meta = await sock.groupMetadata(groupJid);

        const data = {
          subject: meta.subject,
          description: meta.desc || '',
          announce: meta.announce || false,
          restrict: meta.restrict || false,
          created: meta.creation,
          id: meta.id
        };

        const savePath = join(baseDir, name);
        fs.mkdirSync(savePath, { recursive: true });

        fs.writeFileSync(
          join(savePath, 'data.json'),
          JSON.stringify(data, null, 2)
        );

        // 📸 صورة المجموعة
        try {
          const pfp = await sock.profilePictureUrl(groupJid, 'image');
          const res = await fetch(pfp);
          const buffer = Buffer.from(await res.arrayBuffer());

          fs.writeFileSync(join(savePath, 'image.jpg'), buffer);
        } catch {}

        return sock.sendMessage(groupJid, {
          text: `╔══════════════╗
║ COPY SAVED   ║
║ ${name}      ║
╚══════════════╝`
        }, { quoted: msg });
      }

      // ===================== 📤 PASTE =====================
      if (action === 'لصق') {
        const dir = join(baseDir, name);
        const file = join(dir, 'data.json');

        if (!fs.existsSync(file)) {
          return sock.sendMessage(groupJid, {
            text: '❌ النسخة غير موجودة'
          }, { quoted: msg });
        }

        const data = JSON.parse(fs.readFileSync(file));

        await sock.groupUpdateSubject(groupJid, data.subject);
        await sock.groupUpdateDescription(groupJid, data.description);

        // ⚙️ إعدادات المجموعة
        try {
          await sock.groupSettingUpdate(
            groupJid,
            data.announce ? 'announcement' : 'not_announcement'
          );

          await sock.groupSettingUpdate(
            groupJid,
            data.restrict ? 'locked' : 'unlocked'
          );
        } catch {}

        // 📸 صورة
        const img = join(dir, 'image.jpg');
        if (fs.existsSync(img)) {
          await sock.updateProfilePicture(groupJid, {
            url: img
          });
        }

        return sock.sendMessage(groupJid, {
          text: `╔══════════════╗
║ PASTE DONE   ║
║ ${name}      ║
╚══════════════╝`
        }, { quoted: msg });
      }

      // ===================== 🗑 DELETE =====================
      if (action === 'حذف') {
        const dir = join(baseDir, name);

        if (!fs.existsSync(dir)) {
          return sock.sendMessage(groupJid, {
            text: '❌ النسخة غير موجودة'
          }, { quoted: msg });
        }

        fs.rmSync(dir, { recursive: true, force: true });

        return sock.sendMessage(groupJid, {
          text: `╔══════════════╗
║ DELETED      ║
║ ${name}      ║
╚══════════════╝`
        }, { quoted: msg });
      }

      // ===================== 📁 LIST =====================
      if (action === 'حافظة') {
        if (!fs.existsSync(baseDir)) {
          return sock.sendMessage(groupJid, {
            text: '❌ لا توجد نسخ'
          }, { quoted: msg });
        }

        const list = fs.readdirSync(baseDir);

        if (!list.length) {
          return sock.sendMessage(groupJid, {
            text: '❌ لا توجد نسخ'
          }, { quoted: msg });
        }

        let text = `╔══════════════╗
║ SAVED COPIES ║
╚══════════════╝\n\n`;

        list.forEach((n, i) => {
          text += `${i + 1}. ${n}\n`;
        });

        return sock.sendMessage(groupJid, { text }, { quoted: msg });
      }

      // ===================== DEFAULT =====================
      return sock.sendMessage(groupJid, {
        text: '❌ أمر غير معروف'
      }, { quoted: msg });

    } catch (err) {
      console.error(err);

      return sock.sendMessage(msg.key.remoteJid, {
        text: 'SYSTEM ERROR'
      }, { quoted: msg });
    }
  }
};