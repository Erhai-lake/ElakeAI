<script>
import {initZoom} from "@/components/chat/renderer/ZoomManager"
import {ExportList} from "@/components/chat/renderer/ExportHelper"
import Tabs from "@/components/Tabs.vue"
import TabsTab from "@/components/TabsTab.vue"
import CodeBlockRenderer from "@/components/chat/renderer/CodeBlockRenderer.vue"
import Button from "@/components/Button.vue"
import Selector from "@/components/Selector.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"

export default {
	name: "MermaidRenderer",
	components: {Selector, Button, CodeBlockRenderer, TabsTab, Tabs},
	inject: ["$DB", "$log"],
	props: {
		code: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			name: "MermaidRenderer",
			activeTab: "preview",
			error: null,
			exportList: ExportList(),
			selector: {item: "export", title: "i18n:components.MermaidRenderer.export"}
		}
	},
	watch: {
		activeTab(newVal) {
			if (newVal === "preview") {
				this.renderMermaid()
			}
		}
	},
	mounted() {
		this.renderMermaid()
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
		 * 渲染Mermaid
		 */
		async renderMermaid() {
			try {
				const MERMAID = (await import("mermaid")).default
				try {
					// 读取主题配置
					const THEME_DATA = (await this.$DB.configs.get("theme")).value
					MERMAID.initialize({
						startOnLoad: true,
						theme: THEME_DATA === "System" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "default") : THEME_DATA === "Dark" ? "dark" : "default"
					})
				} catch (error) {
					this.$log.error(`[${this.name}] Mermaid主题初始化失败`, error)
					MERMAID.initialize({
						startOnLoad: true,
						theme: "default"
					})
				}
				// 阻止这个玩意画炸弹, nnd
				try {
					await MERMAID.parse(this.code)
				} catch (parseError) {
					this.error = parseError.message
					this.$log.error(`[${this.name}] Mermaid语法错误`, parseError)
					return
				}
				const ID = "mermaid-" + Math.random().toString(36).slice(2, 11)
				const {svg} = await MERMAID.render(ID, this.code)
				const CONTAINER = this.$refs.containerRef
				const WRAPPER = document.createElement("div")
				WRAPPER.innerHTML = svg
				CONTAINER.appendChild(WRAPPER.firstElementChild)
				const SVG_ELEMENT = CONTAINER.querySelector("svg:not(.icon)")
				if (SVG_ELEMENT) {
					SVG_ELEMENT.removeAttribute("width")
					SVG_ELEMENT.removeAttribute("height")
					SVG_ELEMENT.style.width = "100%"
					SVG_ELEMENT.style.display = "block"
					// 获取实际内容高度
					const G_ELEMENT = SVG_ELEMENT.querySelector("g")
					if (G_ELEMENT) {
						const BBOX = G_ELEMENT.getBBox()
						const MAX_HEIGHT = 400
						const MIN_HEIGHT = 170
						const SCALE = BBOX.height > MAX_HEIGHT ? MAX_HEIGHT / BBOX.height : 1
						const PADDING = 50
						const WIDTH_WITH_PADDING = BBOX.width + PADDING * 2
						const HEIGHT_WITH_PADDING = BBOX.height + PADDING * 2
						const FINAL_HEIGHT = Math.max(HEIGHT_WITH_PADDING * SCALE, MIN_HEIGHT)
						SVG_ELEMENT.setAttribute("viewBox", `${BBOX.x - PADDING} ${BBOX.y - PADDING} ${WIDTH_WITH_PADDING} ${HEIGHT_WITH_PADDING}`)
						SVG_ELEMENT.style.height = `${FINAL_HEIGHT}px`
					}
				}
				initZoom(this.$refs.containerRef)
			} catch (error) {
				this.$log.error(`[${this.name}] Mermaid渲染失败`, error)
				this.error = error.message
			}
		},
		/**
		 * 导出为指定类型
		 * @param item 导出类型
		 */
		updateSelected(item) {
			const SVG_ELEMENT = this.$refs.containerRef?.querySelector("svg:not(.icon)")
			if (!SVG_ELEMENT) return
			item.action(SVG_ELEMENT)
		}
	}
}
</script>

<template>
	<div class="mermaid-renderer">
		<Tabs v-model="activeTab">
			<TabsTab name="preview">
				<template #label>{{ t("components.MermaidRenderer.preview") }}</template>
				<div ref="containerRef">
					<div v-if="error" class="mermaid-error">
						{{ t("components.MermaidRenderer.renderError") }}
						<br>
						{{ error }}
					</div>
					<div class="toolbar">
						<!--第一排-->
						<div></div>
						<Button class="toolbar-btn move-up">
							<svg class="icon" aria-hidden="true">
								<use xlink:href="#icon-upArrow"></use>
							</svg>
						</Button>
						<Button class="toolbar-btn zoom-in">
							<svg class="icon" aria-hidden="true">
								<use xlink:href="#icon-zoomIn"></use>
							</svg>
						</Button>
						<!--第二排-->
						<Button class="toolbar-btn move-left">
							<svg class="icon" aria-hidden="true">
								<use xlink:href="#icon-leftArrow"></use>
							</svg>
						</Button>
						<Button class="toolbar-btn zoom-reset">
							<svg class="icon" aria-hidden="true">
								<use xlink:href="#icon-reset"></use>
							</svg>
						</Button>
						<Button class="toolbar-btn move-right">
							<svg class="icon" aria-hidden="true">
								<use xlink:href="#icon-rightArrow"></use>
							</svg>
						</Button>
						<!--第三排-->
						<div></div>
						<Button class="toolbar-btn move-down">
							<svg class="icon" aria-hidden="true">
								<use xlink:href="#icon-downArrow"></use>
							</svg>
						</Button>
						<Button class="toolbar-btn zoom-out">
							<svg class="icon" aria-hidden="true">
								<use xlink:href="#icon-zoomOut"></use>
							</svg>
						</Button>
					</div>
					<Selector
						class="toolbar-export"
						:selector-list="exportList"
						:selector-selected="selector"
						unique-key="item"
						@update:selectorSelected="updateSelected"/>
				</div>
			</TabsTab>
			<TabsTab name="code">
				<template #label>{{ t("components.MermaidRenderer.code") }}</template>
				<CodeBlockRenderer :code="code" language="mermaid"/>
			</TabsTab>
		</Tabs>
	</div>
</template>

<style scoped lang="less">
.mermaid-renderer {
	position: relative;
	padding: 0;
	margin: 10px 0;
	background: var(--background-color);
	border-radius: 6px;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	overflow: auto;

	.icon {
		width: 2em;
		height: 2em;
		vertical-align: -0.15em;
		fill: currentColor;
		overflow: hidden;
	}

	&:hover {
		.toolbar, .toolbar-export {
			opacity: 1;
		}
	}

	.toolbar {
		position: absolute;
		bottom: 10px;
		right: 10px;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(3, 1fr);
		grid-gap: 5px;
		opacity: 0;

		.toolbar-btn {
			padding: 0;
			width: 36px;
			height: 36px;
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 1;
		}
	}

	.toolbar-export {
		position: absolute;
		top: 47px;
		right: 10px;
		width: 200px;
		z-index: 1;
		opacity: 0;
	}

	.mermaid-error {
		color: red;
		font-weight: bold;
	}
}
</style>
