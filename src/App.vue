<script lang="ts">
import {computed, onMounted, onUnmounted} from 'vue'
import {useStore} from 'vuex'
import HomeSidebar from "@/components/HomeSidebar.vue"

export default {
    name: 'App',
    components: {HomeSidebar},
    setup() {
        const store = useStore()
        const currentTheme = computed(() => store.getters.currentTheme)
        const toggleTheme = () => {
            // 切换主题
            const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
            store.dispatch('switchTheme', newTheme)
            // 保存主题到本地存储
            localStorage.setItem('user-theme', newTheme)
            // 动态设置 body 的 data-theme 属性
            document.documentElement.setAttribute('data-theme', newTheme)
            // 强制重新渲染以应用主题变化
            void document.body.offsetWidth
        }

        onMounted(() => {
            // 初始化时读取保存的主题, 若未保存则默认使用浅色主题
            const savedTheme = localStorage.getItem('user-theme') || 'light'
            store.dispatch('switchTheme', savedTheme)
            // 设置 body 的 data-theme 属性
            document.documentElement.setAttribute('data-theme', savedTheme)

            // 监听系统主题变化(检查浏览器是否支持 matchMedia API)
            if (window.matchMedia) {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
                const handleThemeChange = (e: MediaQueryListEvent) => {
                    // 当系统主题变化时, 更新主题
                    const newTheme = e.matches ? 'dark' : 'light'
                    store.dispatch('switchTheme', newTheme)
                    // 保存主题到本地存储
                    localStorage.setItem('user-theme', newTheme)
                    // 动态设置 body 的 data-theme 属性
                    document.documentElement.setAttribute('data-theme', newTheme)
                    // 强制重新渲染以应用主题变化
                    void document.body.offsetWidth
                }
                mediaQuery.addEventListener('change', handleThemeChange)
                // 组件卸载时移除事件监听器
                onUnmounted(() => {
                    mediaQuery.removeEventListener('change', handleThemeChange)
                })
            }
        })
        // 将当前主题和切换主题的函数返回, 供模板使用
        return {
            currentTheme,
            toggleTheme
        }
    }
}
</script>

<template>
<!--    <div>-->
        <HomeSidebar/>
        <h1>当前主题: {{ currentTheme }}</h1>
        <button @click="toggleTheme" class="theme-toggle">
            {{ currentTheme === 'light' ? '🌙 夜间模式' : '☀️ 白天模式' }}
        </button>
        <!--  <nav>-->
        <!--    <router-link to="/">Home</router-link>-->
        <!--  </nav>-->
        <!--  <router-view/>-->
<!--    </div>-->
</template>

<style lang="less">
* {
    margin: 0;
    padding: 0;
    transition: all 0.3s ease-in-out;
}

#app {
    width: 100%;
    height: 100vh;
    display: flex;
}

//全局滚动条
::-webkit-scrollbar {
    //垂直滚动条宽度
    width: 10px;
    //水平滚动条高度
    height: 10px;
}

/* 滚动条轨道 */
::-webkit-scrollbar-track {
    background: var(--scrollbar-track-color);
    border-radius: 4px;
}

/* 滚动条滑块 */
::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb-color);
    border-radius: 4px;
}

/* 滚动条滑块悬停状态 */
::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover-color);
}
</style>