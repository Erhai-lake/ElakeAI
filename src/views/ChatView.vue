<script>
import AIInput from "@/components/AIInput.vue"
import {useRoute} from "vue-router"
import markdownit from "markdown-it"
import highlight from "highlight.js"
import "@/assets/styles/highlight.css"
import "@/assets/styles/markdown.css"

export default {
    name: "ChatView",
    inject: ["$DB"],
    components: {AIInput},
    data() {
        return {
            data: {
                key: "04c05bb4-2d94-49f2-b41f-d9e8ec57f11d",
                title: "Chat History",
                timestamp: 1698230400000,
                data: [
                    {
                        "message": {
                            "content": "你好\n# 你好!\n## 你好!!\n### 你好!!!\n#### 你好!!!!\n##### 你好!!!!!\n###### 你好!!!!!!",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "`\" '\ns",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "```python\nprint(\"你好, 世界!\")\n```\n\n这是一段python代码!",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "```js\nfunction hello() {\n  console.log(\"Hello, world!\")\n}\n```",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "无序列表\n\n* 11111\n* 22222\n* 33333\n* 44444\n* 55555\n\n无序列表",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "有序列表\n\n1. 11111\n2. 22222\n3. 33333\n4. 44444\n5. 55555\n\n有序列表",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "你好!",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "4你好! 今天我能帮你什么?",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "你好!",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "5你好! 今天我能帮你什么?",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "你好!",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "6你好! 今天我能帮你什么?",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!你好!",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "7你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?你好! 今天我能帮你什么?",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "你好!",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "8你好! 今天我能帮你什么?",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "```less\n/* 白昼主题 */\n:root, [data-theme=\"Light\"] {\n  // 滚动条轨道颜色\n  --scrollbar-track-color: rgba(255, 255, 255, 0.5);\n  // 滚动条滑块颜色\n  --scrollbar-thumb-color: rgba(193, 193, 193, 0.6);\n  // 滚动条滑块悬停颜色\n  --scrollbar-thumb-hover-color: rgba(168, 168, 168, 0.78);\n  // 背景颜色\n  --background-color: #ffffff;\n  // 背景颜色(反)\n  --background-color-Anti: #292A2D;\n  // 文字颜色\n  --text-color: #434344;\n  // 文字颜色(反)\n  --text-color-Anti: #E4E4E7;\n  // 边框颜色\n  --border-color: #6C787F;\n  // 阴影颜色\n  --box-shadow-color: rgba(0, 0, 0, 0.2);\n  // 按钮鼠标悬停背景颜色\n  --button-hover-background-color: #dadada;\n  // 按钮激活背景颜色\n  --button-active-background-color: #c3c3c3;\n  // 侧边栏容器背景颜色\n  --sidebar-expand-container-background-color: #F9FBFF;\n  // 侧边栏容器文字颜色\n  --sidebar-expand-container-text-color: #868788;\n  // 侧边栏项目悬停背景颜色\n  --sidebar-item-hover-background-color: #dadada;\n  // 聊天输入框按钮边框颜色\n  --chat-input-button-border-color: #d3d3d3;\n  // 聊天输入框附件按钮背景颜色\n  --chat-input-attachment-button-background-color: #363636;\n  // 聊天输入框附件按钮文字颜色\n  --chat-input-attachment-button-text-color: #d3d3d3;\n  // 聊天用户背景颜色\n  --chat-user-background-color: #e3f2fd;\n  // 聊天用户文字颜色\n  --chat-user-text-color: #464646;\n  // 聊天助手背景颜色\n  --chat-assistant-background-color: #f5f5f5;\n  // 聊天助手文字颜色\n  --chat-assistant-text-color: #464646;\n  // 聊天对话框时间文字颜色\n  --chat-dialogue-time-text-color: #868788;\n  // 聊天免责声明文字颜色\n  --chat-disclaimer-text-color: #868788;\n}\n\n/* 深夜主题 */\n[data-theme=\"Dark\"] {\n  // 滚动条轨道颜色\n  --scrollbar-track-color: rgba(255, 255, 255, 0.8);\n  // 滚动条滑块颜色\n  --scrollbar-thumb-color: rgba(93, 93, 93, 0.8);\n  // 滚动条滑块悬停颜色\n  --scrollbar-thumb-hover-color: rgba(0, 0, 0, 0.6);\n  // 背景颜色\n  --background-color: #292A2D;\n  // 背景颜色(反)\n  --background-color-Anti: #ffffff;\n  // 文字颜色\n  --text-color: #E4E4E7;\n  // 文字颜色(反)\n  --text-color-Anti: #434344;\n  // 边框颜色\n  --border-color: #b9bdbe;\n  // 阴影颜色\n  --box-shadow-color: rgba(255, 255, 255, 0.2);\n  // 按钮鼠标悬停背景颜色\n  --button-hover-background-color: #818181;\n  // 按钮激活背景颜色\n  --button-active-background-color: #646464;\n  // 侧边栏容器背景颜色\n  --sidebar-expand-container-background-color: #212327;\n  // 侧边栏容器文字颜色\n  --sidebar-expand-container-text-color: #a9abad;\n  // 侧边栏项目悬停背景颜色\n  --sidebar-item-hover-background-color: #9D9DA0;\n  // 聊天输入框按钮边框颜色\n  --chat-input-button-border-color: #393939;\n  // 聊天输入框附件按钮背景颜色\n  --chat-input-attachment-button-background-color: #d3d3d3;\n  // 聊天输入框附件按钮文字颜色\n  --chat-input-attachment-button-text-color: #363636;\n  // 聊天用户背景颜色\n  --chat-user-background-color: #607c88;\n  // 聊天用户文字颜色\n  --chat-user-text-color: #fcfcfc;\n  // 聊天助手背景颜色\n  --chat-assistant-background-color: #484848;\n  // 聊天助手文字颜色\n  --chat-assistant-text-color: #fcfcfc;\n  // 聊天对话框时间文字颜色\n  --chat-dialogue-time-text-color: #afafaf;\n  // 聊天免责声明文字颜色\n  --chat-disclaimer-text-color: #868788;\n}\n\n* {\n  margin: 0;\n  padding: 0;\n  transition: all 0.3s ease-in-out;\n}\n\na {\n  color: var(--text-color);\n  text-decoration: none;\n}\n\nbody {\n  background-color: var(--background-color);\n  color: var(--text-color);\n}\n\n//滚动条\n::-webkit-scrollbar {\n  //垂直滚动条宽度\n  width: 10px;\n  //水平滚动条高度\n  height: 10px;\n}\n\n/* 滚动条轨道 */\n::-webkit-scrollbar-track {\n  background-color: var(--scrollbar-track-color);\n  border-radius: 4px;\n}\n\n/* 滚动条滑块 */\n::-webkit-scrollbar-thumb {\n  background-color: var(--scrollbar-thumb-color);\n  border-radius: 4px;\n}\n\n/* 滚动条滑块悬停状态 */\n::-webkit-scrollbar-thumb:hover {\n  background-color: var(--scrollbar-thumb-hover-color);\n}\n\n// 工具提示\n[tooltips] {\n  &:hover {\n    position: relative;\n\n    &::after {\n      content: attr(tooltips);\n      position: absolute;\n      top: 100%;\n      left: 50%;\n      padding: 5px;\n      transform: translateX(-50%);\n      color: var(--text-color);\n      background-color: var(--tooltips-background-color);\n      border: 1px solid var(--tooltips-border-color);\n      font-size: 12px;\n      white-space: normal;\n      word-wrap: break-word;\n      word-break: break-all;\n      z-index: 9999;\n    }\n  }\n}\n```",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "9你好! 今天我能帮你什么?",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "你好!",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "10你好! 今天我能帮你什么?",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "你好!",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "11你好! 今天我能帮你什么?",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "你好!",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "11你好! 今天我能帮你什么?",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "你好!",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "13你好! 今天我能帮你什么?",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "你好!",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "14你好! 今天我能帮你什么?",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "你好!",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "15你好! 今天我能帮你什么?",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    }
                ]
            }
        }
    },
    async created() {
        try {
            const ROUTE = useRoute()
            const CHAT_KEY = ROUTE.params.key
            // 检查ChatKey是否存在
            const CHAT_KEY_DATA = await this.$DB.Chats.get(CHAT_KEY)
            if (!CHAT_KEY_DATA) {
                this.$toast.warning(this.$t("views.ChatView.toast.noChatKey"))
                this.$router.push("/")
            }
        } catch (error) {
            console.error("[Chat View] 聊天记录获取错误", error)
            this.$toast.error(`[Chat View] ${this.$t("views.ChatView.toast.getChatLogError")}`)
        }
    },
    mounted() {
        this.$el.addEventListener("click", (e) => {
            if (e.target.classList.contains("codecopy-btn")) {
                const code = decodeURIComponent(e.target.dataset.code)
                this.copyCode(code)
            }
        })
    },
    methods: {
        // 处理Markdown
        handleMarkdown(content) {
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
            return MD.render(content)
        },
        // 复制代码
        copyCode(code) {
            navigator.clipboard.writeText(code).then(() => {
                this.$toast.success(this.$t("views.ChatView.toast.copied"))
            }).catch((err) => {
                console.error("复制失败", err)
                this.$toast.error("views.ChatView.toast.copyFailed")
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
        }
    }
}
</script>

<template>
    <div class="ChatView">
        <!-- 顶部标题 -->
        <div class="TopTitle">{{ data.title }}</div>
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
    overflow-y: auto;
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