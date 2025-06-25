<script>
import {initZoom} from "@/components/chat/renderer/ZoomManager"
import {fetchSvgElementFromUrl, initSaveButtons} from "@/components/chat/renderer/ExportHelper"
import Tabs from "@/components/Tabs.vue"
import TabsTab from "@/components/TabsTab.vue"
import CodeBlockRenderer from "@/components/chat/renderer/CodeBlockRenderer.vue"
import Button from "@/components/Button.vue"

export default {
	name: "PlantUMLRenderer",
	components: {Button, CodeBlockRenderer, TabsTab, Tabs},
	props: {
		code: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			activeTab: "preview",
			error: null
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
		async renderPlantUML() {
			try {
				const PLANTUML_ENCODER = (await import("plantuml-encoder")).default
				const ENCODED = PLANTUML_ENCODER.encode(this.code)
				const URL = `https://www.plantuml.com/plantuml/svg/${ENCODED}`
				const CONTAINER = this.$refs.containerRef
				const WRAPPER = document.createElement("div")
				WRAPPER.className = "uml-wrapper"
				WRAPPER.innerHTML = `<img src="${URL}" alt="${URL}" class="uml-image" draggable="false"/>`
				CONTAINER.appendChild(WRAPPER)
				const IMG = WRAPPER.querySelector("img")
				IMG.onload = async () => {
					const minHeight = 138
					IMG.style.maxHeight = "400px"
					if (IMG.clientHeight < minHeight) {
						IMG.style.height = `${minHeight}px`
					}
					initZoom(this.$refs.containerRef)
					const SVG_ELEMENT = await fetchSvgElementFromUrl(URL)
					if (SVG_ELEMENT) initSaveButtons(CONTAINER, SVG_ELEMENT)
				}
			} catch (error) {
				this.$log.error(`[${this.name}] PlantUML渲染失败`, error)
				this.error = error.message
			}
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
					<div class="toolbar-export">
						<Button class="save-png">导出PNG</Button>
						<Button class="save-svg">导出SVG</Button>
					</div>
				</div>
			</TabsTab>
			<TabsTab name="code">
				<template #label>{{ $t("components.PlantUMLRenderer.code") }}</template>
				<CodeBlockRenderer :code="code"/>
			</TabsTab>
		</Tabs>
	</div>
</template>

<style lang="less">
.plantuml-renderer {
	position: relative;
	padding: 0;
	margin: 10px 0;
	background: var(--background-color);
	border-radius: 6px;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	overflow: auto;
	min-height: 138px;

	.uml-image {
		display: block;
		width: 100%;
		object-fit: contain;
		max-height: 600px;
		min-height: 138px;
		user-select: none;
		pointer-events: auto;
		-webkit-user-drag: none;
	}

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

	.toolbar-export{
		position: absolute;
		top: 47px;
		right: 10px;
		display: flex;
		gap: 5px;
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