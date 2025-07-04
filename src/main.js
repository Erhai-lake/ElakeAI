import { createApp } from "vue"
import app from "@/App.vue"
import router from "@/router"
import store from "@/store"

// 全局样式
import "@/assets/styles/theme.less"
// 数据库操作
import DB from "@/services/Dexie"
// 日志
import Logger, { setupLogCleanup } from "@/services/Logger"
// 插件管理
import { initEnabledPlugins } from "@/services/plugin/RegisterPlugins"
import { unloadPlugins } from "@/services/plugin/UnloadPlugins"

async function bootstrap() {
	try {
		const APP = createApp(app)

		APP.use(store)
		APP.use(router)
		APP.provide("$log", Logger)
		APP.provide("$DB", DB)

		// 插件卸载和初始化 —— 等待完成后再挂载
		await unloadPlugins()
		await initEnabledPlugins(APP)

		APP.mount("#app")
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
