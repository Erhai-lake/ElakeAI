<script>
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import Button from "@/components/input/Button.vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import {SnakeGame} from "@/services/Game"

export default {
	name: "VersionButton",
	components: {Button},
	data() {
		return {
			version: __APP_VERSION__,
			clickCount: 0,
			resetTimer: null,
			isShaking: false,
			isColorful: false,
			isCrazy: false,
			isGame: false,
			game: null,
			paused: false
		}
	},
	// mounted() {
	// 	this.openGame()
	// },
	methods: {
		/**
		 * 翻译
		 * @param key {String} - 键
		 * @param {Object} [params] - 插值参数, 例如 { name: "洱海" }
		 * @returns {String} - 翻译后的文本
		 */
		t(key, params = {}) {
			return i18nRegistry.translate(key, params)
		},
		/**
		 * 版本按钮点击事件
		 */
		async onVersionClick() {
			this.clickCount++
			// 清理之前的定时器
			if (this.resetTimer) {
				clearTimeout(this.resetTimer)
			}
			// 1 秒没点就重置
			if (this.clickCount < 65) {
				this.resetTimer = setTimeout(() => {
					this.clickCount = 0
					this.version = __APP_VERSION__
					this.isShaking = false
					this.isColorful = false
					this.isCrazy = false
					this.closeGame()
				}, 1000)
			}

			if (this.clickCount === 5) {
				toastRegistry.info("你在点什么呢 🤔")
			}
			if (this.clickCount === 15) {
				toastRegistry.success("你发现了隐藏彩蛋 🎉")
				this.triggerShake()
			}
			if (this.clickCount === 30) {
				toastRegistry.warning("再点我会变身哦 ⚡")
				this.triggerShake()
			}
			if (this.clickCount > 15 && this.clickCount < 50) {
				this.version = this.clickCount
			}
			if (this.clickCount === 50) {
				this.version = "彩蛋模式 🌈"
				this.isColorful = true
				this.triggerShake()
				toastRegistry.success("彩蛋模式已激活!")
			}
			if (this.clickCount > 65) {
				this.version = this.clickCount
				this.isShaking = true
				this.isCrazy = true
			}
			if (this.clickCount === 100) {
				toastRegistry.success("这么闲? 玩游戏吧!")
				this.clickCount = 0
				this.version = __APP_VERSION__
				this.isShaking = false
				this.isColorful = false
				this.isCrazy = false
				this.openGame()
			}
		},
		/**
		 * 震动
		 */
		triggerShake() {
			this.isShaking = true
			setTimeout(() => {
				this.isShaking = false
			}, 600)
		},
		/**
		 * 打开游戏
		 */
		openGame() {
			this.isGame = true
			this.$nextTick(() => {
				const ELEMENT_SCORE = this.$refs.score
				const ELEMENT_STAGE = this.$refs.stage
				const ELEMENT_HIGH_SCORE = this.$refs.highScore
				this.game = new SnakeGame(ELEMENT_SCORE, ELEMENT_STAGE, ELEMENT_HIGH_SCORE)
				this.game.start()
			})
		},
		/**
		 * 关闭游戏
		 */
		closeGame() {
			this.isGame = false
			this.game.destroy()
		},
		/**
		 * 暂停游戏
		 */
		pauseGame() {
			if (!this.game) return
			this.paused = !this.paused
			if (this.paused) {
				this.game.pause()
				this.$refs.pauseBtn.style.backgroundColor = "#FFA500"
			} else {
				this.game.resume()
				this.$refs.pauseBtn.style.backgroundColor = "#E9FFF3"
			}
		},
		/**
		 * AI 自动游戏
		 */
		aiGame() {
			this.game.toggleAI()
		}
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

				.ai{
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
		background-position: 0% 50%;
	}
	50% {
		background-position: 100% 50%;
	}
	100% {
		background-position: 0% 50%;
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