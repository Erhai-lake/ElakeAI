import panzoom from "@panzoom/panzoom"

export function initZoom(container) {
	const TARGET = container.querySelector(".zoom-target") || container.querySelector("svg:not(.icon), .uml-wrapper")
	if (!TARGET) return null
	const INSTANCE = panzoom(TARGET, {
		maxScale: Infinity,
		minScale: 0.1
	})
	const BTN_MAP = {
		up: ".move-up",
		down: ".move-down",
		left: ".move-left",
		right: ".move-right",
		zoomIn: ".zoom-in",
		zoomOut: ".zoom-out",
		reset: ".zoom-reset"
	}
	// 移动步长
	const PAN_STEP = 30
	// 缩放步长
	const ZOOM_STEP = 0.2

	// 处理单击和长按事件
	const addLongPressRepeat = (button, callback, initialDelay = 500, repeatInterval = 100) => {
		let timer = null
		let isRepeating = false
		const start = (event) => {
			// 如果是 touch 事件，阻止默认滚动等行为
			if (event.type === "touchstart") {
				event.preventDefault()
			}
			// 按下立即执行一次
			callback()

			// 500ms 后开始重复执行
			timer = setTimeout(() => {
				isRepeating = true
				timer = setInterval(callback, repeatInterval)
			}, initialDelay)
		}
		const stop = () => {
			if (timer) {
				if (isRepeating) {
					clearInterval(timer)
				} else {
					clearTimeout(timer)
				}
				timer = null
				isRepeating = false
			}
		}
		// 监听器绑定，touch 事件加上 passive: false 以支持 preventDefault
		button.addEventListener("mousedown", start, {passive: true})
		button.addEventListener("touchstart", start, {passive: false})
		button.addEventListener("mouseup", stop, {passive: true})
		button.addEventListener("mouseleave", stop, {passive: true})
		button.addEventListener("touchend", stop, {passive: true})
		button.addEventListener("touchcancel", stop, {passive: true})
	}

	// 处理移动时的平滑过渡
	const animatePan = (targetX, targetY, duration = 200) => {
		const START_PAN = INSTANCE.getPan()
		const START_TIME = performance.now()

		function easeOutQuad(x) {
			return 1 - (1 - x) * (1 - x)
		}

		function step(time) {
			const ELAPSED = time - START_TIME
			const T = Math.min(ELAPSED / duration, 1)
			const EASED_T = easeOutQuad(T)
			const CURRENT_X = START_PAN.x + (targetX - START_PAN.x) * EASED_T
			const CURRENT_Y = START_PAN.y + (targetY - START_PAN.y) * EASED_T
			INSTANCE.pan(CURRENT_X, CURRENT_Y)
			if (T < 1) {
				requestAnimationFrame(step)
			}
		}

		requestAnimationFrame(step)
	}

	// 处理移动
	const pan = (dx, dy) => {
		const CURRENT_PAN = INSTANCE.getPan()
		const TARGET_X = CURRENT_PAN.x + dx
		const TARGET_Y = CURRENT_PAN.y + dy
		animatePan(TARGET_X, TARGET_Y)
	}

	const animateProperty = (duration, onUpdate, onComplete) => {
		const START_TIME = performance.now()

		function easeOutQuad(x) {
			return 1 - (1 - x) * (1 - x)
		}

		function step(time) {
			const ELAPSED = time - START_TIME
			const T = Math.min(ELAPSED / duration, 1)
			const EASED_T = easeOutQuad(T)
			onUpdate(EASED_T)
			if (T < 1) {
				requestAnimationFrame(step)
			} else {
				onComplete && onComplete()
			}
		}

		requestAnimationFrame(step)
	}

	for (const [key, selector] of Object.entries(BTN_MAP)) {
		const btn = container.querySelector(selector)
		if (!btn) continue
		const callback = () => {
			switch (key) {
				case "up":
					pan(0, -PAN_STEP)
					break
				case "down":
					pan(0, PAN_STEP)
					break
				case "left":
					pan(-PAN_STEP, 0)
					break
				case "right":
					pan(PAN_STEP, 0)
					break
				case "zoomIn":
					INSTANCE.zoomIn(ZOOM_STEP)
					break
				case "zoomOut":
					INSTANCE.zoomOut(ZOOM_STEP)
					break
				case "reset":
					if (INSTANCE._isResetting) return
					INSTANCE._isResetting = true
					const START_ZOOM = INSTANCE.getScale()
					const START_PAN = INSTANCE.getPan()
					animateProperty(200, (t) => {
						const CURRENT_ZOOM = START_ZOOM + (1 - START_ZOOM) * t
						const CURRENT_X = START_PAN.x + (0 - START_PAN.x) * t
						const CURRENT_Y = START_PAN.y + (0 - START_PAN.y) * t
						INSTANCE.zoom(CURRENT_ZOOM)
						INSTANCE.pan(CURRENT_X, CURRENT_Y)
					}, () => {
						INSTANCE._isResetting = false
					})
					break
			}
		}
		addLongPressRepeat(btn, callback, 500, 100)
	}
	return INSTANCE
}