/**
 * ==========================================================================================================
 *
 * Seezoo page Controller
 *
 * manage page edit/arrange
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 *
 * ==========================================================================================================
 */

ClassExtend( 'Controller', function PageController(){

	// local variables
	var timer,
		targetArea,
		doc           = document,
		isBlockMenu   = false,
		deleteStack   = [],
		arrangeStack  = null,
		that          = this,
		editEventType = 'dblclick';

	this.subOpen         = false;
	this.customCSSOpen   = false;
	this.editBlocks      = null;
	this.current         = null;
	this.menuTarget      = null;
	this.menuCurrent     = null;
	this.menuShow        = false;
	this.isPreview       = false;
	this.isArrange       = false;
	this.isDelete        = false;
	this.viewModeElement = null;
	this.modeState;

	window.SZ_PO_INITED        = false;
	window.SZ_ADDBLOCK_ENABLED = true;
	/**
	 * =======================================================================================================
	 * constructor
	 * @access public
	 * this method called before DOM ready.
	 * =======================================================================================================
	 */
	this.__construct = function(){
		this.load.module(['ui', 'layer']);
		this.load.model('page_model');
		this.load.library(['page_operator', 'editor', 'gadget', 'sz_calendar', 'file_operator']);
		this.load.helper('cookie');
		this.load.ajax();
	};

	/**
	 * =======================================================================================================
	 * view
	 * set up edit/arrange/preview and more events
	 * @access public
	 * @execute routing
	 * =======================================================================================================
	 */
	this.view = function(){
		// if not login, not to do.
		if ( this.config.item('is_login') === false ) {
			return;
		}

		var that = this, // capture this scope
			sortHandle,
			relationElm;

		this.blockMenu     = DOM.id('sz_block_edit_menu');
		this.blockMenuList = ( this.blockMenu ) && this.blockMenu.detect('li');
		this.layer         = new Module.layer(false);
		this.subPP         = DOM.id('sz_sub_pp');
		// block moving status
		this.saving        = DOM.create('div')
								.attr('id', 'sz_saving')
								.appendTo(doc.body)
								.addStyle('position', 'fixed');
				
		// IE6 fix
		if ( this.ua.IE6 ) {
			this.subPP.addStyle('position', 'fixed');
			if ( doc.getElementById('sz_dsp_form') ) {
				DOM.id('sz_dsp_form').addStyle('position', 'fixed');
			}
			DOM('div.cmsi_edit_block')
				.foreach(function() {
					DOM(this).addStyle('width', DOM(this).prop('offsetWidth') - 16 + 'px');
				});
			DOM('div.sz_block_overlay')
				.foreach(function() {
					var e = DOM(this);
	
					e.addStyle({
						height : e.parent().prop('offsetHeight') - 4 + 'px',
						width  : e.parent().prop('offsetWidth') + 'px'
					});
				});
		}

		// build file API event (live stack)
		this.setUpAPIHandle();

		this.event.set(doc, 'keydown', function(ev) {
			/*if (ev.keyCode == 70 && ev.ctrlKey === true) {
				ev.preventDefault();
				this.toggleMenu();
			} else */
			if ( ev.keyCode == 69 && ev.ctrlKey === true ) {
				// stack rollBack
				ev.preventDefault();
				this.editRollBack();
			} else if ( ev.keyCode == 77 && ev.ctrlKey === true ) {
				// reset menu position
				this.menu.addStyle({
					top  : '100px',
					left : '100px'
				});
				Helper.setCookie({ x : 100, y : 100 });
			}
		}, this);

		// start added blocks edit or add events
		this.editBlocks = DOM('div.cmsi_edit_block')
								.Cevent('mouseover', this.setBlockOverlay)
								.Cevent('mouseout', this.hideBlockOverlay)
								.foreach(function() {
									if ( DOM(this).hasClass('cmsi_add_block') ) {
										DOM(this)
											.last()
											.event('click', function(ev) {
												that.menuTarget = DOM(this);
												that.showAddMenu(DOM(this).prev().getText());
											});
									}
								});

		if ( this.blockMenu ) {
			this.blockMenu.event('mouseout', function(ev) {
				if ( ev.target === this ) {
					DOM(this).hide();
				}
			});
			DOM('a.sz_block_etc_menu')
				.Cevent('mouseover', this.__showBlockMenu)
				.Cevent('mouseout', this.__hideBlockMenu)
				.event('mousedown', function(ev) {
					ev.stopPropagation();
				});
		}

		DOM('div.sz_block_overlay')
			.Cevent(editEventType, function(ev) {
				// popup menu code here
				var e = DOM(ev.target),
					bid   = e.readAttr('block_id'),
					cname = e.readAttr('collection_name');
				
				this.menuTarget = e.parent();
				if ( this.menuTarget.hasClass('sz_disable_edit') && ! this.isDelete ) {
					alert('このブロックは編集できません。');
					this.menuTarget = null;
					return;
				} else if ( this.menuTarget.hasClass('sz_disable_delete') && this.isDelete ) {
					alert('ブロックを削除する権限がありません。');
					this.menuTarget = null;
					return;
				}
				if ( this.isDelete === false ) {
					this.editPopup(bid, cname);
				} else {
					this.tryDelete(bid, cname);
				}
			})
			.event('mousedown', function(ev) {
				ev.stopPropagation();
			});

		DOM('a.sz_block_delete')
			.Cevent('click', function(ev) {
				// delete confirm code here
				var e = DOM(ev.target);
				
				this.menuTarget = e.parent(3);
				this.tryDelete(e.readAttr('block_id'), e.readAttr('rel'));
			})
			.event('mousedown', function(ev) {
				ev.stopPropagation();
			});

		// set property of menu element
		this.menu = DOM('div.cmsi_menu').get(0);

		// model is ready, create menu, gadget, and some event
		this.ready('page_model', function() {
			if ( that.blockMenu ) {
				that.blockMenu
					.getOne('a.sz_block_to_draft')
					.Cevent('click', function(ev) {
						var e = DOM(ev.target).parent(3);
						
						this.page_model.blockToDraft(e.readAttr('block_id'), e.readAttr('cname'));
					});

				that.blockMenu
					.getOne('a.sz_block_custom_template')
					.Cevent('click', function(ev) {
						var e = DOM(ev.target).parent(3),
							bid  = e.readAttr('block_id'),
							sbid = e.readAttr('slave_id');
						
						this.page_model.setCustomTemplate(( sbid > 0 ) ? sbid : bid, e.readAttr('cname'));
					});
				that.blockMenu
					.getOne('a.sz_block_permission')
					.Cevent('click', function(ev) {
						var e = DOM(ev.target).parent(3),
							bid  = e.readAttr('block_id'),
							sbid = e.readAttr('slave_id');
						
						this.page_model.setBlockPermission(( sbid > 0 ) ? sbid : bid, e.readAttr('cname'));
					});
				that.blockMenu
					.getOne('a.sz_block_to_static')
					.Cevent('click', function(ev) {
						var e = DOM(ev.target).parent(3);
						
						this.page_model.addStaticBlock(e.readAttr('block_id'), e.readAttr('cname'));
					});
				
				// add blockset
				that.blockMenu
					.getOne('a.sz_block_to_blockset')
					.Cevent('click', function(ev) {
						var e = DOM(ev.target).parent(3);
						
						this.page_model.addBlockSet(e.readAttr('block_id'), e.readAttr('cname'));
					});
			}
			this.setUpMenu();
			this.createGadget();
			this.event.exprLive('input.page_submit', 'click', this.page_model.checkPageConfig, this.page_model);
		});

		// module is ready, set sortable event
		Module.ready('ui', function() {
			var child = [],
				defaults = [];
			
			sortHandle = new Module.sortable({
				sortClass   : 'sz_sortable',
				handleClass : 'sz_block_overlay',
				animate     : !(that.ua.IE && !that.ua.IE9),
				//dropParentClass : 'cmsi_arrange_block_master',
				callback    : function(elm) {
					that.layer.show();
					that.saving.show();
					that.page_model.doArrange();
					that.ua.IE6 && that.__recalulate(DOM(this));
					
					if ( relationElm ) {
						relationElm.appendTo(this, 'after').show();
					}
				},
				sortStart   : function(e) {
					var n = DOM(e).next();
					
					if ( ! DOM(e).hasClass('sz_arrange_mode')) {
						return false;
					}
					
					relationElm = ( n && ! n.hasClass('sz_content_blocks') && ! n.hasClass('cmsi_add_block')) 
					               ? n.hide()
					               : null;
				},
				judge       : function(e, point) {
					var next = DOM(e).next();
					
					return ( next && ! next.hasClass('sz_content_blocks')
							  || DOM(e).hasClass('cmsi_add_block') && point === 'after') ? false : true;
				}
			});
			new Module.draggable(that.menu, {
				handle   : that.menu.getOne('div.sz_menu_rad_top'),
				callback : function() {
					Helper.setCookie({
						x : that.menu.readStyle('left', true),
						y : that.menu.readStyle('top', true)
					});
				}
			});
			new Module.draggable(that.menu, {
				handle   : that.menu.getOne('div.sz_menu_rad_bottom'),
				callback : function() {
					Helper.setCookie({
						x : that.menu.readStyle('left', true),
						y : that.menu.readStyle('top', true)
					});
				}
			});
			
			// sort target by primary child
			sortHandle.sortTargetList.foreach(function() {
				DOM(this).detect('div.' + sortHandle.opt.sortClass)
							.foreach(function() {
								child[child.length] = this;
							});
				if ( !that.ut.inArray(this, child) ) {
					defaults[defaults.length] = this;
				}
			});
			sortHandle.sortTargetList = DOM(child.concat(defaults));
		});

		if ( this.config.item('is_edit') === true ) {
			this.page_model.setPageUnload();
		}

		// Can you unlock edit mode?
		if ( DOM.id('sz_edit_timeout_link') ) {
			setTimeout(function() {
				DOM.id('sz_edit_timeout_link').animate('blindDown', { speed : 20 });
			}, 500);
		}

		// checking page path exists
		this.event.exprLive('a#check_exists', 'click', function(ev) {
			var p = DOM.id('sz_input_page_path'),
				parentPath = that.ut.trim(p.prev().getHTML()),
				pid        = ev.target.rel;
			
			if ( p.getValue() === '' ) {
				return alert('ページパスが入力されていません。');
			}
			that.page_operator.checkPagePathExists(parentPath + p.getValue(), pid);
		});
	};

	/**
	 * recalculate for IE6
	 */
	this.__recalulate = function(e) {
		var p = e.parent(),
			w;

		// CSS trick - get default width
		e.addStyle('width', 'auto');
		w = p.prop('offsetWidth');
		e.addStyle('width', w - 10 + 'px');
		e.getOne('div.sz_block_overlay')
			.addStyle('height', '100%');
	}

	this.__showBlockMenu = function(ev) {
		var e = DOM(ev.currentTarget),
			pos = e.parent().absDimension();

		this.menuTarget = e.parent();
		
		// hide some menu if menuTarget block is slaved.
		if ( this.menuTarget.readAttr('slave_id') > 0 ) {
			this.blockMenuList.get(0).hide();
			this.blockMenuList.get(3).hide();
		} else {
			this.blockMenuList.get(0).show();
			this.blockMenuList.get(3).show();
		}
		
		this.blockMenu
			.addStyle({
				left    : pos.right - 124 + 'px',
				top     : pos.top + 2 + 'px',
				display : 'block'
			})
			.attr({
				block_id : this.menuTarget.readAttr('block_id'),
				cname    : this.menuTarget.readAttr('block_type'),
				slave_id : this.menuTarget.readAttr('slave_id')
			});
	};

	this.__hideBlockMenu = function(ev) {
		ev.stopPropagation();
	}

	/**
	 * =======================================================================================================
	 * setBlockOverlay
	 * show layer and menu on edit target block
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * =======================================================================================================
	 */
	this.setBlockOverlay = function(ev) {
		var e;
			
		ev.stopPropagation();
		if ( this.isPreview === true ) {
			return;
		}
		this.currentLayer && this.currentLayer.hide();
		this.currentMenu  && this.currentMenu.hide();
		
		e = DOM(ev.currentTarget);
		
		if ( ( e.hasClass('sz_disable_edit') && ! this.isArrange && ! this.isDelete ) /* edit mode and disable */
		     || ( e.hasClass('sz_disable_delete') && this.isDelete ) /* delete mode and disable */) {
			return;
		}

		this.current      = e;
		this.currentLayer = ( e.hasClass('cmsi_add_block') ) ? e.last() : e.first();
		this.currentMenu  = e.first().next();

		this.currentLayer.show();
		this.currentMenu
			&& ( ! this.isArrange && ! this.isDelete )
			&& this.currentMenu.hasClass('sz_block_etc_menu')
			&& this.currentMenu.show();
	};

	/**
	 * =======================================================================================================
	 * hideBlockOverlay
	 * hide layer and menu
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * =======================================================================================================
	 */
	this.hideBlockOverlay = function(ev){
		var e, layer, menu;
		
		ev.stopPropagation();
		if (DOM('div.sz-popup-content').length > 0 || isBlockMenu === true) { return; }

		e     = DOM(ev.currentTarget);
		layer = (e.hasClass('cmsi_add_block')) ? e.last() : e.first();
		menu  = e.first().next();
		
		layer.hide();
		menu && menu.hasClass('sz_block_etc_menu') && menu.hide();
		this.blockMenu && this.blockMenu.hide();
		this.current = null;
	};

	/**
	 * =======================================================================================================
	 * showAddMenu
	 * show add block menu
	 * @access public
	 * @execute call
	 * @param String target
	 * =======================================================================================================
	 */
	this.showAddMenu = function(target) {
		window.SZ_ADDBLOCK_ENABLED = true;
		var that = this,
			enc        = window.encodeURIComponent,
			pp         = Helper.createDOMWindow(target + 'にブロックを追加します', '', 700, '90%'),
			targetArea = target,
			li, ipts, links, toggles;

		this.ajax.get('ajax/add_block/block_list/' + enc(target) + '/' + SZ_PAGE_ID + '/' + this.config.item('sz_token'), {
			error   : function() { alert('エラーが発生しました。'); },
			success : function(resp) {
				if ( resp.responseText === that.config.item('AjaxErrorString') ) {
					return alert('アクセスが拒否されました。');
				}
				pp.setContent(resp.responseText);
				li      = pp.body.detect('ul.sz_block_list > li');
				toggles = pp.body.detect('ul.sz_block_list a.toggle');
				ipts    = pp.body.detect('input[type=submit], input[type=button]')
								.foreach(function(){
									this.disabled = true;
								});
				links   = pp.body.detect('div.tab_content a')
								.event('click', function(ev){
									ev.preventDefault();
								});
				
				li.event('mouseover', function() {
						var e = DOM(this).addStyle('backgroundColor', '#ffc');
						
						if ( e.last() && e.last().tag === 'div' ) {
							e.last().show();
						}
					})
					.event('mouseout', function() {
						var e = DOM(this).addStyle('backgroundColor', '#fff');
						
						if ( e.last() && e.last().tag === 'div' ) {
							e.last().hide();
						}
					})
					.event('click', function(ev) {
						var e = DOM(this),
							p = e.parent(),
							uris = [
					               '',
					               SZ_PAGE_ID,
					               e.readAttr('bid'),
					               enc(target),
					               that.config.item('sz_token')
					                ];
						
						// if parent has draft class, then add duplicated data
						if ( p.hasClass('draft') ) {
							that.page_model.setUnloadFlag(true);
							uris[0] = that.config.siteUrl() + 'page/addblock_from_draft';
							uris[2] = e.readAttr('did');
							location.href = uris.join('/');
						} else if (p.hasClass('static')) {
							that.page_model.setUnloadFlag(true);
							uris[0] = that.config.siteUrl() + 'page/addblock_from_static';
							location.href = uris.join('/');
						} else if (p.hasClass('blockset')) {
							that.page_model.setUnloadFlag(true);
							uris[0] = that.config.siteUrl() + 'page/addblock_from_blockset';
							location.href = uris.join('/');
						} else {
							that.multiplePopup(e, targetArea);
						}
					});
				toggles.event('click', function(ev) {
					ev.stopPropagation();
					var p = DOM(this).prev();
					
					p[p.isHidden() ? 'show' : 'hide']();
				});
				// remove event on close
				pp.setOnClose(function() {
					li.unevent('mouseover').unevent('mouseout').unevent('click');
					ipts.unevent('click');
					links.unevent('click');
					toggles.unevent('click');
					that.menuTarget.hide();
				});
				// set tab changer
				that.page_model.tabChange();
			}
		});
	};

	/**
	 * =======================================================================================================
	 * createGadget
	 * create gadget DOM element
	 * @access public
	 * @execute call
	 * =======================================================================================================
	 */
	this.createGadget = function() {
		if ( ! this.config.item('is_login') ) {
			return;
		}
		this.showGadget         = false;
		this.globalLoadedGadget = false;
		this.gadgetMenu         = DOM.create('div')
										.attr('id', 'sz_gadget')
										.appendTo(window['IEFIX'] ? IEFIX.body : doc.body)
										.addStyle('position', 'fixed');
		this.gadgetArea         = DOM.create('div')
										.addClass('sz_gadget_area')
										.appendTo(window['IEFIX'] ? IEFIX.body : doc.body)
										.addStyle('position', 'fixed');
		this.gadgetContent      = DOM.create('div')
										.attr('id', 'gadget')
										.appendTo(this.gadgetArea);
		this.gadgetMenu.Cevent('click', this.toggleGadget);
		
		if ( ! this.ua.IE ) {
			this.gadgetMenu.event('mouseover', function() {
				DOM(this).addStyle('opacity', 1);
			})
			.event('mouseout', function() {
				DOM(this).addStyle('opacity', 0.5);
			});
		}
	};

	/**
	 * =======================================================================================================
	 * setUpMenu
	 * set up menu event
	 * @access public
	 * @execute call
	 * =======================================================================================================
	 */
	this.setUpMenu = function() {
		if ( ! this.config.item('is_login') ) {
			return;
		}

		var that = this,
			menuHide = false;

		this.menuContent = this.menu.getOne('div#sz_menu_wrapper');
		this.modeState   = this.menu.getOne('p.mode_state');

		// append token
		DOM('a.sz_zoom').foreach(function() {
			this.href += '/' + that.config.item('sz_token');
		});

		this.menu.getOne('a#sz_edit_menu_close')
			.event('click', function(ev) {
				ev.preventDefault();
				if ( that.menuContent.isAnimate() ) {
					return;
				}
				if ( menuHide === false ) {
					that.menuContent.animate('blindUp', {
						speed  : 30,
						easing : 30,
						to     : 29
					});
				} else {
					that.menuContent.animate('blindDown', {
						from     : 29,
						speed    : 30,
						easing   : 30,
						callback : function() {
							that.menuContent.addStyle('overflow', '');
						}
					});
				}
				menuHide = !menuHide;
		});

		this.menu.detect('ul#sz_menu_tools li')
			.event('mouseover', function(ev) {
				DOM(this).last()[ev.target.tagName !== 'DIV' ? 'show' : 'hide']();
			}).event('mouseout', function() {
				DOM(this).last().hide();
			});
		
		// popup namespace exists?
		if ( document.getElementById('sz_block_draft_static_namespace') ) {
			this.namePP = DOM.id('sz_block_draft_static_namespace')
								.addStyle('position', 'fixed'); // touch position
			this.namePP.getOne('form').event('submit', function() {
				return false;
			});
			this.namePP.getOne('a').event('click', function() {
				DOM(this).parent().hide();
				that.layer.hide();
				DOM(this).getOne('button').unevent('click');
			});
		}

		// addpage link is exists?
		if ( doc.getElementById('sz_addpage') || doc.getElementById('sz_pageconfig') || DOM('a.sz_zoom').length > 0 ) {
			Module.ready('ui', function() {
				new Module.zoom('sz_zoom', 'ajax', {
					width        : 700,
					height       : 500,
					openCallback : function() {
						var e = DOM(this);
						
						if ( e.hasClass('sz_pc') || this.id === 'sz_addpage' ) {
							that.page_model.tabChange();
							if ( this.id === 'sz_pageconfig' ) {
								DOM.id('sz-page_add_form').event('submit', function() {
									that.page_model.setUnloadFlag(true);
								});
							}
						} else if ( e.hasClass('sz_pv') ) {
							that.page_model.pv_init();
						}
						if ( DOM.byName('public_ymd').length > 0 ) {
							that.sz_calendar.initialize({
								template  : 'sz_calendar',
								yearRange : 'current-current+2'
							});
							that.sz_calendar.setUp(DOM.byName('public_ymd').get(0));
						}
					},
					closeCallback : function() {
						// guard calendar hide
						if ( DOM.id('fl_calendar') ) {
							DOM.id('fl_calendar').hide();
						}
					}
				});
			});
		}

		// delpage link is exists?
		if ( doc.getElementById('sz_delpage') ) {
			var del = DOM.id('sz_delpage');

			del.attr('href', del.readAttr('href') + '/' + this.config.item('sz_token'))
				.event('click', function(ev) {
				if ( SZ_PAGE_ID === 1 ) {
					ev.preventDefault();
					return alert('トップページは削除できません！');
				} else if ( ! confirm('このページを削除します。本当によろしいですか？') ) {
					ev.preventDefault();
					return;
				}
				that.page_model.setUnloadFlag(true);
			});
		}

		// check_sitemap is exists?
		if ( doc.getElementById('sz_sitemap') ) {
			DOM.id('sz_sitemap').event('click', this.page_model.showSubPopup, this.page_model);
		}
		// set sub_pp close event
		if ( this.subPP ) {
			DOM.id('sz_sub_pp_close').event('click', this.page_model.hideSubPopup, this.page_model);
		}

		// submit page out exists?
		if ( doc.getElementById('sz_dsp_close') ) {
			DOM.id('sz_dsp_close').event('click', this.page_model.toggleEdit, this.page_model);
		}

		// custom_css exists?
		if ( doc.getElementById('custom_css') ) {
			DOM.id('custom_css').event('click', this.page_model.toggleCSS, this.page_model);
		}

		// close custom css exists?
		if ( doc.getElementById('sz_ac_close') ) {
			DOM.id('sz_ac_close').event('click', this.page_model.toggleCSS, this.page_model);
			DOM.id('sz_ac_submit').event('click', this.page_model.updateAdvanceCSSBackend, this.page_model);
		}
		
		// preview model is exists?
		if ( doc.getElementById('edit_preview') ) {
			DOM.id('edit_preview').event('click', this.page_model.togglePreview, this.page_model);
		}

		// edit _out?
		if ( doc.getElementById('sz_edit_out') ) {
			DOM.id('sz_edit_out').event('click', this.page_model.toggleEdit, this.page_model);
		}

		// arrange_mode?
		if ( doc.getElementById('arrange_mode') ) {
			DOM.id('arrange_mode').event('click', this.page_model.setArrangeMode, this.page_model);
		}
		
		// delete mode?
		if ( doc.getElementById('sz_block_delete_mode') ) {
			DOM.id('sz_block_delete_mode').event('click', this.page_model.setDeleteMode, this.page_model);
		}
		
		// change viewmode?
		if ( doc.getElementById('sz_change_viewmode') ) {
			DOM.id('sz_change_viewmode').event('click', this.page_model.changeViewMode, this.page_model);
		}

		// default jump!
		DOM('ul.manage a').event('click', function(ev) {
			if ( window.isEdit === false
					|| ev.currentTarget.className !== 'sz_menu_logout' ) {
				this.page_model.setUnloadFlag(true);
			}
		}, this);

		if ( doc.getElementById('to_edit') ) {
			DOM.id('to_edit').event('click', function(ev) {
				ev.preventDefault();
				this.page_model.setUnloadFlag(true);
				// submit previous hidden form
				DOM(ev.currentTarget).prev().method('submit');
			}, this);
		}
	};

	/**
	 * =======================================================================================================
	 * multiplePopup
	 * create more DOMWindow and set Content
	 * @access public
	 * @execute call
	 * @param xElement e
	 * =======================================================================================================
	 */
	this.multiplePopup = function(e, area) {
		window.SZ_ADDBLOCK_ENABLED = true;
		var att = e.readAttr('class'),
			tt   = e.readAttr('cname'),
			that = this,
			enc  = window.encodeURIComponent,
			pp   = Helper.createDOMWindow(e.get().firstChild.nodeValue, '', e.readAttr('ifw'), e.readAttr('ifh')),
			res, d, ttl;
			
		this.ajax.get('ajax/set_block/' + att.slice(att.indexOf('_') + 1) + '/' + SZ_PAGE_ID + '/' + enc(area) + '/' + this.config.item('sz_token'), {
			success : function (resp) {
				res = that.json.parse(resp.responseText);
				// css is exists?
				if ( res.css && ! that.__fileAlready('link', res.css) ) {
					DOM.create('link').attr({
						type : 'text/css',
						rel  : 'stylesheet',
						href : that.config.baseUrl() + res.css
					})
					.appendTo(doc.getElementsByTagName('head')[0]);
				}
				
				d = doc.createElement('div');
				d.innerHTML = res.content;
				pp.setContent(d.firstChild);

				// if target block is textcontent, create textarea and set up editor
				if ( tt == 'textcontent' ) {
					ttl    = doc.createElement('textarea');
					ttl.id = 'sz_block_textcontent_body';
					ttl.setAttribute('name', 'body');
					DOM.id('textcontent-editor-area').append(ttl);
					that.editor.setUp(ttl, { emoji : true });

					pp.setOnClose(function() {
						DOM.id('sz-blockform-submit')
							.getOne('a.button_right')
							.unevent('click');
					}, true);
				}
				
				// javascript is exists?
				if ( res.js ) {
					DOM.create('script').attr({
						type : 'text/javascript',
						src  : that.config.baseUrl() + res.js
					})
					.appendTo(doc.getElementsByTagName('head')[0]);
				}
			}
		});
	};

	/**
	 * =======================================================================================================
	 * editPopup
	 * create DOMWindow for edit block
	 * @access public
	 * @execute call
	 * @param Number id
	 * @param String type
	 * =======================================================================================================
	 */
	this.editPopup = function(id, type) {
		var pp = Helper.createDOMWindow('編集', '', this.menuTarget.readAttr('ifw'), this.menuTarget.readAttr('ifh')),
			that = this,
			res, ttl;
		
		this.ajax.get('ajax/edit_block/' + id + '/' + SZ_PAGE_ID + '/' + this.config.item('sz_token'), {
			success : function(resp) {
				res = that.json.parse(resp.responseText);
				
				// css is exists?
				if ( res.css && ! that.__fileAlready('link', res.css) ) {
					DOM.create('link').attr({
						type : 'text/css',
						rel  : 'stylesheet',
						href : that.config.baseUrl() + res.css
					})
					.appendTo(doc.getElementsByTagName('head')[0]);
				}
				
				pp.setContent(res.content);
				pp.setOnClose(function() {
					that.menuTarget.first().hide().next().hide();
				}, true);
				
				if ( type == 'textcontent' ) {
					ttl       = doc.createElement('textarea');
					ttl.id    = 'sz_block_textcontent_body';
					ttl.name  = 'body';
					ttl.value = DOM.id('tt-body').getHTML();
					DOM.id('textcontent-editor-area').append(ttl);
					that.editor.setUp(ttl, {emoji : true});
					
					pp.setOnClose(function() {
						DOM.id('sz-blockform-submit')
							.getOne('a.button_right')
							.unevent('click');
					});
				}
				
				// javascript is exists?
				if ( res.js ) {
					DOM.create('script').attr({
						type : 'text/javascript',
						src  : that.config.baseUrl() + res.js
					})
					.appendTo(doc.getElementsByTagName('head')[0]);
				}
			}
		});
	};

	/**
	 * =======================================================================================================
	 * tryDelete
	 * delete block
	 * @access public
	 * @execute call
	 * @param Number id
	 * @param String type
	 * =======================================================================================================
	 */
	this.tryDelete = function(id, type) {
		if ( ! confirm('このブロックを削除します。よろしいですか？') ) {
			return;
		}
		var that = this;

		this.ajax.get('ajax/delete_block/' + id + '/' + type + '/' + this.config.item('sz_token'), {
			error   : function() {
				alert('リクエストエラーが発生しました。');
			},
			success : function(resp) {
				var relE;
				
				if ( resp.responseText === 'complete' ) {
					relE = ( that.menuTarget.detect('div.overlay-short').length > 0 )
					          ? that.menuTarget.next()
					          : null;
					deleteStack.push({
						block_id : id,
						type     : type,
						element  : that.menuTarget,
						method   : 'delete'
					});
					that.menuTarget.animate('fade', {
						speed    : 40,
						easing   : 100,
						callback : function() {
							that.menuTarget.hide();
							that.menuTarget = null;;
						}
					});
					relE && relE.animate('fade', {
						speed  : 40,
						easing : 100
					});
				}
			}
		});
	};

	/**
	 * =======================================================================================================
	 * toggleMenu
	 * catch Event menu hide or show
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * =======================================================================================================

	this.toggleMenu = function(ev) {
		this[(this.menuShow) ? 'hideMenu' : 'activeMenu']();
	};
	*/

	/**
	 * =======================================================================================================
	 * togleGadget
	 * catch Event Gadget hide or show
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * =======================================================================================================
	 */
	this.toggleGadget = function(ev) {
		this[( this.showGadget ) ? 'hideGadget' : 'activeGadget']();
		this.showGadget = !this.showGadget;
	};

	/**
	 * =======================================================================================================
	 * hideGadget
	 * hide gadget
	 * @access public
	 * @execute call
	 * =======================================================================================================
	 */
	this.hideGadget = function() {
		if ( ! this.ua.IE ) {
			this.gadgetMenu.event('mouseout', function() {
				DOM(this).addStyle('opacity', 0.5);
			});
		}
		this.gadgetMenu.addStyle('right', '0px');
		this.gadgetArea.addStyle('right', '0px').hide();
		this.gadgetContent.hide();
		this.gadget.setShowFlag(false);
	};

	/**
	 * =======================================================================================================
	 * activeGadget
	 * show gadget
	 * @access public
	 * @execute call
	 * =======================================================================================================
	 */
	this.activeGadget = function() {
		if ( ! this.ua.IE ) {
			this.gadgetMenu.unevent('mouseout').addStyle('opacity', 1);
		}
		this.gadgetMenu.addStyle('right', '300px');
		this.gadgetArea.addStyle('right', '-3px').show();
		this.gadgetContent.show();
		this.gadget.setShowFlag(true);
		// load gadget once
		if ( this.globalLoadedGadget === false ) {
			this.gadget.init(this.gadgetContent, true);
			this.globalLoadedGadget = true;
		}
	};

	/**
	 * =======================================================================================================
	 * _remap
	 * re:mapping routing method
	 * @access private
	 * @execute call
	 * @param String m
	 * =======================================================================================================
	 */
	this._remap = function(m) {
		this.view();
	};

	/**
	 * =======================================================================================================
	 * __fileAlready
	 * css file is already loaded?
	 * @access private
	 * @execute call
	 * @param String type
	 * @param String filename
	 * @return bool
	 * =======================================================================================================
	 */
	this.__fileAlready = function (type, filename) {
		var files  = doc.getElementsByTagName('head')[0].getElementsByTagName(type),
			len     = files.length,
			att     = (type === 'link') ? 'href' : (type === 'script') ? 'src' : '',
			absPath = this.config.baseUrl() + filename,
			i       = 0;

		for ( ; i < len; i++ ) {
			if ( files[i][att] && files[i][att] === absPath ) {
				return true;
			}
		}
		return false;
	};

	/**
	 * =======================================================================================================
	 * closeHandle
	 * close DOMWindow
	 * @access public
	 * @execute call
	 * =======================================================================================================
	 */
	this.closeHandle = function() {
		Helper.hideDOMWindow();
	};

	/**
	 * =======================================================================================================
	 * edtiRollBack
	 * rollback delete block data
	 * @access pubic
	 * @execute call
	 * =======================================================================================================
	 */
	this.editRollBack = function() {
		if ( deleteStack.length === 0 ) {
			return;
		}
		var data = deleteStack[deleteStack.length - 1],
			e = data.element;

		if ( ! confirm(data.type + 'のブロック削除を取り消します。よろしいですか？') ) {
			return;
		}

		this.ajax.post('ajax/rollback_delete_block/' + this.config.item('sz_token'), {
			param   : data,
			error   : function() {
				alert('元に戻せませんでした。');
			},
			success : function(resp) {
				if ( resp.responseText === 'complete' ) {
					e.show().animate('appear', { speed : 30 });
					deleteStack.pop();
				} else {
					alert('元に戻せませんでした。');
				}
			}
		});
	};

	/**
	 * =======================================================================================================
	 * submitHandle
	 * submit block add or edit
	 * @access public
	 * @execute call
	 * =======================================================================================================
	 */
	this.submitHandle = function() {
		that.page_model.setUnloadFlag(true);
		if ( window.SZ_ADDBLOCK_ENABLED === true ) {
			DOM.id('sz-blockform').get().submit();
		}
	};

	/**
	 * =======================================================================================================
	 * setUpAPIHandle
	 * set up Seezoo API select_page, and select_file[muliple]
	 * @access public
	 * @execute call
	 * =======================================================================================================
	 */
	this.setUpAPIHandle = function() {
		var that = this,
			multiInited = false,
			fileAPIHandleClass       = 'div.sz-pp-contents div.sz_file_api_block, div.sz-pp-contents span.sz_file_api_block_name',
			multiFileAPIHandleClass  = 'div.sz-pp-contents div.sz_file_api_block_multiple',
			pageAPIHandleClass       = 'div.sz-pp-contents div.sz_page_api_block, div.sz-pp-contents span.sz_page_api_block_name',
			removeFileSelectionClass = 'div.sz-pp-contents div.sz_file_api_block > a.remove_selection',
			removePageSelectionClass = 'div.sz-pp-contents div.sz_page_api_block > a.remove_selection',
			target, handle;
		
		// file API handler
		var setImageCallback = function() {
			that.file_operator.init(target, handle, 'simple');
		};

		var setImageCallbackMultiple = function() {
			multiInited = true;
			that.file_operator.init(target, handle, 'multiple');
		};

		// page API handler
		var setPageCallback = function() {
			that.event.exprdeLive('span.ttl', 'click');
			that.event.exprdeLive('span.ttl', 'mouseout');
			that.event.exprdeLive('span.ttl', 'mousover');
			that.event.exprLive('span.ttl', 'click', function(ev) {
				ev.preventDefault();
				var fn = arguments.callee,
					e   = DOM(ev.target),
					pid = e.readAttr('pid'),
					json;

				that.ajax.get('ajax/get_page/' + pid + '/' + that.config.item('sz_token'), {
					success : function(resp) {
						json = that.json.parse(resp.responseText);
						target.first().html(json.page_title);
						target.detect('input')
								.get(0, true)
								.setValue(json.page_id);
						that.event.exprdeLive('span.ttl', 'click', fn);
						handle.hide();
					}
				});
			});
			that.event.exprLive('span.ttl', 'mouseover', function(ev) {
				DOM(ev.target).addClass('hover');
			});
			that.event.exprLive('span.ttl', 'mouseout', function(ev) {
				DOM(ev.target).removeClass('hover');
			});
			function toggleSearch(flag) {
				var f = that.ut.isBool(flag);

				DOM.id('sitemap')[f ? 'hide' : 'show']();
				DOM.id('sitemap_search_result')[f ? 'show' : 'hide']();

				if ( ! f ) {
					DOM('div#sz_sitemap_search_result_box div.sz_section')
						.unevent('mouseover')
						.unevent('mouseout')
						.unevent('click');
				}
			}
			function doSearchPage(ev) {
				that.saving.show();
				that.ajax.post('ajax/search_page_sitemap_block/' + that.config.item('sz_token'), {
					param   : DOM.id('sz_sitemap_search_menu').serialize(),
					error   : function() {that.saving.hide();alert('ページ検索に失敗しました。');},
					success : function(resp) {
						that.saving.hide();
						DOM.id('sz_sitemap_search_result_box').html(resp.responseText);
						toggleSearch(true);
						DOM('div#sz_sitemap_search_result_box div.sz_section')
							.event('mouseover', function(ev) {
								DOM(this).addClass('sz_section_hover');
							}).event('mouseout', function(ev) {
								DOM(this).removeClass('sz_section_hover');
							}).event('click', function(ev) {
								var fn = arguments.callee,
									e   = DOM(ev.target),
									pid = e.readAttr('pid'),
									json;
								
								that.ajax.get('ajax/get_page/' + pid + '/' + that.config.item('sz_token'), {
									success : function(resp) {
										try {
											json = that.json.parse(resp.responseText);
											target.first().html(json.page_title);
											target.detect('input')
												.get(0, true)
												.setValue(json.page_id);
										} catch (e) {
											alert('ページデータの取得に失敗しました。');
										} finally {
											DOM('div#sz_sitemap_search_result_box div.sz_section').unevent('click');
											handle.hide();
										}
									}
								});
							});
					}
				});
			}

			DOM.id('sz_sitemap_search_do').event('click', doSearchPage, that);
			DOM.id('toggle_search').event('click', toggleSearch, that);
			handle.setOnClose(function() {
				DOM.id('sz_sitemap_search_do').unevent('click');
				DOM.id('toggle_search').unevent('click');
			});
		};

		// file API
		this.event.exprLive(fileAPIHandleClass, 'click', function(ev) {
			ev.preventDefault();
			target = DOM(ev.target);
			handle = Helper.createDOMWindow('ファイルの選択', '', 918, '85%', false, true);
			if ( target.tag === 'span' ) {
				target = target.parent();
			}
			that.ajax.get('ajax/get_files_image_dir/' + (target.getOne('input').getValue() || 0) + '/' + that.config.item('sz_token'), {
				success : function(resp) {
					handle.setContent(resp.responseText);
					setImageCallback();
				}
			});
		});

		// multiple file API
		this.event.exprLive(multiFileAPIHandleClass, 'click', function(ev) {
			target = DOM.id('sz_file_api_block_multiple_results');
			handle = Helper.createDOMWindow('画像の選択', '', 918, '85%', false, true);
			that.ajax.get('ajax/get_files_image_dir/0/' + that.config.item('sz_token'), {
				success : function(resp) {
					handle.setContent(resp.responseText);
					setImageCallbackMultiple();
				}
			});
		});

		// page API
		this.event.exprLive(pageAPIHandleClass, 'click', function(ev) {
			var pid;
			
			target = DOM(this);
			handle = Helper.createDOMWindow('ページの選択', '', 720, '85%', false, true);
			if ( target.tag === 'span' ) {
				target = target.parent();
			}
			pid = target.detect('input')
						.get(0, true)
						.getValue();
			
			if ( pid == '' ) {
				pid = 1;
			}
			that.ajax.get('ajax/get_sitemap/' + pid + '/' + that.config.item('sz_token'), {
				success : function(resp) {
					handle.setContent(resp.responseText);
					if ( window.SZ_PO_INITED === false ) {
						that.page_operator.init('block');
						window.SZ_PO_INITED = true;
					}
					setPageCallback();
				}
			});
		});

		// remove current selects
		this.event.exprLive(removeFileSelectionClass, 'click', function(ev) {
			DOM(ev.target).parent().detect('input').get(0, true).setValue('');
			DOM(ev.target).parent().detect('span').get(0, true).html('ファイルを選択');
		});

		this.event.exprLive(removePageSelectionClass, 'click', function(ev) {
			DOM(ev.target).parent().detect('input').get(0, true).setValue('');
			DOM(ev.target).parent().detect('span').get(0, true).html('ページを選択');
		});
	};

	// alias for IE6 bug
	// displayed button by innerHTML, IE6 causes submit incorrectly...
	this.alias('winClose', this.closeHandle);
	this.alias('doSubmit', this.submitHandle);
});
