import axios from "axios"
import General from "@/services/api/General"
import DB from "@/services/Dexie.js"

export default {
    /**
     * 查询API余额
     * @param {string} key - API Key值
     * @returns {Promise<Object>} 余额信息
     * @throws {Error} 包含详细错误信息
     */
    async getBalance(key) {
        try {
            if (!key || typeof key !== "string") {
                throw new Error("无效的API Key: 必须提供非空字符串")
            }
            const KEY_DATA = await DB.APIKeys.get(key)
            let Balance = "0"
            switch (KEY_DATA.model) {
                case "DeepSeek":
                    const API_CLIENT = axios.create({
                        baseURL: KEY_DATA.url,
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${KEY_DATA.value}`
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
                    break
                default:
                    throw new Error(`不支持的模型: ${KEY_DATA.model}`)
            }
            return {
                balance: Balance,
                key: key,
                timestamp: new Date().toISOString()
            }
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                // 处理超时错误
                console.error("[Balance Api]请求超时:", error.message)
                return {
                    balance: "请求超时",
                    key: key,
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