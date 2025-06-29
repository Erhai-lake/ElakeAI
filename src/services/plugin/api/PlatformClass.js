import Logger from "@/services/Logger"

const NAME = "PluginAPI PlatformClass"
const PLATFORM_MAP = new Map()

/**
 * 平台类
 */
export class PlatformClass {
	constructor(info) {
		this.info = info
	}
	/**
	 * 注册平台
	 * @param {Object} api - API
	 */
	registerPlatform = (api) => {
		if (PLATFORM_MAP.has(this.info.name)) {
			Logger.warn(`[${NAME}] 平台已存在: ${this.info.name}`)
			return
		}
		PLATFORM_MAP.set(this.info.name, {info: this.info, api})
		Logger.info(`[${NAME}] 平台注册成功: ${this.info.name}`)
	}
	/**
	 * 注销平台
	 */
	unregisterPlatform = () => {
		if (PLATFORM_MAP.has(this.info.name)) {
			PLATFORM_MAP.delete(this.info.name)
			Logger.info(`[${NAME}] 平台注销成功: ${this.info.name}`)
		}
	}
	/**
	 * 获取平台实例
	 * @returns {Object|null} 平台API实例
	 */
	getPlatform = () => {
		if (!PLATFORM_MAP.has(this.info.name)) {
			Logger.warn(`[${NAME}] 平台不存在: ${this.info.name}`)
			return null
		}
		return PLATFORM_MAP.get(this.info.name)
	}
	/**
	 * 获取所有平台
	 * @returns {Array<Object>} 平台列表
	 */
	getAllPlatforms = () => {
		return Array.from(PLATFORM_MAP.entries()).map(([name, api]) => ({name, api}))
	}
}