const FS = require("fs")
const PATH = require("path")

const IS_DEV = process.env.NODE_ENV === "development" || process.env.VUE_DEV_SERVER_URL
const ROOT_PATH = IS_DEV ? __dirname : process.cwd()
const LOG_DIR = PATH.join(ROOT_PATH, "logs")
const LOG_FILE = PATH.join(LOG_DIR, "main.log")

if (!FS.existsSync(LOG_DIR)) {
	FS.mkdirSync(LOG_DIR, { recursive: true })
}

const writeToFile = (level, ...args) => {
	const TIMESTAMP = new Date().toISOString()
	const MSG = args.map(String).join(" ")
	const LINE = `[${TIMESTAMP}] [${level.toUpperCase()}] ${MSG}\n`
	FS.appendFile(LOG_FILE, LINE, (error) => {
		if (error) {
			console.error("[Logger] 写入日志失败:", error)
		}
	})
}

const Logger = {
	debug: (...args) => {
		console.debug(...args)
		writeToFile("debug", ...args)
	},
	info: (...args) => {
		console.info(...args)
		writeToFile("info", ...args)
	},
	warn: (...args) => {
		console.warn(...args)
		writeToFile("warn", ...args)
	},
	error: (...args) => {
		console.error(...args)
		writeToFile("error", ...args)
	}
}

module.exports = Logger
