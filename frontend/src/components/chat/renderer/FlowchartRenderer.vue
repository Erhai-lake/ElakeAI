<script setup>
import {onMounted, ref, watch} from "vue"
import {initZoom} from "@/components/chat/renderer/ZoomManager"
import {ExportList} from "@/components/chat/renderer/ExportHelper"
import Tabs from "@/components/Tabs.vue"
import TabsTab from "@/components/TabsTab.vue"
import CodeBlockRenderer from "@/components/chat/renderer/CodeBlockRenderer.vue"
import Button from "@/components/input/Button.vue"
import Selector from "@/components/input/Selector.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import SVGIcon from "@/components/SVGIcon.vue"
import Logger from "@/services/Logger"

const name = "FlowchartRenderer"

const props = defineProps({
	/**
	 * Flowchart代码
	 */
	code: {
		type: String,
		required: true
	}
})

/**
 * 活动标签页
 */
const activeTab = ref("preview")

/**
 * 导出列表
 */
const exportList = ref(ExportList())

/**
 * 导出选择器
 */
const selector = ref({item: "export", title: "i18n:components.FlowchartRenderer.export"})

/**
 * 容器引用
 */
const containerRef = ref(null)

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
 * 渲染Flowchart
 */
const renderFlowchart = async () => {
	try {
		const FLOWCHART = (await import("flowchart.js")).default
		const ID = "flowchart-" + Math.random().toString(36).slice(2, 11)
		const CONTAINER = containerRef.value
		const WRAPPER = document.createElement("div")
		WRAPPER.innerHTML = `<div id="${ID}"></div>`
		CONTAINER.appendChild(WRAPPER.firstElementChild)
		const CHART = FLOWCHART.parse(props.code)
		CHART.drawSVG(ID)
		const TARGET = CONTAINER.querySelector(`#${ID}`)
		const SVG_ELEMENT = TARGET.querySelector("svg")
		if (SVG_ELEMENT) {
			SVG_ELEMENT.removeAttribute("width")
			SVG_ELEMENT.removeAttribute("height")
			SVG_ELEMENT.style.width = "100%"
			SVG_ELEMENT.style.display = "block"
			SVG_ELEMENT.style.maxWidth = "none"
			SVG_ELEMENT.style.maxHeight = "none"
			SVG_ELEMENT.style.minWidth = "0"
			SVG_ELEMENT.style.minHeight = "0"
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
		initZoom(containerRef.value)
	} catch (error) {
		Logger.error(`[${name}] Flowchart渲染失败`, error)
		showPlaceholderImage()
	}
}

/**
 * 显示占位图
 */
const showPlaceholderImage = () => {
	const CONTAINER = containerRef.value
	CONTAINER.innerHTML = ""
	const WRAPPER = document.createElement("div")
	WRAPPER.className = "uml-wrapper"
	const SVG_CONTENT = `
		<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg" class="uml-image">
			<rect width="100%" height="100%" fill="#f5f5f5"/>
			<text x="50%" y="45%" text-anchor="middle" dy="0.3em" fill="#999" font-family="Arial, sans-serif">
				${t("components.FlowchartRenderer.renderError")}
			</text>
			<text x="50%" y="65%" text-anchor="middle" dy="0.3em" fill="#ccc" font-family="Arial, sans-serif" font-size="12">
				${t("components.FlowchartRenderer.solution")}
			</text>
		</svg>
	`
	// 将SVG转换为Data URL
	const SVG_BLOB = new Blob([SVG_CONTENT], { type: "image/svg+xml" })
	const DATA_URL = URL.createObjectURL(SVG_BLOB)
	WRAPPER.innerHTML = `<img src="${DATA_URL}" alt="Flowchart" class="uml-image" draggable="false"/>`
	CONTAINER.appendChild(WRAPPER)
	const IMG = WRAPPER.querySelector("img")
	if (!IMG) return
	// 图片加载后清理URL对象
	IMG.onload = () => {
		const MAX_HEIGHT = 400
		const MIN_HEIGHT = 170
		IMG.style.maxHeight = `${MAX_HEIGHT}px`
		if (IMG.clientHeight < MIN_HEIGHT) {
			IMG.style.height = `${MIN_HEIGHT}px`
		}
		initZoom(WRAPPER.parentElement)
		// 清理URL对象，避免内存泄漏
		URL.revokeObjectURL(DATA_URL)
	}
	// 如果图片加载失败也清理URL
	IMG.onerror = () => {
		URL.revokeObjectURL(DATA_URL)
	}
}

/**
 * 导出为指定类型
 * @param item 导出类型
 */
const updateSelected = async (item) => {
	const SVG_ELEMENT = containerRef.value?.querySelector("svg:not(.icon)")
	if (!SVG_ELEMENT) return
	item.action(SVG_ELEMENT)
}

/**
 * 监听活动标签页变化
 */
watch(activeTab, (newVal) => {
	if (newVal === "preview") {
		renderFlowchart()
	}
})

onMounted(() => {
	renderFlowchart()
})
</script>

<template>
	<div class="flowchart-renderer">
		<Tabs v-model="activeTab">
			<TabsTab name="preview">
				<template #label>{{ t("components.FlowchartRenderer.preview") }}</template>
				<div ref="containerRef">
					<div class="toolbar">
						<!--第一排-->
						<div></div>
						<Button class="toolbar-btn move-up">
							<SVGIcon name="#icon-upArrow" size="2em"/>
						</Button>
						<Button class="toolbar-btn zoom-in">
							<SVGIcon name="#icon-zoomIn" size="2em"/>
						</Button>
						<!--第二排-->
						<Button class="toolbar-btn move-left">
							<SVGIcon name="#icon-leftArrow" size="2em"/>
						</Button>
						<Button class="toolbar-btn zoom-reset">
							<SVGIcon name="#icon-reset" size="2em"/>
						</Button>
						<Button class="toolbar-btn move-right">
							<SVGIcon name="#icon-rightArrow" size="2em"/>
						</Button>
						<!--第三排-->
						<div></div>
						<Button class="toolbar-btn move-down">
							<SVGIcon name="#icon-downArrow" size="2em"/>
						</Button>
						<Button class="toolbar-btn zoom-out">
							<SVGIcon name="#icon-zoomOut" size="2em"/>
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
				<template #label>{{ t("components.FlowchartRenderer.preview") }}</template>
				<CodeBlockRenderer :code="code" language="flowchart"/>
			</TabsTab>
		</Tabs>
	</div>
</template>

<style>
.uml-image {
	display: block;
	width: 100%;
	object-fit: contain;
	max-height: 600px;
	min-height: 170px;
	user-select: none;
	pointer-events: auto;
	-webkit-user-drag: none;
}
</style>

<style scoped lang="less">
.flowchart-renderer {
	position: relative;
	margin: 10px 0;
	background: var(--background-color);
	border-radius: 6px;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	overflow: auto;

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
}
</style>