const { BrowserWindow } = require("electron")
const PATH = require("path")

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

	WIN.loadFile(PATH.join(__dirname, "../dist_vue/LoadingPage.html"))
	WIN.once("ready-to-show", () => {
		WIN.show()
	})
	return WIN
}

module.exports = createLoadingWindow
