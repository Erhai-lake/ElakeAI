<script setup>
import {onMounted, ref} from "vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import InputNumber from "@/components/input/InputNumber.vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import {publicRegistry} from "@/services/plugin/api/PublicClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "GlobalChatConfigs"

/**
 * 全局聊天配置
 */
const defaultConfigs = ref({
	temperature: 1,
	frequency_penalty: 0,
	top_p: 1,
	max_tokens: 2048,
	presence_penalty: 0
})

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
 * 加载聊天配置
 */
const loadChatConfig = async () => {
	try {
		const CHAT_DATA = await Dexie.configs.get("chatConfigs")
		if (CHAT_DATA && CHAT_DATA.value) {
			defaultConfigs.value = CHAT_DATA.value
		}
	} catch (error) {
		Logger.error(`[${name}] 获取全局聊天配置失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.GlobalChatConfigs.toast.getError")}`)
	}
}

/**
 * 保存聊天配置
 */
const save = publicRegistry.debounce(async () => {
	try {
		await Dexie.configs.put({
			item: "chatConfigs",
			value: JSON.parse(JSON.stringify(defaultConfigs.value))
		})
		toastRegistry.success(`[${name}] ${t("components.Options.GlobalChatConfigs.toast.saveSuccess")}`)
	} catch (error) {
		Logger.error(`[${name}] 保存全局聊天配置失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.GlobalChatConfigs.toast.saveError")}`)
	}
}, 500)

onMounted(() => {
	loadChatConfig()
})
</script>

<template>
	<div class="item">
		<p>{{ t("components.Options.GlobalChatConfigs.temperature") }} [<em>temperature</em>]</p>
		<InputNumber
			class="input"
			v-model="defaultConfigs.temperature"
			mode="slider"
			:min="0.1"
			:max="2"
			:step="0.1"
			@change="save"/>
	</div>
	<div class="item">
		<p>{{ t("components.Options.GlobalChatConfigs.top_p") }} [<em>top_p</em>]</p>
		<InputNumber class="input" v-model="defaultConfigs.top_p" mode="slider" :min="0.1" :max="1" :step="0.1"/>
	</div>
	<div class="item">
		<p>{{ t("components.Options.GlobalChatConfigs.max_tokens") }} [<em>max_tokens</em>]</p>
		<InputNumber class="input" v-model="defaultConfigs.max_tokens" :min="1" :max="4096"/>
	</div>
	<div class="item">
		<p>{{ t("components.Options.GlobalChatConfigs.presence_penalty") }} [<em>presence_penalty</em>]</p>
		<InputNumber
			class="input"
			v-model="defaultConfigs.presence_penalty"
			mode="slider"
			:min="-2"
			:max="2"
			:step="0.1"/>
	</div>
	<div class="item">
		<p>{{ t("components.Options.GlobalChatConfigs.frequency_penalty") }} [<em>frequency_penalty</em>]</p>
		<InputNumber
			class="input"
			v-model="defaultConfigs.frequency_penalty"
			mode="slider"
			:min="-2"
			:max="2"
			:step="0.1"/>
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

.input {
	width: 196px;
}
</style>