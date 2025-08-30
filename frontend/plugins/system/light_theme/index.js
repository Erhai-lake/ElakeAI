import ZH_CN from "./lang/zh-CN.json"
import EN_US from "./lang/en-US.json"

let context = {}
const THEME_INFO = {
	code: "light",
	name: "Plugins.lightThemeName",
	icon: "https://openmoji.org/data/color/svg/1F31E.svg",
	theme: {
		// 主题色
		"--theme-color": "#80ceff",
		// 滚动条轨道颜色
		"--scrollbar-track-color": "rgba(255, 255, 255, 0.5)",
		// 滚动条滑块颜色
		"--scrollbar-thumb-color": "rgba(193, 193, 193, 0.6)",
		// 滚动条滑块悬停颜色
		"--scrollbar-thumb-hover-color": "rgba(168, 168, 168, 0.78)",
		// 背景颜色
		"--background-color": "#ffffff",
		// 背景颜色(反)
		"--background-color-anti": "#292A2D",
		// 文字颜色
		"--text-color": "#434344",
		// 文字颜色(反)
		"--text-color-anti": "#E4E4E7",
		// 次要文字颜色
		"--text-secondary-color": "#b9bdbe",
		// 边框颜色
		"--border-color": "#6C787F",
		// 阴影颜色
		"--box-shadow-color": "rgba(0, 0, 0, 0.2)",
		// 阴影颜色(反)
		"--box-shadow-color-anti": "rgba(255, 255, 255, 0.2)",
		// 禁用背景颜色
		"--disabled-background-color": "#dedede",
		// 禁用文字颜色
		"--disabled-text-color": "#000000",
		// 按钮鼠标悬停背景颜色
		"--button-hover-background-color": "#dadada",
		// 按钮激活背景颜色
		"--button-active-background-color": "#c3c3c3",
		// 侧边栏容器背景颜色
		"--sidebar-expand-container-background-color": "rgba(249, 251, 255, 0.5)",
		// 侧边栏容器信息文字颜色
		"--sidebar-expand-container-info-text-color": "#5b5b5b",
		// 侧边栏容器信息文字颜色(反)
		"--sidebar-expand-container-info-text-color-anti": "#a9abad",
		// 侧边栏项目悬停背景颜色
		"--sidebar-item-hover-background-color": "#dadada",
		// 聊天输入框按钮边框颜色
		"--chat-input-button-border-color": "#d3d3d3",
		// 聊天输入框附件按钮背景颜色
		"--chat-input-attachment-button-text-color": "#d3d3d3",
		// 聊天输入框附件按钮文字颜色
		"--chat-input-attachment-button-background-color": "#d3d3d3",
		// 聊天系统背景颜色
		"--chat-system-background-color": "rgba(227, 205, 205, 0.7)",
		// 聊天系统文字颜色
		"--chat-system-text-color": "#464646",
		// 聊天用户背景颜色
		"--chat-user-background-color": "rgba(227, 242, 253, 0.7)",
		// 聊天用户文字颜色
		"--chat-user-text-color": "#464646",
		// 聊天助手背景颜色
		"--chat-assistant-background-color": "rgba(245, 245, 245, 0.7)",
		// 聊天助手文字颜色
		"--chat-assistant-text-color": "#464646",
		// 聊天对话框时间文字颜色
		"--chat-dialogue-time-text-color": "#868788",
		// 聊天免责声明文字颜色
		"--chat-disclaimer-text-color": "#868788",
		// 引用块文字颜色
		"--blockquote-text-color": "#57606a",
		// 引用块边框颜色
		"--blockquote-border-color": "#d0d7de",
		// 引用块背景颜色
		"--blockquote-bg-color": "rgba(175, 184, 193, 0.1)",
		// 表格选中背景颜色
		"--active-background-color": "rgba(189, 229, 255, 0.5)",
		// 表格选中背景颜色(反)
		"--active-background-color-anti": "rgba(107, 130, 145, 0.5)",
		// 加载中遮罩背景颜色
		"--loading-mask-background-color": "rgba(255, 255, 255, 0.6)",
		// 加载中动画边框颜色
		"--loading-spinner-border-color": "rgba(255, 255, 255, 0.1)",
		// 右键菜单背景颜色
		"--right-click-menu-background-color": "#F9FBFF",
		// 右键菜单背景颜色(反)
		"--right-click-menu-background-color-anti": "#212327"
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
