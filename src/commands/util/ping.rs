use poise::Context;

use crate::handlers::error::BotErr;

#[poise::command(slash_command)]
pub async fn execute(ctx: Context<'_, (), BotErr>) -> Result<(), BotErr> {
    ctx.say("Pong!").await?;

    Ok(())
}