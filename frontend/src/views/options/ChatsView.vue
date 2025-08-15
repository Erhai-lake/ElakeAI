<script>
import ChatAIKey from "@/components/options/ChatsAIKey.vue"
import DefaultChatSettings from "@/components/options/DefaultChatSettings.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import InputText from "@/components/InputText.vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import {publicRegistry} from "@/services/plugin/api/PublicClass"

export default {
	name: "ChatsView",
	inject: ["$DB", "$log"],
	components: {InputText, DefaultChatSettings, ChatAIKey},
	data() {
		return {
			name: "ChatsView",
			chatBatchSize: "20"
		}
	},
	async created() {
		try {
			const CHAT_BATCH_SIZE = await this.$DB.configs.get("chatBatchSize")
			this.chatBatchSize = CHAT_BATCH_SIZE.value || "20"
		} catch (error) {
			this.$log.error(`[${this.name}] 读取聊天批大小失败, 使用默认值 20`, error)
			toastRegistry.error(`[${this.name}] ${this.t("views.ChatsView.toast.chatBatchSizeError")}`)
			this.chatBatchSize = "20"
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
		 * 聊天批量大小
		 * @param value {String} - 输入值
		 */
		saveChatBatchSize: publicRegistry.debounce(async function (value) {
			const CHAT_BATCH_SIZE = await this.$DB.configs.get("chatBatchSize")
			// 检查输入值是否与当前值相同
			if (CHAT_BATCH_SIZE.value === value) return
			// 将输入值转换为整数
			const BATCH_SIZE = parseInt(value, 10)
			// 检查转换后的值是否为有效的整数且大于 0
			if (isNaN(BATCH_SIZE) || BATCH_SIZE <= 0) {
				this.$log.error(`[${this.name}] 输入的聊天批大小无效, 输入值: ${value}`)
				toastRegistry.error(`[${this.name}] ${this.t("views.ChatsView.toast.invalidChatBatchSize")}`)
				return
			}
			try {
				await this.$DB.configs.put({item: "chatBatchSize", value: value})
				toastRegistry.success(`[${this.name}] ${this.t("views.ChatsView.toast.chatBatchSizeSuccess")}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 保存聊天批大小失败, 输入值: ${value}`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.ChatsView.toast.chatBatchSizeError")}`)
			}
		}, 500)
	}
}
</script>

<template>
	<ChatAIKey/>
	<div class="item">
		{{ t("views.ChatsView.defaultChat") }}
		<DefaultChatSettings/>
	</div>
	<div class="item">
		{{ t("views.ChatsView.chatBatchSize") }}
		<InputText v-model="chatBatchSize" @input="saveChatBatchSize"/>
	</div>
</template>
