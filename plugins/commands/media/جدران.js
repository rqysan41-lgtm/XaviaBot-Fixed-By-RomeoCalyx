const config = {
    name: "جدران",
    aliases: ["anhnen", "wp"],
    credits: "XaviaTeam"
}

function onCall({ message }) {
    global.GET(`${global.xva_api.main}/wallpaper`)
        .then(async res => {
            try {
                let imgStream = await global.getStream(res.data.url);
                message.reply({
                    body: res.data.url,
                    attachment: imgStream
                });
            } catch {
                message.reply("خطاء !");
            }
        })
        .catch(_ => message.reply("Error!"));
}

export default {
    config,
    onCall
}
