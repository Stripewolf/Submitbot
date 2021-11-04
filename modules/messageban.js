let messageban = (chatid, type, banid, bot, Database, fs, replybot) => {
    let time = Date.now();
    bot.once('message', msg => {
    if(Date.now() - time > 120000) return;
    if(msg.chat.id !== chatid) {
        messageban(chatid, type, banid, bot, Database, fs, replybot); return 
    }
        if(type == 1) {
            if(!msg.text) return;
            Database[banid].ban = msg.text
                fs.writeFileSync(`./banned/${Database[banid].msg.chat.id}.txt`, `Username: @${Database[banid].msg.chat.username}\nID: ${Database[banid].msg.chat.id}\nReason: ${Database[banid].ban}`);
                bot.sendMessage(Database[banid].msg.chat.id, replybot.yourebanned.replace("{reason}", msg.text))
            }
    })
}
module.exports = messageban;