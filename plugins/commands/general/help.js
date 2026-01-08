const config = {
    name: "اوامر", // بدل help
    aliases: ["مساعدة", "commands"],
    description: "يعرض قائمة الأوامر مع صورة توضيحية.", 
    usage: "[اسم_الأمر]",
    cooldown: 3,
    permissions: [0, 1, 2],
    credits: "Dora Team",
};

const langData = {
    ar_SY: {
        mainMessage: "",
        commandNotExists: "⚠️ الأمر '{command}' غير موجود!",
        commandDetails: 
`🔹 الاسم: {name}
🔹 الألقاب: {aliases}
🔹 الإصدار: {version}
🔹 الوصف: {description}
🔹 الاستخدام: {usage}
🔹 الصلاحيات: {permissions}
🔹 الفئة: {category}
🔹 مهلة الاستخدام: {cooldown} ثانية
🔹 المطور: {credits}`
    }
};

async function onCall({ message, args, getLang, userPermissions, prefix }) {
    const { commandsConfig } = global.plugins;
    const commandName = args[0]?.toLowerCase();

    // رابط الصورة للرسالة
    const helpImage = "https://i.ibb.co/PJK2n1N/Messenger-creation-2-DBBF1-E2-3696-464-A-BA72-D62-B034-DA8-F1.jpg";

    if (!commandName) {
        let commands = {};
        const language = message.thread?.data?.language || global.config.LANGUAGE || 'ar_SY';

        // ترتيب الأوامر وتجميعها حسب الفئة
        for (const [key, value] of commandsConfig.entries()) {
            if (!!value.isHidden) continue;
            if (!!value.isAbsolute ? !global.config?.ABSOLUTES.some(e => e == message.senderID) : false) continue;
            if (!value.hasOwnProperty("permissions")) value.permissions = [0, 1, 2];
            if (!value.permissions.some(p => userPermissions.includes(p))) continue;
            if (!commands.hasOwnProperty(value.category)) commands[value.category] = [];
            commands[value.category].push(value._name && value._name[language] ? value._name[language] : key);
        }

        // بناء قائمة الأوامر بشكل أفقي
        let formattedCommands = "";
        Object.keys(commands).forEach(category => {
            const horizontalCmds = commands[category].map(cmd => `💠 ${cmd}`).join(" ");
            formattedCommands += `💬 ─── ${category} ───\n  ${horizontalCmds}\n\n`;
        });

        // إرسال الصورة مع قائمة الأوامر
        await message.send({
            body: `${getLang("mainMessage")}\n\n${formattedCommands}`,
            attachment: await global.utils.getStreamFromURL(helpImage)
        });

    } else {
        const command = commandsConfig.get(commandName) || commandsConfig.get(getCommandName(commandName, commandsConfig));
        if (!command) return message.reply(getLang("commandNotExists", { command: commandName }));

        const isHidden = !!command.isHidden;
        const isUserValid = !!command.isAbsolute ? global.config?.ABSOLUTES.some(e => e == message.senderID) : true;
        const isPermissionValid = command.permissions.some(p => userPermissions.includes(p));
        if (isHidden || !isUserValid || !isPermissionValid)
            return message.reply(getLang("commandNotExists", { command: commandName }));

        message.reply(getLang("commandDetails", {
            name: command.name,
            aliases: command.aliases.join(", "),
            version: command.version || "1.0.0",
            description: command.description || '',
            usage: `${prefix}${commandName} ${command.usage || ''}`,
            permissions: command.permissions.map(p => getLang(String(p))).join(", "),
            category: command.category,
            cooldown: command.cooldown || 3,
            credits: command.credits || ""
        }).replace(/^ +/gm, ''));
    }
}

export default {
    config,
    langData,
    onCall,
};
