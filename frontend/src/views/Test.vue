<script setup>
import {ref} from "vue"
import Button from "@/components/input/Button.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"

const name = "ImportExportView"

const type = ref("export")

/**
 * 翻译
 * @param key {String} - 键
 * @param {Object} [params] - 插值参数, 例如 { name: "洱海" }
 * @returns {String} - 翻译后的文本
 */
const t = (key, params = {}) => {
	return i18nRegistry.translate(key, params)
}
</script>

<template>
	<div class="import_export">
		<div class="item">
			{{ t(`views.OptionsView.ImportExportView.${type}`) }}
			<Button @click="handleImport">{{ t(`views.OptionsView.ImportExportView.${type.value}`) }}</Button>
			<input type="file" ref="fileInput" @change="handleFileChange" style="display: none;" accept=".json"/>
		</div>
	</div>
</template>

<style scoped lang="less">
.import_export {
	padding: 20px;
}

.item {
	padding: 10px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	border-bottom: 1px solid var(--border-color);
	border-top: 1px solid var(--border-color);
	white-space: nowrap;
}
</style>