<script>
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import AssistantMessageCard from "@/components/chat/role/AssistantMessageCard.vue"
import UserMessageCard from "@/components/chat/role/UserMessageCard.vue"

export default {
	name: "NotFoundView",
	components: {UserMessageCard, AssistantMessageCard},
	data() {
		return {
			data: {
				data: [
					{
						id: crypto.randomUUID(),
						model: {platform: "DeepSeek", model: "deepseek-chat"},
						message: {
							reasoning: this.t("views.NotFoundView.aiReasoning1"),
							content: this.t("views.NotFoundView.aiMessage1"),
							role: "assistant"
						},
						timestamp: Date.now(),
						status: "done"
					},
					{
						id: crypto.randomUUID(),
						message: {
							reasoning: "",
							content: this.t("views.NotFoundView.userMessage1"),
							role: "user"
						},
						timestamp: Date.now(),
						status: "done"
					},
					{
						id: crypto.randomUUID(),
						model: {platform: "DeepSeek", model: "deepseek-chat"},
						message: {
							reasoning: this.t("views.NotFoundView.aiReasoning2"),
							content: this.t("views.NotFoundView.aiMessage2"),
							role: "assistant"
						},
						timestamp: Date.now(),
						status: "done"
					},
					{
						id: crypto.randomUUID(),
						model: {platform: "DeepSeek", model: "deepseek-chat"},
						message: {
							reasoning: this.t("views.NotFoundView.aiReasoning3"),
							content: this.t("views.NotFoundView.aiMessage3"),
							role: "assistant"
						},
						timestamp: Date.now(),
						status: "done"
					},
					{
						id: crypto.randomUUID(),
						message: {
							reasoning: "",
							content: this.t("views.NotFoundView.userMessage2"),
							role: "user"
						},
						timestamp: Date.now(),
						status: "done"
					},
					{
						id: crypto.randomUUID(),
						model: {platform: "DeepSeek", model: "deepseek-chat"},
						message: {
							reasoning: this.t("views.NotFoundView.aiReasoning4"),
							content: this.t("views.NotFoundView.aiMessage4"),
							role: "assistant"
						},
						timestamp: Date.now(),
						status: "done"
					},
					{
						id: crypto.randomUUID(),
						message: {
							reasoning: "",
							content: this.t("views.NotFoundView.userMessage3"),
							role: "user"
						},
						timestamp: Date.now(),
						status: "done"
					},
					{
						id: crypto.randomUUID(),
						model: {platform: "DeepSeek", model: "deepseek-chat"},
						message: {
							reasoning: this.t("views.NotFoundView.aiReasoning5"),
							content: this.t("views.NotFoundView.aiMessage5"),
							role: "assistant"
						},
						timestamp: Date.now(),
						status: "done"
					}
				]
			}
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
		}
	}
}
</script>

<template>
	<div class="not-found-view">
		<div
			v-for="message in data.data"
			:key="message.id"
			class="message"
			:data-message-id="message.id">
			<AssistantMessageCard v-if="message.message.role === 'assistant'" :message="message" currentMessageId="0"/>
			<UserMessageCard v-if="message.message.role === 'user'" :message="message" currentMessageId="0"/>
		</div>
	</div>
</template>

<style scoped lang="less">
.not-found-view {
	padding: 100px 50px 50px;
	box-sizing: border-box;
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: 30px;
	overflow: hidden auto;
}

.message {
	border-radius: 12px;
	display: flex;
	flex-direction: column;
}
</style>
