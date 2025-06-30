import DB from "@/services/Dexie"
import {isElectron} from "@/services/Env"

let _cachedPlugins = null

/**
 * 加载浏览器环境的插件
 * @returns {*[]} - 返回插件信息数组
 */
const loadPluginsInBrowser = () => {
	const PLUGINS = []
	// require.context(路径, 是否递归, 正则)
	const PLUGIN_JSONS = require.context("../../plugins", true, /plugin\.json$/)
	const PLUGIN_ENTRIES = require.context("../../plugins", true, /index\.js$/)
	PLUGIN_JSONS.keys().forEach((jsonPath) => {
		const META = PLUGIN_JSONS(jsonPath)
		const FOLDER_PATH = jsonPath.replace("/plugin.json", "")
		const ENTRY_KEY = `${FOLDER_PATH}/index.js`
		if (!META?.uuid || !PLUGIN_ENTRIES.keys().includes(ENTRY_KEY)) return
		const entry = PLUGIN_ENTRIES(ENTRY_KEY)
		PLUGINS.push({
			...META,
			uuid: META.uuid,
			entry
		})
	})
	return PLUGINS
}

/**
 * 加载Electron环境的插件
 * @returns {Promise<Array>} - 返回插件信息数组
 */
const loadPluginsInElectron = async () => {
	const {ipcRenderer} = window.require("electron")
	return await ipcRenderer.invoke("get-all-plugins")
}

/**
 * 获取所有插件
 * @returns {Promise<Array>} - 返回插件信息数组
 */
const scanAllPlugins = async () => {
	if (_cachedPlugins) return _cachedPlugins
	if (isElectron()) {
		_cachedPlugins = await loadPluginsInElectron()
	} else {
		_cachedPlugins = loadPluginsInBrowser()
	}
	return _cachedPlugins
}

/**
 * 获取已启用的插件
 * @returns {Promise<Array|*[]>}
 */
export async function getEnabledPlugins() {
	_cachedPlugins = null
	const ALL_PLUGINS = await scanAllPlugins()
	const CONFIG_DATA = await DB.configs.get("plugins")
	// 不存在配置数据, 初始化配置数据
	if (!CONFIG_DATA) {
		await DB.configs.add({item: "plugins", value: []})
		return ALL_PLUGINS
	}
	const ENABLED_UUIDS = CONFIG_DATA?.value
	// 配置数据为空, 返回空数组
	if (Array.isArray(ENABLED_UUIDS) && ENABLED_UUIDS.length === 0) {
		return []
	}
	// 正常情况, 返回已启用的插件
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
	const CONFIG_DATA = (await DB.configs.get("plugins"))?.value || []
	const SET = new Set(CONFIG_DATA)
	enabled ? SET.add(uuid) : SET.delete(uuid)
	await DB.configs.put({item: "plugins", value: Array.from(SET)})
}