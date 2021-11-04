let buttons = (Database, msg, chatId, bot) => {
    const withNickname = [
        { text: "@: ✔", callback_data: 'username' },
        { text: "Artist", callback_data: 'artist'},
        { text: "Back", callback_data: "back"},
        { text: "Send", callback_data: "review"}
    ]
    
    const noNickname = [
        { text: "@: ❌", callback_data: 'username' },
        { text: "Artist", callback_data: 'artist'},
        { text: "Back", callback_data: "back"},
        { text: "Send", callback_data: "review"}
    ]
    //console.log(Database)
    if(Database[chatId].nick == true) {

        bot.copyMessage(chatId, chatId, msg.message_id, {
            reply_markup: JSON.stringify ({
                inline_keyboard: [
                withNickname
                ]
            })

    }).then(m=>Database[chatId].message = m);
        //bot.sendMessage(chatId, msg.chat.username);

    } else {
    
        bot.copyMessage(chatId, chatId, msg.message_id, {
            reply_markup: JSON.stringify ({
                inline_keyboard: [
                noNickname
                ]
            })

        }).then(m=>Database[chatId].message = m);

    }
}
module.exports = buttons;