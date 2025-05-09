<script lang="ts">
import {defineComponent} from 'vue'
import {useStore} from 'vuex'

interface Theme {
    fileName: string
    name: string
}

interface ThemeFile {
    name: string
    theme: [
        {
            key: string
            value: string
        }
    ]
}

export default defineComponent({
    name: "ThemeSelect",
    data() {
        return {
            selectedTheme: '',
            themes: [] as Theme[]
        }
    },
    setup() {
        const store = useStore()
        return {store}
    },
    created() {
        this.getThemes()
        this.selectedTheme = this.store.getters.currentTheme as string
        this.switchTheme(this.selectedTheme)
    },
    methods: {
        /**
         * 获取主题
         */
        getThemes() {
            // Webpack 动态加载上下文
            const context = require.context('@/assets/theme', false, /\.json$/)
            // 获取所有匹配文件的信息
            this.themes = context.keys().map(key => {
                // 加载文件内容
                const content = context(key)
                // 移除文件扩展名作为主题名称
                return {
                    fileName: key.replace(/^\.\/(.*)\.json$/, '$1'),
                    name: content.name,
                }
            })
        },
        /**
         * 切换主题
         * @param theme 主题名称
         */ async switchTheme(theme: string) {
            if (!theme) return
            // 保存主题到 Vuex
            try {
                await this.store.dispatch('switchTheme', theme)
            } catch (error) {
                console.error(`缓存切换的主题 ${theme} 失败:`, error);
            }
            // 读取主题文件
            try {
                const themeFile = await import(`@/assets/theme/${theme}.json`)
                this.applyTheme(themeFile.default || themeFile)
            } catch (error) {
                console.error(`加载主题 ${theme} 失败:`, error);
            }
        },
        /**
         * 应用主题
         * @param themeFile 主题文件
         */
        applyTheme(themeFile: ThemeFile) {
            const root = document.documentElement;
            Object.entries(themeFile.theme).forEach(([, value]) => {
                root.style.setProperty(`--${value.key}`, value.value)
            })
            void document.body.offsetWidth
        }
    }
})
</script>

<template>
    <select v-model="selectedTheme" @change="switchTheme(selectedTheme)">
        <option v-for="(item, index) in this.themes" :key="index" :value="item.fileName">{{ item.name }}</option>
    </select>
</template>

<style scoped lang="less">

</style>