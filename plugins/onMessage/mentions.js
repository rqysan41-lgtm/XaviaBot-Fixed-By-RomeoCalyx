const langData = {
    "ar_SY": {
        "isAFK": "هذا الشخص مشغول.",
        "isAFKReason": "هذا الشخص مشغول. السبب: {reason}",
        "botMention": "كيف أقدر أساعدك؟"
    }
}

function checkAFK(message, getLang) {
    const { mentions } = message;
    for (let mention in mentions) {
        let mentionData = global.data.users.get(mention) || {};
        if (mentionData.data && mentionData.data.afk && mentionData.data.afk.status) {
            // يرسل رسالة حسب وجود سبب AFK أو لا
            message.reply(
                mentionData.data.afk.reason 
                    ? getLang("isAFKReason", { reason: mentionData.data.afk.reason }) 
                    : getLang("isAFK")
            );
        }
    }
}

function checkBotMention(message, getLang) {
    // يشيك لو البوت متذكر في الرسالة
    if (Object.keys(message.mentions).some(mention => mention == global.botID)) {
        message.reply(getLang("botMention"));
    }
}

function onCall({ message, getLang }) {
    if (Object.keys(message.mentions).length == 0 || message.senderID == global.botID) return;
    checkAFK(message, getLang);
    checkBotMention(message, getLang);
}

export default {
    langData,
    onCall
                                           }
