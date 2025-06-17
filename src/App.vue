<script>
import HomeSidebar from "@/components/HomeSidebar.vue"
// import eruda from "eruda"

export default {
    name: "App",
    inject: ["$DB"],
    components: {HomeSidebar},
    data() {
        return {
            name: "App"
        }
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
            try {
                // 应用主题
                const THEME_DATA = await this.$DB.Configs.get("Theme")
                const THEME = THEME_DATA ? THEME_DATA.value : "System"
                if (THEME === "System") {
                    document.documentElement.setAttribute("data-theme", window.matchMedia("(prefers-color-scheme: dark)").matches ? "Dark" : "Light")
                } else {
                    document.documentElement.setAttribute("data-theme", THEME)
                }
                // 应用语言
                const LANGUAGE_DATA = await this.$DB.Configs.get("Language")
                this.$i18n.locale = LANGUAGE_DATA ? LANGUAGE_DATA.value : "zh-CN"
            } catch (error) {
                this.$log.error(`[${this.name}] 配置初始化失败`, error)
                this.$toast.error(`[${this.name}] ${this.$t("app.configInitializationError")}`)
            }
        }
    }
}
</script>

<template>
    <HomeSidebar/>
    <div class="RouterView">
        <router-view/>
    </div>
</template>

<style lang="less">
#app {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: 100vh;
    overflow: hidden;

    .RouterView {
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--scrollbar-thumb-color) var(--scrollbar-track-color);
    }
}
</style>