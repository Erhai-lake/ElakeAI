/**
 * 贪吃蛇小游戏
 */
export class SnakeGame {
	constructor(scoreEl, stageEl, highScoreEl) {
		this.scoreEl = scoreEl
		this.stageEl = stageEl
		this.highScoreEl = highScoreEl


		this.score = 0
		this.snake = []
		this.foods = []
		this.direction = "right"
		this.nextDirection = "right"

		// 游戏参数
		this.tileSize = 20
		this.cols = 20
		this.rows = 20
		this.speed = 150
		this.foodCountMax = 5
		this.foodTimer = null
		this.foodSpawnInterval = 2000
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
		// 基础配置
		this.tileSize = 20
		const HEAD_HEIGHT = 40
		const AVAILABLE_HEIGHT = this.stageEl.clientHeight - HEAD_HEIGHT
		this.rows = Math.floor(AVAILABLE_HEIGHT / this.tileSize)
		this.cols = Math.floor(this.stageEl.clientWidth / this.tileSize)
		this.direction = "right"
		this.nextDirection = "right"
		this.snake = [{x: 5, y: 5}]
		this.foods = []
		this.foodCountMax = 5
		this.foodSpawnInterval = 2000
		this.score = 0
		// 初始化默认一个食物
		this.foods.push(this.randomFood())
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
		switch (this.direction) {
			case "up":
				HEAD.y--
				break
			case "down":
				HEAD.y++
				break
			case "left":
				HEAD.x--
				break
			case "right":
				HEAD.x++
				break
		}
		// 穿墙处理
		if (HEAD.x < 0) HEAD.x = this.cols - 1
		if (HEAD.x >= this.cols) HEAD.x = 0
		if (HEAD.y < 0) HEAD.y = this.rows - 1
		if (HEAD.y >= this.rows) HEAD.y = 0
		// 判断撞到自己
		if (this.snake.some(seg => seg.x === HEAD.x && seg.y === HEAD.y)) {
			alert("游戏结束! 你的得分：" + this.score)
			this.reset()
			return
		}
		this.snake.unshift(HEAD)
		// 判断是否吃到食物
		let ateFood = false
		for (let i = 0; i < this.foods.length; i++) {
			const f = this.foods[i]
			if (HEAD.x === f.x && HEAD.y === f.y) {
				this.score++
				this.scoreEl.textContent = this.score
				// 移除被吃掉的食物
				this.foods.splice(i, 1)
				ateFood = true
				// 少于最大数量时重新启动定时器
				if (this.foods.length < this.foodCountMax) this.startFoodSpawner()
				break
			}
		}
		this.updateScore()
		// 如果没吃到食物, 则移除尾巴
		if (!ateFood) {
			this.snake.pop()
		}
	}

	/**
	 * 重置游戏
	 */
	reset() {
		this.snake = [{ x: 5, y: 5 }]
		this.foods = [this.randomFood()]
		this.score = 0
		this.scoreEl.textContent = this.score
		this.updateScore()
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
		switch (event.keyCode) {
			case 38:
				if (this.direction !== "down") this.nextDirection = "up"
				break
			case 87:
				if (this.direction !== "down") this.nextDirection = "up"
				break
			case 40:
				if (this.direction !== "up") this.nextDirection = "down"
				break
			case 83:
				if (this.direction !== "up") this.nextDirection = "down"
				break
			case 37:
				if (this.direction !== "right") this.nextDirection = "left"
				break
			case 65:
				if (this.direction !== "right") this.nextDirection = "left"
				break
			case 39:
				if (this.direction !== "left") this.nextDirection = "right"
				break
			case 68:
				if (this.direction !== "left") this.nextDirection = "right"
				break
		}
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
		// 边框
		const ELEMENT_BORDER = document.createElement("div")
		ELEMENT_BORDER.className = "stage-border"
		ELEMENT_BORDER.style.width = this.cols * this.tileSize + "px"
		ELEMENT_BORDER.style.height = this.rows * this.tileSize + "px"
		ELEMENT_BORDER.style.top = HEAD_HEIGHT + "px"
		this.stageEl.appendChild(ELEMENT_BORDER)
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
		// 绘制食物
		this.foods.forEach(f => {
			const ELEMENT_FOOD = document.createElement("div")
			ELEMENT_FOOD.className = "tile food"
			ELEMENT_FOOD.style.left = f.x * this.tileSize + "px"
			ELEMENT_FOOD.style.top = (f.y * this.tileSize + HEAD_HEIGHT) + "px"
			ELEMENT_FOOD.style.width = this.tileSize + "px"
			ELEMENT_FOOD.style.height = this.tileSize + "px"
			this.stageEl.appendChild(ELEMENT_FOOD)
			// 绘制整行整列小点
			for(let x = 0; x < this.cols; x++){
				const DOT_X = document.createElement("div")
				DOT_X.className = "tile food-center-dot"
				DOT_X.style.left = x * this.tileSize + this.tileSize / 2 - 2 + "px"
				DOT_X.style.top = f.y * this.tileSize + HEAD_HEIGHT + this.tileSize / 2 - 2 + "px"
				this.stageEl.appendChild(DOT_X)
			}
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
		// 如果已经存在定时器，不重复启动
		if (this.foodTimer) return

		this.foodTimer = setInterval(() => {
			if (this.foods.length < this.foodCountMax) {
				this.foods.push(this.randomFood())
			} else {
				// 达到上限，暂停定时器
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