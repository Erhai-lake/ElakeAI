export default class StreamChatHandler {
    constructor(platform, eventBus, db) {
        this.platform = platform
        this.eventBus = eventBus
        this.db = db
        this.abortController = null
    }

    async handleStream(params, paramsData, response) {
        const DIALOGUE_ID = crypto.randomUUID()
        const USER_DIALOGUE_ID = crypto.randomUUID()

        // 发送用户消息事件
        this.eventBus.emit("[stream] userMessage", {
            id: USER_DIALOGUE_ID,
            message: params.content
        })

        if (!response.body) {
            return this.response(params, null, "noResponseBody")
        }

        const DECODER = new TextDecoder()
        let buffer = ""
        let reasoningMessage = ""
        let assistantMessage = ""
        let streamMessage = ""
        const READER = response.body.getReader()

        try {
            while (true) {
                const {done, value} = await READER.read()
                if (done) break

                buffer += DECODER.decode(value, {stream: true})
                const LINES = buffer.split("\n")
                buffer = LINES.pop()

                for (const LINE of LINES) {
                    if (!LINE.trim()) continue

                    const MESSAGE = LINE.replace(/^data: /, "")
                    if (MESSAGE === "[DONE]") {
                        await this.handleCompletion(params, paramsData, {
                            userMessageId: USER_DIALOGUE_ID,
                            dialogueId: DIALOGUE_ID,
                            userContent: params.content,
                            reasoning: reasoningMessage,
                            assistant: assistantMessage,
                            model: params.model,
                            largeModel: paramsData.apiKeyData.model
                        })
                        return this.response(params, {
                            reasoning: reasoningMessage,
                            assistant: assistantMessage
                        })
                    }

                    try {
                        const PARSED = JSON.parse(MESSAGE)
                        await this.handleStreamData(PARSED, {
                            dialogueId: DIALOGUE_ID,
                            model: params.model,
                            largeModel: paramsData.apiKeyData.model
                        }, {
                            reasoningMessage,
                            assistantMessage,
                            streamMessage
                        })
                    } catch (error) {
                        this.eventBus.emit("[stream] chatError")
                        return this.response(params, null, "streamingDataParsingError")
                    }
                }
            }
        } catch (error) {
            this.eventBus.emit("[stream] chatError")
            return this.response(params, null, "streamError")
        }
    }

    async handleCompletion(params, paramsData, messageData) {
        this.eventBus.emit("[stream] streamComplete")

        // 保存消息到数据库
        await this.db.Chats.update(params.chatKey, {
            data: [
                ...paramsData.chatKeyData.data,
                {
                    id: messageData.userMessageId,
                    message: {
                        content: messageData.userContent,
                        role: "user"
                    },
                    timestamp: Date.now()
                },
                {
                    id: messageData.dialogueId,
                    model: {
                        largeModel: messageData.largeModel,
                        model: messageData.model,
                    },
                    message: {
                        reasoning: messageData.reasoning,
                        content: messageData.assistant,
                        role: "assistant"
                    },
                    timestamp: Date.now()
                }
            ]
        })

        // 更新聊天列表
        this.eventBus.emit("[function] chatListGet")
    }

    async handleStreamData(parsed, ids, messages) {
        if (parsed.choices?.[0]?.delta?.reasoning_content) {
            messages.reasoningMessage += parsed.choices[0].delta.reasoning_content
            messages.streamMessage = parsed.choices[0].delta.reasoning_content
            this.eventBus.emit("[stream] streamStream", {
                id: ids.dialogueId,
                reasoning: messages.streamMessage,
                model: {
                    largeModel: ids.largeModel,
                    model: ids.model
                }
            })
        }

        if (parsed.choices?.[0]?.delta?.content) {
            messages.assistantMessage += parsed.choices[0].delta.content
            messages.streamMessage = parsed.choices[0].delta.content
            this.eventBus.emit("[stream] streamStream", {
                id: ids.dialogueId,
                message: messages.streamMessage,
                model: {
                    largeModel: ids.largeModel,
                    model: ids.model
                }
            })
        }
    }

    abort() {
        if (this.abortController) {
            this.abortController.abort()
            this.abortController = null
        }
    }

    response(params, data, error) {
        return {
            error: error || "",
            data: data,
            traceability: params,
            timestamp: Date.now()
        }
    }
}