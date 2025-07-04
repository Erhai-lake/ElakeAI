import {createApp} from "vue"
import app from "@/App.vue"
import router from "@/router"
import store from "@/store"

// 全局样式
import "@/assets/styles/theme.less"
// 数据库操作
import DB from "@/services/Dexie"
// 日志
import Logger, {setupLogCleanup} from "@/services/Logger"
// 插件管理
import {initEnabledPlugins} from "@/services/plugin/RegisterPlugins"
import {unloadPlugins} from "@/services/plugin/UnloadPlugins"

async function bootstrap() {
	try {
		const APP = createApp(app)

		APP.use(store)
		APP.use(router)
		APP.provide("$log", Logger)
		APP.provide("$DB", DB)

		APP.mount("#app")
		const STARTUP_LOADING = document.getElementById("startup-loading")
		if (STARTUP_LOADING) {
			STARTUP_LOADING.remove()
		}

		try {
			await unloadPlugins()
			await initEnabledPlugins(APP)
			Logger.info("[main] 插件加载完成")
			window.dispatchEvent(new Event("plugin-ready"))
		} catch (error) {
			Logger.error("[main] 插件系统加载失败", error)
			window.dispatchEvent(new Event("plugin-fail"))
		}
	} catch (error) {
		Logger.error("[main] 启动失败", error)
	}
}

// 日志清理定时任务
void setupLogCleanup()
setInterval(setupLogCleanup, 24 * 60 * 60 * 1000)

bootstrap().catch(error => {
	Logger.error("[main] 启动失败", error)
})
