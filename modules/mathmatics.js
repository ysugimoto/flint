/**
* mathmatics library - 数学・幾何学計算ユーティリティ
* @note このクラスでは座標値を配列で持たせる。
* 			   また、2次元と3次元はそれぞれ別メソッドで定義する（高速化のため）。
* 			   [メソッド名]2D - ２次元 [メソッド名]3D - 3次元
* ex . 2 dimension - [x, y]
* 		  3 dimension - [x, y, z]
**/

//(function(){

	var Point2D = [], Point3D = [], M = {}, radList = {};
	// alias
	var ms = Math.sqrt,
			mr = Math.round,
			mp = Math.pow,
			ma = Math.abs,
			sin = Math.sin,
			cos = Math.cos,
			tan = Math.tan,
			asin = Math.asin,
			acos = Math.acos,
			atan = Math.atan,
			pai = Math.PI,
			apai = 1 / Math.PI,
			pi = parseInt;

	// isArray - 配列かどうかをBooleanで返却
	function isArray(a) { return (typeof a === 'object' && a.constructor === Array);};

	// Pythagorean - ピタゴラスの定理に基づき2点間の距離を計算
	function Pythagorean() {
		var a = arguments; len = arguments.length, tmp;
		for (var i = 0; i < len; i++) tmp = tmp + a[i] * a[i];
		return ms(tmp);
	};
	//座標系での処理
	function Pythagorean2D(p1, p2) {
		var x = p2[0] - p1[0], y = p2[1] - p1[1];
		return ms(x * x + y * y);
	};
	function Pythagorean3D(p1, p2) {
		var x = p2[0] - p1[0], y = p2[1] - p1[1], z = p2[2] - p1[2];
		return ms(x * x + y * y + z * z);
	};

	// MidPoint - 中点を求める
	function MidPoint2D(p1, p2) {
		return [(p2[0] + p1[0]) / 2, (p2[1] + p1[1]) / 2];
	};
	function MidPoint3D(p1, p2) {
		return [(p2[0] + p1[0]) / 2, (p2[1] + p1[1]) / 2, (p2[2] + p1[2]) / 2];
	};

	// toRad - 度をラジアンに変換
	function toRad(deg) {
		return deg * pai / 180;
	};
	// toDeg - ラジアンを度に変換
	function toDeg(rad){
		return rad * 180 * apai;
	};

	// 三角関数テーブルの生成
	for (var i = 0; i <= 360; i++) {
		var rad = toRad(i);
		radList[i] = {sin : sin(rad), cos : cos(rad), tan : tan(rad)};
	}

	// RadVal - テーブルから角度に対応した計算値オブジェクトを取得
	// @param int deg - 角度
	// @return  float value - 計算値
	function RadVal(deg) { return radList[pi(ma(deg) % 360)];};

	// Vector2DDec - デカルト座標からベクトル生成
	 //  @param int x - x座標
	 // 				int y - y座標
	function Vector2DDec(x, y) {
		var rad = atan(y / x);
		var d = toDeg(rad) % 360;
		var direction = ( 0 <= d && d < 90) ? 1
								: (90 <= d && d < 180) ? 2
								: (180 <= d && d < 270) ? 3
								: 4;
		return new Vector2D(x, y, ms(x * x + y * y), rad, direction);
	};


	// Vector2DCoord - 極座標からベクトル生成
	//  @param int vec - 進行方向距離
	//  				int rad - 進行角ラジアン
	function Vector2DCoord(vec, rad) {
		var d = toDeg(rad) % 360;
		var direction = ( 0 <= d && d < 90) ? 1
								: (90 <= d && d < 180) ? 2
								: (180 <= d && d < 270) ? 3
								: 4;
		return new Vector2D(vec * cos(rad), vec * sin(rad), vec, rad, direction);
	}



	/**
	 *  Vector -ベクトルクラス
	 */
	// Vector2D - 2次元ベクトルクラス
	function Vector2D(x, y, vec, rad, d) {
		// 内部的には極座標で保持する
		this.x = x;
		this.y = y;
		this.vec = vec;
		this.rad = rad;
		/* 正弦方向 this.direction
		 * 	1 : 第一正弦
		 * 	2 : 第二正弦
		 * 	3 : 第三正弦
		 * 	4 : 第四正弦
		 */
		this.direction = d;
		// 行列表記
		this.matrix = [[x], [y]];
	}

	// Vector2D内部共有メソッド
	Vector2D.prototype = {

		// add - ベクトル合成
		// @param Vector2D mixVector - 2Dベクトルクラスインスタンス
		// @return Vector2D - 新しく生成した2Dベクトル
		add : function(mixVector) {
			if (!(mixVector instanceof Vector2D)) throw new TypeError('invalid argument of Vector2D.add');
			// 新しく生成したVector2Dインスタンスを返却
			return Vector2DDec(this.x + mixVector.x, this.y + mixVector.y);
		},

		// dotProduct - ベクトルの内積
		// @param Vector2D v - 2Dベクトル
		// @return int scaler - スカラー積
		dotProduct : function(v) {
			if (!(v instanceof Vector2D)) throw new TypeError('invalid argument of Vector2D.dotproduct');
			return this.x * v.x + this.y * v.y;
		},

		// calcDeg - ベクトル間のなす角の計算
		// @param Vector2D v - 2Dベクトル
		calcDeg : function(v) {
			if (!(v instanceof Vector2D)) throw new TypeError('invalid argument of Vector2D.dotproduct');
			var dp = this.dotProduct(v);
			return acos(dp / (this.vec * v.vec));
		},

		// isVertical - ベクトル同士が垂直かどうか
		// @param Vector2D v
		// @retiurn bool isVertical
		isVertical : function(v) {
			if (!(v instanceof Vector2D)) throw new TypeError('invalid argument of Vector2D.isVertical');
			return (this.dotProduct(v) === 0);
		},

		// recalc - 計算後のマトリックスを再構成
		recalc : function() {
			this.matrix = [[this.x], [this.y]];
			this.vec = ms(this.x * this.x + this.y * this.y);
			return this;
		},

		// times - ベクトルのスカラー倍を計算
		// @param Number num - スカラー倍の量
		times : function(num) {
			this.x = num * this.x;
			this.y = num * this.y;
			return this.recalc();

		},

		// toRegular - ベクトルの正規化
		toRegular : function() {
			this.x = mr(this.x /this.vec);
			this.y = mr(this.y / this.vec);
			this.matrix = [[this.x], [this.y]];
			return this;
		}
	};

	// Vector3D - 3次元ベクトルクラス
	function Vector3D(x, y, z) {
		// 角度、方向については冗長なので実装しない
		this.x = x;
		this.y = y;
		this.z = z;
		this.vec = ms(x * x + y * y + z * z);
		this.matrix = [[x], [y], [z]];
	};

	// Vector3D内部共有メソッド
	Vector3D.prototype = {

		// add - ベクトル合成
		// @param Vector3D mixVector - 3Dベクトルクラスインスタンス
		add : function(mixVector) {
			if (!(mixVector instanceof Vector3D)) throw new TypeError('invalid argument of Vector3D.add');
			// 新しく生成したVector3Dインスタンスを返却
			return Vector3D(this.x + mixVector.x, this.y + mixVector.y, this.z + mixVector.z);
		},

		// dotProduct - 内積計算
		// @param Vector3D v - 3Dベクトル
		// @return int scaler -内積
		dotProduct : function(v) {
			if (!(v instanceof Vector3D)) throw new TypeError('invalid argument of Vector3D.dotProduct');
			return this.x * v.x + this.y * v.y + this.z * v.z;
		},

		// crossProduct - 外積計算
		// @param Vecotr3D v - 3Dベクトル
		// @return Vector3D - 新しい3Dベクトル
		crossProduct : function(v) {
			if (!(v instanceof Vector3D)) throw new TypeError('invalid argument of Vector3D.crossProduct');
			var x = this.y * v.z - (this.z * v.y), y = this.z * v.x - (this.x * v.z), z = this.x * v.y - (this.y * v.x);
			return new Vector3D(x, y, z);
		},

		// normal - 面法線ベクトル計算
		// @param Vector3D v - 3Dベクトル
		// @return Vector3D - 新しい面法線ベクトル
		normal : function(v) {
			if (!(v instanceof Vector3D)) throw new TypeError('invalid argument of Vector3D.normal');
			var n3d = this.crossProduct(v);
			return n3d.toRegular();
		},

		// isVertical - ベクトル同士が垂直かどうか判定
		// @param Vector3D v
		// @return bool isVertical
		isVertical : function(v) {
			if (!(v instanceof Vector3D)) throw new TypeError('invalid argument of Vector3D.isVertical');
			return (this.dotProduct(v) === 0);
		},

		// recalc - 計算後のマトリックスを再構成
		recalc : function() {
			this.matrix = [[this.x], [this.y], [this.z]];
			this.vec = ms(this.x * this,x +  this.y * this.y + this.z * this.z);
			return this;
		},

		// times - ベクトルのスカラー倍を計算
		// @param Number num - スカラー倍の量
		times : function(num) {
			this.x = num * this.x;
			this.y = num * this.y;
			this.z = num * this.z;
			return this.recalc();
		},

		// toRegular - ベクトルの正規化
		toRegular : function() {
			this.x = mr(this.x / this.vec);
			this.y = mr(this.y / this.vec);
			this.z = mr(this.z / this.vec);
			this.matrix = [[this.x], [this.y], [this.z]];
			return this;
		}
	};


	/**
	 * 各図形を保持するクラス
	 */
	// Liner - 直線（1次線形）
	// @param  Array p1 - 個別解[x1, y1]
	//                Array p2 - 個別解[x2, y2]
	function Liner(p1, p2) {
		this.angle = (p2[1] - p1[1]) / (p2[0] - p1[0]); // angle - 直線の傾き
		this.cut = p1[1] - this.angle * p1[0];
		this.point = [p1, p2]; // 個別解のリストとする
		/*式 this.y = (this.a * this.x) + this.b */
	}

	// Quadratic - 縦型放物線（2次線形）
	// @param  Array c - 中心座標[x1, y1]
	//                Array p - 個別解[x2, y2]
	function Quadratic(c, p) {
		this.angle = (p[1] - c[1]) / ((p[0] - (c[0])) * (p[0] - (c[0])));// 放物線の開き
		this.center = c; // 中心座標
		this.point = [c, p]; // 個別解のリスト
	};

	// Circle - 円
	// @param Array c - 中心座標[x, y]
	//               Mixed r - 半径 or 境界座標[x, y];
	function Circle(c, r) {
		this.radius = (isArray(r)) ? Pythagorean2D(c, r) : r;
		this.center = c;
	};

	Circle.prototype = {
		// collision - 衝突判定
		collision : function(circle) {
			if (!(circle instanceof Circle)) throw new TypeError('invalid arguments of Circle.collision');
			var c = circle, x = (c.center[0] - this.center[0]) * (c.center[0] - this.center[0]),
				y = (c.center[1] - this.center[1]) * (c.center[1] - this.center[1]),
				r = (c.radius + this.radius) * (c.radius + this.radius);
			return ((x + y) <= r);
		}
	};

	// Ball - 球
	// @param Array c - 中心座標[x, y, z]
	//               Mixed r - 半径 or 境界座標[x, y, z]
	function Ball(c ,r) {
		this.radius = (isArray(r)) ? Pythagorean3D(c, r) : r;
		this.center = c;
	};

	Ball.prototype = {
		// collision - 衝突判定
		collision : function(ball) {
			if (!(ball instanceof Ball)) throw new TypeError('invalid arguments of Ball.collision');
			var b = ball, x = (b.center[0] - this.center[0]) * (b.center[0] - this.center[0]),
				y = (b.center[1] - this.center[1]) * (b.center[1] - this.center[1]),
				z = (b.center[2] - this.center[2]) * (b.center[2] - this.center[2]),
				r = (b.radius + this.radius) * (b.radius + this.radius);
			return ((x + y + z) <= r);
		}
	};

	/**
	 * Matrix - 汎用行列クラス
	 */
	// Matrix - 基本的な行列を生成するクラス
	// @param Number n - 行数
	// @param Number m - 列数
	function Matrix(arr) {
		if (!isArray(arr)) throw new TypeError('Matrix constructor arguments must be an Array');
		this.matrix = arr;
		this.rows = arr.length;
		this.cols = arr[0].length;
		this.dimension = (this.rows === 3 && this.cols === 3) ? 3
									: (this.rows === 2 && this.cols === 2) ? 2
											: 0;
	};

	// Matrix.prototype - 共有メソッド
	Matrix.prototype = {
		// add - マトリックス加算
		// @param Matrix m - マトリックス行列
		// @return M - thisマトリックス
		add : function(mat) {
			if (!(mat instanceof Matrix) || !(this.rows === mat.rows && this.cols === mat.cols)) throw new TypeError('invalid arguments of Matirx.add');
			var i, j, M = this.matrix, m = mat.matrix;
			for (i = 0; i < this.rows; i++) {
				for (j = 0; j < this.cols; j++) {
					M[i][j] = M[i][j] + m[i][j];
				}
			}
			return M;
		},
		// substruct - マトリックス減算
		// @param Matrix m - マトリックス行列
		// @return M - thisマトリックス
		minus : function(mat) {
			if (!(mat instanceof Matrix) || !(this.rows === mat.rows && this.cols === mat.cols)) throw new TypeError('invalid arguments of Matirx.substruct');
			var i, j, M = this.matrix, m = mat.matrix;
			for (i = 0; i < this.rows; i++) {
				for (j = 0; j < this.cols; j++) {
					M[i][j] = M[i][j] - m[i][j];
				}
			}
			return M;
		},
		// scalarMultiply - スカラー倍計算
		// @param Number num - スカラー値
		// @return M - thisマトリックス
		scalarMultiply : function(num) {
			var i, j, M = this.matrix;
			for (i = 0; i < this.rows; i++) {
				for (j = 0; j < this.cols; j++) {
					M[i][j] = num * M[i][j];
				}
			}
			return M;
		},
		// multiply - 汎用マトリックス乗算
		// @param Matrix mat - マトリックスインスタンス
		// @return Matrix - 新しいマトリックス行列
		// @note このメソッドは異なる行列の計算に用いる。
		//             高速な計算は行列数決め打ちのmultiply2D(2×2), mutiply3D(3×3)を使用する方が良い
		multiply : function(mat) {
			if (!(mat instanceof Matrix)) throw new TypeError('invalid arguments of Matirx.multiply');
			//マトリックスの乗算には元行列の列数と乗算する行列の行数が一致しなければならない
			//if (this.cols !== mat.rows) throw new TypeError('cannot multiply matrix at Matrix.mutiply');
			var i, j , k, M = this.matrix, m = mat.matrix, res = [];
			for (i = 0; i < this.rows; i++) {
				res[i] = [];
				for (j = 0; j < mat.cols; j++) {
					res[i][j] = 0;
					for (k = 0; k < this.rows; k++) {
						res[i][j] = res[i][j] + (M[i][k] * m[k][j]);
					}
				}
			}
			return new Matrix(res);
		},
		// multiply2D - 2×2行列専用乗算
		// @param Matrix mat - マトリックスインスタンス
		// @return Matrix - 新しいマトリックス行列
		multiply2D : function(mat) {
			if (!(mat instanceof Matrix)
				|| !(this.rows === 2 && this.cols === 2 && mat.cols === 2 && mat.rows === 2)) throw new TypeError('invalid arguments of Matirx.multiply2D');
			var M =this.matrix, m = mat.matrix, res;
			res = [ [M[0][0] * m[0][0] + M[0][1] * m[1][0], M[0][0] * m[0][1] + M[0][1] * m[1][1]], [M[1][0] * m[0][0] + M[1][1] * m[1][0], M[1][0] * m[0][1] + M[1][1] * m[1][1]] ];
			return new Matrix(res);
		},
		// multiply3D - 3×3行列専用乗算
		// @param Matrix mat - マトリックスインスタンス
		// @return Matrix - 新しいマトリックス行列
		multiply3D : function(mat) {
			if (!(mat instanceof Matrix)
					|| !(this.rows === 3 && this.cols === 3 && mat.cols === 3 && mat.rows === 3)) throw new TypeError('invalid arguments of Matirx.multiply3D');
				var M =this.matrix, m = mat.matrix, res;
				res = [
				        [M[0][0] * m[0][0] + M[0][1] * m[1][0] + M[0][2] * m[2][0], M[0][0] * m[0][1] + M[0][1] * m[1][1] + M[0][2] * m[2][1], M[0][0] * m[0][2] + M[0][1] * m[1][2] + M[0][2] * m[2][2]],
				        [M[1][0] * m[0][0] + M[1][1] * m[1][0] + M[1][2] * m[2][0], M[1][0] * m[0][1] + M[1][1] * m[1][1] + M[1][2] * m[2][1], M[1][0] * m[0][2] + M[1][1] * m[1][2] + M[1][2] * m[2][2]],
				        [M[2][0] * m[0][0] + M[2][1] * m[1][0] + M[2][2] * m[2][0], M[2][0] * m[0][1] + M[2][1] * m[1][1] + M[2][2] * m[2][1], M[2][0] * m[0][2] + M[2][1] * m[1][2] + M[2][2] * m[2][2]]
				        ];
				return new Matrix(res);
		},
		// transposed - 行列の転置
		// @param none
		// @return Matrix - 新しいマトリックス行列
		// @note このメソッドは正方行列以外も転置できるが処理はやや遅いので、
		//            2×2、3×3の正方行列はそれぞれの専用メソッドの方が高速に転置できる
		transposed : function() {
			var m = this.matrix, res = [], i, j;
			for (i = 0; i < this.cols; i++) {
				res[i] = [];
				for (j = 0; j < this.rows; j++) {
					res[i][j] = m[j][i];
				}
			}
			return new Matrix(res);
		},
		// transposed2D - 2×2正方行列専用転置
		// @param none
		// @return Matrix - 新しいマトリックス行列
		transposed2D : function() {
			if (!(this.rows === 2 || this.cols === 2)) throw new TypeError('transposed2D method works only 2 by 2 matrix.');
			var m = this.matrix, res;
			res = [ [m[0][0], m[1][0]], [m[0][1], m[1][1]] ];
			return new Matrix(res);
		},
		// transposed3D - 3×3正方行列専用転置
		// @param none
		// @return Matrix - 新しいマトリックス行列
		transposed3D : function() {
			if (!(this.rows === 3 || this.cols === 3)) throw new TypeError('transposed3D method works only 3 by 3 matrix.');
			var m = this.matrix, res;
			res = [ [m[0][0], m[1][0], m[2][0]], [m[0][1], m[1][1], m[2][1]], [m[0][2], m[1][2], m[2][2]] ];
			return new Matrix(res);
		},
		// translate - 平行移動
		// @param Number dx - x方向移動距離
		//	               Number dy - y方向移動距離
		// @return this
		translate : function(dx, dy) {
			if (!(this.rows === 3 || this.cols === 3)) throw new TypeError('translate method works only 3 by 3 matrix.');
			var m = [[1, 0, dx], [0, 1, dy], [0, 0, 1]]; // 変換行列
			return this.multiply3D(m);
		}
	};

	/**
	 * 座標指定系次元別マトリックス
	 */
	// Matrix2D - 2次元マトリックスクラス
	// @param Number x - x座標
	// @param Number y - y座標
	function Matrix2D(x, y) {
		this.matrix = [[x], [y], [1]]; // translateできるように3次元にしておく
	};

	Matrix2D.prototype = {
		// multiply - マトリックス乗算
		// @param Array m - マトリックス配列
		multiply : function(m) {
			var M = this.matrix, res;
			res = [
			          [m[0][0] * M[0][0] + m[0][1] * M[1][0] + m[0][2] * M[2][0]],
			          [m[1][0] * M[0][0] + m[1][1] * M[1][0] + m[1][2] * M[2][0]],
			          [m[2][0] * M[0][0] + m[2][1] * M[1][0] + m[2][2] * M[2][0]]
			       ];
			this.matrix = res;
			return this;
		},
		// translate - 平行移動
		// @param Number dx - x方向移動距離
		//	               Number dy - y方向移動距離
		translate : function(dx, dy) {
			var m = [[1, 0, dx], [0, 1, dy], [0, 0, 1]]; // 変換行列
			return this.multiply(m);
		},
		// scale - 拡大
		// @param Number dw - 横幅拡大倍率
		//               Number dh - 縦幅拡大倍率
		scale : function(dw, dh) {
			var m = [[dw, 0, 0], [0, dh, 0], [0, 0, 1]]; // 変換行列
			return this.multiply(m);
		},
		// rotate - 回転
		// @param Number deg - 角度
		//               Bool isDeg - 角度の数値かどうか
		rotate : function(deg, isDeg) {
			//var r = isDeg ? toRad(deg) : deg;
			//var m = [[cos(r), -sin(r), 0], [sin(r), cos(r), 0], [0, 0, 1] ]; // 変換行列
			var r = isDeg ? radList[deg]: radList[toDeg(deg)];
			var m = [ [r.cos, -(r.sin), 0], [r.sin, r.cos, 0], [0, 0, 1] ] ;
			return this.multiply(m);
		}
	};

	/**
	 * マルチマトリックス合成 4 by 4
	 */
	function multipleMatrix(m, M) {
		var res = [
	           [m[0][0] * M[0][0] + m[0][1] * M[1][0] + m[0][2] * M[2][0] + m[0][3] * M[3][0], m[0][0] * M[0][1] + m[0][1] * M[1][1] + m[0][2] * M[2][1] + m[0][3] * M[3][1], m[0][0] * M[0][2] + m[0][1] * M[1][2] + m[0][2] * M[2][2] + m[0][3] * M[3][2], m[0][0] * M[0][3] + m[0][1] * M[1][3] + m[0][2] * M[2][3] + m[0][3] * M[3][3]],
	           [m[1][0] * M[0][0] + m[1][1] * M[1][0] + m[1][2] * M[2][0] + m[1][3] * M[3][0], m[1][0] * M[0][1] + m[1][1] * M[1][1] + m[1][2] * M[2][1] + m[1][3] * M[3][1], m[1][0] * M[0][2] + m[1][1] * M[1][2] + m[1][2] * M[2][2] + m[1][3] * M[3][2], m[1][0] * M[0][3] + m[1][1] * M[1][3] + m[1][2] * M[2][3] + m[1][3] * M[3][3]],
	           [m[2][0] * M[0][0] + m[2][1] * M[1][0] + m[2][2] * M[2][0] + m[2][3] * M[3][0], m[2][0] * M[0][1] + m[2][1] * M[1][1] + m[2][2] * M[2][1] + m[2][3] * M[3][1], m[2][0] * M[0][2] + m[2][1] * M[1][2] + m[2][2] * M[2][2] + m[2][3] * M[3][2], m[2][0] * M[0][3] + m[2][1] * M[1][3] + m[2][2] * M[2][3] + m[2][3] * M[3][3]],
	           [m[3][0] * M[0][0] + m[3][1] * M[1][0] + m[3][2] * M[2][0] + m[3][3] * M[3][0], m[3][0] * M[0][1] + m[3][1] * M[1][1] + m[3][2] * M[2][1] + m[3][3] * M[3][1], m[3][0] * M[0][2] + m[3][1] * M[1][2] + m[3][2] * M[2][2] + m[3][3] * M[3][2], m[3][0] * M[0][3] + m[3][1] * M[1][3] + m[3][2] * M[2][3] + m[3][3] * M[3][3]]
	       ];
		return res;
	};

	/**
	 * 投影変換用マトリックスクラス
	 */
	function GeometryMatrix(m) {
		this.matrix = m || [ [1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1] ];
	}
	GeometryMatrix.prototype = {
		multiple : function(m) {
			res = multipleMatrix(this.matrix, m.matrix);
			return new GeometryMatrix(res);
		},
		translate : function(dx, dy, dz) {
			return new GeometryMatrix([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [dx, dy, dz, 1]]); // 変換行列
		},
		scale : function(dw, dh, dz) {
			return new GeometryMatrix([[dw, 0, 0, 0], [0, dh, 0, 0], [0, 0, dz, 0], [0, 0, 0, 1]]); // 変換行列
		},
		perspective : function(w, h, near, far) {
			return new GeometryMatrix([ [2 * near / w, 0, 0, 0], [0, 2 * near / h, 0, 0], [0, 0, far / (far - near), 1], [0, 0, near * far / (near - far), 0] ]);
		},
		pitch : function(deg) {
			var c = cos(deg), s = sin(deg);
			return new GeometryMatrix([ [1, 0, 0, 0], [0, c, s, 0], [0, -s, c, 0], [0, 0, 0, 1] ]);
		},
		yaw : function(deg) {
			var c = cos(deg), s = sin(deg);
			return new GeometryMatrix([ [c, 0, -s, 0], [0, 1, 0, 0], [-s, 0, c, 0], [0, 0, 0, 1] ]);
		},
		role : function(deg) {
			var c = cos(deg), s = sin(deg);
			return new GeometryMatrix([ [c, -s, 0, 0], [s, c, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1] ]);
		},
		toVector3D : function(x, y, z) {
			var m = this.matrix;
			var vx = x * m[0][0] + y * m[1][0] + z * m[2][0] + m[3][0],
			      vy = x * m[0][1] + y * m[1][1] + z * m[2][1] + m[3][1],
			      vz = x * m[0][2] + y * m[1][2] + z * m[2][2] + m[3][2],
			      vw = x * m[0][3] + y * m[1][3] + z * m[2][3] + m[3][3];
			return new Matrix3D(vx, vy, vz, vw);
		},
/*
		// role - z軸回転
		// @param Number deg - 回転角度
		//               Number isDeg - 角度の数値かどうか
		role : function(deg, isDeg) {
			var r = (isDeg) ? radList[pi(deg) % 360] : radList[toDeg(deg)];
			var m = [ [r.cos, -(r.sin), 0, 0], [r.sin, r.cos, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1] ]; // 変換行列
			//return this.multiply(m);
			return this.multiple(m);
		},
	// pitch - x軸回転
		// @param Number deg - 回転角度
		//               Number isDeg - 角度の数値かどうか
		pitch : function(deg, isDeg) {
			var r = (isDeg) ? radList[deg % 360] : radList[toDeg(deg)];
			var m = [ [1, 0, 0, 0], [0, r.cos, -(r.sin), 0], [0, r.sin, r.cos, 0], [0, 0, 0, 1] ]; //変換行列
			//return this.multiply(m);
			this.multiple(m);
			return this;
		},
		// yaw - y軸回転
		// @param Number deg - 回転角度
		//               Number isDeg - 角度の数値かどうか
		yaw : function(deg, isDeg) {
			var r = (isDeg) ? radList[deg % 360] : radList[toDeg(deg)];
			var m = [ [r.cos, 0, r.sin, 0], [0, 1, 0, 0], [-(r.sin), 0, r.cos, 0], [0, 0, 0, 1] ]; // 変換行列
			//return this.multiply(m);
			this.multiple(m);
			return this;
		},
*/
		get : function() {return this.matrix;}
	}

	// Matrix3D - 3次元マトリックスクラス
	// @param Number x - x座標
	// @param Number y - y座標
	// @param Number z - z座標
	function Matrix3D(x, y, z, w) {
		this.matrix = [[x], [y], [z], [w || 1]];
		this.subMatrix = [];
	};

	Matrix3D.prototype = {
		// multiply - マトリックス乗算
		// @param Array m - 変換行列マトリックス
		multiply : function(m) {
			var M = this.matrix, res;
			res = [
			           [m[0][0] * M[0][0] + m[0][1] * M[1][0] + m[0][2] * M[2][0] + m[0][3] * M[3][0]],
			           [m[1][0] * M[0][0] + m[1][1] * M[1][0] + m[1][2] * M[2][0] + m[1][3] * M[3][0]],
			           [m[2][0] * M[0][0] + m[2][1] * M[1][0] + m[2][2] * M[2][0] + m[2][3] * M[3][0]],
			           [m[3][0] * M[0][0] + m[3][1] * M[1][0] + m[3][2] * M[2][0] + m[3][3] * M[3][0]]
			       ];
			this.matrix = res;
			return this;
		},
		// correct2D - 2次元用に補正
		correct2D : function(vw, vh) {
			var x = this.matrix[0][0], y = this.matrix[1][0], z = this.matrix[2][0], w = this.matrix[3][0];
			this.matrix = [[(x / w * vw) + (vw / 2)], [(y / w * -vh) + (vh / 2)], [z / w], [w]];
			return this;
		},
		// translate - 平行移動
		// @param Number dx - x方向移動距離
		//	               Number dy - y方向移動距離
		//                Number dz - z方向移動距離
		translate : function(dx, dy, dz) {
			var m = [[1, 0, 0, dx], [0, 1, 0, dy], [0, 0, 1, dz], [0, 0, 0, 1]]; // 変換行列
			//return this.multiply(m);
			this.subMatrix.push(m);
		},
		// scale - 拡大
		// @param Number dw - 横幅拡大倍率
		//               Number dh - 縦幅拡大倍率
		//               Number dz - 奥行拡大倍率
		scale : function(dw, dh, dz) {
			var m = [[dw, 0, 0, 0], [0, dh, 0, 0], [0, 0, dz, 0], [0, 0, 0, 1]]; // 変換行列
			//return this.multiply(m);
			this.subMatrix.push(m);
		},
		// role - z軸回転
		// @param Number deg - 回転角度
		//               Number isDeg - 角度の数値かどうか
		role : function(deg, isDeg) {
			var r = (isDeg) ? radList[deg % 360] : radList[toDeg(deg)];
			var m = [ [r.cos, -(r.sin), 0, 0], [r.sin, r.cos, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1] ]; // 変換行列
			//return this.multiply(m);
			this.subMatrix.push(m);
		},
		// pitch - x軸回転
		// @param Number deg - 回転角度
		//               Number isDeg - 角度の数値かどうか
		pitch : function(deg, isDeg) {
			var r = (isDeg) ? radList[deg % 360] : radList[toDeg(deg)];
			var m = [ [1, 0, 0, 0], [0, r.cos, -(r.sin), 0], [0, r.sin, r.cos, 0], [0, 0, 0, 1] ]; //変換行列
			//return this.multiply(m);
			this.subMatrix.push(m);
		},
		// yaw - y軸回転
		// @param Number deg - 回転角度
		//               Number isDeg - 角度の数値かどうか
		yaw : function(deg, isDeg) {
			var r = (isDeg) ? radList[deg % 360] : radList[toDeg(deg)];
			var m = [ [r.cos, 0, r.sin, 0], [0, 1, 0, 0], [-(r.sin), 0, r.cos, 0], [0, 0, 0, 1] ]; // 変換行列
			//return this.multiply(m);
			this.subMatrix.push(m);
		},
		// rotate - xyz軸一括回転
		// @param Number deg - 回転角度
		//               Number isDeg - 角度の数値かどうか
		rotate : function(deg, isDeg) {
			this.role(deg, isDeg);
			this.pitch(deg, isDeg);
			this.yaw(deg, isDeg);
		},
		// assignToDirectX - DirectX用に行ベクトルに変換する
		assignToDirectX : function() {
			var m = new Matrix(this.matrix);
			this.matrix = m.transposed().matrix;
			return this;
		},
		// perspectiveProjection - 投影変換によるスクリーン座標系への変換
		// @param Number deg - 視野角
		//               Number fov - 視点からの距離
		//               Number w - 大きさ
		perspectiveProjection : function(angle, fov, size, mat) {
			//var fov =  1 / tan(toRad(angle * 0.5));
			//this.multiply(mat);
			var m = this.matrix, x, y;
			x = m[0][0] / m[2][0] * fov * size;
			y = m[1][0] / m[2][0] * fov * size;
			x += size / 2;
			y += size / 2;
			return [x, y, m[2][0]];
		},
		// orthogonalProjection - 平行投影変換によるスクリーン座標系への変換
		orthogonalProjection : function() {
			var m = this.matrix, x, y, z;
			return [m[0][0], m[1][0], m[2][0]];
		},
		// set - マトリックスの値を直接変更
		set : function(x, y, z) {
			this.matrix = [[x], [y], [z], [1]];
		}
	};
	n = 100;


//})();