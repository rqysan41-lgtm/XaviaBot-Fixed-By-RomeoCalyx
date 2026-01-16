import axios from 'axios';
import fs from 'fs';
import path from 'path';
import moment from 'moment-timezone';

async function execute({ api, event, Users, Threads }) {
  if (event.logMessageType !== "log:subscribe") return;

  const { addedParticipants } = event.logMessageData;
  const botUserID = await api.getCurrentUserID();

  // جلب معلومات القروب مرة واحدة
  let threadInfo;
  try {
    threadInfo = await api.getThreadInfo(event.threadID);
  } catch {
    return console.error("Failed to get thread info");
  }
  const membersCountAll = threadInfo.participantIDs.length;
  const threadName = threadInfo.threadName || "Unknown";

  // التأكد من وجود مجلد cache
  const cacheDir = path.join(process.cwd(), 'cache');
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  for (const participant of addedParticipants) {
    if (participant.userFbId === botUserID) continue; // تجاهل إضافة البوت

    let profileName = "Unknown";
    let profilePictureUrl = "";

    try {
      const userInfo = await api.getUserInfo(participant.userFbId);
      profileName = userInfo[participant.userFbId]?.name || "Unknown";
      profilePictureUrl = `https://graph.facebook.com/${participant.userFbId}/picture?width=512&height=512`;
    } catch {
      console.warn(`Failed to get info for user ${participant.userFbId}`);
    }

    const currentTime = moment().tz("Africa/Casablanca").format("hh:mm A");
    const formattedTime = currentTime.replace('AM', 'صباحًا').replace('PM', 'مساءً');

    const welcomeMessage = `◆❯━━━━━▣✦▣━━━━━━❮◆\n≪ إشــعــار بــالإنــضــمــام ≫\n👥 | الأسـمـاء : 『${profileName}』\n الـتـرتـيـب : 『${membersCountAll}』\n | إسـم الـمـجـموعـة :『${threadName}』\n| بـ تـاريـخ : ${moment().tz("Africa/Casablanca").format("YYYY-MM-DD")}\n| عـلـى الـوقـت : ${formattedTime}\n『لا تـسـئ الـلـفـظ وإن ضـاق بـك لا🔖』\n◆❯━━━━━▣✦▣━━━━━━❮◆`;

    await sendWelcomeMessage(api, event.threadID, welcomeMessage, profilePictureUrl, membersCountAll, profileName, threadName, cacheDir);
  }
}

// دالة لاختيار خلفية عشوائية
function getRandomBackground() {
  const backgrounds = [
    "https://i.imgur.com/dDSh0wc.jpeg",
    "https://i.imgur.com/UucSRWJ.jpeg",
    "https://i.imgur.com/OYzHKNE.jpeg",
    "https://i.imgur.com/V5L9dPi.jpeg",
    "https://i.imgur.com/M7HEAMA.jpeg",
    "https://i.imgur.com/MnAwD8U.jpg",
    "https://i.imgur.com/tSkuyIu.jpg",
    "https://i.ibb.co/rvft0WP/923823d1a27d17d3319c4db6c0efb60c.jpg",
    "https://i.ibb.co/r4fMzsC/beautiful-fantasy-wallpaper-ultra-hd-wallpaper-4k-sr10012418-1706506236698-cover.webp",
    "https://i.ibb.co/Tm01gpv/peaceful-landscape-beautiful-background-wallpaper-nature-relaxation-ai-generation-style-watercolor-l.jpg",
    "https://i.ibb.co/qCsmcb6/image-13.png"
  ];
  return backgrounds[Math.floor(Math.random() * backgrounds.length)];
}

// إرسال رسالة الترحيب
async function sendWelcomeMessage(api, threadID, message, avatarUrl, membersCount, profileName, threadName, cacheDir) {
  try {
    const background = getRandomBackground();
    const apiUrl = `https://api.popcat.xyz/welcomecard?background=${encodeURIComponent(background)}&text1=${encodeURIComponent(profileName)}&text2=${encodeURIComponent('مرحبا بك إلى ' + threadName)}&text3=${encodeURIComponent('أنت العضو رقم ' + membersCount)}&avatar=${encodeURIComponent(avatarUrl)}`;

    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

    const imagePath = path.join(cacheDir, `welcome_${Date.now()}.png`);
    fs.writeFileSync(imagePath, response.data);

    await api.sendMessage({
      body: message,
      attachment: fs.createReadStream(imagePath),
    }, threadID);

    // حذف الصورة بعد إرسال الرسالة
    fs.unlink(imagePath, (err) => {
      if (err) console.error("Failed to delete temp welcome image:", err);
    });
  } catch (error) {
    console.error('Error sending welcome message:', error);
    await api.sendMessage("❌ حدث خطأ أثناء إرسال رسالة الترحيب.", threadID);
  }
}

export default {
  name: "ترحيب",
  description: "يرسل رسالة ترحيب عند إضافة شخص جديد إلى المجموعة.",
  execute,
};
