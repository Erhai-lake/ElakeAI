import axios from "axios"
import General from "@/services/api/General"
import DB from "@/services/Dexie.js"

const REQUEST_TIMEOUT = 5000

// 返回
const response = (APIKey, chatKey, data, error) => {
    if (error) {
        return {
            error: true,
            data: data,
            key: APIKey,
            chatKey: chatKey,
            timestamp: new Date().toISOString()
        }
    }
    return {
        error: false,
        data: data,
        key: APIKey,
        chatKey: chatKey,
        timestamp: new Date().toISOString()
    }
}

// DeepSeek
const DeepSeek = async (keyData, chatData, content) => {
    console.log("DeepSeek", {keyData, chatData, content})
    return "NULL"
}

// ChatGPT
const ChatGPT = async (keyData, chatData, content) => {
    console.log("ChatGPT", {keyData, chatData, content})
    return "NULL"
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
        console.log({keyData, chatData, content, webSearch})

        try {
            const QUERY_STRATEGY = STRATEGIES[keyData.model]
            if (!QUERY_STRATEGY) {
                console.error("不支持的模型")
                return response(APIKey, "unsupportedModel", true)
            }
            return response(APIKey, chatKey, await QUERY_STRATEGY(keyData, chatData, content), false)
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