const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const log = require('./logs.js');
const replybot = require('./reply.json');
const config = require('./config.json');
const Database = {};
const dir = './banned'
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
            break;
        case "accept":
            bot.sendMessage(chatId, replybot.acceptrules)
            bot.deleteMessage(chatId, callbackQuery.message.message_id);
            messageartist(chatId, 1);
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
            break;
        case "decline":
            bot.deleteMessage(chatId, callbackQuery.message.message_id);
            bot.sendMessage(chatId, replybot.declineReply).then(e => {
                setTimeout(() => { bot.deleteMessage(chatId, e.message_id); }, 5000)
            });
            break;
        case "back":
            bot.deleteMessage(chatId, callbackQuery.message.message_id);
            let callbackData2 = callbackQuery.data.split(" ")[1];
            if(callbackData2 == "welcome") {
                welcomemsg(chatId, callbackQuery.message.chat.first_name)
            }
            if(callbackData2)
            break;

        case "username":
            if(!Database[chatId]) return;
            //console.log(Database[chatId])
            if(Database[chatId].nick == false) {
                Database[chatId].nick = true;
                bot.deleteMessage(chatId, Database[chatId].message.message_id);
                buttons(Database[chatId].msg, true);
            } else {
                Database[chatId].nick = false;
                bot.deleteMessage(chatId, Database[chatId].message.message_id);
                buttons(Database[chatId].msg, false);
            }
            break;
        
        case "artist":
            if(!Database[chatId]) return;
            bot.sendMessage(chatId, replybot.sendArtist);
            messageartist(chatId, 2);
            break;
        
        case "review":
            if(!Database[chatId]) return;
            if(!Database[chatId].artist) return bot.sendMessage(chatId, replybot.provideartist);
            bot.deleteMessage(chatId, Database[chatId].message.message_id);
            copy(chatId);
            bot.sendMessage(chatId, replybot.sent);
            Database[chatId].artist = null
            break;

        case "accepted":
            let splitted1 = callbackQuery.message.caption.split('\n');
            let good = [];
            for(let i = 0; i < splitted1.length-2; i++) {
                good.push(splitted1[i]);
            }
            const senderIdAccept = callbackQuery.data.split(" ")[1];
            bot.copyMessage(config.channel, callbackQuery.message.chat.id, callbackQuery.message.message_id, { caption: good.join('\n') }).then(e=>setTimeout(() => bot.deleteMessage(chatId, callbackQuery.message.message_id), 2000));
            bot.sendMessage(Number.parseInt(senderIdAccept), replybot.acceptwyslanie);
            bot.sendMessage(chatId, replybot.zaakceptowales)
            break;
        
        case "declined":
            const senderIdDecline = callbackQuery.data.split(" ")[1];
            bot.sendMessage(Number.parseInt(senderIdDecline), replybot.declinedMessage);
            bot.deleteMessage(chatId, callbackQuery.message.message_id);
            bot.sendMessage(chatId, replybot.declineReplyart)
            break;

        case "ban":
            const senderIdban = callbackQuery.data.split(" ")[1];
            bot.sendMessage(chatId, replybot.banreason);
            messageban(chatId, 1,Number.parseInt(senderIdban));
            break;
        default:
            break;
    }
});

function messageartist(chatid, type) {
        let time = Date.now();
        bot.once('message', msg => {
            if(Date.now() - time > 120000) return;
            if(msg.chat.id !== chatid) messageartist(chatid, type);
            console.log(msg.chat.id, chatid, type);
            if(type == 1) {
                if(!msg.photo) return bot.sendMessage(chatid, 'This is not an image, aborted');
                buttons(msg, true);
            }
            if(type == 2) {
                if(!msg.text) return;
                Database[chatid].artist = msg.text.toString();
                bot.deleteMessage(chatid, Database[chatid].message.message_id).then(m=>{
                    buttons(Database[chatid].msg, Database[chatid].nick);
                }).catch(e=>{});
            }
        });
    };

function messageban(chatid, type, banid) {
        let time = Date.now();
        bot.once('message', msg => {
        if(Date.now() - time > 120000) return;
        if(msg.chat.id !== chatid) messageban(chatid, type, banid);
            if(type == 1) {
                if(!msg.text) return;
                Database[banid].ban = msg.text
                    fs.writeFileSync(`./banned/${Database[banid].msg.chat.id}.txt`, `Username: @${Database[banid].msg.chat.username}\nID: ${Database[banid].msg.chat.id}\nReason: ${Database[banid].ban}`);
                    bot.sendMessage(Database[banid].msg.chat.id, replybot.yourebanned.replace("{reason}", msg.text))
                }
        }
    )
}

function buttons(msg, value) {
    let nick = value;
    if(Database[msg.chat.id] == undefined) Database[msg.chat.id] = {nick: true, message: null, msg: msg, artist: null, ban: null};
    Database[msg.chat.id].msg = msg;
    if(nick == true) {

    bot.copyMessage(msg.chat.id, msg.chat.id, msg.message_id, {
        reply_markup: JSON.stringify ({
            inline_keyboard: [
               withNickname
            ]
        })

    }).then(m=>Database[msg.chat.id].message = m);
        //bot.sendMessage(msg.chat.id, msg.chat.username);

    } else {
    
    bot.copyMessage(msg.chat.id, msg.chat.id, msg.message_id, {
        reply_markup: JSON.stringify ({
            inline_keyboard: [
               noNickname
            ]
        })

    }).then(m=>Database[msg.chat.id].message = m);

    }
}

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
        caption: `Sent by: ${Database[chatId].nick ? '@'+Database[chatId].msg.chat.username : 'Anon'}\nArtist: ${Database[chatId].artist}\nSent via bot\ndev: @${Database[chatId].msg.chat.username}\ndev: ${Database[chatId].msg.chat.id}`,
        reply_markup: JSON.stringify ({
            inline_keyboard: [
               verifyart
            ]
        })
    });
}