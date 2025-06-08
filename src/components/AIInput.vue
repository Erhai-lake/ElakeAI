<script>
import {defineComponent, ref} from "vue"
import ModelList from "@/assets/data/ModelList.json"
import Chat from "@/services/api/Chat"
import EventBus from "@/services/EventBus"
import Selector from "@/components/Selector.vue"
import {useRoute} from "vue-router"

export default defineComponent({
    name: "AIInput",
    components: {Selector},
    inject: ["$DB"],
    data() {
        return {
            route: useRoute(),
            // 模型列表
            modelList: ModelList,
            // Key列表
            keyPools: null,
            // 选中的模型
            selectedModel: ModelList[0],
            // 选中的Key
            selectedKey: {
                key: "auto",
                remark: "自动",
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
        // 监听模型变化
        selectedModel(newVal) {
            this.selectModel(newVal)
        },
        // 监听Key变化
        selectedKey(newVal) {
            this.selectKey(newVal)
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
        EventBus.on("[stream] complete", this.streamComplete)
    },
    beforeUnmount() {
        // 移除消息流完成监听
        EventBus.off("[stream] complete", this.streamComplete)
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
        // 更新选中项
        updateSelectedModel(newVal) {
            this.selectedModel = newVal
        },
        updateSelectedKey(newVal) {
            this.selectedKey = newVal
        },
        // 选择模型
        selectModel(selectModel) {
            if (!selectModel) return
            if (selectModel === this.selectedModel.title) return
            this.selectedModel = selectModel
            this.loadKeyPools()
        },
        // 选择模型
        selectKey(selectKey) {
            if (!selectKey) return
            if (selectKey === this.selectedKey.name) return
            this.selectedKey = selectKey
        },
        // 加载Key
        async loadKeyPools() {
            try {
                const DEFAULT = {key: "auto", title: "自动"}
                const KEYS_DATA = await this.$DB.APIKeys
                    .where("model")
                    .equals(this.selectedModel.title)
                    .and(key => key.enabled)
                    .toArray()
                this.keyPools = [
                    DEFAULT,
                    ...KEYS_DATA.map(key => ({key: key.key, title: key.remark}))
                ]
                this.selectedKey = DEFAULT
            } catch (error) {
                console.error("[AI Input] 加载Key池错误", error)
                this.$toast.error(`[AI Input] ${this.$t("components.AIInput.toast.loadKeyPoolError")}`)
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
        <!--聊天输入框-->
        <textarea
            id="ChatInput"
            :placeholder="$t('components.AIInput.inputTip')"
            ref="textareaRef"
            spellcheck="false"
            v-model="ChatInput"
            @keydown.enter.exact.prevent="Send"
            @keydown.ctrl.enter.exact="handleNewLine"
            @keydown.shift.enter.exact="handleNewLine"></textarea>
        <!--按钮栏-->
        <div class="ButtonBar">
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
            <!-- 模型选择 -->
            <div class="Selector">
                <Selector
                    :selectorSelected="selectedModel"
                    :selectorList="modelList"
                    uniqueKey="title"
                    @update:selectorSelected="updateSelectedModel"/>
            </div>
            <!-- Key选择 -->
            <div class="Selector">
                <Selector
                    :selectorSelected="selectedKey"
                    :selectorList="keyPools"
                    uniqueKey="key"
                    @update:selectorSelected="updateSelectedKey"/>
            </div>
            <div></div>
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
    margin: 0 10px;
    width: 50%;
    background-color: var(--background-color);
    border: 2px solid var(--border-color);
    border-radius: 15px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .ButtonBar {
        padding: 5px;
        width: 100%;
        display: grid;
        grid-template-columns: auto auto auto auto 1fr auto;
        gap: 10px;

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

        .Send {
            background-color: var(--background-color);
        }
    }
}

.Selector {
    width: 200px;
}

#Appendix, #Camera, #Photos, #Files, #Search {
    display: none;
}

#ChatInput {
    width: 100%;
    min-height: 50px;
    max-height: 600px;
    color: var(--text-color);
    font-size: 16px;
    letter-spacing: 3px;
    background: none;
    border: none;
    resize: none;

    &:focus {
        outline: none;
    }
}


.AppendixBar {
    z-index: 1;
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