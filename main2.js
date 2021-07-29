const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const log = require('./logi.js');
const odpowiedzi = require('./reply.json');
const config = require('./config.json');
const superBazaDanych = {};

const token = config.token;
let bot = new TelegramBot(token, {polling: true});
log.log('bot odpalony o tak o');

bot.on("polling_error", console.log);

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
        bot.sendMessage(msg.chat.id, "Hey " + msg.from.first_name +  odpowiedzi.mainmessage, {
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

});

bot.on("callback_query", callbackQuery => {
    let chatId = callbackQuery.message.chat.id;
    let callbackData = callbackQuery.data;

    switch (callbackData) {
        case "sumbit":
            bot.sendMessage(chatId, odpowiedzi.rules, {
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
            bot.sendMessage(chatId, odpowiedzi.acceptrules)
            bot.deleteMessage(chatId, callbackQuery.message.message_id);
            wiadomosc(chatId, 1);
            break;
        case "contact":
            bot.sendMessage(chatId, odpowiedzi.contact, {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [
                            {
                                text:"back",
                                callback_data: 'back'
                            }
                        ]
                    ],
                }),
            });
            break;
        case "decline":
            bot.deleteMessage(chatId, callbackQuery.message.message_id);
            bot.sendMessage(chatId, odpowiedzi.declineReply).then(e => {
                setTimeout(() => { bot.deleteMessage(chatId, e.message_id); }, 5000)
            });
            break;
        case "back":
            bot.deleteMessage(chatId, callbackQuery.message.message_id);
            break;

        case "username":
            if(!superBazaDanych[chatId]) return;
            //console.log(superBazaDanych[chatId])
            if(superBazaDanych[chatId].nick == false) {
                superBazaDanych[chatId].nick = true;
                bot.deleteMessage(chatId, superBazaDanych[chatId].wiadomosc.message_id);
                przyciski(superBazaDanych[chatId].msg, true);
            } else {
                superBazaDanych[chatId].nick = false;
                bot.deleteMessage(chatId, superBazaDanych[chatId].wiadomosc.message_id);
                przyciski(superBazaDanych[chatId].msg, false);
            }
            break;
        
        case "artist":
            if(!superBazaDanych[chatId]) return;
            bot.sendMessage(chatId, odpowiedzi.sendArtist);
            wiadomosc(chatId, 2);
            break;
        
        case "review":
            if(!superBazaDanych[chatId]) return;
            if(!superBazaDanych[chatId].artist) return bot.sendMessage(chatId, odpowiedzi.uzupelnijartyste);
            bot.deleteMessage(chatId, superBazaDanych[chatId].wiadomosc.message_id);
            kopiuj(chatId);
            bot.sendMessage(chatId, odpowiedzi.wyslano);
            break;

        case "AHA1":
            let splitted1 = callbackQuery.message.caption.split('\n');
            let good = [];
            for(let i = 0; i < splitted1.length-1; i++) {
                good.push(splitted1[i]);
            }
            bot.copyMessage(config.channel, callbackQuery.message.chat.id, callbackQuery.message.message_id, { caption: good.join('\n') }).then(e=>setTimeout(() => bot.deleteMessage(chatId, callbackQuery.message.message_id), 2000));
            bot.sendMessage(splitted1[splitted1.length-1].replace('dev: ', ''), odpowiedzi.acceptwyslanie);
            bot.sendMessage(chatId, odpowiedzi.zaakceptowales)
            break;
        
        case "AHA2":
            let splitted2 = callbackQuery.message.caption.split('\n')
            bot.sendMessage(splitted2[splitted2.length-1].replace('dev: ', ''), odpowiedzi.declinedMessage);
            bot.deleteMessage(chatId, callbackQuery.message.message_id);
            bot.sendMessage(chatId, odpowiedzi.declineReplyart)
            break;

        case "AHA3":
            let splitted3 = callbackQuery.message.caption.split('\n')
            fs.writeFileSync(`./banned/${splitted3[splitted3.length-1].replace('dev: ', '')}.txt`, 'zbanowany');
            break;

        default:
            break;
    }
});

function wiadomosc(chatid, type) {
    artysta(chatid, type);
    function artysta(chatid, type) {
        let time = Date.now();
        bot.once('message', msg => {
            if(Date.now() - time > 120000) return;
            if(msg.chat.id !== chatid) artysta(chatid, type);
            console.log(msg.chat.id, chatid, type);
            if(type == 1) {
                if(!msg.photo) return bot.sendMessage(chatid, 'This is not an image, aborted');
                przyciski(msg, true);
            }
            if(type == 2) {
                if(!msg.text) return;
                superBazaDanych[chatid].artist = msg.text.toString();
                bot.deleteMessage(chatid, superBazaDanych[chatid].wiadomosc.message_id).then(m=>{
                    przyciski(superBazaDanych[chatid].msg, superBazaDanych[chatid].nick);
                }).catch(e=>{});
            }
        });
    }
}

function przyciski(msg, wartosc) {
    let nick = wartosc;
    if(superBazaDanych[msg.chat.id] == undefined) superBazaDanych[msg.chat.id] = {nick: true, wiadomosc: null, msg: msg, artist: null};
    superBazaDanych[msg.chat.id].msg = msg;
    if(nick == true) {

    bot.copyMessage(msg.chat.id, msg.chat.id, msg.message_id, {
        reply_markup: JSON.stringify ({
            inline_keyboard: [
               zNickiem
            ]
        })

    }).then(m=>superBazaDanych[msg.chat.id].wiadomosc = m);
        //bot.sendMessage(msg.chat.id, msg.chat.username);

    } else {
    
    bot.copyMessage(msg.chat.id, msg.chat.id, msg.message_id, {
        reply_markup: JSON.stringify ({
            inline_keyboard: [
               bezNicku
            ]
        })

    }).then(m=>superBazaDanych[msg.chat.id].wiadomosc = m);

    }
}

const zNickiem = [
    { text: "@: ✔", callback_data: 'username' },
    { text: "Artist", callback_data: 'artist'},
    { text: "Back", callback_data: "back"},
    { text: "Send", callback_data: "review"}
]

const bezNicku = [
    { text: "@: ❌", callback_data: 'username' },
    { text: "Artist", callback_data: 'artist'},
    { text: "Back", callback_data: "back"},
    { text: "Send", callback_data: "review"}
]

const verifyart = [
    { text: "✔", callback_data: 'AHA1' },
    { text: "❌", callback_data: 'AHA2' },
    { text: "🔨", callback_data: 'AHA3' }
]

/*setInterval(() => {
    console.log(superBazaDanych);
}, 2000);*/

/*setInterval(() => {
    console.log(Date.now());
}, 500);*/

function kopiuj(chatId) {
    bot.copyMessage(config.reviewer, superBazaDanych[chatId].msg.chat.id, superBazaDanych[chatId].msg.message_id, {
        caption: `Sent by: ${superBazaDanych[chatId].nick ? '@'+superBazaDanych[chatId].msg.chat.username : 'Anon'}\nArtist: ${superBazaDanych[chatId].artist}\nSent via bot\ndev: ${superBazaDanych[chatId].msg.chat.id}`,
        reply_markup: JSON.stringify ({
            inline_keyboard: [
               verifyart
            ]
        })
    });
}