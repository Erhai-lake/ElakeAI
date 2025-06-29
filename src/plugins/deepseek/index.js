class DeepSeek {
	constructor(ctx) {
		this.ctx = ctx
		this.info = {
			name: "DeepSeek",
			logo: "https://chat.deepseek.com/favicon.svg",
			url: "https://api.deepseek.com"
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
		try {
			console.log(params)
			// const CLIENT = this.createClient(paramsData.apiKeyData)
			// const RESPONSE = await CLIENT.get("/user/balance")
			// return this.ctx.response(params, `${RESPONSE.data.balance_infos[0].total_balance} ${RESPONSE.data.balance_infos[0].currency}`)
		} catch (error) {
			// return this.errorHandler(error, params)
		}
	}
}

module.exports = {
	onInstall(ctx) {
	},
	onRegister(ctx) {
		const {registerPlatform} = ctx.platform
		registerPlatform("DeepSeek", new DeepSeek(ctx))
	},
	onLoad(ctx) {
	},
	onUnload() {
	}
}
