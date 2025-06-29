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
}
