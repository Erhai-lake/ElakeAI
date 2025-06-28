import {getEnabledPlugins} from "@/services/plugin/pluginManager"
import {isElectron} from "@/services/env"
import Logger from "@/services/Logger"
import DB from "@/services/Dexie"
import {registerPluginInstance} from "@/services/plugin/unloadPlugins"

/**
 * 插件首次安装
 * @param plugin - 插件信息
 * @param mod - 插件模块
 * @param ctx - 插件上下文
 */
const onFirstTimeInstall = async (plugin, mod, ctx) => {
	const INSTALLED_UUIDS = new Set((await DB.configs.get("plugins"))?.value || [])
	if (typeof mod.onFirstTimeInstall === "function") {
		if (!INSTALLED_UUIDS.has(plugin.uuid)){
			await mod.onFirstTimeInstall(ctx)
			INSTALLED_UUIDS.add(plugin.uuid)
			await DB.configs.put({item: "plugins", value: Array.from(INSTALLED_UUIDS)})
			Logger.info(`[registerPlugins] 插件首次安装: ${plugin.name}`)
		}
		await onInstall(plugin, mod, ctx)
	}
}

/**
 * 插件安装成功
 * @param plugin - 插件信息
 * @param mod - 插件模块
 * @param ctx - 插件上下文
 */
const onInstall = async (plugin, mod, ctx) => {
	if (typeof mod.onInstall === "function") {
		await mod.onInstall(ctx)
		await onRegister(plugin, mod, ctx)
		Logger.info(`[registerPlugins] 插件安装成功: ${plugin.name}`)
	}
}

/**
 * 注册插件主功能
 * @param plugin - 插件信息
 * @param mod - 插件模块
 * @param ctx - 插件上下文
 */
const onRegister = async (plugin, mod, ctx) => {
	if (typeof mod.onRegister === "function") {
		await mod.onRegister(ctx)
		await onLoad(plugin, mod, ctx)
		Logger.info(`[registerPlugins] 插件已注册: ${plugin.name}`)
	}
}

/**
 * 插件加载完成
 * @param plugin - 插件信息
 * @param mod - 插件模块
 * @param ctx - 插件上下文
 */
const onLoad = async (plugin, mod, ctx) => {
	if (typeof mod.onLoad === "function") {
		mod.onLoad(ctx)
		Logger.info(`[registerPlugins] 插件已加载: ${plugin.name}`)
	}
}

/**
 * 初始化已启用的插件
 * @param appContext - 应用上下文
 */
export async function initEnabledPlugins(appContext) {
	const PLUGINS = await getEnabledPlugins()

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

			// 安装检测
			await onFirstTimeInstall(PLUGIN, mod, CTX)

			// 存储插件实例, 供卸载用
			registerPluginInstance(PLUGIN.uuid, mod)
		} catch (error) {
			Logger.warn(`[registerPlugins] 插件注册失败: ${PLUGIN.name}`, error)
		}
	}
}