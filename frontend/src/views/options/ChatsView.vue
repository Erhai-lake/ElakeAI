<script>
import ChatAIKey from "@/components/options/ChatsAIKey.vue"
import DefaultChatSettings from "@/components/options/DefaultChatSettings.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"

export default {
	name: "ChatsView",
	components: {DefaultChatSettings, ChatAIKey},
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
	<ChatAIKey/>
	<div class="item">
		{{ t("views.ChatsView.defaultChat") }}
		<DefaultChatSettings/>
	</div>
</template>
