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
	 * 处理流式响应
	 * @param {Object} params - 请求参数
	 * @param {Response} response - 响应对象
	 * @returns {Promise<Object>} 响应结果
	 */
	async handleStream(params, response) {
		if (!response.body) {
			return publicRegistry.response(params, null, "noResponseBody")
		}
		const API_KEY_DATA = await DB.apiKeys.get(params.apiKey)
		const DECODER = new TextDecoder()
		let buffer = ""
		let reasoningMessage = ""
		let assistantMessage = ""
		let streamMessage = ""
		const READER = response.body.getReader()

		try {
			while (true) {
				const {done, value} = await READER.read()
				if (done) break

				buffer += DECODER.decode(value, {stream: true})
				const LINES = buffer.split("\n")
				buffer = LINES.pop()

				for (const LINE of LINES) {
					if (!LINE.trim()) continue

					const MESSAGE = LINE.replace(/^data: /, "")
					if (MESSAGE === "[DONE]") {
						await this.handleCompletion(params, {
							userMessageId: params.userDialogueId,
							dialogueId: params.dialogueId,
							userContent: params.content,
							reasoning: reasoningMessage,
							assistant: assistantMessage,
							model: params.model,
							platform: API_KEY_DATA.model
						})
						return publicRegistry.response(params, {
							reasoning: reasoningMessage,
							assistant: assistantMessage
						})
					}

					try {
						const PARSED = JSON.parse(MESSAGE)
						const UPDATED_MESSAGES = await this.handleStreamData(PARSED, {
							chatKey: params.chatKey,
							dialogueId: params.dialogueId,
							model: params.model,
							platform: API_KEY_DATA.model
						}, {
							reasoningMessage,
							assistantMessage,
							streamMessage
						})
						// 更新局部变量
						reasoningMessage = UPDATED_MESSAGES.reasoningMessage
						assistantMessage = UPDATED_MESSAGES.assistantMessage
						streamMessage = UPDATED_MESSAGES.streamMessage
					} catch (error) {
						return publicRegistry.response(params, null, "streamingDataParsingError")
					}
				}
			}
		} catch (error) {
			return publicRegistry.response(params, null, "streamError")
		}
	}

	/**
	 * 处理完成事件
	 * @param {Object} params - 请求参数
	 * @param {Object} messageData - 消息数据
	 * @returns {Promise<void>}
	 */
	async handleCompletion(params, messageData) {
		EventBus.emit("[stream] streamComplete", {
			chatKey: params.chatKey,
			id: messageData.dialogueId,
			message: messageData.assistant
		})
		const CHAT_KEY_DATA = await DB.chats.get(params.chatKey)
		// 保存消息到数据库
		await DB.chats.update(params.chatKey, {
			data: [
				...CHAT_KEY_DATA.data,
				{
					id: messageData.userMessageId,
					message: {
						content: messageData.userContent,
						role: "user"
					},
					timestamp: Date.now()
				},
				{
					id: messageData.dialogueId,
					model: {
						platform: messageData.platform,
						model: messageData.model,
					},
					message: {
						reasoning: messageData.reasoning,
						content: messageData.assistant,
						role: "assistant"
					},
					timestamp: Date.now()
				}
			]
		})

		// 更新聊天列表
		EventBus.emit("[update] chatListUpdate")
	}

	/**
	 * 处理流式数据
	 * @param {Object} parsed - 解析后的数据
	 * @param {Object} ids - 标识信息
	 * @param {Object} messages - 消息对象
	 * @returns {Promise<{}>}
	 */
	async handleStreamData(parsed, ids, messages) {
		const UPDATED_MESSAGES = {...messages}

		if (parsed.choices?.[0]?.delta?.reasoning_content) {
			UPDATED_MESSAGES.reasoningMessage += parsed.choices[0].delta.reasoning_content
			UPDATED_MESSAGES.streamMessage = parsed.choices[0].delta.reasoning_content
			EventBus.emit("[stream] streamStream", {
				chatKey: ids.chatKey,
				id: ids.dialogueId,
				reasoning: UPDATED_MESSAGES.streamMessage,
				model: {
					platform: ids.platform,
					model: ids.model
				}
			})
		}

		if (parsed.choices?.[0]?.delta?.content) {
			UPDATED_MESSAGES.assistantMessage += parsed.choices[0].delta.content
			UPDATED_MESSAGES.streamMessage = parsed.choices[0].delta.content
			EventBus.emit("[stream] streamStream", {
				chatKey: ids.chatKey,
				id: ids.dialogueId,
				message: UPDATED_MESSAGES.streamMessage,
				model: {
					platform: ids.platform,
					model: ids.model
				}
			})
		}
		return UPDATED_MESSAGES
	}

	/**
	 * 中止请求
	 */
	abort() {
		if (this.abortController) {
			this.abortController.abort()
			this.abortController = null
		}
	}
}