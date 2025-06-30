const ZH_CN = require("./zh-CN")

let I18nClass = null
const LANG_INFO = {
	code: "zh-CN",
	title: "简体中文",
	image: "https://flagcdn.com/cn.svg",
}

module.exports = {
	onRegister(ctx) {
		I18nClass = new ctx.api.I18nClass()
		I18nClass.registerLang(LANG_INFO, ZH_CN)
	},
	onUnload() {
		I18nClass.unregisterLang(LANG_INFO.code)
	}
}
