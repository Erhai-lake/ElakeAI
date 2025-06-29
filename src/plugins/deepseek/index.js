let PublicClass = null
let dexie = null
let platformRegistrarClass = null

class DeepSeek {
	constructor(ctx) {
		this.ctx = ctx
	}

	/**
	 * 查询余额
	 * @param {Object} params - 请求参数
	 * @returns {Promise<Object>}
	 */
	balance = async (params) => {
		try {
			const KEY_DATA = await dexie.apiKeys.get(params.apiKey)
			const RESPONSE = await this.ctx.api.axios.create({
				baseURL: KEY_DATA.url,
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${KEY_DATA.value}`
				},
				timeout: 10000
			}).get("/user/balance")
			return PublicClass.response(params, `${RESPONSE.data.balance_infos[0].total_balance} ${RESPONSE.data.balance_infos[0].currency}`)
		} catch (error) {
			// return this.errorHandler(error, params)
		}
	}
}

module.exports = {
	onRegister(ctx) {
		PublicClass = new ctx.api.PublicClass()
		dexie = ctx.api.dexie
		platformRegistrarClass = new ctx.api.PlatformRegistrarClass({
			name: "DeepSeek",
			logo: "https://chat.deepseek.com/favicon.svg",
			url: "https://api.deepseek.com"
		})
		platformRegistrarClass.registerPlatform(new DeepSeek(ctx))
	},
	onUnload() {
		if (platformRegistrarClass) {
			platformRegistrarClass.unregisterPlatform()
		}
	}
}
