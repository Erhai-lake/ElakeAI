const EN_US = require("./en-US")
let I18nClass = null

module.exports = {
	onRegister(ctx) {
		I18nClass = new ctx.api.I18nClass("zh-CN")
		I18nClass.register(EN_US)
	},
	onUnload() {
		I18nClass.unregister()
	}
}
