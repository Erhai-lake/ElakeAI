<script>
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import Button from "@/components/input/Button.vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"

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
			// TODO isGame: false
			isGame: false
		}
	},
	async created() {
		this.isGame = true
		await import("@/services/Game")
	},
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
					this.isGame = false
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
				this.isGame = true
				// 加载游戏
				await import("@/services/Game")
			}
		},
		triggerShake() {
			this.isShaking = true
			setTimeout(() => {
				this.isShaking = false
			}, 600)
		}
	}
}
</script>

<template>
	<div class="game-container" v-if="isGame">
		<div class="game" id="game">
			<p class="close" @click="isGame = false">X</p>
			<canvas id="canvas"></canvas>
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

	.game {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 70%;
		height: 70%;
		transform: translate(-50%, -50%);
		background-color: var(--background-color);
		border: 1px solid var(--border-color);
		box-shadow: 0 0 16px 2px rgba(0, 0, 0, 0.8);

		.close {
			position: absolute;
			top: 10px;
			right: 10px;
			padding: 5px;
			border: 1px solid var(--border-color);
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