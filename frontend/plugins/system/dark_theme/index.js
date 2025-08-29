import ZH_CN from "./lang/zh-CN.json"
import EN_US from "./lang/en-US.json"

let context = {}
const THEME_INFO = {
	code: "dark",
	name: "Plugins.darkThemeName",
	icon: "https://openmoji.org/data/color/svg/1F319.svg",
	theme: {
		// 主题色
		"--theme-color": "#80ceff",
		// 滚动条轨道颜色
		"--scrollbar-track-color": "rgba(255, 255, 255, 0.8)",
		// 滚动条滑块颜色
		"--scrollbar-thumb-color": "rgba(93, 93, 93, 0.8)",
		// 滚动条滑块悬停颜色
		"--scrollbar-thumb-hover-color": "rgba(0, 0, 0, 0.6)",
		// 背景颜色
		"--background-color": "#292A2D",
		// 背景颜色(反)
		"--background-color-anti": "#ffffff",
		// 文字颜色
		"--text-color": "#E4E4E7",
		// 文字颜色(反)
		"--text-color-anti": "#434344",
		// 边框颜色
		"--border-color": "#b9bdbe",
		// 阴影颜色
		"--box-shadow-color": "rgba(255, 255, 255, 0.2)",
		// 阴影颜色(反)
		"--box-shadow-color-anti": "rgba(0, 0, 0, 0.2)",
		// 禁用背景颜色
		"--disabled-background-color": "#5e5e5e",
		// 禁用文字颜色
		"--disabled-text-color": "#FFFFFF",
		// 按钮鼠标悬停背景颜色
		"--button-hover-background-color": "#818181",
		// 按钮激活背景颜色
		"--button-active-background-color": "#646464",
		// 侧边栏容器背景颜色
		"--sidebar-expand-container-background-color": "rgba(33, 35, 39, 0.5)",
		// 侧边栏容器信息文字颜色
		"--sidebar-expand-container-info-text-color": "#a9abad",
		// 侧边栏容器信息文字颜色(反)
		"--sidebar-expand-container-info-text-color-anti": "#5b5b5b",
		// 侧边栏项目悬停背景颜色
		"--sidebar-item-hover-background-color": "#9D9DA0",
		// 聊天输入框按钮边框颜色
		"--chat-input-button-border-color": "#393939",
		// 聊天输入框附件按钮背景颜色
		"--chat-input-attachment-button-background-color": "#d3d3d3",
		// 聊天输入框附件按钮文字颜色
		"--chat-input-attachment-button-text-color": "#363636",
		// 聊天系统背景颜色
		"--chat-system-background-color": "rgba(79, 70, 70, 0.7)",
		// 聊天系统文字颜色
		"--chat-system-text-color": "#ffffff",
		// 聊天用户背景颜色
		"--chat-user-background-color": "rgba(96, 124, 136, 0.7)",
		// 聊天用户文字颜色
		"--chat-user-text-color": "#fcfcfc",
		// 聊天助手背景颜色
		"--chat-assistant-background-color": "rgba(72, 72, 72, 0.7)",
		// 聊天助手文字颜色
		"--chat-assistant-text-color": "#fcfcfc",
		// 聊天对话框时间文字颜色
		"--chat-dialogue-time-text-color": "#afafaf",
		// 聊天免责声明文字颜色
		"--chat-disclaimer-text-color": "#868788",
		// 引用块文字颜色
		"--blockquote-text-color": "#8b949e",
		// 引用块边框颜色
		"--blockquote-border-color": "#3b434b",
		// 引用块背景颜色
		"--blockquote-bg-color": "rgba(110, 118, 129, 0.2)",
		// 表格选中背景颜色
		"--active-background-color": "rgba(107, 130, 145, 0.5)",
		// 表格选中背景颜色(反)
		"--active-background-color-anti": "rgba(189, 229, 255, 0.5)",
		// 加载中遮罩背景颜色
		"--loading-mask-background-color": "rgba(41, 42, 45, 0.6)",
		// 加载中动画边框颜色
		"--loading-spinner-border-color": "rgba(0, 0, 0, 0.1)",
		// 右键菜单背景颜色
		"--right-click-menu-background-color": "#212327",
		// 右键菜单背景颜色(反)
		"--right-click-menu-background-color-anti": "#F9FBFF"
	}
}

export default {
	/**
	 * 插件注册
	 * @param ctx 插件上下文
	 */
	onRegister(ctx) {
		context = ctx
		// 注册主题
		let ThemeClass = new context.api.ThemeClass()
		ThemeClass.registerTheme(THEME_INFO)
		// 注册语言
		const I18N_CLASS = new context.api.I18nClass()
		I18N_CLASS.registerLang({code: "zh-CN", source: THEME_INFO.code}, ZH_CN)
		I18N_CLASS.registerLang({code: "en-US", source: THEME_INFO.code}, EN_US)
	},
	/**
	 * 插件卸载
	 */
	onUnload() {
		// 注销主题
		let ThemeClass = new context.api.ThemeClass()
		ThemeClass.unregisterTheme(THEME_INFO.name)
		// 注销语言
		const I18N_CLASS = new context.api.I18nClass()
		I18N_CLASS.unregisterLang("zh-CN", THEME_INFO.code)
		I18N_CLASS.unregisterLang("en-US", THEME_INFO.code)
	}
}
