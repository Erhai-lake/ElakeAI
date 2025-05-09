<script lang="ts">
import HomeSidebar from "@/components/HomeSidebar.vue"
import ThemeSelect from "@/components/ThemeSelect.vue";

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

* {
    margin: 0;
    padding: 0;
    transition: all 0.3s ease-in-out;
}

body {
    background-color: var(--background-color);
    color: var(--text-color);
}

//滚动条
::-webkit-scrollbar {
    //垂直滚动条宽度
    width: 10px;
    //水平滚动条高度
    height: 10px;
}

/* 滚动条轨道 */
::-webkit-scrollbar-track {
    background-color: var(--scrollbar-track-color);
    border-radius: 4px;
}

/* 滚动条滑块 */
::-webkit-scrollbar-thumb {
    background-color: var(--scrollbar-thumb-color);
    border-radius: 4px;
}

/* 滚动条滑块悬停状态 */
::-webkit-scrollbar-thumb:hover {
    background-color: var(--scrollbar-thumb-hover-color);
}

// 工具提示
[tooltips] {
    &:hover {
        position: relative;

        &::after {
            content: attr(tooltips);
            position: absolute;
            top: 100%;
            left: 50%;
            padding: 5px;
            transform: translateX(-50%);
            color: var(--text-color);
            background-color: var(--tooltips-background-color);
            border: 1px solid var(--tooltips-border-color);
            font-size: 12px;
            white-space: normal;
            word-wrap: break-word;
            word-break: break-all;
            z-index: 9999;
        }
    }
}
</style>