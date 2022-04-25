import { RequestManager, REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import fs, { readdirSync } from "node:fs";
import config from "./config.js";
import { Client, Intents, Collection, CommandInteractionOptionResolver } from "discord.js";

let guildId = "";
let clientId = "";
let token = config.token;
let commandDirectoryFull = ""
let commandDirectoryFromFile = ""

let commands = [];
let permissions = [];
let dirs = readdirSync(commandDirectory);
for(const dir of dirs) {
    const commandFiles = readdirSync(`${commandDirectory}/${dir}`).filter(file => file.endsWith(".js"));
    for(const file of commandFiles) {
        let command = await import(`${commandDirectoryFromFile}/${dir}/${file}`)
        command = command.default;
        if(command.permissions) command.data.defaultPermission = false;
        commands.push(command.data.toJSON());
        permissions.push({ name: command.data.toJSON().name, permission: command.permissions })
    }
};


const rest = new REST({ version: "9" }).setToken(token);

(async () => {
    try {
        console.log("Refreshing slash commands");
        
        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        )

        console.log("Refreshed slash commands");
    } catch (error) {
        console.log(error);
    }
})(); 

const client = new Client({ intents: [Intents.FLAGS.GUILDS ]});
client.login(token);

client.commands = new Collection();

for(const dir of dirs) {
    const commandFiles = readdirSync(`${commandDirectory}/${dir}`).filter(file => file.endsWith(".js"));
    for(const file of commandFiles) {
        let command = await import(`${commandDirectoryFromFile}/${dir}/${file}`)
        command = command.default;
        client.commands.set(command.data.name, command);
    }
};

client.on("ready", async () => {
    console.log(`${client.user.username} is ONLINE`);

    let guild = await client.guilds.fetch(`${guildId}`);
    let cmds = await guild.commands.fetch();
    cmds.each(async (cmd) => {
        let { permission } = permissions.find((p) => p.name == cmd.name);
        if(!permission) return;
        
        let temp = [];
        permission.forEach((perm) => {
            temp.push({
                id: perm,
                type: "ROLE",
                permission: true,
            });
        })

        console.log(temp);

        await cmd.permissions.set({ permissions: temp });
    })
});

client.on("interactionCreate", async (interaction) => {
    if(!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if(!command) return;

    try {
        await command.run(interaction);
    } catch(error) {
        console.log(error);
        interaction.reply({ content: `There was an error while executing this command!`, ephemeral: true})
    }
})
