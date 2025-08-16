import {createApp} from "vue"

const eventBus = createApp({}).config.globalProperties

const EVENT_MAP = new Map()

/**
 * 事件订阅
 * @param event 事件名
 * @param callback 事件回调
 */
eventBus.on = function (event, callback) {
	if (!this._events) this._events = {}
	if (!this._events[event]) {
		this._events[event] = []
	}
	this._events[event].push(callback)
	// 统计事件名
	if (!EVENT_MAP.has(event)) {
		EVENT_MAP.set(event, 0)
	}
	EVENT_MAP.set(event, EVENT_MAP.get(event) + 1)
}

/**
 * 取消事件订阅
 * @param event 事件名
 * @param callback 事件回调
 */
eventBus.off = function (event, callback) {
	if (!this._events || !this._events[event]) return
	if (!callback) {
		const COUNT = this._events[event].length
		this._events[event] = []
		EVENT_MAP.set(event, EVENT_MAP.get(event) - COUNT)
	} else {
		const BEFORE_COUNT = this._events[event].length
		this._events[event] = this._events[event].filter(cb => cb !== callback)
		const REMOVED_COUNT = BEFORE_COUNT - this._events[event].length
		EVENT_MAP.set(event, EVENT_MAP.get(event) - REMOVED_COUNT)
	}
	// 如果没有订阅回调了就删掉
	if (EVENT_MAP.get(event) <= 0) {
		EVENT_MAP.delete(event)
	}
}

/**
 * 触发事件
 * @param event 事件名
 * @param args 事件参数
 */
eventBus.emit = function (event, ...args) {
	if (this._events && this._events[event]) {
		this._events[event].forEach(callback => callback(...args))
	}
	// 记录 emit 的事件
	if (!EVENT_MAP.has(event)) {
		EVENT_MAP.set(event, 0)
	}
}

/**
 * 用于 DevTools 读取当前活动的事件
 * @returns {any[]}
 */
eventBus.getAllEvents = function() {
	return Array.from(EVENT_MAP.keys())
}
export default eventBus