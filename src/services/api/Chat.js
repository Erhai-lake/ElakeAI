import axios from "axios"
import General from "@/services/api/General"

export default {
    async chat(model, key, url) {
        if (!model || typeof model!== "string") {
            throw new Error("无效的模型名称: 必须提供非空字符串")
        }
        if (!key || typeof key !== "string") {
            throw new Error("无效的API Key: 必须提供非空字符串")
        }
        if (!url || typeof url !== "string") {
            throw new Error("无效的API URL: 必须提供非空字符串")
        }
        try {
            switch (model) {
                case "DeepSeek":
                    break
                case "ChatGPT":
                    break
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