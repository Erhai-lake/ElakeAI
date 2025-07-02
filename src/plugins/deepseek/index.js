let context = null
const PLATFORM_INFO = {
	name: "DeepSeek",
	image: "https://chat.deepseek.com/favicon.svg",
	url: "https://api.deepseek.com"
}

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
		const PUBLIC_CLASS = new context.api.PublicClass()
		const DEXIE = context.api.dexie
		try {
			const KEY_DATA = await DEXIE.apiKeys.get(params.apiKey)
			const CLIENT = PUBLIC_CLASS.createClient(KEY_DATA)
			const RESPONSE = await CLIENT.get("/user/balance")
			return PUBLIC_CLASS.response(params, `${RESPONSE.data.balance_infos[0].total_balance} ${RESPONSE.data.balance_infos[0].currency}`)
		} catch (error) {
			return PUBLIC_CLASS.errorHandler(error, params)
		}
	}
	/**
	 * 模型列表
	 * @param {Object} params - 请求参数
	 * @returns {Promise<Object>}
	 */
	models = async (params) => {
		const PUBLIC_CLASS = new context.api.PublicClass()
		const DEXIE = context.api.dexie
		try {
			const KEY_DATA = await DEXIE.apiKeys.get(params.apiKey)
			const CLIENT = PUBLIC_CLASS.createClient(KEY_DATA)
			const RESPONSE = await CLIENT.get("/models")
			const MODELS = RESPONSE.data.data.map(model => model.id)
			return PUBLIC_CLASS.response(params, MODELS)
		} catch (error) {
			return PUBLIC_CLASS.errorHandler(error, params)
		}
	}
}

module.exports = {
	onRegister(ctx) {
		context = ctx
		const PLATFORM_REGISTRAR_CLASS = new context.api.PlatformRegistrarClass()
		PLATFORM_REGISTRAR_CLASS.registerPlatform(PLATFORM_INFO, new DeepSeek(ctx))
	},
	onUnload() {
		const PLATFORM_REGISTRAR_CLASS = new context.api.PlatformRegistrarClass()
		PLATFORM_REGISTRAR_CLASS.unregisterPlatform(PLATFORM_INFO.name)
	}
}
