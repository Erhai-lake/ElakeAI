import Logger from "@/services/Logger"
import {i18n} from "@/services/I18n"

const NAME = "PluginAPI I18nClass"
const LANG_MAP = new Map()

export class I18nClass {
	constructor() {
	}

	/**
	 * 注册语言包
	 * @param info - 语言信息
	 * @param {Object} messages - 对应的语言包对象
	 */
	registerLang(info, messages) {
		if (LANG_MAP.has(info.code)) {
			Logger.warn(`[${NAME}] 语言已存在: ${info.code}`)
			return
		}
		const EXISTING = i18n.global.getLocaleMessage(info.code)
		const MERGED = {...EXISTING, ...messages}
		i18n.global.setLocaleMessage(info.code, MERGED)
		LANG_MAP.set(info.code, info)
		Logger.info(`[${NAME}] 注册语言包: ${info.code}`)
	}

	/**
	 * 移除语言包
	 * @param {string} code - 语言
	 */
	unregisterLang(code) {
		i18n.global.setLocaleMessage(code, null)
		LANG_MAP.delete(code)
		Logger.info(`[${NAME}] 卸载语言包: ${code}`)
	}

	/**
	 * 获取所有已注册的语言
	 * @returns {Array<Object>} 语言列表
	 */
	getAll() {
		return Array.from(LANG_MAP.entries()).map(([code, info]) => ({code, info}))
	}
}

export const i18nRegistry = new I18nClass()