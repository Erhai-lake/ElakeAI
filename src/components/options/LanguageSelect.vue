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
            const LANGUAGE_DATA = await this.$DB.configs.get("Language")
            const LANGUAGE = LANGUAGE_DATA ? LANGUAGE_DATA.value : "zh-CN"
            if (LANGUAGE === "System") {
                const SYSTEM_LANG = navigator.language || "zh-CN"
                this.selectedLang = this.languages.find(lang => lang.code === SYSTEM_LANG) ||
                    this.languages.find(lang => lang.code.startsWith(SYSTEM_LANG.split("-")[0])) ||
                    this.languages[0]
                this.$i18n.locale = SYSTEM_LANG
            } else {
                this.selectedLang = {
                    code: LANGUAGE,
                    title: this.languages.find(lang => lang.code === LANGUAGE).title,
                    images: this.languages.find(lang => lang.code === LANGUAGE).images
                }
                this.$i18n.locale = this.selectedLang.code
            }
        } catch (error) {
            this.$log.error(`[${this.name}] 语言获取失败`, error)
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
                if (this.selectedLang.code === "System") {
                    this.$i18n.locale = navigator.language || "zh-CN"
                } else {
                    this.$i18n.locale = this.selectedLang.code
                }
                // 保存设置
                if (await this.$DB.configs.get("Language")) {
                    await this.$DB.configs.put({
                        item: "Language",
                        value: this.selectedLang.code
                    })
                } else {
                    await this.$DB.configs.add({
                        item: "Language",
                        value: this.selectedLang.code
                    })
                }
            } catch (error) {
                this.$log.error(`[${this.name}] 语言应用失败`, error)
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