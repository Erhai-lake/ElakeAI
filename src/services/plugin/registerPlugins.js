import {getEnabledPlugins} from "@/services/plugin/pluginManager"
import {isElectron} from "@/services/env"
import Logger from "@/services/Logger"
import DB from "@/services/Dexie"
import {registerPluginInstance} from "@/services/plugin/unloadPlugins"

export async function initEnabledPlugins(appContext) {
	const PLUGINS = await getEnabledPlugins()
	const INSTALLED_UUIDS = new Set((await DB.configs.get("plugins"))?.value || [])

	for (const PLUGIN of PLUGINS) {
		try {
			let mod = null
			if (isElectron()) {
				try {
					const REQUIRE = typeof __webpack_require__ === "function" ? __non_webpack_require__ : require
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
			const CTX = {plugin: PLUGIN, app: appContext}

			// 安装检测与 onInstall
			if (!INSTALLED_UUIDS.has(PLUGIN.uuid) && typeof mod.onInstall === "function") {
				await mod.onInstall(CTX)
				INSTALLED_UUIDS.add(PLUGIN.uuid)
				await DB.configs.put({item: "plugins", value: Array.from(INSTALLED_UUIDS)})
				Logger.info(`[registerPlugins] 插件已安装: ${PLUGIN.name}`)
			}

			// 注册主功能
			if (typeof mod.register === "function") {
				mod.register(CTX)
				Logger.info(`[registerPlugins] 插件已注册: ${PLUGIN.name}`)
			}

			// onLoad
			if (typeof mod.onLoad === "function") {
				mod.onLoad(CTX)
			}

			// 存储插件实例, 供卸载用
			registerPluginInstance(PLUGIN.uuid, mod)
		} catch (error) {
			Logger.warn(`[registerPlugins] 插件注册失败: ${PLUGIN.name}`, error)
		}
	}
}