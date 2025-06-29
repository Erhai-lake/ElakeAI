import axios from "axios";

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
	 * 错误处理
	 * @param {Object} error - 错误对象
	 * @param {Object} params - 请求参数
	 * @returns {{data: *, error: (string|string), traceability: *, timestamp: number}} 错误信息
	 */
	errorHandler = (error, params) => {
		try {
			if (error.response.status !== 200) {
				// return this.response(params, null, `${this.platform}.${error.response.status}`)
			}
			if (error.code === "ECONNABORTED") {
				// 处理超时错误
				return this.response(params, null, "requestTimeout")
			}
			if (error.code === "ERR_BAD_REQUEST") {
				// 处理错误的请求
				return this.response(params, null, "badRequest")
			}
			if (error.code === "ERR_NETWORK") {
				// 处理网络错误
				return this.response(params, null, "networkError")
			}
			if (error.response) {
				return this.response(params, null, "getError")
			}
			if (error.request) {
				// 请求已发出但没有收到响应
				return this.response(params, null, "noResponse")
			}
			// 其他未知错误
			return this.response(params, null, "unknownError")
		} catch (error) {
			return this.response(params, null, "unknownError")
		}
	}
}
