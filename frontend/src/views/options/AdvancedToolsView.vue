<script setup>
import Button from "@/components/input/Button.vue"
import HazardousOperations from "@/components/options/HazardousOperations.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import LogLevel from "@/components/options/LogLevel.vue"
import DevToolsSuspensionWindow from "@/components/options/DevToolsSuspensionWindow.vue"

/**
 * 翻译函数
 * @function t
 * @param {string} key - 翻译键值
 * @param {Object} params - 翻译参数
 * @returns {string} - 翻译后的字符串
 */
const t = (key, params = {}) => {
	return i18nRegistry.translate(key, params)
}
</script>

<template>
	<div class="item">
		{{ t("views.OptionsView.AdvancedToolsView.logView") }}
		<router-link to="/options/log">
			<Button>{{ t("views.OptionsView.AdvancedToolsView.logView") }}</Button>
		</router-link>
	</div>
	<div class="item">
		{{ t("views.OptionsView.AdvancedToolsView.logLevel") }}
		<LogLevel/>
	</div>
	<div class="item">
		{{ t("views.OptionsView.AdvancedToolsView.devTools") }}
		<DevToolsSuspensionWindow/>
	</div>
	<div class="item">
		{{ t("views.OptionsView.AdvancedToolsView.hazardousOperations") }}
		<HazardousOperations/>
	</div>
</template>

<style scoped lang="less">
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
