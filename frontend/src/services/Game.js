/**
 * 贪吃蛇小游戏
 */
export class SnakeGame {
	constructor(scoreEl, stageEl, highScoreEl) {
		// 游戏元素
		this.scoreEl = scoreEl
		this.highScoreEl = highScoreEl
		this.stageEl = stageEl

		// 游戏参数
		// 尺寸
		this.tileSize = 20
		// 正常速度
		this.normalSpeed = 150
		// 加速速度
		this.boostSpeed = 75
		// AI速度
		this.aiSpeed = 50
		// 速度
		this.speed = this.normalSpeed
		// 最大食物数量
		this.foodCountMax = 5
		// 食物生成间隔
		this.foodSpawnInterval = 2000
		// 最大敌人数量
		this.enemyMax = 3

		// 状态
		// 得分
		this.score = 0
		// 蛇
		this.snake = []
		// 敌人
		this.enemies = []
		// 食物
		this.foods = []
		// 方向
		this.direction = "right"
		this.nextDirection = "right"
		// 食物定时器
		this.foodTimer = null
		// 动画帧
		this.animationFrame = null
		// 键盘事件
		this.keyHandler = this.handleKey.bind(this)
		this.keyUpHandler = this.handleKeyUp.bind(this)
		// 上一个帧时间
		this.lastFrameTime = null
		// 加速状态
		this.isBoosting = false
		// AI状态
		this.isAI = false

		// 历史最高分(静态变量)
		if (typeof SnakeGame.highScore === "undefined") {
			SnakeGame.highScore = 0
		}
	}

	/**
	 * 初始化游戏
	 */
	start() {
		// 显示自定义提示框
		const ELEMENT_INTRO = document.createElement("div")
		ELEMENT_INTRO.className = "game-intro"
		ELEMENT_INTRO.innerHTML = `
    		<p>游戏介绍: </p>
    		<ol>
    			<li>用方向键或WASD控制蛇移动</li>
    			<li>吃到食物得分</li>
    			<li>避免撞到自己</li>
    			<li>按住Shift消耗1长度进行加速</li>
    			<li>右上角黄色按钮是托管, 再次点击取消托管(别依赖, 会死的)</li>
    			<li>右上角绿色按钮是暂停, 再次点击恢复</li>
    			<li>右上角红色按钮是退出</li>
    			<li>食物最多生成${this.foodCountMax}个, 生成间隔${this.foodSpawnInterval / 1000}s</li>
    		</ol>
    		<button id="startGameBtn">开始游戏</button>
  		`
		// 插入到舞台元素内
		this.stageEl.appendChild(ELEMENT_INTRO)
		// 点击按钮后初始化游戏
		ELEMENT_INTRO.querySelector("#startGameBtn").addEventListener("click", () => {
			ELEMENT_INTRO.remove()
			this.initGame()
		})
	}

	/**
	 * 初始化游戏
	 */
	initGame() {
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
		this.render()
		// 监听键盘
		window.addEventListener("keydown", this.keyHandler)
		window.addEventListener("keyup", this.keyUpHandler)
		// 游戏循环
		this.lastFrameTime = performance.now()
		this.loop()
		// 启动食物生成
		this.startFoodSpawner()
		// 初始化敌人
		this.initEnemies()
	}

	/**
	 * 初始化敌人
	 */
	initEnemies() {
		this.enemies = []
		this.spawnEnemy()
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
		this.isBoosting = false
		this.speed = this.normalSpeed
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
			this.updateEnemies()
			this.render()
		}
		this.animationFrame = requestAnimationFrame(this.loop.bind(this))
	}

	/**
	 * 更新游戏状态
	 */
	update() {
		if (this.isAI) {
			this.nextDirection = SnakeGame.computeNextMove(this.snake, this.foods, [this, ...this.enemies], this.cols, this.rows) || this.nextDirection
		}
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
		// 撞到蛇
		if ([this, ...this.enemies].some(e => e.snake.some(seg => seg.x === HEAD.x && seg.y === HEAD.y))) {
			this.reset()
			return
		}
		this.snake.unshift(HEAD)
		// 吃食物
		const FOOD_INDEX = this.foods.findIndex(f => f.x === HEAD.x && f.y === HEAD.y)
		if (FOOD_INDEX !== -1) {
			this.score++
			this.updateScore()
			this.foods.splice(FOOD_INDEX, 1)
			if (this.foods.length < this.foodCountMax) this.startFoodSpawner()
		} else {
			this.snake.pop()
		}
	}

	/**
	 * 更新敌人游戏状态
	 */
	updateEnemies() {
		const NOW = performance.now()
		for (const ENEMY of this.enemies) {
			if (!ENEMY.alive) continue
			if (NOW - ENEMY.lastMove < ENEMY.aiSpeed) continue
			ENEMY.lastMove = NOW
			ENEMY.nextDirection = SnakeGame.computeNextMove(ENEMY.snake, this.foods, [this, ...this.enemies], this.cols, this.rows) || ENEMY.nextDirection
			ENEMY.direction = ENEMY.nextDirection
			let HEAD = {...ENEMY.snake[0]}
			if (ENEMY.direction === "up") HEAD.y--
			if (ENEMY.direction === "down") HEAD.y++
			if (ENEMY.direction === "left") HEAD.x--
			if (ENEMY.direction === "right") HEAD.x++
			// 穿墙
			if (HEAD.x < 0) HEAD.x = this.cols - 1
			if (HEAD.x >= this.cols) HEAD.x = 0
			if (HEAD.y < 0) HEAD.y = this.rows - 1
			if (HEAD.y >= this.rows) HEAD.y = 0
			// 碰撞 → 死亡, 蛇身变食物
			if ([this, ...this.enemies].some(e => e.snake.some(seg => seg.x === HEAD.x && seg.y === HEAD.y))) {
				ENEMY.alive = false
				ENEMY.snake.forEach(seg => this.foods.push({x: seg.x, y: seg.y}))
				continue
			}
			ENEMY.snake.unshift(HEAD)
			// 吃食物
			const FOOD_INDEX = this.foods.findIndex(f => f.x === HEAD.x && f.y === HEAD.y)
			if (FOOD_INDEX !== -1) {
				this.foods.splice(FOOD_INDEX, 1)
				if (this.foods.length < this.foodCountMax) this.startFoodSpawner()
			} else {
				ENEMY.snake.pop()
			}
		}
	}

	/**
	 * 重置游戏
	 */
	reset() {
		this.resetState()
		this.enemies = []
		this.stopFoodSpawner()
		this.startFoodSpawner()
		this.initEnemies()
	}

	/**
	 * 销毁游戏
	 */
	destroy() {
		cancelAnimationFrame(this.animationFrame)
		window.removeEventListener("keydown", this.keyHandler)
		window.removeEventListener("keyup", this.keyUpHandler)
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
	 * 切换 AI 自动游戏
	 */
	toggleAI() {
		this.isAI = !this.isAI
		this.speed = this.isAI ? this.aiSpeed : this.normalSpeed
	}

	/**
	 * 根据蛇和场上局势计算下一步方向
	 * @param {Array} snake 当前蛇
	 * @param {Array} foods 食物数组
	 * @param {Array} enemies 所有敌人(包含玩家)
	 * @param {number} cols 场地列
	 * @param {number} rows 场地行
	 * @returns {"up"|"down"|"left"|"right"|null}
	 */
	static computeNextMove(snake, foods, enemies, cols, rows) {
		if (snake.length <= 0) return null
		const HEAD = snake[0]
		// ---- 1. 判断能否碰瓷 ----
		for (const ENEMY of enemies) {
			if (ENEMY.snake === snake || !ENEMY.alive) continue
			const ENEMY_HEAD = ENEMY.snake[0]
			// 如果敌人头相邻, 尝试卡位
			const DX = ENEMY_HEAD.x - HEAD.x
			const DY = ENEMY_HEAD.y - HEAD.y
			if (Math.abs(DX) + Math.abs(DY) === 1) {
				// 逼近敌人头
				if (DX === 1) return "right"
				if (DX === -1) return "left"
				if (DY === 1) return "down"
				if (DY === -1) return "up"
			}
		}
		// ---- 2. 最近食物 ----
		if (foods.length > 0) {
			let closestFood = foods[0]
			let minDist = Math.abs(HEAD.x - closestFood.x) + Math.abs(HEAD.y - closestFood.y)
			for (const F of foods) {
				const DIST = Math.abs(HEAD.x - F.x) + Math.abs(HEAD.y - F.y)
				if (DIST < minDist) {
					minDist = DIST
					closestFood = F
				}
			}
			// 贪心选择方向
			const PREFERRED_DIRS = []
			if (closestFood.x > HEAD.x) PREFERRED_DIRS.push("right")
			else if (closestFood.x < HEAD.x) PREFERRED_DIRS.push("left")
			if (closestFood.y > HEAD.y) PREFERRED_DIRS.push("down")
			else if (closestFood.y < HEAD.y) PREFERRED_DIRS.push("up")
			// 备用
			const ALL_DIRS = ["up", "down", "left", "right"]
			ALL_DIRS.forEach(d => {
				if (!PREFERRED_DIRS.includes(d)) PREFERRED_DIRS.push(d)
			})
			// 找到安全方向
			for (const DIR of PREFERRED_DIRS) {
				let nx = HEAD.x
				let ny = HEAD.y
				if (DIR === "up") ny--
				if (DIR === "down") ny++
				if (DIR === "left") nx--
				if (DIR === "right") nx++
				// 穿墙
				if (nx < 0) nx = cols - 1
				if (nx >= cols) nx = 0
				if (ny < 0) ny = rows - 1
				if (ny >= rows) ny = 0
				// 检查是否撞到任意蛇
				if (!enemies.some(e => e.snake.some(seg => seg.x === nx && seg.y === ny))) {
					return DIR
				}
			}
		}
		return null
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
	 * 处理键盘事件(按下)
	 * @param event 键盘事件
	 */
	handleKey(event) {
		const KEY = event.keyCode
		if ((KEY === 38 || KEY === 87) && this.direction !== "down") this.nextDirection = "up"
		if ((KEY === 40 || KEY === 83) && this.direction !== "up") this.nextDirection = "down"
		if ((KEY === 37 || KEY === 65) && this.direction !== "right") this.nextDirection = "left"
		if ((KEY === 39 || KEY === 68) && this.direction !== "left") this.nextDirection = "right"

		// 空格按下 → 进入加速(如果长度>1)
		if (KEY === 16 && !this.isBoosting && this.snake.length > 1) {
			this.isBoosting = true
			this.speed = this.boostSpeed
			// 按下瞬间减一节
			this.snake.pop()
		}
	}

	/**
	 * 处理键盘事件(松开)
	 * @param event 键盘事件
	 */
	handleKeyUp(event) {
		if (event.keyCode === 16 && this.isBoosting) {
			this.isBoosting = false
			this.speed = this.normalSpeed
		}
	}

	/**
	 * 生成敌人
	 */
	spawnEnemy() {
		if (this.enemies.length >= this.enemyMax) return
		// 随机出生点
		let pos
		do {
			pos = {x: Math.floor(Math.random() * this.cols), y: Math.floor(Math.random() * this.rows)}
		} while (
			this.snake.some(seg => seg.x === pos.x && seg.y === pos.y) ||
			this.enemies.some(e => e.snake.some(seg => seg.x === pos.x && seg.y === pos.y))
			)
		const ENEMY = {
			id: Date.now() + Math.random(),
			snake: [pos],
			direction: "right",
			nextDirection: "right",
			alive: true,
			aiSpeed: this.speed,
			lastMove: performance.now()
		}
		this.enemies.push(ENEMY)
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
	 * 渲染
	 */
	render() {
		const HEAD_HEIGHT = 40
		// 先移除旧蛇和食物
		const OLD_TILES = this.stageEl.querySelectorAll(".tile.snake, .tile.enemy, .tile.food, .tile.food-center-dot")
		OLD_TILES.forEach(el => el.remove())
		// 绘制蛇
		this.snake.forEach((seg, index) => {
			const ELEMENT_SNAKE = document.createElement("div")
			ELEMENT_SNAKE.className = "tile snake"
			ELEMENT_SNAKE.style.left = seg.x * this.tileSize + "px"
			ELEMENT_SNAKE.style.top = (seg.y * this.tileSize + HEAD_HEIGHT) + "px"
			ELEMENT_SNAKE.style.width = this.tileSize + "px"
			ELEMENT_SNAKE.style.height = this.tileSize + "px"
			if (index === 0) ELEMENT_SNAKE.style.boxShadow = "0 0 8px #ffffff"
			this.stageEl.appendChild(ELEMENT_SNAKE)
		})
		// 绘制敌人
		this.enemies.forEach(enemy => {
			if (!enemy.alive) return
			enemy.snake.forEach((seg, index) => {
				const ELEMENT_ENEMY = document.createElement("div")
				ELEMENT_ENEMY.className = "tile enemy"
				ELEMENT_ENEMY.style.left = seg.x * this.tileSize + "px"
				ELEMENT_ENEMY.style.top = (seg.y * this.tileSize + HEAD_HEIGHT) + "px"
				ELEMENT_ENEMY.style.width = this.tileSize + "px"
				ELEMENT_ENEMY.style.height = this.tileSize + "px"
				if (index === 0) ELEMENT_ENEMY.style.boxShadow = "0 0 8px red"
				this.stageEl.appendChild(ELEMENT_ENEMY)
			})
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
			for (let x = 0; x < this.cols; x++) {
				const DOT_X = document.createElement("div")
				DOT_X.className = "tile food-center-dot"
				DOT_X.style.left = x * this.tileSize + this.tileSize / 2 - 2 + "px"
				DOT_X.style.top = f.y * this.tileSize + HEAD_HEIGHT + this.tileSize / 2 - 2 + "px"
				this.stageEl.appendChild(DOT_X)
			}
			// 绘制整列定位点
			for (let y = 0; y < this.rows; y++) {
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