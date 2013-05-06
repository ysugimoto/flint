/**
 * ========================================================================================
 *
 * Seezoo popup window helper
 * create ande control DOM window
 *
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 *
 * ========================================================================================
 */
(function() {

	var FL = getInstance(), Helper = FL.config.getGlobal('Helper'),
		ppCount = 0, ppStack = [], stableIndex = 990, latestIndex = 1100, layer, imgBase = FL.config.baseUrl() + 'images/';

	FL.load.module('layer');
	FL.load.module('ui');

	// preload button rollover image and window frame images
	FL.image.preLoad([
	   imgBase + 'btn_right_on.png',
	   imgBase + 'ppbox/close.png',
	   imgBase + 'ppbox/rad_bottom_center.gif',
	   imgBase + 'ppbox/rad_bottom_left.png',
	   imgBase + 'ppbox/rad_bottom_right.png',
	   imgBase + 'ppbox/rad_top_center.gif',
	   imgBase + 'ppbox/rad_top_left.png',
	   imgBase + 'ppbox/rad_top_right.png',
	   imgBase + 'ppbox/ppinfo_lb.png',
	   imgBase + 'ppbox/ppinfo_lt.png',
	   imgBase + 'ppbox/ppinfo_rb.png',
	   imgBase + 'ppbox/ppinfo_rt.png',
	   imgBase + 'ppbox/ppinfo_bc.gif',
	   imgBase + 'ppbox/ppinfo_lc.gif',
	   imgBase + 'ppbox/ppinfo_rc.gif',
	   imgBase + 'ppbox/ppinfo_tc.gif',
	   imgBase + 'menu/loading_save.gif'
	]);

	FL.event.exprLive('a.pp_close', 'click', function(ev) {
		var p = DOM(ev.target.parentNode);

		hidePP(p);
	});

	var hidePP = function(callback) {
		var PP;

		if (ppCount === 1) {
			PP = ppStack[ppCount - 1];
			if (PP.doConfirm) {
				if (!confirm('ウインドウを閉じます。編集中のデータは破棄されます。よろしいですか？')) { return;}
			}
			// do callback is exists
			if (PP.closeCallback && FL.ut.isFunction(PP.closeCallback)) {
				PP.closeCallback();
			}
			PP.box.unevent('mouseover').unevent('mouseout').remove();
			ppStack = [];
			ppCount--;
			if (PP.keepLayer === false) {
				try {
					layer.hide();
				} catch(e){}
			}
		} else {
			PP = ppStack[ppCount - 1];
			if (PP.doConfirm) {
				if (!confirm('ウインドウを閉じます。編集中のデータは破棄されます。よろしいですか？')) { return;}
			}
			// do callback is exists
			if (PP.closeCallback && FL.ut.isFunction(PP.closeCallback)) {
				PP.closeCallback();
			}
			PP.box.unevent('mouseover').unevent('mouseout').remove();
			ppStack[ppCount - 2].box.addStyle('zIndex', latestIndex);
			if (FL.ua.IE6) {
				ppStack[ppCount - 2].box.detect('select').foreach(function() {
					this.style.visibility = 'visible';
				});
			}
			ppStack.pop();
			ppCount--;
		}

	};

	if (!functionExists('createDOMWindow')) {
		Helper.createDOMWindow = function(title, body, w, h, withLayer, cancelDrag, fixPosition) {
			if (ppCount === 10) { return alert('これ以上はウインドウは増やせません！');}
			var pp = {},
				tt = title || 'no title',
				bd = body || '',
				sc = FL.ut.getScrollPosition(),
				cs = FL.ut.getContentSize(),
				left = (cs.width / 2) | 0,
				IE6FixFlag = false,
				width, height, ml, mt, html;

			// width ,height format
			if (!w) {
				width = '600px'; ml = 300;
			} else if ((w + '').indexOf('%') > 0) {
				width = w; ml = cs.width * parseInt(w, 10) / 100 / 2;
			} else {
				width = w + 'px'; ml = w / 2;
			}
			if (!h) {
				height = '400px'; mt = 200;
			} else if ((h + '').indexOf('%') > 0) {
				height = h; mt = cs.height * parseInt(h, 10) / 100 / 2;
				IE6FixFlag = true;
			} else {
				height = h + 'px'; mt = h / 2;
			}
			// hide to stable
			if (ppCount > 0) {
				DOM('div.sz-popup-content').foreach(function() {
					DOM(this).addStyle('zIndex', ++stableIndex);
					if (FL.ua.IE6) {
						DOM(this).detect('select').foreach(function() {
							this.style.visibility = 'hidden';
						});
					}
				});
				stableIndex = 990;
			};
			pp.box = DOM.create('div', {'class' : 'sz-popup-content'}).appendTo(window['IEFIX'] ? IEFIX.body : document.body);

			if (FL.ua.IE6) {
				pp.box.addStyle('position', 'fixed');
				sc = {x : 0, y : 0};
				html = ['<div class="sz-pp-tl" style="filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src=\'', FL.config.baseUrl(), 'images/ppbox/rad_top_left.png\',sizingMethod=\'scale\');"></div>',
				        '<div class="sz-pp-tc">', tt, '</div>',
				        '<div class="sz-pp-tr" style="filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src=\'', FL.config.baseUrl(), 'images/ppbox/rad_top_right.png\',sizingMethod=\'scale\')"></div>',
				           '<div class="sz-pp-contents" id="sz_pp_contents">', bd, '</div>',
				        '<div class="sz-pp-bl" style="filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src=\'', FL.config.baseUrl(), 'images/ppbox/rad_bottom_left.png\',sizingMethod=\'image\')"></div>',
				        '<div class="sz-pp-bc"></div>',
				        '<div class="sz-pp-br" style="filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src=\'', FL.config.baseUrl(), 'images/ppbox/rad_bottom_right.png\',sizingMethod=\'image\')"></div>',
				        '<a href="javascript:void(0)" class="pp_close"></a>'
				         ];
			} else {
				html = ['<div class="sz-pp-tl"></div><div class="sz-pp-tc">', tt, '</div><div class="sz-pp-tr"></div>',
				           '<div class="sz-pp-contents" id="sz_pp_contents">', bd, '</div><div class="sz-pp-bl"></div><div class="sz-pp-bc"></div><div class="sz-pp-br"></div><a href="javascript:void(0)" class="pp_close"></a>'
				            ];
			}
			pp.box.html(html.join('\n'));
			pp.hide = hidePP;
			pp.keepLayer = withLayer || false;
			pp.setContent = function(e) {
				pp.body.append(e).addStyle('background', '#fff');
				if (FL.ua.IE6) {
					pp.box.addStyle('zoom', '1');
					if (IE6FixFlag === false) {
						pp.body.addStyle('height', height);
					}
				}

				// set button mouseover is exists
				var buttons = pp.box.detect('p.sz_button a');
				if (buttons.length === 0) { return; }
				buttons.event('mouseover', function(ev) { DOM(this).addClass('hover');})
								.event('mouseout', function(ev) { DOM(this).removeClass('hover');});
			};
			pp.setOnClose = function(fn, conf) {
				pp.doConfirm = conf || false;
				pp.closeCallback = fn || null;
			};
			pp.box.addStyle({
				width : width,
				height : height,
				marginLeft : -ml + 'px',
				display : 'block',
				top : sc.y + ppCount * 10 + 40 + 'px',
				left : left + 'px',
				zIndex : latestIndex
			});
			ppCount++;
			ppStack.push(pp);
			if (ppCount === 1) {
				layer = new Module.layer(true);
			}
			pp.title = pp.box.detect('div.sz-pp-tc').get(0, true);
			pp.body = pp.box.detect('div.sz-pp-contents').get(0, true);

			if (!cancelDrag && !FL.ua.IE6) {
				new Module.draggable(pp.box, {handle : pp.title});
			}
			return pp;
		};
	}

	if (!functionExists('hideDOMWindow')) {
		Helper.hideDOMWindow = function(pp) {
			hidePP();
		};
	}
	
	
			
})();