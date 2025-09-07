/**
 * 贪吃蛇小游戏
 */
export class SnakeGame {
	constructor(scoreEl, stageEl, highScoreEl) {
		// 游戏元素
		this.scoreEl = scoreEl
		this.stageEl = stageEl
		this.highScoreEl = highScoreEl

		// 游戏参数
		this.tileSize = 20
		this.rows = 20
		this.cols = 20
		this.speed = 150
		this.foodCountMax = 5
		this.foodSpawnInterval = 2000

		// 状态
		this.score = 0
		this.snake = []
		this.foods = []
		this.direction = "right"
		this.nextDirection = "right"
		this.foodTimer = null
		this.animationFrame = null
		this.keyHandler = this.handleKey.bind(this)
		this.lastFrameTime = null

		// 历史最高分(静态变量)
		if (typeof SnakeGame.highScore === "undefined") {
			SnakeGame.highScore = 0
		}
	}

	/**
	 * 初始化游戏
	 */
	start() {
		// 计算行列
		const HEAD_HEIGHT = 40
		const AVAILABLE_HEIGHT = this.stageEl.clientHeight - HEAD_HEIGHT
		this.rows = Math.floor(AVAILABLE_HEIGHT / this.tileSize)
		this.cols = Math.floor(this.stageEl.clientWidth / this.tileSize)
		// 初始化状态
		this.resetState()
		// 清空舞台并绘制固定网格
		this.stageEl.innerHTML = ""
		this.renderGrid()
		this.renderSnakeAndFood()
		// 监听键盘
		window.addEventListener("keydown", this.keyHandler)
		// 游戏循环
		this.lastFrameTime = performance.now()
		this.loop()
		// 启动食物生成
		this.startFoodSpawner()
	}

	/**
	 * 重置状态(不清舞台)
	 */
	resetState() {
		this.score = 0
		this.snake = [{x: 5, y: 5}]
		this.foods = [this.randomFood()]
		this.direction = "right"
		this.nextDirection = "right"
		this.updateScore()
	}

	/**
	 * 游戏循环
	 */
	loop() {
		const NOW = performance.now()
		if (NOW - this.lastFrameTime > this.speed) {
			this.lastFrameTime = NOW
			this.update()
			this.renderSnakeAndFood()
		}
		this.animationFrame = requestAnimationFrame(this.loop.bind(this))
	}

	/**
	 * 更新游戏状态
	 */
	update() {
		this.direction = this.nextDirection
		const HEAD = {...this.snake[0]}
		// 移动
		if (this.direction === "up") HEAD.y--
		if (this.direction === "down") HEAD.y++
		if (this.direction === "left") HEAD.x--
		if (this.direction === "right") HEAD.x++
		// 穿墙
		if (HEAD.x < 0) HEAD.x = this.cols - 1
		if (HEAD.x >= this.cols) HEAD.x = 0
		if (HEAD.y < 0) HEAD.y = this.rows - 1
		if (HEAD.y >= this.rows) HEAD.y = 0
		// 撞到自己
		if (this.snake.some(seg => seg.x === HEAD.x && seg.y === HEAD.y)) {
			alert("游戏结束! 你的得分：" + this.score)
			this.reset()
			return
		}
		this.snake.unshift(HEAD)
		// 吃到食物
		const foodIndex = this.foods.findIndex(f => f.x === HEAD.x && f.y === HEAD.y)
		if (foodIndex !== -1) {
			this.score++
			this.updateScore()
			this.foods.splice(foodIndex, 1)
			if (this.foods.length < this.foodCountMax) this.startFoodSpawner()
		} else {
			this.snake.pop()
		}
	}

	/**
	 * 重置游戏
	 */
	reset() {
		this.resetState()
		this.stopFoodSpawner()
		this.startFoodSpawner()
	}

	/**
	 * 销毁游戏
	 */
	destroy() {
		cancelAnimationFrame(this.animationFrame)
		window.removeEventListener("keydown", this.keyHandler)
		this.stageEl.innerHTML = ""
		this.scoreEl.textContent = "0"
		this.stopFoodSpawner()
	}

	/**
	 * 暂停游戏
	 */
	pause() {
		if (this.animationFrame) {
			cancelAnimationFrame(this.animationFrame)
			this.animationFrame = null
			window.removeEventListener("keydown", this.keyHandler)
			return true
		}
		return false
	}

	/**
	 * 恢复游戏
	 */
	resume() {
		if (!this.animationFrame) {
			window.addEventListener("keydown", this.keyHandler)
			this.lastFrameTime = performance.now()
			this.loop()
			return true
		}
		return false
	}

	/**
	 * 更新分数
	 */
	updateScore() {
		this.scoreEl.textContent = this.score
		if (this.score > SnakeGame.highScore) {
			SnakeGame.highScore = this.score
			this.highScoreEl.textContent = SnakeGame.highScore
		}
	}

	/**
	 * 处理键盘事件
	 * @param event 键盘事件
	 */
	handleKey(event) {
		const KEY = event.keyCode
		if ((KEY === 38 || KEY === 87) && this.direction !== "down") this.nextDirection = "up"
		if ((KEY === 40 || KEY === 83) && this.direction !== "up") this.nextDirection = "down"
		if ((KEY === 37 || KEY === 65) && this.direction !== "right") this.nextDirection = "left"
		if ((KEY === 39 || KEY === 68) && this.direction !== "left") this.nextDirection = "right"
	}

	/**
	 * 绘制固定网格
	 */
	renderGrid() {
		const HEAD_HEIGHT = 40
		for (let y = 0; y < this.rows; y++) {
			for (let x = 0; x < this.cols; x++) {
				const TILE = document.createElement("div")
				TILE.className = "tile grid"
				TILE.style.left = x * this.tileSize + "px"
				TILE.style.top = (y * this.tileSize + HEAD_HEIGHT) + "px"
				TILE.style.width = this.tileSize + "px"
				TILE.style.height = this.tileSize + "px"
				this.stageEl.appendChild(TILE)
			}
		}
		const BORDER = document.createElement("div")
		BORDER.className = "stage-border"
		BORDER.style.width = this.cols * this.tileSize + "px"
		BORDER.style.height = this.rows * this.tileSize + "px"
		BORDER.style.top = HEAD_HEIGHT + "px"
		this.stageEl.appendChild(BORDER)
	}

	/**
	 * 渲染蛇和食物
	 */
	renderSnakeAndFood() {
		const HEAD_HEIGHT = 40
		// 先移除旧蛇和食物
		const OLD_TILES = this.stageEl.querySelectorAll(".tile.snake, .tile.food, .tile.food-center-dot")
		OLD_TILES.forEach(el => el.remove())
		// 绘制蛇
		this.snake.forEach((seg, index) => {
			const ELEMENT_SNAKE = document.createElement("div")
			ELEMENT_SNAKE.className = "tile snake"
			ELEMENT_SNAKE.style.left = seg.x * this.tileSize + "px"
			ELEMENT_SNAKE.style.top = (seg.y * this.tileSize + HEAD_HEIGHT) + "px"
			ELEMENT_SNAKE.style.width = this.tileSize + "px"
			ELEMENT_SNAKE.style.height = this.tileSize + "px"
			if(index === 0) ELEMENT_SNAKE.style.boxShadow = "0 0 8px #ffffff"
			this.stageEl.appendChild(ELEMENT_SNAKE)
		})
		// 绘制食物 + 定位点
		this.foods.forEach(f => {
			const ELEMENT_FOOD = document.createElement("div")
			ELEMENT_FOOD.className = "tile food"
			ELEMENT_FOOD.style.left = f.x * this.tileSize + "px"
			ELEMENT_FOOD.style.top = (f.y * this.tileSize + HEAD_HEIGHT) + "px"
			ELEMENT_FOOD.style.width = this.tileSize + "px"
			ELEMENT_FOOD.style.height = this.tileSize + "px"
			this.stageEl.appendChild(ELEMENT_FOOD)
			// 绘制整行定位点
			for(let x = 0; x < this.cols; x++){
				const DOT_X = document.createElement("div")
				DOT_X.className = "tile food-center-dot"
				DOT_X.style.left = x * this.tileSize + this.tileSize / 2 - 2 + "px"
				DOT_X.style.top = f.y * this.tileSize + HEAD_HEIGHT + this.tileSize / 2 - 2 + "px"
				this.stageEl.appendChild(DOT_X)
			}
			// 绘制整列定位点
			for(let y = 0; y < this.rows; y++){
				const DOT_Y = document.createElement("div")
				DOT_Y.className = "tile food-center-dot"
				DOT_Y.style.left = f.x * this.tileSize + this.tileSize / 2 - 2 + "px"
				DOT_Y.style.top = y * this.tileSize + HEAD_HEIGHT + this.tileSize / 2 - 2 + "px"
				this.stageEl.appendChild(DOT_Y)
			}
		})
	}

	/**
	 * 启动定时生成食物
	 */
	startFoodSpawner() {
		if (this.foodTimer) return
		this.foodTimer = setInterval(() => {
			if (this.foods.length < this.foodCountMax) {
				this.foods.push(this.randomFood())
			} else {
				this.stopFoodSpawner()
			}
		}, this.foodSpawnInterval)
	}

	/**
	 * 停止定时生成食物
	 */
	stopFoodSpawner() {
		if (this.foodTimer) {
			clearInterval(this.foodTimer)
			this.foodTimer = null
		}
	}

	/**
	 * 生成随机食物位置
	 * @returns {{x: number, y: number}} 随机食物位置
	 */
	randomFood() {
		let pos
		do {
			pos = {
				x: Math.floor(Math.random() * this.cols),
				y: Math.floor(Math.random() * this.rows)
			}
		} while (this.snake.some(seg => seg.x === pos.x && seg.y === pos.y))
		return pos
	}
}