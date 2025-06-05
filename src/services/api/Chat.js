import axios from "axios"
import DB from "@/services/Dexie.js"
import EventBus from "@/services/EventBus"


// 返回
const response = (APIKey, chatKey, data, error) => {
    return {
        error: error,
        data: data,
        key: APIKey,
        chatKey: chatKey,
        timestamp: new Date().getTime()
    }
}

// 处理流式响应
const handleStreamResponse = async (response, model) => {
    const DECODER = new TextDecoder()
    let buffer = ""
    let assistantMessage = ""
    let streamMessage = ""
    const READER = response.body.getReader()
    const readChunk = async () => {
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
                        EventBus.emit("[ChatView] messageComplete")
                        return assistantMessage
                    }
                    try {
                        const PARSED = JSON.parse(MESSAGE)
                        if (PARSED.choices?.[0]?.delta?.content) {
                            assistantMessage += PARSED.choices[0].delta.content
                            streamMessage = PARSED.choices[0].delta.content
                            EventBus.emit("[ChatView] messageStream", {message: streamMessage, model: model})
                        }
                    } catch (error) {
                        console.error("[Chat Api] 流式数据解析错误", error);
                        return "streamingDataParsingError"
                    }
                }
            }
        } catch (error) {
            console.error("[Chat Api] 流错误", error);
            return "streamError"
        }
    }
    return readChunk()
}

// DeepSeek
const DeepSeek = async (keyData, chatKey, messages) => {
    return "NULL"
}

// ChatGPT
const ChatGPT = async (keyData, chatKey, messages) => {
    try {
        const RESPONSE = await fetch(`${keyData.url}/v1/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${keyData.value}`
            },
            body: JSON.stringify({
                // model: keyData.model,
                model: "gpt-3.5-turbo",
                messages: messages,
                stream: true
            })
        })
        if (!RESPONSE.ok) {
            console.error(`[Chat Api] HTTP错误, 状态码: ${RESPONSE.status}`)
            return response(keyData.key, chatKey, "httpError", true)
        }
        if (!RESPONSE.body) {
            console.error("[Chat Api] 无响应体")
            return response(keyData.key, chatKey, "noResponseBody", true)
        }
        return await handleStreamResponse(RESPONSE, keyData.model)
    } catch (error) {
        console.error("[Chat Api] 流式请求错误", error)
        return response(keyData.key, chatKey, "streamingRequestError", true)
    }
}

// 策略
const STRATEGIES = {
    DeepSeek: DeepSeek,
    ChatGPT: ChatGPT
}

export default {
    async chat(APIKey, chatKey, content, webSearch) {
        // 参数验证
        if (!APIKey || typeof APIKey !== "string") {
            return response(APIKey, chatKey, "invalidKey", true)
        }
        if (!chatKey || typeof chatKey !== "string") {
            return response(chatKey, chatKey, "invalidChatKey", true)
        }
        if (!content || typeof content !== "string") {
            return response(content, chatKey, "invalidContent", true)
        }
        if (typeof webSearch !== "boolean") {
            return response(webSearch, chatKey, "invalidWebSearch", true)
        }
        // 拦截自动选择
        if (APIKey === "auto") {
            return response(APIKey, chatKey, "noAuto", true)
        }
        // 获取信息
        let keyData, chatData
        try {
            [keyData, chatData] = await Promise.all([
                DB.APIKeys.get(APIKey),
                DB.Chats.get(chatKey)
            ])
            if (!keyData || !chatData) {
                console.error("[Balance Api] Key或ChatKey不存在")
                return response(APIKey, chatKey, keyData ? "chatKeyDoesNotExist" : "keyDoesNotExist", true)
            }
        } catch (error) {
            console.error("[Balance Api] 获取Key或ChatKey信息错误", error)
            return response(APIKey, chatKey, "getKeyError", true)
        }
        try {
            const QUERY_STRATEGY = STRATEGIES[keyData.model]
            if (!QUERY_STRATEGY) {
                console.error("不支持的模型")
                return response(APIKey, "unsupportedModel", true)
            }
            // 构建消息历史
            const messages = [
                ...chatData.data.map(item => item.message),
                {content, role: "user"}
            ]
            // 用户消息
            EventBus.emit("[ChatView] userMessage", content)
            // 调用策略
            const RESULT = await QUERY_STRATEGY(keyData, chatKey, messages)
            // 保存消息
            await DB.Chats.update(chatKey, {
                data: [
                    ...chatData.data,
                    {
                        message: {content, role: "user"},
                        timestamp: Date.now()
                    },
                    {
                        model: keyData.model,
                        message: {content: RESULT, role: "assistant"},
                        timestamp: Date.now()
                    }
                ]
            })
            return response(APIKey, chatKey, RESULT, false)
        } catch (error) {
            console.error("[Chat Api] 聊天处理错误", error)
            return response(APIKey, chatKey, "chatProcessingError", true)
        }
    }
}