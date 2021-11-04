let messageartist = (chatid, type, bot, buttons, Database) => {
    //console.log(bot)
    let time = Date.now();
    bot.once('message', msg => {
        if(Date.now() - time > 120000) return;
        if(msg.chat.id !== chatid) {
             messageartist(chatid, type, bot, buttons, Database); return
        }
        console.log(msg.chat.id, chatid, type);
        if(type == 1) {
            Database[chatid].msg = msg
            if(!msg.photo) return bot.sendMessage(chatid, 'This is not an image, aborted');
            buttons(Database, Database[chatid].msg, chatid, bot);
        }
        if(type == 2) {
            if(!msg.text) return;
            Database[chatid].artist = msg.text.toString();
            bot.deleteMessage(chatid, Database[chatid].message.message_id).then(m=>{
                buttons(Database, Database[chatid].msg, chatid, bot);
            }).catch(e=>{});
        }
    });
};
module.exports = messageartist;