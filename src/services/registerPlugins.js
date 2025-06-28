import {getEnabledPlugins} from "@/services/pluginManager"
import {isElectron} from "@/services/env"
import Logger from "@/services/Logger"

export async function initEnabledPlugins() {
	const PLUGINS = await getEnabledPlugins()

	for (const PLUGIN of PLUGINS) {
		try {
			let mod = null
			if (isElectron()) {
				const REQUIRE = typeof __webpack_require__ === "function" ? __non_webpack_require__ : require
				try {
					mod = REQUIRE(PLUGIN.entryPath)
					mod = mod?.default || mod
				} catch (reqError) {
					Logger.info(`[registerPlugins] require错误: ${PLUGIN.name}`, reqError)
				}
			} else {
				mod = PLUGIN.entry
			}
			if (!mod) {
				Logger.warn(`[registerPlugins] 插件模块为空: ${PLUGIN.name}`)
				continue
			}
			if (typeof mod.register === "function") {
				mod.register()
				Logger.info(`[registerPlugins] 插件已注册: ${PLUGIN.name}`)
			} else {
				Logger.warn(`[registerPlugins] 插件 ${PLUGIN.name} 没有导出 register()`)
			}
		} catch (error) {
			Logger.warn(`[registerPlugins] 插件注册失败: ${PLUGIN.name}`, error)
		}
	}
}