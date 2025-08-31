/**
 * 插件实例
 */
const PLUGIN_INSTANCES = new Map()

/**
 * 注册插件实例
 * @param uuid 插件uuid
 * @param mod 插件实例
 */
export function registerPluginInstance(uuid, mod) {
	PLUGIN_INSTANCES.set(uuid, mod)
}

/**
 * 卸载所有插件
 */
export async function unloadALlPlugins() {
	for (const [uuid, mod] of PLUGIN_INSTANCES.entries()) {
		try {
			if (typeof mod.onUnload === "function") {
				await mod.onUnload()
			}
		} catch (error) {
			console.warn(`[unloadALlPlugins] 插件卸载失败: ${uuid}`, error)
		}
	}
	PLUGIN_INSTANCES.clear()
}

/**
 * 按UUID卸载插件
 * @param uuid 插件uuid
 */
export async function unloadPlugin(uuid) {
	const MOD = PLUGIN_INSTANCES.get(uuid)
	if (!MOD) return
	try {
		if (typeof MOD.onUnload === "function") {
			await MOD.onUnload()
		}
	} catch (error) {
		console.warn(`[unloadPlugin] 插件卸载失败: ${uuid}`, error)
	}
	PLUGIN_INSTANCES.delete(uuid)
}