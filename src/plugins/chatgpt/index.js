let platformRegistrarClass = null

class OpenAI {
	constructor(ctx) {
		this.balance.bind(this)
	}

	/**
	 * 查询余额
	 * @param {Object} params - 请求参数
	 * @returns {Promise<Object>}
	 */
	async balance(params) {
		return platformRegistrarClass.response(params, "NULL")
	}
}

module.exports = {
	onRegister(ctx) {
		platformRegistrarClass = new ctx.api.platformRegistrarClass({
			name: "OpenAI",
			logo: "https://cdn.oaistatic.com/assets/favicon-miwirzcw.ico",
			url: "https://api.openai.com"
		})
		platformRegistrarClass.api.registerPlatform(new OpenAI(ctx))
	},
	onUnload() {
		platformRegistrarClass.unregisterPlatform()
	}
}
