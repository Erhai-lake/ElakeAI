<script>
import {initZoom} from "@/components/chat/renderer/ZoomManager"
import {ExportList} from "@/components/chat/renderer/ExportHelper"
import Tabs from "@/components/Tabs.vue"
import TabsTab from "@/components/TabsTab.vue"
import CodeBlockRenderer from "@/components/chat/renderer/CodeBlockRenderer.vue"
import Button from "@/components/Button.vue"
import Selector from "@/components/Selector.vue"

export default {
	name: "FlowchartRenderer",
	components: {Selector, Button, CodeBlockRenderer, TabsTab, Tabs},
	props: {
		code: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			name: "FlowchartRenderer",
			activeTab: "preview",
			error: null,
			exportList: ExportList(),
			selector: {item: "export", title: "i18n:components.MermaidRenderer.export"}
		}
	},
	watch: {
		activeTab(newVal) {
			if (newVal === "preview") {
				this.renderFlowchartw()
			}
		}
	},
	mounted() {
		this.renderFlowchartw()
	},
	methods: {
		/**
		 * 渲染Flowchart
		 */
		async renderFlowchartw() {
			try {
				const FLOWCHART = (await import("flowchart.js")).default
				const ID = "flowchart-" + Math.random().toString(36).slice(2, 11)
				const CONTAINER = this.$refs.containerRef
				const WRAPPER = document.createElement("div")
				WRAPPER.innerHTML = `<div id="${ID}"></div>`
				CONTAINER.appendChild(WRAPPER.firstElementChild)
				const CHART = FLOWCHART.parse(this.code)
				CHART.drawSVG(ID)
				const TARGET = CONTAINER.querySelector(`#${ID}`)
				const SVG_ELEMENT = TARGET.querySelector("svg")
				if (SVG_ELEMENT) {
					SVG_ELEMENT.removeAttribute("width")
					SVG_ELEMENT.removeAttribute("height")
					SVG_ELEMENT.style.width = "100%"
					SVG_ELEMENT.style.display = "block"
					const BBOX = SVG_ELEMENT.getBBox()
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
				initZoom(this.$refs.containerRef)
			} catch (error) {
				this.$log.error(`[${this.name}] Flowchart渲染失败`, error)
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
	<div class="flowchart-renderer">
		<Tabs v-model="activeTab">
			<TabsTab name="preview">
				<template #label>{{ $t("components.FlowchartRenderer.preview") }}</template>
				<div ref="containerRef">
					<div v-if="error" class="flowchart-error">
						{{ $t("components.FlowchartRenderer.renderError") }}
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
				<template #label>{{ $t("components.FlowchartRenderer.preview") }}</template>
				<CodeBlockRenderer :code="code" language="flowchart"/>
			</TabsTab>
		</Tabs>
	</div>
</template>

<style scoped lang="less">
.flowchart-renderer {
	position: relative;
	margin: 10px 0;
	background: var(--background-color);
	border-radius: 6px;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	overflow: auto;

	.icon {
		width: 2em;
		height: 2em;
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

	.flowchart-error {
		color: red;
		font-weight: bold;
		padding: 8px;
	}
}
</style>