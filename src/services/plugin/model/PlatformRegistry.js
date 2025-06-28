import Logger from "@/services/Logger"
const PLATFORM_MAP = new Map()

export const registerPlatform = (name, apiInstance) => {
	if (PLATFORM_MAP.has(name)) {
		Logger.warn(`[PlatformRegistry] 平台已存在: ${name}`)
		return
	}
	PLATFORM_MAP.set(name, apiInstance)
	console.log(PLATFORM_MAP)
	Logger.info(`[PlatformRegistry] 平台注册成功: ${name}`)
}

export const getPlatform = (name) => {
	return PLATFORM_MAP.get(name)
}

export const getAllPlatforms = () => {
	return Array.from(PLATFORM_MAP.entries()).map(([name, api]) => ({ name, api }))
}

export const unregisterPlatform = (name) => {
	if (PLATFORM_MAP.has(name)) {
		PLATFORM_MAP.delete(name)
		Logger.info(`[PlatformRegistry] 平台注销成功: ${name}`)
	}
}
