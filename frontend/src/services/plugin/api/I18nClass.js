import Logger from "@/services/Logger"
import {i18n} from "@/services/I18n"

const NAME = "PluginAPI I18nClass"
import LANG_CODE_MAPPING from "./i18n.json"

const LANG_MAP = new Map()

/**
 * 深度合并对象
 */
const deepMerge = (target, source) => {
	for (const KEY in source) {
		if (source[KEY] && typeof source[KEY] === "object" && !Array.isArray(source[KEY])) {
			if (!target[KEY] || typeof target[KEY] !== "object") {
				target[KEY] = {}
			}
			deepMerge(target[KEY], source[KEY])
		} else {
			target[KEY] = source[KEY]
		}
	}
}

// 缓存
const LANG_INFO_CACHE = {}

/**
 * 根据语言 code 获取语言信息
 * @param {string} code - 语言代码，例如 "zh-CN"
 * @returns {Object} 包含 code、title、image 的对象
 */
function getLangInfoFromCode(code) {
	if (LANG_INFO_CACHE[code]) {
		Logger.info(`[${NAME}] 从缓存中获取语言信息: ${code}`, LANG_INFO_CACHE[code])
		return LANG_INFO_CACHE[code]
	}
	const INFO = LANG_CODE_MAPPING.find(item => item.code === code)
	const RESULT = INFO ? {title: INFO.title, image: INFO.image, code: INFO.code} : {code: code, title: code}
	LANG_INFO_CACHE[code] = RESULT
	Logger.info(`[${NAME}] 缓存语言信息: ${code}`, RESULT)
	return RESULT
}

export class I18nClass {
	constructor() {
	}

	/**
	 * 注册语言包(允许重复注册, 将会合并语言)
	 * @param {Object} info - 语言信息, 需包含 code 和可选的 source 来源标识
	 * @param {Object} messages - 对应的语言包对象
	 */
	registerLang(info, messages) {
		if (!info?.code || typeof messages !== "object") return
		// 默认匿名来源使用固定字符串
		const SOURCE = info.source || "anonymous"
		// 查找地区语言信息映射表
		const LANG_INFO = {
			...getLangInfoFromCode(info.code),
			source: SOURCE
		}
		// 初始化该语言记录
		if (!LANG_MAP.has(LANG_INFO.code)) {
			LANG_MAP.set(LANG_INFO.code, {...LANG_INFO, sources: new Map()})
		}
		// 存储或更新来源的语言数据
		const LANG_DATA = LANG_MAP.get(LANG_INFO.code)
		LANG_DATA.sources.set(LANG_INFO.source, {info: LANG_INFO, messages})
		// 合并所有来源的语言包
		const MERGED_MESSAGES = {}
		for (const {messages: srcMessages} of LANG_DATA.sources.values()) {
			deepMerge(MERGED_MESSAGES, srcMessages)
		}
		// 应用到 i18n
		i18n.global.setLocaleMessage(LANG_INFO.code, MERGED_MESSAGES)
		Logger.info(`[${NAME}] ${LANG_MAP.get(LANG_INFO.code).sources.size > 1 ? "合并" : "注册"}语言包: ${LANG_INFO.code} (来源: ${String(LANG_INFO.source)})`)
	}

	/**
	 * 卸载语言包的某个来源
	 * @param {string} code - 语言 code
	 * @param {string|symbol} source - 注册时的来源标识
	 */
	unregisterLang(code, source) {
		if (!LANG_MAP.has(code)) return
		const LANG_DATA = LANG_MAP.get(code)
		// 删除对应来源
		if (LANG_DATA.sources.delete(source)) {
			// 如果该语言还有其他来源, 重新合并
			if (LANG_DATA.sources.size > 0) {
				const MERGED_MESSAGES = {}
				for (const {messages} of LANG_DATA.sources.values()) {
					deepMerge(MERGED_MESSAGES, messages)
				}
				i18n.global.setLocaleMessage(code, MERGED_MESSAGES)
				Logger.info(`[${NAME}] 卸载语言包来源: ${String(source)}, 保留其他来源 (${code})`)
			} else {
				// 没有来源了, 彻底移除该语言
				i18n.global.setLocaleMessage(code, {})
				LANG_MAP.delete(code)
				Logger.info(`[${NAME}] 完全卸载语言: ${code}`)
			}
		}
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

	/**
	 * 切换语言
	 * @param {string} code - 目标语言代码
	 */
	locale(code) {
		try {
			i18n.global.locale.value = code
		} catch (error) {
			Logger.error(`[${NAME}] 切换语言出错`, error)
		}
	}
}

export const i18nRegistry = new I18nClass()