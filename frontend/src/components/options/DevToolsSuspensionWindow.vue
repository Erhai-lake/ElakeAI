<script setup>
import {onMounted, ref} from "vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import EventBus from "@/services/EventBus"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"
import Button from "@/components/input/Button.vue"

const name = "DevToolsSuspensionWindow"

const isDevToolsSuspensionWindow = ref(false)

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
 * DevTools悬浮窗
 */
const devToolsSuspensionWindow = async () => {
	// 保存设置
	try {
		await Dexie.configs.put({
			item: "devToolsSuspensionWindow",
			value: !isDevToolsSuspensionWindow.value
		})
		EventBus.emit("[update] devToolsSuspensionWindowUpdate")
		isDevToolsSuspensionWindow.value = !isDevToolsSuspensionWindow.value
	} catch (error) {
		Logger.error(`[${name}] 悬浮窗设置保存失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.DevToolsSuspensionWindow.toast.saveDevToolsSuspensionWindowError")}`)
	}
}

onMounted(async () => {
	// 获取悬浮窗设置
	try {
		const DEV_TOOLS_SUSPENSION_WINDOW_DATA = await Dexie.configs.get("devToolsSuspensionWindow")
		isDevToolsSuspensionWindow.value = DEV_TOOLS_SUSPENSION_WINDOW_DATA ? DEV_TOOLS_SUSPENSION_WINDOW_DATA.value : false
	} catch (error) {
		Logger.error(`[${name}] Dev Tools悬浮窗设置获取失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.DevToolsSuspensionWindow.toast.getDevToolsSuspensionWindowError")}`)
	}
})
</script>

<template>
	<Button @click="devToolsSuspensionWindow">{{ isDevToolsSuspensionWindow }}</Button>
</template>