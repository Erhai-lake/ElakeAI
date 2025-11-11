<script setup>
import {ref, onMounted, watch} from "vue"
import Selector from "@/components/input/Selector.vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "ChatThemesSelect"

/**
 * 对话主题列表
 */
const chatThemes = ref([
	{
		item: "card",
		title: "i18n:components.Options.ChatThemesSelect.card"
	},
	{
		item: "chatBubble",
		title: "i18n:components.Options.ChatThemesSelect.chatBubble"
	}
])

/**
 * 选中的对话主题
 */
const selectedChatThemes = ref(null)

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
 * 更新选择的主题
 * @param chatThemes
 */
const updateSelectedChatThemes = (chatThemes) => {
	selectedChatThemes.value = chatThemes
}

/**
 * 选择主题
 * @param chatTheme
 */
const selectChatTheme = async (chatTheme) => {
	try {
		if (!chatTheme) return
		await Dexie.configs.put({item: "chatTheme", value: chatTheme.item})
	} catch (error) {
		Logger.error(`[${name}] 对话主题应用失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.ChatThemesSelect.toast.applicationChatThemeError")}`)
	}
}

/**
 * 初始化对话主题
 */
const initChatTheme = async () => {
	try {
		const CHAT_THEME_DATA = await Dexie.configs.get("chatTheme")
		const CHAT_THEME = CHAT_THEME_DATA ? CHAT_THEME_DATA.value : "card"
		const foundTheme = chatThemes.value.find(theme => theme.item === CHAT_THEME)
		if (foundTheme) {
			selectedChatThemes.value = {
				item: foundTheme.item,
				title: foundTheme.title
			}
		}
	} catch (error) {
		Logger.error(`[${name}] 对话主题获取失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.ChatThemesSelect.toast.getChatThemeError")}`)
	}
}

/**
 * 监听对话主题变化
 */
watch(selectedChatThemes, (newVal) => {
	if (newVal) {
		selectChatTheme(newVal)
	}
})

onMounted(() => {
	initChatTheme()
})
</script>

<template>
	<div class="chat-themes-select">
		<Selector
			:selectorSelected="selectedChatThemes || {}"
			:selectorList="chatThemes"
			uniqueKey="item"
			@update:selectorSelected="updateSelectedChatThemes"/>
	</div>
</template>

<style scoped lang="less">
.chat-themes-select {
	width: 240px;
}
</style>