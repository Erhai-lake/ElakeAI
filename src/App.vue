<script>
import HomeSidebar from "@/components/HomeSidebar.vue"
// import eruda from "eruda"

export default {
    name: "App",
    inject: ["$DB"],
    components: {HomeSidebar},
    async created() {
        // 移动端调试工具eruda
        // if (process.env.NODE_ENV === "development") {
        //     eruda.init()
        // }
        // 检查浏览器是否为IE, 获取IE版本号
        const getIEVersion = () => {
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
        }
        const VERSION = getIEVersion()
        if (VERSION) {
            this.$toast.success(`妈的, 你还在用 IE ${VERSION}??? 你牛逼!`)
        }
        // 检查浏览器是否支持 IndexedDB
        if (!"indexedDB" in window) {
            this.$toast.error("很抱歉, 你的浏览器不支持'IndexedDB', 将无法使用该应用的全部功能! 请使用Chrome, Firefox, Edge等现代浏览器! 请谅解!")
        }
        // 检查浏览器是否支持 IDBTransaction
        if (!"IDBTransaction" in window) {
            this.$toast.error("很抱歉, 你的浏览器不支持'IDBTransaction', 将无法使用该应用的全部功能! 请使用Chrome, Firefox, Edge等现代浏览器! 请谅解!")
        }

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
            console.error("[App] 配置初始化应用错误", error)
            this.$toast.error("[App] 配置初始化应用错误")
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