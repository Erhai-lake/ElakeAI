<script setup>
import {ref, onMounted} from "vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "PreviewBubbles"

/**
 * 预览气泡状态
 */
const previewBubbles = ref(true)

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
 * 切换预览气泡状态
 */
const toggleAllSelection = async () => {
	try {
		// 保存设置
		await Dexie.configs.put({
			item: "previewBubbles",
			value: !previewBubbles.value
		})
		previewBubbles.value = !previewBubbles.value
	} catch (error) {
		Logger.error(`[${name}] 预览气泡应用失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.PreviewBubbles.toast.applicationPreviewBubblesError")}`)
	}
}

/**
 * 初始化预览气泡状态
 */
const initPreviewBubbles = async () => {
	try {
		const PREVIEW_BUBBLES_DATA = await Dexie.configs.get("previewBubbles")
		previewBubbles.value = PREVIEW_BUBBLES_DATA ? PREVIEW_BUBBLES_DATA.value : true
	} catch (error) {
		Logger.error(`[${name}] 预览气泡获取失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.PreviewBubbles.toast.getPreviewBubblesError")}`)
	}
}

onMounted(() => {
	initPreviewBubbles()
})
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