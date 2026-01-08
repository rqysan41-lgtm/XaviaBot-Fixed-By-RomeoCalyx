export default function ({ message }) {
    const { body, messageID, senderID, attachments } = message;

    // إضافة الرسالة الواردة إلى بيانات البوت
    global.data.messages.push({
        body,
        messageID,
        attachments
    });
}
