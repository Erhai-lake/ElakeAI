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
		if (LANG_MAP.has(info.name)) {
			Logger.warn(`[${NAME}] 语言已存在: ${info.name}`)
			return
		}
		const EXISTING = i18n.global.getLocaleMessage(info.name)
		const MERGED = {...EXISTING, ...messages}
		i18n.global.setLocaleMessage(info.name, MERGED)
		LANG_MAP.set(info.name, info)
		Logger.info(`[${NAME}] 注册语言包: ${info.name}`)
	}

	/**
	 * 移除语言包
	 * @param {string} name - 语言名称
	 */
	unregisterLang(name) {
		i18n.global.setLocaleMessage(name, {})
		Logger.info(`[${NAME}] 卸载语言包: ${name}`)
	}

	/**
	 * 获取所有已注册的语言
	 * @returns {Array<Object>} 语言列表
	 */
	getAll() {
		return Array.from(LANG_MAP.entries()).map(([name, info]) => ({name, info}))
	}
}

export const i18nRegistry = new I18nClass()