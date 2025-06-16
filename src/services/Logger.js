import VueLogger from "vuejs3-logger"

export default {
    install(app, options) {
        // 初始化 VueLogger
        const LOGGER_OPTIONS = {
            isEnabled: true,
            logLevel: process.env.NODE_ENV === "production" ? "error" : "debug",
            stringifyArguments: false,
            showLogLevel: true,
            showMethodName: false,
            separator: "|",
            showConsoleColors: true
        }
        // 安装原始 VueLogger
        app.use(VueLogger, LOGGER_OPTIONS)
        // 确保 $log 存在后再扩展
        if (!app.config.globalProperties.$log) {
            app.config.globalProperties.$log = VueLogger.methods
        }
        // 扩展 $log.error 方法
        const originalError = app.config.globalProperties.$log.error
        app.config.globalProperties.$log.error = function (message, ...args) {
            // 1. 调用原始的 error 日志记录
            originalError.call(this, message, ...args)
            // 2. 显示 toast 通知
            // if (app.config.globalProperties.$toast) {
            //     app.config.globalProperties.$toast.error(app.config.globalProperties.$t("error"))
            // }
        }
    }
}