export default {
  config: {
    name: "كنيات",
    version: "1.0.0",
    hasPermission: 1, // يحتاج صلاحيات أدمن
    credits: "وسكي سان",
    description: "تغيير كنيات جميع أعضاء القروب مع التفرقة بين الذكور والإناث",
    commandCategory: "المجموعة",
    usages: "كنيات <النمط>",
    cooldowns: 10,
  },

  /**
   * @param {object} params
   * @param {import('@xaviabot/fca-unofficial').IFCAU_API} params.api
   * @param {import('@xaviabot/fca-unofficial').IFCAU_ListenMessage} params.event
   * @param {string[]} params.args
   * @param {xDatabase} params.xDatabase
   */
  run: async function ({ api, event, args, xDatabase }) {
    const { threadID, senderID } = event;

    try {
      // التحقق من صلاحيات المستخدم
      const threadInfo = await api.getThreadInfo(threadID);
      const isAdmin = threadInfo.adminIDs.some(
        (admin) => admin.id === senderID
      );

      if (!isAdmin && !global.config.MODERATORS.includes(senderID)) {
        return api.sendMessage(
          "⛔ هذا الأمر يتطلب صلاحيات أدمن في المجموعة!",
          threadID
        );
      }

      // التحقق من وجود النمط
      if (!args.length) {
        return api.sendMessage(
          "❌ يرجى كتابة نمط الكنية.\n\n📝 مثال:\nكنيات ✧ الاسم ✧ 🔥╿مواطن╿ 🏴‍☠️ ⇃👑✨⇂\n\n💡 المتغيرات المتاحة:\n• الاسم → اسم العضو\n• مواطن → جندي/جندية (حسب الجنس)",
          threadID
        );
      }

      const template = args.join(" ");

      // رسالة تأكيد بداية العملية
      const confirmMsg = await api.sendMessage(
        `⚠️ تأكيد تغيير الكنيات\n\n📝 النمط:\n${template}\n\n👥 عدد الأعضاء: ${threadInfo.participantIDs.length}\n\n⏰ الوقت المقدر: ${Math.ceil(threadInfo.participantIDs.length / 2)} ثانية\n\n❓ هل تريد المتابعة؟\nرد بـ "نعم" خلال 30 ثانية`,
        threadID
      );

      // إضافة للـ handleReply
      return global.client.handleReply.push({
        name: this.config.name,
        messageID: confirmMsg.messageID,
        author: senderID,
        type: "confirm_nicknames",
        template,
        threadInfo,
      });
    } catch (err) {
      console.error("Error in كنيات command:", err);
      return api.sendMessage(
        "❌ حدث خطأ أثناء تنفيذ الأمر.\n\nتأكد من أن البوت لديه صلاحيات أدمن في المجموعة.",
        threadID
      );
    }
  },

  /**
   * معالج الردود
   * @param {object} params
   * @param {import('@xaviabot/fca-unofficial').IFCAU_API} params.api
   * @param {import('@xaviabot/fca-unofficial').IFCAU_ListenMessage} params.event
   * @param {object} params.Reply
   */
  onReply: async function ({ api, event, Reply }) {
    const { threadID, senderID, body } = event;

    // التحقق من أن الرد من نفس الشخص
    if (senderID !== Reply.author) return;

    // التحقق من نوع الرد
    if (Reply.type !== "confirm_nicknames") return;

    // إلغاء العملية إذا لم يكن الرد "نعم"
    if (body.toLowerCase() !== "نعم" && body.toLowerCase() !== "yes") {
      api.unsendMessage(Reply.messageID);
      return api.sendMessage("❌ تم إلغاء عملية تغيير الكنيات", threadID);
    }

    try {
      // حذف رسالة التأكيد
      api.unsendMessage(Reply.messageID);

      const { template, threadInfo } = Reply;
      const members = threadInfo.participantIDs;

      // رسالة بداية العملية
      const processingMsg = await api.sendMessage(
        `⏳ جاري تغيير كنيات ${members.length} عضو...\n\n📝 النمط: ${template}\n\nالرجاء الانتظار...`,
        threadID
      );

      let success = 0;
      let failed = 0;
      const failedNames = [];

      // تطبيق الكنيات
      for (const uid of members) {
        try {
          const userInfo = await api.getUserInfo(uid);
          const name = userInfo[uid]?.name || "عضو";
          const gender = userInfo[uid]?.gender;

          // تحديد الدور حسب الجنس
          // 1 = أنثى, 2 = ذكر (في مكتبة Facebook)
          const role = gender === 1 ? "جندية" : "جندي";

          // استبدال المتغيرات في النمط
          let newNickname = template
            .replace(/الاسم/g, name)
            .replace(/مواطن/g, role);

          // تغيير الكنية
          await api.changeNickname(newNickname, threadID, uid);
          success++;

          // تأخير صغير لتجنب السبام
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (e) {
          failed++;
          const userInfo = await api.getUserInfo(uid);
          failedNames.push(userInfo[uid]?.name || uid);
        }
      }

      // حذف رسالة الانتظار
      if (processingMsg?.messageID) {
        api.unsendMessage(processingMsg.messageID);
      }

      // إرسال النتيجة النهائية
      let resultMessage = `✅ اكتملت عملية تغيير الكنيات!\n\n`;
      resultMessage += `━━━━━━━━━━━━━━━━━━━━━\n`;
      resultMessage += `📊 الإحصائيات:\n`;
      resultMessage += `✔️ نجح: ${success}\n`;
      resultMessage += `❌ فشل: ${failed}\n`;
      resultMessage += `━━━━━━━━━━━━━━━━━━━━━\n`;
      resultMessage += `📝 النمط المستخدم:\n${template}`;

      // إضافة أسماء الفاشلين إذا كانوا قليلين
      if (failedNames.length > 0 && failedNames.length <= 5) {
        resultMessage += `\n\n⚠️ فشل تغيير كنية:\n${failedNames.join("\n")}`;
      } else if (failedNames.length > 5) {
        resultMessage += `\n\n⚠️ فشل تغيير ${failed} كنية`;
      }

      return api.sendMessage(resultMessage, threadID);
    } catch (err) {
      console.error("Error in كنيات onReply:", err);
      return api.sendMessage(
        "❌ حدث خطأ أثناء تغيير الكنيات.\n\nتأكد من أن البوت لديه صلاحيات أدمن.",
        threadID
      );
    }
  },
};
