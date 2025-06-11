<script>
import Selector from "@/components/Selector.vue"
import ModelList from "@/assets/data/ModelList.json"
import Models from "@/services/api/Models"
import Button from "@/components/Button.vue"

export default {
    name: "DefaultChatSettings",
    inject: ["$DB"],
    components: {Selector, Button},
    data() {
        return {
            saved: false,
            // 模型列表
            largeModelList: ModelList,
            // Key列表
            keyPools: null,
            // 模型列表
            modelList: null,
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
                models: false,
                keys: false
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
        // 取消所有请求
        cancelAllRequests() {
            if (this.currentModelRequest?.cancel) {
                this.currentModelRequest.cancel()
            }
            if (this.currentKeyRequest?.cancel) {
                this.currentKeyRequest.cancel()
            }
        },
        // 更新大模型所选项
        updateSelectedLargeModel(newVal) {
            this.selectedLargeModel = newVal
            this.saved = false
        },
        // 更新Key所选项
        updateSelectedKey(newVal) {
            this.selectedKey = newVal
        },
        // 更新模型所选项
        updateSelectedModel(newVal) {
            this.selectedModel = newVal
        },
        // 选择大模型
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

                if (this.selectedKey) {
                    await this.selectKey(this.selectedKey)
                }
            } catch (error) {
                if (!requestContext.cancelled) {
                    console.error("[Default Chat Settings] 加载Key池错误", error)
                    this.$toast.error(this.$t("components.DefaultChatSettings.toast.loadKeyPoolError"))
                }
            } finally {
                this.loading.keys = false
            }
        },
        // 选择Key
        async selectKey(newKey) {
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
                this.selectedModel = models[0] || null
            } catch (error) {
                if (!requestContext.cancelled) {
                    console.error("[Default Chat Settings] 加载模型错误", error)
                    this.$toast.error(this.$t("components.DefaultChatSettings.toast.loadModelError"))
                }
            } finally {
                this.loading.models = false
            }
        },
        // 获取模型的Key
        async fetchKeysForModel(modelName) {
            const keys = await this.$DB.APIKeys
                .where("model")
                .equals(modelName)
                .and(key => key.enabled)
                .toArray()

            return keys.map(key => ({
                key: key.key,
                title: key.remark || key.key
            }))
        },
        // 获取Key的模型
        async fetchModelsForKey(key) {
            const response = await Models.getModel(key)
            if (response.error) {
                throw new Error(response.error)
            }
            return response.models.map(model => ({ title: model }))
        },
        // 加载Key
        async loadKeyPools() {
            const currentRequestId = Symbol()
            this.currentKeyPoolRequest = currentRequestId
            if (!this.saved) {
                this.selectedKey = null
            }
            this.keyPools = null
            try {
                // const DEFAULT = {key: "auto", title: "自动"}
                const KEYS_DATA = await this.$DB.APIKeys
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
                console.error("[Default Chat Settings] 加载Key池错误", error)
                this.$toast.error(`[Default Chat Settings] ${this.$t("components.DefaultChatSettings.toast.loadKeyPoolError")}`)
            }
        },
        // 获取设置
        async restoreSettings() {
            try {
                const DEFAULT_CHAT_SETTINGS_DATA = await this.$DB.Configs.get("DefaultChatSettings")
                if (DEFAULT_CHAT_SETTINGS_DATA) {
                    this.selectedLargeModel = this.largeModelList.find(model => model.title === DEFAULT_CHAT_SETTINGS_DATA.value.largeModel)
                    const KEY_DATA = await this.$DB.APIKeys.get(DEFAULT_CHAT_SETTINGS_DATA.value.key)
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
                console.error("[Default Chat Settings] 默认设置获取错误", error)
                this.$toast.error(`[Default Chat Settings] ${this.$t("components.DefaultChatSettings.toast.getDefaultSettingsError")}`)
            }
        },
        // 保存设置
        async saveDefaultChatSettings() {
            try {
                if (!this.selectedLargeModel.title) return
                if (!this.selectedKey.key) return
                if (!this.selectedModel.title) return
                if (await this.$DB.Configs.get("DefaultChatSettings")) {
                    await this.$DB.Configs.put({
                        item: "DefaultChatSettings",
                        value: {
                            largeModel: this.selectedLargeModel.title,
                            key: this.selectedKey.key,
                            model: this.selectedModel.title
                        }
                    })
                } else {
                    await this.$DB.Configs.add({
                        item: "DefaultChatSettings",
                        value: {
                            largeModel: this.selectedLargeModel.title,
                            key: this.selectedKey.key,
                            model: this.selectedModel.title
                        }
                    })
                }
            } catch (error) {
                console.error("[Default Chat Settings] 保存设置错误", error)
                this.$toast.error(`[Default Chat Settings] ${this.$t("components.DefaultChatSettings.toast.saveSettingsError")}`)
            }
        }
    }
}
</script>

<template>
    <div class="DefaultChatSettings">
        <!-- 恢复设置 -->
        <Button @click="restoreSettings">
            {{ $t("components.DefaultChatSettings.restoreSettings") }}
        </Button>
        <!-- 大模型选择 -->
        <Selector
            :selectorSelected="selectedLargeModel || {}"
            :selectorList="largeModelList"
            :loading="loading.keys"
            uniqueKey="title"
            @update:selectorSelected="updateSelectedLargeModel"/>
        <!-- Key选择 -->
        <Selector
            :selectorSelected="selectedKey || {}"
            :selectorList="keyPools"
            :loading="loading.models"
            uniqueKey="key"
            @update:selectorSelected="updateSelectedKey"/>
        <!-- 模型选择 -->
        <Selector
            :selectorSelected="selectedModel || {}"
            :selectorList="modelList"
            uniqueKey="title"
            @update:selectorSelected="updateSelectedModel"/>
        <!-- 保存按钮 -->
        <Button @click="saveDefaultChatSettings">
            {{ $t("components.DefaultChatSettings.saveSettings") }}
        </Button>
    </div>
</template>

<style scoped lang="less">
.DefaultChatSettings {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
}
</style>