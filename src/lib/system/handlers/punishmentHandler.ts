/** @format */

import { Guild, User } from "discord.js";
import { Ok } from "ts-results";
import { prisma } from "//index";
import { UserPunishment } from "@prisma/client";
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
        user: User,
        moderator: User,
        type: string,
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
                guildId: this.guild.id,
                userId: user.id,
                moderatorId: moderator.id,
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
    public async getUserPunishments(user: User): Promise<Result<UserPunishment[]>> {
        const punishments = await prisma.userPunishment.findMany({
            where: {
                userId: user.id,
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
}
