const PLUGIN_INSTANCES = new Map()

function registerPluginInstance(uuid, mod) {
	PLUGIN_INSTANCES.set(uuid, mod)
}

async function unloadPlugins() {
	for (const [uuid, mod] of PLUGIN_INSTANCES.entries()) {
		try {
			if (typeof mod.onUnload === "function") {
				await mod.onUnload()
			}
		} catch (error) {
			console.warn(`[unloadPlugins] 插件卸载失败: ${uuid}`, error)
		}
	}
	PLUGIN_INSTANCES.clear()
}

module.exports = {
	unloadPlugins,
	registerPluginInstance
}