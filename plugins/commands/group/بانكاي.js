const config = {
    name: "بانكاي",
    description: "طرد عضو من المجموعة",
    usage: "[رد/@منشن]",
    cooldown: 5,
    permissions: [1],
    credits: "XaviaTeam",
};

const langData = {
    ar_SY: {
        missingTarget: "يرجى منشن العضو أو الرد على رسالته لطرده",
        botNotAdmin: "يجب أن يكون البوت مشرفاً ليتمكن من طرد الأعضاء",
        botTarget: "لا يمكنك طرد البوت من القروب",
        senderTarget: "لا يمكنك طرد نفسك من القروب",
        botAndSenderTarget: "لا يمكنك طرد البوت ونفسك معاً",
        kickResult: "تم طرد {success} عضو بنجاح",
        kickFail: "فشل طرد {fail} عضو",
        error: "حصل خطأ، حاول مرة أخرى لاحقاً",
    },
};

// دالة الطرد
function kick(userID, threadID) {
    return new Promise((resolve, reject) => {
        global.api.removeUserFromGroup(userID, threadID, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

// دالة إرسال صورة قبل الطرد
async function sendKickImage(threadID) {
    return new Promise((resolve, reject) => {
        global.api.sendMessage(
            {
                body: "🚫 تم اتخاذ قرار الطرد...",
                attachment: global.utils.getStreamFromURL(
                    "https://i.imgur.com/XXXXX.jpg" // ← عدّل الرابط لاحقاً
                ),
            },
            threadID,
            (err) => {
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

// المناداة الأساسية
async function onCall({ message, getLang, data }) {
    if (!message.isGroup) return;

    const { threadID, mentions, senderID, messageReply, type, reply } = message;

    try {
        if (Object.keys(mentions).length === 0 && type !== "message_reply")
            return reply(getLang("missingTarget"));

        const threadInfo = data.thread.info;
        const { adminIDs } = threadInfo;

        // تحديد أعضاء الطرد مع استثناء البوت والمرسل
        let targetIDs =
            Object.keys(mentions).length > 0
                ? Object.keys(mentions)
                : [messageReply.senderID];

        targetIDs = targetIDs.filter(
            (id) => id !== global.botID && id !== senderID
        );

        if (!adminIDs.includes(global.botID))
            return reply(getLang("botNotAdmin"));

        if (targetIDs.length === 0)
            return reply("لا يوجد أعضاء صالحين للطرد");

        // 🔔 إرسال صورة مرة واحدة قبل الطرد (لو فشلت ما توقف الطرد)
        try {
            await sendKickImage(threadID);
            await global.utils.sleep(800);
        } catch (e) {
            console.error("فشل إرسال صورة الطرد، سيتم الطرد بدون صورة");
        }

        let success = 0,
            fail = 0;

        for (const targetID of targetIDs) {
            try {
                await kick(targetID, threadID);
                await global.utils.sleep(500);
                success++;
            } catch (e) {
                console.error("فشل طرد العضو:", targetID, e);
                fail++;
            }
        }

        if (success > 0) await reply(getLang("kickResult", { success }));
        if (fail > 0) await reply(getLang("kickFail", { fail }));
    } catch (e) {
        console.error("خطأ عام في الطرد:", e);
        reply(getLang("error"));
    }
}

export default {
    config,
    langData,
    onCall,
};
