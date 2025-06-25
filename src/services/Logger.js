import EventBus from "@/services/EventBus"
import DB from "@/services/Dexie"

const formatMessage = (arg) => {
	if (arg instanceof Error) {
		return `Error: ${arg.message}\nStack: ${arg.stack}`
	}
	if (typeof arg === "object") {
		try {
			return JSON.stringify(arg, null, 2)
		} catch {
			return "[Circular Object]"
		}
	}
	return String(arg)
}

const storeLog = async (level, ...args) => {
	try {
		const MATCH = args[0]?.match?.(/^\[(.*?)](.*)$/) || ["NULL", "NULL"]
		args.shift()

		const LOG_ENTRY = {
			level,
			component: MATCH[1],
			message: [MATCH[2], ...args].map(formatMessage).join(" "),
			timestamp: Date.now()
		}

		EventBus.emit("[function] log", LOG_ENTRY)

		if (DB?.logs) {
			try {
				await DB.logs.add(LOG_ENTRY)
			} catch (dbError) {
				console.error("日志数据库操作失败", dbError)
				setTimeout(() => storeLog(level, ...args), 100)
			}
		} else {
			setTimeout(() => storeLog(level, ...args), 100)
		}
	} catch (error) {
		console.error("日志存储失败", error)
	}
}

const Logger = {
	debug: (...args) => {
		console.debug(...args)
		void storeLog("debug", ...args)
	},
	info: (...args) => {
		void storeLog("info", ...args)
	},
	warn: (...args) => {
		void storeLog("warn", ...args)
	},
	error: (...args) => {
		console.error(...args)
		void storeLog("error", ...args)
	}
}

export default Logger

export const setupLogCleanup = async () => {
	const EXPIRE_MS = 31 * 24 * 60 * 60 * 1000
	try {
		await DB.logs.where("timestamp").below(Date.now() - EXPIRE_MS).delete()
	} catch (error) {
		console.error("[Logger] 日志清理失败:", error)
	}
}

// 组件中使用
// this.$log.error("[App] 初始化失败", err)

// js中使用
//import Logger from "@/services/Logger"
// Logger.info("[Service] 获取数据成功", result)