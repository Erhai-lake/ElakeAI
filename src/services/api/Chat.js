import axios from "axios"
import General from "@/services/api/General"
import DB from "@/services/Dexie.js"
import EventBus from "@/services/EventBus"

const REQUEST_TIMEOUT = 5000

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

// DeepSeek
const DeepSeek = async (keyData, chatkey, messages, content, streamCallback) => {
    console.log("DeepSeek", {keyData, messages, content})
    return "NULL"
}

// ChatGPT
const ChatGPT = async (keyData, chatkey, messages, content, streamCallback) => {
    console.log("ChatGPT", {keyData, messages, content})
    const API_CLIENT = axios.create({
        baseURL: keyData.url,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${keyData.value}`
        },
        timeout: REQUEST_TIMEOUT,
        responseType: "stream"
    })
    const PAYLOAD = {
        // model: keyData.model,
        model: "gpt-3.5-turbo",
        messages: messages,
        stream: true
    }
    try {
        const RESPONSE = await API_CLIENT.post("v1/chat/completions", PAYLOAD)
        const READER = RESPONSE.data.getReader()
        const DECODER = new TextDecoder()
        let fullResponse = ""
        let buffer = ""
        while (true) {
            const {done, value} = await READER.read()
            if (done) break
            const CHUNK = DECODER.decode(value, {stream: true})
            buffer += CHUNK
            // 处理可能的多条消息
            const LINES = buffer.split("\n")
            // 保留不完整的行
            buffer = LINES.pop()
            for (const LINE of LINES) {
                if (LINE.trim() === "") continue
                if (LINE === "data: [DONE]") {
                    if (streamCallback) {
                        streamCallback({
                            partial: "",
                            full: fullResponse,
                            done: true
                        })
                    }
                    return {
                        message: fullResponse,
                        error: false
                    }
                }
                try {
                    if (LINE.startsWith("data: ")) {
                        const data = JSON.parse(LINE.substring(6))
                        if (data.choices?.[0]?.delta?.content) {
                            const content = data.choices[0].delta.content
                            fullResponse += content

                            if (streamCallback) {
                                streamCallback({
                                    partial: content,
                                    full: fullResponse,
                                    done: false
                                })
                            }
                        }
                    }
                } catch (error) {
                    console.error("[Chat Api] 流式数据解析错误", error)
                    return response(keyData.key, chatkey, "streamingDataParsingError", true)
                }
            }
        }
        return {
            message: fullResponse,
            error: false
        }
    } catch (error) {
        console.error("[Chat Api] 流式请求错误", error)
        return response(keyData.key, chatkey, "streamingRequestError", true)
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
            return response(APIKey, chatKey, "NoAuto", true)
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
            const FINAL_RESPONSE = {
                message: "",
                totalTokens: 0
            }
            // 添加用户消息到历史
            const USER_MESSAGE = {
                message: {content, role: "user"},
                timestamp: Date.now()
            }
            // 先保存用户消息
            const TEMP_DATA = [...chatData.data, USER_MESSAGE]
            await DB.Chats.update(chatKey, {data: TEMP_DATA})
            // 处理流式响应
            const HANDLE_STREAM = async ({partial, full, done, totalTokens}) => {
                if (done) {
                    FINAL_RESPONSE.message = full
                    FINAL_RESPONSE.totalTokens = totalTokens
                    // 保存完整响应
                    const ASSISTANT_MESSAGE = {
                        model: keyData.model,
                        message: {content: full, role: "assistant"},
                        timestamp: Date.now()
                    }

                    // 使用事务确保数据一致性
                    await DB.transaction("rw", DB.Chats, async () => {
                        const chat = await DB.Chats.get(chatKey)
                        await DB.Chats.update(chatKey, {
                            data: [...chat.data, ASSISTANT_MESSAGE]
                        })
                    })
                    EventBus.emit("stream-end", {chatKey, message: full})
                } else {
                    // 实时更新最后一条消息
                    await DB.transaction("rw", DB.Chats, async () => {
                        const chat = await DB.Chats.get(chatKey)
                        if (chat.data.length > 0) {
                            const lastMessage = chat.data[chat.data.length - 1]
                            if (lastMessage.message.role === "assistant") {
                                lastMessage.message.content = full
                                await DB.Chats.update(chatKey, {
                                    data: chat.data
                                })
                            }
                        }
                    })
                    EventBus.emit("stream-update", {chatKey, partial, full})
                }
            }
            // 调用策略
            const RESULT = await QUERY_STRATEGY(keyData, chatKey, messages, content, HANDLE_STREAM)
            return response(APIKey, chatKey, RESULT, false)
        } catch (error) {
            if (error.code === "ECONNABORTED") {
                // 处理超时错误
                console.error("[Balance Api] 请求超时", error.message)
                return response(APIKey, chatKey, "requestTimeout", true)
            } else if (error.code === "ERR_BAD_REQUEST") {
                // 处理错误的请求
                console.error("[Balance Api] 错误的请求", error.message)
                return response(APIKey, chatKey, "badRequest", true)
            } else if (error.code === "ERR_NETWORK") {
                // 处理网络错误
                console.error("[Balance Api] 网络错误", error.message)
                return response(APIKey, chatKey, "networkError", true)
            } else if (error.response) {
                // 服务器返回了响应但状态码不在2xx范围
                console.error("[Balance Api] 获取余额错误", error.response.data)
                if (!General.isValidApiResponse(error.response)) {
                    return response(APIKey, chatKey, "getBalanceError", true)
                }
            } else if (error.request) {
                // 请求已发出但没有收到响应
                console.error("[Balance Api] 无响应", error.request)
                return response(APIKey, chatKey, "noResponse", true)
            } else {
                // 请求配置出错
                console.error("[Balance Api] 未知错误", error.message)
                return response(APIKey, chatKey, "unknownError", true)
            }
        }
    }
}