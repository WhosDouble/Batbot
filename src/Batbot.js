"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const discord_js_1 = require("discord.js");
const openai_1 = __importDefault(require("openai"));
dotenv_1.default.config();
if (!process.env.OPENAI_API_KEY || !process.env.DISCORD_BOT_TOKEN) {
    throw new Error("Missing API key or bot token in .env file");
}
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.DirectMessages,
    ],
});
const userMessages = {};
client.on("messageCreate", (message) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    if (!message.guild || message.author.bot)
        return;
    // Ensure bot user is defined
    if (!client.user)
        return;
    if (message.content.toLowerCase().startsWith("computer") ||
        (((_a = message.reference) === null || _a === void 0 ? void 0 : _a.messageId) &&
            (yield message.fetchReference()).author.id === client.user.id)) {
        let pastMessages = userMessages[message.author.id] || [];
        pastMessages.push({
            role: "user",
            content: message.content,
            name: "user",
        });
        if ((_b = message.reference) === null || _b === void 0 ? void 0 : _b.messageId) {
            try {
                const referencedMessage = yield message.fetchReference();
                if (referencedMessage.author.id === client.user.id) {
                    pastMessages.push({
                        role: "assistant",
                        content: referencedMessage.content,
                        name: "assistant",
                    });
                }
            }
            catch (error) {
                console.error("Error fetching referenced message:", error);
            }
        }
        pastMessages.push({ role: "user", content: message.content });
        if (pastMessages.length > 1000) {
            pastMessages.shift();
        }
        try {
            const messages = [
                {
                    role: "system",
                    content: "You are Batman's supercomputer. You give out efficient and accurate information and speak in a robotic tone.",
                    name: "system",
                },
                ...pastMessages,
            ];
            const response = yield openai.chat.completions.create({
                model: "gpt-4o",
                messages: messages,
                max_tokens: 350,
            });
            const gilbertReply = ((_d = (_c = response.choices[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) ||
                "I'm having trouble generating a response.";
            message.reply(gilbertReply);
            userMessages[message.author.id] = pastMessages;
        }
        catch (error) {
            console.error("Error generating AI response:", error);
            message.reply("Sorry Master Bruce, I'm having trouble fetching that information. Please try again.");
        }
    }
}));
client.once("ready", () => {
    if (!client.user)
        return;
    console.log(`Computer is online, logged in as ${client.user.tag}`);
    client.user.setPresence({
        activities: [{ name: "Computer online", type: discord_js_1.ActivityType.Watching }],
    });
});
client.login(process.env.DISCORD_BOT_TOKEN);
