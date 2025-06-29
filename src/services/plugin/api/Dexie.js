import Logger from "@/services/Logger"
import DB from "@/services/Dexie"
const NAME = "PluginAPI Dexie"

/**
 * 数据库操作类
 */
export class dexie {
	constructor() {
		this.api = {
			// 查询apiKey数据
			getApiKeyData: this.getApiKeyData.bind(this),
			// 统一格式的响应封装
			response: this.response.bind(this)
		}
	}

	/**
	 * 查询apiKey数据
	 */
	async getApiKeyData(params) {
		try {
			if (!params.apiKey) {
				Logger.warn(`[${NAME}] apiKey为空`)
				return this.response(params, null, "keyDoesNotExist")
			}
			const KEY_DATA = await DB.apiKeys.get(params.apiKey)
			if (!KEY_DATA) {
				Logger.warn(`[${NAME}] 未找到apiKey: ${params.apiKey}`)
				return this.response(params, null, "keyDoesNotExist")
			}
			return KEY_DATA
		} catch (error) {
			Logger.error(`[${NAME}] 查询apiKey数据错误: ${params.apiKey}`, error)
			return this.response(params, null, "getKeyError")
		}
	}
	/**
	 * 统一格式的响应封装
	 * @param {Object} traceability - 追踪信息
	 * @param {*} data - 响应数据
	 * @param {string|null} error - 错误信息(可选)
	 * @returns {{data: *, error, traceability: *, timestamp: *|number}}
	 */
	response(traceability, data, error = "") {
		return {
			error: error,
			data: data,
			traceability: traceability,
			timestamp: Date.now()
		}
	}
}
