import ZH_CN from "./zh-CN.json"

let I18nClass = null
const LANG_INFO = {
	code: "zh-CN",
	source: "i18n_zh-CH"
}

export default {
	onRegister(ctx) {
		I18nClass = new ctx.api.I18nClass()
		I18nClass.registerLang(LANG_INFO, ZH_CN)
	},
	onUnload() {
		I18nClass.unregisterLang(LANG_INFO.code, LANG_INFO.source)
	}
}
