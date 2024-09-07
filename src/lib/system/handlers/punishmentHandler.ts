/** @format */

import { Guild, Snowflake } from "discord.js";
import { Ok } from "ts-results";
import { prisma } from "//index";
import { $Enums, Prisma, UserPunishment } from "@prisma/client";
import {
    BotErr,
    ErrorKind,
    ErrorOrigin,
    Result,
} from "@/system/handlers/errHandlers";

export class PunishmentHandler {
    guild: Guild;

    constructor(guild: Guild) {
        this.guild = guild;
    }

    public async add(
        userId: Snowflake,
        moderatorId: Snowflake,
        type: $Enums.PunishmentType,
        reason: string,
        createdAt: Date,
        expiresAt: Date
    ): Promise<Ok<void>> {
        let currentCase;
        {
            const lastPunishment = await prisma.userPunishment.findFirst({
                orderBy: {
                    case: "desc",
                },
                where: {
                    guildId: this.guild.id,
                },
            });

            if (lastPunishment === null) {
                currentCase = 1;
            } else {
                currentCase = lastPunishment.case + 1;
            }
        }

        await prisma.userPunishment.create({
            data: {
                case: currentCase,
                createdAt,
                expiresAt,
                type,
                reason,
                undone: false,
                guildId: this.guild.id,
                userId,
                moderatorId,
            },
        });

        return Ok.EMPTY;
    }

    /**
     * Get all punishments of a user.
     * @param user The user to get the punishments of.
     * @returns A promise that resolves with an
     * array of punishments if no error occurs, otherwise a BotErr.
     */
    public async getUserPunishments(
        userId: Snowflake
    ): Promise<Result<UserPunishment[]>> {
        const punishments = await prisma.userPunishment.findMany({
            where: {
                userId,
                guildId: this.guild.id,
            },
        });

        return Ok(punishments);
    }

    public async get(caseNumber: number): Promise<Result<UserPunishment>> {
        const getPunishment = await prisma.userPunishment.findFirst({
            where: { case: caseNumber, guildId: this.guild.id },
        });

        if (getPunishment !== null) {
            return Ok(getPunishment);
        } else {
            return new BotErr({
                message: `O caso ${caseNumber} não foi encontrado!`,
                kind: ErrorKind.NotFound,
                origin: ErrorOrigin.User,
            });
        }
    }

    /**
     * Edit a punishment.
     * @param caseNumber The case number of the punishment to edit.
     * @param data The data to update the punishment with.
     * @returns A promise that resolves with the edited punishment if no error occurs,
     * otherwise a BotErr.
     */
    public async edit(
        caseNumber: number,
        data: Prisma.UserPunishmentUpdateInput
    ): Promise<Result<UserPunishment>> {
        try {
            const editedPunishment = await prisma.userPunishment.update({
                where: { case: caseNumber },
                data,
            });

            return Ok(editedPunishment);
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") {
                    return new BotErr({
                        message: `O caso ${caseNumber} não foi encontrado!`,
                        kind: ErrorKind.NotFound,
                        origin: ErrorOrigin.User,
                    });
                }
            }

            throw err;
        }
    }
}
