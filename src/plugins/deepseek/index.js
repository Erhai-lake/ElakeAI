let PublicClass = null
let dexie = null
let PlatformRegistrarClass = null

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
			const CLIENT = PublicClass.createClient(KEY_DATA)
			const RESPONSE = await CLIENT.get("/user/balance")
			return PublicClass.response(params, `${RESPONSE.data.balance_infos[0].total_balance} ${RESPONSE.data.balance_infos[0].currency}`)
		} catch (error) {
			return PublicClass.errorHandler(error, params)
		}
	}
	/**
	 * 模型列表
	 * @param {Object} params - 请求参数
	 * @returns {Promise<Object>}
	 */
	models = async (params) => {
		try {
			const KEY_DATA = await dexie.apiKeys.get(params.apiKey)
			const CLIENT = PublicClass.createClient(KEY_DATA)
			const RESPONSE = await CLIENT.get("/models")
			const MODELS = RESPONSE.data.data.map(model => model.id)
			return PublicClass.response(params, MODELS)
		} catch (error) {
			return PublicClass.errorHandler(error, params)
		}
	}
}

module.exports = {
	onRegister(ctx) {
		PublicClass = new ctx.api.PublicClass()
		dexie = ctx.api.dexie
		PlatformRegistrarClass = new ctx.api.PlatformRegistrarClass({
			name: "DeepSeek",
			logo: "https://chat.deepseek.com/favicon.svg",
			url: "https://api.deepseek.com"
		})
		PlatformRegistrarClass.registerPlatform(new DeepSeek(ctx))
	},
	onUnload() {
		if (PlatformRegistrarClass) {
			PlatformRegistrarClass.unregisterPlatform()
		}
	}
}
