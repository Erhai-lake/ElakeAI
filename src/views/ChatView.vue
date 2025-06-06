<script>
import AIInput from "@/components/AIInput.vue"
import {useRoute} from "vue-router"
import markdownit from "markdown-it"
import highlight from "highlight.js"
import markdownItTaskLists from "markdown-it-task-lists"
import {full as emoji} from "markdown-it-emoji"
import markdownItMathjax3 from "markdown-it-mathjax3"
import mermaid from "mermaid"
import panzoom from "@panzoom/panzoom"
import "@/assets/styles/highlight.css"
import "@/assets/styles/markdown.less"
import EventBus from "@/services/EventBus"

export default {
    name: "ChatView",
    inject: ["$DB"],
    components: {AIInput},
    data() {
        return {
            route: useRoute(),
            isAtBottom: true,
            scrollDebounce: null,
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
            }
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
        // 初始化Mermaid
        this.initMermaid()
        // 监听复制事件
        this.$el.addEventListener("click", (e) => {
            if (e.target.classList.contains("codecopy-btn")) {
                const code = decodeURIComponent(e.target.dataset.code)
                this.copyCode(code)
            }
        })
        // 监听滚动事件
        const container = this.$el.querySelector(".MessageList")
        if (container) {
            container.addEventListener("scroll", this.checkScrollPosition)
        }
        // 监听用户消息
        EventBus.on("[ChatView] userMessage", this.userMessage)
        // 监听消息流
        EventBus.on("[ChatView] messageStream", this.messageStream)
        // 监听消息完成
        EventBus.on("[ChatView] messageComplete", this.messageComplete)
    },
    beforeUnmount() {
        // 移除滚动事件
        const container = this.$el.querySelector(".MessageList")
        if (container) {
            container.removeEventListener("scroll", this.checkScrollPosition)
        }
        // 移除用户消息监听
        EventBus.off("[ChatView] userMessage", this.userMessage)
        // 移除消息流监听
        EventBus.on("[ChatView] messageStream", this.messageStream)
        // 移除消息完成监听
        EventBus.off("[ChatView] messageComplete", this.messageComplete)
    },
    updated() {
        clearTimeout(this._mermaidInitTimer)
        this._mermaidInitTimer = setTimeout(() => {
            this.initMermaid()
        }, 100)
    },
    methods: {
        // 滚动到底部
        scrollToBottom() {
            this.$nextTick(() => {
                const CONTAINER = this.$el.querySelector(".MessageList")
                if (!CONTAINER) return
                CONTAINER.scrollTo({
                    top: CONTAINER.scrollHeight,
                    behavior: "smooth"
                })
            })
        },
        // 检查滚动位置
        checkScrollPosition() {
            const container = this.$el.querySelector(".MessageList")
            if (!container) return
            // 清除之前的防抖
            clearTimeout(this.scrollDebounce)
            // 设置新的防抖
            this.scrollDebounce = setTimeout(() => {
                const {scrollTop, scrollHeight, clientHeight} = container
                // 判断是否在底部（留出50px的缓冲区域）
                this.isAtBottom = scrollHeight - (scrollTop + clientHeight) < 50
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
                    return
                }
                // 写入聊天记录
                this.data = CHAT_DATA
                this.scrollToBottom()
            } catch (error) {
                console.error("[Chat View] 聊天记录获取错误", error)
                this.$toast.error(`[Chat View] ${this.$t("views.ChatView.toast.getChatLogError")}`)
            }
        },
        // 处理Markdown
        handleMarkdown(content) {
            // 1. 先处理mermaid的div形式
            content = content.replace(/<div class="?mermaid"?>([\s\S]*?)<\/div>/g, (match, diagram) => {
                return `<div class="mermaid">${diagram}</div>`
            })
            // 2. 处理代码块形式的mermaid
            content = content.replace(/```mermaid([\s\S]*?)```/g, (match, diagram) => {
                return `<div class="mermaid">${diagram}</div>`
            })
            // 3. 转义所有其他HTML标签（保留mermaid不转义）
            const tempDiv = document.createElement("div")
            tempDiv.innerHTML = content
            // 找到所有mermaid图表并临时存储
            const mermaidCharts = []
            const mermaidElements = tempDiv.querySelectorAll(".mermaid")
            mermaidElements.forEach((el, index) => {
                mermaidCharts.push(el.outerHTML)
                el.outerHTML = `<!--MERMAID-${index}-->`
            })
            // 转义剩余HTML
            let escapedContent = tempDiv.innerHTML
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
            // 恢复mermaid图表
            mermaidCharts.forEach((chart, index) => {
                escapedContent = escapedContent.replace(`<!--MERMAID-${index}-->`, chart)
            })

            if (!content.startsWith("```mermaid")) {
                content = content.replace(/[<>]/g, function (m) {
                    return {"<": "&lt;", ">": "&gt;"}[m]
                })
            }
            content = content.replace(/```mermaid([\s\S]*?)```/g, (match, diagram) => {
                return `<div class="mermaid">${diagram}</div>`
            })
            const MD = markdownit({
                html: false,
                linkify: true,
                typographer: true,
                breaks: true,
                highlight: (str, lang) => {
                    if (lang && highlight.getLanguage(lang)) {
                        try {
                            const HIGHLIGHTED = highlight.highlight(str, {language: lang, ignoreIllegals: true}).value
                            const COPY_BUTTON_LANG = this.$t("views.ChatView.copyButton")
                            return `<div class="hljs language-${lang}"><button class="codecopy-btn" data-code="${encodeURIComponent(str)}">${COPY_BUTTON_LANG}</button><pre><code>${HIGHLIGHTED}</code></pre></div>`
                        } catch (__) {
                        }
                    }
                    return `<pre class="hljs"><code>${MD.utils.escapeHtml(str)}</code></pre>`
                }
            })
                // 任务列表
                .use(markdownItTaskLists)
                //Emoji
                .use(emoji)
                // 数学公式
                .use(markdownItMathjax3)
            return MD.render(content)
        },
        // 初始化Mermaid
        async initMermaid() {
            try {
                mermaid.initialize({
                    startOnLoad: false,
                    theme: "default",
                    flowchart: {
                        useMaxWidth: true,
                        htmlLabels: true,
                        width: "100%"
                    }
                })

                requestAnimationFrame(async () => {
                    const ELEMENTS = document.querySelectorAll(".mermaid:not([data-rendered])")
                    for (const ELEMENT of ELEMENTS) {
                        try {
                            ELEMENT.dataset.processed = "true"
                            const CODE = ELEMENT.textContent.trim()
                            const ID = "mermaid-" + Math.random().toString(36).substr(2, 9)
                            // 渲染图表
                            const {svg} = await mermaid.render(ID, CODE)
                            // 创建容器
                            const CONTAINER = document.createElement("div")
                            CONTAINER.className = "mermaid-container"
                            CONTAINER.setAttribute("data-rendered", "true")
                            CONTAINER.innerHTML = svg
                            // 插入DOM
                            ELEMENT.replaceWith(CONTAINER)
                            // Mermaid SVG 尺寸初始化
                            const SVG_ELEMENT = CONTAINER.querySelector("svg")
                            if (SVG_ELEMENT) {
                                SVG_ELEMENT.removeAttribute("width")
                                SVG_ELEMENT.removeAttribute("height")
                                SVG_ELEMENT.style.width = "100%"
                                SVG_ELEMENT.style.maxHeight = "400px"
                                SVG_ELEMENT.style.display = "block"
                            }
                            // 处理 SVG 和缩放
                            this.setupZoom(CONTAINER)
                        } catch (error) {
                            ELEMENT.innerHTML = `<div class="mermaid-error">流程图渲染失败</div>`
                            console.error("[Chat View] Mermaid渲染错误", error)
                            this.$toast.error(`[Chat View] ${this.$t("views.ChatView.toast.mermaidRenderingError")}`)
                        }
                    }
                })
            } catch (error) {
                console.error("[Chat View] Mermaid初始化错误", error);
                this.$toast.error(`[Chat View] ${this.$t("views.ChatView.toast.mermaidInitializationError")}`)
            }
        },
        // 处理SVG缩放
        setupZoom(container) {
            const SVG = container.querySelector("svg")
            if (!SVG) return

            // 初始化 panzoom
            const INSTANCE = panzoom(SVG, {
                maxZoom: 10,
                minZoom: 0.2,
                initialZoom: 3,
                bounds: true,
                boundsPadding: 0.2,
                zoomSpeed: 0.065,
                zoomDoubleClickSpeed: 1
            })
            container.addEventListener("wheel", INSTANCE.zoomWithWheel)
            // 防止文本选择
            container.addEventListener("mousedown", e => {
                if (e.target.tagName.toLowerCase() === "svg") {
                    e.preventDefault()
                }
            })
        },
        // 复制代码
        copyCode(code) {
            navigator.clipboard.writeText(code).then(() => {
                this.$toast.success(this.$t("views.ChatView.toast.copied"))
            }).catch((err) => {
                console.error("[Chat View] 复制失败", err)
                this.$toast.error(`[Chat View] ${this.$t("views.ChatView.toast.copyFailed")}`)
            })
        },
        // 格式化时间戳
        formatTimestamp(timestamp) {
            const DATE = new Date(timestamp)
            const YEAR = DATE.getFullYear()
            const MONTH = String(DATE.getMonth() + 1).padStart(2, "0")
            const DAY = String(DATE.getDate()).padStart(2, "0")
            const HOURS = String(DATE.getHours()).padStart(2, "0")
            const MINUTES = String(DATE.getMinutes()).padStart(2, "0")
            const SECONDS = String(DATE.getSeconds()).padStart(2, "0")
            return `${YEAR}-${MONTH}-${DAY} ${HOURS}:${MINUTES}:${SECONDS}`
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
                EventBus.emit("chatListGet")
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
                message: {
                    content: message,
                    role: "user"
                },
                timestamp: Date.now()
            })
            // 只有在底部附近时才自动滚动
            if (this.isAtBottom) {
                this.scrollToBottom()
            }
        },
        // 消息流
        async messageStream(message) {
            const LAST_MESSAGE = this.data.data[this.data.data.length - 1]
            if (!(LAST_MESSAGE && LAST_MESSAGE.message.role === "assistant")) {
                this.data.data.push({
                    model: message.model,
                    message: {
                        content: message.message,
                        role: "assistant"
                    },
                    timestamp: Date.now()
                })
            }
            LAST_MESSAGE.message.content += message.message
            // 只有在底部附近时才自动滚动
            if (this.isAtBottom) {
                this.scrollToBottom()
            }
        },
        // 消息完成
        async messageComplete() {
            console.log("消息完成")
            // 如果用户在底部附近会滚动到底部
            if (this.isAtBottom) {
                this.scrollToBottom()
            }
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
        <div class="MessageList">
            <div v-for="message in data.data" :key="message.timestamp" :class="['Message', message.message.role]">
                <div class="MessageCard">
                    <div class="MessageContent" v-html="handleMarkdown(message.message.content)"></div>
                    <div class="MessageTime">{{ formatTimestamp(message.timestamp) }}</div>
                </div>
            </div>
        </div>
        <div></div>
        <!-- 底部输入框 -->
        <div class="InputArea">
            <AIInput/>
        </div>
        <!-- AI提示信息 -->
        <div class="AIDisclaimer">{{ $t("views.ChatView.aiDisclaimer") }}</div>
    </div>
</template>

<style scoped lang="less">
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
    z-index: 1;

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
    padding: 100px 50px 200px 50px;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-x: hidden;
    overflow-y: auto;
}

@media screen and (max-width: 768px) {
    .MessageList {
        padding: 100px 0 200px 0;
    }
}

.MessageCard {
    padding: 16px 20px;
    border-radius: 12px;
    position: relative;

    .user & {
        background-color: var(--chat-user-background-color);
        color: var(--chat-user-text-color);
        border-bottom-right-radius: 0;
    }

    .assistant & {
        background-color: var(--chat-assistant-background-color);
        color: var(--chat-assistant-text-color);
        border-bottom-left-radius: 0;
    }
}

.MessageContent {
    font-size: 16px;
    line-height: 1.5;
    word-wrap: break-word;
    overflow-wrap: break-word;
}

.MessageTime {
    margin-top: 8px;
    font-size: 12px;
    color: var(--chat-dialogue-time-text-color);
    text-align: right;
}

.InputArea {
    display: flex;
    align-items: center;
    justify-content: center;
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
</style>