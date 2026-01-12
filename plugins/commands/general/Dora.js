export const config = {
  name: "ساكورا",
  permissions: [0],
  cooldown: 3,
  credits: "محمد",
  extra: {
    hide: false,
    usage: "ساكورا [سؤالك]"
  },
  aliases: ["ai", "gpt"],
  description: "ذكاء اصطناعي"
};

const conversations = new Map();

export async function onCall({ message, args, getLang }) {
  const axios = (await import("axios")).default;
  const userId = message.senderID;
  const question = args.join(" ").trim();
  
  if (question === "مسح" || question === "reset") {
    conversations.delete(userId);
    return message.reply("◈ 『 ❀ ساكورا ❀ 』 ◈\n❁┊✅ تم مسح المحادثة\n◈  ◈");
  }
  
  if (!question) {
    return message.reply("◈ 『 ❀ ساكورا ❀ 』 ◈\n❁┊يا عثل عايز شنو •-•؟ \n◈  ◈");
  }

  try {
    if (!conversations.has(userId)) {
      conversations.set(userId, []);
    }
    
    const history = conversations.get(userId);
    
    history.push({
      role: "user",
      content: question
    });
    
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    
    let formData = "";
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="chat_style"\r\n\r\nchat\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="chatHistory"\r\n\r\n${JSON.stringify(history)}\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="model"\r\n\r\nstandard\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="hacker_is_stinky"\r\n\r\nvery_stinky\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="enabled_tools"\r\n\r\n[]\r\n`;
    formData += `--${boundary}--\r\n`;

    const response = await axios({
      method: "POST",
      url: "https://api.deepai.org/hacking_is_a_serious_crime",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
        "origin": "https://deepai.org",
        "user-agent": "Mozilla/5.0"
      },
      data: formData
    });

    let reply = "";
    
    if (response.data) {
      if (typeof response.data === "string") {
        reply = response.data;
      } else if (response.data.output) {
        reply = response.data.output;
      } else if (response.data.text) {
        reply = response.data.text;
      }
    }

    reply = reply
      .replace(/\\n/g, "\n")
      .replace(/\\u0021/g, "!")
      .replace(/\\"/g, '"')
      .trim();
    
    if (reply.length > 2000) {
      reply = reply.substring(0, 1997) + "...";
    }

    history.push({
      role: "assistant",
      content: reply
    });

    const sent = await message.reply(`◈  ❀ ساكورا ❀ ◈\n❁┊ الرد:\n\n${reply}\n\n◈ ──────────── ◈`);
    
    if (sent && sent.messageID) {
      sent.addReplyEvent({
        callback: async ({ message: replyMessage }) => {
          await handleContinue(replyMessage, userId);
        }
      }, 300000); // 5 دقائق
    }

  } catch (error) {
    console.error("خطأ:", error.message);
    message.reply("◈ 『 ❀ ساكورا ❀ 』 ◈\n❁┊❌ حدث خطأ\n◈   ◈");
  }
}

async function handleContinue(message, userId) {
  const axios = (await import("axios")).default;
  const question = message.body.trim();
  
  if (!question) return;

  try {
    if (!conversations.has(userId)) {
      conversations.set(userId, []);
    }
    
    const history = conversations.get(userId);
    
    history.push({
      role: "user",
      content: question
    });
    
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    
    let formData = "";
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="chat_style"\r\n\r\nchat\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="chatHistory"\r\n\r\n${JSON.stringify(history)}\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="model"\r\n\r\nstandard\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="hacker_is_stinky"\r\n\r\nvery_stinky\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="enabled_tools"\r\n\r\n[]\r\n`;
    formData += `--${boundary}--\r\n`;

    const response = await axios({
      method: "POST",
      url: "https://api.deepai.org/hacking_is_a_serious_crime",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
        "origin": "https://deepai.org",
        "user-agent": "Mozilla/5.0"
      },
      data: formData
    });

    let reply = "";
    
    if (response.data) {
      if (typeof response.data === "string") {
        reply = response.data;
      } else if (response.data.output) {
        reply = response.data.output;
      } else if (response.data.text) {
        reply = response.data.text;
      }
    }

    reply = reply
      .replace(/\\n/g, "\n")
      .replace(/\\u0021/g, "!")
      .replace(/\\"/g, '"')
      .trim();
    
    if (reply.length > 2000) {
      reply = reply.substring(0, 1997) + "...";
    }

    history.push({
      role: "assistant",
      content: reply
    });

    const sent = await message.reply(`◈ 『 ❀ ساكورا ❀ 』 ◈\n❁┊ الرد:\n\n${reply}\n\n◈  ◈`);
    
    if (sent && sent.messageID) {
      sent.addReplyEvent({
        callback: async ({ message: replyMessage }) => {
          await handleContinue(replyMessage, userId);
        }
      }, 300000); // 5 دقائق
    }

  } catch (error) {
    console.error("خطأ:", error.message);
    message.reply("◈ 『 ❀ ساكورا ❀ 』 ◈\n❁┊❌ حدث خطأ\n◈  ◈");
  }
                         }
