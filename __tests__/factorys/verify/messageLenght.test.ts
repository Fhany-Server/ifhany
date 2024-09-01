/** @format */
//#region           External Libs
import { expect } from "chai";
import { Collection, Message } from "discord.js";
//#endregion
//#region           Modules
import verify from "@/system/factories/verify.f";
import { BotErr, ErrorOrigin, ErrorKind } from "@/system/handlers/errHandlers";
//#endregion
//#region           Implementation
const mountMessage = async (
    message: string
): Promise<Collection<string, Message>> => {
    const messageObj = {
        content: message,
    } as Message;
    const messageCollection: Collection<string, Message> = new Collection();
    messageCollection.set("message", messageObj);

    return messageCollection;
};
const getMessage = async (content: string): Promise<Message> => {
    const message = (await mountMessage(content)).first();

    if (message) return message;
    else
        throw new BotErr({
            message: "Message was not mounted!",
            origin: ErrorOrigin.Unknown,
            kind: ErrorKind.Other,
            errObj: message,
        });
};

describe("messageLenght", () => {
    test("Passou o limite de 200 caracteres", async () => {
        const beyoindLimit =
            "Essa mensagem é grande, pois ela irá conter mais que 200 caracteres. " +
            "Eu já disse isso? O objetivo dela é conter muuuuuuuuuuuuuuuuitos " +
            "caracteres mesmo. Sério... Finalmente, agora passou o seu limite :)";
        const betweenLimit = "Essa mensagem está dentro dos limites :)";

        const repeatFn = async (): Promise<Message> => {
            return getMessage(betweenLimit);
        };

        const result = await verify.messageLenght(
            await getMessage(beyoindLimit),
            repeatFn
        );

        expect(result.val).to.deep.equal({
            content: betweenLimit,
        });
    });

    test("Não passou o limite de 200 caracteres", async () => {
        const message = "Dentro dos limites :)";

        const result = await verify.messageLenght(await getMessage(message));

        expect(result.val).to.deep.equal({
            content: message,
        });
    });
});
//#endregion
