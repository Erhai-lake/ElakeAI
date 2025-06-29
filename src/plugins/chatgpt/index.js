let PublicClass = null
let dexie = null
let PlatformRegistrarClass = null

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
	/**
	 * 模型列表
	 * @param {Object} params - 请求参数
	 * @returns {Promise<Object>}
	 */
	models = async (params) => {
		try {
			const KEY_DATA = await dexie.apiKeys.get(params.apiKey)
			const CLIENT = PublicClass.createClient(KEY_DATA)
			const RESPONSE = await CLIENT.get("v1/models")
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
			name: "OpenAI",
			logo: "https://cdn.oaistatic.com/assets/favicon-miwirzcw.ico",
			url: "https://api.openai.com"
		})
		PlatformRegistrarClass.registerPlatform(new OpenAI(ctx))
	},
	onUnload() {
		PlatformRegistrarClass.unregisterPlatform()
	}
}
