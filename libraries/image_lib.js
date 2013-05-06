/**
* Flint.js image_lib library
* @package Core
* @implementation
*   thickbox, lightbox, highslide
* @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
*/

ClassExtend('Library', function image_lib() {

	// create Core API in this scope
	var FL = getInstance(), DOM = FL.DOM, Animation = FL.Animation;

	// shortcut alias
	var doc = document, win = window;

	// global padding
	var globalPadding = 15;

	// stack elements
	var stack = {
		thickbox : null, lighbox : null, milkbox : null, slbox : null
	};
	var BoxStack = {};
	
	// Can you use canvas?
	var IS_CANVAS = !!win.CanvasRenderingContext2D;

	// load layermodule, css
	FL.load.module('layer');
	FL.load.css('image_lib');

	// method attach
	FL.union(this, {
		thickbox : function(xNode) { return new ThickBox(xNode); },
		lightbox : function(xNode) { return new LightBox(xNode); },
		milkbox : function(xNode) { return new MilkBox(xNode); },
		slbox : function(xNode) { return new SLBox(xNode); },
		//highslide : function(xNode) { return new HighSlide(xNode); },
		rotate : function(deg) { return new Rotate(deg || 90); },
		flipH : function() { return new FlipH(); },
		flipV : function() { return new FlipV(); }
	});

	/* ===================== common functions ========================= */

	// get targets
	var getElements = function(cl) {
		if (!stack[cl]) { stack[cl] = DOM('a.' + cl);}
		return stack[cl];
	}

	// create corner
	var createCorner = function(type, colorCode, padding) {
		var rect, ctx, g = padding || globalPadding, posStr, color = colorCode || '#ffffff', posStrVML;

		switch (type) {
		case 'lt': posStr = 'top:0px;left:0px;'; posStrVML = 'top:0px;left:0px;'; break;
		case 'rt': posStr = 'top:0px;right:0px;'; posStrVML = 'top:0px;left:' + -g + 'px;'; break;
		case 'lb': posStr = 'bottom:0px;left:0px;'; posStrVML = 'top:' + -g + 'px;left:0px;'; break;
		case 'rb': posStr = 'bottom:0px;right:0px;';posStrVML = 'top:' + -g + 'px;left:' + -g + 'px;'; break;
		}
//		// IE8, draw VML
//		if (FL.ua.IE8) {
//			// create corner by VML
//			rect = ['<div style="position:absolute;width:15px;height:15px;z-index:5001;overflow:hidden;' + posStr + '">'];
////			rect = ['<div style="position:absolute;width:15px;height:15px;z-index:5001;overflow:hidden;top:0px;left:0px;">'];
//			rect.push('<v:roundrect arcsize="0.5" fillcolor="' + color + '" stroke="0" strokecolor="white" strokeweight="0pt" style="z-index:2;position:absolute;visibility:visible;width:' + g * 2 + 'px;height:' + g * 2 + 'px;' + posStrVML + '" />');
//			rect.push('</div>');
//			return rect.join('');
//		} else 
		if (FL.ua.IE6) {
		// else if IE6, draw png image filter
			return (['<div style="position:absolute;width:', g, 'px;height:', g, 'px;filter:', FL.ut.makeFilter('png', FL.config.appPath() + 'fl_images/image_lib/radius/' + type + '_ie67.png'), ';', posStr, '"></div>']).join('');

		} else if (FL.ua.IE7 || FL.ua.IE8) {
		// else if IE7-8, draw png image
			return (['<img src="', FL.config.appPath() + 'fl_images/image_lib/radius/' + type + '_ie67.png"', 'style="width:', g, 'px;height:', g, 'px;position:absolute;', posStr, '" />']).join('');
		} else {
		// else, modarn browser, draw Canvas

			// else browser, create radius by Canvas
			var canvas = DOM.create('canvas').attr({width : g, height : g});
			switch (type) {
			case 'lt': canvas.addStyle({top : '0px', left : '0px'});break;
			case 'rt': canvas.addStyle({top : '0px', right : '0px'});break;
			case 'lb': canvas.addStyle({bottom : '0px', left : '0px'});break;
			case 'rb': canvas.addStyle({bottom : '0px', right : '0px'});break;
			}
			roundCanvas[type.toUpperCase()](canvas.get(), g, color);
			return canvas.get();
		}
	}

	// roudCanvas
	var roundCanvas = {
		LT : function(cv, g, colorCode) {
			var ctx, color = colorCode || '#ffffff';

			ctx = cv.getContext('2d');
			ctx.fillStyle = color;
			ctx.strokeStyle =color;
			ctx.beginPath();
			ctx.moveTo(0, g);
			ctx.quadraticCurveTo(0, 0, g, 0);
			ctx.lineTo(g, g);
			ctx.lineTo(0, g);
			ctx.closePath();
			ctx.fill();
		},
		LB : function(cv, g, colorCode) {
			var ctx, g = globalPadding, color = colorCode || '#ffffff';

			ctx = cv.getContext('2d');
			ctx.fillStyle = color;
			ctx.strokeStyle =color;
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.quadraticCurveTo(0, g, g, g);
			ctx.lineTo(g, 0);
			ctx.lineTo(0, 0);
			ctx.closePath();
			ctx.fill();
		},
		RT : function(cv, g, colorCode) {
			var ctx, g = globalPadding, color = colorCode || '#ffffff';

			ctx = cv.getContext('2d');
			ctx.fillStyle = color;
			ctx.strokeStyle =color;
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.quadraticCurveTo(g, 0, g, g);
			ctx.lineTo(0, g);
			ctx.lineTo(0, 0);
			ctx.closePath();
			ctx.fill();
		},
		RB : function(cv, g, colorCode) {
			var ctx, g = globalPadding, color = colorCode || '#ffffff';

			ctx = cv.getContext('2d');
			ctx.fillStyle = color;
			ctx.strokeStyle =color;
			ctx.beginPath();
			ctx.moveTo(g, 0);
			ctx.quadraticCurveTo(g, g, 0, g);
			ctx.lineTo(0, 0);
			ctx.lineTo(g, 0);
			ctx.closePath();
			ctx.fill();
		}
	};


	/* ====================== Thickbox Class =========================== */

	function ThickBox(xNode) {
		var groups = {}, that = this;

		this.box = null; this.padding = 15; this.captionHeight = 80;
		this.layer = new Module.layer();
		this.layer.setOpacity(0.75);
		this.elements = xNode || getElements('thickbox');
		this.elements.foreach(function() {
			if (this.rel) {
				if (this.rel in groups) {
					groups[this.rel].push(this);
					DOM(this).prop('__th_group', groups[this.rel].length);
				} else {
					groups[this.rel] = [this];
					DOM(this).prop('__th_group', 1);
				}
			}
			// attach Event
			DOM(this).event('click', that.doThickBox, that);
		});
		this.groups = groups;
	};

	ThickBox.prototype = {
		createBox : function() {
			if ('thickbox' in BoxStack) {
				this.box = BoxStack['thickbox'];
			} else {
				var div = DOM.create('div').addClass('fl_thickbox_clone').hide(), html;

				html = [
				        '<div class="fl_thickbox_frame_header">',
				        	'<div class="fl_thickbox_frame_header_bar">&nbsp;</div>',
				        '</div>',
				        '<div class="fl_thickbox_body">',
				        	'<div id="fl_thickbox_image"></div>',
				        '</div>',
				        '<div class="fl_thickbox_caption">',
				        	'<div id="fl_thickbox_caption_title">&nbsp;</div>',
				        	'<div id="fl_thickbox_caption_close"><a href="javascript:void(0)">close</a>&nbsp;or&nbsp;Esc&nbsp;Key</div>',
				        '</div>',
				        '<div class="fl_thickbox_frame_footer">',
				        	'<div class="fl_thickbox_frame_footer_bar">&nbsp;</div>',
				        '</div>',
				        ];
				this.box = div.html(html.join('')).appendTo(win.IEFIX ? IEFIX.body : doc.body).hide().addStyle('position', 'fixed')
				BoxStack['thickbox'] = this.box;
			}
			this.closeLink = this.box.getOne('#fl_thickbox_caption_close a');
			this.titleArea = DOM.id('fl_thickbox_caption_title');
			// set prev-next event
			FL.event.exprLive('a#fl_th_prev', 'click', this.prevBox, this);
			FL.event.exprLive('a#fl_th_next', 'click', this.nextBox, this);
		},
		doThickBox : function(ev) {
			ev.preventDefault(); ev.stopPropagation();
			var img = new Image, e = ev.currentTarget, ttl = e.title || '';

			if ( !(/.+\.gif$|.+\.jp[e]?g$|.+\.png$/.test(e.href)) ) return;
			this.layer.showLoading('fl_thickbox_loading');
			this.layer.show();
			if (!this.box) { this.createBox();}

			FL.event.once(img, 'load', function() {
				this.layer.hideLoading('fl_thickbox_loading');

				this.__viewBox(img, ttl, e);
				// attach close event
				FL.event.set(this.closeLink, 'click', this.closeBox, this);
				FL.event.set(this.layer.getLayerObject(), 'click', this.closeBox, this);
				FL.event.set(doc, 'keydown', this.closeBoxOnKey, this);
			}, this);
			img.src = e.href;
		},
		__viewBox : function(img, ttl, e) {
			var wh = FL.image.getDefaultSize(img), center = FL.ut.getCenterPosition();
			this.setCaptionTitle(ttl, e);

			DOM.id('fl_thickbox_image').html('<img src="' + img.src + '" alt="" />');
			this.layer.hideLoading('fl_thickbox_loading');
			this.box.addStyle({
				width : wh.width + this.padding * 2 + 'px',
				height : wh.height + this.padding + this.captionHeight + 'px',
				marginTop : - (wh.height + this.captionHeight) / 2 + 'px',
				marginLeft : - wh.width / 2 + 'px'
			}).show();
		},
		setCaptionTitle : function(ttl, e) {
			var html = [ttl], g, elm = DOM(e), p = elm.prop('__th_group');

			// detect group
			if (p) {
				// grouped box
				g = this.groups[e.rel];
				html.push('<p class="fl_th_paginate">Image&nbsp;' + p + '&nbsp;of&nbsp;' + g.length);
				if (p > 1) {
					html.push('<a href="javascript:void(0)" id="fl_th_prev" rel="' + e.rel + '" order="' + p + '">&laquo;Prev</a>');
				}
				if (p < g.length) {
					html.push('<a href="javascript:void(0)" id="fl_th_next" rel="' + e.rel + '" order="' + p + '">Next&raquo;</a>');
				}
				html.push('</p>');
			}
			this.titleArea.html(html.join(''));
		},
		prevBox : function(ev) {
			var e = this.groups[ev.target.rel][DOM(ev.target).readAttr('order') - 2],
				img = new Image,
				ttl = e.title || '';

			ev.preventDefault(); ev.stopPropagation();
			if ( !(/.+\.gif$|.+\.jp[e]?g$|.+\.png$/.test(e.href)) ) return;
			this.layer.showLoading('fl_thickbox_loading');
			this.box.hide();
			FL.event.once(img, 'load', function() {
				this.__viewBox(img, ttl, e);
			}, this);
			img.src = e.href;
		},
		nextBox : function(ev) {
			var e = this.groups[ev.target.rel][DOM(ev.target).readAttr('order')],
				img = new Image,
				ttl = e.title || '';

			ev.preventDefault(); ev.stopPropagation();
			if (!(/.+\.gif$|.+\.jp[e]?g$|.+\.png$/.test(e.href)) ) {
				return;
			}
			this.layer.showLoading('fl_thickbox_loading');
			if (!this.box) { this.createBox();}
			FL.event.once(img, 'load', function() {
				this.__viewBox(img, ttl, e);
			}, this);
			img.src = e.href;
		},
		closeBox : function(ev) {
			this.box.hide();
			this.layer.hide();
			this.__removeEvents();
		},
		closeBoxOnKey : function(ev) {
			if (ev.keyCode == 27) { // Esc key
				this.box.hide();
				this.layer.hide();
				this.__removeEvents();
			}
		},
		__removeEvents : function() {
			FL.event.remove(this.layer.getLayerObject(), 'click', this.closeBox);
			FL.event.remove(this.closeLink, 'click', this.closeBox);
			FL.event.remove(doc, 'keydown', this.closeBoxOnKey);
		}
	};

	/* ====================== Lightbox Class =========================== */

	function LightBox() {
		var groups = {}, that = this;

		this.box = null; this.padding = 15; this.captionHeight = 50;
		this.layer = new Module.layer();
		this.layer.setOpacity(0.75);
		this.elements = getElements('lightbox');
		this.elements.foreach(function() {
			if (this.rel) {
				if (this.rel in groups) {
					groups[this.rel].push(this);
					DOM(this).prop('__lg_group', groups[this.rel].length);
				} else {
					groups[this.rel] = [this];
					DOM(this).prop('__lg_group', 1);
				}
			}
			// attach Event
			DOM(this).event('click', that.doLightBox, that);
		});
		this.groups = groups;
		if (!this.box) { this.createBox();}
	};

	LightBox.prototype = {
			createBox : function(second) {
				if ('lightbox' in BoxStack) {
					this.box = BoxStack['lightbox'];
				} else {
					var div = DOM.create('div').addClass('fl_lightbox_clone'), html;

					html = [
					        '<div class="fl_lightbox_frame_header">',
					        	'<div id="fl_lightbox_corner_lt"></div>',
					        	'<div class="fl_lightbox_frame_header_bar">&nbsp;</div>',
					        	'<div id="fl_lightbox_corner_rt"></div>',
					        '</div>',
					        '<div id="fl_lightbox_body" class="fl_lightbox_loading">',
					        	'<div id="fl_lightbox_correct_l"></div>',
					        	'<div id="fl_lightbox_image"></div>',
					        	'<div id="fl_lightbox_correct_r"></div>',
					        '</div>',
					        '<div class="fl_lightbox_caption">',
					        	'<div id="fl_lightbox_caption_title">&nbsp;</div>',
					        	'<div id="fl_lightbox_caption_close"><a href="javascript:void(0)">close</a>&nbsp;or&nbsp;Esc&nbsp;Key</div>',
					        	'<div id="fl_lightbox_correct_c"></div>',
					        '</div>',
					        '<div class="fl_lightbox_frame_footer">',
					        '<div id="fl_lightbox_corner_lb"></div>',
					        	'<div class="fl_lightbox_frame_footer_bar">&nbsp;</div>',
					        	'<div id="fl_lightbox_corner_rb"></div>',
					        '</div>',
					        ];
					this.box = div.html(html.join('')).appendTo(doc.body).addStyle('position', 'fixed').hide();

					BoxStack['lightbox'] = this.box;
				}
				this.closeLink = this.box.getOne('#fl_lightbox_caption_close a');
				this.titleArea = DOM.id('fl_lightbox_caption_title');
				this.captionArea = this.box.getOne('div.fl_lightbox_caption');
				if (!second || !FL.ua.IE6) {
					this.captionArea.addStyle('height', '0px').hide();
				}
				// set prev-next event
				FL.event.exprLive('a#fl_lb_prev', 'click', this.prevBox, this);
				FL.event.exprLive('a#fl_lb_next', 'click', this.nextBox, this);
			},
			__boxInitialize : function() {

				this.box.addStyle({
					width : 100+ 'px',
					height : 80 + 'px',
					marginTop : -80 /*- this.padding *2*/ + 'px',
					marginLeft : - 50 /*- this.padding * 2*/ + 'px'
				}).show();
				this.captionArea.addStyle('height', '0px');
				DOM.id('fl_lightbox_image').html('');
			},
			doLightBox : function(ev) {
				ev.preventDefault(); ev.stopPropagation();
				var img = new Image, e = ev.currentTarget, ttl = e.title || '';

				if (!(/.+\.gif$|.+\.jp[e]?g$|.+\.png$/.test(e.href))) {
					return;
				}
				this.layer.show();
				this.__boxInitialize();
				
				FL.event.once(img, 'load', function() {
					this.__viewBox(img, ttl, e);
					// attach close event
					FL.event.set(this.closeLink, 'click', this.closeBox, this);
					FL.event.set(this.layer.getLayerObject(), 'click', this.closeBox, this);
					FL.event.set(doc, 'keydown', this.closeBoxOnKey, this);
				}, this);
				img.src = e.href;
			},
			__viewBox : function(img, ttl, e) {

				var wh = FL.image.getDefaultSize(img), that = this;
					//center = this.__getTagetCenter(wh);
				this.setCaptionTitle(ttl, e);

				// set corner radius
				// IE returns VML string, else,browser returns Canvas element
				DOM.id('fl_lightbox_corner_lt')[!IS_CANVAS ? 'html' : 'append'](createCorner('lt'));
				DOM.id('fl_lightbox_corner_rt')[!IS_CANVAS ? 'html' : 'append'](createCorner('rt'));
				DOM.id('fl_lightbox_corner_lb')[!IS_CANVAS ? 'html' : 'append'](createCorner('lb'));
				DOM.id('fl_lightbox_corner_rb')[!IS_CANVAS ? 'html' : 'append'](createCorner('rb'));

				DOM.id('fl_lightbox_image').html('<img src="' + img.src + '" alt="" style="display:none" />');
				if (FL.ua.IE6) { this.captionArea.hide();}

				setTimeout(function() {
					Animation.centerize(that.box, {targetWidth : wh.width + that.padding * 2, speed : 20, easing : 30, offsetY: that.padding * 2, callback : function() {
						setTimeout(
								function() {
									Animation.centerize(that.box, {targetHeight : wh.height, speed : 20, easing : 30, offsetY : that.padding * 2, callback : function() {
										DOM.id('fl_lightbox_image').first().animate('appear', {speed : 15, callback : function() {
											that.captionArea.show();
											new Animation(that.captionArea, {height : 30}, {speed : 10});
										}});
									}});
								}, 200);
					}});
				}, 500);
			},
			setCaptionTitle : function(ttl, e) {
				var html = [ttl], g, elm = DOM(e), p = elm.prop('__lg_group');
				// detect gourp

				if (p) {
					// grouped box
					g = this.groups[e.rel];
					html.push('<p class="fl_th_paginate">Image&nbsp;' + p + '&nbsp;of&nbsp;' + g.length);
					if (p > 1) {
						html.push('<a href="javascript:void(0)" id="fl_lb_prev" rel="' + e.rel + '" order="' + p + '">&laquo;Prev</a>');
					}
					if (p < g.length) {
						html.push('<a href="javascript:void(0)" id="fl_lb_next" rel="' + e.rel + '" order="' + p + '">Next&raquo;</a>');
					}
					html.push('</p>');
				}
				this.titleArea.html(html.join(''));
			},
			prevBox : function(ev) {
				var e = this.groups[ev.target.rel][DOM(ev.target).readAttr('order') - 2],
					img = new Image,
					ttl = e.title || '';
				ev.preventDefault(); ev.stopPropagation();

				if ( !(/.+\.gif$|.+\.jp[e]?g$|.+\.png$/.test(e.href)) ) return;
				this.captionArea.addStyle('height', '0px');
				DOM.id('fl_lightbox_image').html('');
				FL.event.once(img, 'load', function() {
					this.__viewBox(img, ttl, e);
				}, this);
				img.src = e.href;
			},
			nextBox : function(ev) {
				var e = this.groups[ev.target.rel][DOM(ev.target).readAttr('order')],
					img = new Image,
					ttl = e.title || '';

				ev.preventDefault(); ev.stopPropagation();
				if ( !(/.+\.gif$|.+\.jp[e]?g$|.+\.png$/.test(e.href)) ) return;
				this.captionArea.addStyle('height', '0px');
				DOM.id('fl_lightbox_image').html('');
				FL.event.once(img, 'load', function() {
					this.__viewBox(img, ttl, e);
				}, this);
				img.src = e.href;
			},
			closeBox : function(ev) {
				this.box.hide();
				this.layer.hide();
				this.__removeEvents();
			},
			closeBoxOnKey : function(ev) {
				if (ev.keyCode == 27) {
					this.box.hide();
					this.layer.hide();
					this.__removeEvents();
				}
			},
			__removeEvents : function() {
				FL.event.remove(this.layer.getLayerObject(), 'click', this.closeBox);
				FL.event.remove(this.closeLink, 'click', this.closeBox);
				FL.event.remove(doc, 'keydown', this.closeBoxOnKey);
			}
		};

	/* ====================== Milkbox Class =========================== */

	function MilkBox() {
		var groups = {}, that = this;

		this.box = null; this.padding = 15; this.captionHeight = 50;
		this.layer = new Module.layer();
		this.layer.setOpacity(0.75);
		this.elements = getElements('milkbox');
		this.elements.foreach(function() {
			if (this.rel) {
				if (this.rel in groups) {
					groups[this.rel].push(this);
					DOM(this).prop('__mk_group', groups[this.rel].length);
				} else {
					groups[this.rel] = [this];
					DOM(this).prop('__mk_group', 1);
				}
			}
			// attach Event
			DOM(this).event('click', that.doMilkBox, that);
		});
		this.groups = groups;
		this.createBox();
	};

	MilkBox.prototype = {
			createBox : function() {
				if ('milkbox' in BoxStack) {
					this.box = BoxStack['milkbox'];
				} else {
					var div = DOM.create('div').addClass('fl_milkbox_clone').hide(), html;

					html = [
					        '<div class="fl_milkbox_frame_header">',
					        	'<div id="fl_milkbox_corner_lt"></div>',
					        	'<div class="fl_milkbox_frame_header_bar">&nbsp;</div>',
					        	'<div id="fl_milkbox_corner_rt"></div>',
					        '</div>',
					        '<div id="fl_milkbox_body" class="fl_milkbox_loading">',
					        	'<div id="fl_milkbox_image"></div>',
					        '</div>',
					        '<div class="fl_milkbox_caption">',
					        	'<div id="fl_milkbox_caption_title">&nbsp;</div>',
					        	'<div id="fl_milkbox_caption_close"><a href="javascript:void(0)">close</a>&nbsp;or&nbsp;Esc&nbsp;Key</div>',
					        '</div>',
					        '<div class="fl_milkbox_frame_footer">',
					        '<div id="fl_milkbox_corner_lb"></div>',
					        	'<div class="fl_milkbox_frame_footer_bar">&nbsp;</div>',
					        	'<div id="fl_milkbox_corner_rb"></div>',
					        '</div>',
					        ];
					this.box = div.appendTo(win.IEFIX ? IEFIX.body : doc.body).html(html.join('')).addStyle('position', 'fixed');
					BoxStack['milkbox'] = this.box;
				}
				this.closeLink = this.box.getOne('#fl_milkbox_caption_close a');
				this.titleArea = DOM.id('fl_milkbox_caption_title');
				this.captionArea = this.box.getOne('div.fl_milkbox_caption');
				// set prev-next event
				FL.event.exprLive('a#fl_mk_prev', 'click', this.prevBox, this);
				FL.event.exprLive('a#fl_mk_next', 'click', this.nextBox, this);
			},
			__boxInitialize : function() {
				this.box.addStyle({
					width : 100+ 'px',
					height : 80 + 'px',
					marginTop : -40 + 'px',
					marginLeft : - 50 + 'px'
				}).show();
				this.captionArea.addStyle('height', '0px');
				DOM.id('fl_milkbox_image').html('');
			},
			doMilkBox : function(ev) {
				ev.preventDefault(); ev.stopPropagation();
				var img = new Image, e = ev.currentTarget, ttl = e.title || '';

				if ( !(/.+\.gif$|.+\.jp[e]?g$|.+\.png$/.test(e.href)) ) return;
				this.layer.show();
				this.__boxInitialize();
				FL.event.once(img, 'load', function() {
					this.__viewBox(img, ttl, e);
					// attach close event
					FL.event.set(this.closeLink, 'click', this.closeBox, this);
					FL.event.set(this.layer.getLayerObject(), 'click', this.closeBox, this);
					FL.event.set(doc, 'keydown', this.closeBoxOnKey, this);
				}, this);
				img.src = e.href;
			},
			__viewBox : function(img, ttl, e) {
				var wh = FL.image.getDefaultSize(img), that = this;
					//center = this.__getTagetCenter(wh);
				this.setCaptionTitle(ttl, e);

				// set corner radius
				DOM.id('fl_milkbox_corner_lt')[!IS_CANVAS ? 'html' : 'append'](createCorner('lt'));
				DOM.id('fl_milkbox_corner_rt')[!IS_CANVAS ? 'html' : 'append'](createCorner('rt'));
				DOM.id('fl_milkbox_corner_lb')[!IS_CANVAS ? 'html' : 'append'](createCorner('lb'));
				DOM.id('fl_milkbox_corner_rb')[!IS_CANVAS ? 'html' : 'append'](createCorner('rb'));

				DOM.id('fl_milkbox_image').html('<img src="' + img.src + '" alt="" style="display:none" />');
				Animation.centerize(this.box, {targetWidth : wh.width + this.padding * 2, targetHeight : wh.height, offsetY : this.padding * 2, speed : 20, easing : 30, callback : function() {
					DOM.id('fl_milkbox_image').first().animate('appear', {speed : 15, callback : function() {
						new Animation(that.captionArea, {height : 60}, {speed : 20});
					}});
				}});
			},
			setCaptionTitle : function(ttl, e) {
				var html = [ttl], g, elm = DOM(e), p = elm.prop('__mk_group');
				// detect gourp
				if (p) {
					// grouped box
					g = this.groups[e.rel];
					html.push('<p class="fl_th_paginate">Image&nbsp;' + p + '&nbsp;of&nbsp;' + g.length);
					if (p > 1) {
						html.push('<a href="javascript:void(0)" id="fl_mk_prev" rel="' + e.rel + '" order="' + p + '">&laquo;Prev</a>');
					}
					if (p < g.length) {
						html.push('<a href="javascript:void(0)" id="fl_mk_next" rel="' + e.rel + '" order="' + p + '">Next&raquo;</a>');
					}
					html.push('</p>');
				}
				this.titleArea.html(html.join(''));
			},
			prevBox : function(ev) {
				var e = this.groups[ev.target.rel][DOM(ev.target).readAttr('order') - 2];
				ev.preventDefault(); ev.stopPropagation();
				var img = new Image, ttl = e.title || '';

				if ( !(/.+\.gif$|.+\.jp[e]?g$|.+\.png$/.test(e.href)) ) return;

				this.captionArea.addStyle('height', '0px');
				DOM.id('fl_milkbox_image').html('');
				FL.event.once(img, 'load', function() {
					this.__viewBox(img, ttl, e);
				}, this);
				img.src = e.href;
			},
			nextBox : function(ev) {
				var e = this.groups[ev.target.rel][DOM(ev.target).readAttr('order')];
				ev.preventDefault(); ev.stopPropagation();
				var img = new Image, ttl = e.title || '';

				if ( !(/.+\.gif$|.+\.jp[e]?g$|.+\.png$/.test(e.href)) ) return;
//				if (!this.box) { this.createBox();}
//				this.box.hide();
				this.captionArea.addStyle('height', '0px');
				DOM.id('fl_milkbox_image').html('');
				FL.event.once(img, 'load', function() {
					this.__viewBox(img, ttl, e);
				}, this);
				img.src = e.href;
			},
			closeBox : function(ev) {
				this.box.hide();
				this.layer.hide();
				this.__removeEvents();
			},
			closeBoxOnKey : function(ev) {
				if (ev.keyCode == 27) {
					this.box.hide();
					this.layer.hide();
					this.__removeEvents();
				}
			},
			__removeEvents : function() {
				FL.event.remove(this.layer.getLayerObject(), 'click', this.closeBox);
				FL.event.remove(this.closeLink, 'click', this.closeBox);
				FL.event.remove(doc, 'keydown', this.closeBoxOnKey);
			}
		};

	/* ====================== SexyLightBox Class =========================== */

	function SLBox() {
		var groups = {}, that = this;

		this.box = null; this.padding = 7; this.captionHeight = 50;
		this.layer = new Module.layer();
		this.layer.setOpacity(0.6);
		this.elements = getElements('slbox');
		this.elements.foreach(function() {
			if (this.rel) {
				if (this.rel in groups) {
					groups[this.rel].push(this);
					DOM(this).prop('__sl_group', groups[this.rel].length);
				} else {
					groups[this.rel] = [this];
					DOM(this).prop('__sl_group', 1);
				}
			}
			// attach Event
			DOM(this).event('click', that.doSLBox, that);
		});
		this.groups = groups;
		this.createBox();
		this.currentSize = {width : 0, height : 0};
		this.guardFlag = false;
	};

	SLBox.prototype = {
			createBox : function() {
				if ('slbox' in BoxStack) {
					this.box = BoxStack['slbox'];
				} else {
					var div = DOM.create('div').addClass('fl_slbox_clone').hide(), html;

					html = [
					             '<div id="fl_slbox_image_body">',
					             	'<div id="fl_slbox_main_image" class="fl_slbox_loading"></div>',
					             	'<div id="fl_slbox_lc"></div>',
					             	'<div id="fl_slbox_rc"></div>',
					             '</div>',
					             '<div class="fl_slbox_caption_area">',
				             		'<div id="fl_slbox_caption_titile"></div>',
				             		'<div id="fl_slbox_left_correct"></div>',
				             		'<div id="fl_slbox_right_correct"></div>',
				             	'</div>',
					             '<div class="fl_slbox_frame_header">',
					             	'<div id="fl_slbox_frame_lt"></div>',
					             	'<div id="fl_slbox_frame_head_bar"></div>',
					             	'<div id="fl_slbox_frame_rt"></div>',
					             	'<div id="fl_slbox_close"><a href="javascript:void(0)">&nbsp;</a></div>',
					             '</div>',
					             '<div id="fl_slbox_trans_body"></div>',
					             '<div class="fl_slbox_frame_footer">',
					             	'<div id="fl_slbox_frame_lb"></div>',
					             	'<div id="fl_slbox_frame_footer_bar"></div>',
					             	'<div id="fl_slbox_frame_rb"></div>',
					             '</div>'
					        ];
					this.box = div.appendTo(win.IEFIX ? IEFIX.body : doc.body).html(html.join('')).addStyle('position', 'fixed');
					BoxStack['slbox'] = this.box;
					if (FL.ua.IE6) {
						// close btn
						this.box.getOne('div#fl_slbox_close a').addStyle('filter', FL.ut.makeFilter('png', FL.config.appPath() + 'fl_images/image_lib/slbox/close.png', 'image'));
						// corners
						DOM.id('fl_slbox_frame_lt').addStyle('filter', FL.ut.makeFilter('png', FL.config.appPath() + 'fl_images/image_lib/slbox/black/lt_ie6.png'));
						DOM.id('fl_slbox_frame_rt').addStyle('filter', FL.ut.makeFilter('png', FL.config.appPath() + 'fl_images/image_lib/slbox/black/rt_ie6.png'));

						DOM.id('fl_slbox_frame_rb').append(
							DOM.create('div').addStyle({
								'filter' : FL.ut.makeFilter('png', FL.config.appPath() + 'fl_images/image_lib/slbox/black/rb_ie6.png'),
								width : '80px',
								height : '20px',
								position : 'absolute',
								top: '0px',
								right : '0px'
							})
						);
						DOM.id('fl_slbox_frame_lb').append(
							DOM.create('div').addStyle({
								'filter' : FL.ut.makeFilter('png', FL.config.appPath() + 'fl_images/image_lib/slbox/black/lb_ie6.png'),
								width : '20px',
								height : '20px',
								position : 'absolute',
								top: '0px',
								left : '0px'
							})
						);
					}
				}
				this.closeLink = this.box.getOne('div#fl_slbox_close a');
				this.titleArea = DOM.id('fl_slbox_caption_titile');
				this.captionArea = this.box.getOne('div.fl_slbox_caption_area');
				this.footerBar = this.box.getOne('div#fl_slbox_frame_footer_bar');
				this.headerBar = this.box.getOne('div#fl_slbox_frame_head_bar');
				// set prev-next event
				FL.event.exprLive('a#fl_sl_prev', 'click', this.prevBox, this);
				FL.event.exprLive('a#fl_sl_next', 'click', this.nextBox, this);
			},
			__boxInitialize : function() {
				this.box.addStyle({
					width : 500+ 'px',
					height : 300 + 'px',
					marginLeft : - 250 + 'px',
					marginTop : -1000 + 'px'
				}).show();
				this.titleArea.html('');
				DOM.id('fl_slbox_main_image').html('');
			},
			doSLBox : function(ev) {
				ev.preventDefault(); ev.stopPropagation();
				var img = new Image, e = ev.currentTarget, ttl = e.title || '', that = this, center = FL.ut.getCenterPosition(true);

				if ( !(/.+\.gif$|.+\.jp[e]?g$|.+\.png$/.test(e.href)) ) return;
				this.layer.show();
				this.__boxInitialize();
				FL.event.once(img, 'load', function() {
					this.footerBar.addStyle('width', img.width > 1000 ? '91%' : '89%');
					this.headerBar.addStyle('width', img.width > 1000 ? '91%' : '89%');
					
					new Animation(this.box, {marginTop : - 150 + 30}, {speed : 40, easing : 90, callback : function() {
						new Animation(that.box, {marginTop : - 150}, {speed : 30, easing : 10, callback : function() {
							setTimeout(function() {that.__viewBox(img, ttl, e, false)}, 100);
						}});
					}});
					// attach close event
					FL.event.set(this.closeLink, 'click', this.closeBox, this);
					FL.event.set(this.layer.getLayerObject(), 'click', this.closeBox, this);
					FL.event.set(doc, 'keydown', this.closeBoxOnKey, this);
				}, this);
				img.src = e.href;

			},
			__viewBox : function(img, ttl, e, first) {
				var wh = FL.image.getDefaultSize(img), that = this,
				cw = this.box.readStyle('width', true), ch = this.box.readStyle('height', true);

				this.setCaptionTitle(ttl, e);
				if (first) {
					Animation.centerize(this.box, {targetWidth : (this.currentSize.width > wh.width ? cw + 30 : cw - 30), targetHeight : (this.currentSize.height > wh.height ? ch + 30 : ch - 30), speed : 15, easing : 40, callback : function() {
						DOM.id('fl_slbox_main_image').html('<img src="' + img.src + '" alt="" style="display:none" />');
						Animation.centerize(that.box, {targetWidth : wh.width + that.padding * 2, targetHeight : wh.height + 70, speed : 40, easing : -50, callback : function() {
							DOM.id('fl_slbox_main_image').first().animate('appear', {speed : 30, callback : function() {
								that.currentSize = wh;
							}});
						}});
					}});
				} else {
					DOM.id('fl_slbox_main_image').html('<img src="' + img.src + '" alt="" style="display:none" />');
					Animation.centerize(that.box, {targetWidth : wh.width + that.padding * 2, targetHeight : wh.height + 70, speed : 40, easing : -50, callback : function() {
						DOM.id('fl_slbox_main_image').first().animate('appear', {speed : 30, callback : function() {
							that.currentSize = wh;
						}});
					}});
				}
			},
			setCaptionTitle : function(ttl, e) {
				var html = ['<span>', ttl, '</span>'], g, elm = DOM(e), p = elm.prop('__sl_group');
				// detect gourp
				if (p) {
					// grouped box
					g = this.groups[e.rel];
					html.push('<p class="fl_sl_paginate">Image&nbsp;' + p + '&nbsp;of&nbsp;' + g.length);
					if (p > 1) {
						html.push('<a href="javascript:void(0)" id="fl_sl_prev" rel="' + e.rel + '" order="' + p + '">&laquo;Prev</a>');
					}
					if (p < g.length) {
						html.push('<a href="javascript:void(0)" id="fl_sl_next" rel="' + e.rel + '" order="' + p + '">Next&raquo;</a>');
					}
					html.push('</p>');
				}
				this.titleArea.html(html.join(''));
			},
			prevBox : function(ev) {
				var e = this.groups[ev.target.rel][DOM(ev.target).readAttr('order') - 2],
					img = new Image, ttl = e.title || '';
				ev.preventDefault(); ev.stopPropagation();

				if ( !(/.+\.gif$|.+\.jp[e]?g$|.+\.png$/.test(e.href)) ) return;
				DOM.id('fl_slbox_main_image').html('');
				FL.event.once(img, 'load', function() {
					this.__viewBox(img, ttl, e, true);
				}, this);
				img.src = e.href;
			},
			nextBox : function(ev) {
				var e = this.groups[ev.target.rel][DOM(ev.target).readAttr('order')],
					img = new Image, ttl = e.title || '';
				ev.preventDefault(); ev.stopPropagation();

				if ( !(/.+\.gif$|.+\.jp[e]?g$|.+\.png$/.test(e.href)) ) return;
				DOM.id('fl_slbox_main_image').html('');
				FL.event.once(img, 'load', function() {
					this.__viewBox(img, ttl, e, true);
				}, this);
				img.src = e.href;
			},
			closeBox : function(ev) {
				this.box.hide();
				this.layer.hide();
				this.__removeEvents();
			},
			closeBoxOnKey : function(ev) {
				if (ev.keyCode == 27) {
					this.box.hide();
					this.layer.hide();
					this.__removeEvents();
				}
			},
			__removeEvents : function() {
				FL.event.remove(this.layer.getLayerObject(), 'click', this.closeBox);
				FL.event.remove(this.closeLink, 'click', this.closeBox);
				FL.event.remove(doc, 'keydown', this.closeBoxOnKey);
			}
		};
	
	/* ====================== HighSlide Class ========================== */
	
	/* ====================== Milkbox Class =========================== */

	function HighSlide() {
		var groups = {}, that = this;

		this.box = null; this.padding = 15; this.captionHeight = 50;
		this.elements = getElements('highslide');
		this.elements.foreach(function() {
			if (this.rel) {
				if (this.rel in groups) {
					groups[this.rel].push(this);
					DOM(this).prop('__hs_group', groups[this.rel].length);
				} else {
					groups[this.rel] = [this];
					DOM(this).prop('__hs_group', 1);
				}
			}
			// attach Event
			DOM(this).event('click', that.doHighSlide, that);
		});
		this.groups = groups;
		this.initWH = { w : 0, y : 0};
		this.createBox();
	};

	HighSlide.prototype = {
			createBox : function() {
				if ('highslide' in BoxStack) {
					this.box = BoxStack['highslide'];
				} else {
					var div = DOM.create('div').addClass('fl_highslide_clone').hide(), html;

					html = [
					        '<div class="fl_milkbox_frame_header">',
					        	'<div id="fl_highslide_corner_lt"></div>',
					        	'<div class="fl_highslide_frame_header_bar">&nbsp;</div>',
					        	'<div id="fl_highslide_corner_rt"></div>',
					        '</div>',
					        '<div id="fl_highslide_body" class="fl_highslide_loading">',
					        	'<div id="fl_highslide_image"></div>',
					        	'<a href="javascript:void(0)">&nbsp;</a>',
					        '</div>',
					        '<div class="fl_highslide_frame_footer">',
					        '<div id="fl_highslide_corner_lb"></div>',
					        	'<div class="fl_highslide_frame_footer_bar">&nbsp;</div>',
					        	'<div id="fl_highslide_corner_rb"></div>',
					        '</div>',
					        ];
					this.box = div.appendTo(win.IEFIX ? IEFIX.body : doc.body).html(html.join('')).addStyle('position', 'fixed');
					BoxStack['milkbox'] = this.box;
				}
				this.closeLink = this.box.getOne('#fl_highslide_body a');
				this.titleArea = DOM.id('fl_highslide_caption_title');
				this.captionArea = this.box.getOne('div.fl_highslide_caption');
				// set prev-next event
				FL.event.exprLive('a#fl_mk_prev', 'click', this.prevBox, this);
				FL.event.exprLive('a#fl_mk_next', 'click', this.nextBox, this);
			},
			__boxInitialize : function(img, a) {
				var dim = DOM(a).absDimension();
				
				this.box.addStyle({
					width : img.width + 20 + 'px',
					height : img.height + 20 + 'px',
					top : dim.top - 10 + 'px',
					left : dim.left - 10 + 'px'
				}).show();
				this.initWH = { w : img.width, h : img.height};
				DOM.id('fl_highslide_image').html('');
			},
			doHighSlide : function(ev) {
				ev.preventDefault(); ev.stopPropagation();
				var img = new Image, e = ev.currentTarget, im = DOM(e).first().get();

				if ( !(/.+\.gif$|.+\.jp[e]?g$|.+\.png$/.test(e.href)) ) return;
				this.__boxInitialize(im, e);
				FL.event.once(img, 'load', function() {
					this.__viewBox(img, ttl, e);
					// attach close event
					FL.event.set(this.closeLink, 'click', this.closeBox, this);
					FL.event.set(doc, 'keydown', this.closeBoxOnKey, this);
				}, this);
				img.src = e.href;
			},
			__viewBox : function(img, ttl, e) {
				var wh = FL.image.getDefaultSize(img), that = this;

				// set corner radius
				DOM.id('fl_highslide_corner_lt')[FL.ua.IE ? 'html' : 'append'](createCorner('lt'));
				DOM.id('fl_highslide_corner_rt')[FL.ua.IE ? 'html' : 'append'](createCorner('rt'));
				DOM.id('fl_highslide_corner_lb')[FL.ua.IE ? 'html' : 'append'](createCorner('lb'));
				DOM.id('fl_highslide_corner_rb')[FL.ua.IE ? 'html' : 'append'](createCorner('rb'));

				DOM.id('fl_highslide_image').html('<img src="' + img.src + '" alt="" style="display:none" />');
				Animation.centerize(this.box, {targetWidth : wh.width + this.padding * 2, targetHeight : wh.height, speed : 20, easing : 30, callback : function() {
					
				}});
			},
			closeBox : function(ev) {
				this.box.hide();
				this.layer.hide();
				this.__removeEvents();
			},
			closeBoxOnKey : function(ev) {
				if (ev.keyCode == 27) {
					this.box.hide();
					this.layer.hide();
					this.__removeEvents();
				}
			},
			__removeEvents : function() {
				FL.event.remove(this.layer.getLayerObject(), 'click', this.closeBox);
				FL.event.remove(this.closeLink, 'click', this.closeBox);
				FL.event.remove(doc, 'keydown', this.closeBoxOnKey);
			}
		};

	/* ====================== Ratation Class =========================== */

	function Rotate(deg) {
		this.deg = deg;
		this.rad = deg * Math.PI / 180;
		this.elements = DOM('img.rotate');
		this.__init();
	};

	Rotate.prototype = {
		__init : function() {
			var that = this;

			this.elements.foreach(function() {
				var div, img;
					// create wrapper
				img = DOM(this).addStyle('border', 'none');
				// if delete border, 10ms delay for re:rendaring
				setTimeout(function() {
					div = that.createWrapper(img);
					that['setRotateImage' + (FL.ua.IE ? 'VML' : 'Canvas')](div, img);
				}, 5);
			});
		},
		setAngle : function(deg) {
			this.deg = deg;
			this.rad = deg * Math.PI / 180;
		},
		createWrapper : function(img) {
			return DOM.create('div').appendTo().addStyle('position', 'absolute')
							.append(DOM.create((FL.ua.IE) ? 'div' : 'canvas'));
		},
		setRotateImageCanvas : function(wrap, img) {
			var c = wrap.first(), IMG = new Image, that = this,
				wh, py, w, h, maxL, dim = img.absDimension();

			FL.event.once(IMG, 'load', function() {
				wh = FL.image.getDefaultSize(IMG);
				w = wh.width; h = wh.height; maxL = Math.max(w, h) / 2;
				py = FL.ut.pythagorean(w, h, true);
				wrap.addStyle({
					top : dim.top - (py / 2 - maxL) + 'px',
					left : dim.left - (py / 2 - maxL) + 'px',
					width : py + 'px',
					height : py + 'px'
				});
				c.attr({width : py, height : py});
				ctx = c.getContext('2d');
				that.__rotateCanvas(IMG, ctx, w, h, py)
			}, this);
			IMG.src = img.invisible().get().src;
		},
		setRotateImageVML : function(wrap, img) {
			var c = wrap.first(), IMG = new Image, that = this,
				wh, py, w, h, maxL, dim = img.absDimension();

			FL.event.once(IMG, 'load', function() {

				wh = FL.image.getDefaultSize(IMG);
				w = wh.width; h = wh.height; maxL = Math.max(w, h) / 2;
				py = FL.ut.pythagorean(w, h, true);
				wrap.addStyle({
					top : dim.top - (py / 2 - maxL) + 'px',
					left : dim.left - (py / 2 - maxL) + 'px',
					width : py + 'px',
					height : py + 'px'
				});
				c.addStyle({
					width : py + 'px',
					height : py + 'px'
				});
				that.__rotateVML(IMG, wrap, c, w, h, py);
			}, this);
			IMG.src = img.invisible().get().src;
		},
		__rotateCanvas : function(img, ctx, w, h, py) {
				var cos = Math.cos(this.rad), sin = Math.sin(this.rad)
				ctx.setTransform(cos, sin, -sin, cos, py / 2, py / 2);
				ctx.drawImage(img, -w / 2, -h / 2, w, h);
		},
		__rotateVML : function(img, wrap, ctx, w, h, py) {
			var cos = Math.cos(this.rad), sin = Math.sin(this.rad), fliterStr;

			filterStr = [
			             '<v:shape style="position:absolute;z-index:100;width:100px;height:100px;top:', py / 2 - h / 2, 'px;left:', py / 2 - w / 2, 'px;rotation:45;" stroke="false" fill="false">',
			             	'<v:imagedata src="' + img.src + '" style="postion:absolute;top:0px;left:0px;width:100px;height:100px;z-index:101;" />',
			             '</v:shape>'
			             ];
			wrap.html(filterStr.join(''));
		}
	};

	/* ====================== Flip Horizontal Class =========================== */

	function FlipH() {};
	/* ====================== Flip Vertical Class =========================== */

	function FlipV() {};

});