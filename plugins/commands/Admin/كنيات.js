const config = {
  name: "كنيات",
  aliases: [],
  description: "تغيير كنيات جميع أعضاء القروب حسب نمط محدد",
  usage: "كنيات <النمط>",
  permissions: [1], // 1 = أدمن
  credits: "وسكي سان"
};

const langData = {
  "en_US": {
    "nicknames.success": "✅ Finished changing nicknames!\n✔ Success: {success}\n❌ Failed: {failed}\nTemplate: {template}",
    "nicknames.fail": "❌ Failed to change nickname for {count} members"
  },
  "ar_SY": {
    "nicknames.success": "✅ انتهت العملية!\n✔️ نجح: {success}\n❌ فشل: {failed}\nالنمط: {template}",
    "nicknames.fail": "❌ فشل تغيير كنيات {count} عضو"
  }
};

async function onCall({ message, args, getLang }) {
  try {
    const { senderID, threadID, messageID } = message;

    if (!args.length)
      return message.reply(
        "❌ اكتب نمط الكنية بعد الأمر.\nمثال: كنيات ✧ الاسم ✧ مواطن"
      );

    const template = args.join(" ");

    // تفاعل بالإيموجي على رسالة المستخدم
    await global.api.setMessageReaction("⏳", messageID, threadID);

    // جلب أعضاء القروب
    const threadInfo = await global.api.getThreadInfo(threadID);
    const members = threadInfo.participantIDs;

    let success = 0;
    let failed = 0;
    let successNames = [];
    let failedNames = [];

    for (let i = 0; i < members.length; i++) {
      const uid = members[i];

      try {
        const userInfo = await global.api.getUserInfo(uid);
        const name = userInfo[uid]?.name || "عضو";
        const gender = userInfo[uid]?.gender;
        const role = gender === 1 ? "جندية" : "جندي";

        const newNick = template.replace(/الاسم/g, name).replace(/مواطن/g, role);

        // محاولة تغيير الكنية مع retry بسيط
        let changed = false;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            await global.api.changeNickname(newNick, threadID, uid);
            changed = true;
            break;
          } catch (e) {}
        }

        if (changed) {
          success++;
          successNames.push(`▣ ${name}`);
        } else {
          failed++;
          failedNames.push(`▣ ${name}`);
        }

        // تأخير بسيط بين كل عملية
        await new Promise((res) => setTimeout(res, 300));

      } catch (err) {
        failed++;
        failedNames.push(`▣ ${uid}`);
        console.error("Member error:", err); // يوضح السبب لكل عضو
      }
    }

    // إرسال تقرير واحد بعد الانتهاء
    let resultMsg = getLang("nicknames.success", { success, failed, template });

    if (successNames.length) {
      resultMsg += `\n✅ نجح مع:\n${successNames.join("\n")}`;
    }

    if (failedNames.length) {
      resultMsg += `\n⚠️ فشل مع:\n${failedNames.join("\n")}`;
    }

    message.reply(resultMsg);
  } catch (err) {
    console.error("nicknames error:", err); // يظهر السبب التفصيلي في console
    message.reply(
      `❌ حدث خطأ أثناء تغيير الكنيات\n⚠️ السبب: ${err.message || err}`
    );
  }
}

export default {
  config,
  langData,
  onCall
};
