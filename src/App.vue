<script>
import HomeSidebar from "@/components/HomeSidebar.vue"

export default {
    name: 'App',
    components: {HomeSidebar}
}
</script>

<template>
    <HomeSidebar/>
    <router-view/>
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