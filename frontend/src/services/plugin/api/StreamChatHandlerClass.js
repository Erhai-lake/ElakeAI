import {publicRegistry} from "@/services/plugin/api/PublicClass"
import EventBus from "@/services/EventBus"
import DB from "@/services/Dexie"

export default class StreamChatHandlerClass {
	/**
	 * 初始化StreamChatHandler
	 * @param {string} platform - 平台名称
	 */
	constructor(platform) {
		this.platform = platform
		this.abortController = null
	}

	/**
	 * 预处理：保存用户消息(pending)到 DB，并返回用于请求的 messages 历史
	 */
	async prepare(params) {
		const {chatKey: CHAT_KEY, content: CONTENT, userDialogueId: USER_DIALOGUE_ID} = params
		const USER_MESSAGE = this._buildUserMessage(USER_DIALOGUE_ID, CONTENT)
		// 入库: 用户消息 pending
		await this._appendRecord(CHAT_KEY, USER_MESSAGE)
		// 通知前端立即渲染用户气泡
		EventBus.emit("[stream] userMessage", {chatKey: CHAT_KEY, userMessage: USER_MESSAGE})
		// 构建 messages（含历史 + 刚入库的 user 消息）
		const MESSAGES = await this._buildMessagesForApi(CHAT_KEY)
		return {messages: MESSAGES}
	}

	/**
	 * 处理流式响应
	 * @param {Object} params - 请求参数
	 * @param {Response} response - 响应对象
	 * @returns {Promise<Object>} 响应结果
	 */
	async handleStream(params, response) {
		if (!response.body) {
			return publicRegistry.response(params, null, "noResponseBody")
		}
		const DECODER = new TextDecoder()
		const READER = response.body.getReader()
		let buffer = ""
		// 插入 assistant 占位，状态 loading
		await this._ensureAssistantPlaceholder(params)
		try {
			while (true) {
				const {done, value} = await READER.read()
				if (done) break
				buffer += DECODER.decode(value, {stream: true})
				const LINES = buffer.split("\n")
				buffer = LINES.pop()
				for (const RAW of LINES) {
					const LINE = RAW.trim()
					if (!LINE.trim()) continue
					const MESSAGE = LINE.replace(/^data:\s?/, "")
					if (MESSAGE === "[DONE]") {
						await this._finalizeSuccess(params)
						return publicRegistry.response(params, {
							reasoning: undefined,
							assistant: undefined
						})
					}
					let json
					try {
						json = JSON.parse(MESSAGE)
					} catch (error) {
						return publicRegistry.response(params, null, "streamingDataParsingError")
					}
					await this._handleDeltaFrame(params, json)
				}
			}
			// 流意外结束: 也按完成处理
			await this._finalizeSuccess(params)
			return publicRegistry.response(params, {reasoning: undefined, assistant: undefined})
		} catch (error) {
			await this._finalizeError(params)
			return publicRegistry.response(params, null, "streamError")
		}
	}

	/**
	 * 中止当前请求
	 */
	abort() {
		if (this.abortController) {
			this.abortController.abort()
			this.abortController = null
		}
	}

	/**
	 * 构建用户消息
	 * @param {string} id - 消息ID
	 * @param {string} content - 消息内容
	 * @returns {Object} 用户消息对象
	 */
	_buildUserMessage(id, content) {
		return {
			id,
			message: {content: content.trim(), role: "user"},
			timestamp: Date.now(),
			status: "pending"
		}
	}

	/**
	 * 构建AI回复占位符
	 * @param {string} id - 消息ID
	 * @param {string} model - 模型名称
	 * @param {string} platform - 平台名称
	 * @returns {Object} 助手占位符对象
	 */
	_buildAssistantPlaceholder(id, model, platform) {
		return {
			id,
			model: {platform, model},
			message: {reasoning: "", content: "", role: "assistant"},
			timestamp: Date.now(),
			status: "loading"
		}
	}

	/**
	 * 追加记录到聊天数据
	 * @param {string} chatKey - 聊天键
	 * @param {Object} record - 记录对象
	 * @returns {Promise<void>}
	 */
	async _appendRecord(chatKey, record) {
		const CHATS = await DB.chats.get(chatKey)
		const DATA = Array.isArray(CHATS?.data) ? CHATS.data.slice() : []
		DATA.push(record)
		await DB.chats.update(chatKey, {data: DATA})
	}

	/**
	 * 替换聊天数据记录
	 * @param {string} chatKey - 聊天键
	 * @param {Function} replacer - 替换函数
	 * @returns {Promise<void>}
	 */
	async _replaceRecords(chatKey, replacer) {
		const CHATS = await DB.chats.get(chatKey)
		const DATA = Array.isArray(CHATS?.data) ? CHATS.data.slice() : []
		const NEXT = replacer(DATA)
		await DB.chats.update(chatKey, {data: NEXT})
	}

	/**
	 * 构建用于API调用的消息历史
	 * @param {string} chatKey - 聊天键
	 * @returns {Promise<Array>} 消息历史数组
	 */
	async _buildMessagesForApi(chatKey) {
		const CHATS = await DB.chats.get(chatKey)
		const HISTORY = Array.isArray(CHATS?.data) ? CHATS.data : []
		return HISTORY.map(i => i.message)
	}

	/**
	 * 确保AI回复占位符存在
	 * @param {Object} params - 请求参数
	 * @returns {Promise<void>}
	 */
	async _ensureAssistantPlaceholder(params) {
		const {chatKey: CHAT_KEY, dialogueId: DIALOGUE_ID, model: MODEL, platform: PLATFORM} = params
		const PLACEHOLDER = this._buildAssistantPlaceholder(DIALOGUE_ID, MODEL, PLATFORM || this.platform)
		await this._appendRecord(CHAT_KEY, PLACEHOLDER)
	}

	/**
	 * 处理流式数据帧
	 * @param {Object} params - 请求参数
	 * @param {Object} json - 解析后的JSON数据
	 * @returns {Promise<void>}
	 */
	async _handleDeltaFrame(params, json) {
		const {chatKey: CHAT_KEY, dialogueId: DIALOGUE_ID, model: MODEL, platform: PLATFORM} = params
		const DELTA = json?.choices?.[0]?.delta || {}
		const REASONING_CHUNK = DELTA.reasoning_content || ""
		const CONTENT_CHUNK = DELTA.content || ""
		if (!REASONING_CHUNK && !CONTENT_CHUNK) return
		// DB 增量追加
		await this._replaceRecords(CHAT_KEY, data => data.map(m => {
			if (m.id !== DIALOGUE_ID) return m
			const MESSAGE = m.message || {role: "assistant", content: "", reasoning: ""}
			return {
				...m,
				message: {
					...MESSAGE,
					reasoning: (MESSAGE.reasoning || "") + REASONING_CHUNK,
					content: (MESSAGE.content || "") + CONTENT_CHUNK,
					role: "assistant"
				},
				timestamp: Date.now()
			}
		}))
		// 通知前端流增量
		EventBus.emit("[stream] streamStream", {
			chatKey: CHAT_KEY,
			id: DIALOGUE_ID,
			reasoning: REASONING_CHUNK,
			message: CONTENT_CHUNK,
			model: {platform: PLATFORM || this.platform, model: MODEL}
		})
	}

	/**
	 * 处理成功完成事件
	 * @param {Object} params - 请求参数
	 * @returns {Promise<void>}
	 */
	async _finalizeSuccess(params) {
		const {chatKey: CHAT_KEY, userDialogueId: USER_DIALOGUE_ID, dialogueId: DIALOGUE_ID} = params
		// 用户消息 pending -> done
		await this._replaceRecords(CHAT_KEY, data => data.map(m => m.id === USER_DIALOGUE_ID ? {
			...m,
			status: "done"
		} : m))
		// AI占位 loading -> done(保留最终内容)
		await this._replaceRecords(CHAT_KEY, data => data.map(m => m.id === DIALOGUE_ID ? {...m, status: "done"} : m))
		// 通知完成(用于标题更新等)
		const LAST = await DB.chats.get(CHAT_KEY)
		const ASSISTANT = (LAST?.data || []).find(x => x.id === DIALOGUE_ID)
		EventBus.emit("[stream] streamComplete", {
			chatKey: CHAT_KEY,
			id: DIALOGUE_ID,
			reasoning: ASSISTANT?.message?.reasoning || "",
			message: ASSISTANT?.message?.content || ""
		})
		// 刷新聊天列表
		EventBus.emit("[update] chatListUpdate")
	}

	/**
	 * 处理完成事件
	 * @param {Object} params - 请求参数
	 * @returns {Promise<void>}
	 */
	async _finalizeError(params) {
		const {chatKey: CHAT_KEY, userDialogueId: USER_DIALOGUE_ID, dialogueId: DIALOGUE_ID} = params
		// 移除AI占位(loading)
		await this._replaceRecords(CHAT_KEY, data => data.filter(m => m.id !== DIALOGUE_ID))
		// 用户消息标记 error(保留文本, 便于一键重试)
		await this._replaceRecords(CHAT_KEY, data => data.map(m => m.id === USER_DIALOGUE_ID ? {
			...m,
			status: "error"
		} : m))
		// 通知完成, 前端可收尾
		EventBus.emit("[stream] streamComplete", {chatKey: CHAT_KEY, id: DIALOGUE_ID, status: "error"})
		// 刷新聊天列表
		EventBus.emit("[update] chatListUpdate")
	}
}
