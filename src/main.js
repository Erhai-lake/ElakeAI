import {createApp} from "vue"
import App from "@/App.vue"
import router from "@/router"
import store from "@/store"

// 全局样式
import "@/assets/styles/theme.less"

async function bootstrap() {
	const APP = createApp(App)
	APP.use(store)
	APP.use(router)
	APP.mount("#app")
}

bootstrap().catch(error => console.error("[main] 启动失败", error))