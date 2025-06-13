export default class StreamChatHandler {
    /**
     * 初始化StreamChatHandler
     * @param {string} platform - 平台名称
     * @param eventBus - 事件总线
     * @param {DB} db - 数据库实例
     */
    constructor(platform, eventBus, db) {
        this.platform = platform
        this.eventBus = eventBus
        this.db = db
        this.abortController = null
    }

    /**
     * 处理流式响应
     * @param {Object} params - 请求参数
     * @param {Object} paramsData - 参数数据
     * @param {Response} response - 响应对象
     * @returns {Promise<Object>} 响应结果
     */
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
                        const UPDATED_MESSAGES = await this.handleStreamData(PARSED, {
                            dialogueId: DIALOGUE_ID,
                            model: params.model,
                            largeModel: paramsData.apiKeyData.model
                        }, {
                            reasoningMessage,
                            assistantMessage,
                            streamMessage
                        })
                        // 更新局部变量
                        reasoningMessage = UPDATED_MESSAGES.reasoningMessage
                        assistantMessage = UPDATED_MESSAGES.assistantMessage
                        streamMessage = UPDATED_MESSAGES.streamMessage
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

    /**
     * 处理完成事件
     * @param {Object} params - 请求参数
     * @param {Object} paramsData - 参数数据
     * @param {Object} messageData - 消息数据
     * @returns {Promise<void>}
     */
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

    /**
     * 处理流式数据
     * @param {Object} parsed - 解析后的数据
     * @param {Object} ids - 标识信息
     * @param {Object} messages - 消息对象
     * @returns {Promise<{}>}
     */
    async handleStreamData(parsed, ids, messages) {
        const UPDATED_MESSAGES = {...messages}

        if (parsed.choices?.[0]?.delta?.reasoning_content) {
            UPDATED_MESSAGES.reasoningMessage += parsed.choices[0].delta.reasoning_content
            UPDATED_MESSAGES.streamMessage = parsed.choices[0].delta.reasoning_content
            this.eventBus.emit("[stream] streamStream", {
                id: ids.dialogueId,
                reasoning: UPDATED_MESSAGES.streamMessage,
                model: {
                    largeModel: ids.largeModel,
                    model: ids.model
                }
            })
        }

        if (parsed.choices?.[0]?.delta?.content) {
            UPDATED_MESSAGES.assistantMessage += parsed.choices[0].delta.content
            UPDATED_MESSAGES.streamMessage = parsed.choices[0].delta.content
            this.eventBus.emit("[stream] streamStream", {
                id: ids.dialogueId,
                message: UPDATED_MESSAGES.streamMessage,
                model: {
                    largeModel: ids.largeModel,
                    model: ids.model
                }
            })
        }
        return UPDATED_MESSAGES
    }

    /**
     * 中止请求
     */
    abort() {
        if (this.abortController) {
            this.abortController.abort()
            this.abortController = null
        }
    }

    /**
     * 构建响应对象
     * @param {Object} params - 请求参数
     * @param {*} data - 响应数据
     * @param {string} [error] - 错误信息
     * @returns {Object} 响应对象
     */
    response(params, data, error) {
        return {
            error: error || "",
            data: data,
            traceability: params,
            timestamp: Date.now()
        }
    }
}