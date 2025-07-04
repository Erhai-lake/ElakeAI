const {app, BrowserWindow, ipcMain, dialog} = require("electron")
const Logger = require("./Logger")
const PATH = require("path")
const {scanAllPlugins} = require("./plugin-loader.js")
const createLoadingWindow = require("./createLoadingWindow")

let mainWindow
let loadingWin

app.setPath("userData", PATH.join(process.cwd(), "userdata"))

function createWindow() {
	// 创建浏览器窗口
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		show: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	})

	// 移除默认菜单
	mainWindow.removeMenu()
	// 创建加载页
	loadingWin = createLoadingWindow(mainWindow)
	// 主窗口崩溃监听
	setupCrashListener(mainWindow)

	if (process.env.VUE_DEV_SERVER_URL) {
		mainWindow.loadURL(process.env.VUE_DEV_SERVER_URL).then(() => {
			Logger.info("[main] 加载开发环境页面完成")
		}).catch((error) => {
			Logger.error("[main] 无法加载开发URL:", error)
		})
		mainWindow.webContents.openDevTools()
	} else {
		mainWindow.loadFile(PATH.join(__dirname, "../dist_vue/index.html")).then(() => {
			Logger.info("[main] 加载生产页面完成")
		}).catch((error) => {
			Logger.error("[main] 无法加载文件:", error)
		})
	}

	// 当主窗口加载完成
	mainWindow.once("ready-to-show", () => {
		// 延迟关闭 loading, 防止闪烁
		setTimeout(() => {
			if (loadingWin && !loadingWin.isDestroyed()) loadingWin.destroy()
			mainWindow.show()
		}, 500)
	})
}

process.on("uncaughtException", (error) => {
	Logger.error("[main] 主进程捕获异常", error)
})

// 当Electron完成初始化时创建窗口
app.whenReady().then(() => {
	// 创建窗口
	createWindow()

	// 监听渲染进程发送的消息
	ipcMain.handle("get-all-plugins", async () => {
		try {
			return await scanAllPlugins()
		} catch (error) {
			Logger.error("[main] get-all-plugins 扫描失败", error)
			return []
		}
	})
})

// 主动退出
app.on("before-quit", async () => {
	const UNLOAD_PATH = PATH.resolve(__dirname, "../services/plugin/UnloadPlugins.js")
	const {unloadPlugins} = require(UNLOAD_PATH)
	await unloadPlugins()
})

// 当所有窗口关闭时退出应用程序
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit()
})

function setupCrashListener(win) {
	win.webContents.on("render-process-gone", (event, details) => {
		Logger.error("[main] g渲染进程崩溃", details)

		const CHOICE = dialog.showMessageBoxSync(win, {
			type: "error",
			title: "进程崩溃",
			message: "渲染进程崩溃了, 是否重启应用?",
			buttons: ["重启", "退出"]
		})
		if (CHOICE === 0) {
			app.relaunch()
			app.exit(0)
		} else {
			app.quit()
		}
	})
}