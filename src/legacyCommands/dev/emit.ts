import { Message } from "discord.js";
import ChibiClient from "../../structures/Client";
import { BaseLegacyCommand } from "../../interfaces";

export default <BaseLegacyCommand>{
    name: "emit",
    aliases: ["fire"],
    config: {
        category: "dev",
        usage: "<event>",
        examples: ["guildMemberAdd", "messageCreate"],
        permissions: ["Administrator"]
    },
    async execute(client: ChibiClient, message: Message, args: string[]) {
        if (args.length === 0) {
            await message.reply("❌ Please specify an event to emit!");
            return;
        }

        const event = args[0];
        
        // Emit the event with the message author as member
        client.emit(event, message.member);
        
        await message.reply(`✅ Emitted event: \`${event}\``);
    }
};