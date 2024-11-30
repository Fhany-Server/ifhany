use serenity::async_trait;
use serenity::all::{Context, EventHandler, Message, Ready};

pub struct Handler;

#[async_trait]
impl EventHandler for Handler {
    async fn ready(&self, _ctx: Context, _ready: Ready) {
        println!("{} is connected!", _ready.user.name);
    }
    async fn message(&self, _ctx: Context, _msg: Message) {
        println!("{} said: {}", _msg.author.name, _msg.content);
    }
}