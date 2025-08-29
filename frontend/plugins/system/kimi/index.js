import ZH_CN from "./lang/zh-CN.json"
import EN_US from "./lang/en-US.json"

let context = {}
const PLATFORM_INFO = {
	name: "Kimi",
	image: "https://statics.moonshot.cn/kimi-web-seo/favicon.ico",
	url: "https://api.moonshot.cn/v1",
	keyViewUrl: "https://platform.moonshot.cn/console/api-keys"
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
	if (error.response.status === 400) {
		return PUBLIC_CLASS.response(params, null, "Plugins.Kimi.invalidRequest")
	}
	if (error.response.status === 401) {
		return PUBLIC_CLASS.response(params, null, "Plugins.Kimi.authenticationFailed")
	}
	if (error.response.status === 403) {
		return PUBLIC_CLASS.response(params, null, "Plugins.Kimi.insufficientBalance")
	}
	if (error.response.status === 404) {
		return PUBLIC_CLASS.response(params, null, "Plugins.Kimi.resourceNotFoundError")
	}
	if (error.response.status === 429) {
		return PUBLIC_CLASS.response(params, null, "Plugins.Kimi.requestTooFastOrInsufficient")
	}
	if (error.response.status === 500) {
		return PUBLIC_CLASS.response(params, null, "Plugins.Kimi.serverError")
	}
	if (error.code === "ECONNABORTED") {
		// 处理超时错误
		return this.response(params, null, "Plugins.Kimi.requestTimeout")
	}
	if (error.code === "ERR_BAD_REQUEST") {
		// 处理错误的请求
		return this.response(params, null, "Plugins.Kimi.badRequest")
	}
	if (error.code === "ERR_NETWORK") {
		// 处理网络错误
		return this.response(params, null, "Plugins.Kimi.networkError")
	}
	if (error.response) {
		return this.response(params, null, "Plugins.Kimi.getError")
	}
	if (error.request) {
		// 请求已发出但没有收到响应
		return this.response(params, null, "Plugins.Kimi.noResponse")
	}
	// 其他未知错误
	return this.response(params, null, "Plugins.Kimi.unknownError")
}

class Kimi {
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
			const RESPONSE = await CLIENT.get("/users/me/balance")
			let balance = RESPONSE.data.data.available_balance
			// 转成字符串, 保留两位小数, 不四舍五入
			balance = String(balance)
			if (balance.includes(".")) {
				const [intPart, decPart] = balance.split(".")
				balance = intPart + "." + decPart.slice(0, 2)
			}
			return PUBLIC_CLASS.response(params, `${balance} CNY`)
		} catch (error) {
			return errorHandler(error, params)
		}
	}

	/**
	 * 模型列表
	 * @param {Object} params - 请求参数
	 * @returns {Promise<Object>}
	 */
	models = async (params) => {
		const PUBLIC_CLASS = new context.api.PublicClass()
		const CACHE_KEY = `${PLATFORM_INFO.name}-${params.apiKey}-model`
		// 读取缓存
		const CACHE = sessionStorage.getItem(CACHE_KEY)
		if (CACHE) {
			try {
				const PARSED = JSON.parse(CACHE)
				const NOW = Date.now()
				// 判断是否过期(10分钟)
				if (NOW - PARSED.timestamp < 600000) {
					return PUBLIC_CLASS.response(params, PARSED.models)
				}
			} catch (error) {
				// 如果解析失败, 就当缓存无效
				console.warn("缓存解析失败", error)
			}
			return PUBLIC_CLASS.response(params, JSON.parse(sessionStorage.getItem(CACHE_KEY)))
		}
		// 没有缓存或缓存过期 -> 发请求
		const DEXIE = context.api.dexie
		try {
			const KEY_DATA = await DEXIE.apiKeys.get(params.apiKey)
			const CLIENT = PUBLIC_CLASS.createClient(KEY_DATA)
			const RESPONSE = await CLIENT.get("/models")
			const MODELS = RESPONSE.data.data.map(model => model.id)
			sessionStorage.setItem(CACHE_KEY, JSON.stringify({
				timestamp: Date.now(),
				models: MODELS
			}))
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
			// 获取聊天配置
			const CONFIGS = await DEXIE.chats.get(params.chatKey)
			const RESPONSE = await fetch(`${API_KEY_DATA.url}/chat/completions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${API_KEY_DATA.value}`
				},
				body: JSON.stringify({
					model: params.model,
					messages: MESSAGES,
					...CONFIGS.configs,
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
		PLATFORM_REGISTRAR_CLASS.registerPlatform(PLATFORM_INFO, new Kimi(ctx))
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
