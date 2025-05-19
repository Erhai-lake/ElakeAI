<script>
import HomeSidebar from "@/components/HomeSidebar.vue"
import ThemeSelect from "@/components/ThemeSwitch.vue"

export default {
    name: 'App',
    components: {ThemeSelect, HomeSidebar}
}
</script>

<template>
    <HomeSidebar/>
    <router-view/>
    <ThemeSelect/>
    <!--  <nav>-->
    <!--    <router-link to="/">Home</router-link>-->
    <!--  </nav>-->
    <!--    </div>-->
</template>

<style lang="less">
#app {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: 100vh;
}
</style>