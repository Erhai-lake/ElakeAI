<script>
import HomeSidebar from "@/components/HomeSidebar.vue"


export default {
    name: "App",
    components: {HomeSidebar},
    created() {
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
                return parseInt(ua.substring(rv + 3, UA.indexOf(".", rv)), 10)
            }
            // 不是 IE
            return false
        }
        const VERSION = getIEVersion()
        if (VERSION) {
            this.$toast.open({message: `妈的, 你还在用 IE ${VERSION}??? 你牛逼!  `})
        }
        // 检查浏览器是否支持 IndexedDB
        if (!"indexedDB" in window) {
            this.$toast.open({message: "很抱歉, 你的浏览器不支持'IndexedDB', 将无法使用该应用的全部功能! 请使用Chrome, Firefox, Edge等现代浏览器!"})
        }
        // 检查浏览器是否支持 IDBTransaction
        if (!"IDBTransaction" in window) {
            this.$toast.open({message: "很抱歉, 你的浏览器不支持'IDBTransaction', 将无法使用该应用的全部功能! 请使用Chrome, Firefox, Edge等现代浏览器!"})
        }

        new this.$DBOperation({
            dbName: this.$DB_CONFIG.name,
            dbVersion: this.$DB_CONFIG.version,
            onUpgrade: (db) => {
                Object.entries(this.$DB_CONFIG.stores).forEach(([name, config]) => {
                    if (!db.objectStoreNames.contains(name)) {
                        db.createObjectStore(name, config)
                    }
                })
            }
        })
    }
}
</script>

<template>
    <HomeSidebar/>
    <router-view/>
</template>

<style lang="less">
#app {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: 100vh;
}
</style>