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
            // 模型列表
            largeModelList: ModelList,
            // Key列表
            keyPools: null,
            // 模型列表
            modelList: null,
            // 选中的模型
            selectedLargeModel: ModelList[0],
            // 选中的Key
            selectedKey: null,
            // 选中的模型
            selectedModel: null,
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
    created() {
        // 初始化Key池
        this.loadKeyPools()
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
        // 调整输入框高度
        adjustTextareaHeight() {
            if (!this.textareaRef) return
            this.textareaRef.style.height = "auto"
            const newHeight = Math.min(this.textareaRef.scrollHeight, 600)
            this.textareaRef.style.height = `${Math.max(newHeight, 50)}px`
        },
        // 更新大模型所选项
        updateSelectedLargeModel(newVal) {
            this.selectedLargeModel = newVal
        },
        // 更新Key所选项
        updateSelectedKey(newVal) {
            this.selectedKey = newVal
        },
        // 更新模型所选项
        updateSelectedModel(newVal) {
            this.selectedModel = newVal
        },
        // 选择模型
        selectLargeModel(selectLargeModel) {
            if (!selectLargeModel) return
            if (selectLargeModel === this.selectedLargeModel.title) return
            this.selectedLargeModel = selectLargeModel
            this.loadKeyPools()
        },
        // 选择Key
        selectKey(selectKey) {
            if (!selectKey) return
            if (selectKey === this.selectedKey.name) return
            this.selectedKey = selectKey
            this.loadModel()
        },
        // 选择模型
        selectModel(selectModel) {
            if (!selectModel) return
            if (selectModel === this.selectedModel.title) return
            this.selectedModel = selectModel
        },
        // 加载Key
        async loadKeyPools() {
            this.selectedKey = null
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
                this.selectedKey = this.keyPools[0]
            } catch (error) {
                console.error("[AI Input] 加载Key池错误", error)
                this.$toast.error(`[AI Input] ${this.$t("components.AIInput.toast.loadKeyPoolError")}`)
            }
            await this.loadModel()
        },
        // 加载模型
        async loadModel() {
            this.selectedModel = null
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
                this.selectedModel = this.modelList[0]
            } catch (error) {
                console.error("[AI Input] 加载模型错误", error)
                this.$toast.error(`[AI Input] ${this.$t("components.AIInput.toast.loadModelError")}`)
            }
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
                    this.selectedKey.key,
                    this.route.params.key,
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
            <label for="Appendix" :title="$t('components.AIInput.function.appendix')" @click="modelStatus = false">
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