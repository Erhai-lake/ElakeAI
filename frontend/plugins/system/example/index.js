export default {
	/**
	 * 插件安装
	 * @param ctx 插件上下文
	 */
	onInstall(ctx) {
		console.log("插件安装成功", ctx)
	},
	/**
	 * 插件注册
	 * @param ctx 插件上下文
	 */
	onRegister(ctx) {
		console.log("插件注册成功", ctx)
	},
	/**
	 * 插件加载
	 * @param ctx 插件上下文
	 */
	onLoad(ctx) {
		console.log("插件加载完成", ctx)
	},
	/**
	 * 插件卸载
	 */
	onUnload() {
		console.log("插件已卸载")
	}
}
