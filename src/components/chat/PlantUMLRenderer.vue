<script>
import { initZoom  } from "@/services/ZoomManager"

export default {
	name: "PlantUMLRenderer",
	props: {
		code: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			error: null
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
				IMG.onload = () => {
					const minHeight = 138
					IMG.style.maxHeight = "400px"
					if (IMG.clientHeight < minHeight) {
						IMG.style.height = `${minHeight}px`
					}
					initZoom(this.$refs.containerRef)
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
	<div ref="containerRef" class="plantuml-renderer">
		<div class="toolbar">
			<!--第一排-->
			<div></div>
			<button class="toolbar-btn move-up">
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-upArrow"></use>
				</svg>
			</button>
			<button class="toolbar-btn zoom-in">
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-zoomIn"></use>
				</svg>
			</button>
			<!--第二排-->
			<button class="toolbar-btn move-left">
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-leftArrow"></use>
				</svg>
			</button>
			<button class="toolbar-btn zoom-reset">
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-reset"></use>
				</svg>
			</button>
			<button class="toolbar-btn move-right">
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-rightArrow"></use>
				</svg>
			</button>
			<!--第三排-->
			<div></div>
			<button class="toolbar-btn move-down">
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-downArrow"></use>
				</svg>
			</button>
			<button class="toolbar-btn zoom-out">
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-zoomOut"></use>
				</svg>
			</button>
		</div>
	</div>
	<div v-if="error" class="plantuml-error">{{ error }}</div>
</template>

<style lang="less">
.plantuml-error {
	color: red;
	font-weight: bold;
	padding: 10px;
}

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

	.toolbar {
		position: absolute;
		bottom: 10px;
		right: 10px;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(3, 1fr);
		grid-gap: 5px;
		z-index: 2;
	}

	.toolbar-btn {
		width: 36px;
		height: 36px;
		background-color: var(--background-color);
		color: var(--text-color);
		border: 1px solid #909399FF;
		border-radius: 8px;
		font-size: 14px;
		cursor: pointer;
		user-select: none;
		display: flex;
		align-items: center;
		justify-content: center;

		&:hover {
			background-color: var(--button-hover-background-color);
		}

		&:active {
			background-color: var(--button-active-background-color);
		}
	}
}
</style>