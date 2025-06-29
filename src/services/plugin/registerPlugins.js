import {getEnabledPlugins} from "@/services/plugin/pluginManager"
import {isElectron} from "@/services/env"
import Logger from "@/services/Logger"
import {registerPluginInstance, unloadPlugins} from "@/services/plugin/unloadPlugins"
// 平台注册器
import {platform} from "@/services/plugin/api/Platform"
import {dexie} from "@/services/plugin/api/Dexie"
import axios from "axios"

/**
 * 插件安装成功
 * @param plugin - 插件信息
 * @param mod - 插件模块
 * @param ctx - 插件上下文
 */
const onInstall = async (plugin, mod, ctx) => {
	if (typeof mod.onInstall === "function") {
		await mod.onInstall(ctx)
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
		await mod.onLoad(ctx)
		Logger.info(`[registerPlugins] 插件已加载: ${plugin.name}`)
	}
}

/**
 * 初始化已启用的插件
 * @param appContext - 应用上下文
 */
export async function initEnabledPlugins(appContext) {
	await unloadPlugins()
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
			const CTX = {
				// 插件信息
				plugin: PLUGIN,
				// 应用上下文
				app: appContext,
				api: {
					// 数据库操作类
					dbClass: dexie,
					axios: axios,
					// 平台注册类
					platformRegistrarClass: platform
				}
			}

			// 生命周期
			await onInstall(PLUGIN, mod, CTX)
			await onRegister(PLUGIN, mod, CTX)
			await onLoad(PLUGIN, mod, CTX)

			// 存储插件实例, 供卸载用
			registerPluginInstance(PLUGIN.uuid, mod)
		} catch (error) {
			Logger.warn(`[registerPlugins] 插件注册失败: ${PLUGIN.name}`, error)
		}
	}
}