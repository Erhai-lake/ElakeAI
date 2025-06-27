const { app, BrowserWindow } = require("electron")
const path = require("path")

let mainWindow

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
			console.error("无法加载URL:", error)
		})
		mainWindow.webContents.openDevTools()
	} else {
		// 加载生产环境的HTML文件
		mainWindow.loadFile(path.join(__dirname, "../../dist_vue/index.html")).catch((error) => {
			console.error("无法加载文件:", error)
		})
	}
}

// 当Electron完成初始化时创建窗口
app.whenReady().then(createWindow)

// 当所有窗口关闭时退出应用程序
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit()
})
