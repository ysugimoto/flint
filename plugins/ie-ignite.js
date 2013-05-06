/**
* Flint IE-Ignite.js
* advance IE JScript
*
* -----------------------------------------------------------------
* additional Functions:
*
* CSS:position:fixed support (IE6)
* CSS:min[max]-height and min[max]-width support (IE6)
* CSS:border-radius support (IE6,7,8) [need Canvas VML]
* image and background PNG support (IE6) [need Canvas VML]
* ----------------------------------------------------------------
*/

// difinition of closed scope
(function() {

	var FL = getInstance(), doc = document, win = window, ie6 = FL.ua.IE6, IEFIX = {}, pi = win.parseInt;
	if (!win.IEFIX) { IEFIX = win.IEFIX = {}; }
	var IES = {}, IB = FL.config.item('IEboost'); // IEBoost fixMode

	function CANVAS_INIT() {

	FL.event.set(doc, 'DOMReady', function(){
		var cv = doc.getElementsByTagName('canvas'), cvlen = cv.length, i = 0;
		for (i; i < cvlen; i++) {Canvas(cv[i]);}
		CanvasChecked = 1;
	});
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
		// この動的なイベントのattachは確実にStackをOverflowさせる。別途対処策を練る
//		c.attachEvent('onpropertychange', propChangeHandle);
//		c.attachEvent('onresize', resizeHandle);
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
	var mc = Math.cos, ms = Math.sin, mt = Math.tan, mr = Math.round, abs = Math.abs, sqrt = Math.sqrt; // alias
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
			c.matrix = MatrixUT.ident();
			c.matrix = MatrixUT.multiple([ [m11, m12, dx], [m21, m22, dy], [0, 0, 1] ], c.matrix);
			//c.matrix = [ [m11, m12, dx], [m21, m22, dy], [0, 0, 1] ];
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
		this.__saveStack = [];
		this.__saveMStack = [];
		this.__history = [];
		this.__currentPath = [];
		this.__opt = { arcX : 1, arcY : 1, ls : 1};
		this.__zLayer = 1;
		this.__isOpenPath = this.__currentX = this.__currentY = 0;
		// create canvas innerElement
		this.__emurateElm = (function(div) {
			var pi = win.parseInt;
			div.style.width = e.offsetWidth > 0 ? pi(e.offsetWidth) : e.getAttribute('width');
			div.style.height = e.offsetHeight > 0 ? pi(e.offsetHeight) : e.getAttribute('height');
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
				image.src = img.src;
			}
		},
		// __drawImage - 画像描画
		__drawImage : function(img, args) {
			var p = {}, a = args, len = args.length, size = FL.image.getDefaultSize(img), d, prt = [], crop = false;
			if (len === 3) {
				p = FL.union(p, {dx : a[1], dy : a[2], sx : 0, sy : 0, sw : size.width, sh : size.height, dw : size.width, dh : size.height});
			} else if (len === 5) {
				p = FL.union(p, {dx : a[1], dy : a[2], sx : 0, sy : 0, sw : size.width, sh : size.height, dw : a[3], dh : a[4]});
			} else if (len === 9) {
				p = FL.union(p, {dx : a[5], dy : a[6], sx : a[1], sy : a[2], sw :a[3], sh :a[4], dw : a[7], dh : a[8]});
				crop = true;
			} else {
				throw Error('invalid arguments of drawImage');
			}
			d = this.__getPos(p.dx, p.dy);
			p.w2 = p.sw / 2; p.h2 = p.sh / 2;
			prt.push('<div', ' style="width:', p.dw, 'px;height:', p.dh, 'px;position:absolute;z-index:', ++this.__zLayer, ';');
			if (crop) { // マトリックスが変更されているかのチェック
				var filter = ['M11=', this.matrix[0][0], ',', 'M12=', this.matrix[0][1], ',', 'M21=', this.matrix[1][0], ',', 'M22=', this.matrix[1][1], ',', 'Dx=', mr(d.x), ',', 'Dy=', mr(d.y)];
				var c2 = this.__getPos(p.dx + p.dw, p.dy), c3 = this.__getPos(p.dx, p.dy + p.dh), c4 = this.__getPos(p.dx + p.dw, p.dy + p.dh);
				var max = { x : Math.max(d.x, c2.x, c3.x, c4.x), y : Math.max(d.y, c2.y, c3.y, c4.y)};
				prt.push('padding:0 ', mr(max.x), 'px ', mr(max.y), 'px 0;filter:progid:DXImageTransform.Microsoft.Matrix(', filter.join(''), ');"');
			} else { // マトリックス変更なしの場合
				prt.push('top:', mr(d.y), 'px;left:', mr(d.x), 'px;"');
			}
			prt.push(' >', '<div style=position:absolute;width:', p.dw, 'px;height:', p.dh, 'px;filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src=\'', img.src, '\',sizingMethod=\'', (crop) ? 'crop' : 'image', '\')"></div>');
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
			// referenced great code at http://d.hatena.ne.jp/mindcat/20100131/1264958828
			var x0 = this.__currentX, y0 = this.__currentY, atan2 = Math.atan2;
			var a1 = y0 - y1, b1 = x0 - x1, a2 = y2 - y1, b2 = x2 - x1, mm = abs(a1 * b2 - b1 * a2);
			if (mm === 0 || radius === 0) {
				this.lineTo(x1, y1);
			} else {
				var dd = a1 * a1 + b1 * b1, cc = a2 * a2 + b2 * b2, tt = a1 * a2 + b1 * b2,
					k1 = radius + sqrt(dd) / mm, k2 = radius * sqrt(cc) / mm,
					j1 = k1 * tt / dd, j2 = k2 * tt / cc,
					cx = k1 * b2 + k2 * b1, cy = k1 * a2 + k2 * a1,
					px = b1 * (k2 + j1), py = a1 * (k2 + j1),
					qx = b2 * (k1 + j2), qy = a2 * (k1 + j2),
					ang1 = atan2(py - cy, px - cx), ang2 = atan2(qy - cy, qx - cx);

				this.lineTo(px + x1, py + y1);
				this.arc(cx + x1, cy + y1, rad, ang1, ang2, (b1 * a2 > b2 * a1));
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
			this.matrix = MatrixUT.multiple(MatrixUT.ident(), this.matrix);
		},
		// restore : canvasの状態復帰
		restore : function() {
			this.matrix = this.__saveMStack.pop();
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


	};



	var all, allen, e, s, ps;
	function IE_IGNITE() {
		IES.fixedStack = [];
		IES.resizeLock = false;
		IES.toFixReg = /fixed|absolute/;
		IES.fixPNGReg = /\.png$/i;
		IES.fixPNG_BGReg = /\.png['"]?\)?$/i;
		IES.fixZoom = /script|link|html|body|img|object|embed|head|style/i;
		IES.xPNG = [];
		IES.fixPNGBG = [];
		IES.xMinMax = [];
		IES.xRadius = [];
		if (ie6 && IB.positionFix === true) {
			// set virtual <html> and <body>.
			var div = doc.createElement('div'), div_b = doc.createElement('div'), body = doc.body, html = doc.getElementsByTagName('html')[0],
			h, hh, offH, b, bh, offH2, sh = screen.availHeight, mgb, babs, bw;
			IEFIX.__defHeight = body.offsetHeight;
			div.id = 'fl_cover_html';
			div_b.id = 'fl_cover_body';
			div_b.className = body.className;
			div_b.style.position = 'relative';
			div_b =body.applyElement(div_b, 'inside');
			div = body.applyElement(div, 'inside');
			h = DOM(html);
			hh = h.absDimension().height;
			offH = html.offsetTop;
			b = DOM(body);
			bh = b.absDimension().height;
			babs = b.absDimension();
			bw= body.offsetWidth;
			mgb = body.currentStyle.margin;
			h.addStyle({'overflow-y' : 'hidden', 'overflow-x' : 'auto', height : '100%', margin : 0, padding : 0});
			offH2 = body.offsetTop;
			div_b.style.height = hh + 'px';
			IEFIX.body = div_b;
			IEFIX.html = div;
			IEFIX.__defaultMarginTop = parseInt(body.currentStyle.marginTop, 10) || 0;
			IEFIX.__defaultMarginLeft = parseInt(body.currentStyle.marginLeft, 10) || 0;
			b.addStyle({'overflow-y' : 'hidden', 'overflow-x' : 'auto', height : '100%', margin : 0, padding : 0});
			IEFIX.width = div_b.offsetWidth;
			IEFIX.height = div_b.offsetHeight;
			DOM(div).addStyle({overflow : 'hidden', height : '100%', position : 'relative', padding : mgb});
			DOM(div_b).addStyle({height : '100%', position : 'relative', overflowY : 'auto'});
			//if (body.offsetWidth <= FL.ut.getContentSize().width) {
				DOM(div_b).addStyle('overflow-x', 'hidden');
			//}
			//win.attachEvent('onresize', FIXIE.resizeHandle);

			DOM(div_b).ignore()
			DOM(div).ignore();
			FL.ua.__positionKey = true;
		}
		all = doc.getElementsByTagName('*'); alllen = all.length, IB = FL.config.item('IEboost');
		for (var i = 0; i < alllen; i++) {
			e = all[i];
			if (!e || e.nodeType !== 1) {continue;} //guard textNode
			s = e.currentStyle; ps = s.position.toLowerCase();
			FIXIE.markUp(e); // pick up addtional Elements

			// fix min or max height, width and position:fixed for IE6
			if (ie6) {
				// !! notice position:fixed make DOM tree converted new style !!
				if (!e.__isfixed && IES.toFixReg.test(ps) && IB.positionFix === true) { FIXIE.positionFix(e);}
				// fix peek-a-boo-bug
				//if (!IES.fixZoom.test(e.tagName) && s.hasLayout === false && s.height === 'auto') { e.style.height = '1%';}
			}

			// move to inline filter
			if (s.filter) {
				e.style.filter = s.filter;
			}
		}

		// do additional method from markuped Elements
		if (ie6) {
			// position : fixed
			var fixlen = IES.fixedStack.length;
			for (i = 0; i < fixlen; i++) {doc.body.appendChild(IES.fixedStack[i]);}

			// image-PNG for Image Element
			var fixPNGLen = IES.xPNG.length;
			for (var j = 0; j < fixPNGLen; j++) {FIXIE.fixPNG(IES.xPNG[j]);}

			// image-PNG for background-PNG [need canvas VML]
			if (win.Canvas) {
				var fixPNGBGLen = IES.fixPNGBG.length;
				for (var k = 0; k < fixPNGBGLen; k++) {FIXIE.fixPNG_BG(IES.fixPNGBG[k]);}
			}

			// min[max]-height[width] TODO implement
			if (IES.xMinMax.length > 0) {
				win.setTimeout(FIXIE.watchMinMax, 50);
			}
//			var mmLen = IES.xMinMax.length;
//			for (var m = 0; m < mmLen; m++) { FIXIE.fixMinMax(IES.xMinMax[m]); }
			doc.recalc(true);
		}

		// border-radius[ need canvas VML]
		if (win.Canvas) {
			var xbLen = IES.xRadius.length;
			for (var l = 0; l < xbLen; l++) { FIXIE.fixBorderRadius(IES.xRadius[l]); }
		}
	};

	// methods of IEFIX
	var FIXIE = {
		// positionFix - position : fixed emurate
		positionFix : function(e) {
			var s = e.currentStyle, t, b, l, ps =s.position.toLowerCase();
			if(ps === 'fixed') {
				e.style.position = 'absolute';
				l = DOM(e).absDimension();
				e.style.top = l.top + IEFIX.__defaultMarginTop + 'px';
////				e.style.left = l.left + 'px';
////				e.style.right = l.right + 'px';
				//alert(IEFIX.height < IEFIX.__defHeight);
				if (e.style.right !== 'auto' && IEFIX.height < IEFIX.__defHeight) { // appear scrollbar
					e.stye.right = parseInt(e.style.right, 10) + 17 + 'px';
				}
				e.__isFixed = 4;
				IES.fixedStack.push(e);//doc.body.appendChild(e);
			} else {
				//e.__isFixed = 3;
				//e.parentNode.appendChild(e);// これをしないと再描画位置がずれる
			}
		},
		// fixMinMax - min[max]-width[height] support
		fixMinMax : function(e, val) {
			var v = val || e.__stdSize, f, pi = win.parseInt, bd = e.getBoundingClientRect(), cs = e.currentStyle;
			var w = bd.right - bd.left, h = bd.bottom - bd.top;
			var b = FIXIE.getBorderSize(e);
			if ( v.maxW > 0 && v.maxW < w ) { e.style.width = v.maxW - b.left - b.right + 'px';}
			else if (v.minW > w) { e.style.width = v.minW - b.left - b.rigt + 'px';}
			if (v.maxH && v.maxH < h) {e.style.height = v.maxH - b.top - b.bottom + 'px';}
			else if (v.minH > h) { e.style.height = v.minH - b.top - b.bottom + 'px';}
			// update
			e.__stdSize = v;
		},
		// watchMinMax - タイマーでminmax監視
		watchMinMax : function() {
			var x = IES.xMinMax, len = x.length, i = 0;
			for (i; i < len; i++) {
				if (!x[i].__stdSize) { continue;}
				FIXIE.fixMinMax(x[i], x[i].__stdSize);
			}
			win.setTimeout(FIXIE.watchMinMax, 50);
		},
		// fixBorder - DOMツリーの改変を行うとborderのスタイル
		// markUp - FIXを行う要素をマークアップする
		markUp : function(e) {
			var cs = e.currentStyle;
			if (FL.ua.IE6) {

				if (IB.PNG) {
					if (e.tagName === 'IMG' && IES.fixPNGReg.test(e.src)){ // image Element
						IES.xPNG.push(e);
					} else if (IES.fixPNG_BGReg.test(e.currentStyle.backgroundImage)) { // background-png
						IES.fixPNGBG.push(e);
					}
				}
				if (IB.MinMax) {
					var pi = win.parseInt;
					// @note
					// IE6のcurrentStyleで未定義のプロパティを参照する際に、min-max系はmin-heightだけ取得方法が違う
					// max-width -> max-width
					// max-height -> max-height
					// min-width -> min-height
					// min-height -> minHeight --- bug??
					var wh = {
						maxW : pi(cs['max-width'], 10) || 0, maxH : pi(cs['max-height'], 10) || 0,
						minW : pi(cs['min-width'], 10) || 0, minH : pi(cs['minHeight'], 10) || 0
					};
					if ((wh.maxW || wh.maxH || wh.minW || wh.minH) && cs['display'] !== 'inline') { // display:inlineはmarkupしない
//						var btw = cs.borderTopWidth, blw = cs.borderLeftWidth, bbw =cs. borderBottomWidth, brw = cs.borderRightWidth;
//						var t = (btw === 'thin') ? 2 : (btw === 'medium') ? 4 : (btw === 'thick') ? 6 : pi(btw, 10),
//								l = (blw === 'thin') ? 2 : (blw === 'medium') ? 4 : (blw === 'thick') ? 6 : pi(blw, 10),
//									r = (brw === 'thin') ? 2 : (brw === 'medium') ? 4 : (brw === 'thick') ? 6 : pi(brw, 10),
//										b = (bbw === 'thin') ? 2 : (bbw === 'medium') ? 4 : (btw === 'thick') ? 6 : pi(bbw, 10);
						var b = FIXIE.getBorderSize(e);
						var w = e.offsetWidth, h = e.offsetHeight;

						if (wh.maxH > 0 && w > wh.maxW) { e.style.width = (wh.maxW - b.left - b.right) + 'px';}
						else if (w < wh.minW) { e.style.width = (wh.minW - b.left - b.right) + 'px';}

						if (wh.maxH > 0 && h > wh.maxH) { e.style.height = (wh.maxH - b.top - b.bottom) + 'px';}
						else if (h < wh.minH) {e.style.height = (wh.minH - b.top - b.bottom) + 'px';}

						IES.xMinMax.push(e);
						e.__stdSize = wh;
						e.style.overflow = 'hidden';
					}
				}
			}
			//}
			if (IB.borderRadius) {
				if (cs['border-radius']) {IES.xRadius.push(e); }
			}
		},
		// getBorderSize - [thin], [medium], [thick]を含めてpxでサイズ取得
		getBorderSize : function(e) {
			var cs = e.currentStyle, pi = win.parseInt, ret = {};
			var btw = cs.borderTopWidth, blw = cs.borderLeftWidth, bbw =cs. borderBottomWidth, brw = cs.borderRightWidth;
			ret.top = (btw === 'thin') ? 2 : (btw === 'medium') ? 4 : (btw === 'thick') ? 6 : pi(btw, 10),
			ret.left = (blw === 'thin') ? 2 : (blw === 'medium') ? 4 : (blw === 'thick') ? 6 : pi(blw, 10),
			ret.right = (brw === 'thin') ? 2 : (brw === 'medium') ? 4 : (brw === 'thick') ? 6 : pi(brw, 10),
			ret.bottom = (bbw === 'thin') ? 2 : (bbw === 'medium') ? 4 : (btw === 'thick') ? 6 : pi(bbw, 10);
			return ret;
		},
		// fixPNG - PNG画像をIE6で再現させる
		fixPNG : function(e, val) {
			if (val) {
				if (!IES.fixPNGReg.test(val)) { return false;}
			}
			var sp = doc.createElement('span'), disp = e.currentStyle.display, size = FL.image.getDefaultSize(e),
			  src = val || e.src;
			sp.style.display = (disp === 'block') ? 'block' : 'inline-block';
			sp.style.zoom = 1;
			sp.style.width = size.width + 'px';
			sp.style.height = size.height + 'px';
			sp.style.filter = FL.ut.makeFilter('png', src, 'image');
			e.parentNode.insertBefore(sp, e);
			e.style.display = 'none';
			// with external link
			if (e.parentNode.tagName === 'A') {sp.style.cursor = 'pointer';}
		},
		// fixPNG_BG - 背景PNG画像をIE6で再現する
		fixPNG_BG : function(e, val) {
			var cs = e.currentStyle, bgImage;
			// 背景画像取得
			if (!val) {
				bgImage = cs.backgroundImage.replace(/url\((.*?)\)/i, '$1').replace(/['"]/g, '');
			} else {
				if (!IES.fixPNG_BGReg.test(val)) { return false;}
				bgImage = val.replace(/url\((.*?)\)/i, '$1').replace(/['"]/g, '');
			}
			// canvas生成
			var canvas = new Canvas();
			// 縦幅、横幅取得
			var img = new Image();
			img.onload = function(){
				//var w = e.offsetWidth, h = e.offsetHeight;
				var w = e.currentStyle['width'], h = e.currentStyle['height'];
				// canvasで要素をラッピング
				e.applyElement(canvas, 'outiside');
				// 元要素を初期化
				e.style.position = 'absolute';
				e.style.background = 'none';
				e.style.zIndex = (e.style.zIndex === 'auto') ? 2 : e.style.zIndex + 1;
				// canvasに元要素のstyleをコピー
				canvas.style.width = w;
				canvas.style.height = h;
				canvas.style.margin = cs.margin;
				canvas.style.padding = cs.padding;
				e.style.margin = '0';
				e.style.padding = '0';
				// canvas VMLで画像パターン塗りつぶし
				var ctx = canvas.getContext('2d');
				var pat = ctx.createPattern(img, 'repeat');
				ctx.fillStyle = pat;
				ctx.fillRect(0, 0, w, h);
			};
			img.src = bgImage;
			return true;
		},
		// fixBorderRadius - 角丸表現をVMLで再現する
		fixBorderRadius : function(e, val) {
			var canvas = new Canvas(), cs = e.currentStyle, pi = win.parseInt,
				tc = cs.borderTopColor, lc = cs.borderLeftColor, bc = cs.borderBottomColor, rc = cs.borderRightColor,
				br, rtl, rtr, rbl, rbr;
			if (val) { br = val;} else { br = cs['border-radius'];}
			if (!br) {
				rtl = cs['border-top-left-radius']; rtr = cs['border-top-right-raidus'];
				rbl = cs['border-bottom-left-radius']; rbr = cs['border-bottom-right-radius'];
			} else {
				var spt = br.split(' '), sptlen = spt.length;
				switch(sptlen) {
				case 1: rtl = rtr = rbl = rbr = pi(br, 10); break;
				case 2: rtl = rbr = pi(spt[0], 10); rtr = rbl = pi(spt[1], 10); break;
				case 4: rtl = pi(spt[0], 10); rtr = pi(spt[1], 10); rbr = pi(spt[2], 10); rbl = pi(spt[3], 10); break;
				}
			}
			// get default Style
			var bd = e.getBoundingClientRect(), b = FIXIE.getBorderSize(e);
			var w = e.offsetWidth, h = e.offsetHeight;
			e.applyElement(canvas, 'outside'); e.style.border = 'none';
			canvas.style.width = w + b.left + b.right + 'px'; canvas.style.height = h + b.top + b.bottom + 'px';
			canvas.style.margin = cs['margin'] || 0; canvas.style.padding = cs['padding'] || 0;
			e.style.margin = b.top + 'px ' + b.right + 'px ' + b.bottom + 'px ' + b.left + ''; e.style.padding = 0; e.style.position = 'absolute';
			var bg = cs.backgroundColor;
			// draw VML radius
			var ctx = canvas.getContext('2d');
			ctx.strokeStyle = lc; ctx.lineWidth = b.left;
			if (bg !== 'transparent') {
				ctx.fillStyle = bg;
				e.style.backgroundColor = 'transparent';
				ctx.beginPath();
				ctx.moveTo(b.left / 2, rtl + b.top / 2);
				ctx.lineTo(b.left / 2, h - rbl - b.bottom / 2);
				ctx.quadraticCurveTo(b.left / 2, h - 1 - b.bottom / 2 , rbl + b.left / 2, h - 1 - b.bottom / 2);
				ctx.lineTo(w - rbr - 1 - b.right / 2, h - 1 - b.bottom / 2);
				ctx.quadraticCurveTo(w - 1 - b.right / 2, h - 1 - b.bottom / 2, w - 1 - b.right / 2, h - 1 - rbr - b.bottom / 2);
				ctx.lineTo(w - 1 - b.right / 2, rtr + b.top / 2);
				ctx.quadraticCurveTo(w - 1 - b.right / 2, b.top / 2, w - 1 - rtr - b.right / 2, b.top / 2);
				ctx.lineTo(rtl + b.left / 2, b.top / 2);
				ctx.quadraticCurveTo(b.left / 2, b.top / 2, b.left / 2, rtl + b.top / 2);
				ctx.fill();
			}
			// left-bottom-radius
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.moveTo(b.left / 2, rtl + b.top / 2);
			ctx.lineTo(b.left / 2, h - rbl - b.bottom / 2);
			ctx.quadraticCurveTo(b.left / 2, h - 1 - b.bottom / 2 , rbl + b.left / 2, h - 1 - b.bottom / 2);
			ctx.stroke();
			// right-bottom-radius
			ctx.strokeStyle = bc; ctx.linwWidth = b.bottom;
			ctx.lineTo(w - rbr - 1 - b.right / 2, h - 1 - b.bottom / 2);
			ctx.quadraticCurveTo(w - 1 - b.right / 2, h - 1 - b.bottom / 2, w - 1 - b.right / 2, h - 1 - rbr - b.bottom / 2);
			ctx.stroke();
			// right-top-radius
			ctx.strokeStyle = rc, ctx.lineWidth = b.right;
			ctx.lineTo(w - 1 - b.right / 2, rtr + b.top / 2);
			ctx.quadraticCurveTo(w - 1 - b.right / 2, b.top / 2, w - 1 - rtr - b.right / 2, b.top / 2);
			ctx.stroke();
			// left-top-radius
			ctx.strokeStyle = tc; ctx.lineWidth = b.top;
			ctx.lineTo(rtl + b.left / 2, b.top / 2);
			ctx.quadraticCurveTo(b.left / 2, b.top / 2, b.left / 2, rtl + b.top / 2);
			ctx.stroke();
			e.style.zIndex = ++ctx.__zLayer;
		},
		// resizeHandle - 仮想<body>をリサイズに追従
		resizeHandle : function(e) {
			if (IES.resizeLock === true) { return;}
			IES.resizeLock = true;
			var b = doc.body.offsetWidth;
			//IEFIX.html.style.width = b + 17 + 'px';
			IES.resizeLock = false;
		}

	};
	if (IB.borderRadius === true) {
		ClassExtend('element', {'__extendStyleborderRadius' : FIXIE.fixBorderRadius});
	}
	if(ie6) {
		ClassExtend('element', {
			'__extendAttrsrc' : FIXIE.fixPNG,
			'__extendStylebackgroundImage' : FIXIE.fixPNG_BG
		});
	}

	CANVAS_INIT();
	FL.event.set(doc, 'DOMReady', function() { IE_IGNITE();});
})();