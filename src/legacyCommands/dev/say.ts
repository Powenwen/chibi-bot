import { Message } from "discord.js";
import ChibiClient from "../../structures/Client";
import { BaseLegacyCommand } from "../../interfaces";

export default <BaseLegacyCommand>{
    name: "say",
    aliases: ["echo"],
    config: {
        category: "dev",
        usage: "<message>",
        examples: ["Hello, world!"],
        permissions: ["Administrator"]
    },
    async execute(_client: ChibiClient, message: Message, args: string[]) {
        if (args.length === 0) {
            await message.reply("❌ Please provide a message to say!");
            return;
        }

        const content = args.join(" ");
        
        // Delete the original command message for cleaner output
        await message.delete().catch(() => null);
        
        // Send the message content
        if (message.channel.isSendable()) {
            await message.channel.send(content);
        }
    }
};