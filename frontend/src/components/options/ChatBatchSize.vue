<script setup>
import {ref, onMounted} from "vue"
import InputNumber from "@/components/input/InputNumber.vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {publicRegistry} from "@/services/plugin/api/PublicClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "ChatsView"

/**
 * 聊天批大小
 */
const chatBatchSize = ref(20)

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
 * 聊天批量大小
 * @param value {Number} - 输入值
 */
const saveChatBatchSize = publicRegistry.debounce(async (value) => {
	try {
		const CHAT_BATCH_SIZE = await Dexie.configs.get("chatBatchSize")
		// 检查输入值是否与当前值相同
		if (CHAT_BATCH_SIZE?.value === value) return
		// 检查转换后的值是否为有效的整数且大于 0
		if (isNaN(value) || value <= 0) {
			Logger.error(`[${name}] 输入的聊天批大小无效, 输入值: ${value}`)
			toastRegistry.error(`[${name}] ${t("components.Options.ChatBatchSize.toast.invalidChatBatchSize")}`)
			return
		}
		await Dexie.configs.put({item: "chatBatchSize", value: value})
		toastRegistry.success(`[${name}] ${t("components.Options.ChatBatchSize.toast.chatBatchSizeSuccess")}`)
	} catch (error) {
		Logger.error(`[${name}] 保存聊天批大小失败, 输入值: ${value}`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.ChatBatchSize.toast.chatBatchSizeError")}`)
	}
}, 500)

/**
 * 初始化聊天批大小
 */
const initChatBatchSize = async () => {
	try {
		const CHAT_BATCH_SIZE = await Dexie.configs.get("chatBatchSize")
		chatBatchSize.value = CHAT_BATCH_SIZE?.value || 20
	} catch (error) {
		Logger.error(`[${name}] 读取聊天批大小失败, 使用默认值 20`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.ChatBatchSize.toast.chatBatchSizeError")}`)
		chatBatchSize.value = 20
	}
}

onMounted(() => {
	initChatBatchSize()
})
</script>

<template>
	<InputNumber v-model="chatBatchSize" @input="saveChatBatchSize" :min="1"/>
</template>