<script setup>
import {onMounted, ref} from "vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import AssistantMessageCard from "@/components/chat/role/AssistantMessageCard.vue"
import UserMessageCard from "@/components/chat/role/UserMessageCard.vue"

/**
 * 翻译函数
 * @function t
 * @param {string} key - 翻译键值
 * @param {Object} params - 翻译参数
 * @returns {string} - 翻译后的字符串
 */
const t = (key, params = {}) => {
	return i18nRegistry.translate(key, params)
}

const messages = ref([])

const initializeMessages = () => {
	messages.value = [
		{
			id: crypto.randomUUID(),
			model: {platform: "DeepSeek", model: "deepseek-chat"},
			message: {
				reasoning: t("views.NotFoundView.aiReasoning1"),
				content: t("views.NotFoundView.aiMessage1"),
				role: "assistant"
			},
			timestamp: Date.now(),
			status: "done"
		},
		{
			id: crypto.randomUUID(),
			message: {
				reasoning: "",
				content: t("views.NotFoundView.userMessage1"),
				role: "user"
			},
			timestamp: Date.now(),
			status: "done"
		},
		{
			id: crypto.randomUUID(),
			model: {platform: "DeepSeek", model: "deepseek-chat"},
			message: {
				reasoning: t("views.NotFoundView.aiReasoning2"),
				content: t("views.NotFoundView.aiMessage2"),
				role: "assistant"
			},
			timestamp: Date.now(),
			status: "done"
		},
		{
			id: crypto.randomUUID(),
			model: {platform: "DeepSeek", model: "deepseek-chat"},
			message: {
				reasoning: t("views.NotFoundView.aiReasoning3"),
				content: t("views.NotFoundView.aiMessage3"),
				role: "assistant"
			},
			timestamp: Date.now(),
			status: "done"
		},
		{
			id: crypto.randomUUID(),
			message: {
				reasoning: "",
				content: t("views.NotFoundView.userMessage2"),
				role: "user"
			},
			timestamp: Date.now(),
			status: "done"
		},
		{
			id: crypto.randomUUID(),
			model: {platform: "DeepSeek", model: "deepseek-chat"},
			message: {
				reasoning: t("views.NotFoundView.aiReasoning4"),
				content: t("views.NotFoundView.aiMessage4"),
				role: "assistant"
			},
			timestamp: Date.now(),
			status: "done"
		},
		{
			id: crypto.randomUUID(),
			message: {
				reasoning: "",
				content: t("views.NotFoundView.userMessage3"),
				role: "user"
			},
			timestamp: Date.now(),
			status: "done"
		},
		{
			id: crypto.randomUUID(),
			model: {platform: "DeepSeek", model: "deepseek-chat"},
			message: {
				reasoning: t("views.NotFoundView.aiReasoning5"),
				content: t("views.NotFoundView.aiMessage5"),
				role: "assistant"
			},
			timestamp: Date.now(),
			status: "done"
		}
	]
}

onMounted(() => {
	initializeMessages()
})
</script>

<template>
	<div class="not-found-view">
		<div
			v-for="message in messages"
			:key="message.id"
			class="message"
			:data-message-id="message.id">
			<AssistantMessageCard
				v-if="message.message.role === 'assistant'"
				:message="message"
				currentMessageId="0"
				:controls="false"/>
			<UserMessageCard
				v-if="message.message.role === 'user'"
				:message="message"
				currentMessageId="0"
				:controls="false"/>
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
