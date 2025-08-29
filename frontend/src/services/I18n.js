import {createI18n} from "vue-i18n"
import Logger from "@/services/Logger"

const MISSING_KEYS = new Set()

export const i18n = createI18n({
	legacy: false,
	// 默认语言
	locale: "zh-CN",
	// 回退语言
	fallbackLocale: "en-US",
	messages: {},
	missing(locale, key) {
		const ID = `${locale}:${key}`
		if (!MISSING_KEYS.has(ID)) {
			MISSING_KEYS.add(ID)
			Logger.warn(`[I18n] 语言缺失: locale=${locale}, key=${key}`)
		}
		return `语言缺失${locale}.${key}`
	},
	missingWarn: false,
	fallbackWarn: false
})
