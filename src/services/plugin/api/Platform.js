import Logger from "@/services/Logger"
const NAME = "PluginAPI Platform"
const PLATFORM_MAP = new Map()

/**
 * 平台类
 */
export class platform {
	constructor(info) {
		this.info = info
		this.api = {
			registerPlatform: this.registerPlatform.bind(this),
			unregisterPlatform: this.unregisterPlatform.bind(this),
			response: this.response.bind(this)
		}
	}
	/**
	 * 注册平台
	 * @param {Object} apiInstance - 平台API实例
	 */
	registerPlatform(apiInstance) {
		if (PLATFORM_MAP.has(this.info.name)) {
			Logger.warn(`[${NAME}] 平台已存在: ${this.info.name}`)
			return
		}
		PLATFORM_MAP.set(this.info.name, {info: this.info, api: apiInstance})
		Logger.info(`[${NAME}] 平台注册成功: ${this.info.name}`)
	}
	/**
	 * 注销平台
	 */
	unregisterPlatform() {
		if (PLATFORM_MAP.has(this.info.name)) {
			PLATFORM_MAP.delete(this.info.name)
			Logger.info(`[${NAME}] 平台注销成功: ${this.info.name}`)
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

/**
 * 获取平台实例
 * @param {string} name - 平台名称
 * @returns {Object|null} 平台API实例
 */
export const getPlatform = (name) => {
	if (!PLATFORM_MAP.has(name)) {
		Logger.warn(`[${NAME}] 平台不存在: ${name}`)
		return null
	}
	return PLATFORM_MAP.get(name)
}

/**
 * 获取所有平台
 * @returns {Array<Object>} 平台列表
 */
export const getAllPlatforms = () => {
	return Array.from(PLATFORM_MAP.entries()).map(([name, api]) => ({ name, api }))
}