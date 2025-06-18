import {createI18n} from "vue-i18n"
import enUS from "./en-US.json"
import zhCN from "./zh-CN.json"

const messages = {
    "zh-CN": zhCN,
    "en-US": enUS
}

const i18n = createI18n({
    legacy: false,
    // 默认语言
    locale: "zh-CN",
    // 回退语言
    fallbackLocale: "zh-CN",
    messages
})

export default i18n