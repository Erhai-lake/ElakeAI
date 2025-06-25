import panzoom from "@panzoom/panzoom"

export function initZoom(container) {
	const TARGET = container.querySelector(".zoom-target") || container.querySelector("svg:not(.icon), .uml-wrapper")
	if (!TARGET) return null
	const INSTANCE = panzoom(TARGET)
	const BTN_MAP = {
		up: ".move-up",
		down: ".move-down",
		left: ".move-left",
		right: ".move-right",
		zoomIn: ".zoom-in",
		zoomOut: ".zoom-out",
		reset: ".zoom-reset"
	}
	const PAN_STEP = 30
	const ZOOM_STEP = 0.2
	const pan = (dx, dy) => {
		const pan = INSTANCE.getPan()
		INSTANCE.pan(pan.x + dx, pan.y + dy)
	}
	for (const [key, selector] of Object.entries(BTN_MAP)) {
		const btn = container.querySelector(selector)
		if (!btn) continue
		btn.addEventListener("click", () => {
			switch (key) {
				case "up":
					pan(0, PAN_STEP)
					break
				case "down":
					pan(0, -PAN_STEP)
					break
				case "left":
					pan(PAN_STEP, 0)
					break
				case "right":
					pan(-PAN_STEP, 0)
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

					const DURATION = 200
					const START_ZOOM = INSTANCE.getScale()
					const START_PAN = INSTANCE.getPan()
					const START_TIME = performance.now()

				function animate(time) {
					const ELAPSED = time - START_TIME
					const T = Math.min(ELAPSED / DURATION, 1)
					// 缓动函数
					const easeOutQuad = x => 1 - (1 - x) * (1 - x)
					const EASED_T = easeOutQuad(T)
					// 缩放插值
					const CURRENT_ZOOM = START_ZOOM + (1 - START_ZOOM) * EASED_T
					INSTANCE.zoom(CURRENT_ZOOM)
					// 平移插值
					const CURRENT_X = START_PAN.x + (0 - START_PAN.x) * EASED_T
					const CURRENT_Y = START_PAN.y + (0 - START_PAN.y) * EASED_T
					INSTANCE.pan(CURRENT_X, CURRENT_Y)
					if (T < 1) {
						requestAnimationFrame(animate)
					} else {
						INSTANCE._isResetting = false
					}
				}

					requestAnimationFrame(animate)
					break
			}
		})
	}
	return INSTANCE
}