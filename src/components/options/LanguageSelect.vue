<script>
import LanguagesList from "@/assets/data/LanguagesList.json"
import Selector from "@/components/Selector.vue"

export default {
    name: "LanguageSelect",
    components: {Selector},
    inject: ["$DB"],
    data() {
        return {
            name: "LanguageSelect",
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
            this.$log.error(this.name, "语言获取错误", error)
            this.$toast.error(`[${this.name}] ${this.$t("components.LanguageSelect.toast.getLanguageError")}`)
        }
    },
    methods: {
        /**
         * 更新选中的语言
         * @param newVal {Object} - 新的选中语言
         */
        updateSelectedLang(newVal) {
            this.selectedLang = newVal
        },
        /**
         * 选择语言
         * @param selectLang {Object} - 选中的语言
         */
        async selectLanguage(selectLang) {
            try {
                if (!selectLang) return
                this.selectedLang = selectLang
                this.$i18n.locale = this.selectedLang.code
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
                this.$log.error(this.name, "语言应用错误", error)
                this.$toast.error(`[${this.name}] ${this.$t("components.LanguageSelect.toast.applicationLanguageError")}`)
            }
        }
    }
}
</script>

<template>
    <div class="LanguageSelect">
        <Selector
            :selectorSelected="selectedLang"
            :selectorList="languages"
            uniqueKey="code"
            @update:selectorSelected="updateSelectedLang"/>
    </div>
</template>

<style scoped lang="less">
.LanguageSelect {
    width: 240px;
}
</style>