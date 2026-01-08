import axios from 'axios';
import fs from 'fs';
import path from 'path';
import jimp from 'jimp';

async function execute({ api, event }) {
  const ownerFbIds = ["61582847128354"];  // معرف صاحب البوت

  switch (event.logMessageType) {

    // -------------------- خروج أو طرد عضو --------------------
    case "log:unsubscribe": {
      const { leftParticipantFbId, reason } = event.logMessageData;
      if (leftParticipantFbId == api.getCurrentUserID()) return; // تجاهل البوت نفسه

      try {
        const userInfo = await api.getUserInfo(leftParticipantFbId);
        const profileName = userInfo[leftParticipantFbId]?.name || "Unknown";
        const type = event.author == leftParticipantFbId ? "غادر لوحده" : "تم طرده بواسطة الأدمن";
        const farewellReason = reason === "leave" ? "ناقص واحد 😢" : "تم طرده من المجموعة 📝";
        const threadInfo = await api.getThreadInfo(event.threadID);
        const membersCount = threadInfo.participantIDs.length;

        const farewellMessage = `💔 وداعاً 👤: 『${profileName}』\n📝 السبب: ${type}\n❕ ${farewellReason}\n👥 المتبقين: ${membersCount} عضو`;

        const profilePicturePath = await getProfilePicture(leftParticipantFbId);
        await sendMessage(api, event.threadID, farewellMessage, profilePicturePath);

      } catch (err) {
        console.error('حدث خطأ عند إرسال رسالة وداع:', err);
      }
      break;
    }

    // -------------------- انضمام عضو جديد --------------------
    case "log:subscribe": {
      const { addedParticipants } = event.logMessageData;
      const botUserID = api.getCurrentUserID();

      // لو البوت نفسه أضيف للمجموعة
      const botAdded = addedParticipants.some(p => p.userFbId === botUserID);
      if (botAdded) {
        await handleBotAddition(api, event, ownerFbIds);
      }

      // رسالة ترحيب لأي عضو جديد (غير البوت)
      for (const participant of addedParticipants) {
        if (participant.userFbId === botUserID) continue;
        try {
          const userInfo = await api.getUserInfo(participant.userFbId);
          const profileName = userInfo[participant.userFbId]?.name || "Unknown";
          const threadInfo = await api.getThreadInfo(event.threadID);
          const membersCount = threadInfo.participantIDs.length;

          const welcomeMessage = `🎉 أهلاً وسهلاً 👤: 『${profileName}』\n👥 عدد أعضاء المجموعة الآن: ${membersCount}\n💡 نتمنى لك وقت ممتع معنا!`;

          const profilePicturePath = await getProfilePicture(participant.userFbId);
          await sendMessage(api, event.threadID, welcomeMessage, profilePicturePath);

        } catch (err) {
          console.error('حدث خطأ عند إرسال رسالة ترحيب:', err);
        }
      }
      break;
    }
  }
}

// -------------------- إرسال رسالة مع صورة --------------------
async function sendMessage(api, threadID, message, attachmentPath) {
  try {
    await api.sendMessage({
      body: message,
      attachment: fs.createReadStream(attachmentPath),
    }, threadID);
  } catch (err) {
    console.error('خطأ في إرسال الرسالة:', err);
    await api.sendMessage(message, threadID); // إرسال نص فقط إذا فشل الإرسال بالصورة
  }
}

// -------------------- الحصول على صورة البروفايل --------------------
async function getProfilePicture(userID) {
  const url = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const img = await jimp.read(url);
  const dir = path.join(process.cwd(), 'cache');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  const profilePath = path.join(dir, `profile_${userID}.png`);
  await img.writeAsync(profilePath);
  return profilePath;
}

// -------------------- إضافة البوت للمجموعة --------------------
async function handleBotAddition(api, event, ownerFbIds) {
  const threadInfo = await api.getThreadInfo(event.threadID);
  const threadName = threadInfo.threadName || "Unknown";
  const membersCount = threadInfo.participantIDs.length;
  const addedByInfo = await api.getUserInfo(event.author);
  const addedByName = addedByInfo[event.author]?.name || "Unknown";

  if (!ownerFbIds.includes(event.author)) {
    await api.sendMessage(`⚠️ تم إضافة البوت بدون إذن!\n📍 المجموعة: ${threadName}\n🔢 عدد الأعضاء: ${membersCount}\n🧑‍💼 بواسطة: ${addedByName}`, ownerFbIds[0]);
    await api.sendMessage(`⚠️ البوت سيغادر المجموعة لأنه أضيف بدون إذن المطور`, event.threadID);
    await api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
  } else {
    await api.sendMessage(`✅ تم إضافة البوت لمجموعة جديدة\n📍 اسم المجموعة: ${threadName}\n🔢 عدد الأعضاء: ${membersCount}`, ownerFbIds[0]);
  }
}

export default {
  name: "ترحيب_ومغادرة",
  description: "إرسال رسائل ترحيب ووداع بالعربي عند الانضمام أو المغادرة.",
  execute,
};
