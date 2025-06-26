<script>
import {initZoom} from "@/components/chat/renderer/ZoomManager"
import {ExportList, fetchSvgElementFromUrl} from "@/components/chat/renderer/ExportHelper"
import Tabs from "@/components/Tabs.vue"
import TabsTab from "@/components/TabsTab.vue"
import CodeBlockRenderer from "@/components/chat/renderer/CodeBlockRenderer.vue"
import Button from "@/components/Button.vue"
import Selector from "@/components/Selector.vue"

export default {
	name: "PlantUMLRenderer",
	components: {Selector, Button, CodeBlockRenderer, TabsTab, Tabs},
	props: {
		code: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			activeTab: "preview",
			url: "",
			error: null,
			exportList: ExportList(),
			selector: {item: "export", title: "i18n:components.PlantUMLRenderer.export"}
		}
	},
	watch: {
		activeTab(newVal) {
			if (newVal === "preview") {
				this.renderPlantUML()
			}
		}
	},
	mounted() {
		this.renderPlantUML()
	},
	methods: {
		/**
		 * 渲染PlantUML
		 */
		async renderPlantUML() {
			try {
				const PLANTUML_ENCODER = (await import("plantuml-encoder")).default
				const ENCODED = PLANTUML_ENCODER.encode(this.code)
				this.url = `https://www.plantuml.com/plantuml/svg/${ENCODED}`
				const CONTAINER = this.$refs.containerRef
				const WRAPPER = document.createElement("div")
				WRAPPER.className = "uml-wrapper"
				WRAPPER.innerHTML = `<img src="${this.url}" alt="PlantUML" class="uml-image" draggable="false"/>`
				CONTAINER.appendChild(WRAPPER)
				const IMG = WRAPPER.querySelector("img")
				IMG.onload = async () => {
					const MAX_HEIGHT = 400
					const MIN_HEIGHT = 170
					IMG.style.maxHeight = `${MAX_HEIGHT}px`
					if (IMG.clientHeight < MIN_HEIGHT) {
						IMG.style.height = `${MIN_HEIGHT}px`
					}
					initZoom(this.$refs.containerRef)
				}
			} catch (error) {
				this.$log.error(`[${this.name}] PlantUML渲染失败`, error)
				this.error = error.message
			}
		},
		/**
		 * 导出为指定类型
		 * @param item 导出类型
		 */
		async updateSelected(item) {
			const SVG_ELEMENT = await fetchSvgElementFromUrl(this.url)
			if (!SVG_ELEMENT) return
			item.action(SVG_ELEMENT)
		}
	}
}
</script>

<template>
	<div class="plantuml-renderer">
		<Tabs v-model="activeTab">
			<TabsTab name="preview">
				<template #label>{{ $t("components.PlantUMLRenderer.preview") }}</template>
				<div ref="containerRef">
					<div v-if="error" class="plantuml-error">
						{{ $t("components.PlantUMLRenderer.renderError") }}
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
				<template #label>{{ $t("components.PlantUMLRenderer.code") }}</template>
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

	.icon {
		width: 2em;
		height: 2em;
		fill: currentColor;
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

	.plantuml-error {
		color: red;
		font-weight: bold;
		padding: 10px;
	}
}
</style>