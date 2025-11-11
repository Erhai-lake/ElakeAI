<script setup>
import {ref, nextTick} from "vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import Button from "@/components/input/Button.vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import {SnakeGame} from "@/services/Game"

/**
 * 版本号
 */
const version = ref(__APP_VERSION__)

/**
 * 点击次数
 */
const clickCount = ref(0)

/**
 * 重置定时器
 */
const resetTimer = ref(null)

/**
 * 是否抖动
 */
const isShaking = ref(false)

/**
 * 是否彩色
 */
const isColorful = ref(false)

/**
 * 是否疯狂
 */
const isCrazy = ref(false)

/**
 * 是否游戏中
 */
const isGame = ref(false)

/**
 * 游戏实例
 */
const game = ref(null)

/**
 * 是否暂停
 */
const paused = ref(false)

/**
 * 游戏得分元素
 */
const score = ref(null)

/**
 * 游戏舞台元素
 */
const stage = ref(null)

/**
 * 游戏最高分元素
 */
const highScore = ref(null)

/**
 * 暂停按钮元素
 */
const pauseBtn = ref(null)

/**
 * 翻译
 * @param key {String} - 键
 * @param {Object} [params] - 插值参数, 例如 { name: "洱海" }
 * @returns {String} - 翻译后的文本
 */
const t = (key, params = {}) => {
	return i18nRegistry.translate(key, params)
}

/**
 * 版本按钮点击事件
 */
const onVersionClick = async () => {
	clickCount.value++
	// 清理之前的定时器
	if (resetTimer.value) {
		clearTimeout(resetTimer.value)
	}
	// 1 秒没点就重置
	resetTimer.value = setTimeout(() => {
		clickCount.value = 0
		version.value = __APP_VERSION__
		isShaking.value = false
		isColorful.value = false
		isCrazy.value = false
	}, 1000)

	if (clickCount.value === 5) {
		toastRegistry.info(t("components.VersionButton.info1"))
	}
	if (clickCount.value === 15) {
		toastRegistry.success(t("components.VersionButton.info2"))
		triggerShake()
	}
	if (clickCount.value === 30) {
		toastRegistry.warning(t("components.VersionButton.info3"))
		triggerShake()
	}
	if (clickCount.value > 15 && clickCount.value < 50) {
		version.value = clickCount.value
	}
	if (clickCount.value === 50) {
		version.value = t("components.VersionButton.info4")
		isColorful.value = true
		triggerShake()
		toastRegistry.success(t("components.VersionButton.info5"))
	}
	if (clickCount.value > 65) {
		version.value = clickCount.value
		isShaking.value = true
		isCrazy.value = true
	}
	if (clickCount.value === 100) {
		toastRegistry.success(t("components.VersionButton.info6"))
		clickCount.value = 0
		version.value = __APP_VERSION__
		isShaking.value = false
		isColorful.value = false
		isCrazy.value = false
		openGame()
	}
}

/**
 * 震动
 */
const triggerShake = () => {
	isShaking.value = true
	setTimeout(() => {
		isShaking.value = false
	}, 600)
}

/**
 * 打开游戏
 */
const openGame = () => {
	isGame.value = true
	nextTick(() => {
		game.value = new SnakeGame(score.value, stage.value, highScore.value)
		game.value.start()
	})
}

/**
 * 关闭游戏
 */
const closeGame = () => {
	isGame.value = false
	if (game.value) {
		game.value.destroy()
	}
}

/**
 * 暂停游戏
 */
const pauseGame = () => {
	if (!game.value) return
	paused.value = !paused.value
	if (paused.value) {
		game.value.pause()
		if (pauseBtn.value) {
			pauseBtn.value.style.backgroundColor = "#FFA500"
		}
	} else {
		game.value.resume()
		if (pauseBtn.value) {
			pauseBtn.value.style.backgroundColor = "#E9FFF3"
		}
	}
}

/**
 * AI 自动游戏
 */
const aiGame = () => {
	if (game.value) {
		game.value.toggleAI()
	}
}
</script>

<template>
	<div class="game-container" v-if="isGame">
		<div class="game" id="game">
			<div class="head">
				<p>
					<span class="score" ref="score">0</span>
					/
					<span class="score" ref="highScore">0</span>
				</p>
				<div class="controls">
					<div class="ai" @click="aiGame"></div>
					<div class="pause" @click="pauseGame" ref="pauseBtn"></div>
					<div class="close" @click="closeGame"></div>
				</div>
			</div>
			<div class="stage" ref="stage"></div>
		</div>
	</div>
	<Button
		@click="onVersionClick"
		:class="{ shake: isShaking, colorful: isColorful, crazy: isCrazy }">
		{{ version }}
	</Button>
</template>

<style scoped lang="less">
.game-container {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(127, 127, 127, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 4;

	.game {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 80%;
		height: 80%;
		transform: translate(-50%, -50%);
		background-color: var(--background-color);
		border-radius: 12px;
		display: grid;
		grid-template-rows: auto 1fr;
		z-index: 5;

		.head {
			padding: 10px;
			background-color: var(--theme-color);
			color: var(--text-color-anti);
			display: grid;
			grid-template-columns: 1fr auto auto;
			justify-content: center;
			align-items: center;

			.score {
				font-size: 20px;
				font-weight: bold;
			}

			.controls {
				display: flex;
				gap: 10px;

				div {
					width: 20px;
					height: 20px;
					border-radius: 50%;
					transition: background-color 0.3s ease-in-out;
				}

				.ai {
					border: 1px solid #F7A623;
					background-color: #FFF7D3;

					&:hover {
						background-color: #F7A623;
					}
				}

				.pause {
					border: 1px solid #3ECF8E;
					background-color: #E9FFF3;

					&:hover {
						background-color: #3ECF8E;
					}
				}

				.close {
					border: 1px solid #FF2851;
					background-color: #FAC0F2;

					&:hover {
						background-color: #FF2851;
					}
				}
			}
		}
	}
}

/* 震动动画 */
@keyframes shake {
	0% {
		transform: translateX(0);
	}
	20% {
		transform: translateX(-5px);
	}
	40% {
		transform: translateX(5px);
	}
	60% {
		transform: translateX(-5px);
	}
	80% {
		transform: translateX(5px);
	}
	100% {
		transform: translateX(0);
	}
}

.shake {
	animation: shake 0.6s infinite;
}

/* 彩蛋模式的彩色渐变 */
.colorful {
	background: linear-gradient(90deg, #ff6ec4, #7873f5, #4ade80, #facc15);
	color: white !important;
	transition: background 0.5s ease;
}

/* 狂暴模式：渐变彩虹不停滚动 */
@keyframes rainbow {
	0% {
		background-position: 0 50%;
	}
	50% {
		background-position: 100% 50%;
	}
	100% {
		background-position: 0 50%;
	}
}

.crazy {
	background: linear-gradient(270deg, #ff6ec4, #7873f5, #4ade80, #facc15, #f472b6);
	background-size: 400% 400%;
	color: white !important;
	animation: rainbow 3s ease infinite, shake 0.3s infinite;
}
</style>

<style lang="less">
.game-container .game .stage {
	padding-top: 40px;
	height: calc(100% - 40px);
	position: relative;
	overflow: hidden;

	.game-intro {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background-color: var(--background-color);
		padding: 20px 30px;
		border-radius: 10px;
		text-align: left;
		max-width: 400px;
		font-family: sans-serif;
		box-shadow: 0 0 20px var(--box-shadow-color);

		button {
			padding: 10px 30px;
			margin: 15px auto 0 auto;
			display: block;
			border: 1px solid var(--border-color);
			border-radius: 8px;
			cursor: pointer;
			background-color: var(--background-color);
			color: var(--text-color);
			font-size: 14px;
			user-select: none;
			transition: all 0.15s;
			white-space: nowrap;

			&:hover {
				background-color: var(--button-hover-background-color);
			}

			&:active {
				background-color: var(--button-active-background-color);
			}
		}
	}

	.tile {
		position: absolute;

		&:before {
			bottom: 0;
			content: '';
			height: 0;
			left: 0;
			margin: auto;
			opacity: 0;
			position: absolute;
			right: 0;
			top: 0;
			width: 0;
			transition: opacity 300ms;
		}
	}

	// 蛇身
	.tile.snake {
		position: absolute;
		background-color: white;
		border-radius: 4px;
	}

	// 蛇头发光
	.tile.snake-head {
		background-color: #ffffff;
		box-shadow: 0 0 10px #ffffff, 0 0 20px #ffffff, 0 0 30px #ffffff;
	}

	// 敌人
	.tile.enemy {
		position: absolute;
		background-color: #f87171;
		transition: transform 0.1s linear;
	}

	// 食物
	.tile.food {
		position: absolute;
		background: #4ade80;
		border-radius: 4px;
		box-shadow: 0 0 10px #4ade80, 0 0 20px #4ade80, 0 0 30px #4ade80;
	}

	// 食物定位点
	.tile.food-center-dot {
		position: absolute;
		width: 4px;
		height: 4px;
		background-color: var(--border-color);
		opacity: 0.1;
		border-radius: 50%;
		pointer-events: none;
	}

	// 舞台边界
	.stage-border {
		position: absolute;
		border: 2px solid var(--border-color);
		pointer-events: none;
		box-sizing: border-box;
	}

	// 网格线
	.tile.grid {
		position: absolute;
		border: 1px solid var(--border-color);
		opacity: 0.1;
		box-sizing: border-box;
	}
}
</style>