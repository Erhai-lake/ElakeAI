const {app, BrowserWindow, ipcMain} = require("electron")
const Logger = require("./Logger")
const PATH = require("path")
const {scanAllPlugins} = require("./plugin-loader.js")

let mainWindow

app.setPath("userData", PATH.join(process.cwd(), "userdata"))

function createWindow() {
	// 创建浏览器窗口
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	})

	// 移除默认菜单
	mainWindow.removeMenu()

	setupCrashListener(mainWindow)

	if (process.env.VUE_DEV_SERVER_URL) {
		// 加载开发环境的URL
		mainWindow.loadURL(process.env.VUE_DEV_SERVER_URL).catch((error) => {
			Logger.error("[main] 无法加载URL:", error)
		})
		mainWindow.webContents.openDevTools()
	} else {
		// 加载生产环境的HTML文件
		mainWindow.loadFile(PATH.join(__dirname, "../dist_vue/index.html")).catch((error) => {
			Logger.error("[main] 无法加载文件:", error)
		})
	}
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

		dialog.showMessageBoxSync(win, {
			type: "error",
			title: "进程崩溃",
			message: "渲染进程崩溃了, 是否重启应用?",
			buttons: ["重启", "退出"]
		}) === 0
			? app.relaunch() && app.exit(0)
			: app.quit()
	})
}