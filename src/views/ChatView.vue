<script>
import AIInput from "@/components/AIInput.vue"
import {useRoute} from "vue-router"
import EventBus from "@/services/EventBus"
import UserMessageCard from "@/components/UserMessageCard.vue"
import AssistantMessageCard from "@/components/AssistantMessageCard.vue"

export default {
    name: "ChatView",
    inject: ["$DB"],
    components: {AssistantMessageCard, AIInput, UserMessageCard},
    data() {
        return {
            route: useRoute(),
            scroll: {
                isAtTop: false,
                isAtBottom: true,
                scrollDebounce: null,
                currentMessageId: null
            },
            typingEffect: {
                active: false,
                cursorVisible: true,
                currentMessageIndex: -1
            },
            editingTitle: {
                show: false,
                value: ""
            },
            data: {
                key: null,
                title: null,
                timestamp: null,
                data: [],
            },
            showInputBox: true
        }
    },
    async created() {
        await this.initChatView()
    },
    watch: {
        "route.params.key"(newKey) {
            this.initChatView(newKey)
        }
    },
    mounted() {
        // 监听滚动事件
        const container = this.$el.querySelector(".MessageList")
        if (container) {
            container.addEventListener("scroll", this.checkScrollPosition)
        }
        // 监听用户消息
        EventBus.on("[stream] userMessage", this.userMessage)
        // 监听消息流
        EventBus.on("[stream] streamStream", this.streamStream)
        // 监听消息流完成
        EventBus.on("[stream] streamComplete", this.streamComplete)
        // 监听错误
        EventBus.on("[stream] chatError", this.chatError)
    },
    beforeUnmount() {
        // 移除滚动事件
        const container = this.$el.querySelector(".MessageList")
        if (container) {
            container.removeEventListener("scroll", this.checkScrollPosition)
        }
        // 移除用户消息监听
        EventBus.off("[stream] userMessage", this.userMessage)
        // 移除消息流监听
        EventBus.off("[stream] streamStream", this.streamStream)
        // 移除消息流完成监听
        EventBus.off("[stream] streamComplete", this.streamComplete)
        // 移除错误监听
        EventBus.off("[stream] chatError", this.chatError)
    },
    methods: {
        // 设置当前聚焦的消息(在滚动或点击时调用)
        setCurrentMessageId(id) {
            this.scroll.currentMessageId = id
        },
        // 滚动到指定ID的消息
        scrollToMessage(id) {
            this.$nextTick(() => {
                const container = this.$el.querySelector(".MessageList")
                if (!container) return
                const messageElement = this.$el.querySelector(`[data-message-id="${id}"]`)
                if (messageElement) {
                    // 更新当前聚焦的消息
                    this.setCurrentMessageId(id)
                    // 滚动到消息位置(距顶部留出100px空间)
                    container.scrollTo({
                        top: messageElement.offsetTop - 100,
                        behavior: "smooth"
                    })
                }
            })
        },
        // 向上或向下滚动消息(默认向上)
        scrollToUpAndDownMessages(type = "up") {
            if (!this.data.data?.length) return
            const LAST_INDEX = this.data.data.length - 1
            // 获取当前消息的索引(无当前消息时, up从最后开始, down从第一条开始)
            let CURRENT_INDEX = this.scroll.currentMessageId
                ? this.data.data.findIndex((msg) => msg.id === this.scroll.currentMessageId)
                : type === "up" ? LAST_INDEX : 0
            // 边界检查
            if (type === "up") {
                if (CURRENT_INDEX === 0) {
                    this.scrollToUpAndDownMessages("top")
                    return
                }
                if (CURRENT_INDEX === -1) CURRENT_INDEX = LAST_INDEX
            } else if (type === "down") {
                if (CURRENT_INDEX === LAST_INDEX) {
                    this.scrollToUpAndDownMessages("bottom")
                    return
                }
                if (CURRENT_INDEX === -1) CURRENT_INDEX = 0
            } else if (type === "top") {
                if (!this.data.data?.length) return
                this.scrollToMessage(this.data.data[0].id)
                return
            } else if (type === "bottom") {
                if (!this.data.data?.length) return
                this.scrollToMessage(this.data.data[LAST_INDEX].id)
                return
            }
            // 计算目标索引
            let targetIndex = type === "up" ? CURRENT_INDEX - 1 : CURRENT_INDEX + 1
            targetIndex = Math.max(0, Math.min(targetIndex, LAST_INDEX))
            if (this.data.data[targetIndex]) {
                this.scrollToMessage(this.data.data[targetIndex].id)
            }
        },
        // 检查滚动位置
        checkScrollPosition() {
            const container = this.$el.querySelector(".MessageList")
            if (!container) return
            // 清除之前的防抖
            clearTimeout(this.scroll.scrollDebounce)
            // 设置新地防抖
            this.scroll.scrollDebounce = setTimeout(() => {
                const {scrollTop, scrollHeight, clientHeight} = container
                // 判断是否在顶部(留出50px的缓冲区域)
                this.scroll.isAtTop = scrollTop < 50
                // 判断是否在底部(留出50px的缓冲区域)
                this.scroll.isAtBottom = scrollHeight - (scrollTop + clientHeight) < 50
            }, 100)
        },
        // 初始化聊天界面
        async initChatView(chatKey) {
            try {
                const CHAT_DATA = await this.$DB.Chats.get(chatKey || this.route.params.key)
                // 检查ChatKey是否存在
                if (!CHAT_DATA) {
                    this.$toast.warning(this.$t("views.ChatView.toast.noChatKey"))
                    this.$router.push("/")
                    EventBus.emit("[function] chatListGet")
                    return
                }
                // 写入聊天记录
                this.data = {
                    key: CHAT_DATA.key,
                    title: CHAT_DATA.title,
                    timestamp: CHAT_DATA.timestamp,
                    data: Array.isArray(CHAT_DATA.data) ? CHAT_DATA.data : []
                }
                this.scrollToUpAndDownMessages("bottom")
            } catch (error) {
                console.error("[Chat View] 聊天记录获取错误", error)
                this.$toast.error(`[Chat View] ${this.$t("views.ChatView.toast.getChatLogError")}`)
            }
        },
        // 标题输入
        titleInput() {
            this.editingTitle.value = this.data.title
            this.editingTitle.show = true
            this.$nextTick(() => {
                const input = this.$el.querySelector(".TopTitle input")
                if (input) {
                    input.focus()
                    input.select()
                }
            })
        },
        // 保存标题
        async saveTitle() {
            if (this.editingTitle.value.trim() === this.data.title) {
                this.editingTitle.show = false
                return
            }
            try {
                const NEW_TITLE = this.editingTitle.value.trim()
                this.data.title = NEW_TITLE
                await this.$DB.Chats.update(this.data.key, {title: NEW_TITLE})
                this.$toast.success(this.$t("views.ChatView.toast.titleUpdated"))
                // 触发事件 更新ChatsList
                EventBus.emit("[function] chatListGet")
            } catch (error) {
                console.error("[Chat View] 标题更新错误", error)
                this.$toast.error(`[Chat View] ${this.$t("views.ChatView.toast.titleUpdateError")}`)
                this.editingTitle.value = this.data.title
            } finally {
                this.editingTitle.show = false
            }
        },
        // 取消编辑标题
        cancelEditTitle() {
            this.editingTitle.show = false
            this.editingTitle.value = this.data.title
        },
        // 处理标题键盘事件
        handleTitleKeydown(e) {
            if (e.key === "Enter") {
                this.saveTitle()
            } else if (e.key === "Escape") {
                this.cancelEditTitle()
            }
        },
        // 用户消息
        async userMessage(message) {
            this.data.data.push({
                id: message.id,
                message: {
                    content: message.message,
                    role: "user"
                },
                timestamp: Date.now()
            })
            // 只有在底部附近时才自动滚动
            if (this.scroll.isAtBottom) {
                this.scrollToUpAndDownMessages("bottom")
            }
        },
        // 消息流
        async streamStream(message) {
            if (!Array.isArray(this.data.data)) {
                this.data.data = []
            }
            const LAST_MESSAGE = this.data.data[this.data.data.length - 1]
            if (!LAST_MESSAGE || LAST_MESSAGE.message.role !== "assistant") {
                this.data.data.push({
                    id: message.id,
                    model: {
                        largeModel: message.model.largeModel,
                        model: message.model.model
                    },
                    message: {
                        reasoning: message.reasoning || "",
                        content: message.message || "",
                        role: "assistant"
                    },
                    timestamp: Date.now()
                })
            } else {
                if (message.reasoning) {
                    LAST_MESSAGE.message.reasoning += message.reasoning
                } else if (message.message) {
                    LAST_MESSAGE.message.content += message.message
                }
            }
            // 只有在底部附近时才自动滚动
            if (this.scroll.isAtBottom) {
                this.scrollToUpAndDownMessages("bottom")
            }
        },
        // 消息完成
        async streamComplete() {
            // 如果用户在底部附近会滚动到底部
            if (this.scroll.isAtBottom) {
                this.scrollToUpAndDownMessages("bottom")
            }
        },
        // 错误处理
        async chatError() {
            this.data.data.pop()
        }
    }
}
</script>

<template>
    <div class="ChatView">
        <!-- 顶部标题 -->
        <div class="TopTitle">
            <p v-if="!editingTitle.show" @click="titleInput" :title="data.title">{{ data.title }}</p>
            <input
                type="text"
                v-else
                v-model="editingTitle.value"
                @blur="saveTitle"
                @keydown="handleTitleKeydown"
                class="TitleInput">
        </div>
        <!-- 消息列表 -->
        <div class="MessageList" :style="`padding: 100px 50px ${showInputBox ? '280px' : '50px'}`">
            <div
                v-for="message in data.data"
                :key="message.id"
                :class="['Message', scroll.currentMessageId === message.id ? 'Current' : '', message.message.role]"
                :data-message-id="message.id"
                @click="setCurrentMessageId(message.id)">
                <UserMessageCard v-if="message.message.role === 'user'" :message="message"/>
                <AssistantMessageCard v-if="message.message.role === 'assistant'" :message="message"/>
            </div>
        </div>
        <div></div>
        <!-- 底部输入框 -->
        <div class="InputArea" v-if="showInputBox">
            <AIInput/>
        </div>
        <!-- AI提示信息 -->
        <div class="AIDisclaimer">{{ $t("views.ChatView.aiDisclaimer") }}</div>
        <!-- 功能控件 -->
        <div class="FunctionalControls">
            <!-- 回到顶部按钮 -->
            <button
                class="ScrollToTopMessages"
                :title="$t('views.ChatView.FunctionalControls.scrollToTopMessages')"
                @click="scrollToUpAndDownMessages('top')"
                :disabled="scroll.isAtTop || data.data.length === 0">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-topArrow"></use>
                </svg>
            </button>
            <!-- 上一条按钮 -->
            <button
                :title="$t('views.ChatView.FunctionalControls.scrollToUpMessages')"
                @click="scrollToUpAndDownMessages('up')"
                :disabled="data.data.length === 0">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-upArrow"></use>
                </svg>
            </button>
            <!-- 下一条按钮 -->
            <button
                :title="$t('views.ChatView.FunctionalControls.scrollToDownMessages')"
                @click="scrollToUpAndDownMessages('Down')"
                :disabled="data.data.length === 0">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-downArrow"></use>
                </svg>
            </button>
            <!-- 回到底部按钮 -->
            <button
                :title="$t('views.ChatView.FunctionalControls.scrollToBottomMessages')"
                @click="scrollToUpAndDownMessages('bottom')"
                :disabled="scroll.isAtBottom || data.data.length === 0">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-bottomArrow"></use>
                </svg>
            </button>
            <!-- 显示输入框按钮 -->
            <button
                :title="$t('views.ChatView.FunctionalControls.' + (showInputBox ? 'hideInputBox' : 'showInputBox'))"
                @click="showInputBox = !showInputBox">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-inputBox"></use>
                </svg>
            </button>
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

.ChatView {
    position: relative;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-rows: auto 1fr auto auto;
    overflow: hidden;
}

.TopTitle {
    position: relative;
    height: 65px;
    font-size: 18px;
    font-weight: bold;
    border-radius: 0 0 20px 20px;
    backdrop-filter: blur(10px);
    box-shadow: 0 6px 15px 0 var(--box-shadow-color);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;

    p {
        position: absolute;
        max-width: 90%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
    }

    .TitleInput {
        width: 500px;
        padding: 8px 12px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--background-color);
        color: var(--text-color);
        font-size: 18px;
        font-weight: bold;
        text-align: center;

        &:focus {
            outline: none;
        }
    }
}

.MessageList {
    position: absolute;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 30px;
    overflow: hidden auto;
}

@media screen and (max-width: 768px) {
    .MessageList {
        padding: 100px 0 200px 0;
    }
}

.Message[data-message-id].Current {
    background-color: red;
}

.InputArea {
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
}

.AIDisclaimer {
    padding: 10px 0;
    text-align: center;
    font-size: 12px;
    background-color: var(--background-color);
    color: var(--chat-disclaimer-text-color);
    user-select: none;
    z-index: 1;
}

.FunctionalControls {
    position: fixed;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 3;

    button {
        margin: 10px 0;
        color: var(--text-color);
        background-color: var(--background-color);
        box-shadow: 0 0 10px var(--box-shadow-color);
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }
}
</style>