import axios from "axios"
import General from "@/services/api/General"
import DB from "@/services/Dexie.js"

export default {
    async chat(chatKey, model, key, url, content, webSearch) {
        try {
            if (!model || typeof model !== "string") {
                throw new Error("无效的模型名称: 必须提供非空字符串")
            }
            if (!key || typeof key !== "string") {
                throw new Error("无效的API Key: 必须提供非空字符串")
            }
            if (!url || typeof url !== "string") {
                throw new Error("无效的API URL: 必须提供非空字符串")
            }
            if (!content || typeof content !== "string") {
                throw new Error("无效的API Content: 必须提供非空字符串")
            }
            if (webSearch && typeof webSearch !== "boolean") {
                throw new Error("无效的API WebSearch: 必须提供布尔值")
            }
            console.log({chatKey, model, key, url, content, webSearch})
            if (key === "auto") {
                throw new Error("很抱歉, 目前不支持自动选择API Key, 请手动选择, Key池还没写完呢")
            }
            switch (model) {
                case "DeepSeek":
                    console.log(await DB.APIKeys.get(key))
                // 获取聊天记录

                // if (webSearch) {
                //
                // } else {
                //
                // }
                // break
                case "ChatGPT":
                    break
                default:
                    throw new Error(`不支持的模型: ${model}`)
            }
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                // 处理超时错误
                console.error("[Chat Api]请求超时:", error.message)
                return {
                    balance: "请求超时",
                    key: key,
                    url: url,
                    timestamp: new Date().toISOString()
                }
            }
            if (error.response) {
                // 服务器返回了响应但状态码不在2xx范围
                if (!General.isValidApiResponse(error.response)) {
                    return false
                }
                console.error("[Chat Api]获取余额错误:", error.response.data)
            } else if (error.request) {
                // 请求已发出但没有收到响应
                console.error("[Chat Api]无响应:", error.request)
                return false
            } else {
                // 请求配置出错
                console.error("[Chat Api]配置错误:", error.message)
            }
            return false
        }
    }
}