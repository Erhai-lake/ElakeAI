import Logger from "@/services/Logger"
import {PlatformClass} from "@/services/plugin/api/PlatformClass";

const NAME = "PluginAPI ThemeClass"
const THEME_MAP = new Map()

/**
 * 主题类
 */
export class ThemeClass {
	constructor() {
	}

	/**
	 * 注册主题
	 * @param info
	 * @param {Object} info - 主题信息
	 */
	registerTheme = (info) => {
		if (THEME_MAP.has(info.code)) {
			Logger.warn(`[${NAME}] 主题已存在: ${info.code}`)
			return
		}
		THEME_MAP.set(info.code, {info: info})
		Logger.info(`[${NAME}] 主题注册成功: ${info.code}`)
	}

	/**
	 * 注销主题
	 * @param {string} code - 主题代码
	 */
	unregisterTheme = (code) => {
		if (THEME_MAP.has(code)) {
			THEME_MAP.delete(code)
			Logger.info(`[${NAME}] 主题注销成功: ${name}`)
		}
	}

	/**
	 * 获取主题
	 * @param {string} code - 主题代码
	 * @returns {Object|null} 主题信息
	 */
	getTheme = (code) => {
		if (!THEME_MAP.has(code)) {
			Logger.warn(`[${NAME}] 主题不存在: ${code}`)
			return null
		}
		return THEME_MAP.get(code)
	}

	/**
	 * 获取所有主题信息
	 * @returns {Array<Object>} 主题列表
	 */
	getAllThemes = () => {
		console.log(THEME_MAP)
		return Array.from(THEME_MAP.values()).map(theme => theme.info)
	}

	/**
	 * 设置主题
	 * @param {string} code - 主题代码
	 */
	setTheme = (code) => {
		if (!THEME_MAP.has(code)) {
			Logger.warn(`[${NAME}] 主题不存在: ${code}`)
			return
		}
		// 设置主题
		document.documentElement.setAttribute("data-theme", code)
		// 生成 CSS 字符串
		const THEME = THEME_MAP.get(code).info.theme
		const THEME_VARS = Object.entries(THEME).map(([key, value]) => `${key}: ${value};`).join("\n")
		const CSS = `[data-theme="${code}"] {\n${THEME_VARS}\n}`
		// 注入到 <style id="custom-theme">
		let styleTag = document.getElementById("custom-theme")
		if (!styleTag) {
			styleTag = document.createElement("style")
			styleTag.id = "custom-theme"
			document.head.appendChild(styleTag)
		}
		styleTag.innerHTML = CSS
	}

	/**
	 * 获取当前主题
	 * @returns {string} 当前主题代码
	 */
	getCurrentTheme = () => {
		return document.documentElement.getAttribute("data-theme")
	}
}

export const ThemeRegistry = new ThemeClass()
