module.exports = {
	onInstall(ctx) {
		console.log("插件首次安装", ctx)
	},

	register(ctx) {
		console.log("插件注册成功", ctx)
	},

	onLoad(ctx) {
		console.log("插件加载完成", ctx)
	},

	onUnload(ctx) {
		console.log("插件已卸载", ctx)
	}
}
