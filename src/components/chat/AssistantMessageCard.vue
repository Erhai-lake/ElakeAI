<script>
import FoldingPanel from "@/components/FoldingPanel.vue"
import ModelList from "@/assets/data/ModelList.json"
import markdownit from "markdown-it"
import highlight from "highlight.js"
import markdownItTaskLists from "markdown-it-task-lists"
import {full as emoji} from "markdown-it-emoji"
import markdownItMathjax3 from "markdown-it-mathjax3"
import {imgLazyload} from "@mdit/plugin-img-lazyload"
import mermaid from "mermaid"
import panzoom from "@panzoom/panzoom"
import "@/assets/styles/highlight.css"
import "@/assets/styles/markdown.less"
import Button from "@/components/Button.vue"
import EventBus from "@/services/EventBus"

export default {
    name: "AssistantMessageCard",
    inject: ["$DB"],
    components: {Button, FoldingPanel},
    props: {
        message: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            name: "AssistantMessageCard"
        }
    },
    mounted() {
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
            const MD = markdownit({
                html: false,
                xhtmlOut: false,
                breaks: false,
                langPrefix: "language-",
                linkify: true,
                typographer: true,
                highlight: (str, lang) => {
                    if (lang && highlight.getLanguage(lang)) {
                        try {
                            const HIGHLIGHTED = highlight.highlight(str, {language: lang, ignoreIllegals: true}).value
                            const COPY_BUTTON_LANG = this.$t("components.AssistantMessageCard.copyButton")
                            return `<div class="hljs language-${lang}"><button class="codecopy-btn" data-code="${encodeURIComponent(str)}">${COPY_BUTTON_LANG}</button><pre><code>${HIGHLIGHTED}</code></pre></div>`
                        } catch (error) {
                            this.$log.error(this.name, "代码高亮渲染错误", error)
                        }
                    } else if (lang === "mermaid") {
                        // 初始化Mermaid
                        this.initMermaid()
                        try {
                            return `<div class="mermaid">${str}</div>`
                        } catch (error) {
                            this.$log.error(this.name, "mermaid渲染错误", error)
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
                // 图片懒加载
                .use(imgLazyload)
            // 添加图片拖拽处理
            const RENDERER = MD.renderer.rules.image || function (tokens, idx, options, env, self) {
                return self.renderToken(tokens, idx, options)
            }
            MD.renderer.rules.image = function (tokens, idx, options, env, self) {
                const token = tokens[idx]
                token.attrSet("draggable", "false")
                token.attrSet("onmousedown", "return false")
                return RENDERER(tokens, idx, options, env, self)
            }
            // 添加链接在新窗口打开处理
            const LINK_RENDERER = MD.renderer.rules.link_open || function (tokens, idx, options, env, self) {
                return self.renderToken(tokens, idx, options)
            }
            MD.renderer.rules.link_open = function (tokens, idx, options, env, self) {
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
                try {
                    // 读取主题配置
                    const THEME_DATA = (await this.$DB.Configs.get("Theme")).value
                    mermaid.initialize({
                        startOnLoad: true,
                        theme: THEME_DATA === "System" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "default") : THEME_DATA === "Dark" ? "dark" : "default"
                    })
                } catch (error) {
                    this.$log.error(this.name, "mermaid主题初始化错误", error)
                }
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
                            CONTAINER.innerHTML = `
                                <div class="mermaid-toolbar">
                                    <!--第一排-->
                                    <div></div>
                                    <button class="mermaid-toolbar-btn mermaid-move-up">
                                        <svg class="icon" aria-hidden="true">
                                            <use xlink:href="#icon-upArrow"></use>
                                        </svg>
                                    </button>
                                    <button class="mermaid-toolbar-btn mermaid-zoom-in">
                                        <svg class="icon" aria-hidden="true">
                                            <use xlink:href="#icon-zoomIn"></use>
                                        </svg>
                                    </button>
                                    <!--第二排-->
                                    <button class="mermaid-toolbar-btn mermaid-move-left">
                                        <svg class="icon" aria-hidden="true">
                                            <use xlink:href="#icon-leftArrow"></use>
                                        </svg>
                                    </button>
                                    <button class="mermaid-toolbar-btn mermaid-zoom-reset">
                                        <svg class="icon" aria-hidden="true">
                                            <use xlink:href="#icon-reset"></use>
                                        </svg>
                                    </button>
                                    <button class="mermaid-toolbar-btn mermaid-move-right">
                                        <svg class="icon" aria-hidden="true">
                                            <use xlink:href="#icon-rightArrow"></use>
                                        </svg>
                                    </button>
                                    <!--第三排-->
                                    <div></div>
                                    <button class="mermaid-toolbar-btn mermaid-move-down">
                                        <svg class="icon" aria-hidden="true">
                                            <use xlink:href="#icon-downArrow"></use>
                                        </svg>
                                    </button>
                                    <button class="mermaid-toolbar-btn mermaid-zoom-out">
                                        <svg class="icon" aria-hidden="true">
                                            <use xlink:href="#icon-zoomOut"></use>
                                        </svg>
                                    </button>
                                </div>
                                ${svg}
                            `
                            // 插入DOM
                            ELEMENT.replaceWith(CONTAINER)
                            // Mermaid SVG 尺寸初始化
                            const SVG_ELEMENT = CONTAINER.querySelector("svg:not(.icon)")
                            if (SVG_ELEMENT) {
                                SVG_ELEMENT.removeAttribute("width")
                                SVG_ELEMENT.removeAttribute("height")
                                // 获取实际内容高度
                                const G_ELEMENT = SVG_ELEMENT.querySelector("g")
                                const BBOX = G_ELEMENT.getBBox()
                                const MAX_HEIGHT = 400
                                const SCALE = BBOX.height > MAX_HEIGHT ? MAX_HEIGHT / BBOX.height : 1
                                SVG_ELEMENT.setAttribute("viewBox", `0 0 ${BBOX.width} ${BBOX.height + 10.}`)
                                SVG_ELEMENT.style.width = "100%"
                                SVG_ELEMENT.style.height = `${BBOX.height * SCALE}px`
                                SVG_ELEMENT.style.display = "block"
                            }
                            // 处理 SVG 和缩放
                            this.setupZoom(CONTAINER)
                        } catch (error) {
                            this.$log.error(this.name, "mermaid渲染错误", error)
                            ELEMENT.innerHTML = `<div class="mermaid-error">流程图渲染失败</div>`
                        }
                    }
                })
            } catch (error) {
                this.$log.error(this.name, "mermaid初始化错误", error)
            }
        },
        /**
         * 初始化缩放
         * @param container {HTMLElement} - 容器
         */
        setupZoom(container) {
            const SVG = container.querySelector("svg:not(.icon)")
            if (!SVG || !document.body.contains(SVG)) return
            // 初始化 panzoom
            const INSTANCE = panzoom(SVG)
            // 向上移动按钮点击事件
            const MOVE_UP_BTN = container.querySelector(".mermaid-move-up")
            if (!MOVE_UP_BTN) return
            MOVE_UP_BTN.addEventListener("click", () => {
                const PAN = INSTANCE.getPan()
                INSTANCE.pan(PAN.x, PAN.y + 30)
            })
            // 向下移动按钮点击事件
            const MOVE_DOWN_BTN = container.querySelector(".mermaid-move-down")
            if (!MOVE_DOWN_BTN) return
            MOVE_DOWN_BTN.addEventListener("click", () => {
                const PAN = INSTANCE.getPan()
                INSTANCE.pan(PAN.x, PAN.y - 30)
            })
            // 向左移动按钮点击事件
            const MOVE_LEFT_BTN = container.querySelector(".mermaid-move-left")
            if (!MOVE_LEFT_BTN) return
            MOVE_LEFT_BTN.addEventListener("click", () => {
                const PAN = INSTANCE.getPan()
                INSTANCE.pan(PAN.x + 30, PAN.y)
            })
            // 向右移动按钮点击事件
            const MOVE_RIGHT_BTN = container.querySelector(".mermaid-move-right")
            if (!MOVE_RIGHT_BTN) return
            MOVE_RIGHT_BTN.addEventListener("click", () => {
                const PAN = INSTANCE.getPan()
                INSTANCE.pan(PAN.x - 30, PAN.y)
            })
            // 放大按钮点击事件
            const ZOOM_IN_BTN = container.querySelector(".mermaid-zoom-in")
            if (!ZOOM_IN_BTN) return
            ZOOM_IN_BTN.addEventListener("click", () => {
                INSTANCE.zoomIn(0.2)
            })
            // 复位按钮点击事件
            const RESET_BTN = container.querySelector(".mermaid-zoom-reset")
            if (!RESET_BTN) return
            RESET_BTN.addEventListener("click", () => {
                INSTANCE.zoom(1)
                INSTANCE.pan(0, 0)
            })
            // 缩小按钮点击事件
            const ZOOM_OUT_BTN = container.querySelector(".mermaid-zoom-out")
            if (!ZOOM_OUT_BTN) return
            ZOOM_OUT_BTN.addEventListener("click", () => {
                INSTANCE.zoomOut(0.2)
            })
        },
        /**
         * 复制代码
         * @param code {String} - 代码
         */
        copyCode(code) {
            navigator.clipboard.writeText(code).then(() => {
                this.$log.info(this.name, "复制成功", code)
                this.$toast.success(`[${this.name}] ${this.$t("views.AssistantMessageCard.toast.copied")}`)
            }).catch((error) => {
                this.$log.error(this.name, "复制失败", error)
                this.$toast.error(`[${this.name}] ${this.$t("views.AssistantMessageCard.toast.copyFailed")}`)
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
        },
        /**
         * 移除消息
         * @param {string} id 消息ID
         */
        remove(id) {
            EventBus.emit("[function] removeMessage", id)
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
        <div class="MessageBottom">
            <div class="FunctionalControls">
                <Button @click="remove(message.id)">移除</Button>
            </div>
            <div class="MessageInfo">
                <div>
                    [{{ message.model.largeModel }}]
                    -
                    [{{ message.model.model }}]
                    -
                    {{ formatTimestamp(message.timestamp) }}
                </div>
                <div>{{ message.id }}</div>
            </div>
        </div>
        <img :src="modelImages(message.model.largeModel)" :alt="message.model.largeModel" class="ModelLogo">
    </div>
</template>

<style scoped lang="less">
@media screen and (max-width: 768px) {
    .MessageInfo {
        display: none;
    }
}

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

    .MessageBottom {
        margin-top: 8px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        white-space: pre-wrap;
        word-break: break-word;
    }

    &:hover .FunctionalControls {
        opacity: 1;
    }

    .FunctionalControls {
        opacity: 0;
    }

    .MessageInfo {
        font-size: 12px;
        color: var(--chat-dialogue-time-text-color);
    }
}
</style>