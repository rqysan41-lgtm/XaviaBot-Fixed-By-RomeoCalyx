import { log } from "../logger/index.js";
import fs from "fs";
import axios from "axios";
import path from "path";

export default {
  name: "subscribe",
  execute: async ({ api, event, Threads, Users }) => {
    // جلب بيانات المجموعة
    let threads = (await Threads.find(event.threadID))?.data?.data || { members: 0 };

    switch (event.logMessageType) {
      case "log:unsubscribe": {
        // إذا تم طرد البوت
        if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) {
          try {
            await Threads.remove(event.threadID);
            return log([
              { message: "[ THREADS ]: ", color: "yellow" },
              { message: `تم حذف بيانات المجموعة: ${event.threadID} لأن البوت تم طرده.`, color: "green" }
            ]);
          } catch (err) {
            console.error("Error removing thread:", err);
          }
        }

        // تحديث عدد الأعضاء بعد خروج شخص
        try {
          await Threads.update(event.threadID, {
            members: +threads.members - 1,
          });
        } catch {}
        break;
      }

      case "log:subscribe": {
        const addedParticipants = event.logMessageData.addedParticipants;

        // إذا تمت إضافة البوت
        if (addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
          try { api.unsendMessage(event.messageID); } catch {}

          const botName = "ساكورا ";
          try { api.changeNickname(`》 《 ❃ ➠ ${botName}`, event.threadID, api.getCurrentUserID()); } catch {}

          const welcomeMessage = `✅ | تم التوصيل بنجاح\n❏ اسم البوت: 『${botName}』\n❏ المالك: 『ويــسكي』\n╼╾─────⊹⊱⊰⊹─────╼╾\n⚠️ اكتب قائمة او اوامر أو تقرير إذا واجهت أي مشكلة`;

          try { await api.sendMessage(welcomeMessage, event.threadID); } catch {}
        } else {
          // إضافة أعضاء جدد
          for (let participant of addedParticipants) {
            try { await Users.create(participant.userFbId); } catch {}

            try { await sendWelcomeCard(api, participant.userFbId, event.threadID); } catch (err) {
              console.error("Welcome card error:", err);
            }
          }

          // تحديث عدد الأعضاء
          try {
            await Threads.update(event.threadID, {
              members: +threads.members + addedParticipants.length,
            });
          } catch {}
        }
        break;
      }
    }
  },
};

// اختيار خلفية عشوائية
function getRandomBackground() {
  const backgrounds = [
    "https://i.imgur.com/dDSh0wc.jpeg",
    "https://i.imgur.com/UucSRWJ.jpeg",
    "https://i.imgur.com/OYzHKNE.jpeg",
    "https://i.imgur.com/V5L9dPi.jpeg",
    "https://i.imgur.com/M7HEAMA.jpeg",
    "https://i.imgur.com/MnAwD8U.jpg",
    "https://i.imgur.com/tSkuyIu.jpg",
    "https://i.ibb.co/rvft0WP/923823d1a27d17d3319c4db6c0efb60c.jpg"
  ];
  return backgrounds[Math.floor(Math.random() * backgrounds.length)];
}

// إرسال بطاقة ترحيب بصورة
async function sendWelcomeCard(api, userID, threadID) {
  try {
    const profileUrl = `https://graph.facebook.com/${userID}/picture?width=512&height=512`;
    const background = getRandomBackground();
    const apiUrl = `https://api.popcat.xyz/welcomecard?background=${encodeURIComponent(background)}&text1=${encodeURIComponent("مرحبا بك")}&text2=في القروب&text3=&avatar=${encodeURIComponent(profileUrl)}`;

    const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

    const cacheDir = path.join(process.cwd(), "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const imagePath = path.join(cacheDir, `welcome_${Date.now()}.png`);
    fs.writeFileSync(imagePath, response.data);

    await api.sendMessage({
      body: `مرحبا بك في المجموعة!`,
      attachment: fs.createReadStream(imagePath)
    }, threadID);

    // حذف الصورة بعد الإرسال
    fs.unlink(imagePath, (err) => { if (err) console.error(err); });
  } catch (err) {
    console.error("Error sending welcome card:", err);
  }
            }
