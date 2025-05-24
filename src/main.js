import {createApp} from "vue"
import app from "@/App.vue"
import router from "@/router"
import store from "@/store"
// 全局样式
import "@/assets/styles/theme.less"
// 数据库操作
import {DB_CONFIG} from "@/services/db-config"
import {DBOperation} from "@/services/DBOperation"
// 多语言(i18n)
import i18n from "./i18n"
// Toast 通知
import toastPlugin from "vue-toast-notification"
import "vue-toast-notification/dist/theme-bootstrap.css"

const APP = createApp(app)

// Toast 配置
const TOAST_OPTIONS = {
    type: "error",
    position: "top",
    dismissible: false
}

// 注册全局组件
APP.use(store).use(router).use(i18n).use(toastPlugin, TOAST_OPTIONS)

// 注册全局变量
APP.config.globalProperties.$DB_CONFIG = DB_CONFIG
APP.config.globalProperties.$DBOperation = DBOperation

;
// 应用主题和语言等设置
(async () => {
    // 链接设置数据库
    const DB = new DBOperation({
        dbName: DB_CONFIG.name,
        storeName: "Config"
    })
    // 设置主题
    const THEME_DATA = await DB.get("Theme")
    const THEME = THEME_DATA ? THEME_DATA.Theme : "System"
    if (THEME === "System") {
        document.documentElement.setAttribute("data-theme", window.matchMedia("(prefers-color-scheme: dark)").matches ? "Dark" : "Light")
    } else {
        document.documentElement.setAttribute("data-theme", THEME)
    }
    // 设置语言
    const LANGUAGE_DATA = await DB.get("Language");
    i18n.global.locale.value = LANGUAGE_DATA ? LANGUAGE_DATA.Language : "zh-CN";
})()

// 挂载应用
APP.mount("#app")
