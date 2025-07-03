const FS = require("fs")
const PATH = require("path")
const Logger = require("./Logger")

const IS_DEV = process.env.NODE_ENV === "development" || process.env.VUE_DEV_SERVER_URL
const ROOT_PATH = IS_DEV ? __dirname : process.cwd()
const PLUGIN_DIR = PATH.join(ROOT_PATH, "plugins")
const SYSTEM_PLUGIN_DIR = PATH.join(PLUGIN_DIR, "system")

const NAME = "pluginLoader"

const scanAllPlugins = () => {
	const PLUGINS = []

	if (!FS.existsSync(PLUGIN_DIR)) {
		Logger.warn(`[${NAME}] 插件目录不存在，正在尝试创建: ${PLUGIN_DIR}`)
		FS.mkdirSync(PLUGIN_DIR, {recursive: true})
		return []
	}

	const DIRS = FS.readdirSync(PLUGIN_DIR)

	for (const DIR of DIRS) {
		const PLUGIN_PATH = PATH.join(PLUGIN_DIR, DIR)
		if (!FS.statSync(PLUGIN_PATH).isDirectory()) continue
		if (DIR === "system") {
			const SYSTEM_DIRS = FS.readdirSync(SYSTEM_PLUGIN_DIR)
			for (const SUB_DIR of SYSTEM_DIRS) {
				const SUB_PATH = PATH.join(SYSTEM_PLUGIN_DIR, SUB_DIR)
				if (!FS.statSync(SUB_PATH).isDirectory()) continue
				loadPlugin(SUB_PATH, `${DIR}/${SUB_DIR}`, PLUGINS)
			}
		} else {
			loadPlugin(PLUGIN_PATH, DIR, PLUGINS)
		}
	}
	return PLUGINS
}

const loadPlugin = (pluginPath, id, list) => {
	const MANIFEST_PATH = PATH.join(pluginPath, "plugin.json")
	if (!FS.existsSync(MANIFEST_PATH)) {
		Logger.warn(`[pluginLoader] 插件 ${id} 缺少 plugin.json，已跳过`)
		return
	}
	try {
		const META = JSON.parse(FS.readFileSync(MANIFEST_PATH, "utf-8"))
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

module.exports = {
	scanAllPlugins
}