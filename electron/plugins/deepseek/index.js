let context = {}
const PLATFORM_INFO = {
	name: "DeepSeek",
	image: "https://chat.deepseek.com/favicon.svg",
	url: "https://api.deepseek.com"
}
let streamChatHandler = null

class DeepSeek {
	constructor(ctx) {
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

	/**
	 * 发送聊天请求
	 * @param {Object} params - 请求参数
	 * @returns {Promise<Object>} 响应结果
	 */
	chat = async (params) => {
		const PUBLIC_CLASS = new context.api.PublicClass()
		streamChatHandler = PUBLIC_CLASS.streamChatHandler(PLATFORM_INFO.name)
		const DEXIE = context.api.dexie
		streamChatHandler.abort()
		streamChatHandler.abortController = new AbortController()
		try {
			const API_KEY_DATA = await DEXIE.apiKeys.get(params.apiKey)
			const CHAT_KEY_DATA = await DEXIE.chats.get(params.chatKey)
			// 构建消息历史
			const MESSAGES = [...CHAT_KEY_DATA.data.map(item => item.message), {content: params.content, role: "user"}]
			const RESPONSE = await fetch(`${API_KEY_DATA.url}/chat/completions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${API_KEY_DATA.value}`
				},
				body: JSON.stringify({
					model: params.model,
					messages: MESSAGES,
					stream: true
				}),
				signal: streamChatHandler.abortController.signal
			})
			if (!RESPONSE.ok) {
				return PUBLIC_CLASS.errorHandler(RESPONSE, params)
			}
			return await streamChatHandler.handleStream(params, RESPONSE)
		} catch (error) {
			return PUBLIC_CLASS.handleChatError(error, params)
		}
	}

	/**
	 * 终止当前聊天请求
	 */
	chatStop = () => {
		streamChatHandler.abort()
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
