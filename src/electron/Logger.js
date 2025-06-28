const FS = require("fs")
const PATH = require("path")

const LOG_DIR = PATH.join(__dirname, "../../logs")
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
