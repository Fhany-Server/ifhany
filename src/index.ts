/** @format */
//#region           External Lib


import { REST } from "discord.js";
import { Ok } from "ts-results";
//#endregion
//#region           Modules
import general from "@/system/factories/general.f";
import { Log } from "@/system/handlers/log";
import { PresetHandler } from "@/system/handlers/presetHandler";
import { CommandHandler } from "@/system/handlers/command";
import { PermissionsHandler } from "@/system/handlers/permission";
import { InteractionHandler } from "@/system/handlers/interaction";
//#endregion
//#region           Typing
import { ListenerHandler } from "@/system/handlers/listener";
//#endregion
//#region           Variables
import pkg from "../package.json";
import {
    prodClientId,
    guildId,
    tokenProd,
    devClientId,
    devGuildId,
    tokenDev,
} from "../configs.json";
import { DataBowlHandler } from "@/system/handlers/dataBowl";

const condition = process.env.DEV_MODE;

export const guild = condition ? devGuildId : guildId;
const token = condition ? tokenDev : tokenProd;
const clientId = condition ? devClientId : prodClientId;

export const client = general.createClient({
    token: token,
    version: pkg.version,
}).val;

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
        await new PresetHandler("none").EnsureDataExistence();
        await new DataBowlHandler("none").EnsureDataExistence();
        await new PermissionsHandler().EnsureCommandsPermissions();
    }
    // Initializate listeners and other essential stuff
    {
        InteractionHandler.LaunchListener();
        ListenerHandler.PredefinedListeners();
        await PresetHandler.InitializateAll();
    }

    new Log("success.endOfMain").Print();
    return Ok.EMPTY;
};

process.on("unhandledRejection", (err) => {
    Log.PrintErr(err);
});

main().catch((err) => Log.PrintErr(err));
//#endregion
