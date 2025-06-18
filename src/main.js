import {createApp, getCurrentInstance} from "vue"
import app from "@/App.vue"
import router from "@/router"
import store from "@/store"
import EventBus from "@/services/EventBus"
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
	showLogLevel: false,
	showMethodName: false,
	separator: "|",
	showConsoleColors: true
}

// 注册全局组件
APP.use(store)
	.use(router)
	.use(i18n)
	.use(toastPlugin, TOAST_OPTIONS)
	.use(VueLogger, LOGGER_OPTIONS)

// 扩展 $log 方法
APP.config.globalProperties.$log = {
	debug: (...args) => {
		console.debug(...args)
		storeLog("debug", ...args)
	},
	info: (...args) => {
		// console.info(...args)
		storeLog("info", ...args)
	},
	warn: (...args) => {
		// console.warn(...args)
		storeLog("warn", ...args)
	},
	error: (...args) => {
		console.error(...args)
		storeLog("error", ...args)
	}
}
const storeLog = (level, ...args) => {
	try {
		const formatMessage = (arg) => {
			if (arg instanceof Error) {
				return `Error: ${arg.message}\nStack: ${arg.stack}`
			}
			if (typeof arg === "object") {
				try {
					return JSON.stringify(arg, null)
				} catch {
					return "[Circular Object]"
				}
			}
			return String(arg)
		}
		const MATCH = args[0].match(/^\[(.*?)](.*)$/)
		args.shift()
		const LOG_ENTRY = {
			timestamp: Date.now(),
			level,
			message: [MATCH[2], ...args].map(formatMessage).join(" "),
			component: MATCH[1]
		}
		const LOGS = JSON.parse(localStorage.getItem("ElakeAILogs") || "[]")
		const MAX_LOGS = 100
		const UPDATED_LOGS = [...LOGS, LOG_ENTRY].slice(-MAX_LOGS)
		EventBus.emit("[function] log", LOG_ENTRY)
		localStorage.setItem("ElakeAILogs", JSON.stringify(UPDATED_LOGS))
	} catch (e) {
		console.error("日志存储失败:", e)
	}
}

// 注册全局变量
APP.provide('$DB', DB)

// 挂载应用
APP.mount("#app")
