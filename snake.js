const GAMESTATE = {
  ready: 0,
  playing: 1,
  gameover: 2,
}

class Snake {
  status = GAMESTATE.ready
  // 分数
  score = 0
  // 蛇身体，头至尾的坐标
  body = [{ x: 15, y: 10 }, { x: 14, y: 10 }, { x: 13, y: 10}]
  // 食物坐标
  food = { x: 40, y: 20 }
  // 网格尺寸
  bSize = 16
  // 风格间隙
  bSpace = 1
  // 网格列数
  bCols = 30
  // 网格行数
  bRows = 20
  // 画布context
  canvasCtx = document.getElementById('game').getContext('2d')
  // 移动的声音
  moveSounder = document.getElementById('sound-move')
  // 移动方向
  direction = { x: 1, y: 0 }
  // 蛇尾索引
  tailIndex = this.body.length - 1
  // 上次移动时间
  lastMoveTime = 0
  // 自动移动等待时间
  waitTime = 300
  // 速度，根据waitTime计算
  speed = 1
  // 所有格子位置
  allPos = Array(this.bCols * this.bRows).fill(0).map((_, i) => i)
  // 向前移动之前蛇尾的坐标
  prevTail = { x: 28, y: 20 }
  // 设置可以控制方向的按键
  arrowCodes = {
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
  }
  // 播放声音
  noisy = true

  constructor() {
    window.addEventListener('keydown', this.onEnterDown, true)
    window.addEventListener('keydown', this.onArrowDown, true)

    const vw = window.innerWidth
    if (vw < 540) {
      // this.bCols * (this.bSpace + this.bSize) + this.bSpace
      this.bSize = Math.floor((vw - this.bSpace) / this.bCols - this.bSpace)
    }

    // 获取canvas元素
    const canvas = document.getElementById('game')
    // 游戏所需画布的宽高
    const width = this.getWidth()
    const height = this.getHeight()

    const ui = document.getElementById('ui')
    ui.style.minHeight = `${height}px`
    // 利用样式设置最终显示宽高
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    // canvas真实宽高则与屏幕像素分辨率保持一致
    canvas.height = height * window.devicePixelRatio
    canvas.width = width * window.devicePixelRatio
    // 由于canvas的真实宽高范围大于显示尺寸，所以把整体坐标做相应放大
    this.canvasCtx.scale(window.devicePixelRatio, window.devicePixelRatio)
    // 在游戏开始前先绘制背景
    this.drawBg()
  }

  moveLeft() {
    if (this.status === GAMESTATE.playing && this.direction.x !== 1) {
      this.direction.x = -1
      this.direction.y = 0
      this.goAhead()
    }
  }

  moveRight() {
    if (this.status === GAMESTATE.playing && this.direction.x !== -1) {
      this.direction.x = 1
      this.direction.y = 0
      this.goAhead()
    }
  }

  moveUp() {
    if (this.status === GAMESTATE.playing && this.direction.y !== 1) {
      this.direction.x = 0
      this.direction.y = -1
      this.goAhead()
    }
  }

  moveDown() {
    if (this.status === GAMESTATE.playing && this.direction.y !== -1) {
      this.direction.x = 0
      this.direction.y = 1
      this.goAhead()
    }
  }

  // 监听键盘事件
  onArrowDown = (e) => {
    if (this.status !== GAMESTATE.playing) { return }
    const { left, right, up, down } = this.arrowCodes
    // 向左
    if (left.includes(e.code)) {
      e.preventDefault()
      this.moveLeft()
    }
    // 向右
    else if (right.includes(e.code)) {
      e.preventDefault()
      this.moveRight()
    }
    // 向上
    else if (up.includes(e.code)) {
      e.preventDefault()
      this.moveUp()
    }
    // 向下
    else if (down.includes(e.code)) {
      e.preventDefault()
      this.moveDown()
    }
  }

  // 回车键开始游戏
  onEnterDown = (e) => {
    if (this.status === GAMESTATE.playing) { return }
    if (e.code === 'Enter') {
      e.preventDefault()
      game.start()
    }
  }

  /**
   * 画布像素宽度
   */
  getWidth () {
    return this.bCols * (this.bSpace + this.bSize) + this.bSpace
  }

  /**
   * 画布像素高度
   */
  getHeight () {
    return this.bRows * (this.bSpace + this.bSize) + this.bSpace
  }

  /**
   * 列坐标转像素
   * @param {number} col 列坐标
   */
  toX (col) {
    return col * (this.bSpace + this.bSize) + this.bSpace
  }

  /**
   * 行坐标转像素
   * @param {number} row 行坐标
   */
  toY (row) {
    return row * (this.bSpace + this.bSize) + this.bSpace
  }

  /**
   * 网格坐标转像素坐标
   * @param {object} param0 网格坐标
   */
  toXY ({ x, y }) {
    return { x: this.toX(x), y: this.toY(y) }
  }

  /**
   * 游戏循环中的每一步
   */
  step (t = 0) {
    // 游戏循环
    this.rafId = requestAnimationFrame((t) => this.step(t))

    if (t - this.lastMoveTime >= this.waitTime) {
      this.goAhead(t)
    }

    if (this.isGameOver()) {
      this.gameOver()
      return
    }
    
    this.eat()

    this.render()
  }

  /**
   * 初始化数据
   */
  initData () {
    const midRow = Math.floor(this.bRows / 2)
    const midCol = Math.floor(this.bCols / 2)
    this.body = [{ x: midCol, y: midRow }, { x: midCol - 1, y: midRow }, { x: midCol - 2, y: midRow}]
    this.tailIndex = this.body.length - 1
    this.direction = { x: 1, y: 0 }
    this.waitTime = 300
    this.speed = 1
    this.score = 0
    this.updateScore()
    this.updateSpeed()
    this.makeFood()
  }

  /**
   * 开始游戏
   */
  start () {
    if (this.status === GAMESTATE.playing) { return }
    this.status = GAMESTATE.playing
    this.initData()
    // window.addEventListener('keydown', this.onArrowDown)
    this.hideUI()
    this.step()
  }

  /**
   * 游戏结束
   */
  gameOver () {
    console.log('game over')
    this.status = GAMESTATE.gameover
    cancelAnimationFrame(this.rafId)
    // window.removeEventListener('keydown', this.onArrowDown)
    // window.addEventListener('keydown', this.onEnterDown)

    const maxScore = localStorage.getItem('maxScore')
    if (!maxScore || this.score > +maxScore) {
      localStorage.setItem('maxScore', this.score)
    }

    this.showGameOverUI()
  }

  /**
   * 渲染游戏
   */
  render () {
    // 清空内容
    this.clear()
    this.drawBg()
    this.drawSnake()
    this.drawFood()
    // to-do
  }

  /**
   * 清空画布内容
   */
  clear () {
    this.canvasCtx.clearRect(0, 0, this.getWidth(), this.getHeight())
  }

  /**
   * 渲染背景
   */
  drawBg () {
    const ctx = this.canvasCtx

    ctx.save()
    // 背景网格颜色
    ctx.fillStyle = '#1F2937' // '#374151' // '#1F2937'

    for (let r = 0; r < this.bRows; r++) {
      for (let c = 0; c < this.bCols; c++) {
        const { x, y } = this.toXY({ x: c, y: r })
        ctx.fillRect(x, y, this.bSize, this.bSize)
      }
    }

    ctx.restore()
  }

  /**
   * 渲染蛇的身体
   */
  drawSnake () {
    const { canvasCtx: ctx } = this
    ctx.save()
    // 蛇的颜色
    ctx.fillStyle = 'steelblue'
    this.body.forEach((b) => {
      const { x, y } = this.toXY(b)
      ctx.fillRect(x, y, this.bSize, this.bSize)
    })
    ctx.restore()
  }

  /**
   * 渲染食物
   */
  drawFood () {
    const { canvasCtx: ctx, food } = this
    ctx.save()
    // 食物的颜色
    ctx.fillStyle = 'red'
    const { x, y } = this.toXY(food)
    ctx.fillRect(x, y, this.bSize, this.bSize)
    ctx.restore()
  }

  /**
   * 获取蛇头元素
   */
  getHead () {
    // 蛇头索引
    const headIndex = (this.tailIndex + 1) % this.body.length
    // 当前蛇头坐标
    return this.body[headIndex]
  }

  /**
   * 向前移动
   */
  goAhead (t) {
    // 当前蛇头坐标
    const { x, y } = this.getHead()
    // 当前蛇尾
    const tail = this.body[this.tailIndex]

    // 记录移动前的蛇尾坐标
    this.prevTail.x = tail.x
    this.prevTail.y = tail.y

    // 蛇尾改为新蛇头位置
    tail.x = x + this.direction.x
    tail.y = y + this.direction.y

    // 修改蛇尾索引
    this.tailIndex -= 1
    if (this.tailIndex < 0) {
      this.tailIndex = this.body.length - 1
    }

    // 记录移动时间
    this.lastMoveTime = t || performance.now()

    // 播放声音
    this.playMoveSound()
  }

  /**
   * 播放移动声音
   */
  playMoveSound() {
    if (this.noisy) {
      this.moveSounder.pause()
      this.moveSounder.currentTime = 0
      this.moveSounder.play()
    }
  }

  /**
   * 更新速度显示值
   * @param {number} value - 速度值
   */
  updateSpeed (value) {
    const speedInfo = document.querySelector('#info-bar > .speed-info > .speed-value')
    speedInfo.textContent = value || this.speed
  }

  /**
   * 加速
   */
  speedUp () {
    // 最少为10毫秒，初始值是300毫秒
    this.waitTime = Math.max(this.waitTime - 10, 20)
    // 最低为1，最高为10
    this.speed = Math.floor((300 - this.waitTime) / 280 * 9 + 1)

    this.updateSpeed()
  }

  /**
   * 更新显示分数
   * @param {number} score - 指定显示分数
   */
  updateScore (score) {
    const scoreInfo = document.querySelector('#info-bar > .score-info > .score-value')
    scoreInfo.textContent = score || this.score
  }

  /**
   * 进食
   */
  eat () {
    // 食物坐标
    const { x, y } = this.food
    const head = this.getHead()

    // 如果吃到了食物
    if (head.x === x && head.y === y) {
      // 计分
      this.score += 1
      // 更新分数显示
      this.updateScore()
      // 在画布上“删除”当前食物
      this.food.x = -1000
      // 加快移动速度
      this.speedUp()
      // 1秒后重新“创建”食物
      setTimeout(() => this.makeFood(), 1000)
      // 身体生长
      this.growBody()
    }
  }

  /**
   * 选取食物坐标
   */
  makeFood () {
    // 排除蛇身体后的空位置
    const emptyPos = this.allPos.filter(
      (pos) => !this.body.find(({ x, y }) => y * this.bCols + x === pos)
    )
    // 尽管可能性很小，还是要以防万一
    if (emptyPos.length <= 0) return

    // 随机选择一个空位置
    const index = Math.floor(Math.random() * emptyPos.length)
    const pos = emptyPos[index]

    // 修改食物位置
    this.food.x = pos % this.bCols
    this.food.y = Math.floor(pos / this.bCols)
  }

  /**
   * 生长身体
   */
  growBody () {
    const { x, y } = this.prevTail
    // 新添加的是尾部元素，所以尾部索引加1
    this.tailIndex += 1
    // 在新尾部处添加元素
    this.body.splice(this.tailIndex, 0, { x, y })
  }

  /**
   * 判断是否游戏结束
   */
  isGameOver () {
    const { x: hx, y: hy } = this.getHead()
    // 超出边界则结束
    if (hx >= this.bCols || hx < 0 || hy >= this.bRows || hy < 0) {
      return true
    }
    // 计算头部位置值
    const pos = this.bCols * hy + hx
    const count = this.body.reduce((p, { x, y }) => {
      if (this.bCols * y + x === pos) {
        p += 1
      }
      return p
    }, 0)

    return count > 1
  }

  /**
   * 显示等待开始
   */
  showGameOverUI () {
    const title = document.getElementById('ui-title')
    title.innerText = 'GAME OVER'

    const startBtn = document.getElementById('start')
    startBtn.textContent = 'Try Again'

    const overInfo = document.getElementById('gameover-info')
    overInfo.style.display = 'block'

    const score = document.getElementById('score')
    score.textContent = this.score

    const maxScore = localStorage.getItem('maxScore') || this.score
    const max = document.getElementById('max')
    max.textContent = maxScore

    const ui = document.getElementById('ui')
    ui.style.display = 'flex'

    const mask = document.getElementById('mask')
    mask.style.display = 'block'
  }

  /**
   * 隐藏UI
   */
  hideUI () {
    const ui = document.getElementById('ui')
    ui.style.display = 'none'

    const mask = document.getElementById('mask')
    mask.style.display = 'none'
  }

  // ...
}


// ~~~~~~~~~
// 创建游戏实例
const game = new Snake()
// // 获取canvas元素
// const canvas = document.getElementById('game')
// // 游戏所需画布的宽高
// const width = game.getWidth()
// const height = game.getHeight()
// // 利用样式设置最终显示宽高
// canvas.style.width = `${width}px`
// canvas.style.height = `${height}px`
// // canvas真实宽高则与屏幕像素分辨率保持一致
// canvas.height = height * window.devicePixelRatio
// canvas.width = width * window.devicePixelRatio
// // 由于canvas的真实宽高范围大于显示尺寸，所以把整体坐标做相应放大
// game.canvasCtx.scale(window.devicePixelRatio, window.devicePixelRatio)
// // 在游戏开始前先绘制背景
// game.drawBg()
// // game.start()