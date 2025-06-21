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
					INSTANCE.zoom(1)
					INSTANCE.pan(0, 0)
					break
			}
		})
	}
	return INSTANCE
}