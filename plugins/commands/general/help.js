const config = {
    name: "اوامر",
    _name: { "ar_SY": "الاوامر" },
    aliases: ["أوامر", "الاوامر", "الأوامر", "help", "cmds", "commands"],
    version: "1.0.7",
    description: "عرض جميع الأوامر أو تفاصيل أمر محدد مع صورة",
    usage: "[اسم_الأمر] (اختياري)",
    credits: "XaviaBot"
}

const langData = {
    "ar_SY": {
        "help.list": "╭───── • ◆ • ─────╮\n          قـائـمـة الأوامـر\n╰───── • ◆ • ─────╯\n\n{list}\n\n━━━━━━━━━━━━━━━\n📌 المجموع: {total} أمر\n💡 استخدم {syntax} [اسم الأمر] للتفاصيل\n━━━━━━━━━━━━━━━",
        "help.commandNotExists": "❌ الأمر '{command}' غير موجود في ذاكرتي.",
        "help.commandDetails": "╭───── • 💠 • ─────╮\n         تـفـاصـيـل الأمـر\n╰───── • 💠 • ─────╯\n\n➤ الاسم: {name}\n➤ البدائل: {aliases}\n➤ الوصف: {description}\n➤ الاستخدام: {usage}\n➤ الصلاحية: {permissions}\n➤ الفئة: {category}\n➤ الانتظار: {cooldown} ثانية\n➤ المصدر: {credits}\n━━━━━━━━━━━━━━━",
        "0": "عضو", "1": "إدارة المجموعة", "2": "إدارة البوت"
    }
}

function getCommandName(commandName) {
    if (global.plugins.commandsAliases.has(commandName)) return commandName;
    for (let [key, value] of global.plugins.commandsAliases) {
        if (value.includes(commandName)) return key;
    }
    return null;
}

async function onCall({ message, args, getLang, userPermissions, prefix, data }) {
    const { commandsConfig } = global.plugins;
    const commandName = args[0]?.toLowerCase();
    const helpImage = "https://i.ibb.co/PJK2n1N/Messenger-creation-2-DBBF1-E2-3696-464-A-BA72-D62-B034-DA8-F1.jpg";

    if (!commandName) {
        let commands = {};
        const language = data?.thread?.data?.language || global.config.LANGUAGE || 'ar_SY';

        for (const [key, value] of commandsConfig.entries()) {
            if (!!value.isHidden) continue;
            if (!!value.isAbsolute ? !global.config?.ABSOLUTES.some(e => e == message.senderID) : false) continue;
            if (!value.hasOwnProperty("permissions")) value.permissions = [0, 1, 2];
            if (!value.permissions.some(p => userPermissions.includes(p))) continue;

            if (!commands.hasOwnProperty(value.category)) commands[value.category] = [];
            commands[value.category].push(value._name && value._name[language] ? value._name[language] : key);
        }

        let list = "";
        for (const category in commands) {
            list += `\n◈ ⌈ ${category.toUpperCase()} ⌋\n`;
            list += `  ╰┈➤ ${commands[category].join(", ")}\n`;
        }

        const body = getLang("help.list", {
            total: Object.values(commands).map(e => e.length).reduce((a, b) => a + b, 0),
            list: list.trim(),
            syntax: prefix + config.name
        });

        try {
            const stream = await global.utils.getStreamFromURL(helpImage);
            message.reply({ body: body, attachment: stream });
        } catch (e) {
            message.reply(body);
        }
    } else {
        const command = commandsConfig.get(getCommandName(commandName, commandsConfig));
        if (!command) return message.reply(getLang("help.commandNotExists", { command: commandName }));

        const isHidden = !!command.isHidden;
        const isUserValid = !!command.isAbsolute ? global.config?.ABSOLUTES.some(e => e == message.senderID) : true;
        const isPermissionValid = command.permissions.some(p => userPermissions.includes(p));
        
        if (isHidden || !isUserValid || !isPermissionValid)
            return message.reply(getLang("help.commandNotExists", { command: commandName }));

        message.reply(getLang("help.commandDetails", {
            name: command.name,
            aliases: command.aliases.join(", ") || "لا يوجد",
            version: command.version || "1.0.0",
            description: command.description || 'لا يوجد وصف',
            usage: `${prefix}${command.name} ${command.usage || ''}`,
            permissions: command.permissions.map(p => getLang(String(p))).join(", "),
            category: command.category,
            cooldown: command.cooldown || 3,
            credits: command.credits || "XaviaBot"
        }).replace(/^ +/gm, ''));
    }
}

export default { config, langData, onCall }
