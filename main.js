const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const log = require('./logs.js');
const replybot = require('./reply.json');
const config = require('./config.json');
const Database = {};
const dir = './banned'
const messageartist = require("./modules/messageartist")
const messageban = require("./modules/messageban")
const buttons = require("./modules/buttons")
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {
        recursive: true
    });
}
const token = config.token;

let bot = new TelegramBot(token, {polling: true});
log.log(replybot.botstart);

bot.on("polling_error", console.log);

function welcomemsg(chatId, username) {
    bot.sendMessage(chatId, replybot.mainmessage.replace("{name}", username), {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [
                    {
                        text:"Submit art",
                        callback_data: 'sumbit'
                    },
                    {
                        text: "Contact",
                        callback_data: 'contact'
                    }
                ],
            ],
        }),
    }
);
}
bot.on('message', (msg) => {
    /*console.log(msg.photo[msg.photo.length-1]);
    //console.log(msg)
    bot.copyMessage(msg.chat.id, msg.chat.id, msg.message_id)
    return;*/
    let start = "/help";
    let start2 = "/start";
    if(!msg.text) return;
    if(msg.text.toString().startsWith('/unban') && msg.chat.id == 431324710) { try { fs.unlinkSync(`./banned/${msg.text.toString().split(' ')[1]}.txt`) } catch(e) {} };
    if(fs.readdirSync('./banned', { encoding: "utf-8" }).includes(msg.chat.id+'.txt')) return;
    if (msg.text.toString().toLowerCase() == start || msg.text.toString().toLowerCase() == start2) {
        console.log(msg.chat.id)
        welcomemsg(msg.chat.id, msg.from.first_name)
    }

});

bot.on("callback_query", callbackQuery => {
    let chatId = callbackQuery.message.chat.id;
    let callbackData = callbackQuery.data.split(" ")[0];
 
    switch (callbackData) {
        case "sumbit":

            bot.sendMessage(chatId, replybot.rules, {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [
                            {
                                text:"✔️",
                                callback_data: 'accept'
                            },
                            {
                                text: "❌",
                                callback_data: 'decline'
                            }
                        ]
                    ],
                }),
            });
            bot.answerCallbackQuery(callbackQuery.id);
            break;
        case "accept":
            if(Database[chatId] == undefined) Database[chatId] = {nick: true, message: null, msg: null, artist: null, ban: null};
            else Database[chatId].msg = null
            bot.sendMessage(chatId, replybot.acceptrules)
            //console.log(Database)
            messageartist(chatId, 1, bot, buttons, Database);
            bot.deleteMessage(chatId, callbackQuery.message.message_id);
            bot.answerCallbackQuery(callbackQuery.id);
            break;
        case "contact":
            bot.deleteMessage(chatId, callbackQuery.message.message_id);
            bot.sendMessage(chatId, replybot.contact, {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [
                            {
                                text:"back",
                                callback_data: 'back welcome',
                            }
                        ]
                    ],
                }),
            });
            bot.answerCallbackQuery(callbackQuery.id);
            break;
        case "decline":
            bot.answerCallbackQuery(callbackQuery.id);
            bot.deleteMessage(chatId, callbackQuery.message.message_id);
            bot.sendMessage(chatId, replybot.declineReply).then(e => {
                setTimeout(() => { bot.deleteMessage(chatId, e.message_id); }, 5000)
            });
            break;
        case "back":
            bot.answerCallbackQuery(callbackQuery.id);
            bot.deleteMessage(chatId, callbackQuery.message.message_id);
            let callbackData2 = callbackQuery.data.split(" ")[1];
            if(callbackData2 == "welcome") {
                return welcomemsg(chatId, callbackQuery.message.chat.first_name)
            }
            break;

        case "username":
            bot.answerCallbackQuery(callbackQuery.id);
            if(!Database[chatId]) return;
            //console.log(Database[chatId])
            //console.log(Database)
            Database[chatId].nick = !Database[chatId].nick;
            bot.deleteMessage(chatId, Database[chatId].message.message_id);
            buttons(Database, Database[chatId].msg, chatId, bot);
            break;
        
        case "artist":
            bot.answerCallbackQuery(callbackQuery.id);
            if(!Database[chatId]) return;
            bot.sendMessage(chatId, replybot.sendArtist);
            messageartist(chatId, 2, bot, buttons, Database);
            break;
        
        case "review":
            bot.answerCallbackQuery(callbackQuery.id);
            if(!Database[chatId]) return;
            if(!Database[chatId].artist) return bot.sendMessage(chatId, replybot.provideartist);
            bot.deleteMessage(chatId, Database[chatId].message.message_id);
            copy(chatId);
            bot.sendMessage(chatId, replybot.sent);
            Database[chatId].artist = null
            break;

        case "accepted":
            bot.answerCallbackQuery(callbackQuery.id);
            let splitted1 = callbackQuery.message.caption.split('\n');
            let good = [];
            for(let i = 0; i < splitted1.length-2; i++) {
                good.push(splitted1[i]);
            }
            const senderIdAccept = callbackQuery.data.split(" ")[1];
            bot.copyMessage(config.channel, callbackQuery.message.chat.id, callbackQuery.message.message_id, { caption: good.join('\n') }).then(e=>setTimeout(() => bot.deleteMessage(chatId, callbackQuery.message.message_id), 2000));
            bot.sendMessage(Number.parseInt(senderIdAccept), replybot.sendaccept);
            bot.sendMessage(chatId, replybot.accepted)
            break;
        
        case "declined":
            bot.answerCallbackQuery(callbackQuery.id);
            const senderIdDecline = callbackQuery.data.split(" ")[1];
            bot.sendMessage(Number.parseInt(senderIdDecline), replybot.declinedMessage);
            bot.deleteMessage(chatId, callbackQuery.message.message_id);
            bot.sendMessage(chatId, replybot.declineReplyart)
            break;

        case "ban":
            bot.answerCallbackQuery(callbackQuery.id);
            const senderIdban = callbackQuery.data.split(" ")[1];
            bot.sendMessage(chatId, replybot.banreason);
            messageban(chatId, 1, senderIdban, bot, Database, fs, replybot);
            break;
        default:
            bot.answerCallbackQuery(callbackQuery.id);
            break;
    }
});



/*setInterval(() => {
    console.log(Database);
}, 2000);*/

/*setInterval(() => {
    console.log(Date.now());
}, 500);*/

function copy(chatId) {

    let verifyart = [
        { text: "✔", callback_data: 'accepted {senderId}' },
        { text: "❌", callback_data: 'declined {senderId}' },
        { text: "🔨", callback_data: 'ban {senderId}' }
    ]

    verifyart.forEach(function(element, index){ 
        verifyart[index].callback_data = element.callback_data.replace("{senderId}", chatId.toString()); 
    });

    bot.copyMessage(config.reviewer, Database[chatId].msg.chat.id, Database[chatId].msg.message_id, {
        caption: `Sent by: ${Database[chatId].nick ? '@'+Database[chatId].msg.chat.username : 'Anon'}\nArtist: ${Database[chatId].artist}\nSent via @GaySubmitBot\ndev: @${Database[chatId].msg.chat.username}\ndev: ${Database[chatId].msg.chat.id}`,
        reply_markup: JSON.stringify ({
            inline_keyboard: [
               verifyart
            ]
        })
    });
}