<script>
import {defineComponent, ref} from "vue"
import ModelList from "@/assets/data/ModelList.json"
import EventBus from "@/services/EventBus"
import Selector from "@/components/Selector.vue"
import {useRoute} from "vue-router"
import APIManager from "@/services/api/APIManager"

export default defineComponent({
	name: "AIInput",
	components: {Selector},
	inject: ["$DB"],
	data() {
		return {
			name: "AIInput",
			route: useRoute(),
			selector: {
				saved: false,
				// 模型列表
				largeModelList: ModelList,
				// Key列表
				keyPools: [],
				// 模型列表
				modelList: [],
				// 选中的模型
				selectedLargeModel: null,
				// 选中的Key
				selectedKey: null,
				// 选中的模型
				selectedModel: null,
				// 当前模型请求
				currentModelRequest: null,
				// 当前Key请求
				currentKeyRequest: null,
				// 加载状态
				loading: {
					keys: false,
					models: false
				}
			},
			// 输入框
			ChatInput: "",
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
		// 监听大模型变化
		"selector.selectedLargeModel"(newVal) {
			this.selectLargeModel(newVal)
		},
		// 监听Key变化
		"selector.selectedKey"(newVal) {
			this.selectKey(newVal)
		}
	},
	beforeDestroy() {
		this.cancelAllRequests()
	},
	async created() {
		// 获取设置
		await this.restoreSettings()
		// 初始化Key池
		await this.loadKeyPools()
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
		EventBus.on("[stream] streamComplete", this.streamComplete)
		EventBus.on("[update] keyPoolUpdate", this.loadKeyPools)
	},
	beforeUnmount() {
		EventBus.off("[stream] streamComplete", this.streamComplete)
		EventBus.off("[update] keyPoolUpdate", this.loadKeyPools)
	},
	unmounted() {
		if (this.textareaRef) {
			this.textareaRef.removeEventListener("input", this.adjustTextareaHeight)
		}
	},
	methods: {
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
		 * 取消所有请求
		 */
		cancelAllRequests() {
			if (this.currentModelRequest?.cancel) {
				this.currentModelRequest.cancel()
			}
			if (this.currentKeyRequest?.cancel) {
				this.currentKeyRequest.cancel()
			}
		},
		/**
		 * 更新大模型所选项
		 * @param newVal {Object} - 新的大模型
		 */
		updateSelectedLargeModel(newVal) {
			this.selector.selectedLargeModel = newVal
			this.selector.saved = false
		},
		/**
		 * 更新Key所选项
		 * @param newVal {Object} - 新的Key
		 */
		updateSelectedKey(newVal) {
			this.selector.selectedKey = newVal
		},
		/**
		 * 更新模型所选项
		 * @param newVal {Object} - 新的模型
		 */
		updateSelectedModel(newVal) {
			this.selector.selectedModel = newVal
		},
		/**
		 * 选择大模型
		 * @param newModel {Object} - 新的大模型
		 */
		async selectLargeModel(newModel) {
			this.cancelAllRequests()
			const requestContext = {cancelled: false}
			this.currentKeyRequest = {
				cancel: () => {
					requestContext.cancelled = true
				}
			}
			try {
				this.selector.loading.keys = true
				const keys = await this.fetchKeysForModel(newModel.title)

				if (requestContext.cancelled) return

				this.selector.keyPools = keys
				this.selector.selectedKey = keys[0] || null
				this.selector.loading.keys = false
			} catch (error) {
				if (!requestContext.cancelled) {
					this.$log.error(`[${this.name}] 加载Key池错误`, error)
					this.$toast.error(`[${this.name}] ${this.$t("components.AIInput.toast.loadKeyPoolError")}`)
				}
			} finally {
				this.selector.loading.keys = false
			}
		},
		/**
		 * 选择Key
		 * @param newKey {Object} - 新的Key
		 */
		async selectKey(newKey) {
			if (!newKey?.key) return
			this.cancelAllRequests()
			const requestContext = {cancelled: false}
			this.currentModelRequest = {
				cancel: () => {
					requestContext.cancelled = true
				}
			}
			try {
				this.selector.loading.models = true
				const models = await this.fetchModelsForKey(newKey.key)
				if (requestContext.cancelled) return
				this.selector.modelList = models
				if (!this.selector.saved) {
					this.selector.selectedModel = models[0] || null
				}
			} catch (error) {
				if (!requestContext.cancelled) {
					this.$log.error(`[${this.name}] 加载模型失败`, error)
					this.$toast.error(`[${this.name}] ${this.$t("components.AIInput.toast.loadModelError")}`)
				}
			} finally {
				this.selector.loading.models = false
			}
		},
		/**
		 * 获取模型的Key
		 * @param modelName {string} - 模型名称
		 */
		async fetchKeysForModel(modelName) {
			const keys = await this.$DB.apiKeys
				.where("model")
				.equals(modelName)
				.and(key => key.enabled)
				.toArray()

			return keys.map(key => ({
				key: key.key,
				title: key.remark || key.key
			}))
		},
		/**
		 * 获取Key的模型
		 * @param key {string} - Key
		 */
		async fetchModelsForKey(key) {
			const KEY_DATA = await this.$DB.apiKeys.get(key)
			const RESPONSE = await APIManager.execute(KEY_DATA.model, "models", {apiKey: key})
			if (RESPONSE.error) {
				this.$log.error(`[${this.name}] 获取Key的模型失败`, RESPONSE)
				this.$toast.error(`[${this.name}] ${this.$t(`api.${RESPONSE.error}`)}`)
			}
			const UNIQUE_MODELS = [...new Set(RESPONSE.data)]
			return UNIQUE_MODELS.map(model => ({title: model}))
		},
		/**
		 * 加载Key池
		 */
		async loadKeyPools() {
			const currentRequestId = Symbol()
			this.currentKeyPoolRequest = currentRequestId
			if (!this.selector.saved) {
				this.selector.selectedKey = null
			}
			this.selector.keyPools = []
			try {
				// const DEFAULT = {key: "auto", title: "自动"}
				const KEYS_DATA = await this.$DB.apiKeys
					.where("model")
					.equals(this.selector.selectedLargeModel.title)
					.and(key => key.enabled)
					.toArray()
				// 检查是否还是当前有效的请求
				if (this.currentKeyPoolRequest !== currentRequestId) return
				this.selector.keyPools = [
					// DEFAULT,
					...KEYS_DATA.map(key => ({key: key.key, title: key.remark}))
				]
				if (this.selector.keyPools.length === 0) return
				if (!this.selector.saved) {
					this.selector.selectedKey = this.selector.keyPools[0]
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 加载Key池失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.AIInput.toast.loadKeyPoolError")}`)
			}
		},
		/**
		 * 获取设置
		 */
		async restoreSettings() {
			try {
				const DEFAULT_CHAT_SETTINGS_DATA = await this.$DB.configs.get("DefaultChatSettings")
				if (DEFAULT_CHAT_SETTINGS_DATA) {
					this.selector.selectedLargeModel = this.selector.largeModelList.find(model => model.title === DEFAULT_CHAT_SETTINGS_DATA.value.largeModel)
					const KEY_DATA = await this.$DB.apiKeys.get(DEFAULT_CHAT_SETTINGS_DATA.value.key)
					if (!KEY_DATA) {
						this.selector.selectedKey = null
						this.selector.selectedModel = null
						return
					}
					this.selector.selectedKey = {key: KEY_DATA.key, title: KEY_DATA.remark}
					this.selector.selectedModel = {title: DEFAULT_CHAT_SETTINGS_DATA.value.model}
					this.selector.saved = true
				} else {
					this.selector.selectedLargeModel = this.selector.largeModelList[0]
					this.selector.selectedKey = null
					this.selector.selectedModel = null
					this.selector.saved = false
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 默认设置获取失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.AIInput.toast.getDefaultSettingsError")}`)
			}
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
		async Send() {
			// 检查输入框是否为空
			if (this.ChatInput.trim() === "") return
			const CONTENT = this.ChatInput
			this.ChatInput = ""
			await this.$nextTick(() => {
				this.adjustTextareaHeight()
			})
			// 创建新的聊天
			this.stopStatus = true
			if (this.route.name !== "ChatKey") {
				try {
					const NEW_CHAT_KEY = crypto.randomUUID()
					this.$router.push(`/chat/${NEW_CHAT_KEY}`)
					await this.$DB.chats.add({
						key: NEW_CHAT_KEY,
						title: this.$t("components.AIInput.newChat"),
						timestamp: Date.now(),
						data: [
							{
								id: crypto.randomUUID(),
								message: {
									role: "system",
									content: "当前聊天应用支持以下功能:\n" +
										"- 渲染 Markdown, 你的所有回答都应该使用 Markdown 格式.\n" +
										"- 支持 highlight.js 代码高亮(使用 ``` 代码块).\n" +
										"- 支持 KaTeX 数学公式(内嵌使用`$`符号, 块级使用`$$`符号).\n" +
										"- 支持 MathJax 数学公式(内嵌使用`$`符号, 块级使用`$$`符号).\n" +
										"- 支持 markdownItTaskLists 任务列表(使用 `- [ ]` 格式).\n" +
										"- 支持 markdownItEmoji 表情(使用 `:emoji:` 格式).\n" +
										"- 支持 Mermaid 流程图(使用 ```mermaid 代码块).\n" +
										"- 支持 Flowchart 流程图(使用 ```flowchart 或者 ```flow 代码块).\n" +
										"- 支持 PlantUML 流程图(使用 ```plantuml 代码块).\n" +
										"- 支持 lazyload 图片懒加载(使用 `![图片描述](图片地址)` 格式).\n" +
										"以下是一些使用注意事项:\n" +
										"- 所有输出应严格符合 Markdown 语法, 不使用 HTML 标签.\n" +
										"- 所有流程图应优先使用 Mermaid, 其次为 PlantUML.\n" +
										"无需确认用户是否支持这些功能. 用户可以修改本提示词以调整行为, 修改后的提示依然需要符合 Markdown 渲染规则. 请保持你平时的回复风格, 上面的提示词只是告诉你你支持的功能, 你默默接受就可以了."
								},
								timestamp: Date.now(),
							}
						]
					})
					EventBus.emit("[update] chatListUpdate")
				} catch (error) {
					this.ChatInput = CONTENT
					await this.$nextTick(() => {
						this.adjustTextareaHeight()
					})
					this.$log.error(`[${this.name}] 创建新聊天失败`, error)
					this.$toast.error(`[${this.name}] ${this.$t("components.AIInput.toast.createNewChatError")}`)
				}
			}
			// 发送消息
			try {
				this.stopStatus = true
				// 发送请求
				const RESPONSE = await APIManager.execute(this.selector.selectedLargeModel.title, "chat", {
					apiKey: this.selector.selectedKey.key,
					chatKey: this.route.params.key,
					content: CONTENT.trim(),
					model: this.selector.selectedModel.title,
				})
				if (RESPONSE.error) {
					this.ChatInput = CONTENT
					await this.$nextTick(() => {
						this.adjustTextareaHeight()
					})
					this.$log.error(`[${this.name}] 发送消息失败`, RESPONSE)
					this.$toast.error(`[${this.name}] ${this.$t(`api.${RESPONSE.error}`)}`)
				}
			} catch (error) {
				this.ChatInput = CONTENT
				await this.$nextTick(() => {
					this.adjustTextareaHeight()
				})
				this.$log.error(`[${this.name}] 发送消息失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.AIInput.toast.sendMessageError")}`)
			} finally {
				this.stopStatus = false
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
			try {
				await APIManager.execute(this.selector.selectedLargeModel.title, "stop")
				this.stopStatus = false
			} catch (error) {
				this.stopStatus = true
				this.$log.error(`[${this.name}] 停止失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.AIInput.toast.stopError")}`)
			}
		},
		/**
		 * 处理换行
		 * @param event {Event} - 事件对象
		 */
		handleNewLine(event) {
			event.preventDefault()
			const textarea = event.target
			const cursorPos = textarea.selectionStart
			const currentValue = this.ChatInput

			// 获取当前行的缩进
			const lineStart = currentValue.lastIndexOf("\n", cursorPos - 1) + 1
			const currentLine = currentValue.substring(lineStart, cursorPos)
			const indent = currentLine.match(/^\s*/)[0]

			// 插入换行符和缩进
			this.ChatInput = currentValue.substring(0, cursorPos) + "\n" + indent + currentValue.substring(cursorPos)

			this.$nextTick(() => {
				this.adjustTextareaHeight()
				// 设置光标位置到新行的缩进后面
				textarea.selectionStart = cursorPos + 1 + indent.length
				textarea.selectionEnd = cursorPos + 1 + indent.length
				textarea.focus()
			})
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
			<label for="Appendix" :title="$t('components.AIInput.appendix.close')">
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-close"></use>
				</svg>
			</label>
			<!--拍照-->
			<label for="Camera" :title="$t('components.AIInput.appendix.camera')">
				<input type="file" id="Camera" accept="image/*" capture="environment"/>
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-photograph"></use>
				</svg>
			</label>
			<!--相册-->
			<label for="Photos" :title="$t('components.AIInput.appendix.picture')">
				<input type="file" id="Photos" accept="image/*"/>
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-photoAlbum"></use>
				</svg>
			</label>
			<!--文件-->
			<label for="Files" :title="$t('components.AIInput.appendix.file')">
				<input type="file" id="Files"/>
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-file"></use>
				</svg>
			</label>
		</div>
		<!--顶部按钮栏-->
		<div class="TopButtonBar">
			<!--附件-->
			<label for="Appendix" :title="$t('components.AIInput.function.appendix')">
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-link"></use>
				</svg>
			</label>
			<!--联网搜索-->
			<input id="Search" type="checkbox" v-model="enableWebSearch"/>
			<label for="Search" :title="$t('components.AIInput.function.webSearch')">
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-webSearch"></use>
				</svg>
			</label>
			<!-- 大模型选择 -->
			<Selector
				:selectorSelected="selector.selectedLargeModel || {}"
				:selectorList="selector.largeModelList"
				uniqueKey="title"
				@update:selectorSelected="updateSelectedLargeModel"/>
			<!-- Key选择 -->
			<Selector
				:selectorSelected="selector.selectedKey || {}"
				:selectorList="selector.keyPools"
				:loading="selector.loading.keys"
				uniqueKey="key"
				@update:selectorSelected="updateSelectedKey"/>
			<!-- 模型选择 -->
			<Selector
				:selectorSelected="selector.selectedModel || {}"
				:selectorList="selector.modelList"
				:loading="selector.loading.models"
				uniqueKey="title"
				@update:selectorSelected="updateSelectedModel"/>
		</div>
		<!--聊天输入框-->
		<div class="Input">
            <textarea
				id="ChatInput"
				:placeholder="$t('components.AIInput.inputTip')"
				ref="textareaRef"
				spellcheck="false"
				v-model="ChatInput"
				@keydown.enter.exact.prevent="Send"
				@keydown.ctrl.enter.exact="handleNewLine"
				@keydown.shift.enter.exact="handleNewLine"></textarea>
			<!--发送-->
			<label
				for="Send"
				:title="$t('components.AIInput.function.send')"
				class="Send"
				v-if="!stopStatus"
				@click="Send">
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-send"></use>
				</svg>
			</label>
			<!--停止-->
			<label
				for="Stop"
				:title="$t('components.AIInput.function.stop')"
				class="Stop"
				v-if="stopStatus"
				@click="stop">
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-close"></use>
				</svg>
			</label>
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

@media screen and (max-width: 768px) {
	.AIInput {
		width: 100% !important;
	}
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

#Appendix, #Camera, #Photos, #Files, #Search {
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
		color: var(--text-color);
		font-size: 16px;
		letter-spacing: 3px;
		border-radius: 10px;
		border: none;
		resize: none;

		&:focus {
			outline: none;
		}
	}

	.Send, .Stop {
		position: absolute;
		bottom: 20px;
		right: 20px;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background-color: var(--background-color);
		border: 2px solid var(--chat-input-button-border-color);
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