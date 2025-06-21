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
            selectedLang: null
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
            const LANGUAGE_DATA = await this.$DB.configs.get("language")
            const LANGUAGE = LANGUAGE_DATA ? LANGUAGE_DATA.value : "System"
            this.selectedLang = {
                code: LANGUAGE,
                title: this.languages.find(lang => lang.code === LANGUAGE).title,
                images: this.languages.find(lang => lang.code === LANGUAGE).images
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
                if (selectLang.code === "System") {
                    this.$i18n.locale = navigator.language || "zh-CN"
                } else {
                    this.$i18n.locale = selectLang.code
                }
                if (await this.$DB.configs.get("language")) {
                    await this.$DB.configs.put({
                        item: "language",
                        value: selectLang.code
                    })
                } else {
                    await this.$DB.configs.add({
                        item: "language",
                        value: selectLang.code
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
    <div class="language-select">
        <Selector
            :selectorSelected="selectedLang || {}"
            :selectorList="languages"
            uniqueKey="code"
            @update:selectorSelected="updateSelectedLang"/>
    </div>
</template>

<style scoped lang="less">
.language-select {
    width: 240px;
}
</style>