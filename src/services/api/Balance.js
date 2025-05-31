import axios from "axios"
import General from "@/services/api/General"

export default {
    /**
     * 查询API余额
     * @param {string} model - 模型名称
     * @param {string} key - API Key值
     * @param {string} url - API基础URL
     * @returns {Promise<Object>} 余额信息
     * @throws {Error} 包含详细错误信息
     */
    async getBalance(model, key, url) {
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
            let Balance = "0"
            switch (model) {
                case "DeepSeek":
                    const API_CLIENT = axios.create({
                        baseURL: url,
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${key}`
                        },
                        timeout: 5000
                    })
                    const RESPONSE = await API_CLIENT.get("user/balance")
                    if (!General.isValidApiResponse(RESPONSE)) {
                        return false
                    }
                    Balance = `${RESPONSE.data.balance_infos[0].total_balance} ${RESPONSE.data.balance_infos[0].currency}`
                    break
                case "ChatGPT":
                    Balance = "无法查询"
            }
            return {
                balance: Balance,
                key: key,
                url: url,
                timestamp: new Date().toISOString()
            }
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                // 处理超时错误
                console.error("[Balance Api]请求超时:", error.message)
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
                console.error("[Balance Api]获取余额错误:", error.response.data)
            } else if (error.request) {
                // 请求已发出但没有收到响应
                console.error("[Balance Api]无响应:", error.request)
                return false
            } else {
                // 请求配置出错
                console.error("[Balance Api]配置错误:", error.message)
            }
            return false
        }
    }
}