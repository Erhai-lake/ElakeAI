import {useToast} from "vue-toast-notification"
import "vue-toast-notification/dist/theme-bootstrap.css"

const TOAST = useToast()

export class ToastClass {
	constructor() {
	}

	/**
	 * 打开通知
	 * @param message - 消息内容
	 * @param type - 类型(可选, 默认"error")
	 */
	open = (message, type = "error") => {
		return TOAST.open({
			message: message,
			type: type,
			position: "top",
			dismissible: false
		})
	}

	/**
	 * 打开成功通知
	 * @param message - 消息内容
	 */
	success = (message) => {
		return this.open(message, "success")
	}

	/**
	 * 打开警告通知
	 * @param message - 消息内容
	 */
	warning = (message) => {
		return this.open(message, "warning")
	}

	/**
	 * 打开错误通知
	 * @param message - 消息内容
	 */
	error = (message) => {
		return this.open(message, "error")
	}

	/**
	 * 打开信息通知
	 * @param message - 消息内容
	 */
	info = (message) => {
		return this.open(message, "info")
	}

	/**
	 * 关闭通知
	 * @param toast - 要关闭的通知
	 */
	dismiss = (toast) => {
		toast.dismiss()
	}

	/**
	 * 清除所有通知
	 */
	clear = () => {
		TOAST.clear()
	}
}

export const toastRegistry = new ToastClass()