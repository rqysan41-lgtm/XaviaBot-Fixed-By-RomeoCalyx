export const config = {
  name: "كنيات",
  description: "تغيير كنيات جميع أعضاء القروب أو شخص معين",
  usage: "كنيات [منشن شخص (اختياري)]",
  cooldown: 10,
  permissions: [2], // خاص بالمطور فقط
  credits: "وسكي سان",
};

export async function onStart({ api, event, args }) {
  const { threadID, senderID, mentions } = event;

  // التحقق من أن المستخدم هو المطور
  if (!global.config.MODERATORS.includes(senderID)) {
    return api.sendMessage(
      "⛔ هذا الأمر خاص بالمطور فقط!",
      threadID
    );
  }

  // النمط الثابت
  const template = "✧ الاسم ✧ 🔥╿مواطن╿ 🏴‍☠️ ⇃👑✨⇂";

  try {
    // الحصول على الشخص المنشن (إن وجد)
    const mentionID = Object.keys(mentions || {})[0];

    if (mentionID) {
      // تغيير كنية شخص واحد فقط
      try {
        const userInfo = await api.getUserInfo(mentionID);
        const name = userInfo[mentionID]?.name || "عضو";
        const gender = userInfo[mentionID]?.gender;
        const role = gender === 1 ? "جندية" : "جندي";

        const newNickname = template
          .replace(/الاسم/g, name)
          .replace(/مواطن/g, role);

        await api.changeNickname(newNickname, threadID, mentionID);

        return api.sendMessage(
          `✅ تم تغيير كنية ${name}\n\n📝 الكنية الجديدة:\n${newNickname}`,
          threadID
        );
      } catch (err) {
        return api.sendMessage(
          "❌ فشل تغيير كنية الشخص المحدد",
          threadID
        );
      }
    } else {
      // تغيير كنيات جميع الأعضاء دفعة واحدة
      const threadInfo = await api.getThreadInfo(threadID);
      const members = threadInfo.participantIDs;

      let success = 0;
      let failed = 0;
      const failedNames = [];

      // إرسال رسالة بداية العملية
      const processingMsg = await api.sendMessage(
        `⏳ جاري تغيير كنيات ${members.length} عضو...\n\nالرجاء الانتظار...`,
        threadID
      );

      for (const uid of members) {
        try {
          const userInfo = await api.getUserInfo(uid);
          const name = userInfo[uid]?.name || "عضو";
          const gender = userInfo[uid]?.gender;
          const role = gender === 1 ? "جندية" : "جندي";

          const newNickname = template
            .replace(/الاسم/g, name)
            .replace(/مواطن/g, role);

          await api.changeNickname(newNickname, threadID, uid);
          success++;

          // تأخير صغير لتجنب السبام
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
          failed++;
          failedNames.push(userInfo[uid]?.name || uid);
        }
      }

      // حذف رسالة الانتظار
      if (processingMsg?.messageID) {
        api.unsendMessage(processingMsg.messageID);
      }

      // إرسال النتيجة النهائية
      let resultMessage = `✅ اكتملت عملية تغيير الكنيات!\n\n`;
      resultMessage += `📊 الإحصائيات:\n`;
      resultMessage += `✔️ نجح: ${success}\n`;
      resultMessage += `❌ فشل: ${failed}\n`;
      resultMessage += `📝 النمط المستخدم:\n${template}`;

      if (failedNames.length > 0 && failedNames.length <= 5) {
        resultMessage += `\n\n⚠️ فشل تغيير كنية:\n${failedNames.join("\n")}`;
      }

      return api.sendMessage(resultMessage, threadID);
    }
  } catch (err) {
    console.error("Error in كنيات command:", err);
    return api.sendMessage(
      "❌ حدث خطأ أثناء تنفيذ الأمر.\n\nتأكد من أن البوت أدمن في المجموعة.",
      threadID
    );
  }
            }
