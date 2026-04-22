const fs = require('fs');
const path = require('path');

const controlPath = path.join(__dirname, '../control.json');

function getControl() {
  if (!fs.existsSync(controlPath)) {
    return {
      welcome: true,
      antilink: false,
      antispam: false,
      vipMode: false,
      vipCommands: []
    };
  }

  return JSON.parse(fs.readFileSync(controlPath, 'utf-8'));
}

module.exports = {
  command: 'تحكم',
  category: 'control',

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    const control = getControl();

    const text =
`╭━━━〔 ⚙️ CONTROL PANEL 〕━━━╮

👤 User: @${sender.split('@')[0]}

👋 Welcome   : ${control.welcome ? '🟢 ON' : '🔴 OFF'}
🚫 AntiLink  : ${control.antilink ? '🟢 ON' : '🔴 OFF'}
🛡 AntiSpam  : ${control.antispam ? '🟢 ON' : '🔴 OFF'}
🔒 VIP Mode  : ${control.vipMode ? '🟢 ON' : '🔴 OFF'}

📜 VIP Cmds  : ${control.vipCommands.length}

╰━━━━━━━━━━━━━━━━━━━━━━╯

👇 اختر التعديل`;

    const buttons = [
      { buttonId: 'ctl_welcome_on', buttonText: { displayText: '🟢 Welcome ON' }, type: 1 },
      { buttonId: 'ctl_welcome_off', buttonText: { displayText: '🔴 Welcome OFF' }, type: 1 },

      { buttonId: 'ctl_antilink_on', buttonText: { displayText: '🟢 AntiLink ON' }, type: 1 },
      { buttonId: 'ctl_antilink_off', buttonText: { displayText: '🔴 AntiLink OFF' }, type: 1 },

      { buttonId: 'ctl_vip_on', buttonText: { displayText: '🔒 VIP ON' }, type: 1 },
      { buttonId: 'ctl_vip_off', buttonText: { displayText: '🔓 VIP OFF' }, type: 1 }
    ];

    return sock.sendMessage(jid, {
      text,
      mentions: [sender],
      buttons,
      headerType: 1
    }, { quoted: msg });
  }
};