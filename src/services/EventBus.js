import {createApp} from 'vue'

const eventBus = createApp({}).config.globalProperties

eventBus.on = function (event, callback) {
    if (!this._events) this._events = {}
    if (!this._events[event]) {
        this._events[event] = []
    }
    this._events[event].push(callback)
}

eventBus.off = function (event, callback) {
    if (!this._events || !this._events[event]) return
    if (!callback) {
        this._events[event] = []
    } else {
        this._events[event] = this._events[event].filter(cb => cb !== callback)
    }
}

eventBus.emit = function (event, ...args) {
    if (this._events && this._events[event]) {
        this._events[event].forEach(callback => {
            callback(...args)
        })
    }
}
export default eventBus