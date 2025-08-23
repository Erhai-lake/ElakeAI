<script>
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import InputNumber from "@/components/input/InputNumber.vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import {publicRegistry} from "@/services/plugin/api/PublicClass"

export default {
	name: "GlobalChatConfigs",
	inject: ["$DB", "$log"],
	components: {InputNumber},
	data() {
		return {
			name: "GlobalChatConfigs",
			configs: {
				temperature: 1,
				frequency_penalty: 0,
				top_p: 1,
				max_tokens: 2048,
				presence_penalty: 0
			}
		}
	},
	created() {
		this.loadChatConfig()
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
		 * 加载聊天配置
		 */
		async loadChatConfig() {
			try {
				const CHAT_DATA = await this.$DB.configs.get("chatConfigs")
				if (CHAT_DATA && CHAT_DATA.value) {
					this.configs = CHAT_DATA.value
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 获取全局聊天配置失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.Options.GlobalChatConfigs.toast.getError")}`)
			}
		},
		/**
		 * 保存聊天配置
		 */
		save: publicRegistry.debounce(async function () {
			try {
				await this.$DB.configs.put({
					item: "chatConfigs",
					value: JSON.parse(JSON.stringify(this.configs))
				})
				toastRegistry.success(`[${this.name}] ${this.t("components.Options.GlobalChatConfigs.toast.saveSuccess")}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 保存全局聊天配置失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.Options.GlobalChatConfigs.toast.saveError")}`)
			}
		}, 500)
	}
}
</script>

<template>
	<div class="item">
		<p>{{ t("components.Options.GlobalChatConfigs.temperature") }} [<em>temperature</em>]</p>
		<InputNumber
			class="input"
			v-model="configs.temperature"
			mode="slider"
			:min="0.1"
			:max="2"
			:step="0.1"
			@change="save"/>
	</div>
	<div class="item">
		<p>{{ t("components.Options.GlobalChatConfigs.top_p") }} [<em>top_p</em>]</p>
		<InputNumber class="input" v-model="configs.top_p" mode="slider" :min="0.1" :max="1" :step="0.1"/>
	</div>
	<div class="item">
		<p>{{ t("components.Options.GlobalChatConfigs.max_tokens") }} [<em>max_tokens</em>]</p>
		<InputNumber class="input" v-model="configs.max_tokens" :min="1" :max="4096"/>
	</div>
	<div class="item">
		<p>{{ t("components.Options.GlobalChatConfigs.presence_penalty") }} [<em>presence_penalty</em>]</p>
		<InputNumber class="input" v-model="configs.presence_penalty" mode="slider" :min="-2" :max="2" :step="0.1"/>
	</div>
	<div class="item">
		<p>{{ t("components.Options.GlobalChatConfigs.frequency_penalty") }} [<em>frequency_penalty</em>]</p>
		<InputNumber class="input" v-model="configs.frequency_penalty" mode="slider" :min="-2" :max="2" :step="0.1"/>
	</div>
</template>

<style scoped lang="less">
.input {
	width: 196px;
}
</style>