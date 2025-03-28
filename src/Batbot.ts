import dotenv from "dotenv";
import { Client, GatewayIntentBits, ActivityType } from "discord.js";
import OpenAI from "openai";

import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

dotenv.config();

interface CustomChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
}

if (!process.env.OPENAI_API_KEY || !process.env.DISCORD_BOT_TOKEN) {
  throw new Error("Missing API key or bot token in .env file");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

const userMessages: { [key: string]: CustomChatMessage[] } = {};

client.on()

client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;

  // Ensure bot user is defined
  if (!client.user) return;

  if (
    message.content.toLowerCase().startsWith("computer") ||
    (message.reference?.messageId &&
      (await message.fetchReference()).author.id === client.user.id)
  ) {
    let pastMessages: CustomChatMessage[] =
      userMessages[message.author.id] || [];

    pastMessages.push({
      role: "user",
      content: message.content,
      name: "user",
    });

    if (message.reference?.messageId) {
      try {
        const referencedMessage = await message.fetchReference();
        if (referencedMessage.author.id === client.user.id) {
          pastMessages.push({
            role: "assistant",
            content: referencedMessage.content,
            name: "assistant",
          });
        }
      } catch (error) {
        console.error("Error fetching referenced message:", error);
      }
    }

    pastMessages.push({ role: "user", content: message.content });

    if (pastMessages.length > 400) {
      pastMessages.shift();
    }

    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: "system",
          content:
            "You are Batman's supercomputer. You give out efficient and accurate information and speak in a robotic tone.",
          name: "system",
        },
        ...pastMessages,
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        max_tokens: 350,
      });

      const gilbertReply =
        response.choices[0]?.message?.content ||
        "I'm having trouble generating a response.";
      message.reply(gilbertReply);

      userMessages[message.author.id] = pastMessages;
    } catch (error) {
      console.error("Error generating AI response:", error);
      message.reply(
        "Sorry Master Bruce, I'm having trouble fetching that information. Please try again."
      );
    }
  }
});

client.once("ready", () => {
  if (!client.user) return;

  console.log(`Computer is online, logged in as ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: "Computer online", type: ActivityType.Watching }],
  });
});

client.login(process.env.DISCORD_BOT_TOKEN);
