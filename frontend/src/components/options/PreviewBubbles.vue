<script>
import {toastRegistry} from "@/services/plugin/api/ToastClass";

export default {
	name: "PreviewBubbles",
	inject: ["$DB", "$log"],
	data() {
		return {
			previewBubbles: true
		}
	},
	async created() {
		try {
			const PREVIEW_BUBBLES_DATA = await this.$DB.configs.get("previewBubbles")
			this.previewBubbles = PREVIEW_BUBBLES_DATA ? PREVIEW_BUBBLES_DATA.value : true
		} catch (error) {
			this.$log.error(`[${this.name}] 预览气泡获取失败`, error)
			toastRegistry.error(`[${this.name}] ${this.t("components.Options.PreviewBubbles.toast.getPreviewBubblesError")}`)
		}
	},
	methods: {
		async toggleAllSelection() {
			try {
				// 保存设置
				await this.$DB.configs.put({
					item: "previewBubbles",
					value: !this.previewBubbles
				})
			} catch (error) {
				this.$log.error(`[${this.name}] 预览气泡应用失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.Options.PreviewBubbles.toast.applicationPreviewBubblesError")}`)
			}
		}
	}
}
</script>

<template>
	<label>
		<input type="checkbox"
			   :checked="previewBubbles"
			   @change="toggleAllSelection">
		<span class="custom-checkbox"></span>
	</label>
</template>

<style scoped lang="less">
input[type="checkbox"] {
	display: none;

	&:checked + .custom-checkbox::after {
		opacity: 1;
	}
}

.custom-checkbox {
	display: inline-block;
	width: 20px;
	height: 20px;
	box-sizing: border-box;
	vertical-align: middle;
	border: 2px solid var(--border-color);
	border-radius: 4px;
	position: relative;
	cursor: pointer;

	&::after {
		content: "";
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 10px;
		height: 10px;
		background-color: var(--background-color-anti);
		border-radius: 2px;
		opacity: 0;
	}
}
</style>