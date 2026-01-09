module.exports.config = {
  name: "ساكورا ",
  Auth: 0,
  Class: "ذكاء اصطناعي",
  Owner: "محمد",
  Hide: false,
  How: "ساكورا  [سؤالك]",
  Multi: ["ai", "gpt"],
  Time: 0,
  Info: "ذكاء اصطناعي"
};

const axios = require("axios");
const conversations = new Map();

module.exports.onCall = async function ({ args, event, api, sh }) {
  const userId = event.senderID;
  const question = args.join(" ").trim();

  // مسح المحادثة
  if (question === "مسح" || question === "reset") {
    conversations.delete(userId);
    return sh.reply("◈ ──『 ❀ ساكورا ❀ 』── ◈\n❁┊✅ تم مسح المحادثة\n◈ ──────────── ◈");
  }

  if (!question) {
    return sh.reply("◈ ──『 ❀ ساكورا ❀ 』── ◈\n❁┊⚠️ اكتب سؤالك\n◈ ──────────── ◈");
  }

  try {
    if (!conversations.has(userId)) {
      conversations.set(userId, []);
    }

    const history = conversations.get(userId);

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

    let reply = "لم أستطع فهم الرد.";

    if (response.data) {
      if (typeof response.data === "string") reply = response.data;
      else if (response.data.output) reply = response.data.output;
      else if (response.data.text) reply = response.data.text;
    }

    reply = reply
      .replace(/\\n/g, "\n")
      .replace(/\\u0021/g, "!")
      .replace(/\\"/g, '"')
      .trim();

    if (reply.length > 2000) reply = reply.substring(0, 1997) + "...";

    history.push({ role: "assistant", content: reply });

    const sent = await sh.reply(
      `◈ ──『 ❀ ساكورا ❀ 』── ◈\n❁┊🤖 الرد:\n\n${reply}\n\n◈ ──────────── ◈`
    );

    if (sent?.messageID) {
      global.shelly.Reply.push({
        name: "دورا",
        ID: sent.messageID,
        author: userId,
        type: "continue"
      });
    }

  } catch (e) {
    console.log("DORA ERROR:", e.message);
    sh.reply("◈ ──『 ❀ ساكورا ❀ 』── ◈\n❁┊❌ حدث خطأ أثناء المعالجة\n◈ ──────────── ◈");
  }
};

// الرد المتواصل
module.exports.Reply = async function ({ event, sh, Reply }) {
  const userId = event.senderID;
  if (Reply.type !== "continue" || Reply.author !== userId) return;

  const question = event.body?.trim();
  if (!question) return;

  try {
    if (!conversations.has(userId)) conversations.set(userId, []);
    const history = conversations.get(userId);

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

    let reply = "لم أستطع فهم الرد.";

    if (response.data) {
      if (typeof response.data === "string") reply = response.data;
      else if (response.data.output) reply = response.data.output;
      else if (response.data.text) reply = response.data.text;
    }

    reply = reply
      .replace(/\\n/g, "\n")
      .replace(/\\u0021/g, "!")
      .replace(/\\"/g, '"')
      .trim();

    if (reply.length > 2000) reply = reply.substring(0, 1997) + "...";

    history.push({ role: "assistant", content: reply });

    const sent = await sh.reply(
      `◈ ──『 ❀ دورا ❀ 』── ◈\n❁┊🤖 الرد:\n\n${reply}\n\n◈ ──────────── ◈`
    );

    if (sent?.messageID) {
      global.shelly.Reply.push({
        name: "دورا",
        ID: sent.messageID,
        author: userId,
        type: "continue"
      });
    }

  } catch (e) {
    console.log("DORA REPLY ERROR:", e.message);
    sh.reply("◈ ──『 ❀ ساكورا ❀ 』── ◈\n❁┊❌ حدث خطأ أثناء المعالجة\n◈ ──────────── ◈");
  }
};
