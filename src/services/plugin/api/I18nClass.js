import Logger from "@/services/Logger"
import {i18n} from "@/services/I18n"

const NAME = "PluginAPI I18nClass"
const LANG_MAP = new Map()

export class I18nClass {
	constructor() {
	}

	/**
	 * 注册语言包(允许重复注册, 将会合并语言)
	 * @param info - 语言信息
	 * @param {Object} messages - 对应的语言包对象
	 */
	registerLang(info, messages) {
		if (!info?.code || typeof messages !== "object") return
		const EXISTING_MESSAGES = i18n.global.getLocaleMessage(info.code) || {}
		const MERGED_MESSAGES = {...EXISTING_MESSAGES, ...messages}
		i18n.global.setLocaleMessage(info.code, MERGED_MESSAGES)
		if (LANG_MAP.has(info.code)) {
			// 已注册过, 只合并 info, 但不打印重复警告
			const EXISTING_INFO = LANG_MAP.get(info.code)
			LANG_MAP.set(info.code, {...EXISTING_INFO, ...info})
			Logger.info(`[${NAME}] 合并语言包: ${info.code}`)
		} else {
			// 首次注册
			LANG_MAP.set(info.code, info)
			Logger.info(`[${NAME}] 注册语言包: ${info.code}`)
		}
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

	/**
	 * 根据语言代码获取语言信息
	 * @param {string} code - 语言代码
	 * @returns {Object|null} 语言信息, 或null(未注册)
	 */
	getLangInfo(code) {
		return LANG_MAP.get(code) || null
	}

	/**
	 * 获取当前语言的翻译文本
	 * @param {string} keyPath - 点分路径, 例如 "plugin.welcome"
	 * @param {Object} [params] - 插值参数, 例如 { name: "洱海" }
	 * @returns {string} 翻译文本
	 */
	translate(keyPath, params = {}) {
		try {
				return i18n.global.t(keyPath, params)
		} catch (error) {
			Logger.error(`[${NAME}] 翻译调用出错`, error)
			return keyPath
		}
	}
}

export const i18nRegistry = new I18nClass()