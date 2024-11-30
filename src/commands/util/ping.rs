use poise::Context;

use crate::handlers::error::BotErr;

#[poise::command(slash_command)]
pub async fn ping(ctx: Context<'_, (), BotErr>) -> Result<(), BotErr> {
    let ping = ctx.ping().await;

    ctx.say(format!("The current gateway heartbeat is {}ms!", ping.as_millis())).await?;

    Ok(())
}