<script>
import LanguagesList from "@/assets/data/LanguagesList"

export default {
    name: "LanguageSelect",
    inject: ["$DB"],
    data() {
        return {
            isOpen: false,
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
                name: this.languages.find(lang => lang.code === languages).name,
                flag: this.languages.find(lang => lang.code === languages).flag
            }
            this.$i18n.locale = this.selectedLang.code
        } catch (error) {
            console.error("[Language Switch] 语言获取错误", error)
            this.$toast.error(`[Language Select] ${this.$t("components.LanguageSelect.toast.getLanguageError")}`)
        }
    },
    methods: {
        toggleLangList() {
            this.isOpen = !this.isOpen
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
        },
        handleClickOutside(e) {
            if (!this.$el.contains(e.target)) {
                this.isOpen = false
            }
        }
    },
    mounted() {
        document.addEventListener("click", this.handleClickOutside)
    },
    beforeDestroy() {
        document.removeEventListener("click", this.handleClickOutside)
    }
}
</script>

<template>
    <div class="Switch">
        <div class="SelectedLang" :class="{ 'Open': isOpen }" @click="toggleLangList">
            <img class="Flag" :src="this.selectedLang.flag" :alt="this.selectedLang.name">
            <span class="LangOption">{{ this.selectedLang.name }}</span>
        </div>
        <transition name="slide">
            <ul v-show="isOpen" class="LangList">
                <li
                    v-for="lang in languages"
                    :key="lang.code"
                    @click="this.selectedLang = lang"
                    :class="{ 'Active': lang.code === this.selectedLang.code }">
                    <img :src="lang.flag" class="Flag" :alt="lang.name">
                    <span class="LangOption">{{ lang.name }}</span>
                </li>
            </ul>
        </transition>
    </div>
</template>

<style scoped lang="less">
.Switch {
    position: relative;
    width: 240px;
    user-select: none;
}

.SelectedLang {
    display: flex;
    align-items: center;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    background-color: var(--background-color);

    &:hover {
        border-color: #80ceff;
        box-shadow: 0 2px 8px var(--box-shadow-color);
    }
}

.Open {
    border-radius: 8px 8px 0 0;
}

.LangList {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    list-style: none;
    border: 1px solid var(--border-color);
    border-top: none;
    border-radius: 0 0 8px 8px;
    background-color: var(--background-color);
    z-index: 100;
    overflow: hidden;

    li {
        display: flex;
        align-items: center;
        padding: 12px;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
            background-color: var(--background-color-Anti);
            color: var(--background-color);
        }
    }

    .Active {
        --Active-Background-Color: rgba(189, 229, 255, 0.5);
        background-color: var(--Active-Background-Color);
        color: #292A2DFF;

        &:hover {
            background-color: var(--Active-Background-Color);
            color: #292A2DFF;
        }
    }
}

.Flag {
    width: 24px;
    height: 18px;
    margin-right: 12px;
    border-radius: 2px;
    object-fit: cover;
}

.LangOption {
    font-size: 14px;
}

.slide-enter-active,
.slide-leave-active {
    transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>