class OpenAI {
	constructor(ctx) {
		this.ctx = ctx
		this.info = {
			name: "OpenAI",
			logo: "https://cdn.oaistatic.com/assets/favicon-miwirzcw.ico",
			url: "https://api.openai.com"
		}
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
		return this.ctx.platform.response(params, "NULL")
	}
}

module.exports = {
	onInstall(ctx) {
	},
	onRegister(ctx) {
		const {registerPlatform} = ctx.platform
		registerPlatform("OpenAI", new OpenAI(ctx))
	},
	onLoad(ctx) {
	},
	onUnload() {
	}
}
