/** @format */
//#region           External Libs
import {
    APIEmbed,
    APIEmbedAuthor,
    APIEmbedField,
    APIEmbedImage,
    APIEmbedProvider,
    APIEmbedThumbnail,
    APIEmbedVideo,
    Collection,
    ColorResolvable,
    EmbedBuilder,
    Message,
    TextChannel,
} from "discord.js";
import { Ok } from "ts-results";
//#endregion
//#region           Modules
import read from "@/system/factories/fs/read.f";
import string from "@/system/factories/string.f";
import {
    DefaultErr,
    Err,
    ErrorKind,
    ErrorOrigin,
} from "@/system/handlers/errHandlers";
//#endregion
//#region           Typing
export namespace types {
    export interface BaseEmbedProperties {
        color?: string;
        timestamp?: string;
        footer?: {
            text: string;
            iconURL: string;
        };
    }
    export interface Embed extends BaseEmbedProperties {
        title: string;
        description: string;
        url?: string;
        image?: APIEmbedImage;
        thumbnail?: APIEmbedThumbnail;
        video?: APIEmbedVideo;
        provider?: APIEmbedProvider;
        author?: APIEmbedAuthor;
        fields?: APIEmbedField[];
    }

    export interface PresetedEmbeds {
        baseProperties: BaseEmbedProperties;
        reportEmbed: Embed;
        listEmbed: Embed;
        warn: {
            missingPermission: Embed;
        };
        moveContent: {
            confirmAction: Embed;
            canceledAction: Embed;
            generalBaseInformation: Embed;
        };
        presetDialog: {
            err: {
                presetAlreadyExists: Embed;
            };
            actionDialog: Embed;
            successDialog: Embed;
            presetNameDialog: Embed;
            optionsDialog: Embed;
            channelsDialog: Embed;
        };
    }

    export type MessageCollection = Collection<string, Message>;

    export type ReportReason = {
        reason: string;
        attURL?: string;
    };

    export type BaseEmbedParams = {
        date: Date;
        authorUsername: string;
        authorURL: string;
        color: ColorResolvable;
    };

    export type SendParams = {
        newEmbed: APIEmbed;
        chat: TextChannel;
        video?: {
            url: string;
        };
    };
    export type UpdateDescLineOptions = {
        line: number;
        content: string;
    };
    export type CompleteEmbed = {
        embedData: APIEmbed;
        embed: EmbedBuilder;
    };
    export type MountingOptions = {
        withBase: boolean;
    };

    export type UtilsFunctions = {
        /**
         * Search the embed object on the file and
         * return it with the interpreted data.
         * @param params
         */
        generateEmbed: (
            embedData: UnknownObj,
            withBase?: boolean
        ) => Promise<Ok<APIEmbed>>;
        /**
         * Return the complete embed object.
         * @param embed
         */
        getCompleteEmbed: (embed: APIEmbed) => Ok<CompleteEmbed>;
    };
}
//#endregion
//#region           Variables
import defaultEmbeds from "D/messages/embed.json";
const unmountedEmbedErr: DefaultErr = {
    message:
        "Você não montou o embed antes! " +
        "Como acha que irá atualizar algo que não existe?",
    origin: ErrorOrigin.Internal,
    kind: ErrorKind.MissingVariable,
};
const noDescriptionErr: DefaultErr = {
    message: "Descrição não encontrada!",
    origin: ErrorOrigin.Internal,
    kind: ErrorKind.NotFound,
};
//#endregion
//#region           Implementation
export class EmbedMessagesHandler {
    /**
     * Path to the object on the embeds file.
     */
    readonly name: string;

    /**
     * Object of the embeds file.
     */
    embeds: types.PresetedEmbeds;
    /**
     * Current embed being used.
     */
    currentEmbed: APIEmbed;
    /**
     * Completed object of the current embed.
     * Contains the JSON data and the EmbedBuilder.
     */
    completeEmbed: types.CompleteEmbed;

    constructor(name: string) {
        this.name = name;

        this.embeds = defaultEmbeds;
        this.currentEmbed = {};
        this.completeEmbed = {
            embedData: {},
            embed: new EmbedBuilder(),
        };
    }

    //#region           Built-in Utilities
    protected Utils(): types.UtilsFunctions {
        const factory: FactoryObj<types.UtilsFunctions> = {
            generateEmbed: async (embedData, withBase) => {
                const getJSON = read.accessPathInObj(this.name, this.embeds);

                var json;
                if (!withBase) {
                    json = getJSON.val;
                } else {
                    const getBaseJSON = read.accessPathInObj(
                        "baseProperties",
                        this.embeds
                    );

                    if (
                        typeof getJSON.val === "object" &&
                        typeof getBaseJSON.val === "object"
                    ) {
                        json = {
                            ...getJSON.val,
                            ...getBaseJSON.val,
                        };
                    } else {
                        throw new Err({
                            message: "The embed is not an object!",
                            origin: ErrorOrigin.Internal,
                            kind: ErrorKind.TypeError,
                        });
                    }
                }

                const baseEmbed = JSON.stringify(json);
                const embedString = string.varInterpreter(baseEmbed, embedData);
                const mountedEmbed = JSON.parse(embedString.val);

                this.currentEmbed = mountedEmbed;

                return Ok(mountedEmbed);
            },
            getCompleteEmbed: (embed) => {
                const bEmbed = this.completeEmbed.embed;

                if (embed.url) bEmbed.setURL(embed.url);
                if (embed.color) bEmbed.setColor(embed.color);
                if (embed.title) bEmbed.setTitle(embed.title);
                if (embed.author) bEmbed.setAuthor(embed.author);
                if (embed.footer) bEmbed.setFooter(embed.footer);
                if (embed.image) bEmbed.setImage(embed.image.url);
                if (embed.timestamp)
                    bEmbed.setTimestamp(new Date(embed.timestamp));
                if (embed.fields) bEmbed.setFields(...embed.fields);
                if (embed.thumbnail) bEmbed.setThumbnail(embed.thumbnail.url);
                if (embed.description) bEmbed.setDescription(embed.description);

                const embedData = bEmbed.data;

                const result = { embedData, embed: bEmbed };
                this.completeEmbed = result;
                return Ok(result);
            },
        };
        return factory;
    }
    //#endregion
    //#region           Embed Initialization
    /**
     * Mount a new embed with the data provided.
     * @param embedData
     * @param options.withBase If true, the base properties will be used.
     * @returns
     */
    public async Mount(
        embedData: UnknownObj,
        options?: types.MountingOptions
    ): Promise<Ok<types.CompleteEmbed>> {
        if (options && options.withBase) {
            var generatedEmbed = await this.Utils().generateEmbed(
                embedData,
                options.withBase
            );
        } else {
            var generatedEmbed = await this.Utils().generateEmbed(embedData);
        }

        const mountedEmbed = this.Utils().getCompleteEmbed(
            generatedEmbed.val
        ).val;

        return Ok(mountedEmbed);
    }
    //#endregion
    //#region           Data Manipulation
    /**
     * Update the entire embed data.
     * @param embedData
     */
    public async Update(embedData: APIEmbed): Promise<Ok<types.CompleteEmbed>> {
        if (!this.completeEmbed || !this.currentEmbed)
            throw new Err(unmountedEmbedErr);

        this.currentEmbed = embedData;

        const completeEmbed = this.Utils().getCompleteEmbed(
            this.currentEmbed
        ).val;
        this.completeEmbed = completeEmbed;

        return Ok(this.completeEmbed);
    }
    /**
     * Update a specific line of the description.
     * @param options.content The new content of the line.
     * @param options.line The line to be updated (starting at 0).
     * @example
     * // old description:
     * // "Hi!"
     * // "I'm iFhany and I..."
     * // "Like my dev!"
     * await new EmbedHandler("iFhany.presentation").Data().UpdateDescLine({
     *     line: 2,
     *     content: "am a bot!",
     * });
     * // new description:
     * // "Hi!"
     * // "I'm iFhany and I..."
     * // "am a bot!"
     */
    public async UpdateDescLine(
        options: types.UpdateDescLineOptions
    ): Promise<Ok<types.CompleteEmbed>> {
        // Verify essential values
        if (!this.currentEmbed || !this.completeEmbed)
            throw new Err(unmountedEmbedErr);

        if (!this.currentEmbed.description) throw new Err(noDescriptionErr);

        // Edit lines
        const descLines = this.currentEmbed.description.split("\n");
        descLines[options.line] = options.content;
        this.currentEmbed.description = descLines.join("\n");

        // Update embed objects
        const updateEmbed = await this.Update(this.currentEmbed);

        this.completeEmbed = updateEmbed.val;

        return Ok(this.completeEmbed);
    }
    //#endregion
}
//#endregion
