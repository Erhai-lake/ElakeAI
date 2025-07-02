<script>
import Selector from "@/components/Selector.vue"
import Button from "@/components/Button.vue"
import EventBus from "@/services/EventBus"
import {platformRegistry} from "@/services/plugin/api/PlatformClass"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"

export default {
	name: "DefaultChatSettings",
	inject: ["$DB"],
	props: {
		save: {
			type: Boolean,
			default: true
		}
	},
	components: {Selector, Button},
	data() {
		return {
			name: "DefaultChatSettings",
			saved: false,
			// 平台
			platform: {
				list: [],
				selected: null,
			},
			// Key
			keyPools: {
				list: [],
				selected: null,
			},
			// 模型
			model: {
				list: [],
				selected: null,
			},
			// 当前模型请求
			currentModelRequest: null,
			// 当前Key请求
			currentKeyRequest: null,
			// 加载状态
			loading: {
				keys: false,
				models: false
			}
		}
	},
	watch: {
		"platform.selected"(newVal) {
			if (!newVal) return
			this.selectPlatform(newVal)
		},
		"keyPools.selected"(newVal) {
			if (!newVal) return
			this.selectKey(newVal)
		}
	},
	mounted() {
		EventBus.on("[update] keyPoolUpdate", this.loadKeyPools)
	},
	beforeUnmount() {
		EventBus.off("[update] keyPoolUpdate", this.loadKeyPools)
	},
	beforeDestroy() {
		this.cancelAllRequests()
	},
	async created() {
		// 初始化平台列表
		await this.loadPlatform()
		// 获取设置
		await this.restoreSettings()
		// 初始化Key池
		await this.loadKeyPools()
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
		 * 加载平台
		 */
		async loadPlatform() {
			const PLATFORMS = platformRegistry.getAllPlatforms()
			this.platform.list = PLATFORMS.reduce((acc, item) => {
				try {
					acc.push({
						title: item.api.info.name,
						images: item.api.info.image,
						url: item.api.info.url
					})
				} catch (error) {
					this.$log.error(`[${this.name}] 加载平台 ${item.api.info.name} 失败`, error)
				}
				return acc
			}, [])
			// 初始化选中模型
			if (this.platform.list && this.platform.list.length > 0) {
				this.platform.selected = this.platform.list[0]
			}
		},
		/**
		 * 加载Key
		 */
		async loadKeyPools() {
			const currentRequestId = Symbol()
			this.currentKeyPoolRequest = currentRequestId
			if (!this.saved) {
				this.keyPools.selected = []
			}
			try {
				// const DEFAULT = {key: "auto", title: "自动"}
				const KEYS_DATA = await this.$DB.apiKeys
					.where("model")
					.equals(this.platform.selected.title)
					.and(key => key.enabled)
					.toArray()
				// 检查是否还是当前有效的请求
				if (this.currentKeyPoolRequest !== currentRequestId) return
				this.keyPools.list = [
					// DEFAULT,
					...KEYS_DATA.map(key => ({key: key.key, title: key.remark})) || []
				]
				if (this.keyPools.list.length === 0) return
				if (!this.saved) {
					this.platform.selected = this.keyPools.list[0]
				}
			} catch (error) {
				this.keyPools.list = []
				this.$log.error(`[${this.name}] 加载Key池失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.DefaultChatSettings.toast.loadKeyPoolError")}`)
			}
		},
		/**
		 * 取消所有请求
		 */
		cancelAllRequests() {
			if (this.currentModelRequest?.cancel) {
				this.currentModelRequest.cancel()
			}
			if (this.currentKeyRequest?.cancel) {
				this.currentKeyRequest.cancel()
			}
		},
		/**
		 * 更新平台所选项
		 * @param newVal {Object} - 新的平台选项
		 */
		updateSelectedPlatformList(newVal) {
			this.platform.selected = newVal
			this.saved = false
			this.$emit("update:selectedPlatformList", newVal)
		},
		/**
		 * 更新Key所选项
		 * @param newVal {Object} - 新的Key选项
		 */
		updateSelectedKey(newVal) {
			this.keyPools.selected = newVal
			this.$emit("update:selectedKey", newVal)
		},
		/**
		 * 更新模型所选项
		 * @param newVal {Object} - 新的模型选项
		 */
		updateSelectedModel(newVal) {
			this.model.selected = newVal
			this.$emit("update:selectedModel", newVal)
		},
		/**
		 * 选择平台
		 * @param newModel {Object} - 新的平台选项
		 */
		async selectPlatform(newModel) {
			this.cancelAllRequests()
			const requestContext = {cancelled: false}
			this.currentKeyRequest = {
				cancel: () => {
					requestContext.cancelled = true
				}
			}
			try {
				this.loading.keys = true
				const KEYS = await this.fetchKeysForModel(newModel.title)
				if (requestContext.cancelled) return
				this.keyPools.list = KEYS
				this.keyPools.selected = KEYS[0] || null
				this.loading.keys = false
			} catch (error) {
				if (!requestContext.cancelled) {
					this.$log.error(`[${this.name}] 加载Key池失败`, error)
					toastRegistry.error(`[${this.name}] ${this.t("components.DefaultChatSettings.toast.loadKeyPoolError")}`)
				}
			} finally {
				this.loading.keys = false
			}
		},
		/**
		 * 选择Key
		 * @param newKey {Object} - 新的Key选项
		 */
		async selectKey(newKey) {
			if (!newKey?.key) return
			this.cancelAllRequests()
			const requestContext = {cancelled: false}
			this.currentModelRequest = {
				cancel: () => {
					requestContext.cancelled = true
				}
			}
			try {
				this.loading.models = true
				const MODELS = await this.fetchModelsForKey(newKey.key)
				if (requestContext.cancelled) return
				this.model.list = MODELS
				if (!this.saved) {
					this.model.selected = MODELS[0] || null
				}
			} catch (error) {
				if (!requestContext.cancelled) {
					this.$log.error(`[${this.name}] 加载模型失败`, error)
					toastRegistry.error(`[${this.name}] ${this.t("components.DefaultChatSettings.toast.loadModelError")}`)
				}
			} finally {
				this.loading.models = false
			}
		},
		/**
		 * 获取模型的Key
		 * @param modelName {String} - 模型名称
		 * @returns {Promise<{title, key: *}[]>} - 模型的Key列表
		 */
		async fetchKeysForModel(modelName) {
			const KEYS = await this.$DB.apiKeys
				.where("model")
				.equals(modelName)
				.and(key => key.enabled)
				.toArray()

			return KEYS.map(key => ({
				key: key.key,
				title: key.remark || key.key
			}))
		},
		/**
		 * 获取Key的模型
		 * @param key {String} - Key
		 * @returns {Promise<{title: *}[]>} - Key的模型列表
		 */
		async fetchModelsForKey(key) {
			const KEY_DATA = await this.$DB.apiKeys.get(key)
			const INSTANCE = platformRegistry.getPlatform(KEY_DATA.model)
			const RESPONSE = await INSTANCE.api.models({apiKey: key})
			if (RESPONSE.error) {
				// TODO: 处理错误
				this.$log.error(`[${this.name}] 获取Key的模型失败`, RESPONSE)
				toastRegistry.error(`[${this.name}] ${this.t(`api.${RESPONSE.error}`)}`)
			}
			const UNIQUE_MODELS = [...new Set(RESPONSE.data)]
			return UNIQUE_MODELS.map(model => ({title: model}))
		},
		/**
		 * 获取设置
		 */
		async restoreSettings() {
			try {
				const DEFAULT_CHAT_SETTINGS_DATA = await this.$DB.configs.get("DefaultChatSettings")
				if (DEFAULT_CHAT_SETTINGS_DATA) {
					this.platform.selected = this.platform.list.find(model => model.title === DEFAULT_CHAT_SETTINGS_DATA.value.platform)
					const KEY_DATA = await this.$DB.apiKeys.get(DEFAULT_CHAT_SETTINGS_DATA.value.key)
					if (!KEY_DATA) {
						this.keyPools.selected = null
						this.model.selected = null
						return
					}
					this.keyPools.selected = {key: KEY_DATA.key, title: KEY_DATA.remark}
					this.model.selected = {title: DEFAULT_CHAT_SETTINGS_DATA.value.model}
					this.saved = true
				} else {
					this.platform.selected = this.platform.list[0]
					this.keyPools.selected = null
					this.model.selected = null
					this.saved = false
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 默认设置获取失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.DefaultChatSettings.toast.getDefaultSettingsError")}`)
			}
		},
		/**
		 * 保存设置
		 */
		async saveDefaultChatSettings() {
			try {
				if (!this.platform.selected.title) return
				if (!this.keyPools.selected.key) return
				if (!this.model.selected.title) return
				if (await this.$DB.configs.get("DefaultChatSettings")) {
					await this.$DB.configs.put({
						item: "DefaultChatSettings",
						value: {
							platform: this.platform.selected.title,
							key: this.keyPools.selected.key,
							model: this.model.selected.title
						}
					})
				} else {
					await this.$DB.configs.add({
						item: "DefaultChatSettings",
						value: {
							platform: this.platform.selected.title,
							key: this.keyPools.selected.key,
							model: this.model.selected.title
						}
					})
				}
				toastRegistry.success(`[${this.name}] ${this.t("components.DefaultChatSettings.toast.saveSettingsSuccess")}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 保存设置失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.DefaultChatSettings.toast.saveSettingsError")}`)
			}
		}
	}
}
</script>

<template>
	<div class="default-chat-settings">
		<!-- 平台选择 -->
		<Selector
			:selectorList="platform.list"
			:selectorSelected="platform.selected || {}"
			uniqueKey="title"
			@update:selectorSelected="updateSelectedPlatformList"/>
		<!-- Key选择 -->
		<Selector
			:selectorList="keyPools.list"
			:selectorSelected="keyPools.selected || {}"
			:loading="loading.keys"
			uniqueKey="key"
			@update:selectorSelected="updateSelectedKey"/>
		<!-- 模型选择 -->
		<Selector
			:selectorList="model.list"
			:selectorSelected="model.selected || {}"
			:loading="loading.models"
			uniqueKey="title"
			@update:selectorSelected="updateSelectedModel"/>
		<!-- 保存按钮 -->
		<Button v-if="save" @click="saveDefaultChatSettings">
			{{ t("components.DefaultChatSettings.saveSettings") }}
		</Button>
	</div>
</template>

<style scoped lang="less">
.default-chat-settings {
	width: 100%;
	display: flex;
	align-items: center;
	gap: 10px;
}
</style>