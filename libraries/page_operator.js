/**
 * ==============================================================================================
 *
 * Seezoo page operator Library
 *
 * manage page link select, configure...
 *
 * @note
 *    manualy sortable method exsits in this method [no depand UI module]
 *
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 *
 * ==============================================================================================
 */
ClassExtend('Library', function page_operator() {

	// capture this scope
	var FL = getInstance(),
		that = this,
		mode,
		layer,
		infoElement,
		// saving image
		saving = DOM.create('div').attr('id', 'sz_saving').addStyle('position', 'fixed'),
		// sortParameters
		offset = {x : 0, y : 0},
		current = null,
		placeHolder = DOM.create('div').addClass('sz_page_placeholder').appendTo(document.body)
							.addStyle({opacity : 0.5, position : 'absolute', cursor : 'move'}),
		customMenuHTML = [
	                      '<ul>',
	                      '<li><a href="javascript:void(0)" class="moveto">ページを移動する</a></li>',
	                      '<li><a href="javascript:void(0)" class="aliasto">ページエイリアスを貼る</a></li>',
	                      '<li><a href="javascript:void(0)" class="copyto">ページをコピーする</a></li>',
	                      '</ul>'
	                      ],
	    customMenu,
	    contentSize,
	    target,
	    targetList = [],
	    menuTarget,
	    dragTarget;

	// load depend modules
	FL.load.ajax();
	FL.load.module('layer');
	
	DOM('div#sitemap div.movable').foreach(function() {
		var e = DOM(this);
		
		if ( !e.hasClass('alias') && !(e.readAttr('sys') > 0) ) {
			targetList[targetList.length] = e;
		}
	});

	/**
	 * ==============================================================================================
	 * searchHoverHandler
	 * set mouseover event handler
	 * @access private
	 * @execute event handler
	 * @return void
	 * ==============================================================================================
	 */
	var searchHoverHandler = function() {
		DOM(this).addClass('sz_section_hover');
	};

	/**
	 * ==============================================================================================
	 * searchHoverOutHandler
	 * set mouseout event handler
	 * @access private
	 * @execute event handler
	 * @return void
	 * ==============================================================================================
	 */
	var searchHoverOutHandler = function() {
		DOM(this).removeClass('sz_section_hover');
	};


	/**
	 * ==============================================================================================
	 * init
	 * initialize this library
	 * @access public
	 * @execute call
	 * @param String m
	 * @return void
	 * ==============================================================================================
	 */
	this.init = function(m) {
		FL.event.exprLive('div#sitemap a.oc', 'click', this.openClose, this);
		contentSize = FL.ut.getContentSize();

		// instance of Layer Module
		layer = new Module.layer(false);
		saving.appendTo();
		mode = m || false;

		// default: dashboard menus
		if (mode === false) {
			customMenu = DOM.create('div').addClass('sz_page_custom_menu')
												.appendTo(document.body)
												.html(customMenuHTML.join('\n'));
			FL.event.set(document, 'click', function (ev) {
				if (ev.target.className === 'ttl') { return; }
				customMenu.hide();
				if (menuTarget) {
					menuTarget.parent().removeClass('menu_current');
				}
				if ( target ) {
					target.removeClass('target');
				}
				menuTarget = null;
			});
			FL.event.set(customMenu, 'click', this.doArrange, this);

			FL.event.exprLive('div#sitemap img.sort_page', 'mousedown', this.sortStart, this);
			DOM('span.ttl').event('click', this.showMenu, this);

			FL.event.set(document, 'click', function(ev) {
				DOM.id('sz_sitemaps').hide();
			});

			// set search event
			DOM.id('sz_sitemap_search_do').event('click', this.doSearch, this);
			DOM.id('toggle_box').event('click', this.toggleTreeSearch, this);
		} else {
			// else, page API ignited
			DOM('span.ttl').event('click', this.setPageCallback, this);
		}
	};

	/**
	 * ==============================================================================================
	 * doSearch
	 * execute search
	 * @access public
	 * @execute call
	 * @return void
	 * ==============================================================================================
	 */
	this.doSearch = function() {
		var suffix = ( mode === 'block' ) ? '_block' : '';
		
		layer.show();
		saving.show();
		FL.ajax.post('ajax/search_page_sitemap' + suffix + '/' + FL.config.item('sz_token'), {
			param : DOM.id('sz_sitemap_page_search_dashboard').serialize(),
			error : function() {layer.show(); saving.show(); alert('ページの検索に失敗しました。');},
			success : function(resp) {
				layer.hide();
				saving.hide();
				DOM.id('sz_sitemap_search_result_box').html(resp.responseText);
				that.toggleTreeSearch(true);
			}
		});
	};

	/**
	 * ==============================================================================================
	 * __setUpSearchedEvent
	 * execute after search completed
	 * @access private
	 * @execute call
	 * @return void
	 * ==============================================================================================
	 */
	this.__setUpSearchedEvent = function() {
		DOM('div#sz_sitemap_search_result_box div.sz_section')
			.event('mouseover', searchHoverHandler)
			.event('mouseout', searchHoverOutHandler)
			.event('click', this.showMenuFromSearch, this);
	};

	/**
	 * ==============================================================================================
	 * __removeSearchedEvent
	 * remove search elements event
	 * @access private
	 * @execute call
	 * @return void
	 * ==============================================================================================
	 */
	this.__removeSearchedEvent = function() {
		DOM('div#sz_sitemap_search_result_box div.sz_section')
		.unevent('mouseover')
		.unevent('mouseout')
		.unevent('click');
	};

	/**
	 * ==============================================================================================
	 * toggleTreeSearch
	 * toggle show tree/search result
	 * @access public
	 * @execute call
	 * @param bool flag
	 * @return void
	 * ==============================================================================================
	 */
	this.toggleTreeSearch = function(flag) {
		var f = FL.ut.isBool(flag);

		DOM.id('sitemap_search_result')[f ? 'show' : 'hide']();
		DOM.id('sitemap')[f ? 'hide' : 'show']();

		if (flag) {
			this.__setUpSearchedEvent();
		} else {
			this.__removeSearchedEvent();
		}
	};

	/**
	 * ==============================================================================================
	 * openClose
	 * open or close subtree
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * ==============================================================================================
	 */
	this.openClose = function(ev) {
		ev.stopPropagation();
		var e = DOM(ev.target), li = e.parent();

		if (e.parent().readAttr('single')) { return; }
		if (e.parent().readAttr('id') === 'page_1' && e.parent().detect('ul').length === 0) { return; }
		if (li.hasClass('ch')) { // directory
			e.addClass('dir_loading');
			if (e.hasClass('close_dir')) { // childs close
				if (li.detect('ul').length === 0) { // no attach
					that._makeChild(li, e);
				} else { // already attached
					Animation.blindDown(li.detect('ul').get(0, true), {speed : 10, easing : 0, callback : function() {
						li.detect('ul').get(0).addStyle('height', 'auto');
						e.replaceClass('close_dir', 'open_dir');
						e.removeClass('dir_loading');
					}});
				}
			} else if (e.hasClass('open_dir')) { // childs open
				Animation.blindUp(li.detect('ul').get(0, true), {mode : 'y', speed : 10, easing : 0, callback : function() {
					e.replaceClass('open_dir', 'close_dir');
					e.removeClass('dir_loading');
				}});
			}
		}
	};

	/**
	 * ==============================================================================================
	 * makeChild
	 * create child page tree from ajax result
	 * @access private
	 * @execute call
	 * @param xElement e
	 * @param xElement arrow
	 * @return void
	 * ==============================================================================================
	 */
	this._makeChild = function(e, arrow) {
		var pid = e.readAttr('id').replace('page_', ''),
			suffix = ( mode === 'block' ) ? '_block' : '',
			len, ttl;

		FL.ajax.get('dashboard/pages/page_list/ajax_get_child' + suffix + '/' + pid, {
			success : function(resp) {
					if (e.last().tag === 'ul') {
						e.last().remove();
					}
					e.append(resp.responseText);
					if (e.last().tag === 'ul') {
						len = e.detect('ul').get(0).children().length;
//						ttl = e.detect('span > span').get(0);
						ttl = e.getOne('span.ttl').first();
						ttl.html('&nbsp;(' + len + ')');
					} else {
						len = 0;
						e.detect('span').get(0).html('');
					}
					Animation.blindDown(e.detect('ul').get(0).addStyle('height', '0px'), {mode : 'y', speed : 10, easing : 0, callback : function() {
						e.detect('span.ttl').event('click', mode ? that.setPageCallback : that.showMenu, that);
						e.detect('ul').get(0).addStyle('height', 'auto');
						that.update();
						if (arrow) { arrow.removeClass('dir_loading').replaceClass('close_dir', 'open_dir'); }
					}});
			}
		});
	};

	/**
	 * ==============================================================================================
	 * showMenu
	 * show tree menu
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * 
	 * ---- link menu list
	 * 0 : visit
	 * 1 : page configure
	 * 2 : create child page
	 * 3 : create external link
	 * 4 : version info
	 * 5 : up to order
	 * 6 : down to order
	 * 7 : copy page
	 * 8 : delete page
	 * ==============================================================================================
	 */
	this.showMenu = function(ev) {
		ev.stopPropagation();
		var ee     = DOM(ev.currentTarget),
			pid     = ee.readAttr('pid'),
			sys     = ee.parent().readAttr('sys'),
			uri     = FL.config.siteUrl(),
			token   = FL.config.item('sz_token'),
			e       = DOM(ev.target),
			isSSL   = !!(e.readAttr('ssl') > 0),
			lis     = DOM.id('sz_sitemaps').detect('li'),
			that    = this,
			current = DOM(ev.target.parentNode),
			isDir   = ee.parent(2).hasClass('ch'),
			pli,
			p,
			json;
			

		if (DOM(ev.target).isExpr('ul.system_page_tree span.ttl')) { return;}
		if (menuTarget) {
			menuTarget.parent().removeClass('menu_current');
			menuTarget = null;
		}
		menuTarget = DOM(ev.target);
		pli = menuTarget.parent(2);

		// Is target page alias or external link?
		if (current.hasClass('alias') || current.hasClass('external')) {
			//lis.getRange(1, lis.length - 1).foreach(function() { DOM(this).hide();});
			lis.foreach(function(num) {
				switch ( num ) {
				case 0:
				case 8:
					DOM(this).show();
					break;
				case 5:
					DOM(this)[pli.isFirst() || pid == 1 ? 'hide' : 'show']();
					break;
				case 6:
					DOM(this)[pli.isLast() || pid == 1 ? 'hide' : 'show']();
					break;
				case 1:
					DOM(this)[current.hasClass('external') ? 'show' : 'hide']();
					break;
				default:
					DOM(this).hide();
				}
			});
		} else {
			lis.getRange(1, lis.length - 2).foreach(function() { DOM(this).show();});
			// target page is movable?
			lis.get(2)[sys > 0 ? 'hide' : 'show']();
			lis.get(5)[pli.isFirst() || pid == 1? 'hide' : 'show']();
			lis.get(6)[pli.isLast() || pid == 1 ? 'hide' : 'show']();
			lis.get(7)[pid == 1 || sys > 0 ? 'hide' : 'show']();
			lis.get(8)[pid == 1 ? 'hide' : 'show']()
		}

		

		DOM.id('sz_sitemaps').attr('target_page_id', pid);
		DOM.id('sz_sitemaps').detect('a').foreach(function(num) {
			var elm = DOM(this);

			switch (num) {
			case 0:
				elm.attr('href', ((isSSL) ? FL.config.item('ssl_siteUrl') : uri) + pid);
				break;
			case 1:
				if ( current.hasClass('external')) {
					elm.attr('href', uri + 'ajax/external_page_config_from_operator/' + pid + '/' + token);
				} else {
					elm.attr('href', uri + 'ajax/page_config_from_operator/' + pid + '/' + token);
				}
				break;
			case 2:
				elm.attr('href', uri + 'ajax/add_page/' + pid + '/' + token);
				break;
			case 3:
				elm.attr('href', uri + 'ajax/add_external_link/' + pid + '/' + token);
				break;			
			case 4:
				elm.attr('href', uri + 'ajax/get_versions/' + pid + '/' + token);
				break;
			case 7:
				elm.attr('href', uri + 'dashboard/pages/page_list/ajax_arrange_copyto_same_level');
				break;
			case 8:
				elm.attr('href', uri + 'dashboard/pages/page_list/delete/' + pid + '/' + token);
				break;
			}
			// num === 7 of copy, connect with ajax
			if (num === 7) {
				elm.unevent('click'); // pre:remove event
				elm.event('click', function(ev) {
					var recursive = false;
					
					ev.stopPropagation();
					ev.preventDefault();
					if (pid === '1') {
						alert('トップページの複製はできません。');
					} else {
						if ( isDir ) {
							recursive = confirm('このページには子ページが含まれます。\n子ページも一緒に複製しますか？');
						}
						layer.show();
						saving.show();
						FL.ajax.post(ev.target.href, {
							error : function() {
								alert('ページの複製に失敗しました。');
							},
							param : {
								from      : pid,
								to        : e.parent(4).readAttr('id').replace('page_', ''),
								token     : token,
								recursive : recursive ? 1 : 0
							},
							success : function(resp) {
								layer.hide();
								saving.hide();
								if (resp.responseText === 'error') {
									alert('ページの複製に失敗しました。');
								} else {
									try {
										json = FL.json.parse(resp.responseText);
										p = e.parent(4);
										e.parent(3).remove();
										that._makeChild(p);
									} catch(e) {
										alert('ページの複製に失敗しました。');
									}
								}
							}
						});
					}
					DOM.id('sz_sitemaps').hide();
				});
			}
		}).rollBack()
		.addStyle({
			top : ev.pageY + (contentSize.height - 100 > ev.clientY ? 10 : -150 ) + 'px',
			left : ev.pageX + 20 + 'px', 'display' : 'block'
		})
		.animate('appear', {
			speed : 10,
			callback : function() { menuTarget.parent().addClass('menu_current');}
		});
	};

	/**
	 * ==============================================================================================
	 * showMenuFromSearch
	 * show menu from searched element
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * ==============================================================================================
	 */
	this.showMenuFromSearch = function(ev) {
		ev.stopPropagation();
		var pid = DOM(ev.target).readAttr('pid'),
			uri = FL.config.siteUrl(),
			token = FL.config.item('sz_token'),
			e = DOM(ev.target),
			lis = DOM.id('sz_sitemaps').detect('li'),
			that = this;

		// target page is alias?
		if (DOM(ev.target).hasClass('alias')) {
			lis.getRange(1, lis.length - 2).foreach(function() { DOM(this).hide();});
		} else {
			lis.getRange(1, lis.length - 2).foreach(function() { DOM(this).show();});
		}
		lis.get(2).hide();
		lis.get(4).hide();
		lis.get(5).hide();
		lis.get(6).hide();
		lis.get(7).hide();

		DOM.id('sz_sitemaps').attr('target_page_id', pid);
		DOM.id('sz_sitemaps').detect('a').foreach(function(num) {
			var elm = DOM(this);

			switch (num) {
			case 0:
				elm.attr('href', uri + pid);
				break;
			case 1:
				elm.attr('href', uri + 'ajax/page_config_from_operator/' + pid + '/' + token);
				break;
			case 3:
				elm.attr('href', uri + 'ajax/get_versions/' + pid + '/' + token);
				break;
			}
		}).rollBack()
		.addStyle({
			top : ev.pageY + (contentSize.height - 100 > ev.clientY ? 10 : -150 ) + 'px',
			left : ev.pageX + 20 + 'px', 'display' : 'block'
		})
		.animate('appear', {speed : 10});
	};

	/**
	 * ==============================================================================================
	 * sortStart
	 * manualy sort method
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * ==============================================================================================
	 */
	this.sortStart = function(ev) {
		target = null;
		ev.stopPropagation();
		ev.preventDefault();
		var e = DOM(ev.target), p = current = e.parent(), wh = p.absDimension();

		dragTarget = p;
		offset.x = wh.left - ev.pageX;
		offset.y = wh.top - ev.pageY;
		placeHolder.html(p.getHTML()).show()
			.addStyle({top : wh.top + 'px', left : wh.left + 'px'});
		FL.event.set(document, 'mousemove', this.startDragging, this);
		FL.event.set(document, 'mouseup', this.dragEnd, this);
	};

	/**
	 * ==============================================================================================
	 * update
	 * sortList update
	 * @access public
	 * @execute call
	 * @return void
	 * ==============================================================================================
	 */
	this.update = function() {
		targetList = [];
		DOM('div#sitemap div.movable, div#sitemap li.sz_page_placeholder')
			.foreach(function() {
				var e = DOM(this);
				
				if ( !e.hasClass('alias') && !(e.readAttr('sys') > 0) ) {
					targetList[targetList.length] = e;
				}
			});
	};

	/**
	 * ==============================================================================================
	 * startDragging
	 * start drag
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * ==============================================================================================
	 */
	this.startDragging = function(ev) {
		ev.preventDefault();
		placeHolder.addStyle({top : ev.pageY + offset.y + 'px', left : ev.pageX + offset.x + 'px'});
		var mouse = {x : ev.pageX, y : ev.pageY},
			t,
			i = -1;
			p = current.parent(3);
		

		while ( targetList[++i] ) {
			t = targetList[i];
			if (FL.ut.mouseInRect(mouse, t) && !t.isSame(current) && !t.parent().isSame(p)) {
				t.addClass('target');
			} else {
				t.removeClass('target').removeClass('placeholder_target');
			}
		}
	};

	/**
	 * ==============================================================================================
	 * dragEnd
	 * stop drag
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * ==============================================================================================
	 */
	this.dragEnd = function(ev) {
		var i = -1,
			t,
			that = this;
			p = current.parent(3),
			mouse = {x : ev.pageX, y : ev.pageY};
		
		// ## notice reference to Class Scope! ##
		// please not add "var" prefix.
		target = null;
	

		while ( targetList[++i] ) {
			t = targetList[i].removeClass('target').removeClass('placeholder_target');
			if (FL.ut.mouseInRect(mouse, t) && !t.isSame(current) && !t.parent().isSame(p)) {
				target = t;
			}
		}
		
		FL.event.remove(document, 'mousemove', this.startDragging);
		FL.event.remove(document, 'mouseup', this.dragEnd);
		placeHolder.hide();
		
		if ( target ) {
			/*
			 * IE need target xElement recognize a few milliseconds...
			 * trick of setTimeout to a few seconds delay. 
			 */
			if ( FL.ua.IE ) {
				setTimeout(function() {
					target.addClass('target');
					that.pageCustom();
				}, 10);
			/*
			 * Else browser is OK.
			 * call function.
			 */
			} else {
				target.addClass('target');
				this.pageCustom();
			}
		}
	};

	/**
	 * ==============================================================================================
	 * pageCustom
	 * show page configure menu
	 * @access public
	 * @execute call
	 * @return void
	 * ==============================================================================================
	 */
	this.pageCustom = function() {
		if (!target || current === target) {
			return;
		}

		var dim = target.absDimension(),
			sys = current.readAttr('sys');
		
		customMenu.addStyle({top : dim.top + 10 + 'px', left : dim.left + 10 + 'px'});
		customMenu.detect('li').get(2)[sys > 0 ? 'hide' : 'show']();
		Animation.appear(customMenu, {speed : 20});
	};

	/**
	 * ==============================================================================================
	 * doArrange
	 * page arrange control
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * ==============================================================================================
	 */
	this.doArrange = function(ev) {
		ev.stopPropagation();
		var method = ev.target.className,
			from  = current.readAttr('pid'),
			to    = target.readAttr('pid'),
			that  = this,
			p     = target.parent(),
			isDir = current.parent().hasClass('ch'),
			recursive = false;

		if (/moveto|copyto|aliasto/.test(method) === false || from === to ) {
			return;
		}
		layer.show();
		saving.show();
		if ( method === 'copyto' && isDir ) {
			recursive = confirm('コピー元ページには子ページがあります。\n子ページもコピーしますか？');
		}
		FL.ajax.post(FL.config.siteUrl() + 'dashboard/pages/page_list/ajax_arrange_' + method, {
			param : {
				from      : from,
				to        : to,
				token     : FL.config.item('sz_token'),
				recursive : ( recursive ) ? 1 : 0
			},
			success : function(resp) {
				layer.hide();
				saving.hide();
				if ( method === 'aliasto' && resp.responseText === 'already' ) {
					alert('設定先にはエイリアスが存在しています。');
					DOM('div.target').removeClass('target');
				} else {
					that.__after(current, target);
				}
				customMenu.animate('fade', {speed :30, easing : 100, afterHide : true});
			},
			error : function() {
				layer.hide();
				saving.hide();
				alert('ページの変更に失敗しました。');
			}
		});
	};


	/**
	 * ==============================================================================================
	 * after
	 * page arranged after calller method
	 * @access private
	 * @execute call
	 * @param xElement current
	 * @param xElement target
	 * @return void
	 * ==============================================================================================
	 */
	this.__after = function(current, target) {
		var cpParent = current.parent(3), tpParent = target.parent(),
			cpid = cpParent.readAttr('id').replace('page_', ''),
			tpid = tpParent.readAttr('id').replace('page_', '');

		this.refreshSitemap(cpid, tpid);
	};

	/**
	 * ==============================================================================================
	 * refreshSitemap
	 * refresh all tree and re:attach evetns
	 * @access public
	 * @execute call
	 * @param Number a
	 * @param Number b
	 * @return void
	 * ==============================================================================================
	 */
	this.refreshSitemap = function(a, b) {
		var that = this;

		DOM('span.ttl').unevent('click');
		FL.ajax.post('dashboard/pages/page_list/refresh/' + FL.config.item('sz_token'), {
			param : {open : (a || 0) + '|' + (b || 0)},
			success : function(resp) {
				DOM.id('sitemap').html(resp.responseText);
				DOM('span.ttl').event('click', mode ? that.setPageCallback : that.showMenu, that);
				that.update();
			},
			error : function() {
				alert('サイトマップの更新に失敗しました。');
			}
		})
	};

	/**
	 * ==============================================================================================
	 * deleteCurrent
	 * delete current selected page
	 * @access public
	 * @execute call
	 * @param String href
	 * @return void
	 * ==============================================================================================
	 */
	this.deleteCurrent = function(href) {
		if (!menuTarget) { return; }
		var that = this, cnt;

		if (!confirm('ページを削除します。よろしいですか？\n（子ページが存在する場合、再帰的に削除されます）\n※この操作は元に戻せません！')) {
			DOM.id('sz_sitemaps').hide();
			menuTarget.parent().removeClass('menu_current');
			menuTarget = null;
			return;
		}
		layer.show();
		saving.show();
		FL.ajax.get(href, {
			success : function(resp) {
				layer.hide();
				saving.hide();
				var num;

				if (resp.responseText !== 'complete') { alert('ページの削除に失敗しました。'); }
				DOM.id('sz_sitemaps').hide();
				menuTarget.parent(2).animate('fade', {speed : 40, callback : function() {
					menuTarget.parent(2).hide();
					menuTarget.parent(3).addStyle('height', 'auto');
					cnt = menuTarget.parent(4).detect('span').get(1);
					cnt.html(cnt.getHTML().replace(/\(([0-9+])\)/, function(match) {
						num = match.replace(/[\(|\)]/g, '');
						num = parseInt(num, 10) - 1;
						if (num > 0) {
							return '(' + num + ')';
						} else {
							if (menuTarget.parent(4).readAttr('id') !== 'page_1') {
								menuTarget.parent(4)
											.getOne('img')
											.attr('src', FL.config.baseUrl() + 'images/dashboard/file.png')
											.rollBack()
											.getOne('a').remove();
							}
							menuTarget.parent(4).getOne('ul').remove();
							return '';
						}
					}));
					menuTarget.parent(2).remove();
					menuTarget = null;
				}});
			},
			error : function() { alert('ページの削除に失敗しました。'); }
		});
	};

	/**
	 * ==============================================================================================
	 * movePageLevel
	 * ajax sort page display orders
	 * @access public
	 * @execute call
	 * @param bool isU
	 * @return void
	 * ==============================================================================================
	 */
	this.movePageLevel = function(isU) {
		var li = menuTarget.parent(2),
			to = li[isU ? 'prev' : 'next'](),
			master = li.parent(), order = [];

		if (!to) { return; }
		layer.show();
		saving.show();
		if (isU) {
			li.appendTo(to, 'before');
		} else {
			to.appendTo(li, 'before');
		}

		// build order params
		master.children().foreach(function(num) {
			order.push(this.id.replace('page_', '') + ':' + (num + 1));
		});

		// sort order
		FL.ajax.post('dashboard/pages/page_list/sort_display_order/' + FL.config.item('sz_token'), {
			param : {
				master : master.parent().readAttr('id').replace('page_', ''),
				order : order
			},
			error : function() {
				layer.hide();
				saving.hide();
				alert('ページ順の変更に失敗しました。')
			},
			success : function(resp) {
				layer.hide();
				saving.hide();
				if (resp.responseText === 'complete') {
					if (isU) {
						li.appendTo(to, 'before');
					} else {
						to.appendTo(li, 'before');
					}
					DOM.id('sz_sitemaps').hide();
					menuTarget.parent().removeClass('menu_current');
					menuTarget= null;
				}
			}
		});
	};

	this.setPageCallback = function() {
		return;
	};
	
	this.checkPagePathExists = function(path, pid) {
		if ( ! infoElement) {
			infoElement = DOM.create('div').attr('id', 'sz_info_frame')
								.addStyle('height', '0px')
								.appendTo()
								.addStyle('position', 'fixed');
		}
		FL.ajax.post('ajax/check_page_path_exists/' + FL.config.item('sz_token'), {
			param : { path : path , page_id : pid },
			error : function() { alert('通信に失敗しました。'); },
			success : function(resp) {
				infoElement.html(resp.responseText);
				new Animation(infoElement, {
					height : 50
				}, {
					speed : 10,
					callback : function() {
						setTimeout(function() {
							new Animation(infoElement, {
								height : 0
							}, {
								speed : 10
							});
						}, 3000);
					}
				});
			}
		});
	};
});
