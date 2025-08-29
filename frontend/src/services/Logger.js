import EventBus from "@/services/EventBus"
import DB from "@/services/Dexie"

/**
 * 日志等级优先级
 */
const LOG_LEVEL_PRIORITY = {
	debug: 1,
	info: 2,
	warn: 3,
	error: 4
}

/**
 * 获取日志配置等级
 * @returns {Promise<string>} 日志等级(默认 info)
 */
const getLogLevel = async () => {
	try {
		const config = await DB.configs.get("logLevel")
		return config?.value || "warn"
	} catch {
		return "warn"
	}
}

/**
 * 日志格式化
 * @param arg 日志参数
 * @returns string
 */
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

/**
 * 日志存储
 * @param level 日志级别
 * @param args 日志参数
 */
const storeLog = async (level, ...args) => {
	try {
		const CURRENT_LEVEL = await getLogLevel()
		if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[CURRENT_LEVEL]) {
			// 等级低于配置等级, 不记录到数据库
			return
		}

		console[level](...args)
		const MATCH = args[0]?.match?.(/^\[(.*?)](.*)$/) || ["NULL", "NULL"]
		args.shift()

		const LOG_ENTRY = {
			level,
			component: MATCH[1],
			message: [MATCH[2], ...args].map(formatMessage).join(" "),
			timestamp: Date.now()
		}
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
		EventBus.emit("[update] logUpdate")
	} catch (error) {
		console.error("日志存储失败", error)
	}
}

const Logger = {
	debug: (...args) => {
		void storeLog("debug", ...args)
	},
	info: (...args) => {
		void storeLog("info", ...args)
	},
	warn: (...args) => {
		void storeLog("warn", ...args)
	},
	error: (...args) => {
		void storeLog("error", ...args)
	}
}

export default Logger

/**
 * 日志清理
 */
export const setupLogCleanup = async () => {
	const EXPIRE_MS = 31 * 24 * 60 * 60 * 1000
	try {
		await DB.logs.where("timestamp").below(Date.now() - EXPIRE_MS).delete()
	} catch (error) {
		console.error("[Logger] 日志清理失败:", error)
	}
}

// 组件中使用
// this.$log.error("[App] 初始化失败", error)

// js中使用
// import Logger from "@/services/Logger"
// Logger.info("[Service] 获取数据成功", result)