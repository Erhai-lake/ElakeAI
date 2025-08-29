<script>
import Button from "@/components/input/Button.vue"
import HazardousOperations from "@/components/options/HazardousOperations.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import LogLevel from "@/components/options/LogLevel.vue"
import DevToolsSuspensionWindow from "@/components/options/DevToolsSuspensionWindow.vue"

export default {
	name: "AdvancedToolsView",
	components: {LogLevel, DevToolsSuspensionWindow, Button, HazardousOperations},
	methods: {
		/**
		 * 翻译
		 * @param key {String} - 键
		 * @param {Object} [params] - 插值参数, 例如 { name: "洱海" }
		 * @returns {String} - 翻译后的文本
		 */
		t(key, params = {}) {
			return i18nRegistry.translate(key, params)
		}
	}
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
