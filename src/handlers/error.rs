use std::fmt::Display;
use poise::serenity_prelude::Error as SerenityError;

#[derive(Debug, Clone)]
pub enum ErrorOrigin {
    User,
    Internal,
    External,
    Unknown
}

#[derive(Debug, Clone)]
pub enum ErrorKind {
    AlreadyExists,
    BlockedAction,
    CanceledAction,
    CorruptedFile,
    EmptyValue,
    GhostEditing,
    InvalidValue,
    LogicError,
    MissingParam,
    MissingVariable,
    NotEnoughArgs,
    NotFound,
    NotSent,
    NullishValue,
    SyntaxError,
    Other,
    TimeOut,
    TypeError
}

#[derive(Debug, Clone)]
pub struct BotError {
    pub message: String,
    pub origin: ErrorOrigin,
    pub kind: ErrorKind
}

pub trait Error: std::error::Error + Display {
    fn kind(&self) -> ErrorKind;
}

impl Display for BotError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for BotError {}

impl Error for BotError {
    fn kind(&self) -> ErrorKind {
        self.kind.clone()
    }
}

impl From<SerenityError> for BotErr {
    fn from(value: SerenityError) -> Self {
        Box::new(BotError {
            message: value.to_string(),
            origin: ErrorOrigin::Unknown,
            kind: ErrorKind::Other
        })
    }
}

pub type BotErr = Box<dyn Error + Send + Sync>;