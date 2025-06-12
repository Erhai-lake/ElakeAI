import axios from "axios"
import General from "@/services/api/General"
import DB from "@/services/Dexie"

const REQUEST_TIMEOUT = 10000

// 返回
const response = (APIKey, models, error) => {
    return {
        error: error || "",
        models: models,
        key: APIKey,
        timestamp: Date.now()
    }
}

// DeepSeek
const DeepSeek = async (keyData) => {
    const API_CLIENT = axios.create({
        baseURL: keyData.url,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${keyData.value}`
        },
        timeout: REQUEST_TIMEOUT
    })
    const RESPONSE = await API_CLIENT.get("models")
    if (!General.isValidApiResponse(RESPONSE)) {
        console.error("[Models Api] 获取错误", RESPONSE.data)
        return response(keyData.key, "NULL", "getError")
    }
    const MODELS = RESPONSE.data.data.map(model => model.id)
    return response(keyData.key, MODELS)
}

// ChatGPT
const ChatGPT = async (keyData) => {
    const API_CLIENT = axios.create({
        baseURL: keyData.url,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${keyData.value}`
        },
        timeout: REQUEST_TIMEOUT
    })
    const RESPONSE = await API_CLIENT.get("v1/models")
    if (!General.isValidApiResponse(RESPONSE)) {
        console.error("[Models Api] 获取错误", RESPONSE.data)
        return response(keyData.key, "NULL", "getError")
    }
    const MODELS = RESPONSE.data.data.map(model => model.id)
    return response(keyData.key, MODELS)
}

// 策略
const STRATEGIES = {
    DeepSeek: DeepSeek,
    ChatGPT: ChatGPT
}

export default {
    /**
     * 查询模型
     * @param {string} APIKey - API Key值
     * @returns {Promise<Object>} 模型信息
     */
    async getModel(APIKey) {
        // 参数验证
        if (!APIKey || typeof APIKey !== "string") {
            return response(APIKey, "NULL", "invalidKey")
        }
        // 获取Key信息
        let keyData = null
        try {
            keyData = await DB.APIKeys.get(APIKey)
            if (!keyData) {
                return response(APIKey, "NULL", "keyDoesNotExist")
            }
        } catch (error) {
            console.error("[Models Api] 获取Key信息错误", error)
            return response(APIKey, "NULL", "getKeyError")
        }
        try {
            const QUERY_STRATEGY = STRATEGIES[keyData.model]
            if (!QUERY_STRATEGY) {
                console.error("[Models Api] 不支持的模型")
                return response(APIKey, "NULL", "unsupportedModel")
            }
            return await QUERY_STRATEGY(keyData)
        } catch (error) {
            if (error.code === "ECONNABORTED") {
                // 处理超时错误
                console.error("[Models Api] 请求超时", error.message)
                return response(APIKey, "NULL", "requestTimeout")
            } else if (error.code === "ERR_BAD_REQUEST") {
                // 处理错误的请求
                console.error("[Models Api] 错误的请求", error.message)
                return response(APIKey, "NULL", "badRequest")
            } else if (error.code === "ERR_NETWORK") {
                // 处理网络错误
                console.error("[Models Api] 网络错误", error.message)
                return response(APIKey, "NULL", "networkError")
            } else if (error.response) {
                // 服务器返回了响应但状态码不在2xx范围
                console.error("[Models Api] 获取错误", error.response.data)
                if (!General.isValidApiResponse(error.response)) {
                    return response(APIKey, "NULL", "getError")
                }
            } else if (error.request) {
                // 请求已发出但没有收到响应
                console.error("[Models Api] 无响应", error.request)
                return response(APIKey, "NULL", "noResponse")
            } else {
                // 请求配置出错
                console.error("[Models Api] 未知错误", error.message)
                return response(APIKey, "NULL", "unknownError")
            }
        }
    }
}