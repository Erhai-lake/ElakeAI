import {createApp} from "vue"
import app from "@/App.vue"
import router from "@/router"
import store from "@/store"
// 全局样式
import "@/assets/styles/theme.less"
// 数据库操作
import DB from "@/services/Dexie"
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
APP.provide('$DB', DB)

// 挂载应用
APP.mount("#app")
