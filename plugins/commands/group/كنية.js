export default {
    config: {
        name: "كنية",
        version: "1.0.0",
        hasPermission: 0,
        credits: "عمر",
        description: "قم بتغيير لقبك في مجموعتك أو الشخص الذي تضع علامة عليه",
        commandCategory: "خدمات",
        usages: "نيم [الاسم الجديد] أو منشن + الاسم",
        cooldowns: 3
    },

    /**
     * @param {object} params
     * @param {import('@xaviabot/fca-unofficial').IFCAU_API} params.api
     * @param {import('@xaviabot/fca-unofficial').IFCAU_ListenMessage} params.event
     * @param {string[]} params.args
     * @param {xDatabase} params.xDatabase
     */
    run: async function({ api, event, args, xDatabase }) {
        try {
            const { threadID, senderID, mentions } = event;
            const name = args.join(" ");

            // التحقق من وجود اسم
            if (!name || name.trim() === "") {
                return api.sendMessage(
                    "⚠️ يرجى كتابة الاسم الجديد\n\nمثال: نيم محمد",
                    threadID
                );
            }

            // الحصول على المستخدم المنشن
            const mentionID = Object.keys(mentions || {})[0];

            if (!mentionID) {
                // تغيير اسم المرسل نفسه
                await api.changeNickname(name, threadID, senderID);
                return api.sendMessage(
                    ` ${name}`,
                    threadID
                );
            } else {
                // تغيير اسم الشخص المنشن
                const cleanName = name.replace(mentions[mentionID], "").trim();
                
                if (!cleanName) {
                    return api.sendMessage(
                        "⚠️ يرجى كتابة الاسم الجديد بعد المنشن",
                        threadID
                    );
                }

                await api.changeNickname(cleanName, threadID, mentionID);
                return api.sendMessage(
                    ` ${mentions[mentionID]} إلى: ${cleanName}`,
                    threadID
                );
            }
        } catch (error) {
            console.error("Error in نيم command:", error);
            return api.sendMessage(
                "❌ حدث خطأ أثناء تغيير الاسم. تأكد من صلاحيات البوت.",
                event.threadID
            );
        }
    }
};
