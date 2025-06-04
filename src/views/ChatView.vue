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
                            "content": "各种标题测试",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "# 你好!\n\n## 你好!!\n\n### 你好!!!\n\n#### 你好!!!!\n\n##### 你好!!!!!\n\n###### 你好!!!!!!",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "文字属性测试",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "加粗: **加粗**\n\n斜体: *斜体*\n\n删除线: ~~删除线~~",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "段落测试",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "123\n456\n\n489\n123\n\n456\n\n489",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "引用测试",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "单行引用:\n\n> 单行引用\n\n多行引用:\n\n> 多行引用\n> 多行引用\n> 多行引用\n\n嵌套引用:\n\n> 嵌套引用\n> > 嵌套引用\n> > > 嵌套引用",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "列表测试",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "无序列表\n\n* 11111\n* 22222\n* 33333\n* 44444\n* 55555\n\n有序列表\n\n1. 11111\n2. 22222\n3. 33333\n4. 44444\n5. 55555\n\n嵌套列表\n\n* 11111\n    * 2222",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "代码行测试",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "`print(\"你好, 世界!\")`",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "代码块测试",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "```js\nfunction hello() {\n  console.log(\"Hello, world!\")\n}\n```\n\n这是一段JavaScript代码, lang属性写的是js",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "分割行测试",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "***",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "链接测试",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "[Markdown语法](https://markdown.com.cn \"最好的markdown教程\")\n\n<https://markdown.com.cn>",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "图片测试",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "![图片](https://flagcdn.com/cn.svg \"中国国旗\")",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "表格测试",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "| Syntax      | Description | Test Text     |\n| :---        |    :----:   |          ---: |\n| Header      | Title       | Here's this   |\n| Paragraph   | Text        | And more      |",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "任务列表测试",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "- [x] Write the press release\n- [ ] Update the website\n- [ ] Contact the media",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "Emoji测试",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "去露营了！ :tent: 很快回来。",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "数学公式测试",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "假设$x=2$, 那么$x^2=?$\n\n$$\n\\frac{\\mathrm{d}}{\\mathrm{d}x}\\cos x=-\\sin x\n$$",
                            "role": "assistant"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "message": {
                            "content": "流程图测试",
                            "role": "user"
                        },
                        "timestamp": 1698230400000
                    },
                    {
                        "model": "DeepSeek",
                        "message": {
                            "content": "```mermaid\nflowchart TD\n    A[Christmas] -->|Get money| B(Go shopping)\n    B --> C{Let me think}\n    C -->|One| D[Laptop]\n    C -->|Two| E[iPhone]\n    C -->|Three| F[fa:fa-car Car]\n    C --> D((This is the <br  />text<br  /> in the circle))\n```",
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
        // 初始化Mermaid
        this.initMermaid()
        // 监听复制事件
        this.$el.addEventListener("click", (e) => {
            if (e.target.classList.contains("codecopy-btn")) {
                const code = decodeURIComponent(e.target.dataset.code)
                this.copyCode(code)
            }
        })
    },
    updated() {
        clearTimeout(this._mermaidInitTimer)
        this._mermaidInitTimer = setTimeout(() => {
            this.initMermaid()
        }, 100)
    },
    methods: {
        // 处理Markdown
        handleMarkdown(content) {
            content = content.replace(/```mermaid([\s\S]*?)```/g, (match, diagram) => {
                return `<div class="mermaid">${diagram}</div>`
            })
            const MD = markdownit({
                html: true,
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
                            const { svg } = await mermaid.render(ID, CODE)
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
                            console.error("Mermaid 渲染错误", error)
                            ELEMENT.innerHTML = `<div class="mermaid-error">流程图渲染失败</div>`
                        }
                    }
                })
            } catch (error) {
                console.error("Mermaid 初始化错误", error);
            }
        },
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
            container.addEventListener('wheel', INSTANCE.zoomWithWheel)
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