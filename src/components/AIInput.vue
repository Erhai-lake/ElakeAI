<script>
import {defineComponent, ref} from "vue"
import ModelList from "@/assets/data/ModelList.json"
import Chat from "@/services/api/Chat"
import EventBus from "@/services/EventBus"
import Selector from "@/components/Selector.vue"
import {useRoute} from "vue-router"
import Models from "@/services/api/Models"

export default defineComponent({
    name: "AIInput",
    components: {Selector},
    inject: ["$DB"],
    data() {
        return {
            route: useRoute(),
            selector: {
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
                    models: false,
                    keys: false
                }
            },
            // 输入框
            ChatInput: "",
            // 联网搜索状态
            enableWebSearch: false,
            // 停止
            stopStatus: false
        }
    },
    watch: {
        // 监听大模型变化
        "selector.selectedLargeModel"(newVal) {
            this.selectLargeModel(newVal)
        },
        // 监听Key变化
        "selector.selectedKey"(newVal) {
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
    setup() {
        const textareaRef = ref(null)
        return {textareaRef}
    },
    mounted() {
        if (this.textareaRef) {
            this.adjustTextareaHeight()
            this.textareaRef.addEventListener("input", this.adjustTextareaHeight)
        }
        // 监听消息流完成
        EventBus.on("[stream] streamComplete", this.streamComplete)
    },
    beforeUnmount() {
        // 移除消息流完成监听
        EventBus.off("[stream] streamComplete", this.streamComplete)
    },
    unmounted() {
        if (this.textareaRef) {
            this.textareaRef.removeEventListener("input", this.adjustTextareaHeight)
        }
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
            this.selector.selectedLargeModel = newVal
            this.selector.saved = false
        },
        // 更新Key所选项
        updateSelectedKey(newVal) {
            this.selector.selectedKey = newVal
        },
        // 更新模型所选项
        updateSelectedModel(newVal) {
            this.selector.selectedModel = newVal
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
                this.selector.loading.keys = true
                const keys = await this.fetchKeysForModel(newModel.title)

                if (requestContext.cancelled) return

                this.selector.keyPools = keys
                this.selector.selectedKey = keys[0] || null

                if (this.selector.selectedKey) {
                    await this.selectKey(this.selector.selectedKey)
                }
            } catch (error) {
                if (!requestContext.cancelled) {
                    console.error("[AI Input] 加载Key池错误", error)
                    this.$toast.error(`[AI Input] ${this.$t("components.AIInput.toast.loadKeyPoolError")}`)
                }
            } finally {
                this.selector.loading.keys = false
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
                this.selector.loading.models = true
                const models = await this.fetchModelsForKey(newKey.key)

                if (requestContext.cancelled) return

                this.selector.modelList = models
                if (!this.selector.saved) {
                    this.selector.selectedModel = models[0] || null
                }
            } catch (error) {
                if (!requestContext.cancelled) {
                    console.error("[AI Input] 加载模型错误", error)
                    this.$toast.error(`[AI Input] ${this.$t("components.AIInput.toast.loadModelError")}`)
                }
            } finally {
                this.selector.loading.models = false
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
            return response.models.map(model => ({title: model}))
        },
        // 加载Key
        async loadKeyPools() {
            const currentRequestId = Symbol()
            this.currentKeyPoolRequest = currentRequestId
            if (!this.selector.saved) {
                this.selector.selectedKey = null
            }
            this.selector.keyPools = []
            try {
                // const DEFAULT = {key: "auto", title: "自动"}
                const KEYS_DATA = await this.$DB.APIKeys
                    .where("model")
                    .equals(this.selector.selectedLargeModel.title)
                    .and(key => key.enabled)
                    .toArray()
                // 检查是否还是当前有效的请求
                if (this.currentKeyPoolRequest !== currentRequestId) return
                this.selector.keyPools = [
                    // DEFAULT,
                    ...KEYS_DATA.map(key => ({key: key.key, title: key.remark}))
                ]
                if (this.selector.keyPools.length === 0) return
                if (!this.selector.saved) {
                    this.selector.selectedKey = this.selector.keyPools[0]
                }
            } catch (error) {
                console.error("[AI Input] 加载Key池错误", error)
                this.$toast.error(`[AI Input] ${this.$t("components.AIInput.toast.loadKeyPoolError")}`)
            }
        },
        // 获取设置
        async restoreSettings() {
            try {
                const DEFAULT_CHAT_SETTINGS_DATA = await this.$DB.Configs.get("DefaultChatSettings")
                if (DEFAULT_CHAT_SETTINGS_DATA) {
                    this.selector.selectedLargeModel = this.selector.largeModelList.find(model => model.title === DEFAULT_CHAT_SETTINGS_DATA.value.largeModel)
                    const KEY_DATA = await this.$DB.APIKeys.get(DEFAULT_CHAT_SETTINGS_DATA.value.key)
                    this.selector.selectedKey = {key: KEY_DATA.key, title: KEY_DATA.remark}
                    this.selector.selectedModel = {title: DEFAULT_CHAT_SETTINGS_DATA.value.model}
                    this.selector.saved = true
                } else {
                    this.selector.selectedLargeModel = this.selector.largeModelList[0]
                    this.selector.selectedKey = null
                    this.selector.selectedModel = null
                    this.selector.saved = false
                }
            } catch (error) {
                console.error("[AI Input] 默认设置获取错误", error)
                this.$toast.error(`[AI Input] ${this.$t("components.AIInput.toast.getDefaultSettingsError")}`)
            }
        },
        // 调整输入框高度
        adjustTextareaHeight() {
            if (!this.textareaRef) return
            this.textareaRef.style.height = "auto"
            const newHeight = Math.min(this.textareaRef.scrollHeight, 600)
            this.textareaRef.style.height = `${Math.max(newHeight, 50)}px`
        },
        // 发送
        async Send() {
            // 检查输入框是否为空
            if (this.ChatInput.trim() === "") return
            const CONTENT = this.ChatInput
            this.ChatInput = ""
            await this.$nextTick(() => {
                this.adjustTextareaHeight()
            })
            // 创建新的聊天
            if (this.route.name !== "ChatKey") {
                try {
                    const NEW_CHAT_KEY = crypto.randomUUID()
                    this.$router.push(`/chat/${NEW_CHAT_KEY}`)
                    await this.$DB.Chats.add({
                        key: NEW_CHAT_KEY,
                        title: this.$t("components.AIInput.newChat"),
                        timestamp: Date.now(),
                        data: []
                    })
                    EventBus.emit("[function] chatListGet")
                } catch (error) {
                    this.ChatInput = CONTENT
                    await this.$nextTick(() => {
                        this.adjustTextareaHeight()
                    })
                    console.error("[AI Input]  创建新聊天错误", error)
                    this.$toast.error(`[AI Input] ${this.$t("components.AIInput.toast.createNewChatError")}`)
                }
            }
            // 发送消息
            try {
                this.stopStatus = true
                // 发送请求
                const CHAT = await Chat.chat(
                    this.selector.selectedKey.key,
                    this.route.params.key,
                    this.selector.selectedModel.title,
                    CONTENT.trim(),
                    this.enableWebSearch
                )
                if (CHAT.error) {
                    this.stopStatus = false
                    this.ChatInput = CONTENT
                    await this.$nextTick(() => {
                        this.adjustTextareaHeight()
                    })
                    this.$toast.warning(this.$t(`api.Chat.${CHAT.error}`))
                }
            } catch (error) {
                this.ChatInput = CONTENT
                await this.$nextTick(() => {
                    this.adjustTextareaHeight()
                })
                console.error("[AI Input]  发送消息错误", error)
                this.$toast.error(`[AI Input] ${this.$t("components.AIInput.toast.sendMessageError")}`)
            }
        },
        // 处理换行
        handleNewLine(event) {
            event.preventDefault()
            const textarea = event.target
            const cursorPos = textarea.selectionStart
            const currentValue = this.ChatInput

            // 获取当前行的缩进
            const lineStart = currentValue.lastIndexOf("\n", cursorPos - 1) + 1
            const currentLine = currentValue.substring(lineStart, cursorPos)
            const indent = currentLine.match(/^\s*/)[0]

            // 插入换行符和缩进
            this.ChatInput = currentValue.substring(0, cursorPos) + "\n" + indent + currentValue.substring(cursorPos)

            this.$nextTick(() => {
                this.adjustTextareaHeight()
                // 设置光标位置到新行的缩进后面
                textarea.selectionStart = cursorPos + 1 + indent.length
                textarea.selectionEnd = cursorPos + 1 + indent.length
                textarea.focus()
            })
        },
        // 消息流完成
        streamComplete() {
            this.stopStatus = false
        },
        // 停止
        async stop() {
            try {
                await Chat.stop()
                this.stopStatus = false
            } catch (error) {
                this.stopStatus = true
                console.error("[AI Input]  停止错误", error)
                this.$toast.error(`[AI Input] ${this.$t("components.AIInput.toast.stopError")}`)
            }
        }
    }
})
</script>

<template>
    <div class="AIInput">
        <!--附件栏-->
        <input id="Appendix" type="checkbox"/>
        <div class="AppendixBar">
            <!--关闭-->
            <label for="Appendix" :title="$t('components.AIInput.appendix.close')">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-close"></use>
                </svg>
            </label>
            <!--拍照-->
            <label for="Camera" :title="$t('components.AIInput.appendix.camera')">
                <input type="file" id="Camera" accept="image/*" capture="environment"/>
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-photograph"></use>
                </svg>
            </label>
            <!--相册-->
            <label for="Photos" :title="$t('components.AIInput.appendix.picture')">
                <input type="file" id="Photos" accept="image/*"/>
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-photoAlbum"></use>
                </svg>
            </label>
            <!--文件-->
            <label for="Files" :title="$t('components.AIInput.appendix.file')">
                <input type="file" id="Files"/>
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-file"></use>
                </svg>
            </label>
        </div>
        <!--顶部按钮栏-->
        <div class="TopButtonBar">
            <!--附件-->
            <label for="Appendix" :title="$t('components.AIInput.function.appendix')">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-link"></use>
                </svg>
            </label>
            <!--联网搜索-->
            <input id="Search" type="checkbox" v-model="enableWebSearch"/>
            <label for="Search" :title="$t('components.AIInput.function.webSearch')">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-webSearch"></use>
                </svg>
            </label>
            <!-- 大模型选择 -->
            <Selector
                :selectorSelected="selector.selectedLargeModel || {}"
                :selectorList="selector.largeModelList"
                uniqueKey="title"
                @update:selectorSelected="updateSelectedLargeModel"/>
            <!-- Key选择 -->
            <Selector
                :selectorSelected="selector.selectedKey || {}"
                :selectorList="selector.keyPools"
                :loading="selector.loading.keys"
                uniqueKey="key"
                @update:selectorSelected="updateSelectedKey"/>
            <!-- 模型选择 -->
            <Selector
                :selectorSelected="selector.selectedModel || {}"
                :selectorList="selector.modelList"
                :loading="selector.loading.models"
                uniqueKey="title"
                @update:selectorSelected="updateSelectedModel"/>
        </div>
        <!--聊天输入框-->
        <div class="Input">
            <textarea
                id="ChatInput"
                :placeholder="$t('components.AIInput.inputTip')"
                ref="textareaRef"
                spellcheck="false"
                v-model="ChatInput"
                @keydown.enter.exact.prevent="Send"
                @keydown.ctrl.enter.exact="handleNewLine"
                @keydown.shift.enter.exact="handleNewLine"></textarea>
            <!--发送-->
            <label
                for="Send"
                :title="$t('components.AIInput.function.send')"
                class="Send"
                v-if="!stopStatus"
                @click="Send">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-send"></use>
                </svg>
            </label>
            <!--停止-->
            <label
                for="Stop"
                :title="$t('components.AIInput.function.stop')"
                class="Stop"
                v-if="stopStatus"
                @click="stop">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-close"></use>
                </svg>
            </label>
        </div>
    </div>
</template>

<style scoped lang="less">
.icon {
    width: 2em;
    height: 2em;
    vertical-align: -0.15em;
    fill: currentColor;
    overflow: hidden;
}

@media screen and (max-width: 768px) {
    .AIInput {
        width: 100% !important;
    }
}

.AIInput {
    position: relative;
    padding: 16px;
    box-sizing: border-box;
    width: 50%;
    min-height: 200px;
    background-color: var(--background-color);
    border: 2px solid var(--border-color);
    border-radius: 15px;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .TopButtonBar {
        padding: 5px;
        margin-bottom: 10px;
        box-sizing: border-box;
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 1;

        label {
            padding: 10px;
            font-size: 12px;
            border-radius: 50%;
            background-color: var(--background-color);
            border: 2px solid var(--chat-input-button-border-color);
            cursor: pointer;
            outline: none;
            transition: all 0.2s ease-in-out, transform 0.1s ease-in-out;

            &:hover {
                box-shadow: 0 0 5px 3px var(--box-shadow-color);
            }

            &:active {
                transform: scale(0.9);
            }
        }
    }
}

#Appendix, #Camera, #Photos, #Files, #Search {
    display: none;
}

.Input {
    position: relative;

    #ChatInput {
        padding: 10px 44px 10px 10px;
        box-sizing: border-box;
        width: 100%;
        min-height: 100px;
        max-height: 600px;
        color: var(--text-color);
        font-size: 16px;
        letter-spacing: 3px;
        border-radius: 10px;
        background: none;
        border: 1px solid var(--border-color);
        resize: none;

        &:focus {
            outline: none;
        }
    }

    .Send, .Stop {
        position: absolute;
        bottom: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: var(--background-color);
        border: 2px solid var(--chat-input-button-border-color);
        cursor: pointer;
        outline: none;
        transition: all 0.2s ease-in-out, transform 0.1s ease-in-out;
        display: flex;
        justify-content: center;
        align-items: center;

        &:hover {
            box-shadow: 0 0 5px 3px var(--box-shadow-color);
        }

        &:active {
            transform: scale(0.9);
        }
    }
}

.AppendixBar {
    z-index: 2;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    border-radius: 16px;
    overflow: hidden;
    pointer-events: none;
    transition: all 0.2s 0.4s ease-in-out;

    label {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 16px;
        border-radius: 50%;
        border: 2px solid var(--chat-input-attachment-button-border-color);
        font-size: 14px;
        color: var(--chat-input-attachment-button-text-color);
        background-color: var(--chat-input-attachment-button-background-color);
        opacity: 0;
        transition: all 0.2s ease-in-out;
        transform: translate(-600%, 600%);
        cursor: pointer;
    }

    & :nth-child(1) {
        transition-delay: 0.1s;
    }

    & :nth-child(2) {
        transition-delay: 0.2s;
    }

    & :nth-child(3) {
        transition-delay: 0.3s;
    }

    & :nth-child(4) {
        transition-delay: 0.4s;
    }
}

#Appendix {
    &:checked {
        & ~ .AppendixBar {
            background-color: var(--scrollbar-thumb-hover-color);
            backdrop-filter: blur(5px);
            pointer-events: all;
            transition: all 0.2s ease-in-out;

            label {
                opacity: 1;
                transform: translate(0);
            }
        }
    }
}

#Search {
    &:checked + label {
        border: 2px solid lightskyblue;
        color: lightskyblue;
    }
}
</style>