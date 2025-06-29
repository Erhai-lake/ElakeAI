let dbClass = null
let platformRegistrarClass = null

class DeepSeek {
	constructor(ctx) {
		this.ctx = ctx
		this.balance.bind(this)
	}

	/**
	 * 查询余额
	 * @param {Object} params - 请求参数
	 * @returns {Promise<Object>}
	 */
	async balance(params) {
		try {
			const KEY_DATA = await dbClass.api.getApiKeyData(params)
			const RESPONSE = await this.ctx.api.axios.create({
				baseURL: KEY_DATA.url,
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${KEY_DATA.value}`
				},
				timeout: 10000
			}).get("/user/balance")
			return platformRegistrarClass.response(params, `${RESPONSE.data.balance_infos[0].total_balance} ${RESPONSE.data.balance_infos[0].currency}`)
		} catch (error) {
			// return this.errorHandler(error, params)
		}
	}
}

module.exports = {
	onRegister(ctx) {
		dbClass = new ctx.api.dbClass()
		platformRegistrarClass = new ctx.api.platformRegistrarClass({
			name: "DeepSeek",
			logo: "https://chat.deepseek.com/favicon.svg",
			url: "https://api.deepseek.com"
		})
		platformRegistrarClass.api.registerPlatform(new DeepSeek(ctx))
	},
	onUnload() {
		platformRegistrarClass.unregisterPlatform()
	}
}
