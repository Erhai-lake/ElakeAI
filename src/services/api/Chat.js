import axios from "axios"
import General from "@/services/api/General"
import DB from "@/services/Dexie.js"

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
const DeepSeek = async (keyData, messages, content) => {
    console.log("DeepSeek", {keyData, messages, content})
    return "NULL"
}

// ChatGPT
const ChatGPT = async (keyData, messages, content) => {
    console.log("ChatGPT", {keyData, messages, content})
    const API_CLIENT = axios.create({
        baseURL: keyData.url,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${keyData.value}`
        },
        timeout: REQUEST_TIMEOUT
    })
    const PAYLOAD = {
        // model: keyData.model,
        model: "gpt-3.5-turbo",
        messages: messages,
        stream: false
    }
    const RESPONSE = await API_CLIENT.post("v1/chat/completions", PAYLOAD)
    if (!General.isValidApiResponse(RESPONSE)) {
        console.error("[Chat Api] 获取聊天错误", RESPONSE.data)
        return response(keyData.key, "getChatError", true)
    }
    return {
        message: RESPONSE.data.choices[0].message.content,
        totalTokens: RESPONSE.data.usage.total_tokens
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
        // 获取Key信息
        let keyData = null
        try {
            keyData = await DB.APIKeys.get(APIKey)
            if (!keyData) {
                return response(APIKey, chatKey, "keyDoesNotExist", true)
            }
        } catch (error) {
            console.error("[Balance Api] 获取Key信息错误", error)
            return response(APIKey, chatKey, "getKeyError", true)
        }
        // 获取Key信息
        let chatData = null
        try {
            chatData = await DB.Chats.get(chatKey)
            if (!chatData) {
                return response(APIKey, chatKey, "chatKeyDoesNotExist", true)
            }
        } catch (error) {
            console.error("[Balance Api] 获取Key信息错误", error)
            return response(APIKey, chatKey, "getChatKeyError", true)
        }
        // console.log({keyData, chatData, content, webSearch})
        try {
            const QUERY_STRATEGY = STRATEGIES[keyData.model]
            if (!QUERY_STRATEGY) {
                console.error("不支持的模型")
                return response(APIKey, "unsupportedModel", true)
            }
            // 拼接上下文聊天
            let messages = chatData.data.map(item => item.message)
            messages.push({content: content, role: "user"})
            // 请求
            const RESPONSE = await QUERY_STRATEGY(keyData, messages, content)
            // 更新上下文聊天
            const DATA = [
                ...chatData.data,
                {
                    message: {content: content, role: "user"},
                    timestamp: new Date().getTime(),
                },
                {
                    model: keyData.model,
                    message: {content: RESPONSE.message, role: "assistant"},
                    timestamp: new Date().getTime(),
                }
            ]
            // 更新数据库
            await DB.Chats.update(chatKey, {data: DATA})
            return response(APIKey, chatKey, RESPONSE, false)
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