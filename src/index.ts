/** @format */
//#region           External Lib
import * as dotenv from "dotenv";
import { Ok } from "ts-results";
import { REST } from "discord.js";
import { PrismaClient } from "@prisma/client";
//#endregion
//#region           Modules
import general from "@/system/factories/general.f";
import { Log } from "@/system/handlers/log";
import { CommandHandler } from "@/system/handlers/command";
import { PermissionsHandler } from "@/system/handlers/permission";
import { InteractionHandler } from "@/system/handlers/interaction";
//#endregion
//#region           Typing
import { ListenerHandler } from "@/system/handlers/listener";
//#endregion
//#region           Variables
dotenv.config();

import pkg from "../package.json";

const tokenProd = process.env.PROD_TOKEN;
const prodClientId = process.env.PROD_CLIENT_ID;
const guildId = process.env.PROD_GUILD_ID;

const tokenDev = process.env.DEV_TOKEN;
const devClientId = process.env.DEV_CLIENT_ID;
const devGuildId = process.env.DEV_GUILD_ID;

const condition = process.env.DEV_MODE;

export const guild = (condition ? devGuildId : guildId) || process.exit(1);
const token = (condition ? tokenDev : tokenProd) || process.exit(1);
const clientId = (condition ? devClientId : prodClientId) || process.exit(1);

export const client = general.createClient({
    token: token,
    version: pkg.version,
}).val;
export const prisma = new PrismaClient();

process.env.TZ = "America/Sao_Paulo";
//#endregion
//#region           Implementation
const main = async (): Promise<Ok<void>> => {
    const rest: REST = new REST({ version: "10" }).setToken(token);

    // Load and Deploy Commands
    {
        const commandHandler = new CommandHandler(rest, clientId, guild);

        await commandHandler.LoadCommands();

        client.commands = commandHandler.commands_collection;

        await commandHandler.Deploy();
    }

    // Ensure the databases and their files
    {
        await new PermissionsHandler().EnsureCommandsPermissions();
    }
    // Initializate listeners and other essential stuff
    {
        InteractionHandler.LaunchListener();
        ListenerHandler.PredefinedListeners();
        //await PresetHandler.InitializateAll();
    }

    new Log("success.endOfMain").Print();
    return Ok.EMPTY;
};

process.on("unhandledRejection", (err) => {
    Log.PrintErr(err);
});

main().catch((err) => Log.PrintErr(err));
//#endregion
