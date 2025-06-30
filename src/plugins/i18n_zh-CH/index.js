const ZH_CN = require("./zh-CN")

let I18nClass = null

module.exports = {
	onRegister(ctx) {
		I18nClass = new ctx.api.I18nClass("zh-CN")
		I18nClass.register(ZH_CN)
	},
	onUnload() {
		I18nClass.unregister()
	}
}
