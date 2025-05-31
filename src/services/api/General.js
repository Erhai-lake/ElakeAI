export default {
    /**
     * 检查API响应是否有效
     * @param {Object} response - API响应对象
     * @returns {boolean} 是否为有效的API响应
     */
    isValidApiResponse(response) {
        const contentType = response.headers["content-type"]
        return contentType && contentType.includes("application/json")
    }
}