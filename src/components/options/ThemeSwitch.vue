<script>
import {defineComponent} from "vue"
import Selector from "@/components/Selector.vue";

export default defineComponent({
    name: "ThemeSelect",
	components: {Selector},
    inject: ["$DB"],
    data() {
        return {
			theme: [
				{
					code: "System",
					title: "i18n:components.ThemeSwitch.system",
					images: ""
				},
				{
					code: "Light",
					title: "i18n:components.ThemeSwitch.light",
					images: ""
				},
				{
					code: "Dark",
					title: "i18n:components.ThemeSwitch.dark",
					images: ""
				}
			],
			selectedTheme: null,
        }
    },
    watch: {
        // 监听主题变化
		selectedTheme(newVal) {
            this.selectTheme(newVal)
        }
    },
    async created() {
        // 获取主题
        try {
            const THEME_DATA = await this.$DB.configs.get("theme")
			const THEME = THEME_DATA ? THEME_DATA.value : "System"
			this.selectedTheme = {
				code: THEME,
				title: this.theme.find(lang => lang.code === THEME).title,
				images: this.theme.find(lang => lang.code === THEME).images
			}
        } catch (error) {
            this.$log.error(`[${this.name}] 主题获取失败`, error)
            this.$toast.error(`[${this.name}] ${this.$t("components.ThemeSwitch.toast.getThemeError")}`)
        }
    },
    methods: {
		/**
		 * 更新选中的主题
		 * @param newVal {Object} - 新的选中主题
		 */
		updateSelectedTheme(newVal) {
			this.selectedTheme = newVal
		},
        /**
         * 选择主题
         * @param theme 主题名称
         */
        async selectTheme(theme) {
            try {
                if (!theme) return
                if (theme.code === "System") {
                    document.documentElement.setAttribute("data-theme", window.matchMedia("(prefers-color-scheme: dark)").matches ? "Dark" : "Light")
                } else {
                    document.documentElement.setAttribute("data-theme", theme.code)
                }
                void document.body.offsetWidth
                // 保存设置
                if (await this.$DB.configs.get("theme")) {
                    await this.$DB.configs.put({
                        item: "theme",
                        value: theme.code
                    })
                } else {
                    await this.$DB.configs.add({
                        item: "theme",
                        value: theme.code
                    })
                }
            } catch (error) {
                this.$log.error(`[${this.name}] 主题应用失败`, error)
                this.$toast.error(`[${this.name}] ${this.$t("components.ThemeSwitch.toast.applicationThemeError")}`)
            }
        }
    }
})
</script>

<template>
    <div class="Switch">
		<Selector
			:selectorSelected="selectedTheme || {}"
			:selectorList="theme"
			uniqueKey="code"
			@update:selectorSelected="updateSelectedTheme"/>
    </div>
</template>

<style scoped lang="less">
.Switch {
	width: 240px;
}
</style>