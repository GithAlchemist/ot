import { Telegraf } from "telegraf";
import { message } from "telegraf/filters"

import dotenv from "dotenv";
import express from "express";

import { handleError } from "./commands/index.js";
import lang from "./config/lang.js";
import { accountValid } from "./utils/checkVerify.js";
import prisma from "./config/prisma.js"
import keyboard from "./config/keyboard.js";

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const ENVIRONMENT = process.env.NODE_ENV || "";

const bot = new Telegraf(BOT_TOKEN);
const app = express();

app.use(await bot.createWebhook({ domain: process.env.webhookDomain }));

app.get("/", (req, res) => {
    res.send("Bot started");
});


bot.start(async (ctx) => {
    const startPayload = ctx.payload;
    const language_code = ctx.from?.language_code === "fr" ? "fr" : "en";

    const user = await prisma.user.findUnique({
        where: {
            userId: ctx.from.id.toString()
        }
    })

    if (!user) {
        if (startPayload) {
            const userId = startPayload.slice(4);

            const inviter = await prisma.user.update({
                data: {
                    invitedUsers: {
                        increment: 1
                    },
                    amount: {
                        increment: 500
                    }
                },
                where: {
                    userId: userId
                },
                select: {
                    userName: true
                }
            })

            await ctx.reply(`${ctx.from?.language_code === "fr" ? "Tu as été invitée par" : "You have been invited by"} ${inviter.userName} 🎉`);
        }

        await prisma.user.create({
            data: {
                userId: ctx.from.id.toString(),
                userName: ctx.from.first_name,
                lastBonusDate: new Date(2000, 11, 1)
            }
        })
    }

    const isAccountValid = await accountValid(ctx);

    if (!isAccountValid) {
        await ctx.reply(lang[language_code].start(ctx), {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✅ Vérifiez", callback_data: `verify_${ctx.from.id}` }]
                ]
            },
            parse_mode: "HTML",
            link_preview_options: {
                is_disabled: true
            }
        });

        return;
    }

    if (isAccountValid) {
        await ctx.reply("Continue à partager ton lien pour gagner encore plus d’argent. 💰", {
            reply_markup: {
                keyboard: [
                    [{ text: "💰 Mon Solde 💰" }, { text: "Partager ↗️" }],
                    [{ text: "Bonus 🎁" }, 
                    [{ text: "Effectuer un Retrait 🏦" }],
                    [{ text: "📌 Ajoutez un numéro" }, { text: "📋 Procédure 📋" }]
                ],
                resize_keyboard: true
            }
        });
    }

});


bot.command("channel", async (ctx) => {
    console.log(ctx.message.reply_to_message.forward_origin.chat.id)
})

bot.on(message("text"), async (ctx) => {
    const text = ctx.message.text;
    const language_code = ctx.from?.language_code === "fr" ? "fr" : "en";

    const user = await prisma.user.findUnique({
        where: {
            userId: ctx.from.id.toString()
        }
    })

    if (text === "Bonus 🎁") {
        // Calculer la différence en millisecondes
        let difference = new Date() - new Date(user.lastBonusDate);

        // Convertir la différence en heures
        let differenceInHours = difference / 1000 / 60 / 60;

        // Vérifier si la différence est égale à 1 heure
        if (differenceInHours >= 1) {
            await prisma.user.update({
                where: {
                    userId: ctx.from.id.toString()
                },
                data: {
                    amount: {
                        increment: 50,
                    },
                    lastBonusDate: new Date()
                }
            })

            await ctx.reply(lang[language_code].win);
        } else {
            // Définir l'heure donnée et l'heure actuelle
            let givenTime = new Date(user.lastBonusDate);
            let currentTime = new Date();

            // Ajouter une heure (3600000 millisecondes) à l'heure donnée
            let timePlusOneHour = new Date(givenTime.getTime() + 3600000);

            // Calculer la différence en millisecondes
            let timeRemaining = timePlusOneHour - currentTime;

            // Convertir la différence en minutes et secondes
            let minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
            let secondsRemaining = Math.floor((timeRemaining % (1000 * 60)) / 1000);

            await ctx.reply(lang[language_code].bonus(minutesRemaining, secondsRemaining), {
                reply_markup: {
                    keyboard: [
                        [{ text: "💰 Mon Solde 💰" }, { text: "Partager ↗️" }],
                        [{ text: "Bonus 🎁" }, 
                        [{ text: "Effectuer un Retrait 🏦" }],
                        [{ text: "📌 Ajoutez un numéro" }, { text: "📋 Procédure 📋" }]
                    ],
                    resize_keyboard: true
                }
            });
        }
        return;
    }

    if (text === "📌 Ajoutez un numéro" || text === "📌 Add a Number") {
        await ctx.reply(lang[language_code].settings(user), {
            reply_markup: {
                inline_keyboard: keyboard[language_code].settings(ctx)
            }
        })

        return;
    }

    if (text === "💰 Mon Solde 💰" || text === "💰 My Balance 💰") {
        await ctx.reply(lang[language_code].account(user), {
            reply_markup: {
                keyboard: [
                    [{ text: "💰 Mon Solde 💰" }, { text: "Partager ↗️" }],
                    [{ text: "Bonus 🎁" },
                    [{ text: "Effectuer un Retrait 🏦" }],
                    [{ text: "📌 Ajoutez un numéro" }, { text: "📋 Procédure 📋" }]
                ],
                resize_keyboard: true
            }
        })

        return;
    }

    if (text === "Partager ↗️" || text === "Share ↗️") {
        await ctx.reply(lang[language_code].share(ctx, user), {
            reply_markup: {
                keyboard: [
                    [{ text: "💰 Mon Solde 💰" }, { text: "Partager ↗️" }],
                    [{ text: "Bonus 🎁" }, 
                    [{ text: "Effectuer un Retrait 🏦" }],
                    [{ text: "📌 Ajoutez un numéro" }, { text: "📋 Procédure 📋" }]
                ],
                resize_keyboard: true
            }
        });

        return;
    }

    if (text === "📋 Procédure 📋" || text === "📋 Procedure 📋") {
        await ctx.reply(lang[language_code].procedure, {
            reply_markup: {
                keyboard: [
                    [{ text: "💰 Mon Solde 💰" }, { text: "Partager ↗️" }],
                    [{ text: "Bonus 🎁" },
                    [{ text: "Effectuer un Retrait 🏦" }],
                    [{ text: "📌 Ajoutez un numéro" }, { text: "📋 Procédure 📋" }]
                ],
                resize_keyboard: true
            }
        });

        return;
    }

    if (text === "Effectuer un Retrait 🏦" || text === "Make a Withdrawal 🏦") {
        if (user.amount < 6000) {
            await ctx.reply(lang[language_code].min(user.amount));

            return;
        }
        if (!user.accountNumber) {
            await ctx.reply(lang[language_code].num);

            return;
        }

        await prisma.user.update({
            where: {
                userId: ctx.from.id.toString()
            },
            data: {
                status: "withdraw"
            }
        })

        await ctx.reply(lang[language_code].withdrawEx);

        return;
    }

      
});

bot.catch(handleError);

app.listen(process.env.PORT || 3000, () => {
    console.log("Ready")
})
