/** @format */
/* eslint-disable @typescript-eslint/no-empty-interface */

class MockedMessageManager extends Map {
    messages: Map<string, AnyObj>;

    constructor(messages: [string, AnyObj][]) {
        super();

        this.messages = new Map(messages);
    }
    public async fetch(messageId: string): Promise<MockedMessageManager | null> {
        const message = this.messages.get(messageId) as MockedMessageManager;

        if (message) {
            return message;
        } else return null;
    }
}
class MockedChannelManager extends Map {
    channels: Map<string, AnyObj>;

    constructor(channels: [string, AnyObj][]) {
        super();

        this.channels = new Map(channels);
    }
    public async fetch(chatId: string): Promise<MockedChannelManager | null> {
        const chat = this.channels.get(chatId) as MockedChannelManager;

        if (chat) {
            return chat;
        } else return null;
    }
}

const MockedData = {
    channels: new MockedChannelManager([
        [
            "1000000000000000000",
            {
                id: "1000000000000000000",
                messages: new MockedMessageManager([
                    [
                        "0000000000000000001",
                        {
                            id: "0000000000000000001",
                        },
                    ],
                ]),
            },
        ],
        [
            "2000000000000000000",
            {
                id: "2000000000000000000",
                messages: new MockedMessageManager([
                    [
                        "0000000000000000002",
                        {
                            id: "0000000000000000002",
                        },
                    ],
                ]),
            },
        ],
    ]),
};


export const clientMock = {
    client: {
        channels: MockedData.channels,
    },
};
