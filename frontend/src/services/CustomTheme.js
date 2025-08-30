import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

export default {
	async applyCustomTheme(theme = {}) {
		try {
			let themeData = theme
			// 如果 themeData 为空对象, 从 Dexie 中获取自定义主题
			if (themeData) {
				const THEME_DATA = await Dexie.configs.get("customTheme")
				if (!THEME_DATA && !THEME_DATA.value) {
					const SYSTEM_THEME_CODE = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
					document.documentElement.setAttribute("data-theme", SYSTEM_THEME_CODE)
					return
				}
				themeData = THEME_DATA.value
			}
			// 生成 CSS 字符串
			const THEME_VARS = Object.entries(themeData).map(([key, value]) => `${key}: ${value};`).join("\n")
			const CSS = `[data-theme="custom"] {\n${THEME_VARS}\n}`
			// 注入到 <style id="custom-theme">
			let styleTag = document.getElementById("custom-theme")
			if (!styleTag) {
				styleTag = document.createElement("style")
				styleTag.id = "custom-theme"
				document.head.appendChild(styleTag)
			}
			styleTag.innerHTML = CSS
			document.documentElement.setAttribute("data-theme", "custom")
		} catch (error) {
			Logger.error("[CustomTheme] 自定义主题应用失败", error)
		}
	}
}