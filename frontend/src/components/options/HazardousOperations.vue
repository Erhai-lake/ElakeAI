<script>
import Button from "@/components/input/Button.vue"
import EventBus from "@/services/EventBus"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"

export default {
	name: "HazardousOperations",
	inject: ["$DB", "$log"],
	components: {Button},
	data() {
		return {
			name: "HazardousOperations"
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
		 * 清除所有聊天记录
		 */
		async clearChat() {
			if (!confirm(this.t("components.HazardousOperations.confirmOperationTip"))) return
			try {
				await this.$DB.chats.clear()
				toastRegistry.success(`[${this.name}] ${this.t("components.HazardousOperations.toast.operationSuccess")}`)
				EventBus.emit("[update] chatListUpdate")
			} catch (error) {
				this.$log.error(`[${this.name}] 操作失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.HazardousOperations.toast.operationFailed")}`)
			}
		},
		/**
		 * 清除所有API Key
		 */
		async clearApiKey() {
			if (!confirm(this.t("components.HazardousOperations.confirmOperationTip"))) return
			try {
				await this.$DB.apiKeys.clear()
				toastRegistry.success(`[${this.name}] ${this.t("components.HazardousOperations.toast.operationSuccess")}`)
				EventBus.emit("[update] keyPoolUpdate")
			} catch (error) {
				this.$log.error(`[${this.name}] 操作失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.HazardousOperations.toast.operationFailed")}`)
			}
		},
		/**
		 * 清除所有配置项
		 */
		async clearConfigs() {
			if (!confirm(this.t("components.HazardousOperations.confirmOperationTip"))) return
			try {
				await this.$DB.configs.clear()
				toastRegistry.success(`[${this.name}] ${this.t("components.HazardousOperations.toast.operationSuccess")}`)
				EventBus.emit("[function] configInitialization")
			} catch (error) {
				this.$log.error(`[${this.name}] 操作失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.HazardousOperations.toast.operationFailed")}`)
			}
		},
		/**
		 * 清除所有日志
		 */
		async clearLog() {
			if (!confirm(this.t("components.HazardousOperations.confirmOperationTip"))) return
			try {
				await this.$DB.logs.clear()
				toastRegistry.success(`[${this.name}] ${this.t("components.HazardousOperations.toast.operationSuccess")}`)
				EventBus.emit("[update] logUpdate")
			} catch (error) {
				this.$log.error(`[${this.name}] 操作失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.HazardousOperations.toast.operationFailed")}`)
			}
		}
	}
}
</script>

<template>
	<div class="hazardous-operation">
		<Button @click="clearChat">{{ t("components.HazardousOperations.clearChat") }}</Button>
		<Button @click="clearApiKey">{{ t("components.HazardousOperations.clearApiKey") }}</Button>
		<Button @click="clearConfigs">{{ t("components.HazardousOperations.clearConfig") }}</Button>
		<Button @click="clearLog">{{ t("components.HazardousOperations.clearLog") }}</Button>
	</div>
</template>

<style scoped lang="less">
.hazardous-operation {
	display: flex;
	gap: 10px;
}
</style>