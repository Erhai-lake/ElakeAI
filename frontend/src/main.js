import {createApp} from "vue"
import App from "@/App.vue"
import router from "@/router"
import {InitConfigs} from "@/services/InitConfigs"

// 全局样式
import "@/assets/styles/theme.less"

async function bootstrap() {
	const APP = createApp(App)
	APP.use(router)

	// 全局阻止拖动
	document.addEventListener("dragstart", e => {
		const target = e.target
		if (target.tagName === "A") {
			e.preventDefault()
		}
	})
	// 额外保证 router-link 最终 a 标签不可拖动
	APP.mixin({
		mounted() {
			this.$el.querySelectorAll?.("a").forEach(a => a.setAttribute("draggable", "false"))
		}
	})

	await InitConfigs()

	APP.mount("#app")
}

bootstrap().catch(error => console.error("[main] 启动失败", error))