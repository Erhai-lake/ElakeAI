<script>
import AIInput from "@/components/AIInput.vue"
import {useRoute} from "vue-router"
import EventBus from "@/services/EventBus"
import UserMessageCard from "@/components/chat/UserMessageCard.vue"
import AssistantMessageCard from "@/components/chat/AssistantMessageCard.vue"
import TopTitle from "@/components/chat/TopTitle.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"

export default {
	name: "ChatView",
	inject: ["$DB", "$log"],
	components: {TopTitle, AssistantMessageCard, AIInput, UserMessageCard},
	data() {
		return {
			name: "ChatView",
			route: useRoute(),
			currentMessageId: null,
			typingEffect: {
				active: false,
				cursorVisible: true,
				currentMessageIndex: -1
			},
			data: {
				key: null,
				title: null,
				timestamp: null,
				data: [],
			},
			showInputBox: true
		}
	},
	async created() {
		await this.initChatView()
	},
	watch: {
		"route.params.key"(newKey) {
			this.initChatView(newKey)
		}
	},
	mounted() {
		EventBus.on("[stream] userMessage", this.userMessage)
		EventBus.on("[stream] streamStream", this.streamStream)
		EventBus.on("[stream] streamComplete", this.streamComplete)
		EventBus.on("[function] removeMessage", this.removeMessage)
		EventBus.on("[function] editMessage", this.editMessage)
	},
	beforeUnmount() {
		EventBus.off("[stream] userMessage", this.userMessage)
		EventBus.off("[stream] streamStream", this.streamStream)
		EventBus.off("[stream] streamComplete", this.streamComplete)
		EventBus.off("[function] removeMessage", this.removeMessage)
		EventBus.off("[function] editMessage", this.editMessage)
	},
	methods: {
		/**
		 * 翻译
		 * @param key {String} - 键
		 * @param {Object} [params] - 插值参数, 例如 { name: "洱海" }
		 * @returns {String} - 翻译后的文本
		 */
		t(key, params = {}) {
			return i18nRegistry.translate(key, params)
		},
		/**
		 * 设置当前聚焦的消息ID
		 * @param {string} id 消息ID
		 */
		setCurrentMessageId(id) {
			this.currentMessageId = id
		},
		/**
		 * 滚动到指定消息
		 * @param {string} id 消息ID
		 * @param position {string} - 滚动位置("top"或"bottom")
		 */
		scrollToMessage(id, position = "bottom") {
			this.$nextTick(() => {
				const container = this.$el.querySelector(".message-list")
				if (!container) return
				const messageElement = this.$el.querySelector(`[data-message-id="${id}"]`)
				if (messageElement) {
					// 更新当前聚焦的消息
					this.setCurrentMessageId(id)
					let scrollTop = messageElement.offsetTop - 100
					if (position === "bottom") {
						scrollTop = messageElement.offsetTop + messageElement.offsetHeight - container.clientHeight + 100
					}
					// 滚动到消息位置(距顶部留出100px空间)
					container.scrollTo({
						top: scrollTop,
						behavior: "smooth"
					})
				}
			})
		},
		/**
		 * 向上或向下滚动消息(默认向上)
		 * @param type {string} - 滚动方向("up"或"down", "top"或"bottom")
		 * @param position {string} - 滚动位置("top"或"bottom")
		 */
		scrollToUpAndDownMessages(type = "up", position = "bottom") {
			if (!this.data.data?.length) return
			const LAST_INDEX = this.data.data.length - 1
			// 获取当前消息的索引(无当前消息时, up从最后开始, down从第一条开始)
			let CURRENT_INDEX = this.currentMessageId
				? this.data.data.findIndex((msg) => msg.id === this.currentMessageId)
				: type === "up" ? LAST_INDEX : 0
			// 边界检查
			if (type === "up") {
				if (CURRENT_INDEX === 0) {
					this.scrollToUpAndDownMessages("top", position)
					return
				}
				if (CURRENT_INDEX === -1) CURRENT_INDEX = LAST_INDEX
			} else if (type === "down") {
				if (CURRENT_INDEX === LAST_INDEX) {
					this.scrollToUpAndDownMessages("bottom", position)
					return
				}
				if (CURRENT_INDEX === -1) CURRENT_INDEX = 0
			} else if (type === "top") {
				if (!this.data.data?.length) return
				this.scrollToMessage(this.data.data[0].id, position)
				return
			} else if (type === "bottom") {
				if (!this.data.data?.length) return
				this.scrollToMessage(this.data.data[LAST_INDEX].id, position)
				return
			}
			// 计算目标索引
			let targetIndex = type === "up" ? CURRENT_INDEX - 1 : CURRENT_INDEX + 1
			targetIndex = Math.max(0, Math.min(targetIndex, LAST_INDEX))
			if (this.data.data[targetIndex]) {
				this.scrollToMessage(this.data.data[targetIndex].id, position)
			}
		},
		/**
		 * 初始化聊天视图
		 * @param chatKey {string} - 聊天Key
		 */
		async initChatView(chatKey = this.route.params.key) {
			try {
				const CHAT_DATA = await this.$DB.chats.get(chatKey)
				// 检查ChatKey是否存在
				if (!CHAT_DATA) {
					toastRegistry.warning(this.t("views.ChatView.toast.noChatKey"))
					this.$router.push("/")
					EventBus.emit("[update] chatListUpdate")
					return
				}
				// 写入聊天记录
				this.data = {
					key: CHAT_DATA.key,
					title: CHAT_DATA.title,
					timestamp: CHAT_DATA.timestamp,
					data: Array.isArray(CHAT_DATA.data) ? CHAT_DATA.data : []
				}
				this.scrollToUpAndDownMessages("bottom")
			} catch (error) {
				this.$log.error(`[${this.name}] 聊天记录获取错误`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.ChatView.toast.getChatLogError")}`)
			}
		},
		/**
		 * 用户消息
		 * @param message {Object} - 消息
		 */
		async userMessage(message) {
			if(message.chatKey !== this.data.key) return
			this.data.data.push({
				id: message.id,
				message: {
					content: message.message,
					role: "user"
				},
				timestamp: Date.now()
			})
		},
		/**
		 * 消息流
		 * @param message {Object} - 消息
		 */
		async streamStream(message) {
			if(message.chatKey !== this.data.key) return
			if (!Array.isArray(this.data.data)) {
				this.data.data = []
			}
			const LAST_MESSAGE = this.data.data[this.data.data.length - 1]
			if (!LAST_MESSAGE || LAST_MESSAGE.message.role !== "assistant") {
				this.data.data.push({
					id: message.id,
					model: {
						platform: message.model.platform,
						model: message.model.model
					},
					message: {
						reasoning: message.reasoning || "",
						content: message.message || "",
						role: "assistant"
					},
					timestamp: Date.now()
				})
			} else {
				if (message.reasoning) {
					LAST_MESSAGE.message.reasoning += message.reasoning
				} else if (message.message) {
					LAST_MESSAGE.message.content += message.message
				}
			}
		},
		/**
		 * 消息流完成
		 */
		async streamComplete(message) {
			if(message.chatKey !== this.data.key) return
			try {
				// 如果是第一条AI回复且是默认标题
				if (this.data.title === this.t("components.AIInput.newChat")) {
					// 如果没有AI回复, 则不更新标题
					if (!this.data.data?.length) return
					const AI_CONTENT = this.data.data[this.data.data.length - 1].message.content
					// 从AI回复中提取关键词
					const KEYWORDS = AI_CONTENT
							// 移除HTML标签
							.replace(/<[^>]+>/g, '')
							// 提取中文关键词(至少2个中文字符）
							.match(/[\u4e00-\u9fa5]{2,}/g)
						// 提取英文关键词(至少4个英文字符）
						|| AI_CONTENT.match(/\b\w{4,}\b/g)
						|| []
					const TITLE = KEYWORDS.length > 0 ? KEYWORDS.slice(0, 3).join(" ") : this.data.title
					if (TITLE !== this.data.title) {
						this.data.title = TITLE
						await this.$DB.chats.update(this.data.key, {title: TITLE})
						EventBus.emit("[update] chatListUpdate")
					}
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 标题更新错误`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.ChatView.toast.titleUpdateError")}`)
			}
		},
		/**
		 * 移除消息
		 * @param id {string} - 消息ID
		 */
		async removeMessage(id) {
			try {
				// 移除本地中的消息
				const INDEX = this.data.data.findIndex((msg) => msg.id === id)
				if (INDEX !== -1) {
					this.data.data.splice(INDEX, 1)
				}
				// 更新数据库中的消息
				const DATA = JSON.parse(JSON.stringify(this.data.data))
				await this.$DB.chats.update(this.data.key, {data: DATA})
				toastRegistry.success(`[${this.name}] ${this.t("views.ChatView.toast.removeMessageSuccess")}`)
				// 更新侧边栏
				EventBus.emit("[update] chatListUpdate")
			} catch (error) {
				this.$log.error(`[${this.name}] 消息移除错误`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.ChatView.toast.removeMessageError")}`)
			}
		},
		async editMessage(id, content) {
			try {
				// 编辑本地中的消息
				const INDEX = this.data.data.findIndex((msg) => msg.id === id)
				if (INDEX !== -1) {
					this.data.data[INDEX].message.content = content
				}
				// 更新数据库中的消息
				const DATA = JSON.parse(JSON.stringify(this.data.data))
				await this.$DB.chats.update(this.data.key, {data: DATA})
				toastRegistry.success(`[${this.name}] ${this.t("views.ChatView.toast.editMessageSuccess")}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 消息编辑错误`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.ChatView.toast.editMessageError")}`)
			}
		}
	}
}
</script>

<template>
	<div class="chat-view">
		<!-- 顶部标题 -->
		<TopTitle :chatTitle="data.title" :chatKey="data.key"/>
		<!-- 消息列表 -->
		<div class="message-list" :style="`padding: 100px 50px ${showInputBox ? '280px' : '50px'}`">
			<div
				v-for="message in data.data"
				:key="message.id"
				:class="['message', currentMessageId === message.id ? 'current' : '', message.message.role]"
				:data-message-id="message.id"
				@click="setCurrentMessageId(message.id)">
				<UserMessageCard v-if="message.message.role === 'user'" :message="message"/>
				<AssistantMessageCard v-if="message.message.role === 'assistant'" :message="message"/>
			</div>
		</div>
		<div></div>
		<!-- 底部输入框 -->
		<div class="input-area" :class="{'show-input-box': !showInputBox}">
			<AIInput/>
		</div>
		<!-- AI提示信息 -->
		<div class="ai-disclaimer">{{ t("views.ChatView.aiDisclaimer") }}</div>
		<!-- 功能控件 -->
		<div class="functional-controls">
			<!-- 回到顶部按钮 -->
			<button
				class="scroll-to-top-messages"
				:title="t('views.ChatView.FunctionalControls.scrollToTopMessages')"
				@click="scrollToUpAndDownMessages('top')"
				:disabled="data.data.length === 0">
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-topArrow"></use>
				</svg>
			</button>
			<!-- 上一条按钮 -->
			<button
				:title="t('views.ChatView.FunctionalControls.scrollToUpMessages')"
				@click="scrollToUpAndDownMessages('up')"
				:disabled="data.data.length === 0">
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-upArrow"></use>
				</svg>
			</button>
			<!-- 下一条按钮 -->
			<button
				:title="t('views.ChatView.FunctionalControls.scrollToDownMessages')"
				@click="scrollToUpAndDownMessages('Down')"
				:disabled="data.data.length === 0">
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-downArrow"></use>
				</svg>
			</button>
			<!-- 回到底部按钮 -->
			<button
				:title="t('views.ChatView.FunctionalControls.scrollToBottomMessages')"
				@click="scrollToUpAndDownMessages('bottom')"
				:disabled="data.data.length === 0">
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-bottomArrow"></use>
				</svg>
			</button>
			<!-- 显示输入框按钮 -->
			<button
				:title="t('views.ChatView.FunctionalControls.' + (showInputBox ? 'hideInputBox' : 'showInputBox'))"
				@click="showInputBox = !showInputBox">
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-inputBox"></use>
				</svg>
			</button>
		</div>
	</div>
</template>

<style scoped lang="less">
.icon {
	width: 2em;
	height: 2em;
	vertical-align: -0.15em;
	fill: currentColor;
	overflow: hidden;
}

.chat-view {
	position: relative;
	width: 100%;
	height: 100%;
	display: grid;
	grid-template-rows: auto 1fr auto;
	overflow: hidden;
}

.message-list {
	position: absolute;
	box-sizing: border-box;
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: 30px;
	overflow: hidden auto;
}

@media screen and (max-width: 768px) {
	.message-list {
		padding: 100px 0 200px 0;
	}
}

.message[data-message-id].current {
	background-color: red;
}

.input-area {
	position: absolute;
	left: 50%;
	bottom: 40px;
	transform: translateX(-50%);
	width: 100%;
	max-width: 773px;
	opacity: 1;
	z-index: 2;
}

.show-input-box {
	transform: translate(-50%, 120%);
	opacity: 0;
}

.ai-disclaimer {
	padding: 10px 0;
	text-align: center;
	font-size: 12px;
	background-color: var(--background-color);
	color: var(--chat-disclaimer-text-color);
	user-select: none;
	z-index: 2;
}

.functional-controls {
	position: fixed;
	top: 50%;
	right: 20px;
	transform: translateY(-50%);
	display: flex;
	flex-direction: column;
	align-items: center;
	z-index: 3;

	button {
		margin: 10px 0;
		color: var(--text-color);
		background-color: var(--background-color);
		box-shadow: 0 0 10px var(--box-shadow-color);
		border: none;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}
}
</style>