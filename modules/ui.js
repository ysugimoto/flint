/**
 * Flint modules ui.js
 * append some intaractive action in user interface.
 *
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * @create 2010/02/10
 */

(function() {
	// get base Object and make alias
	var FL = getInstance(), win = window, doc = document, Timer = FL.Timer, ut = FL.ut,
		DOM = FL.DOM, Animation = FL.config.getGlobal('Animation') || {},
		Module = FL.config.getGlobal('Module');

	//load depend CSS, modules
	FL.load.css('ui');
	FL.load.module('layer');
	FL.load.ajax();
	FL.image.preLoad(FL.config.appPath() + 'fl_images/ui/percent.png');

	/**
	 * preset - Animation pluginがロードされていない場合は使用するエフェクトだけ定義する
	 *-- pile
	 *-- initialize
	 *-- delaystart
	 *-- moveX
	 *-- moveY
	 *-- __move
	 *-- expandW
	 *-- expandH
	 *-- __expand
	 */

	// undefined or set
	if (!Animation.pile) {
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
			var speed = Math.round(opt.speed * 100), ease = opt.easing, x0 = info.top, y0 = info.left, x1 = wht.top, y1 = wht.left;
			var c = 0, cEnd = speed - 1, t,l, step, k = 0.5, deg, KE = k * ease;
			var timerFunc = function() {
				if (c <= cEnd) {
					step = c / cEnd;
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
	}
	if (!Animation.__initialize) {
		Animation.__initialize = function(e) {
			var res = e.absDimension();
			res = FL.union(res, e.readStyle(['visibility', 'display', 'opacity', 'position', 'z-index']));
			if (res.visibility == 'hidden') {e.visible();}
			if (e.isHidden()) {e.show();}
			return res;
		};
	}
	if (!Animation.__delayStart) {
		Animation.__delayStart = function(fn, time) {
			var delay = time || 0, tim = new Timer(fn);
			if (delay > 0) {win.setTimeout(function() {tim.start();}, delay);} else { tim.start();}
		};
	}

	// preset end

	/** UI - ユーザーインターフェース操作系のモジュール定義
	 * methods
	 * draggable - 要素をドラッグ可能にする
	 * dragDrop - ドラッグドロップを可能にする
	 * sortable - 特定のクラス名内でソート可能にする
	 * zoom - コンテンツをフロートボックス内に拡大表示
	 * slider - スライダーオブジェクト生成
	 * selectable - 要素を選択状態にする
	 * resizable - 要素をリサイズ可能にする
	 */
	var UI = {
		/** UI.draggable - 要素をドラッグ可能にする
		 * optパラメータによる動作設定
		 * returnDefault : ドラッグ終了時に元の位置に戻すかどうか default : false
		 * handle : ドラッグを開始させる要素 default 第一引数のelement. この場合、単一要素がそのままドラッグ対象になる
		 *                             この項目をセットした場合、指定要素のmousedownで第一引数要素のドラッグ開始
		 * initStart : 初期状態でドラッグ可能とするかどうか default : true - falseの場合、インスタンスから明示的にstart()メソッドを呼ぶことでドラッグ開始
		 * mask : ドラッグ領域を指定するマスクエレメントを指定 default : null
		 * judgeFunc : ドラッグ中にドラッグを終了させるフック関数を指定 default : null 関数はbooleanを返す必要がある
		 * callback : ドラッグ終了時に実行する関数を指定
		 */
		draggable : function(elm, opt) {
			var e = DOM(elm), pg = e.readStyle('position');
			if (pg === 'absolute') {
				if (FL.ua.__positionKey && e.prop('__isFixed') == 4) {pg = 'fixed';}
			}
			this.wh = this.nativeWh = e.absDimension();
			this.opt = FL.union({returnDefault : false, initStart : true, mask : null, judgeFunc : null, handle : e, callback : null}, opt || {});
			this.FL = FL;
			this.pos = pg;
			this.keepClone = (pg == 'static') ? true : false;
			this.offset = {x: 0, y : 0};
			this.nativeElement = e;
			this.handle = DOM(this.opt.handle) || this.nativeElement;
			this.isDragSet = false;
			this.isDrop = false;
			this.dragElement = null;
			this.shim = null; // for IE6;
			if (this.opt.initStart === true) {
				this.setDrag();
			}
			return this;
		},
		/** UI.dragDrop - 要素をドラッグ＆ドロップ可能にする
		 * optパラメータによる動作設定
		 * dropClass : ドロップを受け入れるclass名を指定  default : fl_droppable
		 * returnDefault : ドラッグ終了時、受け入れ先が決まっていない場合、元に戻る default : true
		 * mask : ドラッグ有効領域指定エレメントを指定 default : null
		 * handle - ドラッグを開始させる要素 default 第一引数のelement. この場合、単一要素がそのままドラッグ対象になる
		 *                この項目をセットした場合、指定要素のmousedownで第一引数要素のドラッグ開始
		 * dropActiveClass : ドロップ対象となったときに付与されるclass名
		 * callback : ドロップ終了時に実行されるコールバック関数
		 *               callback.call(ドラッグした要素, ドロップ対象の要素(無ければnull))
		 *  viewTarget : ドラッグ開始時に対象要素を非表示にするかどうか default true
		 */
		dragDrop : function(e, opt) {
			this.nativeElement = DOM(e);
			this.wh = this.nativeWh = DOM(e).absDimension();
			this.opt = FL.union({dropClass : 'fl_droppable', returnDefault : true, mask : null, handle : e, dropActiveClass : 'fl_droppable_active', callback : null, viewTarget : true}, opt || {});
			this.FL = FL;
			this.offset = {x : 0, y : 0};
			this.isDrop = true;
			this.dropTarget = null;
			this.handle = DOM(this.opt.handle) || this.nativeElement;
			this.dragElement = null;
			this.currentInner = null;
			this.shim = null; // for IE6;
			// ドロップ受け入れ先はclass属性で判定
			this.dropElement = DOM.className(this.opt.dropClass);
			this.setDrag();
			return this;
		},
		/** UI.resizable - 要素をリサイズ可能にする
		 * optパラメータによる動作設定
		 * resizeClass : リサイズ可能とするclass名
		 */
		resizable : function(e, opt) {
			this.nativeElement = DOM(e).addStyle('overflow', 'hidden');
			this.opt = FL.union({resizeClass : 'fl_resizable'}, opt || {});
			this.FL = FL;
			this.offset = {x: 0, y : 0};
			this.wh = this.nativeElement.absDimension();
			this.mark = DOM.create('span').appendTo().addStyle({position : 'absolute', top : this.wh.bottom - 10 + 'px', left : this.wh.right - 10 + 'px', width : '10px', height : '10px', color : '#00f', cursor : 'nw-resize', background : 'url(' + FL.config.appPath() + 'fl_images/resize_marker.gif) top left no-repeat'});
			this.resizeFlag = false;
			this.setDrag();
			return this;
		},
		/** UI.sortable - 要素を入れ替える
		 * optパラメータによる動作設定
		 * sortcClass : ソート可能とするclass属性 default : fl_sortable
		 * sortMode : ソート方向指定（V : 縦方向,P : 横方向 - 方向によって判定領域が変わります） default : 'V'
		 * animate : ソート時のアニメーション設定 default : false
		 */
		sortable : function(opt, nodeList) {
			this.opt = FL.union({sortClass : 'fl_sortable', sortMode : 'V', animate : false, dropParentClass : false, callback : null, handleClass : null, copyDrag : true, sortStart : null, doCallback : false, judge : null, parentJudge : null}, opt || {});
			this.dragElement = null;
			this.targetList = nodeList || null;
			this.sortList = null;
			this.sortTargetList = null;
			this.handleSort = !!this.opt.handleClass;
			this.handleClass = this.opt.handleClass;
			this.offset = {};
			this.withDropParent = (this.opt.dropParentClass) ? DOM.className(this.opt.dropParentClass) : null;
			this.FL = getInstance();
			this.current = null;
			this.setDrag();
			return this;
		},
		/** UI.zoom - 要素をフローティングボックスで拡大表示
		 * optパラメータによる動作設定
		 * contentMode : 内容領域に表示するもの default : image
		 *    contentModeのパラメータ
		 *        image - 画像を表示（この場合、URIをhref属性に指定する）
		 *        ajax - Ajaxで取得した内容を表示（この場合、URIをa要素のhref属性に指定する）
		 *        external - iframe内にコンテンツをセット（この場合、URIをa要素のhref属性に指定する）
		 *
		 */
		zoom : function(c, contentMode, opt) {
			this.zoomClass = c;
			this.opt = FL.union({openCallback : null, closeCallback : null}, opt || {});
			this.clone = null;
			this.zoomList = DOM.className(c);
			this.zoomImages = {};
			this.tmp = [];
	//		this.isZoom = false;
			this.contentMode = contentMode || 'image';
			FL.load.module('layer');
			this.init();
		},
		/** UI.slider - スライダーオブジェクトを生成
		 * e - 指定した要素の中にスライダーを生成、無ければbodyにセット
		 * optパラメータによる動作設定
		 * width : スライダーの横幅 - default : 300
		 * initPosition : 初期にセットする場所（%指定）- default : 50
		 * sliders : セットするスライダーのコールバック関数をハッシュで指定。length分のスライダーを生成、ハンドルはキーで取得できる
		 */
		slider : function(e, opt) {
			this.wrapElement = e;
			this.opt = FL.union({
				width : 300,
				initPosition : 50,
				sliders : {'single' : null},
				state : false,
				onstart : null,
				onslide : null,
				onend : null
			}, opt || {});
			this.offsetX = 0;
			this.current = 0;
			this.currentSlide = null;
			if (FL.system.DOM_LOADED === true) {
				this.initialize();
			} else {
				FL.event.set(doc, 'DOMReady', this.initialize, this);
			}
			return this;
		},
		/** UI.scroll - ページをスムーズスクロールさせる
		 * @param e - String or HTML Element
		 *         引数にはtop,bottomの文字列、またはHTML要素を指定
		 *        top（または引数なし） : ページトップへスクロール
		 *        bottom : ページ最下部へスクロール
		 *        element : 要素の絶対位置までスクロール
		 * @param callback - スクロール終了時のコールバック関数指定
		 */
		scroll : function(e, callback) {
			var mode = e || 'top',
				y0 = FL.ut.getScrollPosition().y,
				Timer = FL.Timer,
				duration = 800,
				y1 = ( mode.extended || mode.nodeType ) ? DOM(mode).absDimension().top
				     : ( mode === 'top' ) ? 0
				     : doc.body.offsetHeight,
				begin = +new Date,
				tmf = function() {
					var now = +new Date,
						time = now - begin,
						point;
					
					if ( time < duration ) {
						point = Animation.easings['easeOutCubic'](time, y0, y1 - y0, duration);
						
						if ( win.IEFIX && win.IEFIX.html ) { // if IEBoost::positionFix
							win.IEFIX.html.scrollTop = point | 0;
						} else if ( FL.ua.webkit ){
							doc.body.scrollTop = point | 0;
						} else {
							doc.documentElement.scrollTop = point | 0;
						}
					} else {
						if ( FL.ua.webkit ){
							doc.body.scrollTop = point | 0;
						} else {
							doc.documentElement.scrollTop = point | 0;
						}
						this.stop();
						if ( FL.ut.isFunction(callback) ) {
							callback();
						}
					}
				},
				t = new Timer(tmf);
				
			// スクロール開始時に一瞬だけチラつきがでるので補正
			doc.body.scrollTop = y0;	
			t.start();
		},
		/**
		 * UI.selectable - 要素を選択状態にする
		 * @param e - HTML Element(基点ノード<ul>または<table>)
		 * @param opt - some parameters
		 * opt keys:
		 * -- (Boolean) multiple : 複数選択の許可[default : false]
		 * -- (Object) selectState : 選択状態時のCSSルール[default : {color : #fff, backgroundColor : #0000a6}]
		 * -- (Function) onSelect - 選択時のコールバック関数
		 * -- (Function) onRelease - 選択解除時のコールバック関数
		 */
		selectable : function(e, opt) {
			var elm = DOM(e);
			if (!/table|ul/.test(elm.tag)) { throw new Error('UI.selectable works <table> or <ul> element only.');}
			this.base = e;
			this.mode = e.tag;
			if (this.mode === 'table') {
				this.childs = e.detect('td');
			} else {
				this.childs = e.detect('li');
			}
			this.opt = FL.union({multiple : false, selectState : {color : '#fff', backgroundColor : '#68b4ff'}, onSelect : null, onRelease : null}, opt || {});
			this.__addStyleKeys = [];
			this.cnt = 0;
			this.__defaults = {};
			this.selectList = [];
			this.init();
			return this;
		}
	};

	// UI.selectable.prototype
	UI.selectable.prototype = {
		init : function() {
			var that = this, cn, i;

			for (i in this.opt.selectState) {
				if (!i.isPrototypeOf(this.opt.selectState)){
					this.__addStyleKeys.push(i);
				}
			}
			this.childs.foreach(function() {
				cn = this.__fl_selectable_count = ++that.cnt;
				that.__defaults[cn] = DOM(this).readStyle(that.__addStyleKeys);
			});
			FL.event.set(this.base.get(), 'click', this.select, this);
		},
		select : function(ev) {
			ev.preventDefault();
			var e = ev.target, ex = DOM(e);

			if (this.opt.multiple === true) { // enable multiple select
				if (this.selectList.length === 0) { this.__addSelect(ex);}
				else if (ev.ctrlKey){
					if (this.__isAlready(e)) { this.__deleteSelect(ex);}
					else { this.__addSelect(ex);}
				} else {
					this.clear();
					this.__addSelect(ex);
				}
			} else { // only one selectable
				this.clear();
				this.__addSelect(ex);
			}
		},
		__addSelect : function(e) {
			e.addStyle(this.opt.selectState);
			this.selectList.push(e.get());
		},
		__deleteSelect : function(e) {
			var s = this.selectList, len = s.length, i = 0;

			for (i; i < len; i++) {
				if (s[i] === e.get()) {
					e.addStyle(this.__defaults[e.get().__fl_selectable_count]);
					s.splice(i, 1);
				}
			}
		},
		__isAlready : function(e) {
			var s = this.selectList, len = s.length, i = 0;

			for (i; i < len; i++) {
				if (s[i] === e) { return true;}
			}
			return false;
		},
		clear : function() {
			var s = this.selectList, len = s.length, i = 0, j;

			for (i; i < len; i++) {
				DOM(s[i]).addStyle(this.__defaults[s[i].__fl_selectable_count]);
			}
			this.selectList = [];
		},
		getSelectList : function(bool) {
			if (!bool) {return this.selectList;} // native Elements Array
			else { return DOM.__extendNodeList(this.selectList);} // xNodeList
		}
	};

	// UI.slider.prototype
	UI.slider.prototype = {
		initialize : function() {
			this.wrapElement = DOM(this.wrapElement || doc.body);
			this.wrap = DOM.create('div')
							.addClass('fl_ui_slider_wrapper')
							.prependTo(this.wrapElement)
							.addStyle('position', 'static');

			this.frame = DOM.create('div')
							.attr('class', 'fl_ui_slider')
							.appendTo(this.wrap)
							.addStyle('width', this.opt.width + 'px');

			this.current = Math.round(this.opt.width * this.opt.initPosition / 100);

			this.backL = DOM.create('p')
							.attr('class', 'fl_ui_slider_back_left')
							.appendTo(this.frame)
							.addStyle('width', '6px');

			this.backC = DOM.create('p')
							.attr('class', 'fl_ui_slider_back_center')
							.appendTo(this.frame)
							.addStyle('width', this.opt.width - 12 + 'px');

			this.backR = DOM.create('p')
							.attr('class', 'fl_ui_slider_back_right')
							.appendTo(this.frame)
							.addStyle('width', '6px');

			if (this.opt.state) {
				this.state = DOM.create('p')
								.attr('class', 'fl_ui_slider_state')
								.appendTo(this.frame)
								.inText(this.opt.initPosition)
								.hide();
			}
			var z = this.wrapElement.readStyle('zIndex', true);

			this.currentIndex = (z == 'auto') ? 50 : z + 1;
			var cn = 0;
			for (var i in this.opt.sliders) {
				this['pointer' + i] = this['point' + cn] = DOM.create('div')
																	.attr('class', 'fl_ui_slider_pointer')
																	.appendTo(this.frame)
																	.addStyle({
																		left : Math.round(this.opt.width * this.opt.sliders[i].initPosition / 100 - 4)  + 'px',
																		zIndex : this.currentIndex++
																	})
																	.prop('__sliderID', i)
																	.prop('__slideValue', this.opt.sliders[i].initPosition)
																	.prop('__sliderNumber', ++cn);

				FL.event.set(this['pointer' + i].get(), 'mousedown', this.slide, this);
				cn++;
			}
			if (cn === 1) {
				FL.event.set(this.frame.get(), 'click', this.slideOfFrame, this);
			}
		},
		slideOfFrame : function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			var wh = this.frame.absDimension();

			this.current = ev.pageX - wh.left;
			this.point0.addStyle('left', ev.pageX - wh.left - 4 + 'px');
		},
		slide : function(ev) {
			ev && ev.preventDefault();
			ev && ev.stopPropagation();
			var t = DOM(ev.target),
				num = t.prop('__sliderNumber');

			t.addClass('onslide' + num % 3);
			this.currentSlide = t;
			t.addStyle('zIndex', ++this.currentIndex);
			if (this.opt.state){
				this.state.addStyle('left', t.readStyle('left', true) - 20 + 'px')
							.show();
			
				this.state.get().innerHTML = (Math.round((t.readStyle('left', true) + 4) / this.opt.width * 100));
			}
			this.opt.onstart && this.opt.onstart.call(ev.target);
			this.offsetX = ev.pageX - t.readStyle('left', true);
			FL.event.remove(ev.target, 'mousedown', arguments.callee);
			FL.event.set(document, 'mousemove', this.doSlide, this);
			FL.event.set(document, 'mouseup', this.slideEnd, this);
		},
		doSlide : function(ev) { // TODO : 軽量化が必要
			ev.preventDefault();
			ev.stopPropagation();
			var current = ev.pageX - this.offsetX;
			this.current = current;
			if (current < -4) {
				this.currentSlide.prop('__slideValue', 0);
				if (this.opt.state) {
					this.state.get().innerHTML = '0';
				}
				if (this.currentSlide.prop('__sliderID') && FL.ut.isFunction(this.opt.sliders[this.currentSlide.prop('__sliderID')])) {
					this.opt.sliders[this.currentSlide.prop('__sliderID')]();
				}
				this.slideEnd();
			} else if (current > this.opt.width - 4) {
				this.currentSlide.prop('__slideValue', 100);
				if (this.opt.state) {
					this.state.get().innerHTML = '100';
				}
				if (this.currentSlide.prop('__sliderID') && FL.ut.isFunction(this.opt.sliders[this.currentSlide.prop('__sliderID')])) {
					this.opt.sliders[this.currentSlide.prop('__sliderID')]();
				}
				this.slideEnd();
			} else {
				this.currentSlide.prop('__slideValue', Math.round((this.current + 4) / this.opt.width * 100));
				if (this.opt.state) {
					this.state.addStyle('left', (current - 20 < 0) ? 0  : current - 20 + 'px');
				}
				if (this.currentSlide.prop('__sliderID') && FL.ut.isFunction(this.opt.sliders[this.currentSlide.prop('__sliderID')])) {
					this.opt.sliders[this.currentSlide.prop('__sliderID')]();
				}
				this.currentSlide.addStyle('left', current + 'px');
				if (this.opt.state) {
					this.state.get().innerHTML = (Math.round((this.current + 4) / this.opt.width * 100));
				}
				this.opt.onslide && this.opt.onslide.call(this.currentSlide.get());
			}

		},
		slideEnd : function(ev) {
			ev && ev.preventDefault();
			ev && ev.stopPropagation();
			var t = this.currentSlide,
				num = t.prop('__sliderNumber');

			t.removeClass('onslide' + num % 3);
			//t.removeClass('onslide');
			if (this.opt.state) {
				this.state.hide();
			}
			this.opt.onend && this.opt.onend.call(this.currentSlide.get());
			FL.event.remove(document, 'mousemove', this.doSlide);
			FL.event.remove(document, 'mouseup', arguments.callee);
			FL.event.set(t.get(), 'mousedown', this.slide, this);
		},
		getValue : function(handle) {
			return this['pointer' + handle].prop('__slideValue');
		}
	};

	// UI.zoom.prototype
	UI.zoom.prototype = {
		init : function() {
			var that = this;

			this.zoomList.foreach(function(){
				FL.event.set(this, 'click', that.zoom, that);
			});
		},
		zoom : function(ev) {
			ev.preventDefault();
			var e = DOM(ev.currentTarget),
				cid = e.__getCID(),
				href = e.readAttr('href'),
				that = this,
				img, fr,
				mouse = { left : ev.pageX, top : ev.pageY };

			if (this.isZoom) {
				return;
			}
			this.isZoom = true;
			switch (this.contentMode) {
			case 'image':
				img = new Image();
				img.onload = function(){
					that.createZoom(img, e, mouse);
					img.onload = null;
				};
				img.src = href;
				break;
			case 'ajax':
				FL.ajax.get(href, {async : false, success : function(resp) {that.createZoom(resp.responseText, e, mouse);}});
				break;
			case 'external':
				fr = DOM.create('iframe')
						.attr({'frameborder' : 0})
						.prop('__src', href)
						.addStyle('backgroundColor', '#fff');

				this.createZoom(fr, e, mouse);
				break;
			}
		},
		createZoom : function(data, e, pos) {
			var size,
				clone,
				ap,
				w,
				h,
				sc,
				page,
				flagX,
				flagY,
				wh = e.absDimension(),
				that = this;

			switch (this.contentMode) {
			case 'image' :
				size = FL.image.getDefaultSize(data);
				ap = DOM.create('img')
						.attr('src', data.src);
				break;
			case 'ajax' :
				size = FL.union({
							width : screen.availWidth * 2 / 3,
							height : screen.availHeight * 2 / 3
						}, this.opt);
				ap = DOM.create('div')
							.html(data)
							.addStyle({
								backgroundColor : '#fff',
								overflow : 'auto',
								height : this.__addUnit(size.height, 'h'),
								width : this.__addUnit(size.width, 'w')
							});
				break;
			case 'external' :
				size = FL.union({
							width : screen.availWidth * 2 / 3,
							height : screen.availHeight * 2 / 3
						}, this.opt);
				ap = data;
				ap.addStyle({
					width : this.__addUnit(size.width, 'w'),
					height : this.__addUnit(size.height, 'h'),
					border : 'none'
				});
				break;
			default : return;
			}
			w = this.__addUnit(size.width, 'w', true);
			h = this.__addUnit(size.height, 'h', true);
			sc = FL.ua.__positionKey
					? FL.ut.getScrollPosition()
					: {x :0, y : 0};

			this.clone = DOM.create('div')
								.attr('class', 'fl_zoom_image')
								.appendTo(doc.body)
								.addStyle({
									top : wh.top - sc.y + 'px',
									left : wh.left - sc.x + 'px',
									width : wh.width + 10 + 'px',
									height : wh.height + 10 + 'px',
									overflow : '',
									position : 'absolute',
									'backgroundColor' : '#ccc',
									padding : '10px',
									zIndex : (FL.ua.IE6) ? 5020 : 1020,
									border : 'solid 1px #ccc',
									marginTop : 0,
									marginLeft : 0,
									borderRadius : '5px',
									MozBorderRadius : '5px',
									WebkitBorderRadius : '5px'
								});
			if ( ! FL.ua.IE ) {
				this.clone.addStyle('opacity', 0.5);
			}

			this.close = DOM.create('div')
							.addClass('fl_zoom_close_btn')
							.event('click', this.closeBox, this)
							.html('&nbsp;');

			page = {
				width : screen.availWidth,
				height : screen.availHeight
			};
			sc = FL.ut.getScrollPosition();
			to = {
				x : page.width / 2 + sc.x - 20,
				y : page.height / 2 + sc.y - 20
			};
			flagX = (to.x > pos.left) ? true : false;
			flagY = (to.y > pos.top) ? true : false;
			this.tmp = [wh, e, flagX, flagY];

			Animation.centerize(
				this.clone,
				{
					targetWidth : w,
					targetHeight : h,
					speed : (FL.ua.is('I7|I8')) ? 15 : 30,
					easing : -30,
					callback : function(){
						that.clone.addStyle({
							backgroundImage : FL.config.appPath() +'fl_images/loader.gif',
							backgroundPosition : 'center center',
							backgroundRepeat : 'no-repeat'
						});
						ap.appendTo(that.clone);

						that.close.prependTo(that.clone);
						if (FL.ua.IE6) {
							that.close.addStyle('filter', FL.ut.makeFilter('png', FL.config.appPath() + 'fl_images/ui/close.png'));
						}
						if (that.contentMode === 'external') {
							ap.attr('src', ap.prop('__src'));
						}
						//that.clone.addStyle('opacity', 1);
						if ( !FL.ua.IE) {
							that.clone.addStyle('opacity', 1);
							//that.clone.addStyle('filter', '');
						}
						that.layer = new Module.layer(true);
						FL.event.set(that.layer.getLayerObject().get(), 'click', that.closeBox, that);
						if (that.contentMode === 'image') {
							FL.event.once(that.clone.get(), 'click', that.closeBox, that);
							that.clone.addStyle('backgroundImage', 'none');
						}
						if (that.opt.openCallback && FL.ut.isFunction(that.opt.openCallback)) {
							that.opt.openCallback.call(e.get());
						}
					}
				}
			);
		},
		closeBox : function(ev) {
			ev.preventDefault();
			var wh = this.clone.absDimension(),
				that = this,
				to;

			this.clone.removeStyle('backgroundImage');
			try{
				this.clone.last().remove();
			} catch(e){};

			FL.event.remove(this.clone, 'click', arguments.callee);
			to = this.tmp[1].absDimension();

			this.clone.addStyle('opacity', 0.7)
						.unevent('click')
						.hide()
						.remove();

			that.layer.hide();
			if (that.opt.closeCallback && FL.ut.isFunction(that.opt.closeCallback)) {
				that.opt.closeCallback();
			}
			this.isZoom = false;
		},
		__addUnit : function(wh, mode, returnInt) {
			var num,
				v,
				i = 0,
				str,
				d;

			// check width/height value has unit?
			wh += '';
			if (wh.lastIndexOf('%') !== -1) {
				num = win.parseInt(wh, 10);
				v = (mode === 'w')
					? (win.innerWidth || screen.availWidth) * num / 100 - 20
					: (win.innerHeight || screen.availHeight) * num / 100 - 20;

				return returnInt ? v : v + 'px';
			} else if (wh.lastIndexOf('em') !== -1) {
				num = win.parseInt(wh, 10);
				str = 'あ';
				for (; i < num; i++) {
					str += 'あ';
				}
				d = doc.createElement('div');
				d.appendChild(doc.createTextNode(str));
				doc.body.appendChild(d);
				v = (mode === 'w')
					? d.offsetWidth
					: d.offsetHeight;
				doc.body.removeChild(d);
				d = null;

				return returnInt ? v : v + 'px';
			} else if (wh.lastIndexOf('px') !== -1) {
				return returnInt ? win.parseInt(wh, 10) : w;
			} else {
				return returnInt ? wh : wh + 'px';
			}
		}
	};

	// UI.sortable.prototype
	UI.sortable.prototype = {
		setDrag : function() {
			var that = this,
				e;

			if (this.handleSort) {
				this.sortList = (this.targetList) ? this.targetList : DOM.className(this.handleClass);
				this.sortTargetList = DOM.className(this.opt.sortClass);
			} else {
				this.sortList = (this.targetList) ? this.targetList : DOM.className(this.opt.sortClass);
				this.sortTargetList = this.sortList;
			}
			this.sortList.foreach(function(num) {
				e = DOM(this).addStyle('cursor', 'move');
				that.offset[e.__getCID] = {x: 0, y : 0};
				that.FL.event.set(this, 'mousedown', that.dragInit, that);
			});
		},
		addSortElement : function(elm) {
			var e = DOM(elm),
				handle = (this.handleSort)
							? e.getOne('.' + this.handleClass)
							: e,
				ne = handle.get(),
				nne = e.get(),
				flag = false,
				tFlag = false;

			this.sortList.foreach(function() {
				if (this === ne) {
					flag = true;
					return false;
				}
			});

			if (flag === false) {
				handle.addStyle('cursor', 'move');
				this.offset[handle.__getCID] = {x : 0, y : 0};
				this.FL.event.set(handle, 'mousedown', this.dragInit, this);
			}

			this.sortTargetList.foreach(function() {
				if (this === nne) {
					tFlag = true;
					return false;
				}
			});

			if (tFlag === true) {
				this.sortTargetList.nodeList.push(nne);
				++this.sortTargetList.length;
			}
		},
		_getTarget : function(e) {
			while (e && e !== doc.documentElement) {
				if (DOM(e).hasClass(this.opt.sortClass)) {
					return DOM(e);
				}
				e = e.parentNode;
			}
			return null;
		},
		dragInit : function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			var e = (this.handleSort)
					? this._getTarget(ev.target)
					: DOM(ev.currentTarget),
				wh,
				pl,
				pr;

			if (!e) {
				return;
			}
			this.current = e;
			this.handle = DOM(ev.currentTarget);

			// hook sort start
			if (FL.ut.isFunction(this.opt.sortStart)) {
				if (this.opt.sortStart(this.current) === false) {
					return;
				}
			}
			wh = e.absDimension();
			pl = e.readStyle('paddingLeft');
			pr = e.readStyle('paddingRight');

			if (this.opt.copyDrag === true) {
				if ( e.tag !== 'div' ) {
					this.dragElement = DOM.create('div');
					e.copy(true).appendTo(this.dragElement);
				}
				else {
					this.dragElement = e.copy(true);
											
				}
				this.dragElement.appendTo().removeAttr('')
										.addStyle({
											position : 'absolute',
											top : wh.top + 'px',
											left : wh.left + 'px',
											width : wh.width + 'px',
											height : wh.height + 'px',
											opacity : '0.5',
											paddingLeft : pl,
											paddingTop : e.readStyle('paddingTop'),
											paddingBottom : e.readStyle('paddingBottom'),
											paddingRight : e.readStyle('paddingRight'),
											zIndex : 5000
										});
				e.hide();
			} else {
				this.dragElement = DOM.create('div')
										.addClass('fl_sort_simple')
										.appendTo()
										.addStyle({
											position : 'absolute',
											top : wh.top + 'px',
											left : wh.left + 'px',
											width : wh.width - 2 + 'px',
											height : wh.height + 'px',
											border : 'ridge 3px #00c',
											padding : e.readStyle('padding'),
											zIndex : 5000
										});
			}
			this.placeHolder = DOM.create(e.tag, {'class' : 'fl_sortable_tmp'})
									.appendTo(e, 'after')
									.addStyle({
										width : wh.width + 'px'/*'100%'*/,
										height : wh.height + 'px',
										visibility : 'visible',
										border : 'solid 2px #00CB00',
										backgroundColor : '#ffc'
									})
									.addClass(e.readAttr('class'));
			this.__animateHeight = wh.height;

			this.initPoint = {
				x : this.dragElement.readStyle('left', true),
				y : this.dragElement.readStyle('top', true)
			};
			this.start = {
				x : ev.pageX,
				y : ev.pageY
			};
			this.initRect = e.absDimension();
			e.hide();
			this.FL.event.set(doc, 'mousemove', this.sort, this);
			this.guard = 0;
			this.FL.event.set(doc, 'mouseup', this.sortEnd, this);
		},
		sort : function(ev) {
			ev.preventDefault();
			if (this.guard) {
				return;
			}
			this.guard = 1;
			var sc = (this.pos === 'fixed') ? FL.ut.getScrollPosition() : {x : 0, y : 0},
				that = this,
				done = false,
				mouse = { y : ev.pageY, x :ev.pageX },
				tb, lr;

			if (!FL.ut.mouseInRect(mouse, this.placeHolder)) {

				// simple sort
				this.sortTargetList.foreach(function(num){
					if (that.opt.sortMode == 'V') {
						tb = that.FL.ut.mouseInRectHalfVertical(mouse, this);
						if ( tb !== false ) {
							done = that.doSort(this, tb);
							//done = true;
							return false;
						}
					} else if (that.opt.sortMode == 'P') {
						lr = that.FL.ut.mouseInRectHalfParallel(mouse, this);
						if ( lr !== false ) {
							done = that.doSort(this, lr);
							//done = true;
							return false;
						}
					}
				});
				// with parent?
				if (this.withDropParent && done === false) {
					this.withDropParent.foreach(function() {
						if (DOM(this).isEmpty() && that.FL.ut.mouseInRect(mouse, this)) {
							that.doDrop(this);
							return false;
						}
					});
				}
			}
			this.dragElement.addStyle({
				top : this.initPoint.y + (ev.pageY - this.start.y) - sc.y + 'px',
				left :this.initPoint.x + (ev.pageX - this.start.x) - sc.x + 'px'
			});
			this.guard = 0;
		},
		doSort : function(e, mode) {

			var c = this.current,
				t = DOM(e),
				point,
				w;
			
			point = (/L|T/.test(mode)) ? 'before' : 'after';
			
			if ( this.FL.ut.isFunction(this.opt.judge) && this.opt.judge(e, point) === false ) {
				return false;
			}
			
			w     = (!mode) ? t.parent().prop('offsetWidth') : t.prop('offsetWidth');

			this.placeHolder.appendTo(t, point)
								.addStyle('width', w - 8 + 'px');
			return true;
		},
		doDrop : function(e) {
			if ( this.FL.ut.isFunction(this.opt.parentJudge) && this.opt.parentJudge(e) === false ) {
				return;
			}

			this.placeHolder.appendTo(e)
								.addStyle('width', e.offsetWidth - 8 + 'px');
//								.addStyle('height', '0px')
//								.animate({height: this.__animateHeight}, {speed : 10});
		},
		sortEnd : function(ev) {
			ev && ev.preventDefault();
			var doCallback = true,
				mouse = { x : ev.pageX, y : ev.pageY },
				rect = this.initRect,
				that = this;

			this.FL.event.remove(doc, 'mousemove', this.sort);
			this.FL.event.remove(doc, 'mouseup', this.sortEnd);
			// Does sorted element not moved?
			if (mouse.x > rect.left
					&& mouse.x < rect.right
					&& mouse.y > rect.top
					&& mouse.y < rect.bottom
					&& this.opt.doCallback === false) {
				doCallback = false;
			}
			if (this.opt.animate === true) {
				Animation.pile(
					this.dragElement,
					{
						target : this.placeHolder,
						__useClone : false,
						easing : 100,
						speed : 0.2,
						callback : function() {
							that.dragElement.remove();
							that.current.appendTo(that.placeHolder, 'before')
										.show();
							that.placeHolder.remove();
							if (that.FL.ut.isFunction(that.opt.callback)
									&& doCallback === true) {
								that.opt.callback.call(that.current);
							}
						}
					}
				);
			} else {
				this.dragElement.remove();
				this.current.appendTo(this.placeHolder, 'before')
								.show();
				this.placeHolder.remove();
				if (this.FL.ut.isFunction(this.opt.callback)
						&& doCallback === true) {
					this.opt.callback.call(this.current);
				}
			}
		}
	};

	// UI.draggable.prototype with UI.dragDrop.prototype -draggable, dragDrop共有メソッド
	UI.draggable.prototype = UI.dragDrop.prototype = {
		setDrag : function() {
			// イベントセット
			this.isDragSet = true;
			//this.wh = this.nativeElement.absDimension();
			this.handle.addStyle('cursor', 'move');
			this.nativeM = /absolute|relative/.test(this.pos) ? { top : this.nativeElement.readStyle('margin-top', true) , left : this.nativeElement.readStyle('margin-left', true) }
																	: { top : 0, left : 0};
			this.FL.event.set(this.handle.get(), 'mousedown', this.dragInit, this);
		},
		dragInit : function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			var sc,
				placeHolder;

			if (this.dragElement === null) { // 初回ドラッグ
				this.wh = this.nativeElement.absDimension();
				this.FL.event.remove(this.handle.get(), 'mousedown', this.dragInit);
				if (this.isDrop) {
					this.dropElement = DOM.className(this.opt.dropClass);
					this.dragElement = this.nativeElement.copy(true)
												.appendTo((FL.ua.__positionKey) ? IEFIX.body : doc.body)
												.addStyle({
													position : 'absolute',
													zIndex : 1500,
													top : this.wh.top - this.nativeM.top + 'px',
													left : this.wh.left - this.nativeM.left + 'px',
													width : this.wh.width + 'px',
													height : this.wh.height + 'px',
													listStyle : 'none outside'
												});
					if (this.opt.viewTarget === false) {
						this.nativeElement.invisible();
					}
				} else {
					if (this.keepClone === true) { // case : position : static, fixed(IE6, IE7,8Q)
						this.nativeElement.hide();
						placeHolder = this.nativeElement.copy(true)
												.appendTo(this.nativeElement, 'after')
												.addStyle({visibility : 'hidden'});

						this.nativeElement.addStyle({
							position : 'absolute',
							visibility : 'visible',
							zIndex : 1500,
							top : this.wh.top - this.nativeM.top + 'px',
							left : this.wh.left - this.nativeM.left + 'px'
						})
						.show()
						.appendTo();
						this.dragElement = this.nativeElement;
					} else { // case position : fixed, absolute, relative
						this.dragElement = this.nativeElement;
						this.dragElement.addStyle('z-index', 1500);
					}
				}
				this.firstTimes = true;
			} else { // 2回目以降
				this.wh = this.dragElement.absDimension();
				if (this.isDrop) {
					this.FL.event.remove(this.handle.get(), 'mousedown', this.dragInit);
					if (this.opt.viewTarget === false) {
						this.nativeElement.invisible();
					}
				} else {
					this.FL.event.remove(this.handle.get(), 'mousedown', this.dragInit);
				}
			}
			if (FL.ua.IE6) {
				// set Shim if not exists
				if (this.shim === null) {
					this.shim = DOM.create('iframe')
									.appendTo()
									.addStyle({
										top : this.wh.top - this.nativeM.top + 'px',
										left : this.wh.left - this.nativeM.left + 'px',
										width : this.wh.width + 'px',
										height : this.wh.height + 'px',
										display : 'block',
										zIndex : 98,
										border : 'none',
										opacity : 0
									});
				} else {
					this.shim.addStyle({
						position : 'absolute',
						top : this.wh.top - this.nativeM.top + 'px',
						left : this.wh.left - this.nativeM.left + 'px',
						width : this.wh.width + 'px',
						height : this.wh.height + 'px',
						display : 'block'
					});
				}

			}
			if (this.isDrop) {
				this.dragElement.addStyle('opacity', 0.7);
				if (FL.ua.IE6) {
					this.shim.addStyle('opacity', 0);
				}
				// Mutationイベント未実装のため、ここで再検索
				this.dropElement = DOM.className(this.opt.dropClass);
			};

			// position:fixedはスクロール量を考慮する
			sc = (this.pos === 'fixed')
					? this.FL.ut.getScrollPosition()
					: { x : 0, y : 0 };

			this.initPoint = {
				x : this.dragElement.readStyle('left', true),
				y : this.dragElement.readStyle('top', true)
			};
			this.start = {
				x : (this.pos === 'fixed') ? ev.clientX : ev.pageX,
				y : (this.pos === 'fixed') ? ev.clientY : ev.pageY
			};
			// mouemoveセット
			this.FL.event.set(doc, 'mousemove', (this.isDrop === false) ? this.dragging : this.dropFunc, this);
			// mouseupセット
			this.FL.event.set(doc, 'mouseup', this.dragEnd, this);
		},
		// 通常のドラッグ監視メソッド
		dragging : function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			// ドラッグ中の座標補正
			var stopFlag = false,
				top,
				left,
				current,
				sc;

			if (this.opt.mask !== null) {
				stopFlag = (FL.ut.inRect(this.dragElement, DOM(this.opt.mask))) ? false : true;
				(stopFlag === true) && this.restore();
			};
			if (FL.ut.isFunction(this.opt.judgeFunc)) {
				if (this.opt.judgeFunc() === false) {
					stopFlag = true;
				}
			};

			if (ev.pageY < 0 || ev.pageX < 0) {
				stopFlag = true;
			}
			// position:fixedはスクロール量を考慮する
			current = {
				x : (this.pos === 'fixed') ? ev.clientX : ev.pageX,
				y : (this.pos === 'fixed') ? ev.clientY : ev.pageY
			};

			if (stopFlag === false) {
				sc = (this.pos === 'fixed')
						? FL.ut.getScrollPosition()
						: { x : 0, y : 0 };

				this.dragElement.addStyle({
					left : this.initPoint.x + (current.x - this.start.x) + 'px',
					top : this.initPoint.y + (current.y - this.start.y) + 'px'
				});
				if (FL.ua.IE6) {
					this.shim.addStyle({
						top : ev.pageY - this.offset.y + 'px',
						left : ev.pageX - this.offset.x + 'px'
					});
				}
			}
		},
		// ドロップを行うメソッド
		dropFunc : function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			// ドラッグ中の座標補正
			var stopFlag = false,
				sc,
				current,
				that = this,
				currentFlag = false,
				mouse = { x: ev.pageX, y : ev.pageY };

			if (this.opt.mask != null) {
				stopFlag = (FL.ut.inRect(this.dragElement, DOM(this.opt.mask))) ? false : true;
				(stopFlag === true) && this.restore();
			};
			if (FL.ut.isFunction(this.opt.judgeFunc)) {
				if (this.opt.judgeFunc() === false) stopFlag = true;
			};
			if (ev.pageY - this.offset.y <= 0) {
				this.dragElement.addStyle('top', '0px');
				stopFlag = true;
			};
			if (ev.pageX - this.offset.x <= 0) {
				this.dragElement.addStyle('left', '0px');
				stopFlag = true;
			}
			// drop要素切り替え
			this.dropElement.foreach(function(num) {
				if (FL.ut.mouseInRect(mouse, this) === true
						&& currentFlag === false
						&& that.nativeElement.get() !== this
						&& this !== that.dragElement.get()) {
					that.setDropTarget(this);
					currentFlag = true;
					return false;
				} else {
					DOM(this).removeClass(that.opt.dropActiveClass);
				};
			});

			if (currentFlag === false) {
				this.dropTarget = null;
			}
			if (stopFlag === true) {
				this.dragEnd();
			} else {
				current = {
					x : (this.pos === 'fixed') ? ev.clientX : ev.pageX,
					y : (this.pos === 'fixed') ? ev.clientY : ev.pageY
				};
				sc = (this.pos === 'fixed')
						? FL.ut.getScrollPosition()
						: { x : 0, y : 0 };

				this.dragElement.addStyle({
					left : this.initPoint.x + (current.x - this.start.x) + 'px',
					top : this.initPoint.y + (current.y - this.start.y) + 'px'
				});
				if (FL.ua.IE6) {
					this.shim.addStyle({
						top : ev.pageY - this.offset.y - this.nativeM.top + 'px',
						left : ev.pageX - this.offset.x - this.nativeM.left + 'px'
					});
				}
			}
		},
		setDropTarget : function(elm) {
			var e = DOM(elm).addClass(this.opt.dropActiveClass);

			this.dropTarget = e;
		},
		dragEnd : function(ev) {
			ev && ev.preventDefault();
			ev && ev.stopPropagation();
			var that = this;

			(this.isDrop === true)
				? this.FL.event.remove(doc, 'mousemove', this.dropFunc)
				: this.FL.event.remove(doc, 'mousemove', this.dragging);

			this.FL.event.remove(doc, 'mouseup', this.dragEnd);
			// ドラッグ終了
			if (this.isDrop === true
					&& this.dropTarget != null
					&& this.dropTarget != this.currentInner) {

				// drop開始
				this.dropElement.foreach(function(){
					DOM(this).removeClass(that.opt.dropActiveClass);
				});
				this.currentInner = this.dropTarget;
				this.reset();
			}else {
				if (this.isDrop === false) {
					this.wh = this.dragElement.absDimension();
				}
				if (this.opt.returnDefault === true) {
					Animation.pile(
						this.dragElement,
						{
							target : this.nativeElement,
							__useClone : false,
							speed : 0.6,
							easing : 100,
							callback : function() {
								that.reset();
							}
						}
					);
				} else {
					this.reset();
				}
			};
			this.isDragSet = false;

		},
		restore : function() {
			//maskエレメントを超えた場合の補正
			var mask = DOM(this.opt.mask).absDimension(),
				d = this.dragElement.absDimension();

			if (d.top <= mask.top) {
				this.dragElement.addStyle('top', mask.top + 1 + 'px');
			} else if (d.left <= mask.left) {
				this.dragElement.addStyle('left', mask.left + 1 + 'px');
			} else if (d.bottom >= mask.bottom) {
				this.dragElement.addStyle('top', (mask.bottom - d.height - 1) + 'px');
			} else if (d.right >= mask.right) {
				this.dragElement.addStyle('left', (mask.right - d.width - 1) + 'px');
			}
		},
		stop : function() {
			// ユーザーからの任意のタイミングでのドラッグ中止
			this.dragEnd();
		},
		start : function() {
			// ユーザーからの任意のタイミングでのドラッグスタート
			this.setDrag();
		},
		isStop : function() {
			return (this.isDragSet) ? false : true;
		},
		reset : function() {
			// 要素を元の位置に戻し、パラメータを初期化
			var dim = this.dragElement.absDimension(),
				m = this.nativeM;

			if (this.isDrop) {
				if (this.dropTarget) {
					this.dropTarget.removeClass(this.opt.dropActiveClass);
				}
				if (this.FL.ut.isFunction(this.opt.callback)) {
					this.opt.callback.call(this.handle.get(), this.currentInner ? this.currentInner.get() : null);
				}
				this.dragElement.remove();
				this.dragElement = null;
				this.nativeElement.addStyle('visibility', 'visible');
				this.FL.event.set(this.handle.get(), 'mousedown', this.dragInit, this);
				this.dropTarget = null;
			} else {
				this.FL.event.set(this.handle.get(), 'mousedown', this.dragInit, this);
				if (this.FL.ut.isFunction(this.opt.callback)) {
					this.opt.callback.call(this.dragElement.get());
				}
			}
			if (FL.ua.IE6) {
				this.shim.hide();
			}
			this.wh = dim;
		}
	};

	UI.dragDrop.prototype.addDropTarget = function(e) {
		this.dropElement.nodeList.push(DOM(e).get());
	};

	// UI.resizable.prototype
	UI.resizable.prototype = {
		setDrag : function() {
			this.FL.event.set(this.mark.get(), 'mousedown', this.dragInit, this);
		},
		dragInit : function(ev) {
			ev.preventDefault();
			this.FL.event.remove(this.mark.get(), 'mousedown', this.dragInit);
			// drag初期化
			this.offset = {
				x : ev.pageX,
				y : ev.pageY
			};
			this.FL.event.set(doc, 'mousemove', this.resize, this);
			this.FL.event.set(this.mark.get(), 'mouseup', this.dragEnd, this);
		},
		resize : function(ev) {
			ev.preventDefault();
			var w = this.wh.width + (ev.pageX - this.offset.x),
				h = this.wh.height + (ev.pageY - this.offset.y),
				dh;

			if (w <= 30 || h <= 30 || ev.pageX < 0 || ev.pageY < 0) {
				this.restore(w, h);
				this.dragEnd();
			}
			this.nativeElement.addStyle({
				width : w + 'px',
				height : h + 'px'
			});
			dh = this.nativeElement.absDimension();
			this.mark.addStyle({
				top : dh.bottom - 10 + 'px',
				left : dh.right - 10 + 'px'
			});
		},
		restore : function(w, h) {
			if (w <= 30) {
				this.nativeElement.addStyle('width', '31px');
			}
			if (h <= 30) {
				this.nativeElement.addStyle('height', '31px');
			};
		},
		dragEnd : function(ev) {
			ev && ev.preventDefault();
			this.FL.event.remove(doc, 'mousemove', this.rsize);
			this.FL.event.remove(this.mark.get(), 'mouseup', this.dragEnd);
			this.wh = this.nativeElement.absDimension();
			this.FL.event.set(this.mark.get(), 'mousedown', this.dragInit, this);
		}
	};
	// extends to Element and Element List
	ClassExtend('element', {
		draggable  : function(opt) { new UI.draggable(this, opt);},
		dragDrop   : function(opt) { new UI.dragDrop(this, opt);},
		slider     : function(opt) { new UI.slider(this, opt);},
		resizable  : function(opt) { new UI.resizable(this, opt);},
		scroll     : function(callback) { new UI.scroll(this, callback);},
		selectable : function(opt) { return new UI.selectable(this, opt);}
	});
	ClassExtend('elementlist', {
		sortable : function(opt){ new UI.sortable(opt, this);}
	});
	Module.attach(UI);
	// send message to Core prepared
	Module.onReady('ui');
})();
