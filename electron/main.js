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

		mainWindow.webContents.openDevTools()
	}
}

// 当Electron完成初始化时创建窗口
app.whenReady().then(() => {
	// 监听渲染进程发送的消息
	ipcMain.handle("get-all-plugins", () => {
		return scanAllPlugins()
	})
	// 创建窗口
	createWindow()
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
