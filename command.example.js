import { SlashCommandBuilder } from "@discordjs/builders";

export default {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Ping, Pong!?!?"),
    permissions: [], // Array of role that can use this command
    run: async (interaction) => {
        return interaction.reply(`Pong! \`${interaction.client.ws.ping} ms\``)
    }
}
