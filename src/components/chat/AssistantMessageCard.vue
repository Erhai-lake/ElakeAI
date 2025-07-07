<script>
import markdownit from "markdown-it"
import markdownItTaskLists from "markdown-it-task-lists"
import {full as emoji} from "markdown-it-emoji"
import markdownItKatex from "@iktakahiro/markdown-it-katex"
import markdownItMathjax3 from "markdown-it-mathjax3"
import "katex/dist/katex.min.css"
import {imgLazyload} from "@mdit/plugin-img-lazyload"
import Button from "@/components/Button.vue"
import MarkdownBlockRenderer from "@/components/chat/renderer/MarkdownBlockRenderer.vue"
import CodeBlockRenderer from "@/components/chat/renderer/CodeBlockRenderer.vue"
import MermaidRenderer from "@/components/chat/renderer/MermaidRenderer.vue"
import FlowchartRenderer from "@/components/chat/renderer/FlowchartRenderer.vue"
import PlantUMLRenderer from "@/components/chat/renderer/PlantUMLRenderer.vue"
import {platformRegistry} from "@/services/plugin/api/PlatformClass"
import EventBus from "@/services/EventBus"
import FoldingPanel from "@/components/FoldingPanel.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"

export default {
	name: "AssistantMessageCard",
	components: {
		FoldingPanel,
		Button,
		MarkdownBlockRenderer,
		CodeBlockRenderer,
		MermaidRenderer,
		FlowchartRenderer,
		PlantUMLRenderer
	},
	props: {
		message: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			parsedBlocks: [],
			reasoningHtml: "",
			isReasoningExpanded: false,
			reasoning: this.t("components.AssistantMessageCard.reasoning"),
			editingContent: {
				show: false,
				value: ""
			}
		}
	},
	watch: {
		"message.message.reasoning"(newVal, oldVal) {
			if (newVal && newVal !== oldVal) {
				this.isReasoningExpanded = true
				this.reasoning = this.t("components.AssistantMessageCard.thinking")
				this.parseReasoning()
			}
		},
		"message.message.content"(newVal, oldVal) {
			if (newVal !== oldVal) {
				this.isReasoningExpanded = false
				this.reasoning = this.t("components.AssistantMessageCard.reasoning")
				const HAS_UNCLOSED_MERMAID = /```(mermaid|flow)[\s\S]*$/.test(newVal) && !/```(mermaid|flow)[\s\S]*```/.test(newVal)
				if (!HAS_UNCLOSED_MERMAID) {
					this.parseContent()
				}
			}
		}
	},
	mounted() {
		this.parseContent()
		this.parseReasoning()
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
		 * 格式化时间戳
		 * @param {number} timestamp 时间戳
		 * @returns {string} 格式化后的时间字符串
		 */
		formatTimestamp(timestamp) {
			const DATE = new Date(timestamp)
			const YEAR = DATE.getFullYear()
			const MONTH = String(DATE.getMonth() + 1).padStart(2, "0")
			const DAY = String(DATE.getDate()).padStart(2, "0")
			const HOURS = String(DATE.getHours()).padStart(2, "0")
			const MINUTES = String(DATE.getMinutes()).padStart(2, "0")
			const SECONDS = String(DATE.getSeconds()).padStart(2, "0")
			return `${YEAR}-${MONTH}-${DAY} ${HOURS}:${MINUTES}:${SECONDS}`
		},
		/**
		 * 获取模型图片
		 * @param platform {String} - 平台名称
		 * @returns {String} - 平台图片
		 */
		modelImages(platform) {
			if (!platform) return null
			const PLATFORM = platformRegistry.getPlatform(platform)
			return PLATFORM.info.image
		},
		/**
		 * 解析内容
		 */
		parseContent() {
			const MD = markdownit({
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
				const safeLang = TYPE_MAP[LANG] || "code"
				return `<div data-lang="${safeLang}" data-language="${LANG || "plaintext"}" data-code="${encodeURIComponent(CODE)}"></div>`
			}
			const RAW_HTML = MD.render(this.message.message.content)
			const CONTAINER = document.createElement("div")
			CONTAINER.innerHTML = RAW_HTML
			const BLOCKS = []
			for (const NODE of Array.from(CONTAINER.childNodes)) {
				const LANG = NODE.dataset?.lang
				if (NODE.nodeType === 1 && LANG === "code") {
					BLOCKS.push({
						component: "CodeBlockRenderer",
						props: {
							code: decodeURIComponent(NODE.dataset.code),
							language: NODE.dataset.language || "plaintext"
						}
					})
				} else if (NODE.nodeType === 1 && LANG === "mermaid") {
					BLOCKS.push({
						component: "MermaidRenderer",
						props: {
							code: decodeURIComponent(NODE.dataset.code)
						}
					})
				} else if (NODE.nodeType === 1 && (LANG === "flow" || LANG === "flowchart")) {
					BLOCKS.push({
						component: "FlowchartRenderer",
						props: {
							code: decodeURIComponent(NODE.dataset.code)
						}
					})
				} else if (NODE.nodeType === 1 && LANG === "plantuml") {
					BLOCKS.push({
						component: "PlantUMLRenderer",
						props: {
							code: decodeURIComponent(NODE.dataset.code)
						}
					})
				} else if (NODE.nodeType === 1) {
					BLOCKS.push({
						component: "MarkdownBlockRenderer",
						props: {
							html: NODE.outerHTML
						}
					})
				} else if (NODE.nodeType === 3 && NODE.textContent.trim()) {
					BLOCKS.push({
						component: "MarkdownBlockRenderer",
						props: {
							html: NODE.textContent
						}
					})
				}
			}
			this.parsedBlocks = BLOCKS
		},
		/**
		 * 解析推理
		 */
		parseReasoning() {
			if (!this.message.message.reasoning) {
				this.reasoningHtml = ""
				return
			}
			const MD = markdownit({
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
			this.reasoningHtml = MD.render(this.message.message.reasoning)
		},
		/**
		 * 移除消息
		 */
		remove() {
			EventBus.emit("[function] removeMessage", this.message.id)
		},
		/**
		 * 显示输入框
		 */
		editInput() {
			this.editingContent.value = this.message.message.content
			this.editingContent.show = true
			this.$nextTick(() => {
				this.adjustTextareaHeight()
			})
		},
		/**
		 * 保存消息
		 */
		saveContent() {
			this.editingContent.show = false
			if (this.editingContent.value === this.message.message.content) return
			if (this.editingContent.value.trim() === "") return
			EventBus.emit("[function] editMessage", this.message.id, this.editingContent.value)
		},
		/**
		 * 调整 textarea 高度
		 */
		adjustTextareaHeight() {
			const textarea = this.$refs.textarea
			if (textarea) {
				textarea.style.height = "auto"
				// 获取滚动高度
				const scrollHeight = textarea.scrollHeight
				// 设置最大高度为 600px
				textarea.style.height = Math.min(scrollHeight, 600) + "px"
			}
		}
	}
}
</script>

<template>
	<div class="assistant-message-card">
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
			<div class="functional-controls">
				<template v-if="editingContent.show">
					<Button @click="saveContent()">{{ t("components.AssistantMessageCard.save") }}</Button>
					<Button @click="editingContent.show = false">
						{{ t("components.AssistantMessageCard.cancel") }}
					</Button>
				</template>
				<template v-if="!editingContent.show">
					<Button @click="remove()">{{ t("components.AssistantMessageCard.remove") }}</Button>
					<Button @click="editInput()">{{ t("components.AssistantMessageCard.edit") }}</Button>
				</template>
			</div>
			<div class="message-info">
				<div>
					[{{ message.model.platform }}]
					-
					[{{ message.model.model }}]
					-
					{{ formatTimestamp(message.timestamp) }}
				</div>
				<div>{{ message.id }}</div>
			</div>
		</div>
		<img :src="modelImages(message.model.platform)" :alt="message.model.platform" class="model-logo">
	</div>
</template>

<style scoped lang="less">

@media screen and (max-width: 768px) {
	.message-info {
		display: none;
	}
}

.assistant-message-card {
	position: relative;
	padding: 16px 20px;
	border-radius: 12px;

	.assistant & {
		background-color: var(--chat-assistant-background-color);
		color: var(--chat-assistant-text-color);
	}

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
	}

	.message-info {
		font-size: 12px;
		color: var(--chat-dialogue-time-text-color);
	}
}
</style>