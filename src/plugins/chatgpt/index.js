let PublicClass = null
let platformRegistrarClass = null

class OpenAI {
	constructor(ctx) {
	}

	/**
	 * 查询余额
	 * @param {Object} params - 请求参数
	 * @returns {Promise<Object>}
	 */
	balance = async (params) => {
		return PublicClass.response(params, "NULL")
	}
}

module.exports = {
	onRegister(ctx) {
		PublicClass = new ctx.api.PublicClass()
		platformRegistrarClass = new ctx.api.PlatformRegistrarClass({
			name: "OpenAI",
			logo: "https://cdn.oaistatic.com/assets/favicon-miwirzcw.ico",
			url: "https://api.openai.com"
		})
		platformRegistrarClass.registerPlatform(new OpenAI(ctx))
	},
	onUnload() {
		platformRegistrarClass.unregisterPlatform()
	}
}
