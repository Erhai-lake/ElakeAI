<script>
import HomeSidebar from "@/components/HomeSidebar.vue"


export default {
    name: "App",
    components: {HomeSidebar},
    created() {
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