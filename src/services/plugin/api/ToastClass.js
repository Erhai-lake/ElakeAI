import {useToast} from "vue-toast-notification"

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
		return TOAST.success(message)
	}

	/**
	 * 打开警告通知
	 * @param message - 消息内容
	 */
	warning = (message) => {
		return TOAST.warning(message)
	}

	/**
	 * 打开错误通知
	 * @param message - 消息内容
	 */
	error = (message) => {
		return TOAST.error(message)
	}

	/**
	 * 打开信息通知
	 * @param message - 消息内容
	 */
	info = (message) => {
		return TOAST.info(message)
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