import {createApp} from "vue"
import app from "@/App.vue"
import router from "@/router"
import store from "@/store"
// 全局样式
import "@/assets/styles/theme.less"
// 数据库操作
import DB from "@/services/Dexie"
// 多语言(i18n)
import i18n from "@/i18n"
// Toast 通知
import toastPlugin from "vue-toast-notification"
import "vue-toast-notification/dist/theme-bootstrap.css"
// 日志
import VueLogger from "vuejs3-logger"

const APP = createApp(app)

// Toast 配置
const TOAST_OPTIONS = {
    type: "error",
    position: "top",
    dismissible: false
}

const LOGGER_OPTIONS = {
    isEnabled: true,
    logLevel: process.env.NODE_ENV === "production" ? "error" : "debug",
    stringifyArguments: false,
    showLogLevel: true,
    showMethodName: false,
    separator: "|",
    showConsoleColors: true
}

// 注册全局组件
APP .use(store)
    .use(router)
    .use(i18n)
    .use(toastPlugin, TOAST_OPTIONS)
    .use(VueLogger, LOGGER_OPTIONS)

// 注册全局变量
APP.provide('$DB', DB)

// 挂载应用
APP.mount("#app")
