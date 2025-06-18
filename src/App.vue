<script>
import HomeSidebar from "@/components/HomeSidebar.vue"
import Log from "@/components/options/Log.vue"
import Button from "@/components/Button.vue"
import EventBus from "@/services/EventBus";
// import eruda from "eruda"

export default {
    name: "App",
    inject: ["$DB"],
    components: {Button, Log, HomeSidebar},
    data() {
        return {
            name: "App",
            isLogSuspensionWindow: false,
            isLogView: false
        }
    },
    mounted() {
        // 监听日志悬浮窗设置
        EventBus.on("[function] logSuspensionWindow", this.logSuspensionWindow)
    },
    beforeUnmount() {
        // 移除日志悬浮窗设置监听
        EventBus.off("[function] logSuspensionWindow", this.logSuspensionWindow)
    },
    async created() {
        // 移动端调试工具eruda
        // if (process.env.NODE_ENV === "development") {
        //     eruda.init()
        // }
        this.$log.info(`[${this.name}] 环境信息`, this.getEnvInfo())
        const VERSION = this.getIEVersion()
        if (VERSION) {
            this.$log.error(`[${this.name}] 检测到IE浏览器`, VERSION)
            this.$toast.error(`[${this.name}] ${this.$t("app.IEDetected", {version: VERSION})}`)
        }
        // 检查浏览器是否支持 IndexedDB
        if (!"indexedDB" in window) {
            this.$log.error(`[${this.name}] 浏览器不支持'IndexedDB'`)
            this.$toast.error(`[${this.name}] ${this.$t("app.indexedDBNotSupported")}`)
        }
        // 检查浏览器是否支持 IDBTransaction
        if (!"IDBTransaction" in window) {
            this.$log.error(`[${this.name}] 浏览器不支持'IDBTransaction'`)
            this.$toast.error(`[${this.name}] ${this.$t("app.iDBTransactionNotSupported")}`)
        }
        await this.configInitialization()
    },
    methods: {
        /**
         * 获取运行环境信息
         */
        getEnvInfo() {
            const UA = navigator.userAgent
            // 浏览器检测
            let browser = "Unknown"
            let version = "Unknown"
            if (UA.indexOf("Firefox") > -1) {
                browser = "Firefox"
                version = UA.match(/Firefox\/(\d+)/)?.[1] || version;
            } else if (UA.indexOf("Edg") > -1) {
                browser = "Microsoft Edge"
                version = UA.match(/Edg\/(\d+)/)?.[1] || version;
            } else if (UA.indexOf("Chrome") > -1) {
                browser = "Google Chrome"
                version = UA.match(/Chrome\/(\d+)/)?.[1] || version;
            } else if (UA.indexOf("Safari") > -1) {
                browser = "Safari"
                version = UA.match(/Version\/(\d+)/)?.[1] || version;
            }
            // 操作系统检测
            let os = "Unknown"
            if (UA.indexOf("Windows") > -1) os = "Windows"
            else if (UA.indexOf("Mac") > -1) os = "MacOS"
            else if (UA.indexOf("Linux") > -1) os = "Linux"
            else if (UA.indexOf("Android") > -1) os = "Android"
            else if (UA.indexOf("iPhone") > -1 || UA.indexOf("iPad") > -1) os = "iOS"

            // 设备类型
            const IS_MOBILE = /Mobi|Android|iPhone|iPad|iPod/i.test(UA)
            const DEVICE_TYPE = IS_MOBILE ? "Mobile" : "Desktop"
            return {
                browser: `${browser} v${version}`,
                os: os,
                deviceType: DEVICE_TYPE,
                screen: `${window.screen.width}x${window.screen.height}`,
                viewport: `${window.innerWidth}x${window.innerHeight}`,
                language: navigator.language || navigator.userLanguage,
                online: navigator.onLine,
                cookieEnabled: navigator.cookieEnabled
            }
        },
        /**
         * 获取IE版本号
         */
        getIEVersion() {
            // 检查浏览器是否为IE
            const UA = window.navigator.userAgent
            const MSIE = UA.indexOf("MSIE ")
            const TRIDENT = UA.indexOf("Trident/")
            if (MSIE > 0) {
                // IE10 及以下: 直接解析版本号
                return parseInt(UA.substring(MSIE + 5, UA.indexOf(".", MSIE)), 10)
            } else if (TRIDENT > 0) {
                // IE11: Trident/7.0 表示 IE11
                const rv = UA.indexOf("rv:")
                return parseInt(UA.substring(rv + 3, UA.indexOf(".", rv)), 10)
            }
            // 不是 IE
            return false
        },
        /**
         * 配置初始化
         */
        async configInitialization() {
            let info = {}
            try {
                // 应用主题
                const THEME_DATA = await this.$DB.configs.get("Theme")
                const THEME = THEME_DATA ? THEME_DATA.value : "System"
                if (THEME === "System") {
                    const SYSTEM_THEME = window.matchMedia("(prefers-color-scheme: dark)").matches ? "Dark" : "Light"
                    document.documentElement.setAttribute("data-theme", SYSTEM_THEME)
                    info.Theme = SYSTEM_THEME
                } else {
                    document.documentElement.setAttribute("data-theme", THEME)
                    info.Theme = THEME
                }

                // 应用语言
                const LANGUAGE_DATA = await this.$DB.configs.get("Language")
                const LANGUAGE = LANGUAGE_DATA ? LANGUAGE_DATA.value : "System"
                if (LANGUAGE === "System") {
                    const SYSTEM_LANG = window.navigator.language || "zh-CN"
                    this.$i18n.locale = SYSTEM_LANG
                    info.Language = SYSTEM_LANG
                } else {
                    this.$i18n.locale = LANGUAGE
                    info.Language = LANGUAGE
                }
                // Log悬浮窗
                const LOG_SUSPENSION_WINDOW_DATA = await this.$DB.configs.get("LogSuspensionWindow")
                this.isLogSuspensionWindow = LOG_SUSPENSION_WINDOW_DATA ? LOG_SUSPENSION_WINDOW_DATA.value : false
                info.LogSuspensionWindow = this.isLogSuspensionWindow
                this.$log.info(`[${this.name}] 初始化配置`, info)
            } catch (error) {
                this.$log.error(`[${this.name}] 配置初始化失败`, error)
                this.$toast.error(`[${this.name}] ${this.$t("app.configInitializationError")}`)
            }
        },
        /**
         * 日志悬浮窗
         */
        logSuspensionWindow() {
            this.isLogSuspensionWindow = !this.isLogSuspensionWindow
        }
    }
}
</script>

<template>
    <HomeSidebar/>
    <div class="RouterView">
        <router-view/>
    </div>
    <Button class="IsLog" v-if="isLogSuspensionWindow" @click="isLogView = !isLogView">Log</Button>
    <div class="IsLogSuspensionWindow" v-if="isLogView && isLogSuspensionWindow">
        <Log/>
    </div>
</template>

<style lang="less">
#app {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: 100vh;
    overflow: hidden;
}

.RouterView {
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb-color) var(--scrollbar-track-color);
}

.IsLog {
    position: absolute;
    top: 10px;
    right: 10px;
    cursor: pointer;
    z-index: 3;
}

.IsLogSuspensionWindow {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 600px;
    z-index: 3;
}
</style>