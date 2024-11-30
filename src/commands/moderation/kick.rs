use poise::Context;
use serenity::all::User;

use crate::handlers::error::{BotErr, BotError, Error, ErrorKind, ErrorOrigin};

/// Kick a user and specify a reason!
#[poise::command(slash_command)]
pub async fn kick(
    ctx: Context<'_, (), BotErr>,
    #[description = "Who do you want to kick?"] user: User,
    #[description = "What is the reason?"] reason: String,
    #[description = "Do you want to hide this message?"] ephemeral: Option<bool>,
) -> Result<(), BotErr> {
    let http = ctx.http();

    if ephemeral.is_none() || ephemeral.unwrap() {
        ctx.defer_ephemeral().await?;
    } else {
        ctx.defer().await?;
    }


    let guild_id = match ctx.guild_id() {
        Some(guild_id) => guild_id,
        None => {
            return Err(BotError::new(
                "This command can only be used in a server".to_string(),
                ErrorKind::Other,
                ErrorOrigin::User,
            ))
        }
    };

    let member = guild_id
        .member(&http, user.id)
        .await?;

    member.kick_with_reason(&http, reason.as_str()).await?;

    ctx.say("User has been kicked!").await?;

    Ok(())
}
