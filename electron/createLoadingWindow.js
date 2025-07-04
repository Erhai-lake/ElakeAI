const {BrowserWindow, ipcMain} = require("electron")
const PATH = require("path")
const Logger = require("./Logger")

function createLoadingWindow(parentWindow) {
	const WIN = new BrowserWindow({
		width: 1200,
		height: 800,
		frame: false,
		transparent: false,
		resizable: false,
		parent: parentWindow,
		modal: true,
		show: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		}
	})

	WIN.loadFile(PATH.join(__dirname, "../dist_vue/LoadingPage.html")).then(() => {
		Logger.info("[createLoadingWindow] 加载加载页面完成")
	}).catch((error) => {
		Logger.error("[createLoadingWindow] 无法加载文件:", error)
	})
	WIN.once("ready-to-show", () => {
		WIN.show()
	})

	WIN.once("ready-to-show", () => {
		WIN.show()
	})

	WIN.on("closed", () => {
		// 发送加载窗口关闭消息
		ipcMain.emit("loading-window-closed")
	})
	return WIN
}

module.exports = createLoadingWindow
