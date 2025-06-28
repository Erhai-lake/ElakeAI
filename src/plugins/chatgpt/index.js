class OpenAI {
	constructor(ctx) {
		this.name = "OpenAI"
		this.logo = "https://cdn.oaistatic.com/assets/favicon-miwirzcw.ico"
		this.url = "https://api.openai.com"
		this.ctx = ctx
		this.strategies = {
			balance: this.balanceStrategy.bind(this)
		}
	}

	/**
	 * 查询余额
	 * @param {Object} params - 请求参数
	 * @returns {Promise<Object>}
	 */
	async balanceStrategy(params) {
		return this.ctx.response(params, null)
	}
}

module.exports = {
	onInstall(ctx) {
		console.log("插件安装成功", ctx)
	},
	onRegister(ctx) {
		console.log("插件注册成功", ctx)
		const {registerPlatform} = ctx.platform
		registerPlatform("OpenAI", new OpenAI(ctx))
	},
	onLoad(ctx) {
		console.log("插件加载完成", ctx)
	},
	onUnload() {
		console.log("插件已卸载")
	}
}
