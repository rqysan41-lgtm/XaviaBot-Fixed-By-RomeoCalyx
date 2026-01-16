import { log } from "../logger/index.js";

export default {
  name: "threadUpdate",
  execute: async ({ api, event, Threads }) => {
    try {
      // جلب بيانات المجموعة
      const threadsData = await Threads.find(event.threadID);
      let threads = threadsData?.data?.data || {};

      // إنشاء بيانات المجموعة إذا لم تكن موجودة
      if (!threads || Object.keys(threads).length === 0) {
        await Threads.create(event.threadID);
        threads = {};
      }

      // التعامل مع أنواع التحديث المختلفة
      switch (event.logMessageType) {
        case "log:thread-name":
          await handleThreadName(api, event, Threads, threads);
          break;
        case "change_thread_admins":
          await handleAdminChange(api, event, Threads, threads);
          break;
        case "change_thread_approval_mode":
          await handleApprovalModeChange(api, event, Threads, threads);
          break;
        case "log:thread-icon":
          await handleThreadIconChange(api, event, Threads, threads);
          break;
        case "change_thread_nickname":
          await handleNicknameChange(api, event, Threads, threads);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Error handling thread update:", error);
    }
  },
};

// ----------------- الدوال المساعدة -----------------

async function handleNicknameChange(api, event, Threads, threads) {
  try {
    threads.data = threads.data || {};
    threads.data.oldNicknames = threads.data.oldNicknames || {};

    const { userID, newNickname } = event.logMessageData;

    if (threads.anti?.nicknameBox) {
      try {
        await api.setUserNickname(userID, threads.data.oldNicknames[userID] || "");
      } catch {}
      try {
        await api.sendMessage(
          `❌ | ميزة حماية الكنية مفعلة، لم يتم تغيير كنية العضو 🔖 |<${event.threadID}>`,
          event.threadID
        );
      } catch {}
      return;
    }

    // تحديث الكنية القديمة
    threads.data.oldNicknames[userID] = newNickname;
    await Threads.update(event.threadID, { data: threads.data });

    const adminName = await getUserName(api, event.author);
    try {
      await api.sendMessage(
        `تم تغيير كنية العضو <${userID}> إلى: ${newNickname} 🔖 | بواسطة: ${adminName}`,
        event.threadID
      );
    } catch {}
  } catch (err) {
    console.error("handleNicknameChange error:", err);
  }
}

async function handleThreadName(api, event, Threads, threads) {
  try {
    const oldName = threads.name || "";
    const { name: newName } = event.logMessageData;

    if (threads.anti?.nameBox) {
      try { await api.setTitle(oldName, event.threadID); } catch {}
      try {
        await api.sendMessage(
          `❌ | ميزة حماية الاسم مفعلة، لم يتم تغيير اسم المجموعة 🔖 |<${event.threadID}>`,
          event.threadID
        );
      } catch {}
      return;
    }

    await Threads.update(event.threadID, { name: newName });
    const adminName = await getUserName(api, event.author);

    try {
      await api.sendMessage(
        `تم تغيير الاسم الجديد للمجموعة إلى: 🔖 | 『${newName}』 بواسطة: ${adminName}`,
        event.threadID
      );
    } catch {}
  } catch (err) {
    console.error("handleThreadName error:", err);
  }
}

async function handleAdminChange(api, event, Threads, threads) {
  try {
    const adminIDs = threads.adminIDs || [];
    const { TARGET_ID, ADMIN_EVENT } = event.logMessageData;

    if (ADMIN_EVENT === "add_admin" && !adminIDs.includes(TARGET_ID)) {
      adminIDs.push(TARGET_ID);
    }

    if (ADMIN_EVENT === "remove_admin") {
      const index = adminIDs.indexOf(TARGET_ID);
      if (index > -1) adminIDs.splice(index, 1);
    }

    await Threads.update(event.threadID, { adminIDs });

    const action = ADMIN_EVENT === "add_admin" ? "✅ إضافة" : "❌ إزالة";
    const adminName = await getUserName(api, TARGET_ID);

    try {
      await api.sendMessage(
        `🔖 | تمت ${action} ${adminName} كآدمن في المجموعة`,
        event.threadID
      );
    } catch {}
  } catch (err) {
    console.error("handleAdminChange error:", err);
  }
}

async function handleApprovalModeChange(api, event, Threads, threads) {
  try {
    const { APPROVAL_MODE } = event.logMessageData;
    await Threads.update(event.threadID, {
      approvalMode: APPROVAL_MODE === 1 ? true : false,
    });

    const action = APPROVAL_MODE === 1 ? "✅ تفعيل" : "❌ تعطيل";
    try {
      await api.sendMessage(
        `تم ${action} ميزة الموافقة في المجموعة 🔖 |<${event.threadID}>`,
        event.threadID
      );
    } catch {}
  } catch (err) {
    console.error("handleApprovalModeChange error:", err);
  }
}

async function handleThreadIconChange(api, event, Threads, threads) {
  try {
    threads.data = threads.data || {};
    const { threadThumbnail: newIcon } = event.logMessageData;
    const oldIcon = threads.data.threadThumbnail || null;
    threads.data.threadThumbnail = newIcon;

    await Threads.update(event.threadID, { data: threads.data });

    const adminName = await getUserName(api, event.author);

    try {
      await api.sendMessage(
        `تم تغيير صورة المجموعة بواسطة: ${adminName}`,
        event.threadID
      );
    } catch {}
  } catch (err) {
    console.error("handleThreadIconChange error:", err);
  }
}

// الحصول على اسم المستخدم
async function getUserName(api, userID) {
  try {
    const userInfo = await api.getUserInfo(userID);
    return userInfo?.[userID]?.name || "Unknown";
  } catch {
    return "Unknown";
  }
}
