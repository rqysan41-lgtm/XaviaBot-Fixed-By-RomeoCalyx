const config = {
    name: "إشعار",
    aliases: ["sendnotification"],
    description: "Send notification to all groups",
    usage: "[message/reply]",
    permissions: [2],
    credits: "XaviaTeam"
};

const langData = {
    "en_US": {
        "sendnoti.message":
`╮──༺༻──╭
NOTIFICATION
╯──༺༻──╰

{message}`,
        "sendnoti.success": "Sent notification to {count} groups",
        "sendnoti.fail": "Failed to send notification to {count} groups"
    },

    "vi_VN": {
        "sendnoti.message":
`╮──༺༻──╭
THÔNG BÁO
╯──༺༻──╰

{message}`,
        "sendnoti.success": "Đã gửi thông báo đến {count} nhóm",
        "sendnoti.fail": "Không thể gửi thông báo đến {count} nhóm"
    },

    "ar_SY": {
        "sendnoti.message":
`╮──༺༻──╭

╯──༺༻──╰

{message}`,
        "sendnoti.success": "إرسال إشعار إلى {count} المجموعات",
        "sendnoti.fail": "فشل في إرسال إشعار إلى {count} المجموعات"
    }
};

const exts = {
    "photo": ".jpg",
    "video": ".mp4",
    "audio": ".mp3",
    "animated_image": ".gif",
    "share": ".jpg",
    "file": ""
};

async function onCall({ message, args, getLang, prefix }) {
    try {
        const { type, messageReply, senderID, threadID } = message;

        const attachments =
            type === "message_reply"
                ? messageReply?.attachments || []
                : message.attachments || [];

        let msg =
            (type === "message_reply" && messageReply?.body
                ? messageReply.body
                : message.body.slice(prefix.length + config.name.length + 1)) || "";

        // ===== تحميل المرفقات =====
        let filePath = [];
        if (attachments.length > 0) {
            for (let i = 0; i < attachments.length; i++) {
                try {
                    const filename =
                        attachments[i].filename || `${Date.now()}_${senderID}_${i}`;
                    const ext = exts[attachments[i].type] || "";
                    if (filename + ext === ".gitkeep" || filename + ext === "README.txt") continue;

                    const savePath = `${global.cachePath}/${filename + ext}`;
                    await global.downloadFile(savePath, attachments[i].url);
                    filePath.push(savePath);
                } catch (err) {
                    console.error("Attachment error:", err);
                }
            }
        }

        // ===== إرسال الإشعار لكل القروبات =====
        let PMs = [];
        let allTIDs = Array.from(global.data.threads.keys()).filter(
            item => item != threadID
        );

        let success = 0;

        for (let i = 0; i < allTIDs.length; i++) {
            const tid = allTIDs[i];

            PMs.push(
                new Promise(resolve => {
                    setTimeout(async () => {
                        try {
                            let tmp = await message
                                .send(
                                    {
                                        body: getLang("sendnoti.message", {
                                            message: msg
                                        }),
                                        attachment: filePath.map(item =>
                                            global.reader(item)
                                        )
                                    },
                                    tid
                                )
                                .then(data => data)
                                .catch(() => null);

                            if (tmp) success++;
                        } catch (e) {
                            console.error("Send error:", e);
                        }
                        resolve();
                    }, i * 350);
                })
            );
        }

        await Promise.all(PMs);

        // ===== حذف الملفات المؤقتة =====
        filePath.forEach(item => {
            try {
                global.deleteFile(item);
            } catch (err) {
                console.error(err);
            }
        });

        // ===== رسالة النتيجة =====
        let resultMsg = getLang("sendnoti.success", { count: success });
        if (success < allTIDs.length) {
            resultMsg +=
                "\n" +
                getLang("sendnoti.fail", {
                    count: allTIDs.length - success
                });
        }

        message.reply(resultMsg);
    } catch (e) {
        console.error("sendnoti error:", e);
        message.reply("❌ حصل خطأ أثناء إرسال الإشعار");
    }
}

export default {
    config,
    langData,
    onCall
};
