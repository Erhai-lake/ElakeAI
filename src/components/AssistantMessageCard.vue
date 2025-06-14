<script>
import FoldingPanel from "@/components/FoldingPanel.vue"
import ModelList from "@/assets/data/ModelList.json"
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
    name: "AssistantMessageCard",
    components: {FoldingPanel},
    props: {
        message: {
            type: Object,
            required: true
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
        /**
         * 格式化信息
         * @param message {String} - 信息
         * @returns {String} - 格式化后的信息
         */
        formattingMessage(message) {
            message = message.replace(/```mermaid([\s\S]*?)```/g, (match, diagram) => {
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
                            const COPY_BUTTON_LANG = this.$t("components.AssistantMessageCard.copyButton")
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
            // 添加图片拖拽处理
            const RENDERER = MD.renderer.rules.image || function(tokens, idx, options, env, self) {
                return self.renderToken(tokens, idx, options)
            }
            MD.renderer.rules.image = function(tokens, idx, options, env, self) {
                const token = tokens[idx]
                token.attrSet("draggable", "false")
                token.attrSet("onmousedown", "return false")
                return RENDERER(tokens, idx, options, env, self)
            }
            // 添加链接在新窗口打开处理
            const LINK_RENDERER = MD.renderer.rules.link_open || function(tokens, idx, options, env, self) {
                return self.renderToken(tokens, idx, options)
            }
            MD.renderer.rules.link_open = function(tokens, idx, options, env, self) {
                const token = tokens[idx]
                token.attrSet("target", "_blank")
                token.attrSet("rel", "noopener noreferrer")
                return LINK_RENDERER(tokens, idx, options, env, self)
            }
            return MD.render(message)
        },
        /**
         * 初始化Mermaid
         */
        async initMermaid() {
            try {
                mermaid.initialize({
                    startOnLoad: false,
                    theme: "default",
                    flowchart: {
                        useMaxWidth: true,
                        htmlLabels: true
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
                            console.error("Mermaid 渲染错误", error)
                            ELEMENT.innerHTML = `<div class="mermaid-error">流程图渲染失败</div>`
                        }
                    }
                })
            } catch (error) {
                console.error("Mermaid 初始化错误", error)
            }
        },
        /**
         * 初始化缩放
         * @param container {HTMLElement} - 容器
         */
        setupZoom(container) {
            const SVG = container.querySelector("svg")
            if (!SVG || !document.body.contains(SVG)) {
                console.warn("SVG元素未附加到DOM")
                return
            }
            // 确保SVG有viewBox属性
            if (!SVG.hasAttribute("viewBox")) {
                const width = SVG.clientWidth || 800
                const height = SVG.clientHeight || 600
                SVG.setAttribute("viewBox", `0 0 ${width} ${height}`)
            }
            // 初始化 panzoom
            const INSTANCE = panzoom(SVG, {
                maxZoom: 10,
                minZoom: 0.2,
                initialZoom: 1,
                bounds: true,
                boundsPadding: 0.2,
                zoomSpeed: 0.065,
                zoomDoubleClickSpeed: 1
            })
            container.addEventListener("wheel", INSTANCE.zoomWithWheel)
            // 处理拖拽
            let isDragging = false
            container.addEventListener("mousedown", (e) => {
                if (e.button === 0) {
                    // 左键
                    isDragging = true
                    INSTANCE.startDrag(e)
                }
            })
            document.addEventListener("mouseup", () => {
                if (isDragging) {
                    isDragging = false
                    INSTANCE.endDrag()
                }
            })
            document.addEventListener("mousemove", (e) => {
                if (isDragging) {
                    INSTANCE.drag(e)
                }
            })
            // 防止文本选择
            container.addEventListener("mousedown", e => {
                if (e.target.tagName.toLowerCase() === "svg") {
                    e.preventDefault()
                }
            })
        },
        /**
         * 复制代码
         * @param code {String} - 代码
         */
        copyCode(code) {
            navigator.clipboard.writeText(code).then(() => {
                this.$toast.success(this.$t("views.ChatView.toast.copied"))
            }).catch((err) => {
                console.error("[Chat View] 复制失败", err)
                this.$toast.error(`[Chat View] ${this.$t("views.ChatView.toast.copyFailed")}`)
            })
        },
        /**
         * 格式化时间戳
         * @param {number} timestamp 时间戳
         * @returns {string} 格式化后的时间字符串
         */
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
        /**
         * 获取模型图片
         * @param model {String} - 模型
         * @returns {String} - 模型图片
         */
        modelImages(model) {
            if (!model) return null
            return ModelList.find(modelItem => modelItem.title === model).images
        }
    }
}
</script>

<template>
    <div class="MessageCard">
        <FoldingPanel class="ReasoningContent" v-if="message.message.reasoning">
            <template #Title>
                <span class="ReasoningTitle">{{ $t("components.AssistantMessageCard.reasoning") }}</span>
            </template>
            <template #Content>
                <div v-html="formattingMessage(message.message.reasoning)"></div>
            </template>
        </FoldingPanel>
        <div class="MessageContent" v-html="formattingMessage(message.message.content)"></div>
        <div class="MessageInfo">
            [{{ message.model.largeModel }}]
            -
            [{{ message.model.model }}]
            -
            {{ formatTimestamp(message.timestamp) }}
        </div>
        <div class="MessageInfo">{{ message.id }}</div>
        <img :src="modelImages(message.model.largeModel)" :alt="message.model.largeModel" class="ModelLogo">
    </div>
</template>

<style scoped lang="less">
.MessageCard {
    position: relative;
    padding: 16px 20px;
    border-radius: 12px;

    .assistant & {
        background-color: var(--chat-assistant-background-color);
        color: var(--chat-assistant-text-color);
    }

    .ModelLogo {
        position: absolute;
        top: -21px;
        left: -21px;
        width: 42px;
        height: 42px;
        z-index: 1;
    }

    .ReasoningContent, .MessageContent {
        font-size: 16px;
        line-height: 1.5;
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: pre-wrap;
    }

    .MessageInfo {
        margin-top: 8px;
        font-size: 12px;
        color: var(--chat-dialogue-time-text-color);
        text-align: right;
        white-space: pre-wrap;
        word-break: break-word;
    }
}
</style>