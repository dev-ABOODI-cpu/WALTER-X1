module.exports = {
  command: 'زخرف',
  description: 'يزخرف النص بأشكال جميلة (عربي + إنجليزي)',
  usage: '.زخرف [النص]',

  async execute(sock, msg) {
    try {
      const chatId = msg.key.remoteJid;

      const body =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        '';

      const text = body.replace('.زخرف', '').trim();

      if (!text) {
        return sock.sendMessage(chatId, {
          text: `❌ اكتب النص بعد الأمر\nمثال: .زخرف hello او مرحبا`
        }, { quoted: msg });
      }

      // English styles
      const bold = {
        a:'𝐚',b:'𝐛',c:'𝐜',d:'𝐝',e:'𝐞',f:'𝐟',g:'𝐠',h:'𝐡',i:'𝐢',
        j:'𝐣',k:'𝐤',l:'𝐥',m:'𝐦',n:'𝐧',o:'𝐨',p:'𝐩',q:'𝐪',r:'𝐫',
        s:'𝐬',t:'𝐭',u:'𝐮',v:'𝐯',w:'𝐰',x:'𝐱',y:'𝐲',z:'𝐳'
      };

      const fancy = {
        a:'𝒶',b:'𝒷',c:'𝒸',d:'𝒹',e:'𝑒',f:'𝒻',g:'𝒼',h:'𝒽',i:'𝒾',
        j:'𝒿',k:'𝓀',l:'𝓁',m:'𝓂',n:'𝓃',o:'𝑜',p:'𝓅',q:'𝓆',r:'𝓇',
        s:'𝓈',t:'𝓉',u:'𝓊',v:'𝓋',w:'𝓌',x:'𝓍',y:'𝓎',z:'𝓏'
      };

      const mono = {
        a:'𝚊',b:'𝚋',c:'𝚌',d:'𝚍',e:'𝚎',f:'𝚏',g:'𝚐',h:'𝚑',i:'𝚒',
        j:'𝚓',k:'𝚔',l:'𝚕',m:'𝚖',n:'𝚗',o:'𝚘',p:'𝚙',q:'𝚚',r:'𝚛',
        s:'𝚜',t:'𝚝',u:'𝚞',v:'𝚟',w:'𝚠',x:'𝚡',y:'𝚢',z:'𝚣'
      };

      // Arabic simple beautifier
      const arabicStyle = (t) => {
        const map = {
          "ا":"آ","ب":"بّ","ت":"تّ","ث":"ثّ","ج":"جّ","ح":"حّ",
          "خ":"خّ","د":"دّ","ر":"رّ","س":"سّ","ص":"صّ","ط":"طّ",
          "ع":"عّ","غ":"غّ","ف":"فّ","ق":"قّ","ك":"كّ","ل":"لّ",
          "م":"مّ","ن":"نّ","ه":"هّ","و":"وّ","ي":"يّ"
        };
        return t.split('').map(c => map[c] || c).join('');
      };

      const lower = text.toLowerCase();

      const make = (style) =>
        lower.split('').map(c => style[c] || c).join('');

      const result =
`✨ زخرفة النص ✨

🔹 Bold:
${make(bold)}

🔹 Fancy:
${make(fancy)}

🔹 Mono:
${make(mono)}

🔹 Arabic:
${arabicStyle(text)}
`;

      await sock.sendMessage(chatId, {
        text: result
      }, { quoted: msg });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ حدث خطأ أثناء الزخرفة'
      }, { quoted: msg });
    }
  }
};