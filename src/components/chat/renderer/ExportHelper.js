import Logger from "@/services/Logger"

/**
 * 保存文件
 * @param {Blob} blob - 文件数据
 * @param {string} filename - 文件名
 */
export function saveAsFile(blob, filename) {
	const DOWNLOAD_LINK = document.createElement("a")
	DOWNLOAD_LINK.href = URL.createObjectURL(blob)
	DOWNLOAD_LINK.download = filename
	DOWNLOAD_LINK.click()
	URL.revokeObjectURL(DOWNLOAD_LINK.href)
}

/**
 * 保存为 SVG 文件
 * @param {SVGElement} svgElement - SVG 元素
 * @param {string} [filename="ELakeAI-Diagram.svg"] - 文件名
 */
export function saveAsSvg(svgElement, filename = "ELakeAI-Diagram.svg") {
	const SERIALIZER = new XMLSerializer()
	const SOURCE = SERIALIZER.serializeToString(svgElement)
	const BLOB = new Blob([SOURCE], {
		type: "image/svg+xml;charset=utf-8"
	})
	saveAsFile(BLOB, filename)
}

/**
 * 保存为 PNG 文件
 * @param {SVGElement} svgElement - SVG 元素
 * @param {string} [filename="ELakeAI-Diagram.png"] - 文件名
 */
export function saveAsPng(svgElement, filename = "ELakeAI-Diagram.png") {
	const CLONED_SVG = svgElement.cloneNode(true)
	if (!CLONED_SVG.hasAttribute("xmlns")) {
		CLONED_SVG.setAttribute("xmlns", "http://www.w3.org/2000/svg")
	}

	// 取 viewBox 获取原始尺寸
	const VIEW_BOX = svgElement.getAttribute("viewBox")
	if (!VIEW_BOX) {
		Logger.error("[ExportHelper] SVG 缺少 viewBox")
		return
	}
	const [X, Y, WIDTH, HEIGHT] = VIEW_BOX.split(/\s+/).map(Number)

	// 设置宽高，确保导出时不会裁切
	CLONED_SVG.setAttribute("width", `${WIDTH}px`)
	CLONED_SVG.setAttribute("height", `${HEIGHT}px`)

	// 序列化 SVG 并编码
	const SERIALIZER = new XMLSerializer()
	const SVG_STRING = SERIALIZER.serializeToString(CLONED_SVG)
	const SVG_BASE64 = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG_STRING)}`

	// 创建 Image 元素加载
	const IMG = new Image()
	IMG.crossOrigin = "anonymous"
	IMG.onload = () => {
		try {
			const CANVAS = document.createElement("canvas")
			CANVAS.width = WIDTH * 2
			CANVAS.height = HEIGHT * 2
			const CTX = CANVAS.getContext("2d")
			CTX.scale(2, 2)
			CTX.drawImage(IMG, 0, 0, WIDTH, HEIGHT)

			CANVAS.toBlob(blob => {
				if (blob) {
					saveAsFile(blob, filename)
				} else {
					Logger.error("[ExportHelper] 无法生成PNG Blob")
				}
			}, "image/png")
		} catch (error) {
			Logger.error("[ExportHelper] 转换为PNG时出错", error)
		}
	}

	IMG.onerror = (error) => {
		Logger.error("[ExportHelper] 图片加载失败", {
			error,
			svgString: SVG_STRING,
			base64: SVG_BASE64
		})
	}

	IMG.src = SVG_BASE64
}

/**
 * 初始化保存按钮事件
 * @param {HTMLElement} container - 按钮所在容器
 * @param {SVGElement} svgElement - 要保存的 SVG 元素
 */
export function initSaveButtons(container, svgElement) {
	const BTN_SVG = container.querySelector(".save-svg")
	const BTN_PNG = container.querySelector(".save-png")
	if (BTN_SVG) BTN_SVG.addEventListener("click", () => saveAsSvg(svgElement))
	if (BTN_PNG) BTN_PNG.addEventListener("click", () => saveAsPng(svgElement))
}

export async function fetchSvgElementFromUrl(url) {
	const RESPONSE = await fetch(url)
	const SVG_STRING = await RESPONSE.text()
	const PARSER = new DOMParser()
	const SVG_DOC = PARSER.parseFromString(SVG_STRING, "image/svg+xml")
	return SVG_DOC.querySelector("svg")
}
