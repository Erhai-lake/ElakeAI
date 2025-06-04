<script>
import LanguagesList from "@/assets/data/LanguagesList"
import Selector from "@/components/Selector.vue"

export default {
    name: "LanguageSelect",
    components: {Selector},
    inject: ["$DB"],
    data() {
        return {
            languages: LanguagesList,
            selectedLang: LanguagesList[0]
        }
    },
    watch: {
        // 监听语言变化
        selectedLang(newVal) {
            this.selectLanguage(newVal)
        }
    },
    async created() {
        // 获取语言
        try {
            const LANGUAGE_DATA = await this.$DB.Configs.get("Language")
            const languages = LANGUAGE_DATA ? LANGUAGE_DATA.value : "zh-CN"
            this.selectedLang = {
                code: languages,
                title: this.languages.find(lang => lang.code === languages).title,
                images: this.languages.find(lang => lang.code === languages).images
            }
            this.$i18n.locale = this.selectedLang.code
        } catch (error) {
            console.error("[Language Switch] 语言获取错误", error)
            this.$toast.error(`[Language Select] ${this.$t("components.LanguageSelect.toast.getLanguageError")}`)
        }
    },
    methods: {
        // 更新选中项
        updateSelectedLang(newVal) {
            this.selectedLang = newVal
        },
        async selectLanguage(selectLang) {
            try {
                if (!selectLang) return
                this.selectedLang = selectLang
                this.$i18n.locale = this.selectedLang.code
                this.isOpen = false
                // 保存设置
                if (await this.$DB.Configs.get("Language")) {
                    await this.$DB.Configs.put({
                        item: "Language",
                        value: this.selectedLang.code
                    })
                } else {
                    await this.$DB.Configs.add({
                        item: "Language",
                        value: this.selectedLang.code
                    })
                }
            } catch (error) {
                console.error("[Language Switch] 语言应用错误", error)
                this.$toast.error(`[Language Select] ${this.$t("components.LanguageSelect.toast.applicationLanguageError")}`)
            }
        }
    }
}
</script>

<template>
    <Selector
        :selectorSelected="selectedLang"
        :selectorList="languages"
        uniqueKey="code"
        @update:selectorSelected="updateSelectedLang"/>
</template>

<style scoped lang="less">
</style>