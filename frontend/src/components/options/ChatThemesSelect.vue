<script>
import Selector from "@/components/input/Selector.vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"

export default {
	name: "ChatThemesSelect",
	inject: ["$DB", "$log"],
	components: {Selector},
	data() {
		return {
			name: "ChatThemesSelect",
			chatThemes: [
				{
					item: "card",
					title: "i18n:components.Options.ChatThemesSelect.card"
				},
				{
					item: "chatBubble",
					title: "i18n:components.Options.ChatThemesSelect.chatBubble"
				}
			],
			selectedChatThemes: null
		}
	},
	watch: {
		// 监听主题变化
		selectedChatThemes(newVal) {
			this.selectChatTheme(newVal)
		}
	},
	async created() {
		// 获取主题
		try {
			const CHAT_THEME_DATA = await this.$DB.configs.get("chatTheme")
			const CHAT_THEME = CHAT_THEME_DATA ? CHAT_THEME_DATA.value : "card"
			this.selectedChatThemes = {
				item: CHAT_THEME,
				title: this.chatThemes.find(theme => theme.item === CHAT_THEME).title
			}
		} catch (error) {
			this.$log.error(`[${this.name}] 对话主题获取失败`, error)
			toastRegistry.error(`[${this.name}] ${this.t("components.Options.ChatThemesSelect.toast.getChatThemeError")}`)
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
		 * 更新选择的主题
		 * @param chatThemes
		 */
		updateSelectedChatThemes(chatThemes) {
			this.selectedChatThemes = chatThemes
		},
		/**
		 * 选择主题
		 * @param chatTheme
		 */
		async selectChatTheme(chatTheme) {
			try {
				if (!chatTheme) return
				await this.$DB.configs.put({item: "chatTheme", value: chatTheme.item})
			} catch (error) {
				this.$log.error(`[${this.name}] 对话主题应用失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.Options.ChatThemesSelect.toast.applicationChatThemeError")}`)
			}
		}
	}
}
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