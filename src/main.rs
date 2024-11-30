use dotenv::dotenv;

use handlers::error::BotErr;
use poise::serenity_prelude as serenity;

use ::serenity::all::{ApplicationId, GuildId};
use serenity::all::{ClientBuilder, GatewayIntents};
use std::env;

mod commands;
mod handlers;
mod utils;

pub struct Data;

#[tokio::main]
async fn main() {
    dotenv().ok();

    let intents = GatewayIntents::GUILDS
        | GatewayIntents::GUILD_MESSAGES
        | GatewayIntents::GUILD_MESSAGE_REACTIONS
        | GatewayIntents::GUILD_EMOJIS_AND_STICKERS
        | GatewayIntents::MESSAGE_CONTENT
        | GatewayIntents::DIRECT_MESSAGES
        | GatewayIntents::DIRECT_MESSAGE_REACTIONS;

    let token = env::var("TOKEN").expect("Expected a token");
    let app_id: ApplicationId = env::var("CLIENT_ID")
        .expect("Expected a client id")
        .parse()
        .unwrap();

    env::remove_var("TOKEN");
    env::remove_var("CLIENT_ID");

    let framework: poise::Framework<(), BotErr> = poise::Framework::builder()
        .options(poise::FrameworkOptions {
            commands: commands::get_commands(),
            prefix_options: poise::PrefixFrameworkOptions {
                prefix: Some("f.".to_string()),
                ..Default::default()
            },
            ..Default::default()
        })
        .setup(|ctx, _ready, framework| {
            Box::pin(async move {
                poise::builtins::register_globally(ctx, &framework.options().commands).await?;

                // dev
                poise::builtins::register_in_guild(
                    ctx,
                    &framework.options().commands,
                    GuildId::new(1102710490922238042),
                )
                .await?;

                Ok(())
            })
        })
        .build();

    let mut client = ClientBuilder::new(&token, intents)
        .framework(framework)
        .application_id(app_id)
        .status(serenity::OnlineStatus::Online)
        .await
        .expect("Error creating client");

    client.start().await.unwrap()
}
