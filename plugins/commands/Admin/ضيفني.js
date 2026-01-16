import axios from "axios";
import fs from "fs";
import path from "path";

const config = {
    name: "ضيفني",
    aliases: ["addme"],
    description: "إضافة المطور إلى أي قروب البوت فيه",
    usage: "ضيفني",
    cooldown: 10,
    permissions: [2],
    credits: "وسكي سان"
};

const langData = {
    "ar_SY": {
        "onlyDev": "⛔ هذا الأمر خاص بالمطور فقط!",
        "noGroups": "❌ البوت غير موجود في أي قروبات.",
        "chooseGroup":
`╮──༺ اختيار القروب ༻──╭
╯──༺ ༻──╰

{list}

✳️ رد على هذه الرسالة برقم القروب.`,
        "invalidNumber": "❌ الرقم غير صحيح.",
        "addedSuccess": "✅ تم تسجيلك في القروب بنجاح.",
        "error": "❌ حصل خطأ أثناء تنفيذ الأمر."
    }
};

// ===== رابط صورة التسجيل =====
const REGISTER_IMAGE =
"https://i.ibb.co/PJK2n1N/Messenger-creation-2-DBBF1-E2-3696-464-A-BA72-D62-B034-DA8-F1.jpg";

// تخزين مؤقت لطلبات الإضافة
const waitingAdd = new Map();

// ===== تحميل الصورة وإرسالها =====
async function sendRegisterMessage(api, threadID) {
    try {
        const imgPath = path.join(process.cwd(), "register_tmp.jpg");

        const res = await axios.get(REGISTER_IMAGE, {
            responseType: "arraybuffer"
        });

        fs.writeFileSync(imgPath, Buffer.from(res.data));

        await new Promise(resolve => {
            api.sendMessage(
                {
                    body:
`╮──༺ تسجيل ༻──╭
╯──༺ ༻──╰

تسجيل دخول المطور 🗿🔨`,
                    attachment: fs.createReadStream(imgPath)
                },
                threadID,
                () => resolve()
            );
        });

        fs.unlinkSync(imgPath);
    } catch (e) {
        console.error("Send register image error:", e);
    }
}

async function onCall({ message, api, getLang }) {
    try {
        const { threadID, senderID, reply } = message;

        // ===== تحقق المطور =====
        if (!global.config?.MODERATORS?.includes(senderID)) {
            return reply(getLang("onlyDev"));
        }

        // ===== جلب كل القروبات التي البوت موجود فيها =====
        const allGroups = Array.from(global.data.threads.values())
            .filter(t => t?.threadID) // فقط threads صالحة
            .map(t => ({
                id: t.threadID,
                name: t.threadName || "قروب بدون اسم"
            }));

        if (allGroups.length === 0)
            return reply(getLang("noGroups"));

        // ===== بناء القائمة =====
        let listText = "";
        allGroups.forEach((g, i) => {
            listText += `${i + 1}) ${g.name}\n`;
        });

        // ===== إرسال القائمة =====
        const listMsg = await new Promise(resolve => {
            api.sendMessage(
                getLang("chooseGroup", { list: listText }),
                threadID,
                (err, info) => resolve(info)
            );
        });

        if (!listMsg?.messageID) return;

        // حفظ الطلب مؤقتًا
        waitingAdd.set(senderID, {
            messageID: listMsg.messageID,
            groups: allGroups
        });

    } catch (e) {
        console.error("ضيفني error:", e);
        message.reply(getLang("error"));
    }
}

// ===== التقاط الرد على القائمة =====
async function onReply({ message, api }) {
    try {
        const { senderID, body, threadID, messageReply } = message;

        if (!messageReply) return;

        const waitData = waitingAdd.get(senderID);
        if (!waitData) return;

        // لازم يكون الرد على رسالة القائمة نفسها
        if (messageReply.messageID !== waitData.messageID) return;

        const choice = parseInt(body);
        if (isNaN(choice) || choice < 1 || choice > waitData.groups.length) {
            return api.sendMessage("❌ الرقم غير صحيح.", threadID);
        }

        const targetGroup = waitData.groups[choice - 1];

        // حذف رسالة القائمة
        try { api.unsendMessage(waitData.messageID); } catch {}

        // إزالة الطلب من الذاكرة
        waitingAdd.delete(senderID);

        // ===== إضافة المطور للقروب =====
        api.addUserToGroup(senderID, targetGroup.id, async err => {
            if (err) {
                console.error("Add to group error:", err);
                return;
            }

            // ===== إرسال رسالة التسجيل + الصورة =====
            await sendRegisterMessage(api, targetGroup.id);
        });

    } catch (e) {
        console.error("onReply ضيفني error:", e);
    }
}

export default {
    config,
    langData,
    onCall,
    onReply
};
