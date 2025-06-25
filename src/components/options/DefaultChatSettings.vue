<script>
import Selector from "@/components/Selector.vue"
import ModelList from "@/assets/data/ModelList.json"
import APIManager from "@/services/api/APIManager"
import Button from "@/components/Button.vue"

export default {
	name: "DefaultChatSettings",
	inject: ["$DB"],
	components: {Selector, Button},
	data() {
		return {
			name: "DefaultChatSettings",
			saved: false,
			// 模型列表
			largeModelList: ModelList,
			// Key列表
			keyPools: [],
			// 模型列表
			modelList: [],
			// 选中的模型
			selectedLargeModel: null,
			// 选中的Key
			selectedKey: null,
			// 选中的模型
			selectedModel: null,
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
		// 监听大模型变化
		selectedLargeModel(newVal) {
			if (!newVal) return
			this.selectLargeModel(newVal)
		},
		// 监听Key变化
		selectedKey(newVal) {
			if (!newVal) return
			this.selectKey(newVal)
		}
	},
	beforeDestroy() {
		this.cancelAllRequests()
	},
	async created() {
		// 获取设置
		await this.restoreSettings()
		// 初始化Key池
		await this.loadKeyPools()
	},
	methods: {
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
		 * 更新大模型所选项
		 * @param newVal {Object} - 新的大模型选项
		 */
		updateSelectedLargeModel(newVal) {
			this.selectedLargeModel = newVal
			this.saved = false
		},
		/**
		 * 更新Key所选项
		 * @param newVal {Object} - 新的Key选项
		 */
		updateSelectedKey(newVal) {
			this.selectedKey = newVal
		},
		/**
		 * 更新模型所选项
		 * @param newVal {Object} - 新的模型选项
		 */
		updateSelectedModel(newVal) {
			this.selectedModel = newVal
		},
		/**
		 * 选择大模型
		 * @param newModel {Object} - 新的大模型选项
		 */
		async selectLargeModel(newModel) {
			this.cancelAllRequests()
			const requestContext = {cancelled: false}
			this.currentKeyRequest = {
				cancel: () => {
					requestContext.cancelled = true
				}
			}
			try {
				this.loading.keys = true
				const keys = await this.fetchKeysForModel(newModel.title)

				if (requestContext.cancelled) return

				this.keyPools = keys
				this.selectedKey = keys[0] || null
				this.loading.keys = false
			} catch (error) {
				if (!requestContext.cancelled) {
					this.$log.error(`[${this.name}] 加载Key池失败`, error)
					this.$toast.error(`[${this.name}] ${this.$t("components.DefaultChatSettings.toast.loadKeyPoolError")}`)
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
				const models = await this.fetchModelsForKey(newKey.key)
				if (requestContext.cancelled) return
				this.modelList = models
				if (!this.saved) {
					this.selectedModel = models[0] || null
				}
			} catch (error) {
				if (!requestContext.cancelled) {
					this.$log.error(`[${this.name}] 加载模型失败`, error)
					this.$toast.error(`[${this.name}] ${this.$t("components.DefaultChatSettings.toast.loadModelError")}`)
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
			const keys = await this.$DB.apiKeys
				.where("model")
				.equals(modelName)
				.and(key => key.enabled)
				.toArray()

			return keys.map(key => ({
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
			const RESPONSE = await APIManager.execute(KEY_DATA.model, "models", {apiKey: key})
			if (RESPONSE.error) {
				this.$log.error(`[${this.name}] 获取Key的模型失败`, RESPONSE)
				this.$toast.error(`[${this.name}] ${this.$t(`api.${RESPONSE.error}`)}`)
			}
			const UNIQUE_MODELS = [...new Set(RESPONSE.data)]
			return UNIQUE_MODELS.map(model => ({title: model}))
		},
		/**
		 * 加载Key
		 */
		async loadKeyPools() {
			const currentRequestId = Symbol()
			this.currentKeyPoolRequest = currentRequestId
			if (!this.saved) {
				this.selectedKey = []
			}
			this.keyPools = []
			try {
				// const DEFAULT = {key: "auto", title: "自动"}
				const KEYS_DATA = await this.$DB.apiKeys
					.where("model")
					.equals(this.selectedLargeModel.title)
					.and(key => key.enabled)
					.toArray()
				// 检查是否还是当前有效的请求
				if (this.currentKeyPoolRequest !== currentRequestId) return
				this.keyPools = [
					// DEFAULT,
					...KEYS_DATA.map(key => ({key: key.key, title: key.remark}))
				]
				if (this.keyPools.length === 0) return
				if (!this.saved) {
					this.selectedKey = this.keyPools[0]
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 加载Key池失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.DefaultChatSettings.toast.loadKeyPoolError")}`)
			}
		},
		/**
		 * 获取设置
		 */
		async restoreSettings() {
			try {
				const DEFAULT_CHAT_SETTINGS_DATA = await this.$DB.configs.get("DefaultChatSettings")
				if (DEFAULT_CHAT_SETTINGS_DATA) {
					this.selectedLargeModel = this.largeModelList.find(model => model.title === DEFAULT_CHAT_SETTINGS_DATA.value.largeModel)
					const KEY_DATA = await this.$DB.apiKeys.get(DEFAULT_CHAT_SETTINGS_DATA.value.key)
					if (!KEY_DATA) {
						this.selectedKey = null
						this.selectedModel = null
						return
					}
					this.selectedKey = {key: KEY_DATA.key, title: KEY_DATA.remark}
					this.selectedModel = {title: DEFAULT_CHAT_SETTINGS_DATA.value.model}
					this.saved = true
				} else {
					this.selectedLargeModel = this.largeModelList[0]
					this.selectedKey = null
					this.selectedModel = null
					this.saved = false
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 默认设置获取失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.DefaultChatSettings.toast.getDefaultSettingsError")}`)
			}
		},
		/**
		 * 保存设置
		 */
		async saveDefaultChatSettings() {
			try {
				if (!this.selectedLargeModel.title) return
				if (!this.selectedKey.key) return
				if (!this.selectedModel.title) return
				if (await this.$DB.configs.get("DefaultChatSettings")) {
					await this.$DB.configs.put({
						item: "DefaultChatSettings",
						value: {
							largeModel: this.selectedLargeModel.title,
							key: this.selectedKey.key,
							model: this.selectedModel.title
						}
					})
				} else {
					await this.$DB.configs.add({
						item: "DefaultChatSettings",
						value: {
							largeModel: this.selectedLargeModel.title,
							key: this.selectedKey.key,
							model: this.selectedModel.title
						}
					})
				}
				this.$toast.success(`[${this.name}] ${this.$t("components.DefaultChatSettings.toast.saveSettingsSuccess")}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 保存设置失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.DefaultChatSettings.toast.saveSettingsError")}`)
			}
		}
	}
}
</script>

<template>
	<div class="default-chat-settings">
		<!-- 大模型选择 -->
		<Selector
			:selectorSelected="selectedLargeModel || {}"
			:selectorList="largeModelList"
			uniqueKey="title"
			@update:selectorSelected="updateSelectedLargeModel"/>
		<!-- Key选择 -->
		<Selector
			:selectorSelected="selectedKey || {}"
			:selectorList="keyPools"
			:loading="loading.keys"
			uniqueKey="key"
			@update:selectorSelected="updateSelectedKey"/>
		<!-- 模型选择 -->
		<Selector
			:selectorSelected="selectedModel || {}"
			:selectorList="modelList"
			:loading="loading.models"
			uniqueKey="title"
			@update:selectorSelected="updateSelectedModel"/>
		<!-- 保存按钮 -->
		<Button @click="saveDefaultChatSettings">
			{{ $t("components.DefaultChatSettings.saveSettings") }}
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