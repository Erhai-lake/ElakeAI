<script>
import ChatAIKey from "@/components/options/ChatsAIKey.vue"
import DefaultChatSettings from "@/components/options/DefaultChatSettings.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import ChatBatchSize from "@/components/options/ChatBatchSize.vue"
import GlobalChatSettings from "@/components/options/GlobalChatSettings.vue"
import SystemPrompt from "@/components/options/SystemPrompt.vue"

export default {
	name: "ChatsView",
	components: {SystemPrompt, GlobalChatSettings, ChatBatchSize, DefaultChatSettings, ChatAIKey},
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
	<div class="container">
		<ChatAIKey/>
		<div class="item">
			{{ t("views.OptionsView.ChatsView.defaultChat") }}
			<DefaultChatSettings/>
		</div>
		<div class="item">
			{{ t("views.OptionsView.ChatsView.chatBatchSize") }}
			<ChatBatchSize/>
		</div>
	</div>
	<div class="container">
		<div class="item">
			{{ t("views.OptionsView.ChatsView.systemPrompt") }}
			<SystemPrompt/>
		</div>
		<GlobalChatSettings/>
	</div>
</template>
