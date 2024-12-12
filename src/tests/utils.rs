#[cfg(test)]
pub mod filter {
    use crate::utils::filter::extract_emoji;
    use crate::utils::values::{enums::EmojiFormat, structs::ExtractedEmoji};

    #[test]
    pub fn extract_complex_emoji() {
        let emoji = "<:emoji:123456789>".to_string();

        let extracted_emoji = extract_emoji(&emoji).unwrap();

        assert_eq!(
            extracted_emoji,
            ExtractedEmoji {
                is_custom: true,
                kind: EmojiFormat::Custom,
                name: "emoji".to_string(),
                id: Some("123456789".to_string())
            }
        );
    }
    #[test]
    pub fn extract_simple_emoji() {
        let emoji = ":heart:".to_string();

        let extracted_emoji = extract_emoji(&emoji).unwrap();

        assert_eq!(
            extracted_emoji,
            ExtractedEmoji {
                is_custom: false,
                kind: EmojiFormat::Discord,
                name: "heart".to_string(),
                id: None
            }
        );
    }
}

#[cfg(test)]
pub mod verify {
    use crate::utils::{values::enums::EmojiFormat, verify::get_emoji_format};

    #[test]
    pub fn emoji_discord() {
        let emoji = ":heart:".to_string();

        assert_eq!(get_emoji_format(&emoji), EmojiFormat::Discord);
    }
    #[test]
    pub fn emoji_custom() {
        let emoji = "<:emoji:123456789>".to_string();

        assert_eq!(get_emoji_format(&emoji), EmojiFormat::Custom);
    }
    #[test]
    pub fn emoji_unicode() {
        let emoji = "\u{2764}\u{FE0F}".to_string();

        assert_eq!(get_emoji_format(&emoji), EmojiFormat::Unicode);
    }
}
