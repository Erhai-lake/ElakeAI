<script setup>
import Button from "@/components/input/Button.vue"
import EventBus from "@/services/EventBus"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "HazardousOperations"

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
 * 清除所有聊天记录
 */
const clearChat = async () => {
	if (!confirm(t("components.Options.HazardousOperations.confirmOperationTip"))) return
	try {
		await Dexie.chats.clear()
		toastRegistry.success(`[${name}] ${t("components.Options.HazardousOperations.toast.operationSuccess")}`)
		EventBus.emit("[update] chatListUpdate")
	} catch (error) {
		Logger.error(`[${name}] 操作失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.HazardousOperations.toast.operationFailed")}`)
	}
}
/**
 * 清除所有面具
 */
const clearMask = async () => {
	if (!confirm(t("components.Options.HazardousOperations.confirmOperationTip"))) return
	try {
		await Dexie.masks.clear()
		toastRegistry.success(`[${name}] ${t("components.Options.HazardousOperations.toast.operationSuccess")}`)
	} catch (error) {
		Logger.error(`[${name}] 操作失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.HazardousOperations.toast.operationFailed")}`)
	}
}

/**
 * 清除所有API Key
 */
const clearApiKey = async () => {
	if (!confirm(t("components.Options.HazardousOperations.confirmOperationTip"))) return
	try {
		await Dexie.apiKeys.clear()
		toastRegistry.success(`[${name}] ${t("components.Options.HazardousOperations.toast.operationSuccess")}`)
		EventBus.emit("[update] keyPoolUpdate")
	} catch (error) {
		Logger.error(`[${name}] 操作失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.HazardousOperations.toast.operationFailed")}`)
	}
}

/**
 * 清除所有配置项
 */
const clearConfigs = async () => {
	if (!confirm(t("components.Options.HazardousOperations.confirmOperationTip"))) return
	try {
		await Dexie.configs.clear()
		toastRegistry.success(`[${name}] ${t("components.Options.HazardousOperations.toast.operationSuccess")}`)
		EventBus.emit("[function] configInitialization")
	} catch (error) {
		Logger.error(`[${name}] 操作失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.HazardousOperations.toast.operationFailed")}`)
	}
}

/**
 * 清除所有日志
 */
const clearLog = async () => {
	if (!confirm(t("components.Options.HazardousOperations.confirmOperationTip"))) return
	try {
		await Dexie.logs.clear()
		toastRegistry.success(`[${name}] ${t("components.Options.HazardousOperations.toast.operationSuccess")}`)
		EventBus.emit("[update] logUpdate")
	} catch (error) {
		Logger.error(`[${name}] 操作失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.HazardousOperations.toast.operationFailed")}`)
	}
}
</script>

<template>
	<div class="hazardous-operation">
		<Button @click="clearChat">{{ t("components.Options.HazardousOperations.clearChat") }}</Button>
		<Button @click="clearMask">{{ t("components.Options.HazardousOperations.clearMask") }}</Button>
		<Button @click="clearApiKey">{{ t("components.Options.HazardousOperations.clearApiKey") }}</Button>
		<Button @click="clearConfigs">{{ t("components.Options.HazardousOperations.clearConfig") }}</Button>
		<Button @click="clearLog">{{ t("components.Options.HazardousOperations.clearLog") }}</Button>
	</div>
</template>

<style scoped lang="less">
.hazardous-operation {
	display: flex;
	gap: 10px;
}
</style>