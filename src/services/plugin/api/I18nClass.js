import Logger from "@/services/Logger"
import { i18n } from "@/services/I18n"

const NAME = "PluginAPI I18nClass"

export class I18nClass {
	constructor(locale) {
		this.locale = locale
	}
	/**
	 * 注册语言包
	 * @param {Object} messages - 对应的语言包对象
	 */
	register(messages) {
		if (!this.locale || typeof messages !== "object") return
		const EXISTING = i18n.global.getLocaleMessage(this.locale)
		const MERGED = { ...EXISTING, ...messages }
		i18n.global.setLocaleMessage(this.locale, MERGED)
		Logger.info(`[${NAME}] 注册语言包: ${this.locale}`)
	}
	/**
	 * 移除语言包
	 */
	unregister() {
		i18n.global.setLocaleMessage(this.locale, {})
		Logger.info(`[${NAME}] 卸载语言包: ${this.locale}`)
	}
	/**
	 * 获取所有已注册的语言
	 * @returns {string[]} 语言代码数组
	 */
	getAll() {
		return i18n.global.availableLocales
	}
}

export const i18nRegistry = new I18nClass()