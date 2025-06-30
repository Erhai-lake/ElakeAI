import {createI18n} from "vue-i18n"

export const i18n = createI18n({
	legacy: false,
	// 默认语言
	locale: "zh-CN",
	// 回退语言
	fallbackLocale: "en-US",
	messages: {}
})

export default i18n