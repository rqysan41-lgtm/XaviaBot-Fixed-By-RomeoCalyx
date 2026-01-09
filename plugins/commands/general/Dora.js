module.exports.config = {
  name: "دورا",
  aliases: ["ai", "gpt"],
  version: "1.0.0",
  author: "محمد",
  role: 0,
  description: "ذكاء اصطناعي دردشة",
  usage: "دورا [سؤالك]",
  cooldowns: 0
};

const axios = require("axios");

// تخزين المحادثات
const conversations = new Map();

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID } = event;
  const question = args.join(" ").trim();

  // أمر مسح المحادثة
  if (question === "مسح" || question === "reset") {
    conversations.delete(senderID);
    return api.sendMessage(
      "◈ ──『 ❀ دورا ❀ 』── ◈\n❁┊✅ تم مسح المحادثة\n◈ ──────────── ◈",
      threadID
    );
  }

  if (!question) {
    return api.sendMessage(
      "◈ ──『 ❀ دورا ❀ 』── ◈\n❁┊⚠️ اكتب سؤالك\n◈ ──────────── ◈",
      threadID
    );
  }

  try {
    if (!conversations.has(senderID)) conversations.set(senderID, []);
    const history = conversations.get(senderID);

    history.push({ role: "user", content: question });
    if (history.length > 20) history.splice(0, history.length - 20);

    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);

    let formData = "";
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="chat_style"\r\n\r\nchat\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="chatHistory"\r\n\r\n${JSON.stringify(history)}\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="model"\r\n\r\nstandard\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="enabled_tools"\r\n\r\n[]\r\n`;
    formData += `--${boundary}--\r\n`;

    const res = await axios({
      method: "POST",
      url: "https://api.deepai.org/hacking_is_a_serious_crime",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
        "origin": "https://deepai.org",
        "user-agent": "Mozilla/5.0"
      },
      data: formData
    });

    let reply = "لم أستطع فهم الرد.";

    if (res.data) {
      if (typeof res.data === "string") reply = res.data;
      else if (res.data.output) reply = res.data.output;
      else if (res.data.text) reply = res.data.text;
    }

    reply = reply
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .trim();

    if (reply.length > 2000) reply = reply.slice(0, 1997) + "...";

    history.push({ role: "assistant", content: reply });

    api.sendMessage(
      `◈ ──『 ❀ دورا ❀ 』── ◈\n❁┊🤖 الرد:\n\n${reply}\n\n◈ ──────────── ◈`,
      threadID,
      (err, info) => {
        if (!err) {
          global.client.handleReply.push({
            name: "دورا",
            messageID: info.messageID,
            author: senderID
          });
        }
      }
    );

  } catch (e) {
    console.log("DORA ERROR:", e.message);
    api.sendMessage(
      "◈ ──『 ❀ دورا ❀ 』── ◈\n❁┊❌ حدث خطأ أثناء المعالجة\n◈ ──────────── ◈",
      threadID
    );
  }
};

// الرد المتواصل
module.exports.handleReply = async function ({ api, event, handleReply }) {
  if (event.senderID !== handleReply.author) return;

  const question = event.body?.trim();
  if (!question) return;

  try {
    if (!conversations.has(event.senderID))
      conversations.set(event.senderID, []);

    const history = conversations.get(event.senderID);

    history.push({ role: "user", content: question });
    if (history.length > 20) history.splice(0, history.length - 20);

    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);

    let formData = "";
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="chat_style"\r\n\r\nchat\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="chatHistory"\r\n\r\n${JSON.stringify(history)}\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="model"\r\n\r\nstandard\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="enabled_tools"\r\n\r\n[]\r\n`;
    formData += `--${boundary}--\r\n`;

    const res = await axios({
      method: "POST",
      url: "https://api.deepai.org/hacking_is_a_serious_crime",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
        "origin": "https://deepai.org",
        "user-agent": "Mozilla/5.0"
      },
      data: formData
    });

    let reply = "لم أستطع فهم الرد.";

    if (res.data) {
      if (typeof res.data === "string") reply = res.data;
      else if (res.data.output) reply = res.data.output;
      else if (res.data.text) reply = res.data.text;
    }

    reply = reply
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .trim();

    if (reply.length > 2000) reply = reply.slice(0, 1997) + "...";

    history.push({ role: "assistant", content: reply });

    api.sendMessage(
      `◈ ──『 ❀ دورا ❀ 』── ◈\n❁┊🤖 الرد:\n\n${reply}\n\n◈ ──────────── ◈`,
      event.threadID,
      (err, info) => {
        if (!err) {
          global.client.handleReply.push({
            name: "دورا",
            messageID: info.messageID,
            author: event.senderID
          });
        }
      }
    );

  } catch (e) {
    console.log("DORA REPLY ERROR:", e.message);
    api.sendMessage(
      "◈ ──『 ❀ دورا ❀ 』── ◈\n❁┊❌ حدث خطأ أثناء المعالجة\n◈ ──────────── ◈",
      event.threadID
    );
  }
};
