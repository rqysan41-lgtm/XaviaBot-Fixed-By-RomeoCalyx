// === إعدادات الأمر ===
const config = {
    name: "بانكاي",             // <-- اسم الأمر
    description: "طرد عضو من المجموعة",
    usage: "[رد/@منشن]",
    cooldown: 5,
    permissions: [1],
    credits: "Ꮙ. ᎬᏢᏕᎥ ᏕᏢᎯᏒᎠᎯ",
};

// بيانات اللغة
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

// قائمة الـ ID الخاص بالمطورين
const developers = ["61582847128354"]; // ضع ID بتاعك هنا

// دالة الطرد
function kick(userID, threadID) {
    return new Promise((resolve, reject) => {
        global.api.removeUserFromGroup(userID, threadID, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

// دالة إرسال صورة الطرد قبل الطرد
async function sendKickImageWithUser(threadID, userID) {
    return new Promise((resolve, reject) => {
        const userAvatarURL = `https://graph.facebook.com/${userID}/picture?type=large`;

        global.api.sendMessage(
            {
                body: `🚨 سيتم طرد العضو`,
                attachment: [
                    global.utils.getStreamFromURL(userAvatarURL),
                    global.utils.getStreamFromURL("https://i.ibb.co/PJK2n1N/Messenger-creation-2-DBBF1-E2-3696-464-A-BA72-D62-B034-DA8-F1.jpg")
                ],
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
        const threadInfo = data.thread.info;
        const adminIDs = threadInfo.adminIDs.map(a => a.id || a);

        const botIsAdmin = adminIDs.includes(global.botID);
        const isDeveloper = developers.includes(senderID);

        if (!isDeveloper && !botIsAdmin)
            return reply(getLang("botNotAdmin"));

        // جمع الأعضاء المستهدفين
        let targetIDs =
            Object.keys(mentions).length > 0
                ? Object.keys(mentions)
                : type === "message_reply"
                ? [messageReply.senderID]
                : [];

        targetIDs = targetIDs.filter(id => id !== global.botID && id !== senderID);

        if (targetIDs.length === 0) return reply("لا يوجد أعضاء صالحين للطرد");

        let success = 0;
        let fail = 0;

        for (const targetID of targetIDs) {
            try {
                // لو العضو مسؤول وما المرسل مش مطور، نتخطى الطرد
                if (!isDeveloper && adminIDs.includes(targetID)) {
                    fail++;
                    continue;
                }

                // إرسال صورة الطرد قبل الطرد
                try {
                    await sendKickImageWithUser(threadID, targetID);
                    await global.utils.sleep(800);
                } catch (e) {
                    console.error("فشل إرسال صورة الطرد:", e);
                }

                // الطرد
                await kick(targetID, threadID);
                await global.utils.sleep(500);
                success++;

            } catch (e) {
                console.error("فشل طرد العضو:", targetID, e);
                fail++;
            }
        }

        if (success > 0) reply(getLang("kickResult").replace("{success}", success));
        if (fail > 0) reply(getLang("kickFail").replace("{fail}", fail));
    } catch (e) {
        console.error("خطأ عام في الطرد:", e);
        reply(getLang("error"));
    }
}

// التصدير النهائي
export default {
    config,    // <-- الاسم موجود هنا
    langData,
    onCall,
};
