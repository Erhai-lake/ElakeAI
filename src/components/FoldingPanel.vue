<script>
export default {
	name: "FoldingPanel",
	props: {
		Height: {
			type: Number,
			default: 300
		},
		is: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			contentHeight: this.Height,
			isExpand: this.is
		}
	},
	methods: {
		/**
		 * 切换折叠状态
		 */
		toggleFolding() {
			this.isExpand = !this.isExpand
		}
	}
}
</script>

<template>
	<div class="FoldingPanel">
		<div class="FoldingPanelTitle" @click="toggleFolding">
			<div class="Left">
				<slot name="Title">
					使用 &lt;template #Title&gt;&lt;/template&gt;插入标题
				</slot>
			</div>
			<div></div>
			<div class="Arrow" :class="{ expanded: isExpand }">
				<svg class="icon" viewBox="0 0 1024 1024"
					 xmlns="http://www.w3.org/2000/svg" width="16" height="16">
					<path
						d="M895.701333 300.117333c0 9.6-3.2 19.285333-9.6 27.392l-340.906666 423.808a43.733333 43.733333 0 0 1-68.096 0L137.984 329.301333A43.690667 43.690667 0 0 1 206.08 274.602667l305.109333 379.605333 306.773334-381.525333a43.690667 43.690667 0 0 1 77.738666 27.434666z"
						fill="#9ca8af"></path>
				</svg>
			</div>
		</div>
		<div class="FoldingPanelContent" :style="{ height: isExpand ? contentHeight + 'px' : '0px' }">
			<slot name="Content">
				使用 &lt;template #Content&gt;&lt;/template&gt;插入内容
			</slot>
		</div>
	</div>
</template>

<style scoped lang="less">
.FoldingPanel {
	margin: 5px 0;
	width: 100%;
	overflow: hidden;
	border-radius: 10px;
	user-select: none;

	.FoldingPanelTitle {
		padding: 0 20px;
		height: 60px;
		background-color: #b3b3b33f;
		cursor: pointer;
		display: grid;
		grid-template-columns: 2fr 1fr 16px;

		div {
			display: flex;
			align-items: center;
		}

		.Arrow {
			transition: transform 0.2s;

			&.expanded {
				transform: rotate(180deg);
			}
		}
	}

	.FoldingPanelContent {
		padding: 0 20px;
		height: 0;
		background-color: #b3b3b33f;
		transition: height 0.2s;
		overflow-y: auto;
	}
}
</style>