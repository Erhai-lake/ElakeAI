const PLUGIN_INSTANCES = new Map()

export function registerPluginInstance(uuid, mod) {
	PLUGIN_INSTANCES.set(uuid, mod)
}

export async function unloadPlugins() {
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
