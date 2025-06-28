const Logger = require("./Logger")

const NAME = "pluginLoader"
const FS = require("fs")
const PATH = require("path")

const PLUGIN_DIR = PATH.join(__dirname, "../plugins")

const scanAllPlugins = () => {
	const PLUGINS = []

	if (!FS.existsSync(PLUGIN_DIR)) {
		Logger.warn(`[${NAME}] 插件目录不存在: ${PLUGIN_DIR}`)
		return PLUGINS
	}

	const DIRS = FS.readdirSync(PLUGIN_DIR)

	for (const DIR of DIRS) {
		const PLUGIN_PATH = PATH.join(PLUGIN_DIR, DIR)
		if (!FS.statSync(PLUGIN_PATH).isDirectory()) continue

		const MANIFEST_PATH = PATH.join(PLUGIN_PATH, "plugin.json")
		if (!FS.existsSync(MANIFEST_PATH)) {
			Logger.warn(`[${NAME}] 插件 ${DIR} 缺少 plugin.json, 已跳过`)
			continue
		}

		try {
			const META = JSON.parse(FS.readFileSync(MANIFEST_PATH, "utf-8"))
			if (!META.uuid) {
				Logger.warn(`[${NAME}] 插件 ${DIR} 缺少 uuid, 已跳过`)
				continue
			}

			// const ENTRY_PATH = PATH.join(PLUGIN_PATH, META.entry || "index.js")
			//
			// if (!FS.existsSync(ENTRY_PATH)) {
			// 	Logger.warn(`[${NAME}] 插件 ${DIR} 的入口文件不存在: ${ENTRY_PATH}`)
			// 	continue
			// }

			// let mod = require(ENTRY_PATH)
			// console.log(`[${NAME}] 插件 ${DIR} 已加载`)
			// mod = mod?.default || mod
			// console.log(mod)

			// if (typeof mod.register === "function") {
			// 	mod.register()
			// 	Logger.info(`[${NAME}] 插件已注册: ${META.name || DIR}`)
			// } else {
			// 	Logger.warn(`[${NAME}] 插件 ${META.name || DIR} 没有导出 register() 方法`)
			// }

			PLUGINS.push({
				...META,
				path: PLUGIN_PATH,
				entryPath: PATH.join(PLUGIN_PATH, META.entry || "index.js")
			})
		} catch (error) {
			Logger.error(`[${NAME}] 插件 ${DIR} 的 plugin.json 格式错误`, error)
		}
	}
	return PLUGINS
}

module.exports = {
	scanAllPlugins
}