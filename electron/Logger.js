const LOG = require("electron-log")
const PATH = require("path")

const IS_DEV = process.env.NODE_ENV === "development" || process.env.VUE_DEV_SERVER_URL
const ROOT_PATH = IS_DEV ? __dirname : process.cwd()
const LOG_DIR = PATH.join(ROOT_PATH, "logs")
const LOG_FILE = PATH.join(LOG_DIR, "main.log")

LOG.transports.file.resolvePathFn = () => LOG_FILE

LOG.transports.console.level = "info"
LOG.transports.file.level = "debug"

LOG.transports.file.maxSize = 10 * 1024 * 1024

LOG.transports.console.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}"

const Logger = {
	debug: (...args) => {
		LOG.debug(...args)
	},
	info: (...args) => {
		LOG.info(...args)
	},
	warn: (...args) => {
		LOG.warn(...args)
	},
	error: (...args) => {
		LOG.error(...args)
	},
	_raw: LOG
}

module.exports = Logger
