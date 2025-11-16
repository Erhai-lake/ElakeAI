<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, markRaw } from "vue"
import { useRoute, useRouter } from "vue-router"
import Loading from "@/components/Loading.vue"
import AIInput from "@/components/AIInput.vue"
import EventBus from "@/services/EventBus"
import { i18nRegistry } from "@/services/plugin/api/I18nClass"
import { toastRegistry } from "@/services/plugin/api/ToastClass"
import RightClickMenu from "@/components/RightClickMenu.vue"
import SVGIcon from "@/components/SVGIcon.vue"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "ChatView"

// 路由和路由实例
const route = useRoute()
const router = useRouter()

/**
 * 是否正在加载
 */
const isLoading = ref(true)

/**
 * 已加载消息数量
 */
const loadedMessages = ref(0)

/**
 * 总消息数量
 */
const totalMessages = ref(0)

/**
 * 当前消息ID
 */
const currentMessageId = ref(null)

/**
 * 消息组件映射
 */
const messageComponentMap = ref(null)

/**
 * 聊天数据
 */
const data = ref({
	key: null,
	title: null,
	timestamp: null,
	data: [],
})

/**
 * 是否显示输入框
 */
const showInputBox = ref(true)

/**
 * 聊天输入框
 */
const chatInput = ref(null)

/**
 * 是否显示预览气泡
 */
const previewBubbles = ref(true)

/**
 * 右键菜单
 */
const menu = ref(null)

/**
 * 当前初始化任务ID
 */
const _currentInitTaskId = ref(null)

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
 * 角色到组件
 */
const roleToComponent = () => {
	const MODULES = import.meta.glob("@/components/chat/role/*.vue", { eager: true })
	const MESSAGE_COMPONENT_MAP = {}
	for (const PATH in MODULES) {
		const COMPONENT = MODULES[PATH].default
		const FILE_NAME = PATH.split("/").pop().replace(".vue", "")
		const ROLE = FILE_NAME.replace("MessageCard", "").toLowerCase()
		MESSAGE_COMPONENT_MAP[ROLE] = markRaw(COMPONENT)
	}
	messageComponentMap.value = MESSAGE_COMPONENT_MAP
}

/**
 * 右键点击
 * @param event 事件
 * @param item 项
 */
const onRightClick = (event, item) => {
	event.preventDefault()
	event.stopPropagation()
	menu.value?.show(event.clientX, event.clientY, [
		{
			title: t("views.ChatView.functionalControls.scrollToTopMessages"),
			icon: {
				type: "svg",
				src: "#icon-topArrow"
			},
			onClick: () => scrollToUpAndDownMessages("top")
		},
		{
			title: t("views.ChatView.functionalControls.scrollToUpMessages"),
			icon: {
				type: "svg",
				src: "#icon-upArrow"
			},
			onClick: () => scrollToUpAndDownMessages("up")
		},
		{
			title: t("views.ChatView.functionalControls.scrollToDownMessages"),
			icon: {
				type: "svg",
				src: "#icon-downArrow"
			},
			onClick: () => scrollToUpAndDownMessages("down")
		},
		{
			title: t("views.ChatView.functionalControls.scrollToBottomMessages"),
			icon: {
				type: "svg",
				src: "#icon-bottomArrow"
			},
			onClick: () => scrollToUpAndDownMessages("bottom")
		},
		{
			title: t("views.ChatView.functionalControls." + (showInputBox.value ? "hideInputBox" : "showInputBox")),
			icon: {
				type: "svg",
				src: "#icon-inputBox"
			},
			onClick: () => showInputBox.value = !showInputBox.value
		}
	], item.key)
}

/**
 * 设置当前聚焦的消息ID
 * @param {string} id 消息ID
 */
const setCurrentMessageId = (id) => {
	currentMessageId.value = id
}

/**
 * 滚动到指定消息
 * @param {string} id 消息ID
 * @param position {string} - 滚动位置("top"或"bottom")
 */
const scrollToMessage = (id, position = "bottom") => {
	nextTick(() => {
		const CONTAINER = document.querySelector(".message-list")
		if (!CONTAINER) return
		const MESSAGE_ELEMENT = document.querySelector(`[data-message-id="${id}"]`)
		if (MESSAGE_ELEMENT) {
			// 更新当前聚焦的消息
			setCurrentMessageId(id)
			let scrollTop = MESSAGE_ELEMENT.offsetTop - 100
			if (position === "bottom") {
				scrollTop = MESSAGE_ELEMENT.offsetTop + MESSAGE_ELEMENT.offsetHeight - CONTAINER.clientHeight + 100
			}
			// 滚动到消息位置(距顶部留出100px空间)
			CONTAINER.scrollTo({
				top: scrollTop,
				behavior: "smooth"
			})
		}
	})
}

/**
 * 向上或向下滚动消息(默认向上)
 * @param type {string} - 滚动方向("up"或"down", "top"或"bottom")
 * @param position {string} - 滚动位置("top"或"bottom")
 */
const scrollToUpAndDownMessages = (type = "up", position = "bottom") => {
	if (!data.value.data?.length) return
	const LAST_INDEX = data.value.data.length - 1
	// 获取当前消息的索引(无当前消息时, up从最后开始, down从第一条开始)
	let CURRENT_INDEX = currentMessageId.value
		? data.value.data.findIndex((msg) => msg.id === currentMessageId.value)
		: type === "up" ? LAST_INDEX : 0
	// 边界检查
	if (type === "up") {
		if (CURRENT_INDEX === 0) {
			scrollToUpAndDownMessages("top", position)
			return
		}
		if (CURRENT_INDEX === -1) CURRENT_INDEX = LAST_INDEX
	} else if (type === "down") {
		if (CURRENT_INDEX === LAST_INDEX) {
			scrollToUpAndDownMessages("bottom", position)
			return
		}
		if (CURRENT_INDEX === -1) CURRENT_INDEX = 0
	} else if (type === "top") {
		if (!data.value.data?.length) return
		scrollToMessage(data.value.data[0].id, position)
		return
	} else if (type === "bottom") {
		if (!data.value.data?.length) return
		scrollToMessage(data.value.data[LAST_INDEX].id, position)
		return
	}
	// 计算目标索引
	let targetIndex = type === "up" ? CURRENT_INDEX - 1 : CURRENT_INDEX + 1
	targetIndex = Math.max(0, Math.min(targetIndex, LAST_INDEX))
	if (data.value.data[targetIndex]) {
		scrollToMessage(data.value.data[targetIndex].id, position)
	}
}

/**
 * 初始化聊天视图
 * @param chatKey {string} - 聊天Key
 */
const initChatView = async (chatKey = route.params.key) => {
	isLoading.value = true
	loadedMessages.value = 0
	totalMessages.value = 0
	// 生成任务 ID 防止并发初始化
	const TASK_ID = Date.now() + Math.random()
	_currentInitTaskId.value = TASK_ID
	try {
		const CHAT_DATA = await Dexie.chats.get(chatKey)
		// 检查ChatKey是否存在
		if (!CHAT_DATA) {
			toastRegistry.warning(t("views.ChatView.toast.noChatKey"))
			await router.push("/not-found")
			EventBus.emit("[update] chatListUpdate")
			return
		}
		// 基本聊天信息
		data.value = {
			key: CHAT_DATA.key,
			title: CHAT_DATA.title,
			timestamp: CHAT_DATA.timestamp,
			data: []
		}
		const ALL_MESSAGES = Array.isArray(CHAT_DATA.data) ? CHAT_DATA.data : []
		totalMessages.value = ALL_MESSAGES.length
		// 从数据库读取批大小(默认20)
		let batchSize = 20
		try {
			const CHAT_BATCH_SIZE = await Dexie.configs.get("chatBatchSize")
			batchSize = CHAT_BATCH_SIZE.value || 20
			Logger.info(`[${name}] 聊天批大小设置为${batchSize}`)
		} catch (error) {
			Logger.error(`[${name}] 读取聊天批大小失败, 使用默认值 20`, error)
			toastRegistry.error(`[${name}] ${t("views.ChatView.toast.chatBatchSizeError")}`)
			batchSize = 20
		}
		// 分批渲染
		for (let i = 0; i < ALL_MESSAGES.length; i += batchSize) {
			// 如果任务 ID 改变了, 立刻终止初始化
			if (_currentInitTaskId.value !== TASK_ID) {
				return
			}
			const BATCH = ALL_MESSAGES.slice(i, i + batchSize)
			data.value.data.push(...BATCH)
			loadedMessages.value = data.value.data.length
			// 等待 DOM 更新
			await nextTick()
			// 等待当前批次渲染稳定, 避免闪动
			await waitForMessageListRendered()
		}
		// 最终检查一次任务 ID
		if (_currentInitTaskId.value === TASK_ID) {
			scrollToUpAndDownMessages("bottom")
			checkLastMessage()
		}
	} catch (error) {
		Logger.error(`[${name}] 聊天记录获取错误`, error)
		toastRegistry.error(`[${name}] ${t("views.ChatView.toast.getChatLogError")}`)
	} finally {
		// 只在当前任务时才结束 loading
		if (_currentInitTaskId.value === TASK_ID) {
			isLoading.value = false
		}
	}
}

/**
 * 聊天标题更新
 * @param title {string} - 聊天标题
 */
const chatTitle = (title) => {
	data.value.title = title
}

/**
 * 等待 message-list 渲染稳定（高度不再变化）
 * @returns {Promise<void>}
 */
const waitForMessageListRendered = () => {
	return new Promise((resolve) => {
		const CONTAINER = document.querySelector(".message-list")
		if (!CONTAINER) return resolve()
		let lastHeight = CONTAINER.scrollHeight
		let stableCounter = 0
		let maxTries = 30
		const check = () => {
			requestAnimationFrame(() => {
				const CURRENT_HEIGHT = CONTAINER.scrollHeight
				if (CURRENT_HEIGHT === lastHeight) {
					stableCounter++
				} else {
					stableCounter = 0
					lastHeight = CURRENT_HEIGHT
				}
				if (stableCounter >= 5 || --maxTries <= 0) {
					resolve()
				} else {
					check()
				}
			})
		}
		check()
	})
}

/**
 * 用户消息
 * @param message {Object} - 消息
 */
const userMessage = async (message) => {
	if (message.chatKey !== data.value.key) return
	data.value.data.push(message.userMessage)
}

/**
 * 消息流
 * @param message {Object} - 消息
 */
const streamStream = async (message) => {
	if (message.chatKey !== data.value.key) return
	if (!Array.isArray(data.value.data)) {
		data.value.data = []
	}
	const LAST_MESSAGE = data.value.data[data.value.data.length - 1]
	if (!LAST_MESSAGE || LAST_MESSAGE.message.role !== "assistant") {
		data.value.data.push({
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
		LAST_MESSAGE.message = {
			...LAST_MESSAGE.message,
			reasoning: LAST_MESSAGE.message.reasoning + (message.reasoning || ""),
			content: LAST_MESSAGE.message.content + (message.message || ""),
		}
	}
}

/**
 * 消息流完成
 */
const streamComplete = async (message) => {
	if (message.chatKey !== data.value.key) return
	// 判断错误
	if (message.status === "error") {
		data.value.data[data.value.data.length - 2] = {
			...data.value.data[data.value.data.length - 2],
			status: "error"
		}
		// 移除最后一条assistant消息
		if (data.value.data[data.value.data.length - 1].message.role === "assistant") {
			data.value.data.pop()
		}
		return
	}
	if (data.value.data?.length) {
		// 更新状态
		data.value.data[data.value.data.length - 2] = {
			...data.value.data[data.value.data.length - 2],
			status: "done"
		}
		data.value.data[data.value.data.length - 1] = {
			...data.value.data[data.value.data.length - 1],
			status: "done"
		}
	}
	try {
		// 如果是第一条AI回复且是默认标题
		if (data.value.title === t("components.AIInput.newChat")) {
			// 如果没有AI回复, 则不更新标题
			if (!data.value.data?.length) return
			const AI_CONTENT = data.value.data[data.value.data.length - 1].message.content
			// 从AI回复中提取关键词
			const KEYWORDS = AI_CONTENT
					// 移除HTML标签
					.replace(/<[^>]+>/g, '')
					// 提取中文关键词(至少2个中文字符）
					.match(/[\u4e00-\u9fa5]{2,}/g)
				// 提取英文关键词(至少4个英文字符）
				|| AI_CONTENT.match(/\b\w{4,}\b/g)
				|| []
			const TITLE = KEYWORDS.length > 0 ? KEYWORDS.slice(0, 3).join(" ") : data.value.title
			if (TITLE !== data.value.title) {
				data.value.title = TITLE
				await Dexie.chats.update(data.value.key, { title: TITLE })
				EventBus.emit("[update] chatListUpdate")
			}
		}
	} catch (error) {
		Logger.error(`[${name}] 标题更新错误`, error)
		toastRegistry.error(`[${name}] ${t("views.ChatView.toast.titleUpdateError")}`)
	}
}

/**
 * 输入框内容改变
 * @param content {string} - 输入框内容
 */
const inputChange = (content) => {
	if (!content || !previewBubbles.value) {
		chatInput.value = null
		return
	}
	chatInput.value = {
		id: "00000000-0000-0000-0000-000000000000",
		message: {
			content: content,
			role: "user"
		},
		status: "done",
		timestamp: Date.now()
	}
}

/**
 * 检查最后一条消息是否完成
 */
const checkLastMessage = () => {
	if (data.value.data?.length) {
		const LAST_MESSAGE = data.value.data[data.value.data.length - 1]
		if (LAST_MESSAGE.status) {
			EventBus.emit("[update] stopStatusUpdate", LAST_MESSAGE.status !== "done")
		}
	}
}

/**
 * 编辑消息
 * @param id {string} - 消息ID
 * @param content {string} - 消息内容
 */
const editMessage = async (id, content) => {
	try {
		// 编辑本地中的消息
		const INDEX = data.value.data.findIndex((msg) => msg.id === id)
		if (INDEX !== -1) {
			data.value.data[INDEX].message.content = content
		}
		// 更新数据库中的消息
		const DATA = JSON.parse(JSON.stringify(data.value.data))
		await Dexie.chats.update(data.value.key, { data: DATA })
		toastRegistry.success(`[${name}] ${t("views.ChatView.toast.editMessageSuccess")}`)
	} catch (error) {
		Logger.error(`[${name}] 消息编辑错误`, error)
		toastRegistry.error(`[${name}] ${t("views.ChatView.toast.editMessageError")}`)
	}
}

/**
 * 移除消息
 * @param id {string} - 消息ID
 */
const removeMessage = async (id) => {
	try {
		// 移除本地中的消息
		const INDEX = data.value.data.findIndex((msg) => msg.id === id)
		if (INDEX !== -1) {
			data.value.data.splice(INDEX, 1)
		}
		// 更新数据库中的消息
		const DATA = JSON.parse(JSON.stringify(data.value.data))
		await Dexie.chats.update(data.value.key, { data: DATA })
		toastRegistry.success(`[${name}] ${t("views.ChatView.toast.removeMessageSuccess")}`)
		// 更新侧边栏
		EventBus.emit("[update] chatListUpdate")
	} catch (error) {
		Logger.error(`[${name}] 消息移除错误`, error)
		toastRegistry.error(`[${name}] ${t("views.ChatView.toast.removeMessageError")}`)
	}
}

// 监听器
watch(() => route.params.key, (newKey) => {
	initChatView(newKey)
	checkLastMessage()
})

onMounted(async () => {
	EventBus.on("[update] initChatView", initChatView)
	EventBus.on("[update] chatTitle", chatTitle)
	EventBus.on("[stream] userMessage", userMessage)
	EventBus.on("[stream] streamStream", streamStream)
	EventBus.on("[stream] streamComplete", streamComplete)
	EventBus.on("[function] removeMessage", removeMessage)
	EventBus.on("[function] editMessage", editMessage)
	EventBus.on("[update] inputChange", inputChange)

	roleToComponent()
	await initChatView()

	try {
		const PREVIEW_BUBBLES_DATA = await Dexie.configs.get("previewBubbles")
		previewBubbles.value = PREVIEW_BUBBLES_DATA ? PREVIEW_BUBBLES_DATA.value : true
	} catch (error) {
		Logger.error(`[${name}] 预览气泡获取失败`, error)
		toastRegistry.error(`[${name}] ${t("views.ChatView.toast.getPreviewBubblesError")}`)
	}
})

onUnmounted(() => {
	EventBus.off("[update] initChatView", initChatView)
	EventBus.off("[update] chatTitle", chatTitle)
	EventBus.off("[stream] userMessage", userMessage)
	EventBus.off("[stream] streamStream", streamStream)
	EventBus.off("[stream] streamComplete", streamComplete)
	EventBus.off("[function] removeMessage", removeMessage)
	EventBus.off("[function] editMessage", editMessage)
	EventBus.off("[update] inputChange", inputChange)
})
</script>

<template>
	<Loading
		:loading="isLoading"
		:text="t('views.ChatView.loading', {loadedMessages, totalMessages})">
		<div class="chat-view">
			<!-- 顶部标题 -->
			<div class="head">
				<p class="title">{{ data.title }}</p>
				<p class="time">{{ t("views.ChatView.numberOfConversations", {num: data.data.length}) }}</p>
			</div>
			<!-- 消息列表 -->
			<RightClickMenu ref="menu"/>
			<div
				class="message-list"
				:style="`padding: 100px 50px ${showInputBox ? '280px' : '50px'}`"
				@contextmenu.prevent="onRightClick($event, data)">
				<div
					v-for="message in data.data"
					:key="message.id"
					class="message"
					:data-message-id="message.id"
					@click="setCurrentMessageId(message.id)">
					<component
						:is="messageComponentMap[message.message.role]"
						:message="message"
						:currentMessageId="currentMessageId"/>
				</div>
				<component
					v-if="chatInput && previewBubbles"
					:is="messageComponentMap.user"
					:message="chatInput"
					:controls="false"/>
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
					:title="t('views.ChatView.functionalControls.scrollToTopMessages')"
					@click="scrollToUpAndDownMessages('top')"
					:disabled="data.data.length === 0">
					<SVGIcon name="#icon-topArrow" size="2em"/>
				</button>
				<!-- 上一条按钮 -->
				<button
					:title="t('views.ChatView.functionalControls.scrollToUpMessages')"
					@click="scrollToUpAndDownMessages('up')"
					:disabled="data.data.length === 0">
					<SVGIcon name="#icon-upArrow" size="2em"/>
				</button>
				<!-- 下一条按钮 -->
				<button
					:title="t('views.ChatView.functionalControls.scrollToDownMessages')"
					@click="scrollToUpAndDownMessages('down')"
					:disabled="data.data.length === 0">
					<SVGIcon name="#icon-downArrow" size="2em"/>
				</button>
				<!-- 回到底部按钮 -->
				<button
					:title="t('views.ChatView.functionalControls.scrollToBottomMessages')"
					@click="scrollToUpAndDownMessages('bottom')"
					:disabled="data.data.length === 0">
					<SVGIcon name="#icon-bottomArrow" size="2em"/>
				</button>
				<!-- 显示输入框按钮 -->
				<button
					:title="t('views.ChatView.functionalControls.' + (showInputBox ? 'hideInputBox' : 'showInputBox'))"
					@click="showInputBox = !showInputBox">
					<SVGIcon name="#icon-inputBox" size="2em"/>
				</button>
			</div>
		</div>
	</Loading>
</template>

<style scoped lang="less">
.chat-view {
	position: relative;
	width: 100%;
	height: 100%;
	display: grid;
	grid-template-rows: auto 1fr auto;
	overflow: hidden;
}

.head {
	padding: 0 20px;
	box-sizing: border-box;
	height: 65px;
	border-radius: 0 0 20px 20px;
	backdrop-filter: blur(10px);
	box-shadow: 0 6px 15px 0 var(--box-shadow-color);
	display: flex;
	flex-direction: column;
	justify-content: center;
	overflow: hidden;
	z-index: 2;

	.title {
		font-size: 20px;
		font-weight: bold;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		cursor: pointer;
	}

	.time {
		font-size: 14px;
		color: var(--text-secondary-color);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
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

	.message {
		border-radius: 12px;
		display: flex;
		flex-direction: column;
	}
}

.input-area {
	position: absolute;
	left: 50%;
	bottom: 50px;
	transform: translateX(-50%);
	width: 100%;
	max-width: 773px;
	opacity: 1;
	z-index: 2;
}

.show-input-box {
	transform: translate(-50%, 120%);
	opacity: 0;
	transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
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
		padding: 3px;
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