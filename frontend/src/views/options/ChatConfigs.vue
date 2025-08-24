<script>
import Button from "@/components/input/Button.vue"
import InputNumber from "@/components/input/InputNumber.vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"

export default {
	name: "ChatConfigs",
	inject: ["$DB", "$log"],
	components: {InputNumber, Button},
	props: {
		chatKey: {
			type: String,
			default: null
		},
		modelValue: {
			type: Boolean,
			default: false
		}
	},
	emits: ["update:modelValue"],
	data() {
		return {
			name: "ChatConfigs",
			configs: {
				temperature: 1,
				frequency_penalty: 0,
				top_p: 1,
				max_tokens: 2048,
				presence_penalty: 0
			}
		}
	},
	watch: {
		modelValue(newVal) {
			if (newVal) {
				this.loadChatConfig()
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
		},
		/**
		 * 加载全局配置
		 */
		async loadGlobalConfig() {
			try {
				const GLOBAL_CONFIG = await this.$DB.configs.get("chatConfigs")
				if (GLOBAL_CONFIG && GLOBAL_CONFIG.value) {
					this.configs = GLOBAL_CONFIG.value
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 获取全局配置失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.ChatConfigs.toast.getError")}`)
			}
		},
		/**
		 * 加载聊天配置
		 */
		async loadChatConfig() {
			await this.loadGlobalConfig()
			try {
				const CHAT_DATA = await this.$DB.chats.get(this.chatKey)
				if (CHAT_DATA.configs) {
					this.configs = CHAT_DATA.configs
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 获取聊天配置失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.ChatConfigs.toast.getError")}`)
			}
		},
		/**
		 * 保存聊天配置
		 */
		async save() {
			try {
				await this.$DB.chats.update(this.chatKey, {
					configs: JSON.parse(JSON.stringify(this.configs))
				})
				this.close()
				toastRegistry.success(`[${this.name}] ${this.t("views.ChatConfigs.toast.saveSuccess")}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 保存聊天配置失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.ChatConfigs.toast.saveError")}`)
			}
		},
		/**
		 * 关闭
		 */
		close() {
			this.$emit("update:modelValue", false)
		}
	}
}
</script>

<template>
	<transition name="fade">
		<div class="chat-configs" v-if="modelValue" @click="close">
			<div class="chat-configs-content" @click.stop>
				<h2>{{ t("views.ChatConfigs.chatSetup") }}</h2>
				<div class="chat-configs-content-container">
					<div class="container">
						<div class="item">
							<p>{{ t("views.ChatConfigs.temperature") }} [<em>temperature</em>]</p>
							<InputNumber
								v-model="configs.temperature"
								mode="slider"
								:min="0.1"
								:max="2"
								:step="0.1"/>
						</div>
						<div class="item">
							<p>{{ t("views.ChatConfigs.top_p") }} [<em>top_p</em>]</p>
							<InputNumber
								v-model="configs.top_p"
								mode="slider"
								:min="0.1"
								:max="1"
								:step="0.1"/>
						</div>
						<div class="item">
							<p>{{ t("views.ChatConfigs.max_tokens") }} [<em>max_tokens</em>]</p>
							<InputNumber
								v-model="configs.max_tokens"
								:min="1"
								:max="4096"/>
						</div>
						<div class="item">
							<p>{{ t("views.ChatConfigs.presence_penalty") }} [<em>presence_penalty</em>]</p>
							<InputNumber
								v-model="configs.presence_penalty"
								mode="slider"
								:min="-2"
								:max="2"
								:step="0.1"/>
						</div>
						<div class="item">
							<p>{{ t("views.ChatConfigs.frequency_penalty") }} [<em>frequency_penalty</em>]</p>
							<InputNumber
								v-model="configs.frequency_penalty"
								mode="slider"
								:min="-2"
								:max="2"
								:step="0.1"/>
						</div>
					</div>
					<div class="container">
					</div>
				</div>
				<div class="but">
					<Button @click="close">{{ t("views.ChatConfigs.close") }}</Button>
					<Button @click="save">{{ t("views.ChatConfigs.save") }}</Button>
					<Button @click="loadGlobalConfig">{{ t("views.ChatConfigs.global") }}</Button>
				</div>
			</div>
		</div>
	</transition>
</template>

<style scoped lang="less">
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
	opacity: 1;
}

.chat-configs {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(127, 127, 127, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 4;
}

.chat-configs-content {
	position: absolute;
	top: 50%;
	left: 50%;
	height: 500px;
	transform: translate(-50%, -50%);
	background-color: var(--background-color);
	padding: 20px;
	border-radius: 12px;
	display: grid;
	grid-template-rows: 50px 1fr 50px;
	z-index: 5;

	h2 {
		text-align: center;
	}

	.chat-configs-content-container {
		overflow: auto;
	}
}

.container {
	padding: 20px;
	margin-bottom: 20px;
	border-radius: 10px;
	background-color: rgba(127, 127, 127, 0.5);
	border: 1px solid var(--border-color);
}

.item {
	padding: 10px;
	display: grid;
	grid-template-columns: 1fr 200px;
	align-items: center;
	gap: 150px;
	border-bottom: 1px solid var(--border-color);
	border-top: 1px solid var(--border-color);
	white-space: nowrap;
}

.but {
	padding: 10px;
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	gap: 20px;
}
</style>