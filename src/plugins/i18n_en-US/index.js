const EN_US = require("./en-US")

let I18nClass = null
const LANG_INFO = {
	name: "en-US",
	logo: "https://flagcdn.com/us.svg"
}

module.exports = {
	onRegister(ctx) {
		I18nClass = new ctx.api.I18nClass()
		I18nClass.registerLang(LANG_INFO, EN_US)
	},
	onUnload() {
		I18nClass.unregisterLang(LANG_INFO.name)
	}
}
