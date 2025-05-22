<script>
export default {
    name: "LanguageSelect",
    data() {
        return {
            isOpen: false,
            selectedLang: {
                code: 'zh_cn',
                name: '简体中文',
                flag: 'https://flagcdn.com/cn.svg'
            },
            languages: [
                {code: 'zh_cn', name: '简体中文', flag: 'https://flagcdn.com/cn.svg'},
                {code: 'us', name: 'English', flag: 'https://flagcdn.com/us.svg'}
            ]
        }
    },
    methods: {
        toggleLangList() {
            this.isOpen = !this.isOpen
        },
        selectLanguage(lang) {
            this.selectedLang = lang
            this.isOpen = false
            this.$toast.open({message: `${lang.code} - ${lang.name}`, type: 'success'})
        },
        handleClickOutside(e) {
            if (!this.$el.contains(e.target)) {
                this.isOpen = false
            }
        }
    },
    mounted() {
        document.addEventListener('click', this.handleClickOutside)
    },
    beforeDestroy() {
        document.removeEventListener('click', this.handleClickOutside)
    }
}
</script>

<template>
    <div class="Switch">
        <div class="SelectedLang" :class="{ 'Open': isOpen }" @click="toggleLangList">
            <img :src="selectedLang.flag" class="Flag" :alt="selectedLang.name">
            <span class="LangOption">{{ selectedLang.name }}</span>
        </div>
        <transition name="slide">
            <ul v-show="isOpen" class="LangList">
                <li
                    v-for="lang in languages"
                    :key="lang.code"
                    @click="selectLanguage(lang)">
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
    width: 200px;
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