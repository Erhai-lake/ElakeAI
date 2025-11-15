<script setup>
import {nextTick, onMounted, onUnmounted, ref, watch} from "vue"
import {useRoute, useRouter} from "vue-router"
import EventBus from "@/services/EventBus"
import SVGIcon from "@/components/SVGIcon.vue"
import {platformRegistry} from "@/services/plugin/api/PlatformClass"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import DefaultChatSettings from "@/components/options/DefaultChatSettings.vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "AIInput"

/**
 * 路由服务
 */
const route = useRoute()
const router = useRouter()

/**
 * 平台选择
 */
const platformSelected = ref(null)

/**
 * Key池选择
 */
const keyPoolsSelected = ref(null)

/**
 * 模型选择
 */
const modelSelected = ref(null)

/**
 * 输入框内容
 */
const chatInput = ref("")

/**
 * 旧输入框内容
 */
const oldChatInput = ref("")

/**
 * 联网搜索状态
 */
const enableWebSearch = ref(false)

/**
 * 停止状态
 */
const stopStatus = ref(false)

/**
 * 输入框引用
 */
const textareaRef = ref(null)

/**
 * 翻译
 * @param key {String} - 键
 * @param {Object} [params] - 插值参数, 例如 { name: "洱海" }
 * @returns {String} - 翻译后的文本
 */
const t = (key, params = {}) => {
	return i18nRegistry.translate(key, params)
}

/**
 * 监听路由变化
 */
watch(() => route.path, (newPath, oldPath) => {
	if (newPath !== oldPath) {
		focusInput()
	}
})

/**
 * 监听输入框内容变化
 */
watch(chatInput, (newValue, oldValue) => {
	if (newValue !== oldValue) {
		EventBus.emit("[update] inputChange", newValue)
	}
})

/**
 * 获取设置
 */
const restoreSettings = async () => {
	try {
		const DEFAULT_CHAT_SETTINGS_DATA = await Dexie.configs.get("DefaultChatSettings")
		if (DEFAULT_CHAT_SETTINGS_DATA) {
			platformSelected.value = {title: DEFAULT_CHAT_SETTINGS_DATA.value.platform}
			const KEY_DATA = await Dexie.apiKeys.get(DEFAULT_CHAT_SETTINGS_DATA.value.key)
			if (!KEY_DATA) {
				keyPoolsSelected.value = null
				modelSelected.value = null
				return
			}
			keyPoolsSelected.value = {key: KEY_DATA.key, title: KEY_DATA.title}
			modelSelected.value = {title: DEFAULT_CHAT_SETTINGS_DATA.value.model}
		} else {
			platformSelected.value = null
			keyPoolsSelected.value = null
			modelSelected.value = null
		}
	} catch (error) {
		Logger.error(`[${name}] 默认设置获取失败`, error)
		toastRegistry.error(`[${name}] ${t("components.AIInput.toast.getDefaultSettingsError")}`)
	}
}

/**
 * 更新平台所选项
 * @param newVal {Object} - 新的平台选项
 */
const updateSelectedPlatformList = (newVal) => {
	platformSelected.value = newVal
}

/**
 * 更新Key所选项
 * @param newVal {Object} - 新的Key选项
 */
const updateSelectedKey = (newVal) => {
	keyPoolsSelected.value = newVal
}

/**
 * 更新模型所选项
 * @param newVal {Object} - 新的模型选项
 */
const updateSelectedModel = (newVal) => {
	modelSelected.value = newVal
}

/**
 * 输入框获取焦点
 */
const focusInput = () => {
	nextTick(() => {
		if (textareaRef.value) {
			textareaRef.value.focus()
		}
	})
}

/**
 * 调整输入框高度
 */
const adjustTextareaHeight = () => {
	if (!textareaRef.value) return
	textareaRef.value.style.height = "auto"
	const newHeight = Math.min(textareaRef.value.scrollHeight, 600)
	textareaRef.value.style.height = `${Math.max(newHeight, 50)}px`
}

/**
 * 发送消息
 */
const send = async () => {
	// 检查输入框是否为空
	if (chatInput.value === "") return
	stopStatus.value = true
	oldChatInput.value = chatInput.value
	chatInput.value = ""
	// 更新输入框高度
	await nextTick(() => {
		adjustTextareaHeight()
	})
	// 判断是否存在聊天, 否则新建
	const CHAT_KEY = route.params.key ? route.params.key : await newChat(oldChatInput.value)
	// 请求开始
	const DIALOGUE_ID = crypto.randomUUID()
	const USER_DIALOGUE_ID = crypto.randomUUID()
	// 发送消息
	const INSTANCE = platformRegistry.getPlatform(platformSelected.value.title)
	try {
		const RESPONSE = INSTANCE.api.chat({
			dialogueId: DIALOGUE_ID,
			userDialogueId: USER_DIALOGUE_ID,
			apiKey: keyPoolsSelected.value.key,
			chatKey: CHAT_KEY,
			content: oldChatInput.value,
			model: modelSelected.value.title,
		})
		if (RESPONSE.error) {
			chatInput.value = oldChatInput.value
			await nextTick(() => {
				adjustTextareaHeight()
			})
			Logger.error(`[${name}] 发送消息失败`, RESPONSE)
			toastRegistry.error(`[${name}] ${t(RESPONSE.error)}`)
			EventBus.emit("[stream] streamComplete", {chatKey: CHAT_KEY})
		}
	} catch (error) {
		chatInput.value = oldChatInput.value
		await nextTick(() => {
			adjustTextareaHeight()
		})
		Logger.error(`[${name}] 发送消息失败`, error)
		toastRegistry.error(`[${name}] ${t("components.AIInput.toast.sendMessageError")}`)
	} finally {
		await router.push(`/chat/${CHAT_KEY}`)
		EventBus.emit("[update] chatListUpdate")
	}
}

/**
 * 新的聊天
 */
const newChat = async (content) => {
	// 加载全局配置
	let globalConfig = null
	try {
		const GLOBAL_CONFIG = await Dexie.configs.get("chatConfigs")
		if (GLOBAL_CONFIG && GLOBAL_CONFIG.value) {
			globalConfig = GLOBAL_CONFIG.value
		}
	} catch (error) {
		Logger.error(`[${name}] 获取全局配置失败`, error)
		toastRegistry.error(`[${name}] ${t("components.AIInput.toast.getGlobalConfigError")}`)
	}
	// 加载系统提示词
	let systemPrompt = null
	try {
		const SYSTEM_PROMPT = await Dexie.configs.get("systemPrompt")
		if (SYSTEM_PROMPT && SYSTEM_PROMPT.value) {
			systemPrompt = SYSTEM_PROMPT.value
		}
	} catch (error) {
		Logger.error(`[${name}] 获取系统提示词失败`, error)
		toastRegistry.error(`[${name}] ${t("components.AIInput.toast.getSystemPromptError")}`)
	}
	try {
		const NEW_CHAT_KEY = crypto.randomUUID()
		await Dexie.chats.add({
			key: NEW_CHAT_KEY,
			title: t("components.AIInput.newChat"),
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
		chatInput.value = content
		await nextTick(() => {
			adjustTextareaHeight()
		})
		Logger.error(`[${name}] 创建新聊天失败`, error)
		toastRegistry.error(`[${name}] ${t("components.AIInput.toast.createNewChatError")}`)
	}
}

/**
 * 消息流完成
 */
const streamComplete = () => {
	stopStatus.value = false
}

/**
 * 停止
 */
const stop = async () => {
	const INSTANCE = platformRegistry.getPlatform(platformSelected.value.title)
	try {
		await INSTANCE.api.chatStop()
		stopStatus.value = false
		chatInput.value = oldChatInput.value
		// 更新输入框高度
		await nextTick(() => {
			adjustTextareaHeight()
		})
	} catch (error) {
		stopStatus.value = true
		Logger.error(`[${name}] 停止失败`, error)
		toastRegistry.error(`[${name}] ${t("components.AIInput.toast.stopError")}`)
	}
}

/**
 * 停止状态更新
 * @param status {boolean} - 停止状态
 */
const stopStatusUpdate = (status) => {
	stopStatus.value = status
}

/**
 * 处理换行
 * @param event {Event} - 事件对象
 */
const handleNewLine = (event) => {
	event.preventDefault()
	const textarea = event.target
	const cursorPos = textarea.selectionStart
	const currentValue = chatInput.value

	// 获取当前行的缩进
	const lineStart = currentValue.lastIndexOf("\n", cursorPos - 1) + 1
	const currentLine = currentValue.substring(lineStart, cursorPos)
	const indent = currentLine.match(/^\s*/)[0]

	// 插入换行符和缩进
	chatInput.value = currentValue.substring(0, cursorPos) + "\n" + indent + currentValue.substring(cursorPos)

	nextTick(() => {
		adjustTextareaHeight()
		// 设置光标位置到新行的缩进后面
		textarea.selectionStart = cursorPos + 1 + indent.length
		textarea.selectionEnd = cursorPos + 1 + indent.length
		textarea.focus()
	})
}

/**
 * 显示设置
 */
const showSetup = () => {
	if (route.params.key) {
		EventBus.emit("[function] showSetup", true)
	} else {
		toastRegistry.warning(t("components.AIInput.toast.noChatKey"))
	}
}

onMounted(() => {
	if (textareaRef.value) {
		adjustTextareaHeight()
		textareaRef.value.addEventListener("input", adjustTextareaHeight)
		focusInput()
	}
	EventBus.on("[stream] streamComplete", streamComplete)
	EventBus.on("[update] keyPoolUpdate", restoreSettings)
	EventBus.on("[update] stopStatusUpdate", stopStatusUpdate)
	restoreSettings()
})

onUnmounted(() => {
	EventBus.off("[stream] streamComplete", streamComplete)
	EventBus.off("[update] keyPoolUpdate", restoreSettings)
	EventBus.off("[update] stopStatusUpdate", stopStatusUpdate)
	if (textareaRef.value) {
		textareaRef.value.removeEventListener("input", adjustTextareaHeight)
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