import DB from "@/services/Dexie"

let _cachedPlugins = null

/**
 * 加载浏览器环境的插件
 * @returns {*[]} - 返回插件信息数组
 */
const loadPluginsInBrowser = async () => {
	const PLUGINS = []
	try {
		const PLUGIN_JSONS = import.meta.glob("../../../plugins/system/**/plugin.json")
		for (const [jsonPath, jsonLoader] of Object.entries(PLUGIN_JSONS)) {
			const META = await jsonLoader()
			if (!META?.uuid) continue
			// 计算插件目录路径
			const FOLDER_PATH = jsonPath.replace("/plugin.json", "")
			// 入口文件路径(支持相对路径)
			const ENTRY_FILE_NAME = META.entry || "index.js"
			const ENTRY_PATH = `${FOLDER_PATH}/${ENTRY_FILE_NAME}`
			// 直接按路径动态 import (必须和 import.meta.glob 配合)
			const IMPORTER = import.meta.glob("../../../plugins/system/**", {eager: false})
			if (!IMPORTER[ENTRY_PATH]) {
				console.warn(`[PluginManager] 插件 ${META.name || META.uuid} 缺少入口文件: ${ENTRY_FILE_NAME}`)
				continue
			}
			const ENTRY = await IMPORTER[ENTRY_PATH]()
			PLUGINS.push({
				...META,
				system: true,
				entry: ENTRY
			})
		}
	} catch (error) {
		console.warn("[PluginManager] 加载本地插件失败", error)
	}
	return PLUGINS
}

/**
 * 加载Wails环境的插件
 * @returns {Promise<Array>} - 返回插件信息数组
 */
const loadPluginsInWails = async () => {
	const PLUGINS = await window.go.main.App.LoadPlugins()
	const RESULTS = []
	for (const PLUGIN of PLUGINS) {
		try {
			// 在 dev 模式, Vite 会从 frontend/plugins 里加载
			// 在 build 模式, 请求 /plugins/**, 走的是静态资源目录
			const URL = "/" + PLUGIN.entry.replace(/\\/g, "/")
			const ENTRY = await import(/* @vite-ignore */ URL)
			RESULTS.push({
				...PLUGIN,
				entry: ENTRY.default || ENTRY
			})
		} catch (error) {
			console.error(`[PluginManager] 插件 ${PLUGIN.name} 加载失败:`, error)
		}
	}
	return RESULTS
}

/**
 * 获取所有插件
 * @returns {Promise<Array>} - 返回插件信息数组
 */
const scanAllPlugins = async () => {
	if (_cachedPlugins) return _cachedPlugins
	if (window.go) {
		_cachedPlugins = await loadPluginsInWails()
	} else {
		try {
			_cachedPlugins = loadPluginsInBrowser()
		} catch (error) {
			console.warn("[PluginManager] 加载本地插件失败, 返回空列表", error)
			_cachedPlugins = []
		}
	}
	return _cachedPlugins
}

/**
 * 获取已启用的插件
 * 首次加载插件系统时, 如果未配置, 则默认启用所有插件
 * @returns {Promise<Array|*[]>}
 */
export async function getEnabledPlugins() {
	_cachedPlugins = null
	const ALL_PLUGINS = (await scanAllPlugins()).filter(p => !p.disabled)
	let CONFIG_DATA = await DB.configs.get("plugins")
	if (!CONFIG_DATA) {
		const ALL_UUIDS = ALL_PLUGINS.map(p => p.uuid)
		await DB.configs.add({item: "plugins", value: ALL_UUIDS})
		CONFIG_DATA = {value: ALL_UUIDS}
	}
	const ENABLED_UUIDS = CONFIG_DATA.value
	return ALL_PLUGINS.filter(p => ENABLED_UUIDS.includes(p.uuid))
}

/**
 * 获取所有插件
 * @returns {Promise<Array>}
 */
export async function getAllPlugins() {
	const ALL_PLUGINS = await scanAllPlugins()
	const ENABLED_UUIDS = new Set((await DB.configs.get("plugins"))?.value || [])
	return ALL_PLUGINS.map(p => ({...p, enabled: ENABLED_UUIDS.has(p.uuid)}))
}

/**
 * 更新插件启用状态
 * @param {string} uuid - 插件的UUID
 * @param {boolean} enabled - 是否启用
 */
export async function updatePluginEnabled(uuid, enabled) {
	const ALL_PLUGINS = await scanAllPlugins()
	const TARGET_PLUGIN = ALL_PLUGINS.find(p => p.uuid === uuid)
	if (enabled && TARGET_PLUGIN?.disabled) {
		console.warn(`[PluginManager] 禁止启用被标记为 disabled 的插件: ${TARGET_PLUGIN.name}`)
		return
	}
	if (TARGET_PLUGIN?.required) {
		console.warn(`[PluginManager] 禁止禁用被标记为 required 的插件: ${TARGET_PLUGIN.name}`)
		return
	}
	const CONFIG_DATA = (await DB.configs.get("plugins"))?.value || []
	const SET = new Set(CONFIG_DATA)
	enabled ? SET.add(uuid) : SET.delete(uuid)
	await DB.configs.put({item: "plugins", value: Array.from(SET)})
}