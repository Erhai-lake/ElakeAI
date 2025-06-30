import {createI18n} from "vue-i18n"
import Logger from "@/services/Logger"

export const i18n = createI18n({
	legacy: false,
	// 默认语言
	locale: "zh-CN",
	// 回退语言
	fallbackLocale: "en-US",
	messages: {},
	missing(locale, key) {
		Logger.warn(`[I18n] 语言缺失: locale=${locale}, key=${key}`)
		return false
	},
	missingWarn: false,
	fallbackWarn: false
})

export default i18n