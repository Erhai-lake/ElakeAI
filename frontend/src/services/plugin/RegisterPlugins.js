import {getEnabledPlugins} from "@/services/plugin/PluginManager"
import Logger from "@/services/Logger"
import {registerPluginInstance, unloadALlPlugins} from "@/services/plugin/UnloadALlPlugins"
import {PlatformClass} from "@/services/plugin/api/PlatformClass"
import {PublicClass} from "@/services/plugin/api/PublicClass"
import axios from "axios"
import dexie from "@/services/Dexie"
import {I18nClass} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import EventBus from "@/services/EventBus"
import {ThemeClass} from "@/services/plugin/api/ThemeClass"

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
 * 上下文
 */
const CTX = (plugin, appContext) => {
	return {
		// 插件信息
		plugin: plugin,
		// 应用上下文
		app: appContext,
		api: {
			// 公共类
			PublicClass: PublicClass,
			// i18n类
			I18nClass: I18nClass,
			// 数据库实例
			dexie: dexie,
			// axios实例
			axios: axios,
			// 平台注册类
			PlatformRegistrarClass: PlatformClass,
			// 主题注册类
			ThemeClass: ThemeClass,
			// 通知
			ToastClass: toastRegistry,
			// 日志
			logger: Logger
		}
	}
}

/**
 * 初始化所有插件
 * @param appContext - 应用上下文
 */
export async function initAllPlugins(appContext) {
	await unloadALlPlugins()
	const PLUGINS = await getEnabledPlugins()
	for (let i = 0; i < PLUGINS.length; i++) {
		const PLUGIN = PLUGINS[i]
		try {
			let mod = null
			if(window.go){
				mod = PLUGIN.entry
			} else {
				mod = PLUGIN.entry.default
			}
			if (!mod) {
				Logger.warn(`[registerPlugins] 插件模块为空: ${PLUGIN.name}`)
				continue
			}
			const CONTEXT = CTX(PLUGIN, appContext)
			// 生命周期
			await onInstall(PLUGIN, mod, CONTEXT)
			await onRegister(PLUGIN, mod, CONTEXT)
			await onLoad(PLUGIN, mod, CONTEXT)
			// 存储插件实例, 供卸载用
			registerPluginInstance(PLUGIN.uuid, mod)
		} catch (error) {
			Logger.warn(`[registerPlugins] 插件注册失败: ${PLUGIN.name}`, error)
		}
	}
	EventBus.emit("[update] pluginReady")
}

/**
 * 初始化单个插件
 * @param uuid 插件UUID
 */
export async function initPlugin(uuid) {
	const PLUGINS = await getEnabledPlugins()
	const PLUGIN = PLUGINS.find(p => p.uuid === uuid)
	if (!PLUGIN) return
	try {
		let mod = null
		if(window.go){
			mod = PLUGIN.entry
		} else {
			mod = PLUGIN.entry.default
		}
		if (!mod) {
			Logger.warn(`[registerPlugins] 插件模块为空: ${PLUGIN.name}`)
			return
		}
		const CONTEXT = CTX(PLUGIN)
		// 生命周期
		await onInstall(PLUGIN, mod, CONTEXT)
		await onRegister(PLUGIN, mod, CONTEXT)
		await onLoad(PLUGIN, mod, CONTEXT)
		// 存储插件实例, 供卸载用
		registerPluginInstance(PLUGIN.uuid, mod)
	} catch (error) {
		Logger.warn(`[registerPlugins] 插件注册失败: ${PLUGIN.name}`, error)
	}
}
