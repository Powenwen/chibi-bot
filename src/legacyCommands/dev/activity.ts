import { Message, EmbedBuilder, ActivityType } from "discord.js";
import ChibiClient from "../../structures/Client";
import { BaseLegacyCommand } from "../../interfaces";

export default <BaseLegacyCommand>{
    name: "activity",
    aliases: ["act"],
    config: {
        category: "dev",
        usage: "<set|add|remove|list|start|stop> [args...]",
        examples: [
            "activity set Playing with code",
            "activity add Listening to music",
            "activity list",
            "activity start"
        ],
        permissions: ["Administrator"]
    },
    async execute(client: ChibiClient, message: Message, args: string[]) {
        if (args.length === 0) {
            await message.reply("❌ Please specify a subcommand: `set`, `add`, `remove`, `list`, `start`, or `stop`");
            return;
        }

        const subcommand = args[0].toLowerCase();
        
        switch (subcommand) {
            case "set": {
                if (args.length < 3) {
                    await message.reply("❌ Usage: `activity set <type> <name>`\nTypes: playing, streaming, listening, watching, competing");
                    return;
                }

                const typeStr = args[1].toLowerCase();
                const name = args.slice(2).join(" ");
                
                const typeMap: { [key: string]: ActivityType } = {
                    playing: ActivityType.Playing,
                    streaming: ActivityType.Streaming,
                    listening: ActivityType.Listening,
                    watching: ActivityType.Watching,
                    competing: ActivityType.Competing
                };

                const type = typeMap[typeStr];
                if (type === undefined) {
                    await message.reply("❌ Invalid activity type. Use: playing, streaming, listening, watching, competing");
                    return;
                }

                client.activityManager.setCustom(name, type);
                
                const embed = new EmbedBuilder()
                    .setTitle("✅ Activity Set")
                    .setDescription(`Successfully set activity to: **${name}** (${getActivityTypeName(type)})`)
                    .setColor("#00ff00")
                    .setTimestamp();
                
                await message.reply({ embeds: [embed] });
                break;
            }
            
            case "add": {
                if (args.length < 3) {
                    await message.reply("❌ Usage: `activity add <type> <name>`\nTypes: playing, streaming, listening, watching, competing");
                    return;
                }

                const typeStr = args[1].toLowerCase();
                const name = args.slice(2).join(" ");
                
                const typeMap: { [key: string]: ActivityType } = {
                    playing: ActivityType.Playing,
                    streaming: ActivityType.Streaming,
                    listening: ActivityType.Listening,
                    watching: ActivityType.Watching,
                    competing: ActivityType.Competing
                };

                const type = typeMap[typeStr];
                if (type === undefined) {
                    await message.reply("❌ Invalid activity type. Use: playing, streaming, listening, watching, competing");
                    return;
                }

                client.activityManager.add(name, type);

                const embed = new EmbedBuilder()
                    .setTitle("✅ Activity Added")
                    .setDescription(`Successfully added activity: **${name}** (${getActivityTypeName(type)})`)
                    .addFields({ name: "Total Activities", value: client.activityManager.get().length.toString(), inline: true })
                    .setColor("#00ff00")
                    .setTimestamp();
                
                await message.reply({ embeds: [embed] });
                break;
            }
            
            case "remove": {
                if (args.length < 2) {
                    await message.reply("❌ Usage: `activity remove <index>`");
                    return;
                }

                const index = parseInt(args[1]);
                if (isNaN(index)) {
                    await message.reply("❌ Please provide a valid number for the index.");
                    return;
                }

                const activities = client.activityManager.get();
                
                if (index >= activities.length || index < 0) {
                    await message.reply(`❌ Index ${index} is out of range. Valid range: 0-${activities.length - 1}`);
                    return;
                }
                
                const activityToRemove = activities[index];
                const success = client.activityManager.remove(index);

                if (success) {
                    const embed = new EmbedBuilder()
                        .setTitle("✅ Activity Removed")
                        .setDescription(`Successfully removed activity: **${activityToRemove.name}** (${getActivityTypeName(activityToRemove.type)})`)
                        .addFields({ name: "Remaining Activities", value: client.activityManager.get().length.toString(), inline: true })
                        .setColor("#00ff00")
                        .setTimestamp();
                    
                    await message.reply({ embeds: [embed] });
                } else {
                    await message.reply("❌ Failed to remove the activity.");
                }
                break;
            }
            
            case "list": {
                const activities = client.activityManager.get();

                if (activities.length === 0) {
                    const embed = new EmbedBuilder()
                        .setTitle("📝 Activity List")
                        .setDescription("No activities configured.")
                        .setColor("#ffaa00")
                        .setTimestamp();
                    
                    await message.reply({ embeds: [embed] });
                    return;
                }
                
                const activityList = activities
                    .map((activity: { name: string, type: number }, index: number) => `**${index}.** ${activity.name} (${getActivityTypeName(activity.type)})`)
                    .join("\n");
                
                const embed = new EmbedBuilder()
                    .setTitle("📝 Activity List")
                    .setDescription(activityList)
                    .addFields({ name: "Total Activities", value: activities.length.toString(), inline: true })
                    .setColor("#0099ff")
                    .setTimestamp();
                
                await message.reply({ embeds: [embed] });
                break;
            }
            
            case "start": {
                client.activityManager.startRotation();
                
                const embed = new EmbedBuilder()
                    .setTitle("▶️ Activity Rotation Started")
                    .setDescription("Activity rotation has been started with 30-second intervals.")
                    .addFields({ name: "Total Activities", value: client.activityManager.get().length.toString(), inline: true })
                    .setColor("#00ff00")
                    .setTimestamp();
                
                await message.reply({ embeds: [embed] });
                break;
            }
            
            case "stop": {
                client.activityManager.stopRotation();

                const embed = new EmbedBuilder()
                    .setTitle("⏹️ Activity Rotation Stopped")
                    .setDescription("Activity rotation has been stopped.")
                    .setColor("#ff6600")
                    .setTimestamp();
                
                await message.reply({ embeds: [embed] });
                break;
            }

            default: {
                await message.reply("❌ Invalid subcommand. Use: `set`, `add`, `remove`, `list`, `start`, or `stop`");
                break;
            }
        }
    }
};

function getActivityTypeName(type: number): string {
    switch (type) {
        case ActivityType.Playing: return "Playing";
        case ActivityType.Streaming: return "Streaming";
        case ActivityType.Listening: return "Listening";
        case ActivityType.Watching: return "Watching";
        case ActivityType.Competing: return "Competing";
        default: return "Unknown";
    }
}