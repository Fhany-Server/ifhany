/** @format */

//#region           External Libs
import { ErrImpl, Ok } from "ts-results";
//#endregion
//#region           Modules
import { Log } from "@/system/handlers/log";
import { client, DEVELOPER_ID } from "//index";
import { Interaction } from "discord.js";
//#endregion
//#region           Typing
export namespace types {
    export interface UtilsFunctions {
        /**
         * Send a message to the user about this error.
         */
        warnUser: (interaction: Interaction) => Promise<Ok<void>>;
        /**
         * Send a message to the developer about this error.
         */
        warnDeveloper: () => Promise<Ok<void>>;
    }

    /**
     * A standarnized ts-results BotErr object.
     * @example
     * new BotErr({
     *      message: "Oh no! That's an error",
     *      type: ErrorKind
     * })
     */
}
export interface DefaultErr<T = unknown> {
    message: string;
    origin: ErrorOrigin;
    kind: ErrorKind;
    errObj?: T;
}
export enum ErrorKind {
    AlreadyExists = "AlreadyExists",
    BlockedAction = "BlockedAction",
    CanceledAction = "CanceledAction",
    CorruptedFile = "CorruptedFile",
    EmptyValue = "EmptyValue",
    GhostEditing = "GhostEditing",
    InvalidValue = "InvalidValue",
    LogicError = "LogicError",
    MissingParam = "MissingParam",
    MissingVariable = "MissingVariable",
    NotEnoughArgs = "NotEnoughArgs",
    NotFound = "NotFound",
    NotSent = "NotSent",
    NullishValue = "NullishValue",
    SyntaxError = "SyntaxError",
    Other = "Other",
    TimeOut = "TimeOut",
    TypeError = "TypeError",
}
export enum ErrorOrigin {
    Internal = "Internal",
    External = "External",
    Unknown = "Unknown",
    User = "User",
}

export type Result<O, E = DefaultErr> = Ok<O> | ErrImpl<E>;

//#region           Variables
const defaultErrMessage = "An error occurred during the interaction!";

export const errors: Record<string, DefaultErr> = {
    presetNotFound: {
        message: "Preset não encontrado!",
        origin: ErrorOrigin.User,
        kind: ErrorKind.NotFound,
    },
    typeErr: {
        message: "O valor recebido não é do tipo requerido!",
        origin: ErrorOrigin.Internal,
        kind: ErrorKind.TypeError,
    },
};
//#endregion
//#region           Implementation
export class ErrorHandler {
    readonly error: unknown;

    constructor(error: unknown) {
        this.error = error;
    }
    protected Utils(): FactoryObj<types.UtilsFunctions> {
        const factory: FactoryObj<types.UtilsFunctions> = {
            warnUser: async (interaction) => {
                // Complete if it's an autocomplete interaction
                if (interaction.isAutocomplete()) return Ok.EMPTY;

                const userMessage = {
                    content:
                        ":interrobang: | Vish bixo! Algum fio deu curto :/\n\n" +
                        "Mas relaaaxa! Avisei o dev e logo logo " +
                        "isso será corrigido <a:ype:1062740569476050966>",
                    embeds: [],
                    components: [],
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply(userMessage);
                } else {
                    await interaction.reply(userMessage);
                }

                return Ok.EMPTY;
            },
            warnDeveloper: async () => {
                var message: string;

                if (this.error instanceof BotErr)
                    message = this.error.val.message;
                else if (this.error instanceof Error)
                    message = this.error.message;
                else message = defaultErrMessage;

                const devMessage =
                    "Ocorreu um erro interno!\n" +
                    "```\n" +
                    `${message}\n\n` +
                    `obj: ${this.error}\n` +
                    "```";

                // Print Log
                Log.PrintErr(this.error);

                // Warn Developer
                try {
                    const devUser = await client.users.fetch(
                        DEVELOPER_ID
                    );
                    await devUser.send(devMessage);
                } catch (err) {
                    Log.PrintErr(
                        new BotErr({
                            message:
                                "Erro em cima de erro em! " +
                                "Não consegui enviar a mensagem para o dev.",
                            origin: ErrorOrigin.Unknown,
                            kind: ErrorKind.NotSent,
                            errObj: err,
                        })
                    );
                }

                return Ok.EMPTY;
            },
        };
        return factory;
    }
    public Healer(interaction?: Interaction): void {
        console.log(this.error);

        this.Utils().warnDeveloper();

        if (interaction !== undefined) {
            this.Utils().warnUser(interaction);
        }
    }
}

/**
 * A standarnized ts-results BotErr class.
 */
export class BotErr extends ErrImpl<DefaultErr> {
    constructor(err: DefaultErr) {
        super(err);
    }

    /**
     * Pass the error on, to deal with it on a larger scope.
     */
    unwrap(): never {
        throw this;
    }
}
