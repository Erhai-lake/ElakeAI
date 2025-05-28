import {createI18n} from "vue-i18n"
import LanguagesList from "@/assets/data/LanguagesList"
import enUS from "./en-US.json"
import zhCN from "./zh-CN.json"

const messages = {
    "zh-CN": zhCN,
    "en-US": enUS
}

const i18n = createI18n({
    legacy: false,
    // 默认语言
    locale: LanguagesList[0].code,
    // 回退语言
    fallbackLocale: LanguagesList[0].code,
    messages
})

export default i18n