<script lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue'
import {useStore} from 'vuex'
import HomeSidebar from "@/components/HomeSidebar.vue"

// 彩虹模式参数配置
const THEME_CONFIG = {
    // 持续时间(毫秒)
    rainbowDuration: 10000,
    // 颜色变化间隔(毫秒)
    colorChangeInterval: 50,
    // 触发次数
    triggerCount: 10,
    // 间隔超过1秒重置计数
    resetTimeout: 1000,
    // 默认主题
    defaultTheme: 'light'
} as const

type ThemeMode = 'light' | 'dark'

export default {
    name: 'App',
    components: {HomeSidebar},
    setup() {
        const store = useStore()
        const currentTheme = computed(() => store.getters.currentTheme as ThemeMode)
        const toggleCount = ref(0)
        let resetTimer: ReturnType<typeof setTimeout> | null = null
        let rainbowInterval: ReturnType<typeof setInterval> | null = null
        // 主题操作方法
        const themeMethods = {
            // 切换主题
            switchTheme(newTheme: ThemeMode) {
                store.dispatch('switchTheme', newTheme)
                localStorage.setItem('user-theme', newTheme)
                document.documentElement.setAttribute('data-theme', newTheme)
                void document.body.offsetWidth // 触发重绘
            },
            // 初始化主题
            initializeTheme() {
                const savedTheme = (localStorage.getItem('user-theme') || THEME_CONFIG.defaultTheme) as ThemeMode
                themeMethods.switchTheme(savedTheme)
            },
            // 监听系统主题变化
            handleSystemThemeChange(e: MediaQueryListEvent) {
                const newTheme = e.matches ? 'dark' : 'light'
                themeMethods.switchTheme(newTheme)
            }
        }
        // 彩虹特效方法
        const rainbowMethods = {
            cssVariables: [
                '--background-color',
                '--text-color',
                '--scrollbar-track-color',
                '--scrollbar-thumb-color',
                '--sidebar-expand-container-background-color',
                '--sidebar-expand-container-text-color',
                '--border-right-color'
            ],
            // 生成随机颜色
            getRandomColor() {
                return `#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')}`
            },
            // 启动彩虹模式
            activate() {
                const startTime = Date.now()
                rainbowInterval = setInterval(() => {
                    // 批量修改CSS变量
                    this.cssVariables.forEach(variable => {
                        document.documentElement.style.setProperty(variable, this.getRandomColor())
                    })
                    if (Date.now() - startTime >= THEME_CONFIG.rainbowDuration) {
                        this.stop()
                        themeMethods.switchTheme(THEME_CONFIG.defaultTheme)
                    }
                }, THEME_CONFIG.colorChangeInterval)
            },
            // 停止彩虹模式
            stop() {
                if (rainbowInterval) {
                    clearInterval(rainbowInterval)
                    // 重置CSS变量
                    this.cssVariables.forEach(variable => {
                        document.documentElement.style.removeProperty(variable)
                    })
                }
            }
        }
        // 计数器管理
        const counterMethods = {
            increment() {
                toggleCount.value++
                if (toggleCount.value === THEME_CONFIG.triggerCount) {
                    this.showConfirmation()
                    toggleCount.value = 0
                }
            },
            // 显示确认框
            showConfirmation() {
                const confirmed = confirm(
                    '🎉 彩蛋触发! 即将开启炫彩模式\n' +
                    '⚠️ 光敏性癫痫患者请点「取消」\n' +
                    '确认开启后将持续10秒'
                )
                confirmed && rainbowMethods.activate()
            },
            // 重置计数器
            resetCounter() {
                if (resetTimer) clearTimeout(resetTimer)
                resetTimer = setTimeout(() => {
                    toggleCount.value = 0
                }, THEME_CONFIG.resetTimeout)
            }
        }
        // 主题切换入口方法
        const toggleTheme = () => {
            counterMethods.resetCounter()
            const newTheme: ThemeMode = currentTheme.value === 'light' ? 'dark' : 'light'
            themeMethods.switchTheme(newTheme)
            counterMethods.increment()
        }
        // 生命周期钩子
        onMounted(() => {
            themeMethods.initializeTheme()
            if (window.matchMedia) {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
                mediaQuery.addEventListener('change', themeMethods.handleSystemThemeChange)
                onUnmounted(() => {
                    mediaQuery.removeEventListener('change', themeMethods.handleSystemThemeChange)
                    rainbowMethods.stop()
                    if (resetTimer) clearTimeout(resetTimer)
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
#app {
    width: 100%;
    height: 100vh;
    display: flex;
}
</style>