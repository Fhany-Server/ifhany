pub mod moderation;
pub mod conf;
pub mod util;

pub fn get_commands() -> Vec<poise::Command<(), crate::handlers::error::BotErr>> {
    vec![
        util::ping::execute(),
    ]
}