/**
 * Flint animation plugin
 * some effect animation
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * @create 2010/02/09
 */

(function() {

	var FL = getInstance(), ut = FL.ut, Timer = FL.Timer, win = window, doc = document, DOM = FL.DOM, Animation = FL.Animation;

	// 計算系メソッドのショートカット
	var mr = Math.round, mc = Math.ceil, pi = win.parseInt, mabs = Math.abs, sin = Math.sin, cos = Math.cos,
		mp = Math.pow;

	// Animation.__initialize - エフェクト対象のパラメータ取得と初期化
	Animation.__initialize = function(e) {
		var res = e.absDimension();
		res = FL.union(res, e.readStyle(['visibility', 'display', 'opacity', 'position', 'z-index']));
		if (res.visibility == 'hidden') {e.visible();}
		if (e.isHidden()) {e.show();}
		return res;
	};
	// Animation.__delayStart - delayをかけてアニメーションスタート
	// Timerクラスにdelayを実装していないため、clearTimeoutを使用する
	Animation.__delayStart = function(fn, time) {
		var delay = time || 0, tim = new Timer(fn);
		if (delay > 0) {win.setTimeout(function() {tim.start();}, delay);} else { tim.start();}
	};

	// Animation.moveX - 横方向移動
	Animation.moveX = function(elm, option) {
		var e = DOM(elm), opt = FL.union({direction : true, distance : 0, speed : 1, easing : 0, callback : null, returnDefault : false, delay : 0, __useClone : true}, option || {});
		Animation.__move(e, opt, 'X');
	};
	// Animation.moveY - 縦方向移動
	Animation.moveY = function(elm, option) {
		var e = DOM(elm), opt = FL.union({direction : true, distance : 0, speed : 1, easing : 0, callback : null, returnDefault : false, delay : 0, __useClone : true}, option || {});
		Animation.__move(e, opt, 'Y');
	};
	// Animation.__move - 移動実行
	Animation.__move = function(e, opt, mode) {
		var sc = ut.getScrollPosition(), info = Animation.__initialize(e);
		var from = {x : (info.position == 'fixed') ? info.left - sc.x : info.left , y : (info.position == 'fixed') ? info.top - sc.y : info.top};
		var end = {x : (opt.direction) ? info.left + opt.distance : info.left - opt.distance, y : (opt.direction) ? info.top + opt.distance : info.top - opt.distance};
		// cloneを使う
		if (opt.__useClone === true) {
			var defE = e;
			var clone = e.copy(true).appendTo()
								.addStyle({position : 'absolute', top : info.top + 'px', left : info.left + 'px', zIndex : info.zIndex + 1})
								.attr('id', 'cloned_' + defE.get().__cid);
			e = clone;
			defE.invisible();
		}
		var flag = opt.direction;
		if (FL.ua.IE) {opt.speed = opt.speed  * 2 / 3;}
		var speed = mr(opt.speed * 100), ease = opt.easing, x0 = from.x, y0 = from.y, x1 = (flag) ? from.x + opt.distance : from.x - opt.distance, y1 = (flag) ? from.y + opt.distance : from.y - opt.distance;
		var c = 0, cEnd = speed - 1, t,l, step, k = 0.8, deg, KE = k * ease, resX, resY;
		var timerFunc = function() {
			if (c++ <= cEnd) {
				step = c / cEnd;
				//deg = step / ( step + (1 - AbyE) / (AtE * AtE) * (1 - step));
				deg = (100 + KE) * step / (2 * KE * step + 100 - KE);
				l = mr(x0 + (x1 - x0) * deg);
				t = mr(y0 + (y1 - y0) * deg);
				// 補正値を方向にのみ適用
				if (mode == 'X') {
					e.addStyle('left', l + 'px');
				} else if (mode == 'Y') {
					e.addStyle('top', t + 'px');
				} else if (mode == 'XY') {
					e.addStyle({top : t + 'px', left : l + 'px'});
				}
			} else {
				this.stop();
				if (opt.__useClone === true) {e.remove();}
				if (ut.isFunction(opt.callback)) {opt.callback();}
				if (opt.returnDefault === true) {
					if (clone === false) {def.addStyle('visibility', 'visible');}
					else { e.addStyle({top : info.top + 'px', left : info.left + 'px'});}
				}
			}
		};
		Animation.__delayStart(timerFunc, opt.delay);
	};

	// Animation.pile - 対象の要素に重ねる
	Animation.pile = function(elm, option) {
		var e = DOM(elm), opt = FL.union({target : null, speed : 1, easing : 0, callback : null, returnDefault : false, delay : 0, __useClone : true}, option || {});
		if (opt.target === null) {
			throw Error('option must have "target" property');
		}
		var info = Animation.__initialize(e);
		var wht = DOM(opt.target).absDimension(), dirX, dirY, flag, perX, perY;
		if (info.top == wht.top && info.left == wht.left) {
			// 移動なし
			if (ut.isFunction(opt.callback)) {opt.callback();}
			return;
		}
		if (opt.__useClone === true) {
			// cloneを使用
			var clone = e.copy(true)
							.appendTo()
							.addStyle({position : 'absolute', top : info.top + 'px', left : info.left + 'px', zIndex : (info.zIndex == 'auto') ? 1 : info.zIndex + 1});
			e.invisible();
			e = clone;
		}
		var def = e;
		if (FL.ua.IE) {opt.speed = opt.speed  * 2 / 3;}
		var speed = mr(opt.speed * 100), ease = opt.easing, x0 = info.top, y0 = info.left, x1 = wht.top, y1 = wht.left;
		var c = 0, cEnd = speed - 1, t,l, step, k = 0.8, deg, KE = k * ease;
		var timerFunc = function() {
			if (c <= cEnd) {
				step = c / cEnd;
				//deg = step / ( step + (1 - AbyE) / (AtE * AtE) * (1 - step));
				deg = (100 + KE) * step / (2 * KE * step + 100 - KE);
				t = x0 + (x1 - x0) * deg;
				l = y0 + (y1 - y0) * deg;
				def.addStyle({top : t + 'px', left : l + 'px'});
				c++;
			} else {
				this.stop();
				if (ut.isFunction(opt.callback)) {opt.callback();}
				if (opt.returnDefault === true) {
					def.visible();
				}
			}
		};
		Animation.__delayStart(timerFunc, opt.delay);
	};
	// Animation.scrollFollow - スクロールに追従する
	Animation.scrollFollow = function(e, opt) {
		var e = DOM(e), opt = FL.union({offsetY : 100, offsetX : 100, direction : 'Y', minX : 0, minY : 0, maxX : DOM.tag('body').get(0, true).absDimension().right, maxY : DOM.tag('body').get(0, true).absDimension().bottom, speed : 1, delay : 500, easing : 80}, opt || {}), dist;
		var wh = e.absDimension();
		var info = {
				top : wh.top, left : wh.left,
				visibility : e.readStyle('visibility'), display : e.readStyle('display'), position : e.readStyle('position')
		};
		(/static|relative|fixed/.test(info.position)) && e.addStyle('position', 'absolute');
		(info.visibility == 'hidden') && e.addStyle('visibility', 'visible');
		(info.display == 'none') && e.addStyle('display', e.__defaultDisplayStyle);
		var current =FL.ut.getScrollPosition();
		var isScroll = false;
		var onScroll = function() {
			if (isScroll)return;
			isScroll = true;
			win.setTimeout(function() {judge();}, opt.delay);
		};
		var mmax = Math.max, mmin = Math.min, ma = Math.abs;
		var judge = function() {
			var sc = FL.ut.getScrollPosition();
			isScroll = false;
			switch (opt.direction) {
			case 'Y': // Y方向追従
				var flag = (sc.y + opt.offsetY > e.absDimension().top) ?  true : false;
				if (flag) {
					dist = ma(mmin((sc.y + opt.offsetY), opt.maxY) - e.absDimension().top);
				} else {
					dist = ma(mmax((sc.y + opt.offsetY), opt.minY) - e.absDimension().top);
				}
				Animation.moveY(e, {direction : flag, distance : dist, speed : opt.speed, easing : opt.easing, __useClone : false});
				break;
			case 'X': // X方向追従
				var flag = (sc.y + opt.offsetY > e.absDimension().top) ?  true : false;
				if (flag) {
					dist = ma(mmin((sc.x + opt.offsetX), opt.maxX) - e.absDimension().left);
				} else {
					dist = ma(mmax((sc.x + opt.offsetX), opt.minX) - e.absDimension().left);
				}
				Animation.moveX(e, {direction : flag, distance : dist, speed : opt.speed, easing : opt.easing, __useClone : false});
				break;
			};
		};
		FL.event.set((FL.ua.__positionKey) ? IEFIX.html : win, 'scroll', onScroll);
	};

	// Animation.puff - 拡大+フェードアウト
	Animation.puff = function(e, opt) {
		var e = DOM(e), opt = FL.union({speed : 2, easing : 0, zoom : 200 /* % */,callback : null, returnDefault : false, delay : 0}, opt || {});
		var wh = e.absDimension();
		var info = {
				width : wh.width, height : wh.height, opacity : e.readStyle('opacity'), position : e.readStyle('position'),
				top : wh.top, left : wh.left, zIndex : e.readStyle('zIndex', true), ml : e.readStyle('marginLeft', true), mt : e.readStyle('marginTop', true)
		};
		var def = FL.union({}, info);
		// cloneを使う
		var clone = e.copy(true)
			.appendTo()
			.addStyle({position : 'absolute', top : wh.top + 'px', left : wh.left + 'px', zIndex :( info.zIndex == 'auto') ? 1 : info.zIndex + 1, opacity : info.opacity, width : info.width + 'px', height : info.height + 'px'});
		e.addStyle('visibility', 'hidden');
		var timerFunc = function() {
			clone.addStyle({
				width : info.width + 'px',
				height : info.height + 'px',
				opacity : info.opacity,
				top : info.top + 'px',
				left : info.left + 'px'
			});
			if ((info.opacity - opt.speed / 80) <= 0) {
				clone.remove();
				this.stop();
				if (FL.ut.isFunction(opt.callback)) opt.callback();
				if (opt.returnDefault === true) e.addStyle('visibility', 'visible');
			} else {
				info.width += opt.speed;
				info.height += opt.speed;
				info.opacity = info.opacity - opt.speed / 80;
				info.top = (info.top - opt.speed / 2);
				info.left = (info.left - opt.speed / 2);
			}
		};
		if (opt.delay > 0) {
			win.setTimeOut(function() { new Timer(timerFunc).start();});
		} else {
			new Timer(timerFunc).start();
		};
	};

	// Animation.switchOff - 点滅後、消滅アニメーション
	Animation.switchOff = function(e, opt) {
		var e = DOM(e), opt = FL.union({blinkTime : 2, callback : null, offSpeed : 5, returnDefault : false, delay : 0, __useClone : true}, opt || {});
		var wh = e.absDimension();
		var info = {
				top : wh.top, left : wh.left, width : wh.width, height : wh.height,
				visibility : e.readStyle('visibility'), opacity : e.readStyle('opacity'), zIndex : e.readStyle('zIndex')
		};
		if (opt.__useClone === true) {
			var clone = e.copy(true)
								.appendTo()
								.addStyle({position : 'absolute', top : wh.top + 'px', left : wh.left + 'px', zIndex :(info.zIndex == 'auto') ? 1 : info.zIndex + 1});
			e.addStyle('visibility', 'hidden');
			var def = e;
			e = clone;
			var cloned = true;
		} else {
			var cloned = false;
		};
		(info.visibility == 'hidden') && e.addStyle('visibility', 'visible');
		(info.opacity == 0) && e.addStyle('opacity', 1);
		var offFunc = function() {
			info.height -= opt.offSpeed;
			info.top += opt.offSpeed / 2;
			if (info.height <= 0) {
				this.stop();
				if (cloned) e.remove();
				if (FL.ut.isFunction(opt.callback)) opt.callback();
				if (opt.returnDefault === true) def.addStyle('visibility', 'visible');
			} else {
				e.addStyle({height : info.height + 'px', top : info.top + 'px'});
			};
		};
		var blinkTimes = 0, blink = false, timer = null;
		var blinkFunc = function() {
			if (blink === true) {
				e.addStyle('opacity', 1);
				blink = false;
				blinkTimes++;
			} else {
				e.addStyle('opacity', 0.3);
				blink = true;
			}
			if (blinkTimes == opt.blinkTime) {
				win.clearInterval(timer);
				win.setTimeout(function(){new Timer(offFunc).start();}, 50);
			};
		};
		if (opt.delay > 0) {
			win.setTimeout(function() { timer = win.setInterval(function(){blinkFunc();}, 100);}, opt.delay);
		} else {
			timer = win.setInterval(function(){blinkFunc();}, 100);
		};
	};

	// Animation.dropOut - 下がりながらフェードアウト
	Animation.dropOut = function(e, opt) {
		var e = DOM(e), opt = FL.union({speed : 2, callback : null, returnDefault : false, delay : 0, __useClone : true}, opt || {});
		var wh = e.absDimension();
		var info = {
				top : wh.top, left : wh.left, width : wh.width, height : wh.height,
				visibility : e.readStyle('visibility'), opacity : e.readStyle('opacity'), zIndex : e.readStyle('zIndex')
		};
		if (opt.__useClone === true) {
			var clone = e.copy(true)
								.appendTo()
								.addStyle({position : 'absolute', top : wh.top + 'px', left : wh.left + 'px', zIndex : (info.zIndex == 'auto') ? 1 : info.zIndex + 1, width : info.width + 'px', height : info.height + 'px'});
			e.addStyle('visibility', 'hidden');
			var def = e;
			e = clone;
			var cloned = true;
		} else {
			var cloned = false;
		};
		(info.visibility == 'hidden') && e.addStyle('visibility', 'visible');
		(info.opacity == 0) && e.addStyle('opacity', 1);
		var timerFunc = function() {
			info.top += opt.speed;
			info.opacity -= opt.speed / 80;
			if (info.opacity < 0) {
				this.stop();
				if (cloned) e.remove();
				if (FL.ut.isFunction(opt.callback)) opt.callback();
				if (opt.returnDefault === true) def.addStyle('visibility', 'visible');
			} else {
				e.addStyle({top : info.top + 'px', opacity : info.opacity});
			};
		};
		if (opt.delay > 0) {
			win.setTimeout(function() { new Timer(timerFunc).start();}, opt.delay);
		} else {
			new Timer(timerFunc).start();
		};
	};

	// Animation.shake - 要素を揺らす
	Animation.shake = function(e, opt) {
		var e = DOM(e), opt = FL.union({direction : 'X', shakeBand : 20, speed : 0.1, callback : null, returnDefault : false, delay : 0, __useClone : true}, opt || {});
		var wh = e.absDimension();
		var info = {
				top : wh.top, left : wh.left, width : wh.width, height : wh.height,
				visibility : e.readStyle('visibility'), opacity : e.readStyle('opacity'), zIndex : e.readStyle('zIndex')
		};
		if (opt.__useClone === true) {
			var clone = e.copy(true)
								.appendTo()
								.addStyle({position : 'absolute', top : wh.top + 'px', left : wh.left + 'px', zIndex : (info.zIndex == 'auto') ? 1 : info.zIndex + 1, width : info.width + 'px', height : info.height + 'px', opacity : info.opacity});
			e.addStyle('visibility', 'hidden');
			var def = e;
			e = clone;
			var cloned = true;
		} else {
			var cloned = false;
		};
		(info.visibility == 'hidden') && e.addStyle('visibility', 'visible');
		var timerFunc = function() {
			var that = this;
			Animation['move' + opt.direction.toUpperCase()](e, {speed : opt.speed, direction : true, distance : opt.shakeBand, __useClone : false, callback : function() {
				Animation['move' + opt.direction.toUpperCase()](e, {speed : opt.speed * 2, direction : false, distance : opt.shakeBand * 2, __useClone : false, callback : function() {
					Animation['move' + opt.direction.toUpperCase()](e, {speed : opt.speed * 2, direction : true, distance : opt.shakeBand * 2, __useClone : false, callback : function() {
						Animation['move' + opt.direction.toUpperCase()](e, {speed : opt.speed, direction : false, distance : opt.shakeBand, __useClone : false, callback : function(){
							e.remove();
							if (cloned)def.addStyle('visibility', 'visible');
							if (FL.ut.isFunction(opt.callback)) opt.callback();
						}});
					}});
				}});
			}});
		};
		if (opt.delay > 0) {
			win.setTimeout(function() { timerFunc();}, opt.delay);
		} else {
			timerFunc();
		};
	};

	// Animation.border - 要素の枠に沿ってボーダーを徐々に伸ばす
	Animation.decorationBorder = function(e, opt) {
		var e = DOM(e), opt = FL.union({speed : 0.5, width : 4, color : '#00f', callback : null, returnDefault : false, keep : true}, opt || {});
		var wh = e.absDimension();
		var info = {
				top : wh.top, left : wh.left, width : wh.width, height : wh.height, right : wh.left + wh.width, bottom : wh.top + wh.height,
				visibility : e.readStyle('visibility'), zIndex : e.readStyle('zIndex')
		};
		var bds = {
				lt : DOM.create('div').addStyle({position : 'absolute', width : opt.width + 'px', height : opt.width + 'px', backgroundColor : opt.color, top : (info.top - opt.width) + 'px', left : (info.left) + 'px', display : 'block', fontSize : 0}).appendTo(),
				rt : DOM.create('div').addStyle({position : 'absolute', width : opt.width + 'px', height : opt.width + 'px', backgroundColor : opt.color, top : (info.top - opt.width) + 'px', left : (info.right) + 'px', display : 'none', fontSize : 0}).appendTo(),
				rb : DOM.create('div').addStyle({position : 'absolute', width : opt.width + 'px', height : opt.width + 'px', backgroundColor : opt.color, top : (info.bottom) + 'px', left : (info.right) + 'px', display :'none', fontSize : 0}).appendTo(),
				lb : DOM.create('div').addStyle({position : 'absolute', width : opt.width + 'px', height : opt.width + 'px', backgroundColor : opt.color, top : (info.bottom) + 'px', left : (info.left - opt.width) + 'px', display : 'none', fontSize : 0}).appendTo()
		};
		var timerFunc = function() {
			var that = this;
			Animation.expandW(bds.lt, {dest : 'right', speed : opt.speed, to : info.width + opt.width, __useClone : false, callback : function() {
			bds.rt.addStyle('display', 'block');
				Animation.expandH(bds.rt, {dest : 'under', speed : opt.speed, to : info.height + opt.width * 2, __useClone : false, callback : function() {
					bds.rb.addStyle('display', 'block');
					Animation.expandW(bds.rb, {dest : 'left', speed : opt.speed, to : info.width + opt.width * 2, __useClone : false, callback : function() {
						bds.lb.addStyle('display', 'block');
						Animation.expandH(bds.lb, {dest : 'top', speed : opt.speed, to : info.height + opt.width * 2, __useClone : false, callback : function(){
							if (opt.keep === false) for (var i in bds) bds[i].remove();
							if (FL.ut.isFunction(opt.callback)) opt.callback();
							if (opt.returnDefault === true) {
								if (cloned)def.addStyle('visibility', 'visible');
							};
						}});
					}});
				}});
			}});
		};
		if (opt.delay > 0) {
			win.setTimeout(function() { timerFunc();}, opt.delay);
		} else {
			timerFunc();
		};
	};

	// Animation.highLight - 背景をハイライトする
	Animation.highLight = function(e, opt) {
		var e = DOM(e), opt = FL.union({initial : '#ffff7f', speed : 2, callback : null, returnDefault : false, dealy : 0}, opt || {});
		var info = {
			bg : e.readStyle('backgroundColor'),  visibility : e.readStyle('visibility'),
			display : e.readStyle('display')
		};
		var rgb = FL.ut.hexToRgb(opt.initial).match(/rgb\(([0-9]+),([0-9]+),([0-9]+)\)/);
		var r = parseInt(rgb[1], 10), g = parseInt(rgb[2], 10), b = parseInt(rgb[3]), toHex;
		var timerFunc = function() {
			r += opt.speed; g += opt.speed; b += opt.speed;
			r = (r > 255) ? 255 : r;
			g = (g > 255) ? 255 : g;
			b = (b > 255) ? 255 : b;
			if (r === 255 && g === 255 && b === 255) {
				e.addStyle('backgoundColor', 'transparent');
				this.stop();
				if (FL.ut.isFunction(opt.callback)) opt.callback();
				if (opt.returnDefault === true) {
					e.addStyle('backgroundColor', info.bg);
				};
			} else {
				toHex = 'rgb(' + r.toString() + ',' + g.toString() + ',' + b.toString() + ')';
				e.addStyle('backgroundColor', FL.ut.rgbToHex(toHex));
			};
		};
		if (opt.delay > 0) {
			win.setTimeout(function() { new Timer(timerFunc).start();}, opt.delay);
		} else {
			new Timer(timerFunc).start();
		};
	};
	// Animation.twincle - 回転しながら拡大
	Animation.twincle = function(e, opt) {
		var e = DOM(e), wh = e.absDimension(), opt = FL.union({from : 0, speed : 1, spin : 10, callback : null, permanence : false, returnDefault : false, __useClone : true, delay : 0}, opt || {});
		var info = {
			width : wh.width, height : wh.height, top : wh.top, left : wh.left,
			visibility : e.readStyle('visibility'), display : e.readStyle('display'), zIndex : e.readStyle('zIndex')
		};
		var toDest = (info.width >= info.height) ? info.width : info.height;
		var per = wh.width / wh.height;
		var clone = e.copy(true)
						.appendTo()
						.addStyle({backgroundColor : '#c00', position : 'absolute', top : info.top + 'px', left : info.left + 'px', zIndex : (info.zIndex == 'auto') ? 1 : info.zIndex + 1, width : info.width + 'px', height : info.height + 'px', overflow : 'hidden'});
		e.addStyle('visibility', 'hidden');
		var deg = 0;
		if (FL.ua.IE) {
			opt.spin = opt.spin * 3; opt.speed = opt.speed * 2;
			var timerFunc = function() {
				var mt = new Animation.__createMatrix(clone);
				if (opt.from < info.width) {
					opt.from += opt.speed;
				} else {
					opt.from = info.width;
				};
				deg += opt.spin;
				if (deg > 360) deg = deg - 360;
				clone.addStyle({
					width : opt.from + 'px',
					height : opt.from * per + 'px'
				});
				mt.rotate(deg);
				var now = mt.get();
				mt.reset();
				var r = Math.sqrt(Math.pow(info.width, 2) + Math.pow(info.height, 2)) / 2;
				var xy = mt.calculateXY(-r / 2, -r / 2);
				var filter = ['M11=', now[0][0], ',M12=', now[0][1], ',M21=', now[1][0], ',M22=', now[1][1], ',SizingMethod="auto expand"'];
				clone.addStyle({
					filter : 'progid:DXImageTransform.Microsoft.Matrix(' + filter.join('') + ')'
				});
				// 座標補正値算出
				var tmpDeg = deg, regt, regl;
				while(tmpDeg > 90) {
					tmpDeg = tmpDeg - 90;
				};
				// 角度によって補正値を分岐する
				switch (true) {
				case (0 <= tmpDeg && tmpDeg <= 45):
					regt = opt.from * Math.sin(tmpDeg * 2 * Math.PI / 360) / 4;
					regl =  opt.from * Math.sin(tmpDeg * 2 * Math.PI / 360) / 4;
					break;
				case (45 < tmpDeg && tmpDeg <= 90):
					regt = opt.from * Math.cos(tmpDeg * 2 * Math.PI / 360) / 4;
					regl =  opt.from * Math.cos(tmpDeg * 2 * Math.PI / 360) / 4;
				break;
				default : regt = regl = 0;break;
				};
				clone.addStyle({
					top : info.top - (regt) + 'px',
					left : info.left - (regl) + 'px'
				});
				if (opt.from >= info.width && ((360 - opt.spin) < deg || deg < opt.spin) && opt.permanence === false) {
					this.stop();
					clone.remove();
					if (FL.ut.isFunction(opt.callback)) opt.callback();
					e.addStyle('visibility', 'visible');
				}
			};
		} else {
			var isFull = false;
			var timerFunc = function() {
				if (opt.from < toDest) {
					opt.from += opt.speed;
				} else {
					opt.from = toDest;
					isFull = true;
				}
				if (FL.ua.Firefox) {
					deg += opt.spin;
					if (deg > 360) deg = 360 - deg;
					clone.addStyle('MozTransform', 'rotate(' + deg + 'deg)');
				} else if (FL.ua.is('S|C')) {
					deg += opt.spin;
					if (deg > 360) deg = 360 - deg;
					clone.addStyle('WebkitTransform', 'rotate(' + deg + 'deg)');
				};
				if (opt.from >= toDest && opt.permanence === false && (350 <deg || deg < 5)) {
					this.stop();
					clone.remove();
					if (FL.ut.isFunction(opt.callback)) opt.callback();
					e.addStyle('visibility', 'visible');
				} else{
					if (isFull === false) {
						clone.addStyle({
							width : opt.from + 'px',
							height : opt.from * per + 'px'});
					};
				};
			};
		};
		if (opt.delay > 0) {
			win.setTimeout(function(){new Timer(timerFunc).start();}, opt.delay);
		} else {
			new Timer(timerFunc).start();
		};
	};

	// Animation.__createMatrix - IE用に座標計算行列生成
	Animation.__createMatrix = function() {
		this.matrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
	};
	Animation.__createMatrix.prototype = {
		translate : function(tx, ty) {
			var tr = [[1, 0, tx], [0, 1, ty], [0, 0, 1]];
			this.multiple(tr);
			return this;
		},
		rotate : function(deg) {
			var rad = deg * Math.PI * 2 / 360, mc = Math.cos(rad), ms = Math.sin(rad);
			var ro = [[mc, -ms, 0], [ms, mc, 0], [0, 0, 1]];
			this.multiple(ro);
			return this;
		},
		multiple : function(mat) {
			var c = this.matrix, m = mat;
			this.matrix= [
					[(m[0][0] * c[0][0] + m[0][1] * c[1][0]), (m[0][0] * c[0][1] + m[0][1] * c[1][1]), (m[0][0] * c[0][2] + m[0][1] * c[1][2] + m[0][2])],
					[(m[1][0] * c[0][0] + m[1][1] * c[1][0]), (m[1][0] * c[0][1] + m[1][1] * c[1][1]), (m[1][0] * c[0][2] + m[1][1] * c[1][2] + m[1][2])],
					[0, 0, 1]
				];
			return this;
		},
		get : function() { return this.matrix;},
		reset : function() {
			this.matix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
		},
		calculateXY : function(x, y) {
			var m = this.matrix;
			var ms = {
					x : (x * m[0][0] + y * m[0][1] + m[0][2]),
					y : (x * m[1][0] + y * m[1][1] + m[1][2])
			};
			return ms;
		}
	};

	// Animation.quadraticMove - 楕円運動 - TODO implement
	Animation.quadraticMove = function(e, opt) {
		var e = DOM(e), opt = FL.union({speed : 1, radX : 300, radY : 100, attneate : 10, callback : null, returnDefault : false, delay : 0}, opt || {});
		var wh = e.absDimension();
		var info = {
			width : wh.width, height : wh.height, top : wh.top, left : wh.left,
			visibility : e.readStyle('visibility'), display : e.readStyle('display')
		};
		var c = FL.ut.getPageSize(), sc = FL.ut.getScrollPosition(), center = {x :screen.width / 2 + sc.x, y : screen.height / 2 + sc.y};
		var clone = e.copy(true)
						.appendTo()
						.addStyle({position : 'absolute', width : info.width + 'px', height : info.height + 'px', top : info.top + 'px', left : info.left + 'px'});
		e.addStyle('visibility', 'hidden');
		var r = Math.round(Math.sqrt(Math.pow(info.top - center.y, 2) + Math.pow(info.left - center.x, 2)));
		var rad = Math.atan(Math.abs(info.top - center.y) / Math.abs(info.left - center.x));
//		var radX = Math.round(r * Math.cos(rad));
//		var radY = Math.round(r * Math.sin(rad));
		var timerFunc = function() {
			rad = rad + opt.speed / 100;
			log(rad);
			clone.addStyle({
				top :opt.radY * Math.sin(rad) + center.y + 'px',
				left : opt.radX * Math.cos(rad) + center.x +'px'
			});
			if (opt.radX > 0) {
				opt.radX = opt.radX - (opt.radX * opt.attneate / 100);
			} else  opt.radX = 0;
			if (opt.radY > 0) {
				opt.radY = opt.radY - (opt.radY * opt.attneate / 100);
			} else  opt.radY = 0;

		};
		new Timer(timerFunc).start();
	};

})();
