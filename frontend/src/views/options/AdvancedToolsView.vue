<script>
import Button from "@/components/Button.vue"
import HazardousOperations from "@/components/options/HazardousOperations.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import EventBus from "@/services/EventBus"

export default {
	name: "AdvancedToolsView",
	inject: ["$DB", "$log"],
	components: {Button, HazardousOperations},
	data() {
		return {
			isDevToolsSuspensionWindow: false
		}
	},
	async created() {
		// 获取悬浮窗设置
		try {
			const DEV_TOOLS_SUSPENSION_WINDOW_DATA = await this.$DB.configs.get("devToolsSuspensionWindow")
			this.isDevToolsSuspensionWindow = DEV_TOOLS_SUSPENSION_WINDOW_DATA ? DEV_TOOLS_SUSPENSION_WINDOW_DATA.value : false
		} catch (error) {
			this.$log.error(`[${this.name}] Dev Tools悬浮窗设置获取失败`, error)
			toastRegistry.error(`[${this.name}] ${this.t("views.OptionsView.AdvancedToolsView.toast.getDevToolsSuspensionWindowError")}`)
		}
	},
	methods: {
		/**
		 * 翻译
		 * @param key {String} - 键
		 * @param {Object} [params] - 插值参数, 例如 { name: "洱海" }
		 * @returns {String} - 翻译后的文本
		 */
		t(key, params = {}) {
			return i18nRegistry.translate(key, params)
		},
		/**
		 * DevTools悬浮窗
		 */
		async devToolsSuspensionWindow() {
			// 保存设置
			try {
				await this.$DB.configs.put({
					item: "devToolsSuspensionWindow",
					value: !this.isDevToolsSuspensionWindow
				})
				EventBus.emit("[update] devToolsSuspensionWindowUpdate")
				this.isDevToolsSuspensionWindow = !this.isDevToolsSuspensionWindow
			} catch (error) {
				this.$log.error(`[${this.name}] 悬浮窗设置保存失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.OptionsView.AdvancedToolsView.toast.saveDevToolsSuspensionWindowError")}`)
			}
		}
	}
}
</script>

<template>
	<div class="item">
		Log View
		<router-link to="/options/log">
			<Button>Open Log View</Button>
		</router-link>
	</div>
	<div class="item">
		DevTools
		<Button @click="devToolsSuspensionWindow">{{ isDevToolsSuspensionWindow }}</Button>
	</div>
	<div class="item">
		{{ t("views.OptionsView.AdvancedToolsView.hazardousOperations") }}
		<HazardousOperations/>
	</div>
</template>
