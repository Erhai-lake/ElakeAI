import axios from "axios"
import StreamChatHandlerClass from "@/services/plugin/api/StreamChatHandlerClass"

export class PublicClass {
	constructor() {
	}

	/**
	 * 统一格式的响应封装
	 * @param {Object} traceability - 追踪信息
	 * @param {*} data - 响应数据
	 * @param {string|null} error - 错误信息(可选)
	 * @returns {{data: *, error, traceability: *, timestamp: *|number}}
	 */
	response = (traceability, data, error = "") => {
		return {
			traceability: traceability,
			data: data,
			error: error,
			timestamp: Date.now()
		}
	}

	/**
	 * 创建API客户端
	 * @param {Object} keyData - Key数据
	 * @param {number} timeout - 超时时间(可选, 默认10000ms)
	 * @returns {Object} API客户端
	 */
	createClient = (keyData, timeout = 10000) => {
		return axios.create({
			baseURL: keyData.url,
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${keyData.value}`
			},
			timeout: timeout
		})
	}

	/**
	 * 创建流聊天处理器
	 * @param {string} platform - 平台名称
	 */
	streamChatHandler = (platform) => {
		return new StreamChatHandlerClass(platform)
	}

	/**
	 * 处理聊天错误
	 * @param {Error} error - 错误对象
	 * @param {Object} params - 请求参数
	 * @returns {{data: *, error, traceability: *, timestamp: *|number}} 错误响应
	 */
	handleChatError = (error, params) => {
		if (error.name === "AbortError") {
			return this.response(params, null, "requestCancelled")
		}
		if (error.message.includes("Failed to fetch")) {
			return this.response(params, null, "networkError")
		} else if (error.message.includes("Unexpected token")) {
			return this.response(params, null, "invalidResponse")
		}
		return this.response(params, null, "requestFailed")
	}

	/**
	 * 防抖
	 * @param {Function} func - 要防抖的函数
	 * @param {number} delay - 防抖延迟时间(毫秒)
	 * @returns {Function} 防抖后的函数
	 */
	debounce = (func, delay) => {
		let timeoutId
		return function (...args) {
			clearTimeout(timeoutId)
			timeoutId = setTimeout(() => {
				func.apply(this, args)
			}, delay)
		}
	}
}

export const publicRegistry = new PublicClass()