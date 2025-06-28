class CustomAPI {
	constructor() {
		this.name = "OpenAI"
	}
}

module.exports = {
	onInstall(ctx) {
		console.log("插件安装成功", ctx)
	},
	onRegister(ctx) {
		console.log("插件注册成功", ctx)
		// const MyAPI = new CustomAPI()
		// registerPlatform("OpenAI", MyAPI)
	},
	onLoad(ctx) {
		console.log("插件加载完成", ctx)
	},
	onUnload() {
		console.log("插件已卸载")
	}
}
