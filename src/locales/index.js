import {createI18n} from 'vue-i18n'
import en from './en.json'
import zhCN from './zh-CN.json'

const messages = {
    'en': en,
    'zh-CN': zhCN
}

const i18n = createI18n({
    legacy: false,
    // 默认语言
    locale: 'zh-CN',
    // 回退语言
    fallbackLocale: 'zh-CN',
    messages
})

export default i18n