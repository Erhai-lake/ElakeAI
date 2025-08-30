<script>
import {defineComponent, ref} from "vue"
import EventBus from "@/services/EventBus"
import SVGIcon from "@/components/SVGIcon.vue"
import Selector from "@/components/input/Selector.vue"
import {useRoute} from "vue-router"
import {platformRegistry} from "@/services/plugin/api/PlatformClass"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import DefaultChatSettings from "@/components/options/DefaultChatSettings.vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"

export default defineComponent({
	name: "AIInput",
	components: {SVGIcon, DefaultChatSettings, Selector},
	inject: ["$DB", "$log"],
	data() {
		return {
			name: "AIInput",
			route: useRoute(),
			// 平台
			platformSelected: null,
			// Key
			keyPoolsSelected: null,
			// 模型
			modelSelected: null,
			// 输入框
			chatInput: "",
			oldChatInput: "",
			// 联网搜索状态
			enableWebSearch: false,
			// 停止
			stopStatus: false
		}
	},
	watch: {
		// 监听路由变化
		"route.path"() {
			this.focusInput()
		},
		chatInput() {
			EventBus.emit("[update] inputChange", this.chatInput)
		}
	},
	beforeDestroy() {
		this.cancelAllRequests()
	},
	setup() {
		const textareaRef = ref(null)
		return {textareaRef}
	},
	mounted() {
		if (this.textareaRef) {
			this.adjustTextareaHeight()
			this.textareaRef.addEventListener("input", this.adjustTextareaHeight)
			this.focusInput()
		}
	},
	beforeUnmount() {
		EventBus.off("[stream] streamComplete", this.streamComplete)
		EventBus.off("[update] keyPoolUpdate", this.loadKeyPools)
		EventBus.off("[update] stopStatusUpdate", this.stopStatusUpdate)
		if (this.textareaRef) {
			this.textareaRef.removeEventListener("input", this.adjustTextareaHeight)
		}
	},
	created() {
		EventBus.on("[stream] streamComplete", this.streamComplete)
		EventBus.on("[update] keyPoolUpdate", this.loadKeyPools)
		EventBus.on("[update] stopStatusUpdate", this.stopStatusUpdate)
		this.restoreSettings()
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
		 * 获取设置
		 */
		async restoreSettings() {
			try {
				const DEFAULT_CHAT_SETTINGS_DATA = await this.$DB.configs.get("DefaultChatSettings")
				if (DEFAULT_CHAT_SETTINGS_DATA) {
					this.platformSelected = {title: DEFAULT_CHAT_SETTINGS_DATA.value.platform}
					const KEY_DATA = await this.$DB.apiKeys.get(DEFAULT_CHAT_SETTINGS_DATA.value.key)
					if (!KEY_DATA) {
						this.keyPoolsSelected = null
						this.modelSelected = null
						return
					}
					this.keyPoolsSelected = {key: KEY_DATA.key, title: KEY_DATA.remark}
					this.modelSelected = {title: DEFAULT_CHAT_SETTINGS_DATA.value.model}
				} else {
					this.platformSelected = null
					this.keyPoolsSelected = null
					this.modelSelected = null
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 默认设置获取失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.AIInput.toast.getDefaultSettingsError")}`)
			}
		},
		/**
		 * 更新平台所选项
		 * @param newVal {Object} - 新的平台选项
		 */
		updateSelectedPlatformList(newVal) {
			this.platformSelected = newVal
		},
		/**
		 * 更新Key所选项
		 * @param newVal {Object} - 新的Key选项
		 */
		updateSelectedKey(newVal) {
			this.keyPoolsSelected = newVal
		},
		/**
		 * 更新模型所选项
		 * @param newVal {Object} - 新的模型选项
		 */
		updateSelectedModel(newVal) {
			this.modelSelected = newVal
		},
		/**
		 * 输入框获取焦点
		 */
		focusInput() {
			this.$nextTick(() => {
				if (this.textareaRef) {
					this.textareaRef.focus()
				}
			})
		},
		/**
		 * 调整输入框高度
		 */
		adjustTextareaHeight() {
			if (!this.textareaRef) return
			this.textareaRef.style.height = "auto"
			const newHeight = Math.min(this.textareaRef.scrollHeight, 600)
			this.textareaRef.style.height = `${Math.max(newHeight, 50)}px`
		},
		/**
		 * 发送消息
		 */
		async send() {
			// 检查输入框是否为空
			if (this.chatInput.trim() === "") return
			this.stopStatus = true
			this.oldChatInput = this.chatInput.trim()
			this.chatInput = ""
			// 更新输入框高度
			await this.$nextTick(() => {
				this.adjustTextareaHeight()
			})
			// 判断是否存在聊天, 否则新建
			const CHAT_KEY = this.route.params.key ? this.route.params.key : await this.newChat(this.oldChatInput)
			// 请求开始
			const DIALOGUE_ID = crypto.randomUUID()
			const USER_DIALOGUE_ID = crypto.randomUUID()
			// 发送消息
			const INSTANCE = platformRegistry.getPlatform(this.platformSelected.title)
			try {
				const RESPONSE = INSTANCE.api.chat({
					dialogueId: DIALOGUE_ID,
					userDialogueId: USER_DIALOGUE_ID,
					apiKey: this.keyPoolsSelected.key,
					chatKey: CHAT_KEY,
					content: this.oldChatInput,
					model: this.modelSelected.title,
				})
				if (RESPONSE.error) {
					this.chatInput = this.oldChatInput
					await this.$nextTick(() => {
						this.adjustTextareaHeight()
					})
					this.$log.error(`[${this.name}] 发送消息失败`, RESPONSE)
					toastRegistry.error(`[${this.name}] ${this.t(RESPONSE.error)}`)
					EventBus.emit("[stream] streamComplete", {chatKey: CHAT_KEY})
				}
			} catch (error) {
				this.chatInput = this.oldChatInput
				await this.$nextTick(() => {
					this.adjustTextareaHeight()
				})
				this.$log.error(`[${this.name}] 发送消息失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.AIInput.toast.sendMessageError")}`)
			} finally {
				this.$router.push(`/chat/${CHAT_KEY}`)
				EventBus.emit("[update] chatListUpdate")
			}
		},
		/**
		 * 新的聊天
		 */
		async newChat(content) {
			// 加载全局配置
			let globalConfig = null
			try {
				const GLOBAL_CONFIG = await this.$DB.configs.get("chatConfigs")
				if (GLOBAL_CONFIG && GLOBAL_CONFIG.value) {
					globalConfig = GLOBAL_CONFIG.value
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 获取全局配置失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.AIInput.toast.getGlobalConfigError")}`)
			}
			// 加载系统提示词
			let systemPrompt = null
			try {
				const SYSTEM_PROMPT = await this.$DB.configs.get("systemPrompt")
				if (SYSTEM_PROMPT && SYSTEM_PROMPT.value) {
					systemPrompt = SYSTEM_PROMPT.value
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 获取系统提示词失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.AIInput.toast.getSystemPromptError")}`)
			}
			try {
				const NEW_CHAT_KEY = crypto.randomUUID()
				await this.$DB.chats.add({
					key: NEW_CHAT_KEY,
					title: this.t("components.AIInput.newChat"),
					timestamp: Date.now(),
					data: [
						{
							id: crypto.randomUUID(),
							message: {
								role: "system",
								content: systemPrompt
							},
							timestamp: Date.now(),
							status: "done"
						}
					],
					configs: globalConfig
				})
				return NEW_CHAT_KEY
			} catch (error) {
				this.chatInput = content
				await this.$nextTick(() => {
					this.adjustTextareaHeight()
				})
				this.$log.error(`[${this.name}] 创建新聊天失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.AIInput.toast.createNewChatError")}`)
			}
		},
		/**
		 * 消息流完成
		 */
		streamComplete() {
			this.stopStatus = false
		},
		/**
		 * 停止
		 */
		async stop() {
			const INSTANCE = platformRegistry.getPlatform(this.platformSelected.title)
			try {
				await INSTANCE.api.chatStop()
				this.stopStatus = false
				this.chatInput = this.oldChatInput
				// 更新输入框高度
				await this.$nextTick(() => {
					this.adjustTextareaHeight()
				})
			} catch (error) {
				this.stopStatus = true
				this.$log.error(`[${this.name}] 停止失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.AIInput.toast.stopError")}`)
			}
		},
		/**
		 * 停止状态更新
		 * @param status {boolean} - 停止状态
		 */
		stopStatusUpdate(status) {
			this.stopStatus = status
		},
		/**
		 * 处理换行
		 * @param event {Event} - 事件对象
		 */
		handleNewLine(event) {
			event.preventDefault()
			const textarea = event.target
			const cursorPos = textarea.selectionStart
			const currentValue = this.chatInput

			// 获取当前行的缩进
			const lineStart = currentValue.lastIndexOf("\n", cursorPos - 1) + 1
			const currentLine = currentValue.substring(lineStart, cursorPos)
			const indent = currentLine.match(/^\s*/)[0]

			// 插入换行符和缩进
			this.chatInput = currentValue.substring(0, cursorPos) + "\n" + indent + currentValue.substring(cursorPos)

			this.$nextTick(() => {
				this.adjustTextareaHeight()
				// 设置光标位置到新行的缩进后面
				textarea.selectionStart = cursorPos + 1 + indent.length
				textarea.selectionEnd = cursorPos + 1 + indent.length
				textarea.focus()
			})
		},
		/**
		 * 显示设置
		 */
		showSetup() {
			if (this.route.params.key) {
				EventBus.emit("[function] showSetup", true)
			} else {
				toastRegistry.warning(this.t("components.AIInput.toast.noChatKey"))
			}
		}
	}
})
</script>

<template>
	<div class="AIInput">
		<!--附件栏-->
		<input id="Appendix" type="checkbox"/>
		<div class="AppendixBar">
			<!--关闭-->
			<label for="Appendix" :title="t('components.AIInput.appendix.close')">
				<SVGIcon name="#icon-close" size="2em"/>
			</label>
			<!--拍照-->
			<label for="Camera" :title="t('components.AIInput.appendix.camera')">
				<input type="file" id="Camera" accept="image/*" capture="environment"/>
				<SVGIcon name="#icon-photograph" size="2em"/>
			</label>
			<!--相册-->
			<label for="Photos" :title="t('components.AIInput.appendix.picture')">
				<input type="file" id="Photos" accept="image/*"/>
				<SVGIcon name="#icon-photoAlbum" size="2em"/>
			</label>
			<!--文件-->
			<label for="Files" :title="t('components.AIInput.appendix.file')">
				<input type="file" id="Files"/>
				<SVGIcon name="#icon-file" size="2em"/>
			</label>
		</div>
		<!--顶部按钮栏-->
		<div class="TopButtonBar">
			<!--附件-->
			<label for="Appendix" :title="t('components.AIInput.function.appendix')">
				<SVGIcon name="#icon-link" size="2em"/>
			</label>
			<!--联网搜索-->
			<input id="Search" type="checkbox" v-model="enableWebSearch"/>
			<label for="Search" :title="t('components.AIInput.function.webSearch')">
				<SVGIcon name="#icon-webSearch" size="2em"/>
			</label>
			<!--设置-->
			<label :title="t('components.AIInput.function.setup')" @click="showSetup">
				<SVGIcon name="#icon-setup" size="2em"/>
			</label>
			<DefaultChatSettings
				:save="false"
				@update:selectedPlatformList="updateSelectedPlatformList"
				@update:selectedKey="updateSelectedKey"
				@update:selectedModel="updateSelectedModel"/>
		</div>
		<!--聊天输入框-->
		<div class="Input">
            <textarea
				id="ChatInput"
				:placeholder="t('components.AIInput.inputTip')"
				ref="textareaRef"
				spellcheck="false"
				v-model="chatInput"
				@keydown.enter.exact.prevent="send"
				@keydown.ctrl.enter.exact="handleNewLine"
				@keydown.shift.enter.exact="handleNewLine"></textarea>
			<!--发送-->
			<label
				for="Send"
				:title="t('components.AIInput.function.send')"
				class="send"
				v-if="!stopStatus"
				@click="send">
				<SVGIcon name="#icon-send" size="2em"/>
			</label>
			<!--停止-->
			<label
				for="Stop"
				:title="t('components.AIInput.function.stop')"
				class="Stop"
				v-if="stopStatus"
				@click="stop">
				<SVGIcon name="#icon-close" size="2em"/>
			</label>
		</div>
	</div>
</template>

<style scoped lang="less">
@media screen and (max-width: 768px) {
	.AIInput {
		width: 100% !important;
	}
}

.setup {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.AIInput {
	position: relative;
	padding: 16px;
	box-sizing: border-box;
	width: 100%;
	max-width: 773px;
	min-height: 200px;
	border: 2px solid var(--border-color);
	background-color: var(--box-shadow-color-anti);
	backdrop-filter: blur(10px);
	border-radius: 15px;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	user-select: none;

	.TopButtonBar {
		padding: 5px;
		margin-bottom: 10px;
		box-sizing: border-box;
		width: 100%;
		display: flex;
		align-items: center;
		gap: 10px;
		z-index: 1;

		label {
			padding: 10px;
			font-size: 12px;
			border-radius: 50%;
			opacity: 0.8;
			background-color: var(--background-color);
			border: 2px solid var(--chat-input-button-border-color);
			cursor: pointer;
			outline: none;
			transition: all 0.2s ease-in-out, transform 0.1s ease-in-out;

			&:hover {
				box-shadow: 0 0 5px 3px var(--box-shadow-color);
			}

			&:active {
				transform: scale(0.9);
			}
		}
	}
}

#Appendix, #Camera, #Photos, #Files, #Search, #Setup {
	display: none;
}

.Input {
	position: relative;

	#ChatInput {
		padding: 10px 44px 10px 10px;
		box-sizing: border-box;
		width: 100%;
		min-height: 100px;
		max-height: 600px;
		background-color: var(--box-shadow-color-anti);
		border: 1px solid var(--border-color);
		color: var(--text-color);
		font-size: 16px;
		letter-spacing: 3px;
		border-radius: 10px;
		resize: none;

		&:focus {
			outline: none;
		}
	}

	.send, .Stop {
		position: absolute;
		bottom: 20px;
		right: 20px;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background-color: var(--background-color);
		border: 2px solid var(--chat-input-button-border-color);
		opacity: 0.5;
		cursor: pointer;
		outline: none;
		transition: all 0.2s ease-in-out, transform 0.1s ease-in-out;
		display: flex;
		justify-content: center;
		align-items: center;

		&:hover {
			box-shadow: 0 0 5px 3px var(--box-shadow-color);
		}

		&:active {
			transform: scale(0.9);
		}
	}
}

.AppendixBar {
	z-index: 2;
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 16px;
	border-radius: 16px;
	overflow: hidden;
	pointer-events: none;
	transition: all 0.2s 0.4s ease-in-out;

	label {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 16px;
		border-radius: 50%;
		border: 2px solid var(--chat-input-attachment-button-border-color);
		font-size: 14px;
		color: var(--chat-input-attachment-button-text-color);
		background-color: var(--chat-input-attachment-button-background-color);
		opacity: 0;
		transition: all 0.2s ease-in-out;
		transform: translate(-600%, 600%);
		cursor: pointer;
	}

	& :nth-child(1) {
		transition-delay: 0.1s;
	}

	& :nth-child(2) {
		transition-delay: 0.2s;
	}

	& :nth-child(3) {
		transition-delay: 0.3s;
	}

	& :nth-child(4) {
		transition-delay: 0.4s;
	}
}

#Appendix {
	&:checked {
		& ~ .AppendixBar {
			background-color: var(--scrollbar-thumb-hover-color);
			backdrop-filter: blur(5px);
			pointer-events: all;
			transition: all 0.2s ease-in-out;

			label {
				opacity: 1;
				transform: translate(0);
			}
		}
	}
}

#Search {
	&:checked + label {
		border: 2px solid lightskyblue;
		color: lightskyblue;
	}
}
</style>