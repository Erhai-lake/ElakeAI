import BaseAPI from "@/services/api/BaseAPI"
import EventBus from "@/services/EventBus"
import DB from "@/services/Dexie"
import StreamChatHandler from "@/services/api/StreamChatHandler"

export default class DeepSeekAPI extends BaseAPI {
    /**
     * 构造函数
     */
    constructor() {
        super("ChatGPT")
        this.chatHandler = new StreamChatHandler("ChatGPT", EventBus, DB)
        this.registerStrategy("balance", this.balanceStrategy)
        this.registerStrategy("models", this.modelsStrategy)
        this.registerStrategy("chat", this.chatStrategy)
        this.registerStrategy("stop", this.chatStopStrategy)
    }

    /**
     * 获取余额信息
     * @param {Object} params - 请求参数
     * @returns {Promise<Object>} 余额信息
     */
    balanceStrategy = async (params) => {
        return this.response(params, "NULL")
    }

    /**
     * 获取模型信息
     * @param {Object} params - 请求参数
     * @param {Object} paramsData - 参数数据
     * @returns {Promise<Object>} 模型信息
     */
    modelsStrategy = async (params, paramsData) => {
        const CLIENT = this.createClient(paramsData.apiKeyData)
        const RESPONSE = await CLIENT.get("v1/models")
        if (!this.isValidApiResponse(RESPONSE)) {
            return this.response(params, null, "getError")
        }
        const MODELS = RESPONSE.data.data.map(model => model.id)
        return this.response(params, MODELS)
    }

    /**
     * 发送聊天请求
     * @param {Object} params - 请求参数
     * @param {Object} paramsData - 参数数据
     * @returns {Promise<Object>} 响应结果
     */
    chatStrategy = async (params, paramsData) => {
        this.chatHandler.abort()
        this.chatHandler.abortController = new AbortController()

        try {
            // 构建消息历史
            const MESSAGES = this.buildingMessageHistory(paramsData.chatKeyData, params.content)
            const RESPONSE = await fetch(`${paramsData.apiKeyData.url}/v1/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${paramsData.apiKeyData.value}`
                },
                body: JSON.stringify({
                    model: params.model,
                    messages: MESSAGES,
                    stream: true
                }),
                signal: this.chatHandler.abortController.signal
            })
            if (!RESPONSE.ok) {
                if (RESPONSE.status === 500) {
                    return this.response(params, null, "serverBusy")
                } else {
                    return this.response(params, null, "httpError")
                }
            }
            return await this.chatHandler.handleStream(params, paramsData, RESPONSE)
        } catch (error) {
            return this.handleChatError(error, params)
        }
    }

    /**
     * 处理聊天错误
     * @param {Error} error - 错误对象
     * @param {Object} params - 请求参数
     * @returns {{data: *, error, traceability: *, timestamp: *|number}} 错误响应
     */
    handleChatError(error, params) {
        if (error.name === "AbortError") {
            return this.response(params, null, "requestCancelled")
        }
        if (error.message.includes("Failed to fetch")) {
            return this.response(params, null, "networkError")
        } else if (error.message.includes("Unexpected token")) {
            return this.response(params, null, "invalidResponse")
        }
        return this.response(params, null, "requestFailed")
    }

    /**
     * 终止当前聊天请求
     */
    chatStopStrategy = () => {
        this.chatHandler.abort()
    }
}
