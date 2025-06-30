const EN_US = require("./en-US")

let I18nClass = null
const LANG_INFO = {
	code: "en-US",
	title: "English",
	image: "https://flagcdn.com/us.svg"
}

module.exports = {
	onRegister(ctx) {
		I18nClass = new ctx.api.I18nClass()
		I18nClass.registerLang(LANG_INFO, EN_US)
	},
	onUnload() {
		I18nClass.unregisterLang(LANG_INFO.code)
	}
}
