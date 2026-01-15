export const config = {
  name: "كنيات",
  description: "تغيير كنيات جميع أعضاء القروب أو شخص معين",
  usage: "كنيات [@منشن]",
  cooldown: 10,
  permissions: [2], // للمطور فقط
  credits: "وسكي سان",
};

const TEMPLATE = "✧ الاسم ✧ 🔥╿مواطن╿ 🏴‍☠️ ⇃👑✨⇂";

export async function onCall({ message, data, api }) {
  try {
    if (!message || !message.isGroup) return;

    const { threadID, senderID, mentions, reply } = message;

    // ===== تحقق المطور =====
    if (!global.config?.MODERATORS?.includes(senderID)) {
      return reply("⛔ هذا الأمر خاص بالمطور فقط!");
    }

    // ===== جلب الهدف =====
    const targetID = Object.keys(mentions || {})[0];

    // ===== تغيير كنية شخص واحد =====
    if (targetID) {
      try {
        const userInfo = await api.getUserInfo(targetID);
        const name = userInfo[targetID]?.name || "عضو";
        const gender = userInfo[targetID]?.gender;
        const role = gender === 1 ? "جندية" : "جندي";

        const newNickname = TEMPLATE
          .replace(/الاسم/g, name)
          .replace(/مواطن/g, role);

        api.changeNickname(newNickname, threadID, targetID);

        return reply(
          `✅ تم تغيير كنية ${name}\n\n📝 الكنية الجديدة:\n${newNickname}`
        );
      } catch (e) {
        console.error("Nickname error:", e);
        return reply("❌ فشل تغيير كنية الشخص المحدد");
      }
    }

    // ===== تغيير كنيات الجميع =====
    const threadInfo = data?.thread?.info || (await api.getThreadInfo(threadID));
    const members = threadInfo?.participantIDs || [];

    if (members.length === 0)
      return reply("❌ ما قدرت أجيب أعضاء القروب");

    let success = 0;
    let failed = 0;

    const waitMsg = await new Promise((resolve) => {
      api.sendMessage(
        `⏳ جاري تغيير كنيات ${members.length} عضو...\nالرجاء الانتظار...`,
        threadID,
        (err, info) => resolve(info)
      );
    });

    for (const uid of members) {
      try {
        const userInfo = await api.getUserInfo(uid);
        const name = userInfo[uid]?.name || "عضو";
        const gender = userInfo[uid]?.gender;
        const role = gender === 1 ? "جندية" : "جندي";

        const newNickname = TEMPLATE
          .replace(/الاسم/g, name)
          .replace(/مواطن/g, role);

        api.changeNickname(newNickname, threadID, uid);
        success++;

        // تأخير بسيط عشان ما ينحظر البوت
        await new Promise((r) => setTimeout(r, 400));
      } catch (e) {
        failed++;
      }
    }

    // حذف رسالة الانتظار
    if (waitMsg?.messageID) {
      api.unsendMessage(waitMsg.messageID);
    }

    return reply(
      `✅ اكتملت العملية!\n\n` +
        `✔️ نجح: ${success}\n` +
        `❌ فشل: ${failed}\n\n` +
        `📝 النمط المستخدم:\n${TEMPLATE}`
    );
  } catch (err) {
    console.error("Command كنيات error:", err);
    return message.reply(
      "❌ حدث خطأ أثناء تنفيذ الأمر.\n\nتأكد أن البوت أدمن في المجموعة."
    );
  }
}

export default {
  config,
  onCall,
};
