module.exports = {
	onFirstTimeInstall(ctx) {
		console.log("插件首次安装", ctx)
	},
	onInstall(ctx) {
		console.log("插件安装成功", ctx)
	},
	onRegister(ctx) {
		console.log("插件注册成功", ctx)
	},
	onLoad(ctx) {
		console.log("插件加载完成", ctx)
	},
	onUnload(ctx) {
		console.log("插件已卸载", ctx)
	}
}
