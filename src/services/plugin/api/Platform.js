import Logger from "@/services/Logger"
const PLATFORM_MAP = new Map()



/**
 * 注册平台
 * @param {string} name - 平台名称
 * @param {Object} apiInstance - 平台API实例
 */
export const registerPlatform = (name, apiInstance) => {
	if (PLATFORM_MAP.has(name)) {
		Logger.warn(`[PlatformRegistry] 平台已存在: ${name}`)
		return
	}
	PLATFORM_MAP.set(name, apiInstance)
	Logger.info(`[PlatformRegistry] 平台注册成功: ${name}`)
}

/**
 * 获取平台实例
 * @param {string} name - 平台名称
 * @returns {Object|null} 平台API实例
 */
export const getPlatform = (name) => {
	return PLATFORM_MAP.get(name)
}

/**
 * 获取所有平台
 * @returns {Array<Object>} 平台列表
 */
export const getAllPlatforms = () => {
	return Array.from(PLATFORM_MAP.entries()).map(([name, api]) => ({ name, api }))
}

/**
 * 注销平台
 * @param {string} name - 平台名称
 */
export const unregisterPlatform = (name) => {
	if (PLATFORM_MAP.has(name)) {
		PLATFORM_MAP.delete(name)
		Logger.info(`[PlatformRegistry] 平台注销成功: ${name}`)
	}
}

/**
 * 统一格式的响应封装
 * @param {Object} traceability - 追踪信息
 * @param {*} data - 响应数据
 * @param {string|null} error - 错误信息（可选）
 * @returns {{data: *, error, traceability: *, timestamp: *|number}}
 */
export const response = (traceability, data, error) => {
	return {
		error: error || "",
		data: data,
		traceability: traceability,
		timestamp: Date.now()
	}
}