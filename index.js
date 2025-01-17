function Gobang () {
	this.over = false; // 是否结束
	this.player = true; // true:我  false:电脑
	this.allChesses = []; // 所有棋子
	this.existChesses = [] // 已经落下的棋子
	this.winsCount = 0; // 赢法总数
	this.wins = []; // 所有赢法统计
	this.myWins = []; //我的赢法统计
	this.computerWins = []; //电脑赢法统计
}

//初始化
Gobang.prototype.init = function(opts) {
	// 生成canvas棋盘
	this.createCanvas(opts);

	//棋盘初始化 
	this.boardInit();

	// 鼠标移动聚焦功能实现
	this.mouseMove();

	//算法初始化
	this.algorithmInit();

	//落子功能实现
	this.dorpChess();
}


//生成canvas
Gobang.prototype.createCanvas = function(opts) {
	var opts = opts || {};
	if (opts.width && opts.width%24 !== 0) throw new RangeError(opts.width+'不是24的倍数');
	this.col = (opts.width && opts.width/24) || 12; // 棋盘列

	var oCanvas = document.createElement('canvas');
	oCanvas.width = oCanvas.height = opts.width || 288;
	this.canvas = oCanvas;
	document.querySelector(opts.container || 'body').appendChild(this.canvas);
	this.ctx = oCanvas.getContext('2d');
}

//棋盘初始化
Gobang.prototype.boardInit = function(opts){
	this.drawBoard();
}

// 画棋盘
Gobang.prototype.drawBoard = function(){
	this.ctx.strokeStyle = "#bfbfbf";
	for (var i = 0; i < this.col; i++) {
		this.ctx.moveTo(12+ 24*i, 12);
		this.ctx.lineTo(12+ 24*i, this.col*24-12);
		this.ctx.stroke();
		this.ctx.moveTo(12, 12+ 24*i);
		this.ctx.lineTo(this.col*24-12, 12+ 24*i);
		this.ctx.stroke();
	}
}

// 画棋子
Gobang.prototype.drawChess = function(x, y, player){
	var x = 12 + x * 24,
		y = 12 + y * 24;
	this.ctx.beginPath();
	this.ctx.arc(x, y, 10, 0, Math.PI*2);


	var grd = this.ctx.createRadialGradient(x + 2, y - 2, 10 , x + 2, y - 2, 0);
	if (player) { //我 == 黑棋 
		grd.addColorStop(0, '#0a0a0a');
		grd.addColorStop(1, '#636766');
	}else{  //电脑 == 白棋
		grd.addColorStop(0, '#d1d1d1');
		grd.addColorStop(1, '#f9f9f9');
	}
	this.ctx.fillStyle = grd;
	this.ctx.fill()
}


// 鼠标移动时触发聚焦效果, 需要前面的聚焦效果消失, 所有需要重绘canvas
Gobang.prototype.mouseMove = function(){
	var that = this;
	this.canvas.addEventListener('mousemove', function (e) {
		that.ctx.clearRect(0, 0, that.col*24, that.col*24);
		var x = Math.floor((e.offsetX)/24),
			y = Math.floor((e.offsetY)/24);

		//重绘棋盘
		that.drawBoard();

		//移动聚焦效果
		that.focusChess(x, y);

		//重绘已经下好的棋子
		that.redrawedChess()
	});
}

//鼠标移动聚焦
Gobang.prototype.focusChess = function(x, y){
	this.ctx.beginPath();
	this.ctx.fillStyle = '#E74343';
	this.ctx.arc(12 + x * 24, 12 + y * 24, 6, 0, Math.PI*2);
	this.ctx.fill();
}

//重绘当前下好的棋子
Gobang.prototype.redrawedChess = function(x, y){
	for (var i = 0; i < this.existChesses.length; i++) {
		this.drawChess(this.existChesses[i].x, this.existChesses[i].y, this.existChesses[i].player);
	}
}



//算法初始化
Gobang.prototype.algorithmInit = function(){
	//初始化棋盘的每个位置和赢法
	for (var x = 0; x < this.col; x++) {
		this.allChesses[x] = [];
		this.wins[x] = [];
		for (var y = 0; y < this.col; y++) {
			this.allChesses[x][y] = false;
			this.wins[x][y] = [];
		}
	}

	//获取所有赢法
	this.computedWins();

	// 初始化电脑和我每个赢法当前拥有的棋子数
	for (var i = 0; i < this.winsCount; i++) {
		this.myWins[i] = 0;
		this.computerWins[i] = 0;
	}
}

//获取所有赢法
Gobang.prototype.computedWins = function(){
	/*
		直线赢法
		以15列为准
	*/
	for (var x = 0; x < this.col; x++) { //纵向所有赢法
		for (var y = 0; y < this.col-4; y ++) {
			this.winsCount ++; 

			/*
				如： 
				1.组成的第一种赢法
					[0,0]
					[0,1]
					[0,2]
					[0,3]
					[0,4]
				
				2.组成的第二种赢法
					[0,1]
					[0,2]
					[0,3]
					[0,4]
					[0,5]
				以此类推一列最多也就11种赢法， 所有纵向x有15列  每列最多11种， 所有纵向总共15 * 11种
			*/
			//以下for循环给每种赢法的位置信息储存起来
			for (var k = 0; k < 5; k ++) {
				this.wins[x][y+k][this.winsCount] = true;
				/*
					位置信息
					第一种赢法的时候：
						this.wins =	[
										[
											[1:true],
											[1:true],
											[1:true],
											[1:true],
											[1:true]
										],
										[
											......
										]
									]

						虽然这是一个三维数组, 我们把它拆分下就好理解了
						相当于  this.wins[0][0][1], this.wins[0][1][1], this.wins[0][2][1], this.wins[0][3][1], this.wins[0][4][1]
						
						因为对象可以这样取值：
							var obj = {
								a: 10,
								b: 'demo'
							}
							obj['a'] === obj.a

						所有也就相当于 this.wins[0][0].1, this.wins[0][1].1, this.wins[0][2].1, this.wins[0][3].1, this.wins[0][4].1 

						虽然数组不能这么取值，可以这么理解

						所以  	this.wins[0][0].1  就可以理解为  在 x=0, y=0, 上有第一种赢法
								this.wins[0][1].1  就可以理解为  在 x=0, y=1, 上有第一种赢法
								......

						以上this.wins[0][0],this.wins[0][1]...可以看作是 this.wins[x][y]
						所以第一种赢法的坐标就是: [0,0] [0,1] [0,2] [0,3] [0,4] 
				*/
			}
		}
	}

	for (var y = 0; y < this.col; y++) { //横向所有赢法, 同纵向赢法一样，也是15 * 11种
		for (var x = 0; x < this.col-4; x ++) {
			this.winsCount ++;
			for (var k = 0; k < 5; k ++) {
				this.wins[x+k][y][this.winsCount] = true;
			}
		}
	}




	/*
		交叉赢法
	*/
	for (var x = 0; x < this.col-4; x++) { // 左 -> 右 开始的所有交叉赢法  总共11 * 11种
		for (var y = 0; y < this.col-4; y ++) {
			this.winsCount ++;

			/*
			如:
			1.	[0,0]
				[1,1]
				[2,2]
				[3,3]
				[4,4]
			
			2.  [0,1]
				[1,2]
				[2,3]
				[3,4]
				[4,5]

			3.	[0,2]
				[1,3]
				[2,4]
				[3,5]
				[4,6]
			...

				[1,0]
				[2,1]
				[3,2]
				[4,3]
				[5,5]

			相当于从左至右  一列列计算过去

			*/

			for (var k = 0; k < 5; k ++) {
				this.wins[x+k][y+k][this.winsCount] = true;
			}
		}
	}

	for (var x = this.col-1; x >= 4; x --) { //右 -> 左 开始的所有交叉赢法  总共11 * 11种
		for (var y = 0; y < this.col-4; y ++) {
			this.winsCount ++;
			for (var k = 0; k < 5; k ++) {
				this.wins[x-k][y+k][this.winsCount] = true;
			}
		}
	}
}



//落子实现
Gobang.prototype.dorpChess = function(){
	var that = this;
	this.canvas.addEventListener('click', function(e) {
		// 判断是否结束
		if (that.over) return;

		var x = Math.floor((e.offsetX)/24),
			y = Math.floor((e.offsetY)/24);

		//判断该棋子是否已存在
		if (that.allChesses[x][y]) return;

		// 检查落子情况
		that.checkChess(x, y)

		if (!that.over) {
			that.player = false;
			that.computerDropChess()
		}
	})
}

// 计算机落子
Gobang.prototype.computerDropChess = function(){
	var myScore = [], //玩家比分
		computerScore = [], // 电脑比分
		maxScore = 0; //最大比分
	

	//比分初始化
	var scoreInit = function(){
		for( var x = 0; x < this.col; x ++) {  
			myScore[x] = [];
			computerScore[x] = [];
			for (var y = 0; y < this.col; y ++) {
				myScore[x][y] = 0;
				computerScore[x][y] = 0;
			}
		}
	}
	scoreInit.call(this);

	//电脑待会落子的坐标
	var x = 0, y = 0; 

	// 基于我和电脑的每种赢法拥有的棋子来返回对应的分数
	function formatScore(o, n) { 
		if (o < 6 && o > 0) {
			var n = 10;
			for (var i = 0; i < o; i++) {
				n *= 3;
			}
			return n
		}
		return 0
	}

	// 获取没有落子的棋盘区域
	function existChess(arr) { 
		var existArr = [];
		for (var i = 0; i < arr.length; i++) {
			for (var j = 0; j < arr[i].length; j++) {
				if (!arr[i][j]) {
					existArr.push({x:i, y:j})
				}
			}
		}
		return existArr;
	}

	var exceptArr = existChess(this.allChesses);

	// 循环未落子区域，找出分数最大的位置
	for (var i = 0; i < exceptArr.length; i++) { 
		var o = exceptArr[i];

		// 循环所有赢的方法
		for (var k = 0; k < this.winsCount; k++) {

			//判断每个坐标对应的赢法是否存在
			if (this.wins[o.x][o.y][k]) {

				// 计算每种赢法，拥有多少棋子，获取对应分数
				// 电脑起始分数需要高一些，因为现在是电脑落子， 优先权大
				myScore[o.x][o.y] += formatScore(this.myWins[k-1], 10);
				computerScore[o.x][o.y] += formatScore(this.computerWins[k-1], 11); 
			}
		}

		//我的分数判断
		if (myScore[o.x][o.y] > maxScore) { //当我的分数大于最大分数时， 证明这个位置的是对我最有利的
			maxScore = myScore[o.x][o.y];
			x = o.x;
			y = o.y;
		}else if (myScore[o.x][o.y] === maxScore) { //当我的分数与最大分数一样时， 证明我在这两个位置下的效果一样， 所以我们应该去判断在这两个位置时，电脑方对应的分数
			if (computerScore[o.x][o.y] > computerScore[x][y]) {
				x = o.x;
				y = o.y;
			}
		}

		// 电脑分数判断， 因为是电脑落子， 所以优先权大
		if (computerScore[o.x][o.y] > maxScore) {
			maxScore = computerScore[o.x][o.y];
			x = o.x;
			y = o.y;
		}else if (computerScore[o.x][o.y] === maxScore) {
			if (myScore[o.x][o.y] > myScore[x][y]) {
				x = o.x;
				y = o.y;
			}
		}
	}

	this.checkChess(x, y)

	if (!this.over) {
		this.player = true;
	}
}

//检查落子情况
Gobang.prototype.checkChess = function(x, y){
	//画棋
	this.drawChess(x, y, this.player);
	//记录落下的棋子
	this.existChesses.push({
		x: x,
		y: y,
		player: this.player
	});
	//该位置棋子置为true,证明已经存在
	this.allChesses[x][y] = true;

	this.currWinChesses(x, y, this.player);
}

//判断当前坐标赢的方法各自拥有几粒棋子
Gobang.prototype.currWinChesses = function(x, y, player){
	var currObj = player ? this.myWins : this.computerWins;
	var enemyObj = player ? this.computerWins : this.myWins;
	var currText = player ? '我' : '电脑';
	for (var i = 1; i <= this.winsCount; i++) {
		if (this.wins[x][y][i]) { //因为赢法统计是从1开始的  所以对应我的赢法需要减1
			currObj[i-1] ++;  // 每个经过这个点的赢法都增加一个棋子;

			enemyObj[i-1] = 6; //这里我下好棋了,证明电脑不可能在这种赢法上取得胜利了， 置为6就永远不会到5

			if (currObj[i-1] === 5) { //当达到 5 的时候,证明我胜利了
				alert(currText+'赢了')
				this.over = true;
			}
		}
	}
}
