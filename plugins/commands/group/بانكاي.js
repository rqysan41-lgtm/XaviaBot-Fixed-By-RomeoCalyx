const config = {
    name: "بانكاي",
    description: "طرد عضو من المجموعة",
    usage: "[رد/@منشن]",
    cooldown: 5,
    permissions: [1],
    credits: "XaviaTeam",
};

const langData = {
    en_US: {
        missingTarget: "Please tag or reply message of user to kick",
        botNotAdmin: "Bot need to be admin to kick user",
        botTarget: "Why do you want to kick bot out of group :<?",
        senderTarget: "Why do you want to kick yourself out of group :v?",
        botAndSenderTarget:
            "Why do you want to kick bot and yourself out of group :v?",
        kickResult: "Kicked {success} user(s)",
        kickFail: "Failed to kick {fail} user(s)",
        error: "An error occurred, please try again later",
    },

    vi_VN: {
        missingTarget: "Vui lòng tag hoặc reply tin nhắn của người cần kick",
        botNotAdmin:
            "Bot cần được cấp quyền quản trị viên để có thể kick thành viên",
        botTarget: "Sao lại muốn kick bot ra khỏi nhóm vậy :<?",
        senderTarget: "Sao bạn lại muốn tự kick mình ra khỏi nhóm vậy :v?",
        botAndSenderTarget:
            "Sao bạn lại muốn kick cả bot và mình ra khỏi nhóm vậy :v?",
        kickResult: "Đã kick thành công {success} người",
        kickFail: "Kick thất bại {fail} người",
        error: "Đã có lỗi xảy ra, vui lòng thử lại sau",
    },

    ar_SY: {
        missingTarget: "يرجى منشن العضو أو الرد على رسالته لطرده",
        botNotAdmin: "يجب أن يكون البوت مشرفاً ليتمكن من طرد الأعضاء",
        botTarget: "ليش داير تطرد البوت من القروب؟ :<?",
        senderTarget: "ليش داير تطرد نفسك من القروب؟ :v?",
        botAndSenderTarget:
            "ليش داير تطرد البوت ونفسك مع بعض؟ :v?",
        kickResult: "تم طرد {success} عضو بنجاح",
        kickFail: "فشل طرد {fail} عضو",
        error: "حصل خطأ، حاول مرة ثانية لاحقاً",
    },
};

/* ===============================
   دالة الطرد
================================ */
function kick(userID, threadID) {
    return new Promise((resolve, reject) => {
        global.api.removeUserFromGroup(userID, threadID, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

/* ===============================
   دالة إرسال صورة قبل الطرد
   🔴 عدّل الرابط إلى صورتك
================================ */
async function sendKickImage(threadID) {
    return new Promise((resolve, reject) => {
        global.api.sendMessage(
            {
                body: "🚫 تم اتخاذ قرار الطرد...",
                attachment: global.utils.getStreamFromURL(
                    "https://i.imgur.com/XXXXX.jpg" // ← حط رابط صورتك هنا
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

/* ===============================
   المناداة الأساسية
================================ */
async function onCall({ message, getLang, data }) {
    if (!message.isGroup) return;

    const { threadID, mentions, senderID, messageReply, type, reply } = message;

    try {
        if (Object.keys(mentions).length == 0 && type != "message_reply")
            return reply(getLang("missingTarget"));

        const threadInfo = data.thread.info;
        const { adminIDs } = threadInfo;

        const targetIDs =
            Object.keys(mentions).length > 0
                ? Object.keys(mentions)
                : [messageReply.senderID];

        if (!adminIDs.some((e) => e == global.botID))
            return reply(getLang("botNotAdmin"));

        if (targetIDs.length == 1 && targetIDs[0] == global.botID)
            return reply(getLang("botTarget"));

        if (targetIDs.length == 1 && targetIDs[0] == senderID)
            return reply(getLang("senderTarget"));

        if (
            targetIDs.length == 2 &&
            targetIDs.some((e) => e == global.botID) &&
            targetIDs.some((e) => e == senderID)
        )
            return reply(getLang("botAndSenderTarget"));

        let success = 0,
            fail = 0;

        for (const targetID of targetIDs) {
            if (targetID == global.botID || targetID == senderID) continue;

            try {
                // 🔔 إرسال الصورة قبل الطرد
                await sendKickImage(threadID);
                await global.utils.sleep(800);

                // ❌ تنفيذ الطرد
                await kick(targetID, threadID);
                await global.utils.sleep(500);

                success++;
            } catch (e) {
                console.error(e);
                fail++;
            }
        }

        await reply(getLang("kickResult", { success }));
        if (fail > 0) await reply(getLang("kickFail", { fail }));
    } catch (e) {
        console.error(e);
        reply(getLang("error"));
    }
}

export default {
    config,
    langData,
    onCall,
};
