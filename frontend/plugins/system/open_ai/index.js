import ZH_CN from "./lang/zh-CN.json"
import EN_US from "./lang/en-US.json"

let context = {}
const PLATFORM_INFO = {
	name: "OpenAI",
	image: "https://openai.com/favicon.ico",
	url: "https://api.openai.com"
}
let streamChatHandler = null

/**
 * 错误处理
 * @param {Object} error - 错误对象
 * @param {Object} params - 请求参数
 * @returns {{data: *, error: (string|string), traceability: *, timestamp: number}} 错误信息
 */
const errorHandler = (error, params) => {
	const PUBLIC_CLASS = new context.api.PublicClass()
	if (error.response.status === 401) {
		return PUBLIC_CLASS.response(params, null, "Plugins.OpenAI.authenticationFailed")
	}
	if (error.response.status === 403) {
		return PUBLIC_CLASS.response(params, null, "Plugins.OpenAI.invalidArea")
	}
	if (error.response.status === 429) {
		return PUBLIC_CLASS.response(params, null, "Plugins.OpenAI.requestTooFastOrInsufficient")
	}
	if (error.response.status === 500) {
		return PUBLIC_CLASS.response(params, null, "Plugins.OpenAI.serverError")
	}
	if (error.response.status === 503) {
		return PUBLIC_CLASS.response(params, null, "Plugins.OpenAI.busyService")
	}
	if (error.code === "ECONNABORTED") {
		// 处理超时错误
		return this.response(params, null, "Plugins.OpenAI.requestTimeout")
	}
	if (error.code === "ERR_BAD_REQUEST") {
		// 处理错误的请求
		return this.response(params, null, "Plugins.OpenAI.badRequest")
	}
	if (error.code === "ERR_NETWORK") {
		// 处理网络错误
		return this.response(params, null, "Plugins.OpenAI.networkError")
	}
	if (error.response) {
		return this.response(params, null, "Plugins.OpenAI.getError")
	}
	if (error.request) {
		// 请求已发出但没有收到响应
		return this.response(params, null, "Plugins.OpenAI.noResponse")
	}
	// 其他未知错误
	return this.response(params, null, "Plugins.OpenAI.unknownError")
}

class OpenAI {
	constructor(ctx) {
	}

	/**
	 * 查询余额
	 * @param {Object} params - 请求参数
	 * @returns {Promise<Object>}
	 */
	balance = async (params) => {
		const PUBLIC_CLASS = new context.api.PublicClass()
		return PUBLIC_CLASS.response(params, "NULL")
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
			const RESPONSE = await CLIENT.get("v1/models")
			const MODELS = RESPONSE.data.data.map(model => model.id)
			return PUBLIC_CLASS.response(params, MODELS)
		} catch (error) {
			return errorHandler(error, params)
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
			// 保存用户消息并获取完整历史
			const {messages: MESSAGES} = await streamChatHandler.prepare({
				chatKey: params.chatKey,
				content: params.content,
				userDialogueId: params.userDialogueId,
				platform: PLATFORM_INFO.name,
				model: params.model,
				dialogueId: params.dialogueId
			})
			const RESPONSE = await fetch(`${API_KEY_DATA.url}/v1/chat/completions`, {
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
				return errorHandler(RESPONSE, params)
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

export default {
	onRegister(ctx) {
		context = ctx
		const PLATFORM_REGISTRAR_CLASS = new context.api.PlatformRegistrarClass()
		PLATFORM_REGISTRAR_CLASS.registerPlatform(PLATFORM_INFO, new OpenAI(ctx))
		const I18N_CLASS = new context.api.I18nClass()
		I18N_CLASS.registerLang({code: "zh-CN", source: PLATFORM_INFO.name}, ZH_CN)
		I18N_CLASS.registerLang({code: "en-US", source: PLATFORM_INFO.name}, EN_US)
	},
	onUnload() {
		const PLATFORM_REGISTRAR_CLASS = new context.api.PlatformRegistrarClass()
		PLATFORM_REGISTRAR_CLASS.unregisterPlatform(PLATFORM_INFO.name)
		const I18N_CLASS = new context.api.I18nClass()
		I18N_CLASS.unregisterLang("zh-CN", PLATFORM_INFO.name)
		I18N_CLASS.unregisterLang("en-US", PLATFORM_INFO.name)
	}
}
