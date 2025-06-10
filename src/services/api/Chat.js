import DB from "@/services/Dexie.js"
import EventBus from "@/services/EventBus"

// 返回
const response = (APIKey, chatKey, data, error) => {
    return {
        error: error || "",
        data: data,
        key: APIKey,
        chatKey: chatKey,
        timestamp: Date.now()
    }
}

let abortController = null

// DeepSeek
const DeepSeek = async (keyData, chatKey, model, messages, dialogueId) => {
    if (abortController) {
        abortController.abort()
    }
    abortController = new AbortController()
    try {
        const RESPONSE = await fetch(`${keyData.url}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${keyData.value}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: true
            }),
            signal: abortController.signal
        })
        if (!RESPONSE.ok) {
            console.error(`[Chat Api] HTTP错误, 状态码: ${RESPONSE.status}`)
            if (RESPONSE.status === 500) {
                return response(keyData.key, chatKey, "NULL", "serverBusy")
            } else {
                return response(keyData.key, chatKey, "NULL", "httpError")
            }
        }
        if (!RESPONSE.body) {
            console.error("[Chat Api] 无响应体")
            return response(keyData.key, chatKey, "NULL", "noResponseBody")
        }
        const DECODER = new TextDecoder()
        let buffer = ""
        let assistantMessage = ""
        let streamMessage = ""
        const READER = RESPONSE.body.getReader()
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
                        EventBus.emit("[stream] streamComplete")
                        return response(keyData.key, chatKey, assistantMessage)
                    }
                    try {
                        const PARSED = JSON.parse(MESSAGE)
                        if (PARSED.choices?.[0]?.delta?.content) {
                            assistantMessage += PARSED.choices[0].delta.content
                            streamMessage = PARSED.choices[0].delta.content
                            EventBus.emit("[stream] streamStream", {
                                id: dialogueId,
                                message: streamMessage,
                                model: {
                                    largeModel: keyData.model,
                                    model: model
                                }
                            })
                        }
                    } catch (error) {
                        console.error("[Chat Api] 流式数据解析错误", error)
                        return response(keyData.key, chatKey, "NULL", "streamingDataParsingError")
                    }
                }
            }
        } catch (error) {
            console.error("[Chat Api] 流错误", error)
            return response(keyData.key, chatKey, "NULL", "streamError")
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error("[Chat Api] 请求已中止")
            return response(keyData.key, chatKey, "NULL", "requestCancelled")
        }
        if (error.message.includes('Failed to fetch')) {
            console.error("[Chat Api] 网络错误", error)
            return response(keyData.key, chatKey, "NULL", "networkError");
        } else if (error.message.includes('Unexpected token')) {
            console.error("[Chat Api] 无效响应", error)
            return response(keyData.key, chatKey, "NULL", "invalidResponse");
        } else {
            console.error("[Chat Api] 请求失败", error)
            return response(keyData.key, chatKey, "NULL", "requestFailed");
        }
    }
    return response(keyData.key, chatKey, "NULL")
}

// ChatGPT
const ChatGPT = async (keyData, chatKey, model, messages, dialogueId) => {
    if (abortController) {
        abortController.abort()
    }
    abortController = new AbortController()
    try {
        const RESPONSE = await fetch(`${keyData.url}/v1/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${keyData.value}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: true
            }),
            signal: abortController.signal
        })
        if (!RESPONSE.ok) {
            console.error(`[Chat Api] HTTP错误, 状态码: ${RESPONSE.status}`)
            if (RESPONSE.status === 500) {
                return response(keyData.key, chatKey, "NULL", "serverBusy")
            } else {
                return response(keyData.key, chatKey, "NULL", "httpError")
            }
        }
        if (!RESPONSE.body) {
            console.error("[Chat Api] 无响应体")
            return response(keyData.key, chatKey, "NULL", "noResponseBody")
        }
        const DECODER = new TextDecoder()
        let buffer = ""
        let assistantMessage = ""
        let streamMessage = ""
        const READER = RESPONSE.body.getReader()
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
                        EventBus.emit("[stream] streamComplete")
                        return response(keyData.key, chatKey, assistantMessage)
                    }
                    try {
                        const PARSED = JSON.parse(MESSAGE)
                        if (PARSED.choices?.[0]?.delta?.content) {
                            assistantMessage += PARSED.choices[0].delta.content
                            streamMessage = PARSED.choices[0].delta.content
                            EventBus.emit("[stream] streamStream", {
                                id: dialogueId,
                                message: streamMessage,
                                model: {
                                    largeModel: keyData.model,
                                    model: model
                                }
                            })
                        }
                    } catch (error) {
                        console.error("[Chat Api] 流式数据解析错误", error)
                        return response(keyData.key, chatKey, "NULL", "streamingDataParsingError")
                    }
                }
            }
        } catch (error) {
            console.error("[Chat Api] 流错误", error)
            return response(keyData.key, chatKey, "NULL", "streamError")
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error("[Chat Api] 请求已中止")
            return response(keyData.key, chatKey, "NULL", "requestCancelled")
        }
        if (error.message.includes('Failed to fetch')) {
            console.error("[Chat Api] 网络错误", error)
            return response(keyData.key, chatKey, "NULL", "networkError");
        } else if (error.message.includes('Unexpected token')) {
            console.error("[Chat Api] 无效响应", error)
            return response(keyData.key, chatKey, "NULL", "invalidResponse");
        } else {
            console.error("[Chat Api] 请求失败", error)
            return response(keyData.key, chatKey, "NULL", "requestFailed");
        }
    }
}

// 策略
const STRATEGIES = {
    DeepSeek: DeepSeek,
    ChatGPT: ChatGPT
}

export default {
    /**
     * 聊天
     * @param APIKey APIKey
     * @param chatKey chatKey
     * @param model 模型
     * @param content 内容
     * @param webSearch 是否启用Web搜索
     * @returns {Promise<{error: string, data: string, key: string, chatKey: string, timestamp: number}>}
     */
    async chat(APIKey, chatKey, model, content, webSearch) {
        // 参数验证
        if (!APIKey || typeof APIKey !== "string") {
            return response(APIKey, chatKey, "NULL", "invalidKey")
        }
        if (!chatKey || typeof chatKey !== "string") {
            return response(APIKey, chatKey, "NULL", "invalidChatKey")
        }
        if (!model || typeof model !== "string") {
            return response(APIKey, chatKey, "NULL", "invalidModel")
        }
        if (!content || typeof content !== "string") {
            return response(APIKey, chatKey, "NULL", "invalidContent")
        }
        if (typeof webSearch !== "boolean") {
            return response(APIKey, chatKey, "NULL", "invalidWebSearch")
        }
        // 拦截自动选择
        if (APIKey === "auto") {
            return response(APIKey, chatKey, "NULL", "noAuto")
        }
        // 获取信息
        let keyData, chatData
        try {
            [keyData, chatData] = await Promise.all([
                DB.APIKeys.get(APIKey),
                DB.Chats.get(chatKey)
            ])
            if (!keyData || !chatData) {
                console.error("[Chat Api] Key或ChatKey不存在")
                return response(APIKey, chatKey, "NULL", keyData ? "chatKeyDoesNotExist" : "keyDoesNotExist")
            }
        } catch (error) {
            console.error("[Chat Api] 获取Key或ChatKey信息错误", error)
            return response(APIKey, chatKey, "NULL", "getKeyError")
        }
        try {
            const QUERY_STRATEGY = STRATEGIES[keyData.model]
            if (!QUERY_STRATEGY) {
                console.error("[Chat Api] 不支持的模型")
                return response(APIKey, chatKey, "NULL", "unsupportedModel")
            }
            // 构建消息历史
            const messages = [
                ...chatData.data.map(item => item.message),
                {content, role: "user"}
            ]
            // 对话ID
            const DIALOGUE_ID = crypto.randomUUID()
            // 用户对话ID
            const USER_DIALOGUE_ID = crypto.randomUUID()
            // 用户消息
            EventBus.emit("[stream] userMessage", {id: USER_DIALOGUE_ID, message: content})
            // 调用策略
            const RESULT = await QUERY_STRATEGY(keyData, chatKey, model, messages, DIALOGUE_ID)
            if (RESULT.error) {
                EventBus.emit("[stream] chatError")
                return RESULT
            }
            // 保存消息
            await DB.Chats.update(chatKey, {
                data: [
                    ...chatData.data,
                    {
                        id: USER_DIALOGUE_ID,
                        message: {content, role: "user"},
                        timestamp: Date.now()
                    },
                    {
                        id: DIALOGUE_ID,
                        model: {
                            largeModel: keyData.model,
                            model: model,
                        },
                        message: {content: RESULT.data, role: "assistant"},
                        timestamp: Date.now()
                    }
                ]
            })
            // 更新列表
            EventBus.emit("[function] chatListGet")
            return RESULT
        } catch (error) {
            console.error("[Chat Api] 聊天处理错误", error)
            return response(APIKey, chatKey, "NULL", "chatProcessingError")
        }
    },
    async stop() {
        if (abortController) {
            abortController.abort()
            abortController = null
        }
    }
}
