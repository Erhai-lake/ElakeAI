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
            largeModelList: ModelList,
            keyPools: null,
            modelList: null,
            selectedLargeModel: null,
            selectedKey: null,
            selectedModel: null,
        }
    },
    watch: {
        // 监听大模型变化
        selectedLargeModel(newVal) {
            this.selectLargeModel(newVal)
        },
        // 监听Key变化
        selectedKey(newVal) {
            this.selectKey(newVal)
        },
        // 监听模型变化
        selectedModel(newVal) {
            this.selectModel(newVal)
        }
    },
    async created() {
        // 获取设置
        await this.restoreSettings()
        // 初始化Key池
        await this.loadKeyPools()
    },
    methods: {
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
        async selectLargeModel(selectLargeModel) {
            if (!selectLargeModel) return
            if (selectLargeModel === this.selectedLargeModel.title) return
            this.selectedLargeModel = selectLargeModel
            await this.loadKeyPools()
        },
        // 选择Key
        async selectKey(selectKey) {
            if (!selectKey) return
            if (selectKey === this.selectedKey.name) return
            this.selectedKey = selectKey
            await this.loadModel()
        },
        // 选择模型
        async selectModel(selectModel) {
            if (!selectModel) return
            if (selectModel === this.selectedModel.title) return
            this.selectedModel = selectModel
        },
        // 加载Key
        async loadKeyPools() {
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
                this.keyPools = [
                    // DEFAULT,
                    ...KEYS_DATA.map(key => ({key: key.key, title: key.remark}))
                ]
                if (this.keyPools.length === 0) {
                    return
                }
                if (!this.saved) {
                    this.selectedKey = this.keyPools[0]
                }
            } catch (error) {
                console.error("[Default Chat Settings] 加载Key池错误", error)
                this.$toast.error(`[Default Chat Settings] ${this.$t("components.DefaultChatSettings.toast.loadKeyPoolError")}`)
            }
        },
        // 加载模型
        async loadModel() {
            if (!this.saved) {
                this.selectedModel = null
            }
            this.modelList = null
            try {
                const MODELS_DATA = await Models.getModel(this.selectedKey.key)
                if (MODELS_DATA.error) {
                    this.$toast.warning(this.$t(`api.Models.${MODELS_DATA.error}`))
                    return
                }
                this.modelList = [
                    ...MODELS_DATA.models.map(model => ({title: model}))
                ]
                if (this.modelList.length === 0) {
                    return
                }
                if (!this.saved) {
                    this.selectedModel = this.modelList[0]
                }
            } catch (error) {
                console.error("[Default Chat Settings] 加载模型错误", error)
                this.$toast.error(`[Default Chat Settings] ${this.$t("components.DefaultChatSettings.toast.loadModelError")}`)
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
            uniqueKey="title"
            @update:selectorSelected="updateSelectedLargeModel"/>
        <!-- Key选择 -->
        <Selector
            :selectorSelected="selectedKey || {}"
            :selectorList="keyPools"
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