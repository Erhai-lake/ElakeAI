<script lang="ts">
import HomeSidebar from "@/components/HomeSidebar.vue"
import ThemeSelect from "@/components/ThemeSwitch.vue";

export default {
    name: 'App',
    components: {ThemeSelect, HomeSidebar},
}
</script>

<template>
    <!--    <div>-->
    <HomeSidebar/>
    <router-view/>
    <!--        <h1>当前主题: {{ currentTheme }}</h1>-->
    <!--            <button @click="toggleTheme" class="theme-toggle">-->
    <!--                {{ currentTheme === 'light' ? '🌙 夜间模式' : '☀️ 白天模式' }}-->
    <!--            </button>-->
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