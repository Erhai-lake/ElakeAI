<script>
import Button from "@/components/input/Button.vue"
import InputNumber from "@/components/input/InputNumber.vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import {i18nRegistry} from "@/services/plugin/api/I18nClass";

export default {
	name: "ChatSetup",
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
			name: "ChatSetup",
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
	created() {
		this.init()
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
		 * 初始化
		 */
		init() {
			this.configs = {
				temperature: 1,
				top_p: 1,
				max_tokens: 2048,
				presence_penalty: 0,
				frequency_penalty: 0
			}
		},
		/**
		 * 加载聊天配置
		 */
		async loadChatConfig() {
			try {
				const CHAT_DATA = await this.$DB.chats.get(this.chatKey)
				if (CHAT_DATA.configs) {
					this.configs = CHAT_DATA.configs
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 获取聊天配置失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.ChatSetup.toast.getError")}`)
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
				toastRegistry.success(`[${this.name}] ${this.t("views.ChatSetup.toast.saveSuccess")}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 保存聊天配置失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.ChatSetup.toast.saveError")}`)
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
		<div class="setup" v-if="modelValue">
			<div class="setup-content">
				<h2>{{ t("views.ChatSetup.chatSetup") }}</h2>
				<div class="item">
					<p>{{ t("views.ChatSetup.temperature") }} [<em>temperature</em>]</p>
					<InputNumber v-model="configs.temperature" :min="0.1" :max="2"/>
				</div>
				<div class="item">
					<p>{{ t("views.ChatSetup.top_p") }} [<em>top_p</em>]</p>
					<InputNumber v-model="configs.top_p" :min="0.1" :max="1"/>
				</div>
				<div class="item">
					<p>{{ t("views.ChatSetup.max_tokens") }} [<em>max_tokens</em>]</p>
					<InputNumber v-model="configs.max_tokens" :min="1" :max="4096"/>
				</div>
				<div class="item">
					<p>{{ t("views.ChatSetup.presence_penalty") }} [<em>presence_penalty</em>]</p>
					<InputNumber v-model="configs.presence_penalty" :min="-2" :max="2"/>
				</div>
				<div class="item">
					<p>{{ t("views.ChatSetup.frequency_penalty") }} [<em>frequency_penalty</em>]</p>
					<InputNumber v-model="configs.frequency_penalty" :min="-2" :max="2"/>
				</div>
				<div class="item">
					<Button @click="save" class="but">{{ t("views.ChatSetup.save") }}</Button>
					<Button @click="close" class="but">{{ t("views.ChatSetup.close") }}</Button>
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

.setup {
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

	.setup-content {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background-color: var(--background-color);
		padding: 20px;
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		z-index: 5;
	}
}

.item {
	padding: 10px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20px;
	border-bottom: 1px solid var(--border-color);
	border-top: 1px solid var(--border-color);
	white-space: nowrap;
}

h2{
	margin-bottom: 20px;
	text-align: center;
}

.but {
	width: 150px;
}
</style>