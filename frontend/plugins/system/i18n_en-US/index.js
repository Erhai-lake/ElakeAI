import EN_US from "./en-US.json"

let I18nClass = null
const LANG_INFO = {
	code: "en-US",
	source: "i18n_en-US"
}

export default {
	onRegister(ctx) {
		// 注册语言
		I18nClass = new ctx.api.I18nClass()
		I18nClass.registerLang(LANG_INFO, EN_US)
	},
	onUnload() {
		// 卸载语言
		I18nClass.unregisterLang(LANG_INFO.code, LANG_INFO.source)
	}
}
