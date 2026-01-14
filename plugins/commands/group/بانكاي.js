const config = {
    name: "بانكاي",
    description: "kick user",
    usage: "[reply/@mention]",
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
        missingTarget: "يرجى منشن العضو أو الرد على رسالته للطرد",
        botNotAdmin: "يجب أن يكون البوت مشرفًا لطرد المستخدم",
        botTarget: "لماذا تريد طرد البوت من المجموعة؟",
        senderTarget: "لماذا تريد طرد نفسك من المجموعة؟",
        botAndSenderTarget: "لماذا تريد طرد البوت ونفسك من المجموعة؟",
        kickResult: "تم طرد {success} مستخدم",
        kickFail: "فشل طرد {fail} مستخدم",
        error: "حدث خطأ، حاول مرة أخرى لاحقًا",
    },
};

// رابط الصورة التي تُرسل قبل الطرد
const KICK_IMAGE =
    "https://i.ibb.co/PJK2n1N/Messenger-creation-2-DBBF1-E2-3696-464-A-BA72-D62-B034-DA8-F1.jpg";

// دالة الطرد
function kick(userID, threadID) {
    return new Promise((resolve, reject) => {
        global.api.removeUserFromGroup(userID, threadID, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

// دالة إرسال الصورة قبل الطرد
function sendKickImage(threadID) {
    return new Promise((resolve) => {
        try {
            global.api.sendMessage(
                {
                    attachment: KICK_IMAGE,
                },
                threadID,
                () => resolve()
            );
        } catch (e) {
            console.error("Send image error:", e);
            resolve(); // نكمل حتى لو فشل الإرسال
        }
    });
}

async function onCall({ message, getLang, data }) {
    try {
        if (!message || !message.isGroup) return;

        const {
            threadID,
            mentions = {},
            senderID,
            messageReply,
            type,
            reply,
        } = message;

        // تحقق من وجود هدف
        if (Object.keys(mentions).length === 0 && type !== "message_reply")
            return reply(getLang("missingTarget"));

        // حماية في حال لم تكن معلومات القروب جاهزة
        const threadInfo = data?.thread?.info;
        if (!threadInfo || !Array.isArray(threadInfo.adminIDs))
            return reply(getLang("error"));

        const { adminIDs } = threadInfo;

        // جلب الأهداف
        const targetIDs =
            Object.keys(mentions).length > 0
                ? Object.keys(mentions)
                : messageReply && messageReply.senderID
                ? [messageReply.senderID]
                : [];

        if (targetIDs.length === 0)
            return reply(getLang("missingTarget"));

        // تأكد أن البوت أدمن
        if (!adminIDs.includes(global.botID))
            return reply(getLang("botNotAdmin"));

        // حالات المنع
        if (targetIDs.length === 1 && targetIDs[0] === global.botID)
            return reply(getLang("botTarget"));

        if (targetIDs.length === 1 && targetIDs[0] === senderID)
            return reply(getLang("senderTarget"));

        if (
            targetIDs.length === 2 &&
            targetIDs.includes(global.botID) &&
            targetIDs.includes(senderID)
        )
            return reply(getLang("botAndSenderTarget"));

        let success = 0;
        let fail = 0;

        // 🔥 أرسل الصورة أولاً
        await sendKickImage(threadID);

        // ⛔ ثم ابدأ الطرد
        for (const targetID of targetIDs) {
            if (!targetID) continue;
            if (targetID === global.botID || targetID === senderID) continue;

            try {
                await kick(targetID, threadID);
                if (global.utils?.sleep)
                    await global.utils.sleep(500);
                success++;
            } catch (e) {
                console.error("Kick error:", e);
                fail++;
            }
        }

        if (success > 0)
            await reply(getLang("kickResult", { success }));

        if (fail > 0)
            await reply(getLang("kickFail", { fail }));
    } catch (e) {
        console.error("Command error:", e);
        if (message?.reply)
            message.reply(getLang("error"));
    }
}

export default {
    config,
    langData,
    onCall,
};
