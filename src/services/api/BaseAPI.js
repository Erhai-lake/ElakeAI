import axios from "axios"
import DB from "@/services/Dexie"

const REQUEST_TIMEOUT = 10000

export default class BaseAPI {
	/**
	 * 初始化API客户端
	 * @param {string} platform - 平台名称
	 */
	constructor(platform) {
		this.platform = platform
		this.strategies = {}
	}

	/**
	 * 构建响应对象
	 * @param {*} traceability - 追踪信息
	 * @param {*} data - 响应数据
	 * @param {string} [error] - 错误信息
	 * @returns {Object} 响应对象
	 */
	response(traceability, data, error) {
		return {
			error: error || "",
			data: data,
			traceability: traceability,
			timestamp: Date.now()
		}
	}

	/**
	 * 创建API客户端
	 * @param {Object} keyData - Key数据
	 * @returns {Object} API客户端
	 */
	createClient(keyData) {
		return axios.create({
			baseURL: keyData.url,
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${keyData.value}`
			},
			timeout: REQUEST_TIMEOUT
		})
	}

	/**
	 * 注册API调用策略
	 * @param {string} modelName - 模型名称
	 * @param {Function} strategy - 调用策略
	 */
	registerStrategy(modelName, strategy) {
		this.strategies[modelName] = strategy
	}

	/**
	 * 检查API响应是否有效
	 * @param {Object} response - API响应对象
	 * @returns {boolean} 是否为有效的API响应
	 */
	isValidApiResponse(response) {
		const contentType = response.headers["content-type"]
		return contentType && contentType.includes("application/json")
	}

	/**
	 * 执行API调用
	 * @param {string} callPolicy - 调用策略
	 * @param {Object} params - 请求参数
	 * @returns {Promise<Object>} 响应对象
	 */
	async execute(callPolicy, params) {
		let paramsData = {}
		// 获取APIKey信息(如果有)
		if (params?.apiKey) {
			const API_KEY_DATA = await this.getAPIKeyData(params.apiKey, params)
			paramsData.apiKeyData = API_KEY_DATA
			if (API_KEY_DATA.error) {
				return this.response(params, null, API_KEY_DATA.error)
			}
		}
		// 获取ChatKey信息(如果有)
		if (params?.chatKey) {
			const CHAT_KEY_DATA = await this.getChatKeyData(params.chatKey, params)
			paramsData.chatKeyData = CHAT_KEY_DATA
			if (CHAT_KEY_DATA.error) {
				return this.response(params, null, CHAT_KEY_DATA.error)
			}
		}
		try {
			const STRATEGY = this.strategies[callPolicy]
			if (!STRATEGY) {
				return this.response(params, null, "unsupportedCallPolicy")
			}
			return await STRATEGY(params, paramsData)
		} catch (error) {
			if (error.code === "ECONNABORTED") {
				// 处理超时错误
				return this.response(params, "NULL", "requestTimeout")
			} else if (error.code === "ERR_BAD_REQUEST") {
				// 处理错误的请求
				return this.response(params, "NULL", "badRequest")
			} else if (error.code === "ERR_NETWORK") {
				// 处理网络错误
				return this.response(params, "NULL", "networkError")
			} else if (error.response) {
				// 服务器返回了响应但状态码不在2xx范围
				if (!this.isValidApiResponse(error.response)) {
					return this.response(params, "NULL", "getError")
				}
			} else if (error.request) {
				// 请求已发出但没有收到响应
				return this.response(params, "NULL", "noResponse")
			} else {
				// 请求配置出错
				return this.response(params, "NULL", "unknownError")
			}
		}
	}

	/**
	 * 获取APIKey信息
	 * @param {string} key - API Key
	 * @param {Object} params - 追踪信息
	 * @returns {Promise<Object>} API Key信息
	 */
	async getAPIKeyData(key, params) {
		try {
			const KEY_DATA = await DB.apiKeys.get(key)
			if (!KEY_DATA) {
				return this.response(params, null, "keyDoesNotExist")
			}
			return KEY_DATA
		} catch (error) {
			return this.response(params, null, "getKeyError")
		}
	}

	/**
	 * 获取ChatKey信息
	 * @param {string} key - Chat Key
	 * @param {Object} params - 追踪信息
	 * @returns {Promise<Object>} Chat Key信息
	 */
	async getChatKeyData(key, params) {
		try {
			const KEY_DATA = await DB.chats.get(key)
			if (!KEY_DATA) {
				return this.response(params, null, "keyDoesNotExist")
			}
			return KEY_DATA
		} catch (error) {
			return this.response(params, null, "getKeyError")
		}
	}

	/**
	 * 构建消息历史
	 * @param {Object} chatKeyData - Chat Key信息
	 * @param {string} content - 消息内容
	 * @returns {Array<Object>} 消息历史
	 */
	buildingMessageHistory(chatKeyData, content) {
		return [...chatKeyData.data.map(item => item.message), {content: content, role: "user"}]
	}
}