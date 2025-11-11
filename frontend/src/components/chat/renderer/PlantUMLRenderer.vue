<script setup>
import {onMounted, ref, watch} from "vue"
import {initZoom} from "@/components/chat/renderer/ZoomManager"
import {ExportList, fetchSvgElementFromUrl} from "@/components/chat/renderer/ExportHelper"
import Tabs from "@/components/Tabs.vue"
import TabsTab from "@/components/TabsTab.vue"
import CodeBlockRenderer from "@/components/chat/renderer/CodeBlockRenderer.vue"
import Button from "@/components/input/Button.vue"
import Selector from "@/components/input/Selector.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import SVGIcon from "@/components/SVGIcon.vue"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "PlantUMLRenderer"

const props = defineProps({
	/**
	 * PlantUML代码
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
 * PlantUML渲染URL
 */
const url = ref("")

/**
 * PlantUML渲染错误
 */
const error = ref(null)

/**
 * 导出列表
 */
const exportList = ref(ExportList())

/**
 * 导出选择器
 */
const selector = ref({item: "export", title: "i18n:components.PlantUMLRenderer.export"})

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
 * 渲染PlantUML
 */
const renderPlantUML = async () => {
	let plantumlUrl
	try {
		// 读取PlantUML的URL配置
		plantumlUrl = (await Dexie.configs.get("plantumlUrl")).value || "https://www.plantuml.com/plantuml/svg/{{encoded}}"
	} catch (error) {
		Logger.error(`[${name}] PlantUML URL获取失败`, error)
		plantumlUrl = "https://www.plantuml.com/plantuml/svg/{{encoded}}"
	}
	try {
		const PLANTUML_ENCODER = (await import("plantuml-encoder")).default
		const ENCODED = PLANTUML_ENCODER.encode(props.code)
		url.value = plantumlUrl.replace("{{encoded}}", ENCODED)
		const CONTAINER = containerRef.value
		const WRAPPER = document.createElement("div")
		WRAPPER.className = "uml-wrapper"
		WRAPPER.innerHTML = `<img src="${url.value}" alt="PlantUML" class="uml-image" draggable="false"/>`
		CONTAINER.appendChild(WRAPPER)
		const IMG = WRAPPER.querySelector("img")
		IMG.onload = async () => {
			const MAX_HEIGHT = 400
			const MIN_HEIGHT = 170
			IMG.style.maxHeight = `${MAX_HEIGHT}px`
			if (IMG.clientHeight < MIN_HEIGHT) {
				IMG.style.height = `${MIN_HEIGHT}px`
			}
			initZoom(CONTAINER)
		}
	} catch (error) {
		Logger.error(`[${name}] PlantUML渲染失败`, error)
		error.value = error.message
	}
}

/**
 * 导出为指定类型
 * @param item 导出类型
 */
const updateSelected = async (item) => {
	const SVG_ELEMENT = await fetchSvgElementFromUrl(url.value)
	if (!SVG_ELEMENT) return
	item.action(SVG_ELEMENT)
}

/**
 * 监听活动标签页变化
 */
watch(activeTab, (newVal) => {
	if (newVal === "preview") {
		renderPlantUML()
	}
})

onMounted(() => {
	renderPlantUML()
})
</script>

<template>
	<div class="plantuml-renderer">
		<Tabs v-model="activeTab">
			<TabsTab name="preview">
				<template #label>{{ t("components.PlantUMLRenderer.preview") }}</template>
				<div ref="containerRef">
					<div v-if="error" class="plantuml-error">
						{{ t("components.PlantUMLRenderer.renderError") }}
						<br>
						{{ error }}
					</div>
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
				<template #label>{{ t("components.PlantUMLRenderer.code") }}</template>
				<CodeBlockRenderer :code="code" language="plantuml"/>
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
.plantuml-renderer {
	position: relative;
	padding: 0;
	margin: 10px 0;
	background: var(--background-color);
	border-radius: 6px;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	overflow: auto;
	min-height: 138px;

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

	.plantuml-error {
		color: red;
		font-weight: bold;
		padding: 10px;
	}
}
</style>