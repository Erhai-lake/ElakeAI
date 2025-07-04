const FS = require("fs").promises
const PATH = require("path")
const Logger = require("./Logger")

const IS_DEV = process.env.NODE_ENV === "development" || process.env.VUE_DEV_SERVER_URL
const ROOT_PATH = IS_DEV ? __dirname : process.cwd()
const PLUGIN_DIR = PATH.join(ROOT_PATH, "plugins")
const SYSTEM_PLUGIN_DIR = PATH.join(PLUGIN_DIR, "system")

const NAME = "pluginLoader"

const scanAllPlugins = async () => {
	const PLUGINS = []

	try {
		await FS.mkdir(PLUGIN_DIR, {recursive: true})
	} catch (error) {
		Logger.error(`[${NAME}] 插件目录创建失败: ${PLUGIN_DIR}`, error)
		return PLUGINS
	}

	let DIRS = []
	try {
		DIRS = await FS.readdir(PLUGIN_DIR)
	} catch (error) {
		Logger.error(`[${NAME}] 读取插件目录失败: ${PLUGIN_DIR}`, error)
		return PLUGINS
	}

	for (const DIR of DIRS) {
		const PLUGIN_PATH = PATH.join(PLUGIN_DIR, DIR)
		const stat = await safeStat(PLUGIN_PATH)
		if (!stat?.isDirectory()) continue

		if (DIR === "system") {
			let SYSTEM_DIRS = []
			try {
				SYSTEM_DIRS = await FS.readdir(SYSTEM_PLUGIN_DIR)
			} catch (error) {
				Logger.warn(`[${NAME}] system 插件子目录读取失败: ${SYSTEM_PLUGIN_DIR}`, error)
				continue
			}

			for (const SUB_DIR of SYSTEM_DIRS) {
				const SUB_PATH = PATH.join(SYSTEM_PLUGIN_DIR, SUB_DIR)
				const subStat = await safeStat(SUB_PATH)
				if (!subStat?.isDirectory()) continue
				await loadPlugin(SUB_PATH, `${DIR}/${SUB_DIR}`, PLUGINS)
			}
		} else {
			await loadPlugin(PLUGIN_PATH, DIR, PLUGINS)
		}
	}

	return PLUGINS
}

const loadPlugin = async (pluginPath, id, list) => {
	const MANIFEST_PATH = PATH.join(pluginPath, "plugin.json")
	const stat = await safeStat(MANIFEST_PATH)
	if (!stat) {
		Logger.warn(`[pluginLoader] 插件 ${id} 缺少 plugin.json，已跳过`)
		return
	}

	try {
		const RAW = await FS.readFile(MANIFEST_PATH, "utf-8")
		const META = JSON.parse(RAW)
		if (!META.uuid) {
			Logger.warn(`[pluginLoader] 插件 ${id} 缺少 uuid，已跳过`)
			return
		}
		list.push({
			...META,
			path: pluginPath,
			entryPath: PATH.join(pluginPath, META.entry || "index.js"),
			system: pluginPath.startsWith(SYSTEM_PLUGIN_DIR)
		})
	} catch (error) {
		Logger.error(`[pluginLoader] 插件 ${id} 的 plugin.json 格式错误`, error)
	}
}

// 安全 stat
const safeStat = async (path) => {
	try {
		return await FS.stat(path)
	} catch {
		return null
	}
}

module.exports = {
	scanAllPlugins
}