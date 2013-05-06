/**
 * Canvas Emulator for IE6+
 * this plugin suppies SVG wih Cavnas element emurate for IE VML.
 *
 * referenced wonderful library excanvas.js http://code.google.com/p/explorercanvas/ thanks!
 * referenced great library uuCanvas.js http://code.google.com/p/uupaa-js-spinoff/ thanks!
 * @ahthor Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * @create 2010/01/28
 */

(function() {

	var FL = getInstance(), doc = document, win = window;
	var CanvasChecked = 0;


	// IEonly
	if (doc.namespaces) {
		var dn = doc.namespaces;
		if (!dn.v) {dn.add('v', 'urn:schemas-microsoft-com:vml', '#default#VML');}
		if (!dn.v_o) {dn.add('v_o', 'urn:schemas-microsoft-com:office:office', '#default#VML');}
		if (!doc.styleSheets.fl_canvas) {
			var ss = doc.createStyleSheet();
			ss.owningElement.id = 'fl_canvas';
			ss.cssText = 'canvas{display:inline-block;overflow:hidden;' +
			'text-align:left;width:300px;height:150px;}' +
			'v\\:*{behavior:url(#default#VML)}' +
			'v_o\\:*{behavior:url(#default#VML)}';
		}
		FL.event.set(doc, 'DOMReady', function(){
			var cv = doc.getElementsByTagName('canvas'), cvlen = cv.length, i = 0;
			for (i; i < cvlen; i++) {Canvas(cv[i]);}
			CanvasChecked = 1;
		});
	}

	// local handleEvents for IE
	var propChangeHandle = function(ev) { // onpropertychange handle
		var elm = ev.srcElement, p = ev.propertyName, dim;
		if (p === 'style.width' || p === 'style.height') {
			dim = elm.getBoundingClientRect();
			elm.style.width = (dim.right - dim.left) + 'px';
			elm.style.height = (dim.bottom - dim.top) + 'px';
		}
	};
	var resizeHandle = function(e) { // onresize
		var elm = win.event.srcElement, f = elm.firstChild;
		if (f && f.nodeType === 1) {
			f.style.width = elm.clientWidth + 'px';
			f.style.height = elm.clientHeight + 'px';
		}
	};

	var Canvas = function(c) {
		if (!c) { c = doc.createElement('canvas');}
		if (c.getContext) { // for native Canvas supports
			//if (c.__context) {return c.__context;} // guard IE multiple extend
//			var nativeGetContext = c.getContext;
//			c.__ctx = c.getContext('2d');
//			c.getContext = function() { // overwrite native function
//				// nativeのCanvasRenderingContext2Dをフックする
//				var obj =  new Core.Canvas.getContextExtend(c);
//				//return new Core.Canvas.getContextExtend(ctx);
//				return obj;
//			};
			return c;
		}
		// for IE
		c.getContext = function(dim) {
			if (!dim || dim !== '2d') {throw new TypeError('getContext supportsw only 2d');}
			return c.__context || new getContextEmurate(c);
		};
		var cs = c.runtimeStyle, cp = cs.position;
		c.attachEvent('onpropertychange', propChangeHandle);
		c.attachEvent('onresize', resizeHandle);
		c.style.width = c.getAttribute('width') || cs.width || 300 + 'px';
		c.style.height = c.getAttribute('height') || cs.height || 300 + 'px';
		c.style.position = (/absolute|fixed/.test(cp)) ? cp : 'relative';
		return c;
	};

	Canvas.create = function() {
		var c = doc.createElement('canvas');
		return Canvas(c);
	};


	/**
	* Matrix Utility Oject
	* Matrix controll
	* defined like:
	*	[
	*		[1, 0, 0]  x line
	*		[0, 1, 0]  y line
	*		[0, 0, 1]  z line
	*	]
	*/
	var mc = Math.cos, ms = Math.sin, mt = Math.tan, mr = Math.round; // alias
	var MatrixUT = {
		// ident - マトリックス初期化
		ident  : function() { return [ [1, 0, 0], [0, 1, 0], [0, 0, 1] ];},
		// translate - 平行移動
		translate : function(dx, dy, c) {
			c.matrix = MatrixUT.multiple([ [1, 0, dx], [0, 1, dy], [0, 0, 1] ], c.matrix);
		},
		// scale - 拡大
		scale : function(sx, sy, c) {
			c.matrix = MatrixUT.multiple([ [sx, 0, 0], [0, sy, 0], [0, 0, 1] ], c.matrix);
			var m = c.matrix;
			c.__opt.ls = Math.sqrt(m[0][0] * m[1][1] - m[1][0] * m[0][1]);
		},
		// rotate - 回転
		rotate : function(rad, c) {
			var cos = mc(rad), sin = ms(rad);
			c.matrix = MatrixUT.multiple([ [cos, -sin, 0], [sin, cos, 0], [0, 0, 1] ], c.matrix);
		},
		// skewX - X方向伸縮
		skewX : function(rad, c) {
			var tan = mt(rad);
			c.matrix = MatrixUT.multiple([ [1, tan, 0], [0, 1, 0], [0, 0, 1] ], c.matrix);
		},
		// skewY - Y方向伸縮
		skewY : function(rad, c) {
			var tan = mt(rad);
			c.matrix = MatrixUT.multiple([ [ 1, 0, 0], [tan, 1, 0], [0, 0, 1] ], c.matrix);
		},
		// transform - マトリックス合成変換
		transform : function(m11, m12, m21, m22, dx, dy, c) {
			c.matrix = MatrixUT.multiple([ [m11, m12, dx], [m21, m22, dy], [0, 0, 1] ], c.matrix);
		},
		// setTrandform - マトリックスセット
		setTransform : function(m11, m12, m21, m22, dx, dy, c) {
			c.matrix = [ [m11, m12, dx], [m21, m22, dy], [0, 0, 1] ];
			var m = c.matrix;
			c.__opt.ls = Math.sqrt(m[0][0] * m[1][1] - m[1][0] * m[0][1]);
		},
		//multiple - マトリックス合成
		multiple : function(m, c) {
			return [
					[(m[0][0] * c[0][0] + m[0][1] * c[1][0]), (m[0][0] * c[0][1] + m[0][1] * c[1][1]), (m[0][0] * c[0][2] + m[0][1] * c[1][2] + m[0][2])],
					[(m[1][0] * c[0][0] + m[1][1] * c[1][0]), (m[1][0] * c[0][1] + m[1][1] * c[1][1]), (m[1][0] * c[0][2] + m[1][1] * c[1][2] + m[1][2])],
					[0, 0, 1]
				];
		},
		// utRgbaToHex - rgbaカラー変換
		// マトリックスとは直接関係ないメソッドだが、ここで定義しておく
		utRgbaToHex : function(expColor) {
			var alpha = 1, color = ['#'], num, pi = win.parseInt, pf = win.parseFloat;
			if (/^rgb[a]?\((.*?)\)/.test(expColor)) {
				var matches = expColor.replace(/^rgb[a]?\((.*?)\)/, '$1').split(',');
				for (var i = 0; i < 3; i++) {
					num = pi(matches[i], 10);
					num = (isNaN(num)) ? 0 : num.toString(16);
					color.push((num.length === 1) ? '0' + num : num);
				}
				return { c : color.join(''), a : (matches[3]) ? pf(matches[3]) : alpha};
			} else {
				return { c : expColor, a : alpha};
			}
		}
	};

	/**
	 * IE Canvas Emurate Class
	 */
	var getContextEmurate = function(e) {
		e.__context = this;
		// fake some paramtes like CanvasContextRendaring2D
		this.matrix = MatrixUT.ident();
		this.strokeStyle = '#000';
		this.fillStyle = '#000';
		this.lineJoin = 'miter';
		this.lineCap = 'butt';
		this.lineWidth = this.globalAlpha = this.arcScaleX = this.arcScaleY = this.lineSCale = 1;
		this.miterLimit = 10;
		this.canvas = e;
		// fonts paramter
		this.font = '10px Geogia';
		this.__defaultFontSize = 10;
		this.__defaultFontFamily = 'sans-serif';
		// advance parameters of "shadow"
		this.shadowOffsetX =  this.shadowOffsetY = 0;
		this.shadowBlur = 0;
		this.shadowColor = 'black';
		this.__shadowAlpha = 0;
		// emuratable hidden parameters
		this.__saveStack = this.__saveMStack = this.__history = this.__currentPath = [];
		this.__opt = { arcX : 1, arcY : 1, ls : 1};
		this.__zLayer = 1;
		this.__isOpenPath = this.__currentX = this.__currentY = 0;
		// create canvas innerElement
		this.__emurateElm = (function(div) {
			var pi = win.parseInt;
			div.style.width = pi(e.offsetWidth);
			div.style.height = pi(e.offsetHeight);
			div.style.overflow = 'hidden';
			div.style.position = 'absolute';
			div.style.margin= '0';
			div.style.padding = '0';
			e.appendChild(div);
			return div;
		})(doc.createElement('div'));
	};

	/**
	 * @note currentPathのスタック格納について
	 * スタックにはそれぞれパス情報が入ったハッシュを格納する。
	 * obj = { method : 描画方法
	 *			x : X座標
	 *			y : Y座標
	 *			etc...
	 * }
	 * methodのパラメータは以下参考
	 * m : move - 移動
	 * l : line - 線描画
	 * x : close - パスを閉じる
	 * at : arc(anticlockwise = false) - 円描画（反時計回り方向）
	 * wa : arc(anticlockwise = true) - 円描画（時計回り方向）
	 * c : quadraticCurveTo - ベジェ曲線描画
	 */

	getContextEmurate.prototype = {
		// get : canvasエレメントを返す
		get : function() { return this.canvas;},
		// __getPos - マトリックスから現在のxy座標を取得
		// @ access private
		__getPos : function(px, py) {
			var m = this.matrix;
			return {
				x : (px * m[0][0] + py * m[0][1] + m[0][2]),
				y : (px * m[1][0] + py * m[1][1] + m[1][2])
			};
		},
//		// clearRect - 範囲指定消去 ※現在は全消去のみ
//		clearRect : function(x, y) {
//			this.__emurateElm.innerHTML = '';
//		},
		// beginPath - パス記述開始宣言
		beginPath : function() {
			this.__currentPath = [];
			this.__isOpenPath = 1;
		},
		//rotate - canvas座標回転
		rotate : function(rad) { MatrixUT.rotate(rad, this); },
		// translate - canvas平行移動
		translate : function(dx, dy) { MatrixUT.translate(dx, dy, this); },
		// scale - canvas拡大
		scale : function(sx, sy) { MatrixUT.scale(sx, sy, this); },
		// transform - canvasマトリックス変換
		transform : function(m11, m12, m21, m22, dx, dy) { MatrixUT.transform(m11, m12, m21, m22, dx, dy, this); },
		// setTransform -  canvasマトリックスセット
		setTransform : function(m11, m12, m21, m22, dx, dy) { MatrixUT.setTransform(m11, m12, m21, m22, dx, dy, this); },
		// drawImage - 画像描画
		drawImage : function(img /* +arguments ... */) {
			var a = arguments;
			if (img.complete) {this.__drawImage(img, a);}
			else {
				var image = new Image(), that = this;
				image.onload = function(){ that.__drawImage(image, a);};
			}
		},
		// __drawImage - 画像描画
		__drawImage : function(img, args) {
			var p = {}, a = args, len = args.length, size = FL.image.getDefaultSize(img), d, prt = [];
			if (len === 3) {
				p = FL.union(p, {dx : a[1], dy : a[2], sx : 0, sy : 0, sw : size.width, sh : size.height, dw : size.width, dh : size.height});
			} else if (len === 5) {
				p = FL.union(p, {dx : a[1], dy : a[2], sx : 0, sy : 0, sw : size.width, sh : size.height, dw : a[3], dh : a[4]});
			} else if (len === 9) {
				p = FL.union(p, {dx : a[5], dy : a[6], sx : a[1], sy : a[2], sw :a[3], sh :a[4], dw : a[7], dh : a[8]});
			} else {
				throw Error('invalid arguments of drawImage');
			}
			d = this.__getPos(p.dx, p.dy);
			p.w2 = p.sw / 2; p.h2 = p.sh / 2;
			prt.push('<div', ' style="width:', p.dw, 'px;height:', p.dh, 'px;position;absolute;z-index:', ++this.__zLayer, ';');

			if (this.matrix[0][0] !== 1 || this.matrix[1][0]) { // マトリックスが変更されているかのチェック
				var filter = ['M11=', this.matrix[0][0], ',', 'M12=', this.matrix[0][1], ',', 'M21=', this.matrix[1][0], ',', 'M22=', this.matrix[1][1], ',', 'Dx=', mr(d.x), ',', 'Dy=', mr(d.y)];
				var c2 = this.__getPos(p.dx + p.dw, p.dy), c3 = this.__getPos(p.dx, p.dy + p.dh), c4 = this.__getPos(p.dx + p.dw, p.dy + p.dh);
				var max = { x : Math.max(d.x, c2.x, c3.x, c4.x), y : Math.max(d.y, c2.y, c3.y, c4.y)};
				prt.push('padding:0 ', mr(max.x), 'px ', mr(max.y), 'px 0;filter:progid:DXImageTransform.Microsoft.Matrix(', filter.join(''), ');"');
			} else { // マトリックス変更なしの場合
				prt.push('top:', mr(d.y), 'px;left:', mr(d.x), 'px;"');
			}
			prt.push(' >', '<div style=position:absolute;width', p.dw, 'px;height:', p.dh, 'px;filter:progid:DXIMageTransform.Microsoft.AlphaImageLoader(src=', img.src, ',sizingMethod=image)"></div>');
			prt.push('</div>');
			var out = prt.join('');
			this.__emurateElm.insertAdjacentHTML('BeforeEnd', out);
			this.__history.push(out);
			return out; // debug
		},
		// __makePath - パスとスタックのセット統括メソッド
		__makePath : function(m, p) {
			this.__currentPath.push({method : m, x : p.x, y : p.y});
			this.__currentX = p.x;
			this.__currentY = p.y;
		},
		// __isNonShadow - 影をつけるかどうか判定
		__isNonShadow : function() {
			return (this.shadowOffsetX === 0 && this.shadowOffsetY === 0 && this.shadowBlur === 0 && this.__shadowAlpha === 0);
		},
		// moveTo - パスの位置を移動
		moveTo : function(x, y) {
			this.__makePath('m', this.__getPos(x, y));
		},
		// lineTo - 線描画
		lineTo : function(x, y) {
			this.__makePath('l', this.__getPos(x, y));
		},
		// closePath - パスを閉じる
		closePath : function() {
			this.__currentPath.push({method : 'x'});
			this.__isOpenPath = 0;
		},
		// arc - 円描画
		arc : function(x, y, r, sa, ea, ac) {
			var mode = ac ? 'at' : 'wa', sx = x + r * mc(sa), sy = y + r * ms(sa),
					ex = x + r * mc(ea), ey = y + r * ms(ea), p, ep, sp;
			if (sx === ex && mode === 'wa') {sx += 0.125;}
			p = this.__getPos(x, y);
			sp = this.__getPos(sx, sy);
			ep = this.__getPos(ex, ey);
			this.__currentPath.push({method : mode, x : p.x, y : p.y, r : r, Sx : sp.x, Sy : sp.y, Ex : ep.x, Ey : ep.y});
		},
		// arcTo - 円弧パス追加
		arcTo : function(x1, y1, x2, y2, radius) {
			// APIがないので計算でなんとかする。
			var cos = Math.cos, acos = Math.acos, sq = Math.sqrt, tan = Math.tan, atan = Math.atan, asin = Math.asin, sin = Math.sin, cor;
			function AlKashi(a, b, c) { // 余弦定理
				return acos((b* b + c * c - a * a) / 2 / b / c);
			}
			function pitagoras(a ,b) { // ピタゴラスの定理
				return sq((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y));
			}
			var current = {x : this.__currentX, y : this.__currentY}; // 現在のパス地点
			var handle = this.__getPos(x1, y1); // ハンドルポイント1
			var end = this.__getPos(x2, y2); // 制御地点
			// まずは各地点間の絶対距離を得る
			var a = pitagoras(end, current), b = pitagoras(current, handle), c = pitagoras(end, handle);
			// 余弦定理により、handle地点のなす角を計算
			var theta = AlKashi(a, b, c); // theta = ハンドル角
			var x = handle.x - (atan(theta / 2) + sq(radius *radius - 2 * radius * radius * cos(Math.PI - theta)) / 2); // 開始接点X
			var y = handle.y - sq(radius *radius - 2 * radius * radius * cos(Math.PI - theta)); // 開始接点Y
			this.__makePath('l', {x : x, y : y});
			// handle座標の位置によるarcの描画angleを補正
			var angleC = acos((handle.x - x) / sq((handle.x - x) * (handle.x - x) + radius * radius) );
			// ハンドルポイント座標の位置によってarcの中心半径を移動させないといけない
			// ハンドルポイントのx座標が始点と終点の間にあるか、外側にあるかで補正値を変更させる必要がある
			// case: 始点と終点の外側にある場合
			if (current.x > handle.x && end.x > handle.x || current.x < handle.x && end.x < handle.x) {
				if (handle.x > current.x && handle.y <= end.y - (a / 2)) { // 第一象限
					cor = Math.PI / 2 - atan((handle.y - y) / (handle.x - x));
					this.arc(x - radius * cos(cor), y + radius * sin(cor), radius, -(theta - cor), theta + cor, false);
				} else if (handle.x > current.x && handle.y > end.y - (a / 2)) { // 第四象限
					this.arc(x - radius * cos((Math.PI - theta) / 2), y + radius * sin((Math.PI - theta) / 2), radius, -theta, theta + angleC, false);
				} else if (handle.x < current.x && handle.y <= end.y - (a/ 2)) { // 第二象限
					this.arc(x, y + radius, radius, -(theta + angleC), theta + angleC, true);
				} else if (handle.x < current.x && handle.y > end.y - (a / 2)) { // 第三象限
					this.arc(x + radius * cos((Math.PI - theta) / 2), y + radius * sin((Math.PI - theta) / 2), radius, -theta - angleC, theta + angleC, true);
				}
			} else { // case :始点と終点の間にある場合
				if (handle.y > current.y && handle.x >= end.x - (a / 2)) { // 第４象限
					this.arc(x + radius * cos(theta / 2), y - radius * sin(theta / 2), radius, Math.PI - theta / 2 - angleC, theta / 2, true);
				} else if (handle.y > current.y && handle.x < end.x - (a / 2)) { // 第三象限
					this.arc(x + radius * cos(theta / 2), y - radius * sin(theta / 2), radius, Math.PI - theta / 2, theta / 2 + angleC, true);
				} else if (handle.y < current.y && handle.x >= end.x - (a / 2)) { // 第１象限
					cor = Math.PI / 2 - atan((handle.y - y) / (handle.x - x));
					this.arc(x + radius * cos(cor), y + radius * sin(cor), radius, -(Math.PI - cor), -(Math.PI - (Math.PI - theta) - cor), false);
				} else if (handle.y < current.y && handle.x < end.x - (a / 2)) { // 第２象限
					cor = Math.PI / 2 - atan((handle.y - y) / (handle.x - x));
				}
			}

		},
		// quadraticCurveTo - ベジェ曲線描画
		quadraticCurveTo : function(cpx, cpy, x, y) {
			var p, cp1, cp2, qpx = this.__currentX, qpy = this.__currentY, cp = this.__getPos(cpx, cpy);
			// bezierCurveToに変換する
			var cp1x = qpx + 2.0 / 3.0 * (cp.x - qpx),
				cp1y = qpy + 2.0 / 3.0 * (cp.y - qpy),
				cp2x = cp1x + (x - qpx) / 3.0,
				cp2y = cp1y + (y - qpy) / 3.0;
			p = this.__getPos(x, y);
			cp1 = this.__getPos(cp1x, cp1y);
			cp2 = this.__getPos(cp2x, cp2y);
			this.__currentPath.push({method : 'c', x : p.x, y : p.y, cp1x : cp1.x, cp1y : cp1.y, cp2x : cp2.x, cp2y : cp2.y});
			this.__currentX = p.x;
			this.__currentY = p.y;
		},
		// bezierCurveTo - ベジェ曲線描画
		bezierCurveTo : function(cp1z, cp1y, cp2x, cp2y, x, y) {
			var p = this.__getPos(x, y),
				cp1 = this.__getPos(cp1x, cp1y),
				cp2 = this.__getPos(cp2x, cp2y);
			this.__currentPath.push({method : 'c', x : p.x, y : p.y, cp1x : cp1.x, cp1y : cp1.y, cp2x : cp2.x, cp2y : cp2.y});
			this.__currentX = p.x;
			this.__currentY = p.y;
		},
		// fill - 塗りつぶし
		fill : function() {
			this.stroke(1); // strokeメソッドに引数を渡して塗りつぶす
		},
		// stroke - 線描画（VMLの仕様上、塗りつぶしもここで行う※フラグ判定）
		stroke : function(fill) {
			var sf = MatrixUT.utRgbaToHex(fill ? this.fillStyle : this.strokeStyle).c, isFill = (fill) ? true : false,
				prt = [], path = [], c = this.__currentPath, a = arguments, clen = c.length, m, p, mode;
			var stColor = (a[1] && a[1] === 'clear') ? '#fff' : MatrixUT.utRgbaToHex(this.strokeStyle);
			var fillColor = (a[1] && a[1] === 'clear') ? '#fff' : MatrixUT.utRgbaToHex(this.fillStyle);
			prt.push('<v:shape', ' filled="', isFill, '"', ' style="width:10px;height:10px;position:absolute;z-index:', ++this.__zLayer, '" coordsize="10, 10" stroked="', !isFill, '"');

			// パスを展開
			var min = {x : null, y : null}, max = {x : null, y : null};
			function calcMinMax(path) {
				if (min.x === null || path.x < min.x) {min.x = path.x;}
				if (max.x === null || path.x > max.x) {max.x = path.x;}
				if (min.y === null || path.y < min.y) {min.y = path.y;}
				if (max.y === null || path.y > max.y) {max.y = path.y;}
			}

			for (var i = 0; i < clen; i++) {
				m = c[i].method; p = c[i];
				if (m === 'x' ) { path.push('x');} // closePath
				else if (m === 'at' || m === 'wa') { // arc
					path.push( ((m === mode) ? '' : m), ' ', mr(p.x - this.__opt.arcX * p.r), ',', mr(p.y - this.__opt.arcY * p.r),
								' ',
								mr(p.x + this.__opt.arcX * p.r), ',', mr(p.y + this.__opt.arcY * p.r),
								' ',
								mr(p.Sx), ',', mr(p.Sy),
								' ',
								mr(p.Ex), ',', mr(p.Ey)
					);
				} else if (m === 'c') { // quadraticCurveTo
					path.push( ((m === mode) ? '' : m), ' ', mr(p.cp1x), ',', mr(p.cp1y), ',', mr(p.cp2x), ',', mr(p.cp2y), ',', mr(p.x), ',', mr(p.y));
				} else { // lineTo or moveTo
					path.push(((m === mode) ? '' : m), ' ', mr(p.x), ',', mr(p.y));
				}
				mode = m;
				if (p.x || p.y) {calcMinMax(p);}
			}

			path.push('e"'); // path end
			prt.push(' path="', path.join(''), '">');
			var oval = false;
			if (!isFill) { // 線の描画のみの場合
				var stroke = []; // stack
				stroke.push('<v:stroke', ' weight="', this.lineWidth, 'px"',
									' color="', stColor.c, '"',
									' opacity="', stColor.a, '"',
									' joinstyle="', this.lineJoin, '"',
									' miterlimit="', this.miterLimit, '"',
									' endcap="', (this.lineCap === 'butt') ? 'flat' : this.lineCap, '" />'
						);
				prt.push(stroke.join(''));
			} else if (typeof this.fillStyle === 'object') { // グラデーション塗りつぶしの場合
				var angle = 0, fc = {x : 0, y :0}, shift = 0, ex = 1, fs = this.fillStyle, op = this.__opt,
				x0, y0, x1, y1, p0, p1, dx, dy, op1, op2, cl, ofs, cl1, cl2, len, cls, colors;
				// liner gradient - 線形グラデーション
				if (fs.type === 'gradient') {
					x0 = fs.x1 / op.arcX; y0 = fs.y1 / op.arcY; x1 = fs.x2 / op.arcX; y1 = fs.y2 / op.arcY;
					p0 = this.__getPos(x0, y0); p1 = this.__getPos(x1, y1); dx = p1.x - p0.x; dy = p1.y - p0.y;
					angle = Math.atan2(dx, dy) * 180 / Math.PI;
					if (angle < 0) {angle += 360;}
					if (angle < 1e-6) {angle = 0;}
					cls = fs.color;
					cls.sort(function(a, b){ return a.offset - b.offset; });
					len = cls.length; cl1 = cls[0].color; cl2 = cls[len - 1].color;
					op1 = 1 * this.globalAlpha; op2 = 1 * this.globalAlpha; colors = [];
					for (var j = 0; j < len; j++) {
						cl = cls[j]; ofs = cl.offset * ex + shift;
						ofs = (ofs > 1) ? ofs - 1 : ofs;
						colors.push(ofs + ' ' + cl.color);
					}
					// gradient generate
					prt.push('<v:fill type="', fs.type, '"',
							' method="none" focus="100%" color="', cl1, '" color2="', cl2, '" colors="', colors.join(','), '"',
							' opacity="', op2, '" v_o:opacity2="', op2, '" angle="', angle, '" focusposition="', fc.x, ',', fc.y, '" />'
					);
				} else if (fs.type === 'gradientradial') {
					// 円形グラデーション
					prt = []; // reset vml
					oval = true;
					p0 = this.__getPos(fs.x1, fs.y1); var w = max.x - min.x, h = max.y - min.y, fcs = fs.r1 / fs.r2;
					fc.x = (1 - fcs + (fs.x1 - fs.x2) / fs.r2) / 2;
					fc.y = (1 - fcs + (fs.y1 - fs.y2) / fs.r2) / 2;
					w /= op.arcX; h /= op.arcY;
					var dim = Math.max(w, h); colors = fs.color;
					shift = 2 * fs.r1 / dim; ex = 2 * fs.r2 / dim - shift;
					prt.push('<v:oval style="position:absolute;width:', fs.r2 * 2, 'px;height:', fs.r2, 'px;top:', fs.y2 - fs.r2, 'px;left:', fs.x2 - fs.r2, 'px"',
								'coordorigin="0,0" filled="true" stroked="true">'
					);
					colors.sort(function(a, b){ return a.offset - b.offset;});
					len = colors.length;
					prt.push('<v:stroke weight="1" color="', colors[len - 1].color, '"',
								'miterlimit="', this.miterLimit, '" joinstyle="round" endcap="round" />'
					);
					cl1 = colors[0].color; cl2 = colors[len - 1].color; op1 = 1 * this.globalAlpha; op2 = 1 * this.globalAlpha; cls = [];
					for (var k = 0; k < len; k++) {
						cl = colors[k]; ofs = c.offset * ex + shift;
						ofs = (ofs > 1) ? ofs - 1 : ofs;
						cls.push(ofs + ' ' + c.color);
					}
					cls[0] = '0' + cl2; cls[cls.length - 1] = '1' + cl1;
					prt.push('<v:fill type="', fs.type, '" method="sigma" colors="', cl.join(','), '" opacity="', op2, '" focussize="', fcs + ',' + fcs, '" v_o:opacity2="', op1, '" focusposition="', fc.x + ',' + fc.y, '" />');
				} else if (fs.type === 'pattern') {
					// パターン塗りつぶし
					prt.push('<v:fill type="tile" src="', fs.srcImage, '" />');
				}
			} else {
				// fill color
				prt.push('<v:fill color="', fillColor.c, '" opacity="', fillColor.a, '" />');
			}
			prt.push(!oval ? '</v:shape>' : '</v:oval>');
			var out = prt.join('');
			this.__emurateElm.insertAdjacentHTML('BeforeEnd', out);
			this.__history.push(out);
			return out;
		}, // end stroke method
		// rect - 矩形パスセット
		rect : function(x, y, w, h) {
			this.moveTo(x, y);
			this.lineTo(x + w, y);
			this.lineTo(x + w, y + h);
			this.lineTo(x, y + h);
			this.closePath();
		},
		// fillRect - 塗りつぶし矩形描画
		fillRect : function(x, y, w, h) {
			var stack = this.__currentPath;
			this.beginPath();
			this.moveTo(x, y);
			this.lineTo(x + w, y);
			this.lineTo(x + w, y + h);
			this.lineTo(x, y + h);
			this.closePath();
			this.stroke(1);
			this.__currentPath = stack;
		},
		// clearRect - 指定領域削除
		clearRect : function (x, y, w, h) {
			if (arguments.length === 0) {
				this.emurateElm.innerHTML = '';	// clear all
				this.__history = [];
				this.__zLayer = 0;
				return;
			}
			var tmpPath = this.__currentPath;
			var tmpColor = {fill : this.fillStyle, stroke : this.strokeStyle};
			this.beginPath();
			this.moveTo(x, y);
			this.lineTo(x + w, y);
			this.lineTo(x + w, y +h);
			this.lineTo(x, y + h);
			this.closePath();
			this.stroke(1, 'clear');
			this.fillStyle = tmpColor.fill;
			this.strokeStyle = tmpColor.stroke;
			this.__currentPath = tmpPath;
		},
		// strokeRect - 塗りつぶさない矩形描画
		strokeRect : function(x, y, w, h) {
			var tmp = this.__currentPath;
			this.beginPath();
			this.moveTo(x, y);
			this.lineTo(x + w, y);
			this.lineTo(x + w, y +h);
			this.lineTo(x, y + h);
			this.closePath();
			this.stroke();
			this.__currentPath = tmp;
		},
		// roundRect : 角丸矩形描画
		roundRect : function(x, y, w, h, rad) {
			this.beginPath();
			this.moveTo(x, y + rad);
			this.lineTo(x, y + h - rad);
			this.quadraticCurveTo(x, y +h, x + rad, y + h);
			this.lineTo(x + w - rad, y + h);
			this.quadraticCurveTo(x + w, y + h, x + w, y + h - rad);
			this.lineTo(x + w, y + rad);
			this.quadraticCurveTo(x + w, y, x + w - rad, y);
			this.lineTo(x + rad, y);
			this.quadraticCurveTo(x, y, x, y + rad);
			this.stroke();
		},
		// fillText - 塗りつぶしテキスト埋め込み
		// @param String txt - 埋め込むテキスト
		//               Number x - 描画するx座標
		//               Number y - 描画するy座標
		//               Number maxLength - テキストボックスの最大横幅（現状は破棄）
		fillText : function(txt, x, y, maxLength) {
			if (this.__isNonShadow()) {this.__fillText(txt, x, y);} else {this.__fillTextWithShadow(txt, x, y);}
		},
		// strokeText - 縁取りテキスト
		// @param String txt - 埋め込むテキスト
		//               Number x - 描画するx座標
		//               Number y - 描画するy座標
		//               Number maxLength - テキストボックスの最大横幅（現状は破棄）
		strokeText : function(txt, x, y, maxLength) {
			if (this.__isNonShadow()) {this.__fillText(txt, x, y, true);} else {this.__fillTextWithShadow(txt, x, y, true);}
		},
		// __getFontSize - フォントサイズ取得
		// @access private
		__getFontSize : function() {
			var font = this.font.replace(/.*?([0-9\.]+[px|em|%pt]+).+/, '$1');
			return {
				value : font,
				size : parseInt(font, 10),
				unit : (font.indexOf('px') !== -1) ? 'px' : (font.indexOf('pt') !== -1) ? 'pt' : (font.indexOf('%') !== -1) ? '%' : (font.indexOf('em') !== -1) ? 'em' : 'px'
			};
		},
		// __fillText - 塗りつぶしテキスト実行
		// @access private
		__fillText : function(str, x, y, s) {
			var d = this.__getPos(x, y), f = this.font, prt = [], fontSize = this.__getFontSize(), textLen = str.length, out, w, txt = str.replace(/[\r|\n|\s|\t|\v]/g, ' '),
				isS = s ? true : false, color = MatrixUT.utRgbaToHex((isS) ? this.strokeStyle : this.fillStyle);
			if (fontSize.unit === 'px') {w = fontSize.size * textLen;}
			else if (fontSize.unit === 'pt') {w = fontSize.size / 72 * 96 * textLen;}
			else if (fontSize.unit === '%') {w = 10 * fontSize.size / 100 * textLen;}
			else if (fontSize.unit === 'em') {w = 10 * fontSize.size * textLen;}
			prt.push('<v:line style="width:1px;height1px;position:absolute;z-index:' , ++this.__zLayer, ';top:', d.y, 'px;left:', d.x, 'px" from="0,10" to="', w, ',10" filled="', !isS, '" stroked="', isS, '"><v:path textpathok="true" />');
			if (isS) {
				prt.push('<v:stroke color="', color.c, '" />');
			} else {
				prt.push('<v:fill color="', color.c, '" />');
			}
			prt.push('<v:textpath on="true" string="', txt, '" style="font:', f, ';text-align:left;v-text-align:left" />');
			prt.push('</v:line>');
			out = prt.join('');
			this.__emurateElm.insertAdjacentHTML('BeforeEnd', out);
			this.__history.push(out);
		},
		// __fillTextWithShadow - 塗りつぶしテキスト（影付き）
		// @access private
		__fillTextWithShadow : function(str, x, y, s) {
			var d = this.__getPos(x, y), f = this.font, prt = [], fontSize = this.__getFontSize(), textLen = str.length, out, w, txt = str.replace(/[\r|\n|\s|\t|\v]/g, ' '), shadow = MatrixUT.utRgbaToHex(this.shadowColor),
				isS = s ? true : false, color = MatrixUT.utRgbaToHex(isS ? this.strokeStyle : this.fillStyle);
			if (fontSize.unit === 'px') {w = fontSize.size * textLen;}
			else if (fontSize.unit === 'pt') {w = fontSize.size / 72 * 96 * textLen;}
			else if (fontSize.unit === '%') {w = 10 * fontSize.size / 100 * textLen;}
			else if (fontSize.unit === 'em') {w = 10 * fontSize.size * textLen;}
			// shadowの数は3つくらいがいいかな？z-indexの関係上、影から先に描画する必要がある
			// shadowの数をthis.shadowBlurの値によって変更させてみる。
			var shadowNum = this.shadowBlur / 2, i = 1;
			// 2010/01/26 added
//			// 擬似span要素にCSSフィルタのBlurをかけたらうまくいかないかな？
//			var fixFSizeA = fontSize.size * 1.2, fixFSizeM = fontSize.size* 0.85;
//			// 日本語とalphaNumberでは影のつき方に誤差が出るので、別々のspanでくくりなおす
//			var shadowTxt = txt.replace(/([0-9a-zA-Z\s\?_!]+)/g, '<span style="font-size:' + fixFSizeA + 'px;margin-left:-4px;letter-spacing:normal;">$1</span>');
//			prt.push('<span style="width:9999px;filter:progid:DXImageTransform.Microsoft.Blur(pixelRadius=100);position:absolute;top:', d.y, 'px;left:', d.x, 'px;margin:0;padding:0">あああ');
// 上記実装は影のつき方は良いがVML-HTML間のフォントサイズと文字間隔の誤差が修正できないのでコメントアウト
			// そもそもテキストは普通のHTMLでよくね？
			// @note: syad
			var textOffset = ut.getPixel(fontSize.value);
//			prt.push('<span style="margin:0;padding:0;border:none;width:9999px;font:', f, ';color:', this.fillStyle, ';position:absolute;top:', y  - textOffset +(this.shadowOffsetY - this.shadowBlur), 'px;left:', x + (this.shadowOffsetX - this.shadowBlur), 'px;filter:DropShadow(color=', shadow.c, ', offX=', this.shadowOffsetX, ',offY=', this.shadowOffsetY, ',positive=0) progid:DXImageTransform.Microsoft.Blur(pixelRadius=',this.shadowBlur, ');z-index:', ++this.__zLayer, '">', txt, '</span>');
			prt.push('<span style="font-weigh:100;margin:0;padding:0;border:none;width:9999px;font:', f, ';color:', shadow.c, ';position:absolute;top:', y  - textOffset +(this.shadowOffsetY - this.shadowBlur), 'px;left:', x + (this.shadowOffsetX - this.shadowBlur), 'px;filter:progid:DXImageTransform.Microsoft.Blur(pixelRadius=',this.shadowBlur, ');z-index:', ++this.__zLayer, '">', txt, '</span>');
			prt.push('<span style="margin:0;padding:0;border:none;width:9999px;font:', f, ';position:absolute;top:', y - textOffset, 'px;left:', x, 'px;z-index:', ++this.__zLayer, '">', txt, '</span>');
//			for (i; i <= shadowNum; i++) {
//				// blur用のシャドウ+方向
//				prt.push('<v:line style="width:1px;height:1px;position:absolute;z-index:' , ++this.__zLayer, ';top:', d.y + (this.shadowOffsetY + i), 'px;left:', d.x + (this.shadowOffsetX + i), 'px" from="0,0" to="',  w,  ',0" filled="true" stroked="false"><v:path textpathok="true" />');
//				prt.push('<v:fill opacity="', 0.3 - i / 10,'" color="', shadow.c, '" />');
//				prt.push('<v:textpath on="true" string="', txt, '" style="font:', f, ';text-align:left;v-text-align:left" />');
//				prt.push('</v:line>');
//				// blur用のシャドウ-方向
//				prt.push('<v:line style="width:1px;height:1px;position:absolute;z-index:' , ++this.__zLayer, ';top:', d.y +(this.shadowOffsetY - i), 'px;left:', d.x + (this.shadowOffsetX - i), 'px" from="0,0" to="',  w,  ',0" filled="true" stroked="false"><v:path textpathok="true" />');
//				prt.push('<v:fill opacity="', 0.3 - i / 10 ,'" color="', shadow.c, '" />');
//				prt.push('<v:textpath on="true" string="', txt, '" style="font:', f, ';text-align:left;v-text-align:left" />');
//				prt.push('</v:line>');
//			}
////			prt.push('</span>');
//
//			prt.push('<v:line style="width:1px;height:1px;position:absolute;z-index:' , ++this.__zLayer, ';top:', d.y , 'px;left:', d.x , 'px" from="0,0" to="', w, ',0" filled="', !isS, '" stroked="', isS, '"><v:path textpathok="true" />');
//			if (isS) {
//				prt.push('<v:fill color="', color.c, '" />');
//			} else {
//				prt.push('<v:fill color="', color.c, '" />');
//			}
//			prt.push('<v:textpath on="true" string="', txt, '" style="font:', f, ';text-align:left;v-text-align:left;" />');
//			prt.push('<v:shadow on="true" color="', shadow.c, '" opacity="0.5" offset="', this.shadowOffsetX, ',', this.shadowOffsetY, '" />');
//			prt.push('</v:line>');
			out = prt.join('');
			this.__emurateElm.insertAdjacentHTML('BeforeEnd', out);
			this.__history.push(out);
		},
		// createLinearGradient - 線形グラデーションオブジェクト生成
		createLinearGradient : function(x1, y1, x2, y2) { return new this.__Gradient('gradient', x1, y1, x2, y2);},
		// createRadialGradient - 円形グラデーションオブジェクト生成
		createRadialGradient : function(x1, y1, r1, x2, y2, r2) { return new this.__Gradient('gradientradial', x1, y1, x2, y2, r1, r2);},
		//__Gradient - グラデーション内部クラス
		__Gradient : function() {
			var a = arguments;
			this.type = a[0];
			this.color = [];
			this.x1 = a[1];
			this.y1 = a[2];
			this.x2 = a[3];
			this.y2 = a[4];
			this.r1 = a[5] || 0;
			this.r1 = a[6] || 0;
		},
		// createPattern - 画像パターン生成（canvasの複製は未実装）
		createPattern : function(obj, repeat) {
			var rpt = repeat || 'repeat';
			if (rpt === 'repeat') {return new this.__CreatePattern(obj, rpt);}
		},
		// __CreatePattern - パターンオブジェクト内部クラス
		__CreatePattern : function(obj, rpt) {
			this.repeat = rpt;
			this.type = 'pattern';
			this.srcImage = obj.src;
			this.wh = FL.image.getDefaultSize(obj);
		},
		// save - canvasの状態を保存
		save : function() {
			var tmp = FL.union({}, {fillStyle : this.fillStyle, lineCap : this.lineCap, lineJoin : this.lineJoin, lineWidth : this.lineWidth, miterLimit : this.miterLimit, shadowBlur : this.shadowBlur, shadowColor : this.shadowColor, shadowOffsetX : this.shadowOffsetX, shadowOffsetY : this.shadowOffsetY, strokeStyle : this.strokeStyle, globalAlpha : this.globalAlpha, __opt : this.__opt});
			this.__saveStack.push(tmp);
			this.__saveMStack.push(this.matrix);
			this.matrix = MatrixUT.multiple(MatrixUT.ident(), this);
		},
		// restore : canvasの状態復帰
		restore : function() {
			this.matrix = this.__saveMSttack.pop();
			var tmp = this.__saveStack.pop();
			FL.union(this, tmp);
		}
	}; // end of Core.Canvas.getContextEmurate.prototype

	getContextEmurate.prototype.__Gradient.prototype.addColorStop = function(offset, color) {
		var ac = MatrixUT.utRgbaToHex(color);
		this.color.push({offset : offset, color : ac. c, alpha : ac.a});
	};

	/**
	 * Canvas Extend Class - Canvasをサポートしているが、機能の足りない部分を拡張する
	 */
	getContextExtend = function(e) {
		this.canvas = e;
		this.wrapDiv = DOM(e).wrap('div');
		this.ctx = e.__ctx;
		//FL.union(this, win.CanvasRenderingContext2D.prototype);
		win.CanvasRenderingContext2D.prototype.fillText = function() { alert('書くなよ');};
	};
	/** Canvas Emurate End */


	win.Canvas = Canvas;


})();