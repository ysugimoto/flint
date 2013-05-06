/**
 * Flint rich Image Editor librarry ver 0.8
 *
 * imagedata edit by Canvas, VML, IEFilters
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * @package Flint
 */
ClassExtend('Library', function image_editor() {

	// local vaiables
	var FL = getInstance(), DOM = FL.DOM; // capture this scope

	// load depend modules, CSS
	FL.load.css('fl_image_editor');
	FL.load.module('layer');

	// shortcut alias
	var pi = window.parseInt, cos = Math.cos, sin = Math.sin, sqrt = Math.sqrt, abs = Math.abs, mf = Math.floor,
		tan = Math.tan, PI = Math.PI, mr = Math.round, mp = Math.pow, mc = Math.ceil, max = Math.max, min = Math.min,
		doc = document, win = window;
	
	// Can you use Browser Canvas?
	var IS_CANVAS = !!win.CanvasRenderingContext2D;

	// zoom step
	var zoomStep = 10; // %

	// canvas padding correct value
	var c = 10;

	// current mode (true : edit or false : preview)
	var currentMode = true;

	// stack translated value
	var transX = 0, transY = 0;

	// stack mask position
	var maskX, maskY, maskW, maskH;

	// calculate deg to radian
	var toRad = function(deg) {
		return deg * PI / 180;
	};

	// cropping config
	var config = {
		'canvasWidth' : 500,
		'canvasHeight' : 500
	};

	// target image
	var target;

	// current target clone
	var current;

	// canvas context
	var ctx, per, ctxP;

	// target image info(width, etc...)
	var info, imageOffset = {};

	// wrapped frame
	var wrap, canvas;

	// canvas for preview.
	var canvasP;

	// extra IE canvas
	var canvas_IE, canvasP_IE; // fake canvas

	// center position
	var center = {x : 0, y : 0};

	// currentWidth, currentHeight, rotation flag
	var cw, ch, rotFlag = false;

	// current stacks
	var now = { deg : 0, w : 0, h : 0, zoom : 100, flip_h : false, flip_v : false};

	// distances
	var dx, dy;

	// image width, height
	var dw, dh;

	// edit stacks
	var editStack = [];

	// copy to Canvas image Element
	var imgObj = document.createElement('img');

	// masking element (handle event instead of canvas)
	var mask = DOM.create('div').attr('id', 'fl_image_mask');

	// mask matrix handle
	var maskMatrix;

	// overlay element;
	var overlay;

	// preview box
	var preview;

	// property instance
	var Property;

	// new name input box
	var newNameBox;

	// crop handle elements
	var handles = {
		l : DOM.create('div').addClass('fl_liner').addClass('fl_line_l'),
		t : DOM.create('div').addClass('fl_liner').addClass('fl_line_t'),
		b : DOM.create('div').addClass('fl_liner').addClass('fl_line_b'),
		r : DOM.create('div').addClass('fl_liner').addClass('fl_line_r'),
		// resize element of 8
		lt : DOM.create('div').addClass('fl_image_resize').addClass('fl_resize_lt').attr('resizemode', '-top-left'),
		tc : DOM.create('div').addClass('fl_image_resize').addClass('fl_resize_tc').attr('resizemode', '-top'),
		rt : DOM.create('div').addClass('fl_image_resize').addClass('fl_resize_rt').attr('resizemode', '-top-right'),
		rc : DOM.create('div').addClass('fl_image_resize').addClass('fl_resize_rc').attr('resizemode', '-right'),
		rb : DOM.create('div').addClass('fl_image_resize').addClass('fl_resize_rb').attr('resizemode', '-bottom-right'),
		bc : DOM.create('div').addClass('fl_image_resize').addClass('fl_resize_bc').attr('resizemode', '-bottom'),
		lb : DOM.create('div').addClass('fl_image_resize').addClass('fl_resize_lb').attr('resizemode', '-bottom-left'),
		lc : DOM.create('div').addClass('fl_image_resize').addClass('fl_resize_lc').attr('resizemode', '-left')
	};

	// crop window
	var crop = DOM.create('div').attr('class', 'fl_image_editor_crop');
	(!IS_CANVAS) && crop.addStyle('opacity', 0.5);

	// cropHandle
	var cropHandle;

	// master tables (to enable vertical-align)
	var frame = DOM.create('table').attr('id', 'fl_image_editor_frame');

	// append 2 cells
	var tb = DOM.create('tbody').appendTo(frame);
	DOM.create('tr').appendTo(tb).append(DOM.create('td').addClass('fl_image_control'));//.append('<td class="fl_image_control"></td>');
	DOM.create('tr').appendTo(tb).append(DOM.create('td').addClass('fl_image_canvas_cell').html('<div class="fl_image_canvas_frame"></div><div class="fl_image_canvas_preview"></div>'));//.append('<td class="fl_image_canvas_cell"><div class="fl_image_canvas_frame"></div><div class="fl_image_canvas_preview"></div></td>');
	DOM.create('tr').appendTo(tb).append(DOM.create('td').addClass('fl_image_prop'));//.append('<td class="fl_image_prop"></td>');

	// menu controls
	var tds = frame.detect('td');
	var menu = tds.get(0);
	var canvasFrame = tds.get(1);//.attr('valign', 'middle');
	var preview = canvasFrame.children(1).hide();
	var props = tds.get(2);
	// other data values
	var prop, zooms, cProp;


	// fix canvas scroll
	var fixScroll = function(x, y) {
		var frame = canvas.parent().get(), scx = x || frame.scrollLeft, scy = y || frame.scrollTop;

		// a few milliseconds delay for content recalculate
		setTimeout(function() {
			frame.scrollTop = scy;
			frame.scrollLeft = scx;
		}, 10);
	};
	// initialize (private)
	var _init = function() {
		for (var i in handles) {
			if (!i.isPrototypeOf(handles)) {
				crop.append(handles[i])
			}
		};
		// get image info
		canvasFrame.addStyle({width : config.canvasWidth + 'px', height : config.canvasHeight + 'px', 'position' : 'relative'});
		wrap.append(frame);
		target.hide();

		// prop set
		props.html('<p id="fl_image_zooms">100%</p><div id="fl_image_property"></div><div id="fl_image_crop_property"></div>');
		prop = props.detect('div').get(0);
		cProp = props.children(2).hide();
		zooms = props.detect('p').get(0);
		// set menu
		_createMenu();
	};

	// initialize mask event
	var _initMask = function() {
		cropHandle = new Crop(mask);
	};

	// create menu controls
	var _createMenu = function() {
		var html = [
		            '<div class="fl_image_pulldowns"><ul class="">',
		            '<li><a href="javascript:void(0)" rel="output">操作</a><ul class="fl_image_controls_body">',
		              '<li><a href="javascript:void(0)" rel="save_overwrite">上書き保存</a></li>',
		              '<li><a href="javascript:void(0)" rel="save_newname">別名で保存</a></li></ul>',
		            '</li>',
		            '<li><a href="javascript:void(0)" rel="zoom_plus">拡大</a></li>',
		            '<li><a href="javascript:void(0)" rel="zoom_minus">縮小</a></li>',
		            '<li class="long"><a href="javascript:void(0)" rel="rot_r">右に90度回転</a></li>',
		            '<li class="long"><a href="javascript:void(0)" rel="rot_l">左に90度回転</a></li>',
		            '<li><a href="javascript:void(0)" rel="flip_h">左右反転</a></li>',
		            '<li><a href="javascript:void(0)" rel="flip_v">上下反転</a></li>',
		            '<li class="long"><a href="javascript:void(0)" rel="clear_crop">選択範囲の解除</a></li>',
		            '<li class="right active"><a href="javascript:void(0)" rel="preview">プレビュー</a></li>',
		            '<li class="right"><a href="javascript:void(0)" rel="edit">編集エリア</a></li>',
		            '</ul><div class="fl_image_editor_radius_close">&nbsp;</div></div>'
		            ];
		menu.html(html.join(''));
		menu.event('click', doEdit);
		FL.event.set(doc, 'click', function() {menu.detect('ul.fl_image_controls_body').get(0).hide();});
	};

	// create property area HTML
	var _createProperty = function() {
		var html = [
		            '<p class="prop_caption">画像情報</p>',
		            '<table><tbody>',
		            '<tr>',
		            '<td>幅：</td><td><input type="text" class="image_txt vw" value="' + dw + '" />px</td>',
		            '<td rowspan="2" valign="middle"><input type="checkbox" id="keep_wh" value="1" checked="checked" />&nbsp;縦横比を保持</td>',
		            '</tr><tr>',
		            '<td>高さ：</td><td><input type="text" class="image_txt vh" value="' + dh + '" />px</td>',
		            '</tr>',
		            '</tbody></table>'
		            ];
		prop.html(html.join(''));
		html = [
		        '<p class="prop_caption">トリミング情報</p>',
	            '<table><tbody>',
	            '<tr>',
	            '<td>横：</td><td><input type="text" class="image_txt i_width" value="' + dw + '" tabindex="1" />px</td><td>X：</td><td><input type="text" class="image_txt c_width" value="0" tabindex="3" />px</td>',
	            '</tr><tr>',
	            '<td>縦：</td><td><input type="text" class="image_txt i_height" value="' + dh + '" tabindex="2" />px</td><td>Y：</td><td><input type="text" class="image_txt c_height" value="0" tabindex="4" />px</td>',
	            '</tr>',
	            '</tbody></table>'
		        ];
		cProp.html(html.join(''));
		Property = new CanvasProperty();
	};

	// edit from menu
	var doEdit = function(ev) {
		ev.stopPropagation();
		var e = DOM(ev.target), method; ev.stopPropagation();

		if (e.tag !== 'a' || !e.readAttr('rel')) { return; }
		method = e.readAttr('rel');
		if (method === 'output') {
			// show pulldown
			e.next().toggleShow();
			return;
		}
		if (MenuControls[method]) {
			if (!e.parent().hasClass('right') && !e.parent(2).hasClass('fl_image_controls_body')){
				if (currentMode === true) { MenuControls[method](e);}
			} else {
				MenuControls[method](e);
			}
		}
	};

	this.initialize = function(conf) {
		config = FL.union(config, conf || {});
	};

	this.setUp = function(img) {
		if (DOM(img).tag !== 'img') {
			throw new TypeError('image_editor works <img> element only.');
			return;
		}
		// mask matrix set
		maskMatrix = new Matrix2D(0, 0);
		cw = config.canvasWidth; ch = config.canvasHeight;
		target = DOM(img);
		target.addStyle({margin : 0, padding : 0});
		canvas = DOM.create('canvas');
		canvasP = DOM.create('canvas');

		canvasFrame.detect('div').get(0).addStyle({width : config.canvasWidth - 20 + 'px', height : config.canvasHeight - 20 + 'px'});
		preview.addStyle({width : config.canvasWidth - 20 + 'px', height : config.canvasHeight - 20 + 'px'})
				.append(canvasP);

		imgObj.onload = function() {
			info = FL.image.getDefaultSize(target.get());
			imageOffset.x = 0; imageOffset.y = 0;
			info.ext = this.src.slice(this.src.lastIndexOf('.'));
			dw = info.width; dh = info.height;
			canvasFrame.detect('div').get(0).append(canvas).append(mask);

			// get max size
			var m = max(cw, ch, dw, dh);

			(!IS_CANVAS) && canvas.addStyle({width : m + 2 * c + 'px', height : m + 2 * c + 'px'});
			canvas.attr({width : m + 2 * c, height : m + 2 * c});
			canvas.addStyle({top : '0px', left : '0px'});
			(!IS_CANVAS) && canvasP.addStyle({width : m + 2 * c + 'px', height : m + 2 * c + 'px'});
			canvasP.attr({width : m + 2 * c, height : m + 2 * c});
			canvasP.addStyle({top : '0px', left : '0px'});

			ctx = (!IS_CANVAS) ? new Matrix2D(0, 0, canvas) : canvas.get().getContext('2d');
			ctxP = (!IS_CANVAS) ? new Matrix2D(0, 0, canvasP) : canvasP.get().getContext('2d');
			center = { x : cw / 2, y : ch / 2};
			drawCanvas(m);
			wrap = target.wrap('div').attr('id', 'fl_image_canvas');

			_init();
			_initMask();
			// set propertiy field
			_createProperty();
			// set nameBox
			newNameBox = new NameBoxClass();

		};
		imgObj.onerror = function() {
			alert('画像が読み込めませんでした。');
		}
		imgObj.src = target.readAttr('src');
	};

	var drawCanvas = function(m) {
		// canvas ceter position recalcualte if need translate
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctxP.setTransform(1, 0, 0, 1, 0, 0);
		maskMatrix.setTransform(1, 0, 0, 1, 0, 0);

		ctx.clearRect(0, 0, canvas.readAttr('width'), canvas.readAttr('height'));
		transX = m / 2 + c; transY = m / 2 + c;

		ctx.setTransform(1, 0, 0, 1, transX, transY);
		ctxP.setTransform(1, 0, 0, 1, transX, transY);
		maskMatrix.setTransform(1, 0, 0, 1, transX, transY);

		ctx.drawImage(imgObj, -dw / 2,-dh / 2, dw, dh);
		updateMask();
		fixScroll(0, mask.readStyle('top', true) - 10);
	};

	var updateCanvas = function() {
		MenuControls.clear();
		// calculate degree and flips
		var deg = now.deg, rad, c, s, fv = now.flip_v, fh = now.flip_h;

		if (deg < 0) {
			while (deg < 0) { deg += 360;}
		} else if (deg >= 360) {
			while (deg >= 360) { deg -= 360;}
		}
		rad = toRad(deg); c = cos(rad); s = sin(rad);
			ctx.setTransform(1, 0, 0, 1, transX, transY);
			if (fv) {
				ctx.transform(1, 0, 0, -1, 0, 0);
			}
			if (fh) {
				ctx.transform(-1, 0, 0, 1, 0, 0);
			}

			ctx.transform(c, s, -s, c, 0, 0);

		ctx.drawImage(imgObj, -dw / 2, -dh / 2, dw, dh);
	};

	var resizeCanvas = function() {
		var m = max(cw, ch, dw, dh),
			rad = toRad(now.deg), cs = cos(rad), sn = sin(rad);

		canvas.attr({width : m + 2 * c, height : m + 2 * c});
		canvasP.attr({width : m + 2 * c, height : m + 2 * c});

		transX = m / 2 + c; transY = m / 2 + c;
		ctx.setTransform(cs, sn, -sn, cs, transX, transY);
		ctxP.setTransform(cs, sn, -sn, cs, transX, transY);
		maskMatrix.setTransform(cs, sn, -sn, cs, transX, transY);
	};

	var isRotation = function() {
		var deg = now.deg;

		if (deg < 0) {
			while (deg < 0) { deg += 360;}
		} else if (deg >= 360) {
			while (deg >= 360) { deg -= 360;}
		}
		return ((deg / 90) % 2 > 0);
	};

	var updateMask = function(isResize) {
		var xy = maskMatrix.__getXY(), rotFlag = isRotation();
		var w = (rotFlag) ? dh : dw, h = (rotFlag) ? dw : dh, t = pi(xy.y, 10), l = pi(xy.x, 10);

		mask.addStyle({width : w + 'px', height : h + 'px', top : t - h / 2  + 'px', left : l - w / 2 + 'px'});
		if (!IS_CANVAS) {
			DOM(ctx.element).addStyle({width : w + 'px', height : h + 'px', top : t - h / 2  + 'px', left : l - w / 2 + 'px'});
		}
	};

	/* ============================ MenuControls Class =============================== */
	var MenuControls = {
		// save to overwrite target image
		save_overwrite : function() {
			if (confirm('現在編集中の画像を上書きします。\nよろしいですか？')) {
				newNameBox.__requestCI();
			}
		},
		// save to new name of cloned image
		save_newname : function() {
			newNameBox.show();
		},
		// zoom+
		zoom_plus : function() {
			now.zoom += zoomStep;
			var vw = mf(info.width * zoomStep / 100),
				vh = mf(info.height * zoomStep / 100);

			this.clear();

			imageOffset.x -= vw; imageOffset.y -= vh; dw += vw; dh += vh;
			resizeCanvas();
			updateCanvas();
			updateMask();
		},
		// zoom-
		zoom_minus : function() {
			now.zoom -= zoomStep;
			var vw = mf(info.width * zoomStep / 100),
				vh = mf(info.height * zoomStep / 100);

			this.clear();

			imageOffset.x += vw; imageOffset.y += vh; dw -= vw; dh -= vh;
			resizeCanvas();
			ctx.drawImage(imgObj, -dw / 2,-dh / 2, dw, dh);
			updateMask();
		},
		// rotate +90
		rot_r : function() {
			now.deg += 90;
			updateMask();
			updateCanvas();
		},
		// rotate -90
		rot_l : function() {
			now.deg -= 90;
			updateMask();
			updateCanvas();
		},
		// flip horizontal
		flip_h : function() {
			now.flip_h = !now.flip_h;
			updateCanvas();
		},
		//  flip vetical
		flip_v : function() {
			now.flip_v = !now.flip_v;
			updateCanvas();
		},
		clear : function() {
			ctx.save();
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, cw, ch);
			ctx.clearRect(0, 0, canvas.readAttr('width'), canvas.readAttr('height'));
			ctx.restore();
			ctxP.save();
			ctxP.setTransform(1, 0, 0, 1, 0, 0);
			ctxP.clearRect(0, 0, cw, ch);
			ctxP.clearRect(0, 0, canvas.readAttr('width'), canvas.readAttr('height'));
			ctxP.restore();
		},
		clear_crop : function() {
			cropHandle.hide();
			Property.setEditValues(dw, dh);
		},
		_createPreview : function(scr) {
			var deg = now.deg, rad, c, s, fv = now.flip_v, fh = now.flip_h,
				cp, cropData, p = preview.get();

			ctxP.save();
			ctxP.setTransform(1, 0, 0, 1, 0, 0);
			ctxP.clearRect(0, 0, cw, ch);
			ctxP.clearRect(0, 0, canvas.readAttr('width'), canvas.readAttr('height'));
			ctxP.restore();
			if (cropHandle.isCropping()) { // trimming
				// get cropOffset
				cp = {	l : crop.readStyle('left', true) - 2,
						t : crop.readStyle('top', true) - 2,
						w : crop.readStyle('width', true),
						h : crop.readStyle('height', true)
					};
				cropData = cropHandle.getCropOffset(cp);

				ctxP.save();

				if (deg < 0) {
					while (deg < 0) { deg += 360;}
				} else if (deg >= 360) {
					while (deg >= 360) { deg -= 360;}
				}
				rad = toRad(deg); c = cos(rad); s = sin(rad);

				ctxP.setTransform(1, 0, 0, 1, transX, transY);
				if (fv) {
					ctxP.transform(1, 0, 0, -1, 0, 0);
				}
				if (fh) {
					ctxP.transform(-1, 0, 0, 1, 0, 0);
				}

				if ( deg != 0 ) {
					ctxP.transform(c, s, -s, c, 0, 0);
				}					
				ctxP.drawImage(imgObj, cropData.x, cropData.y, cropData.sw, cropData.sh, -cropData.w / 2, -cropData.h / 2, cropData.w, cropData.h);
				ctxP.restore();
				// a few minute delay
				setTimeout(function() {
					p.scrollTop = cropData.oy / 2;
					p.scrollLeft = cropData.ox / 2;
				}, 10);
			} else { // resize only
				ctxP.save();

				if (deg < 0) {
					while (deg < 0) { deg += 360;}
				} else if (deg >= 360) {
					while (deg >= 360) { deg -= 360;}
				}
				rad = toRad(deg); c = cos(rad); s = sin(rad);
				ctxP.setTransform(1, 0, 0, 1, transX, transY);
				if (fv) {
					ctxP.transform(1, 0, 0, -1, 0, 0);
				}
				if (fh) {
					ctxP.transform(-1, 0, 0, 1, 0, 0);
				}
				if ( deg != 0 ) {
					ctxP.transform(c, s, -s, c, 0, 0);
				}
				ctxP.drawImage(imgObj, -dw / 2 + c,-dh / 2 + c, dw, dh);
				ctxP.restore();
			}
		},
		doEdit : function() {
			this.createImage();
		},
		_getImageParameters : function() {
			var cp, cropData, deg;

			if (cropHandle.isCropping()) {
				 cp = {	l : crop.readStyle('left', true) - 2,
							t : crop.readStyle('top', true) - 2,
							w : crop.readStyle('width', true),
							h : crop.readStyle('height', true)
						},
				cropData = cropHandle.getCropOffset(cp);

				// Canvas rotate is clockwize, but PHP rotate is anti-clockwize.
				if (cropData.deg === 90) { cropData.deg = 270;}
				else if (cropData.deg === 270) { cropData.deg = 90;}
				// flip data is boolean. so that convert integer
				// false -> 0, true -> 1
				cropData.flipH += 0;
				cropData.flipV += 0;
				return cropData;
			} else { // resize only
				deg = now.deg;
				// to strict degree to 0 - 360.
				if (deg < 0) {
					while (deg < 0) { deg += 360;}
				} else if (deg >= 360) {
					while (deg >= 360) { deg -= 360;}
				}
				if (deg === 90) { deg = 270;}
				else if (deg === 270) { deg = 90;}
				// degree has 0, or 90 or 180 or 360 only.
				switch (deg) {
				case 0 : // no rotation
					//baseW = dw; baseH = dh;
					break;
				case 90 : // 90 deg rotation
					isFlip = true;
					//baseW = dh; baseH = dw;
					break;
				case 180 : // 180 deg rotation
					//baseW = dw; baseH = dh;
					break;
				case 270 : // 270 deg rotation
					isFlip = true;
					//baseW = dh; baseH = dw;
					break;
				default :
					throw new Error('can\'t calculate angle for canvas! :' + deg);
					break;
				}
				
				return {
					x : 0,
					y : 0,
					w : dw,//baseW,
					h : dh,//baseH,
					deg : deg,
					flipH : ( now.flip_h ) ? 1 : 0,
					flipV : ( now.flip_v ) ? 1 : 0
				};
			}
		},
		preview : function(e) {
			if (!currentMode) { return;}
			var sc = canvasFrame.children(0).getScroll();

			canvasFrame.children(0).hide();
			canvasFrame.children(1).show();
			e.parent().addClass('active').next().removeClass('active');
			this._createPreview(sc);
			currentMode = !currentMode;
		},
		edit : function(e) {
			if (currentMode) { return;}
			canvasFrame.children(0).show();
			canvasFrame.children(1).hide();
			e.parent().addClass('active').prev().removeClass('active');
			currentMode = !currentMode;
		}
	};


	/* ======================= newNameBox inputer Class ============================= */

	function NameBoxClass() {
		this.box = DOM.create('div').addClass('fl_image_editor_newname').appendTo(doc.body);
		this.layer = new Module.layer();
		// create layer
		//this.layer = new Module.layer();
		this.layer.getLayerObject().addStyle('z-index', 40003);
		this.__construct();
	}

	NameBoxClass.prototype = {
		__construct : function() {

			var html = [
			        '<h4>画像の保存</h4>',
			        '<div class="newnamebox_input">',
			        '<form class="fl_image_editor_newname_form">',
			        '<p>新規に保存する名前を入力してください。(拡張子不要)<br />新規ファイルは既存ファイルと同じディレクトリに保存されます。',
			        '<input type="text" id="fl_image_editor_newname_value" value="" style="width : 80%;" />' + info.ext + '</p>',
			        '<p><input type="button" value="画像を保存する" /></p>',
			        '</form>',
			        '</div>',
			        '<div class="newnamebox_complete">',
			        '<p class="complete">画像の編集が完了しました。編集を続けますか？</p>',
			        '<p><input type="button" value="編集を続ける" />&nbsp;&nbsp;&nbsp;&nbsp;<input type="button" value="ファイル管理に戻る" /></p>',
			        '</div>',
			        '<a href="javascript:void(0)">close</a>'
			        ],
			       ipts;

			this.box.html(html.join(''));

			ipts = this.box.detect('input');
			ipts.get(1).event('click', this.__requestCI, this);
			ipts.get(2).event('click', function() { this.hide();}, this);
			ipts.get(3).event('click', function() { location.href = FL.config.siteUrl() + 'dashboard/files'});
			this.box.last().event('click', this.hide, this);
		},
		showInput : function() {
			menu.detect('ul.fl_image_controls_body').get(0).hide();
			this.box.children(1).show();
			this.box.children(2).hide();
		},
		showComplete : function() {
			this.box.children(1).hide();
			this.box.children(2).show();
		},
		hide : function() {
			this.box.hide();
			this.layer.hide();
			this.box.children(2).hide();
			this.box.children(1).show().getOne('input').setValue('');
		},
		show : function() {
			menu.detect('ul.fl_image_controls_body').get(0).hide();
			this.box.show();
			this.layer.show();
		},
		__requestCI : function(ev) {
			var name, overwrite = 0, post = MenuControls._getImageParameters(), that = this, src;

			if (ev) { // is event object exsits, save new name
				name = this.box.detect('input').get(0).getValue() + info.ext;
			} else {
				src = imgObj.src;
				name = src.slice(src.lastIndexOf('/') + 1);
				overwrite = 1;
			}
			post.name = name;
			post.overwrite = overwrite;
			post.token = FL.config.item('sz_token');
			post.file_id = FL.uri.segment(4, 0);

			// send request
			FL.ajax.post('dashboard/image/do_edit', {
				param : post,
				error : function() { alert('画像の編集に失敗しました。'); },
				success : function(resp) {
					if (resp.responseText.indexOf('error') !== -1) {
						alert('画像の編集に失敗しました。');
						return;
					}
					if (overwrite > 0) {
						alert('画像の編集が完了しました。リロードを行ないます。');
						location.reload();
					} else {
						that.showComplete();
					}
				}
			});
		}
	};

	/* ============================== Crop Class ==================================== */

	function Crop(mask) {
		this.mask = mask;
		this.crop = crop;
		this.resizeList = this.crop.detect('div.fl_image_resize')
							.event('mousedown', this.cropResize, this);
		this.offset = {x : 0, y : 0};
		this.startPoint = {x : 0, y : 0};
		this.currentCrop = { x : 0, y : 0};
		this.current
		this.frame = canvasFrame.detect('div').get(0);
		this.cropInit();
	};

	Crop.prototype = {
		 // set crop event (mousedown, drag resize)
		cropInit : function() {
			this.crop.appendTo(this.mask.parent());
			this.crop.event('mousedown', this.cropMove, this);
			FL.event.set(this.mask, 'mousedown', this.cropStart, this);
		},
		cropStart : function(ev) {
			ev.stopPropagation();
			ev.preventDefault();
			var sc, wh, X, Y;

			//if (this.cropFlag === true) { return;}
			this.hideResize();
			FL.event.remove(this.mask, 'mousedown', arguments.callee);
			FL.event.remove(doc, 'keydown', this.cropMoveByKey);
			FL.event.remove(doc, 'keyup', Property.setCropValues);
			this.mask.addStyle('opacity', 0.3);
			this.crop.show();
			sc = this.frame.getScroll();
			this.initialScrollStack = sc;
			wh = this.frame.absDimension();
			X = ev.pageX - wh.left + sc.x;
			Y = ev.pageY - wh.top + sc.y;
			this.offset = {x : X, y : Y};
			this.startPoint = {x : ev.pageX, y : ev.pageY};
			this.crop.addStyle({top : Y + 'px', left : X + 'px', width : '0px', height : '0px'}).show();
			FL.event.set(doc, 'mousemove', this.doCrop, this);
			FL.event.set(doc, 'mouseup', this.cropAfter, this);

		},
		doCrop : function(ev) {
			var x = abs(this.startPoint.x - ev.pageX), y = abs(this.startPoint.y - ev.pageY);

			this.crop.addStyle({width : x + 'px', height : y + 'px'});
			if (this.startPoint.x > ev.pageX) {
				this.crop.addStyle('left', this.offset.x - x + 'px');
			}
			if (this.startPoint.y > ev.pageY) {
				this.crop.addStyle('top', this.offset.y - y + 'px');
			}
		},
		cropAfter : function(ev) {
			ev.stopPropagation();
			FL.event.remove(doc, 'mousemove', this.doCrop);
			FL.event.remove(doc, 'mouseup', this.cropAfter);
			FL.event.set(this.mask, 'mousedown', this.cropStart, this);
			this.currentCrop = { x : this.crop.readStyle('left', true), y : this.crop.readStyle('top', true)};
			FL.event.set(doc, 'keydown', this.cropMoveByKey, this);
			FL.event.set(doc, 'keyup', Property.setCropValuesByKey, Property);
			this.showResize();
			Property.setCropValues();
		},
		cropMoveByKey : function(ev) {
			var k = pi(ev.keyCode, 10), c = this.crop;

			if (k >= 37 && k <= 40) { ev.preventDefault();} // cursor key
			switch (k) {
			case 37:
				c.addStyle('left', --this.currentCrop.x + 'px');
				break;
			case 38:
				c.addStyle('top', --this.currentCrop.y + 'px');
				break;
			case 39:
				c.addStyle('left', ++this.currentCrop.x + 'px');
				break;
			case 40:
				c.addStyle('top', ++this.currentCrop.y + 'px');
				break;
			}
		},
		cropMove : function(ev) {
			ev.stopPropagation();
			ev.preventDefault();
			var tmp = this.crop.absDimension(),
				wh = this.frame.absDimension(),
				sc = this.frame.getScroll(),
				dsc = this.initialScrollStack;

			this.cropMoveStartPoint = { x : ev.pageX, y : ev.pageY};
			this.maskOffsetMove = wh;

			this.cropPlaceHolder = tmp;
			this.current = { x : 0, y : 0};
			this.maskPos = this.mask.absDimension();
			FL.event.set(doc, 'mousemove', this.doCropMove, this);
			FL.event.set(doc, 'mouseup', this.cropMoveAfter, this);
		},
		doCropMove : function(ev) {
			ev.stopPropagation();
			ev.preventDefault();
			var o = this.cropMoveStartPoint, def = this.cropPlaceHolder,
				wh = this.maskOffsetMove, m = this.maskPos,
				x = abs(o.x - ev.pageX), y = abs(o.y - ev.pageY), distX, distY,
				sc = this.frame.getScroll(), flag = false, dsc = this.initialScrollStack;

			if (o.x < ev.pageX) {
				distX = (def.left + x) - wh.left + sc.x;
			} else {
				distX = (def.left - x) - wh.left + sc.x;
			}

			if (o.y < ev.pageY) {
				distY = (def.top + y) - wh.top + sc.y;
			} else {
				distY = (def.top - y) - wh.top + sc.y;
			}

			// temporary mask over...
			this.crop.addStyle({top : distY + 'px', left : distX + 'px'});
			this.currentCrop.x = distX;
			this.currentCrop.y = distY;
		},
		cropMoveAfter : function(ev) {
			ev.stopPropagation();
			FL.event.remove(doc, 'mousemove', this.doCropMove);
			FL.event.remove(doc, 'mouseup', this.cropMoveAfter);
			Property.setCropValues();
		},
		cropResize : function(ev) {
			ev.stopPropagation();
			ev.preventDefault();
			var e = DOM(ev.target), mode = e.readAttr('resizemode'),
			modeObj = { top : false, left : false, bottom : false, right : false}, i;

			if (!mode) { return;} // guard
			for (i in modeObj) {
				if (FL.ut.grep(mode, '-' + i)) {
					modeObj[i] = true;
				}
			}
			this.resizeMode = modeObj;
			this.resizeOffset = {x : ev.pageX, y : ev.pageY};
			this.resizeInitParameter = this.crop.absDimension();
			this.maskOffset = canvasFrame.absDimension();
			FL.event.set(doc, 'mousemove', this.doResize, this);
			FL.event.set(doc, 'mouseup', this.resizeAfter, this);
		},
		doResize : function(ev) {
			ev.stopPropagation();
			var mo = this.resizeMode, offset = this.resizeOffset, wh = this.maskOffset,
				x = abs(offset.x - ev.pageX), y = abs(offset.y - ev.pageY),
				def = this.resizeInitParameter, sc = this.frame.getScroll(), dis;

			if (mo.top === true) {
				if (offset.y < ev.pageY) { // shorter
					this.crop.addStyle('height', def.height - y + 'px');
				} else { // greater
					this.crop.addStyle('height', def.height + y + 'px');
				}
				// correct top offset
				dis = abs(ev.pageY - wh.top) + sc.y;
				this.crop.addStyle('top', dis + 'px');
				this.currentCrop.y = dis;
			} else if (mo.bottom === true) {
				if (offset.y < ev.pageY) { // shorter
					this.crop.addStyle('height', def.height + y + 'px');
				} else { // greater
					this.crop.addStyle('height', def.height - y + 'px');
				}
			}

			if (mo.left === true) {
				if (offset.x < ev.pageX) { // shorter
					this.crop.addStyle('width', def.width - x + 'px');
				} else { // greater
					this.crop.addStyle('width', def.width + x + 'px');
				}
				// correct left offset
				dis = abs(ev.pageX - wh.left) + sc.x;
				this.crop.addStyle('left', dis + 'px');
				this.currentCrop.x = dis;
			} else if (mo.right === true) {
				if (offset.x < ev.pageX) { // shorter
					this.crop.addStyle('width', def.width + x + 'px');
				} else { // greater
					this.crop.addStyle('width', def.width - x + 'px');
				}
			}
		},
		resizeAfter : function(ev) {
			ev.stopPropagation();
			FL.event.remove(doc, 'mousemove', this.doResize);
			FL.event.remove(doc, 'mouseup', arguments.callee);
			Property.setCropValues();
		},
		hide : function() {
			this.mask.addStyle('opacity', 0);
			this.crop.hide();
			FL.event.remove(doc, 'keypress', this.cropMoveByKey);
			FL.event.remove(doc, 'keyup', Property.setCropValuesByKey);
		},
		show : function() {
			this.mask.addStyle('opacity', 0.3);
			this.crop.show();
		},
		hideResize : function() {
			this.resizeList.foreach(function() {
				DOM(this).hide();
			});
		},
		showResize : function() {
			this.resizeList.foreach(function() {
				DOM(this).show();
			});
		},
		isCropping : function() { return !this.crop.isHidden();},
		getCropOffset : function(cp) {
			var crop = this.crop, mask = this.mask,
				perX = dw / info.width, perY = dh / info.height,
				deg = now.deg, baseX, baseY, isFlip = false, baseW, baseH, zx, zy,
				ms = {	l : mask.readStyle('left', true),
						t : mask.readStyle('top', true),
						w : mask.readStyle('width', true),
						h : mask.readStyle('height', true)
						};

			cp.r = cp.l + cp.w;
			cp.b = cp.t + cp.h;
			ms.r = ms.l + ms.w;
			ms.b = ms.t + ms.h;

			// to strict degree to 0 - 360.
			if (deg < 0) {
				while (deg < 0) { deg += 360;}
			} else if (deg >= 360) {
				while (deg >= 360) { deg -= 360;}
			}
			// degree has 0, or 90 or 180 or 360 only.
			switch (deg) {
			case 0 : // no rotation
				if (now.flip_v) {
					baseX = (now.flip_h) ? 'r' : 'l'; baseY = 'b';
				} else {
					baseX = (now.flip_h) ? 'r' : 'l'; baseY = 't';
				}
				baseW = cp.w; baseH = cp.h;
				break;
			case 90 : // 90 deg rotation
				if (now.flip_v) {
					baseY = (now.flip_h) ? 'l' : 'r'; baseX = 'b';
				} else {
					baseY = (now.flip_h) ? 'l' : 'r'; baseX = 't';
				}
				isFlip = true;
				baseW = cp.h; baseH = cp.w;
				break;
			case 180 : // 180 deg rotation
				if (now.flip_v) {
					baseX = (now.flip_h) ? 'l' : 'r'; baseY = 't';
				} else {
					baseX = (now.flip_h) ? 'l' : 'r'; baseY = 'b';
				}
				baseW = cp.w; baseH = cp.h;
				break;
			case 270 : // 270 deg rotation
				if (now.flip_v) {
					baseY = (now.flip_h) ? 'r' : 'l'; baseX = 't';
				} else {
					baseY = (now.flip_h) ? 'r' : 'l'; baseX = 'b';
				}
				isFlip = true;
				baseW = cp.h; baseH = cp.w;
				break;
			default :
				throw new Error('can\'t calculate angle for canvas! :' + deg);
				break;
			}
			zx = abs(cp[baseX] - ms[baseX]) / perX; zy = abs(cp[baseY] - ms[baseY]) / perY;
			return {
				x : zx,
				y : zy,
				w : baseW,
				h : baseH,
				sw : baseW / perX,
				sh : baseH / perY,
				ox : (isFlip) ? abs(ms['t'] - cp['t']) : abs(ms['l'] - cp['l']),
				oy : (isFlip) ? abs(ms['l'] - cp['l']) : abs(ms['t'] - cp['t']),
				isF : isFlip,
				deg : deg,
				flipH : now.flip_h,
				flipV : now.flip_v
			};
		}
	};

	/* =============================== Canvas Property Class ================================= */

	function CanvasProperty() {
		this.propI = prop;
		this.edits = this.propI.detect('input');
		this.keep = true;
		this.propC = cProp;
		this.crops = this.propC.detect('input');
		this.__construct();
	}

	CanvasProperty.prototype = {
		__construct : function() {
			var that = this;

			// set change event
			this.edits.event('blur', this._resizeImage, this);
			this.crops.event('blur', this._resizeCrop, this);
			DOM.id('keep_wh').event('click', function() {
				that.keep = !!this.checked;
			});
		},
		toggle : function(mode) {
			if (mode === 'e') {
				this.propI.show();
				this.propC.hide();
			} else if (mode === 'p') {
				this.propI.hide();
				this.propC.show();
			}
		},
		setEditValues : function(dw, dh) {
			this.toggle('e');
			this.edits.get(0).setValue(dw);
			this.edits.get(2).setValue(dh);
		},
		setCropValues : function() {
			this.toggle('p');
			var perX = dw / info.width, perY = dh / info.height,
				ms = {	l : mask.readStyle('left', true),
					t : mask.readStyle('top', true)
				};
			this.crops
				.get(0).setValue(crop.readStyle('width', true))
				.rollBack()
				.get(2).setValue(crop.readStyle('height', true))
				.rollBack()
				.get(1).setValue(mr((crop.readStyle('left', true) - ms.l) / perY) + 2)
				.rollBack()
				.get(3).setValue(mr((crop.readStyle('top', true) - ms.t) / perX) + 2);
		},
		setCropValuesByKey : function(ev) {
			if (ev.keyCode >= 37 && ev.keyCode <= 40) { // cursor key only

				var perX = dw / info.width, perY = dh / info.height,
					ms = {	l : mask.readStyle('left', true),
							t : mask.readStyle('top', true)
						};
				this.crops
					.get(0).setValue(crop.readStyle('width', true))
					.rollBack()
					.get(2).setValue(crop.readStyle('height', true))
					.rollBack()
					.get(1).setValue(mr((crop.readStyle('left', true) - ms.l) / perY) + 2)
					.rollBack()
					.get(3).setValue(mr((crop.readStyle('top', true) - ms.t) / perX) + 2);
			}
		},
		_resizeImage : function(ev) {
			var e = DOM(ev.target), cv = e.getValue(), per = info.width / info.height;

			if (isNaN(parseFloat(cv))) { return;}
			if (this.keep === true) {
				if (e.hasClass('vw')) { // changed width value
					dw = cv; dh = mf(cv / per);
				} else if (e.hasClass('vh')) { // changed height value
					dw = mf(cv * per); dh = cv;
				}
			} else {
				if (e.hasClass('vw')) { // changed width value
					dw = cv;
				} else if (e.hasClass('vh')) { // changed height value
					dh = cv;
				}
			}
			this.setEditValues(dw, dh);
			MenuControls.clear();
			resizeCanvas();
			ctx.drawImage(imgObj, -dw / 2, -dh / 2, dw ,dh);
			updateMask();
		},
		_resizeCrop : function(ev) {
			var e = DOM(ev.target), cv = e.getValue(),
				ms = {	l : mask.readStyle('left', true),
					t : mask.readStyle('top', true)
				};

			if (isNaN(parseFloat(cv))) { return;}
			if (e.hasClass('i_width')) { // crop width
				crop.addStyle('width', cv + 'px');
			} else if (e.hasClass('i_height')) { // crop height
				crop.addStyle('height', cv + 'px');
			} else if (e.hasClass('c_width')) { // crop position x
				crop.addStyle('left', mf(ms.l - cv - 2) + 'px');
			} else if (e.hasClass('c_height')) { // crop position y
				crop.addStyle('top', mf(ms.t - cv - 2) + 'px');
			}
		}
	};


	/* =================================== Matrix2D Class ==================================== */
	// Matrix2D - 2次元マトリックスクラス
	// @param Number x - x座標
	// @param Number y - y座標
	function Matrix2D(x, y, elm) {
		this.element = elm || null;
		this.matrix = [[x || 0], [y || 0], [1]]; // translateできるように3次元にしておく
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
			this.matrix = [[mr(res[0])], [mr(res[1])], [mr(res[2])]];
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
		},
		transform : function(m11, m12, m21, m22, x, y) {
			var m = [ [m11, m12, x], [m21, m22, y], [0, 0, 1] ];
			return this.multiply(m);
		},
		setTransform : function(m11, m12, m21, m22, x, y) {
			var m = [ [m11, m12, x], [m21, m22, y], [0, 0, 1] ];
			this.matrix = [[1], [1], [1]];
			return this.multiply(m);
		},
		__getXY : function(px, py) {
			var m = this.matrix;
			px = 1; py = 1;
			return { x : m[0], y : m[1]};
		}
	};

	/* ======================= VML Emurate Class (IE only) ======================================= */
	Matrix2D.prototype.drawImage = function(img, dx, dy, w ,h, sx, sy, sw, sh) {
		var vmlStr, BIF = [], FV = '', FH = '', xy = this.__getXY(), imgStr, out,
			isRot = isRotation(), deg, FLV = [],
		//var mw = (rotFlag) ? dh : dw, mh = (rotFlag) ? dw : dh, t = pi(xy.y, 10), l = pi(xy.x, 10);
		fw = (isRot) ? dh : dw, fh = (isRot) ? dw : dh, t = pi(xy.y, 10), l = pi(xy.x, 10);
		while(now.deg <= 0) {
			now.deg += 360;
		}
		while (now.deg >= 360) {
			now.deg -= 360;
		}

		deg = (now.deg / 90 > 3) ? 0 : now.deg / 90;
		//if (90 <= now.deg && now.deg <= 270) {BIF = now.deg / 90;}
		if (now.flip_v === true) { FV = 'x';}
		if (now.flip_h === true) { FH = 'y';}
		vmlStr = ['<div style="position:absolute;top:',0, 'px;left:',0, 'px;width:', sw || w, 'px;height:', sh || h, 'px;'];
		if (deg) {
			BIF.push('rotation=' + deg);
		}
		if (FH) {
			BIF.push('mirror=1');
		}
		if (BIF.length > 0) {
			FLV.push('progid:DXImageTransform.Microsoft.BasicImage(' + BIF.join(',') + ')');
		}
		if (FV) {
			FLV.push('FlipV;');
		}
		if (FLV.length > 0) {
			vmlStr.push('filter:' + FLV.join(''));
		}

		vmlStr.push('">');
		// if arguments.length greater than 5, crop image
		if (arguments.length > 5) {
			// rebuild vml strings
			vmlStr = ['<div style="position:absolute;z-index:2;top:', config.canvasHeight / 2 - (sw / 2), 'px;left:', config.canvasWidth / 2 - (sh / 2), 'px;width:', sw, 'px;height:', sh, 'px;'];
			if (BIF) {
				vmlStr.push('filter:progid:DXImageTransform.Microsoft.BasicImage(' + BIF + ');');
			}
			vmlStr.push('">')
			vmlStr.push('<v:image src="'+ img.src + '" style="position:absolute;z-index:3;width:' + sw + 'px;height:' + h + 'px;" croptop="', dy / info.height, '" cropleft="', dx / info.width, '" cropright="', (info.width - dx - w) / info.width, '" cropbottom="', (info.height - dy - h) / info.height, '" /></div>');
		} else {
			vmlStr.push('<div style="filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src=', img.src, ',sizingMethod=scale);width:', sw || w, 'px;height:', sh || h, 'px;"></div></div>');
		}
		this.element.get().innerHTML = vmlStr.join('');

	};
	Matrix2D.prototype.clearRect = function() {
		if (!!this.element) {this.element.get().innerHTML = '';}
	}
	// empty funtions [necessary]
	Matrix2D.prototype.save = function() {};
	Matrix2D.prototype.restore = function() {};
});