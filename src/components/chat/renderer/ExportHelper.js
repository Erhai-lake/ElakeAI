import {jsPDF} from "jspdf"
import Logger from "@/services/Logger"

/**
 * 导出选项列表
 * @returns {Array<{item: string, title: string, label?: string}>}
 */
export function ExportList() {
	return [
		{
			item: "SVG",
			title: "SVG",
			action: (svg) => saveAsSvg(svg, `ELakeAI-Diagram-${Date.now()}.svg`)
		},
		{
			label: "PNG",
			title: "PNG",
			action: (svg) => saveAsPng(svg, `ELakeAI-Diagram-${Date.now()}.png`)
		},
		{
			label: "PDF",
			title: "PDF",
			action: (svg) => saveAsPdf(svg, `ELakeAI-Diagram-${Date.now()}.pdf`)
		}
	]
}

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
	renderSvgToCanvas(svgElement, (ctx, width, height, canvas) => {
		canvas.toBlob(blob => {
			if (blob) {
				saveAsFile(blob, filename)
			} else {
				Logger.error("[ExportHelper] 无法生成PNG Blob")
			}
		}, "image/png")
	})
}

/**
 * 从 URL 中获取 SVG 元素
 * @param url - SVG 文件的 URL
 * @returns {Promise<SVGSVGElement>} - 解析后的 SVG 元素
 */
export async function fetchSvgElementFromUrl(url) {
	const RESPONSE = await fetch(url)
	const SVG_STRING = await RESPONSE.text()
	const PARSER = new DOMParser()
	const SVG_DOC = PARSER.parseFromString(SVG_STRING, "image/svg+xml")
	return SVG_DOC.querySelector("svg")
}

/**
 * 将 SVG 元素渲染为 Canvas
 * @param {SVGElement} svgElement - SVG 元素
 * @param {function(CanvasRenderingContext2D, number, number): void} onReady - 渲染完成后的回调
 */
function renderSvgToCanvas(svgElement, onReady) {
	const VIEW_BOX = svgElement.getAttribute("viewBox")
	if (!VIEW_BOX) {
		Logger.error("[ExportHelper] SVG 缺少 viewBox")
		return
	}
	const [, , WIDTH, HEIGHT] = VIEW_BOX.split(/\s+/).map(Number)

	const CLONED_SVG = svgElement.cloneNode(true)
	if (!CLONED_SVG.hasAttribute("xmlns")) {
		CLONED_SVG.setAttribute("xmlns", "http://www.w3.org/2000/svg")
	}
	CLONED_SVG.setAttribute("width", `${WIDTH}px`)
	CLONED_SVG.setAttribute("height", `${HEIGHT}px`)

	const SERIALIZER = new XMLSerializer()
	const SVG_STRING = SERIALIZER.serializeToString(CLONED_SVG)
	const SVG_BASE64 = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG_STRING)}`

	const IMG = new Image()
	IMG.crossOrigin = "anonymous"
	IMG.onload = () => {
		const CANVAS = document.createElement("canvas")
		CANVAS.width = WIDTH * 2
		CANVAS.height = HEIGHT * 2
		const CTX = CANVAS.getContext("2d")
		CTX.scale(2, 2)
		CTX.drawImage(IMG, 0, 0, WIDTH, HEIGHT)

		onReady(CTX, WIDTH, HEIGHT, CANVAS)
	}

	IMG.onerror = (error) => {
		Logger.error("[ExportHelper] 图片加载失败", error)
	}

	IMG.src = SVG_BASE64
}

/**
 * 保存为 PDF 文件
 * @param {SVGElement} svgElement - SVG 元素
 * @param {string} [filename="ELakeAI-Diagram.pdf"] - 文件名
 */
export function saveAsPdf(svgElement, filename = "ELakeAI-Diagram.pdf") {
	renderSvgToCanvas(svgElement, (ctx, width, height, canvas) => {
		const IMG_DATA = canvas.toDataURL("image/png")
		const PDF = new jsPDF({
			orientation: width > height ? "landscape" : "portrait",
			unit: "px",
			format: [width, height]
		})
		PDF.addImage(IMG_DATA, "PNG", 0, 0, width, height)
		PDF.save(filename)
	})
}