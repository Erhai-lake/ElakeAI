const Logger = require("./Logger")

const FS = require("fs")
const PATH = require("path")

const IS_DEV = process.env.NODE_ENV === "development" || process.env.VUE_DEV_SERVER_URL
const ROOT_PATH = IS_DEV ? __dirname : process.cwd()
const PLUGIN_DIR = PATH.join(ROOT_PATH, "plugins")

const NAME = "pluginLoader"

const scanAllPlugins = () => {
	const PLUGINS = []

	if (!FS.existsSync(PLUGIN_DIR)) {
		Logger.warn(`[${NAME}] 插件目录不存在，正在尝试创建: ${PLUGIN_DIR}`)
		FS.mkdirSync(PLUGIN_DIR, { recursive: true })
		return []
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

			PLUGINS.push({
				...META,
				path: PLUGIN_PATH,
				entryPath: PATH.join(PLUGIN_PATH, META.entry || "I18n.js")
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