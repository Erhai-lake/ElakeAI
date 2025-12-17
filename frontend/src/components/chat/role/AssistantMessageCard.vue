<script setup>
import {markRaw, nextTick, onMounted, ref, watch} from "vue"
import {encode} from "gpt-tokenizer"
import markdownItTaskLists from "markdown-it-task-lists"
import {full as emoji} from "markdown-it-emoji"
import markdownItKatex from "@iktakahiro/markdown-it-katex"
import markdownItMathjax3 from "markdown-it-mathjax3"
import "katex/dist/katex.min.css"
import {imgLazyload} from "@mdit/plugin-img-lazyload"
import Button from "@/components/input/Button.vue"
import MarkdownBlockRenderer from "@/components/chat/renderer/MarkdownBlockRenderer.vue"
import CodeBlockRenderer from "@/components/chat/renderer/CodeBlockRenderer.vue"
import MermaidRenderer from "@/components/chat/renderer/MermaidRenderer.vue"
import FlowchartRenderer from "@/components/chat/renderer/FlowchartRenderer.vue"
import PlantUMLRenderer from "@/components/chat/renderer/PlantUMLRenderer.vue"
import {platformRegistry} from "@/services/plugin/api/PlatformClass"
import EventBus from "@/services/EventBus"
import FoldingPanel from "@/components/FoldingPanel.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import RightClickMenu from "@/components/RightClickMenu.vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "AssistantMessageCard"

const props = defineProps({
	/**
	 * 消息对象
	 */
	message: {
		type: Object,
		required: true
	},
	/**
	 * 当前消息 ID
	 */
	currentMessageId: {
		type: String,
		default: ""
	},
	/**
	 * 是否显示操作按钮
	 */
	controls: {
		type: Boolean,
		default: true
	}
})

/**
 * 对话主题
 */
const chatTheme = ref("card")

/**
 * 解析后的消息块
 */
const parsedBlocks = ref([])

/**
 * 推理 HTML
 */
const reasoningHtml = ref("")

/**
 * 是否展开推理
 */
const isReasoningExpanded = ref(false)

/**
 * 编辑内容
 */
const editingContent = ref({
	show: false,
	value: ""
})

/**
 * 右键菜单
 */
const menu = ref(null)

/**
 * 文本区域
 */
const textarea = ref(null)

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
 * 推理文本
 */
const reasoning = ref(t("components.Role.AssistantMessageCard.reasoning"))

/**
 * 格式化时间戳
 * @param timestamp - 时间戳
 * @returns {string} 格式化后的时间字符串
 */
const formatTimestamp = (timestamp) => {
	const DATE = new Date(timestamp)
	const YEAR = DATE.getFullYear()
	const MONTH = String(DATE.getMonth() + 1).padStart(2, "0")
	const DAY = String(DATE.getDate()).padStart(2, "0")
	const HOURS = String(DATE.getHours()).padStart(2, "0")
	const MINUTES = String(DATE.getMinutes()).padStart(2, "0")
	const SECONDS = String(DATE.getSeconds()).padStart(2, "0")
	const MILLISECONDS = String(DATE.getMilliseconds()).padStart(3, "0")
	return `${YEAR}-${MONTH}-${DAY} ${HOURS}:${MINUTES}:${SECONDS}.${MILLISECONDS}`
}

/**
 * 计算tokens
 * @param content - 内容
 * @returns {number} - tokens数量
 */
const tokens = (content) => {
	return encode(content).length
}

/**
 * 获取模型图片
 * @returns {String} - 平台图片
 */
const modelImages = () => {
	if (!props.message.model.platform) return null
	try {
		const PLATFORM = platformRegistry.getPlatform(props.message.model.platform)
		if (!PLATFORM) {
			Logger.error(`[${name}] 平台Logo不存在`)
			return null
		}
		return PLATFORM.info.image
	} catch (error) {
		Logger.error(`[${name}] 平台Logo加载错误`, error)
		return null
	}
}

/**
 * 解析内容
 */
const parseContent = async () => {
	const MARKDOWN_IT = (await import("markdown-it")).default
	const MD = MARKDOWN_IT({
		html: false,
		breaks: true,
		linkify: true,
		typographer: true,
		langPrefix: "",
		highlight: null
	})
		.use(markdownItTaskLists)
		.use(emoji)
		.use(markdownItKatex)
		.use(markdownItMathjax3)
		.use(imgLazyload)
	MD.renderer.rules.fence = (tokens, idx) => {
		const TOKEN = tokens[idx]
		const CODE = TOKEN.content
		const LANG = TOKEN.info.trim().toLowerCase()
		const TYPE_MAP = {
			mermaid: "mermaid",
			flow: "flowchart",
			flowchart: "flowchart",
			plantuml: "plantuml",
		}
		const SAFE_LANG = TYPE_MAP[LANG] || "code"
		return `<div data-lang="${SAFE_LANG}" data-language="${LANG || "plaintext"}" data-code="${encodeURIComponent(CODE)}"></div>`
	}
	const RAW_HTML = MD.render(props.message.message.content)
	const CONTAINER = document.createElement("div")
	CONTAINER.innerHTML = RAW_HTML
	const BLOCKS = []
	for (const NODE of Array.from(CONTAINER.childNodes)) {
		const LANG = NODE.dataset?.lang
		if (NODE.nodeType === 1 && LANG === "code") {
			BLOCKS.push({
				component: markRaw(CodeBlockRenderer),
				props: {
					code: decodeURIComponent(NODE.dataset.code),
					language: NODE.dataset.language || "plaintext"
				}
			})
		} else if (NODE.nodeType === 1 && LANG === "mermaid") {
			BLOCKS.push({
				component: markRaw(MermaidRenderer),
				props: {
					code: decodeURIComponent(NODE.dataset.code)
				}
			})
		} else if (NODE.nodeType === 1 && (LANG === "flow" || LANG === "flowchart")) {
			BLOCKS.push({
				component: markRaw(FlowchartRenderer),
				props: {
					code: decodeURIComponent(NODE.dataset.code)
				}
			})
		} else if (NODE.nodeType === 1 && LANG === "plantuml") {
			BLOCKS.push({
				component: markRaw(PlantUMLRenderer),
				props: {
					code: decodeURIComponent(NODE.dataset.code)
				}
			})
		} else if (NODE.nodeType === 1) {
			BLOCKS.push({
				component: markRaw(MarkdownBlockRenderer),
				props: {
					html: NODE.outerHTML
				}
			})
		} else if (NODE.nodeType === 3 && NODE.textContent.trim()) {
			BLOCKS.push({
				component: markRaw(MarkdownBlockRenderer),
				props: {
					html: NODE.textContent
				}
			})
		}
	}
	parsedBlocks.value = BLOCKS
}

/**
 * 解析推理
 */
const parseReasoning = async () => {
	if (!props.message.message.reasoning) {
		reasoningHtml.value = ""
		return
	}
	const MARKDOWN_IT = (await import("markdown-it")).default
	const MD = MARKDOWN_IT({
		html: false,
		breaks: true,
		linkify: true,
		typographer: true
	})
		.use(markdownItTaskLists)
		.use(emoji)
		.use(markdownItKatex)
		.use(markdownItMathjax3)
		.use(imgLazyload)
	reasoningHtml.value = MD.render(props.message.message.reasoning)
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
			title: t("components.MessageCard.editMessage"),
			icon: {
				type: "svg",
				src: "#icon-inputBox"
			},
			color: "var(--theme-color)",
			onClick: () => editInput()
		},
		{
			title: t("components.MessageCard.removeMessage"),
			icon: {
				type: "svg",
				src: "#icon-delete"
			},
			color: "red",
			onClick: () => remove()
		}
	], item.id)
}

/**
 * 显示输入框
 */
const editInput = () => {
	editingContent.value.value = props.message.message.content
	editingContent.value.show = true
	nextTick(() => {
		textarea.value.focus()
		adjustTextareaHeight()
	})
}

/**
 * 保存消息
 */
const saveContent = () => {
	if (editingContent.value.value === props.message.message.content) return
	if (editingContent.value.value === "") return
	EventBus.emit("[function] editMessage", props.message.id, editingContent.value.value)
	editingContent.value.show = false
}

/**
 * 调整 textarea 高度
 */
const adjustTextareaHeight = () => {
	const TEXTAREA = textarea.value
	if (TEXTAREA) {
		TEXTAREA.style.height = "auto"
		// 获取滚动高度
		const scrollHeight = TEXTAREA.scrollHeight
		// 设置最大高度为 600px
		TEXTAREA.style.height = Math.min(scrollHeight, 600) + "px"
	}
}

/**
 * 移除消息
 */
const remove = () => {
	EventBus.emit("[function] removeMessage", props.message.id)
}

/**
 * 当推理内容变化时解析推理
 */
watch(() => props.message.message.reasoning, (newVal, oldVal) => {
	if (newVal !== oldVal) {
		isReasoningExpanded.value = true
		reasoning.value = t("components.Role.AssistantMessageCard.thinking")
		parseReasoning()
	}
})

/**
 * 当消息内容变化时解析内容
 */
watch(() => props.message.message.content, (newVal, oldVal) => {
	if (newVal !== oldVal) {
		isReasoningExpanded.value = false
		reasoning.value = t("components.Role.AssistantMessageCard.reasoning")
		const HAS_UNCLOSED_MERMAID = /```(mermaid|flow)[\s\S]*$/.test(newVal) && !/```(mermaid|flow)[\s\S]*```/.test(newVal)
		if (!HAS_UNCLOSED_MERMAID) {
			parseContent()
		}
	}
})

onMounted(async () => {
	await parseContent()
	await parseReasoning()
	// 获取对话主题
	try {
		const CHAT_THEME_DATA = await Dexie.configs.get("chatTheme")
		chatTheme.value = CHAT_THEME_DATA ? CHAT_THEME_DATA.value : "card"
	} catch (error) {
		Logger.error(`[${name}] 对话主题获取失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Role.AssistantMessageCard.toast.getChatThemeError")}`)
	}
})
</script>

<template>
	<RightClickMenu ref="menu"/>
	<div
		:class="['assistant-message-card', currentMessageId === message.id ? 'current' : '', chatTheme]"
		@contextmenu.prevent="onRightClick($event, message)">
		<FoldingPanel class="reasoning-content" v-if="message.message.reasoning" :is="isReasoningExpanded">
			<template #Title>
				<span>{{ reasoning }}</span>
			</template>
			<template #Content>
				<MarkdownBlockRenderer :html="reasoningHtml"/>
			</template>
		</FoldingPanel>
		<div class="message-content">
			<component
				v-for="(block, index) in parsedBlocks"
				:key="index"
				v-if="!editingContent.show"
				:is="block.component"
				v-bind="block.props"/>
			<textarea
				v-else
				spellcheck="false"
				v-model="editingContent.value"
				class="content-input"
				ref="textarea"
				@input="adjustTextareaHeight"></textarea>
		</div>
		<div class="message-bottom">
			<div class="functional-controls" v-if="controls">
				<template v-if="editingContent.show">
					<Button @click="editingContent.show = false">
						{{ t("components.MessageCard.cancel") }}
					</Button>
					<Button @click="saveContent">{{ t("components.MessageCard.save") }}</Button>
				</template>
				<template v-if="!editingContent.show">
					<Button @click="editInput">{{ t("components.MessageCard.editMessage") }}</Button>
					<Button @click="remove">{{ t("components.MessageCard.removeMessage") }}</Button>
				</template>
			</div>
			<div v-if="!controls"></div>
			<div class="message-info">
				<div>
					{{
						message.status === "error" ? t("components.MessageCard.error") : message.status === "loading" ? t("components.MessageCard.loading") : t("components.MessageCard.done")
					}}
					-
					[{{ message.model.platform }}]
					-
					[{{ message.model.model }}]
					-
					{{ formatTimestamp(message.timestamp) }}
				</div>
				<div>{{ message.id }} - {{ tokens(message.message.content) }} tokens</div>
			</div>
		</div>
		<img :src="modelImages()" :alt="message.model.platform" class="model-logo">
	</div>
</template>

<style scoped lang="less">
@media screen and (max-width: 768px) {
	.message-info {
		display: none;
	}
}

.current {
	border: 1px solid red !important;
	transition: border 0.3s ease-in-out;
}

.chatBubble {
	max-width: 60%;
	align-self: flex-start;
}

.assistant-message-card {
	position: relative;
	padding: 16px 20px;
	border-radius: 12px;
	border: 1px solid transparent;
	background-color: var(--chat-assistant-background-color);
	color: var(--chat-assistant-text-color);

	.model-logo {
		position: absolute;
		top: -21px;
		left: -21px;
		width: 42px;
		height: 42px;
		z-index: 1;
		user-select: none;
		pointer-events: none;
	}

	.reasoning-content, .message-content {
		font-size: 16px;
		line-height: 1.5;
		word-wrap: break-word;
		overflow-wrap: break-word;
		white-space: pre-wrap;
	}

	.content-input {
		padding: 8px 12px;
		box-sizing: border-box;
		width: 100%;
		border: 1px solid var(--border-color);
		border-radius: 4px;
		background: var(--background-color);
		color: var(--text-color);
		font-size: 18px;

		&:focus {
			outline: none;
		}
	}

	.message-bottom {
		margin-top: 8px;
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		white-space: pre-wrap;
		word-break: break-word;
	}

	&:hover .functional-controls {
		opacity: 1;
	}

	.functional-controls {
		opacity: 0;
		display: flex;
		gap: 10px;
		transition: opacity 0.3s ease-in-out;
	}

	.message-info {
		font-size: 12px;
		color: var(--chat-dialogue-time-text-color);
	}
}
</style>