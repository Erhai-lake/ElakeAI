<script>
import SVGIcon from "@/components/SVGIcon.vue"

export default {
	name: "FoldingPanel",
	components: {SVGIcon},
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
	watch: {
		Height(newVal) {
			this.contentHeight = newVal
		},
		is(newVal) {
			this.isExpand = newVal
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
	<div class="folding-panel">
		<div class="folding-panel-title" @click="toggleFolding">
			<div class="left">
				<slot name="Title">
					使用 &lt;template #Title&gt;&lt;/template&gt;插入标题
				</slot>
			</div>
			<div></div>
			<div class="arrow" :class="{ expanded: isExpand }">
				<SVGIcon name="#icon-downArrow"/>
			</div>
		</div>
		<div class="folding-panel-content" :style="{ height: isExpand ? contentHeight + 'px' : '0px' }">
			<template v-if="isExpand">
				<slot name="Content">
					使用 &lt;template #Content&gt;&lt;/template&gt;插入内容
				</slot>
			</template>
		</div>
	</div>
</template>

<style scoped lang="less">
.folding-panel {
	--bg-color: #b3b3b33f;
	margin: 5px 0;
	width: 100%;
	overflow: hidden;
	border-radius: 10px;
	user-select: none;

	.folding-panel-title {
		padding: 0 20px;
		height: 60px;
		background-color: var(--bg-color);
		cursor: pointer;
		display: grid;
		grid-template-columns: 2fr 1fr 16px;

		div {
			display: flex;
			align-items: center;
		}

		.arrow {
			transition: transform 0.2s;

			&.expanded {
				transform: rotate(180deg);
			}
		}
	}

	.folding-panel-content {
		padding: 0 20px;
		height: 0;
		background-color: var(--bg-color);
		transition: height 0.2s;
		overflow-y: auto;
	}
}
</style>
