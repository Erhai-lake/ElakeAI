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
import ModelList from "@/assets/data/ModelList.json"
import EventBus from "@/services/EventBus"
import FoldingPanel from "@/components/FoldingPanel.vue"

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
			isReasoningExpanded: false
		}
	},
	watch: {
		"message.message.reasoning"(newVal, oldVal) {
			if (newVal && newVal !== oldVal) {
				this.isReasoningExpanded = true
				this.parseReasoning()
			}
		},
		"message.message.content"(newVal, oldVal) {
			if (newVal !== oldVal) {
				this.isReasoningExpanded = false
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
		 * 移除消息
		 * @param {string} id 消息ID
		 */
		remove(id) {
			EventBus.emit("[function] removeMessage", id)
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
		 * @param model {String} - 模型
		 * @returns {String} - 模型图片
		 */
		modelImages(model) {
			if (!model) return null
			return ModelList.find(modelItem => modelItem.title === model)?.images || ""
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
		}
	}
}
</script>

<template>
	<div class="assistant-message-card">
		<FoldingPanel class="reasoning-content" v-if="message.message.reasoning" :is="isReasoningExpanded">
			<template #Title>
				<span>{{ $t("components.AssistantMessageCard.reasoning") }}</span>
			</template>
			<template #Content>
				<MarkdownBlockRenderer :html="reasoningHtml"/>
			</template>
		</FoldingPanel>
		<div class="message-content">
			<component
				v-for="(block, index) in parsedBlocks"
				:key="index"
				:is="block.component"
				v-bind="block.props"/>
		</div>
		<div class="message-bottom">
			<div class="functional-controls">
				<Button @click="remove(message.id)">移除</Button>
			</div>
			<div class="message-info">
				<div>
					[{{ message.model.largeModel }}]
					-
					[{{ message.model.model }}]
					-
					{{ formatTimestamp(message.timestamp) }}
				</div>
				<div>{{ message.id }}</div>
			</div>
		</div>
		<img :src="modelImages(message.model.largeModel)" :alt="message.model.largeModel" class="model-logo">
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
	}

	.message-info {
		font-size: 12px;
		color: var(--chat-dialogue-time-text-color);
	}
}
</style>