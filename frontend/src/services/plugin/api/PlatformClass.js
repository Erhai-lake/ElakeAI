import Logger from "@/services/Logger"

const NAME = "PluginAPI PlatformClass"
const PLATFORM_MAP = new Map()

/**
 * 平台类
 */
export class PlatformClass {
	constructor() {
	}
	/**
	 * 注册平台
	 * @param info
	 * @param {Object} info - 平台信息
	 * @param {Object} api - API
	 */
	registerPlatform = (info, api) => {
		if (PLATFORM_MAP.has(info.name)) {
			Logger.warn(`[${NAME}] 平台已存在: ${info.name}`)
			return
		}
		PLATFORM_MAP.set(info.name, {info: info, api})
		Logger.info(`[${NAME}] 平台注册成功: ${info.name}`)
	}
	/**
	 * 注销平台
	 * @param {string} name - 平台名称
	 */
	unregisterPlatform = (name) => {
		if (PLATFORM_MAP.has(name)) {
			PLATFORM_MAP.delete(name)
			Logger.info(`[${NAME}] 平台注销成功: ${name}`)
		}
	}
	/**
	 * 获取平台实例
	 * @param {string} name - 平台名称
	 * @returns {Object|null} 平台API实例
	 */
	getPlatform = (name) => {
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
	getAllPlatforms = () => {
		return Array.from(PLATFORM_MAP.entries()).map(([name, api]) => ({name, api}))
	}
}

export const platformRegistry = new PlatformClass()