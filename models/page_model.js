/**
 * ==========================================================================================================
 *
 * Seezoo page Model Class
 *
 * do ajax and vent handle from page controller
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 *
 * ==========================================================================================================
 */

ClassExtend('Model',
function page_model() {

	// local variables
	var that = this,
		currentTab,
		currentContent,
		subOpen = false,
		ctPP,
		areaBlocks;
		unloadFlag = false;

	/**
	 * ===============================================================================================
	 * constructor
	 * ===============================================================================================
	 */
	this.__construct = function() {
		this.load.ajax();
		this.isPreview = false;
		this.isArranging = false;
	};

	/**
	 * ===============================================================================================
	 * doArrange
	 * save moved block order
	 * @access public
	 * @execute call
	 * @return void
	 * ===============================================================================================
	 */
	this.doArrange = function() {
		/**
		 * area paremeters format
		 * area[block_id] = area_id:display_order
		 */
		var areas = {}, a, b, t, ar, len, rev = false;

		if (!areaBlocks) { areaBlocks = DOM.origCSS('div[area_id]');}
		areaBlocks.foreach(function() {
			a = DOM(this).readAttr('area_id');
			b = DOM(this).detect('div.sz_content_blocks');
			len = b.length;
			rev = ( this.getAttribute('data-reverse') > 0 ) ? true : false;
			if (!a || b.length === 0) { return; }
			b.foreach(function(num) {
				var order = ( rev ) ? len - num : (num + 1);
				areas[DOM(this).readAttr('block_id')] = a + ':' + order;
			});
		});

		this.ajax.post('ajax/do_arrange/' + SZ_PAGE_ID + '/' + this.config.item('sz_token'), {
			async : true,
			param : areas,
			success : function() {
				that.parent.layer.hide();
				that.parent.saving.hide();
			}
		});
	};

	/**
	 * ===============================================================================================
	 * tabChange
	 * change tabe element in ppContent
	 * @access public
	 * @execute call
	 * @return void
	 * ===============================================================================================
	 */
	this.tabChange = function() {
		var tab = DOM.css('ul.sz_tabs li a'), e, ch;

		currentTab = tab.get(0).addClass('active');
		currentContent = DOM.id('tab_content1');
		tab.event('click', this.__doTabChange, this);
		DOM('div.tab_content table').event('click', function(ev) {
			e = DOM(ev.target);
			if (e.tag === 'td' && e.hasClass('pp_ch')) {
				ch = e.getOne('input').get();
				ch.checked = (ch.checked === true) ? false : true;
			}
		});
	};

	/**
	 * ===============================================================================================
	 * pv_init
	 * set up page version content event
	 * @access public
	 * @execute call
	 * @param Number pid
	 * @return void
	 * ===============================================================================================
	 */
	this.pv_init = function(pid) {
		var base = DOM('table.sz_page_version_list').get(0),
			ipts = DOM('div.sz_pv_operate input'), pp;

		base.detect('tr').event('click', function() {
			//cr && cr.removeClass('selected_v');
			var e = DOM(this),
				selectLength;

			if (e.hasClass('pv_head')) {
				return;
			}
			if (e.hasClass('selected_v')) {
				e.removeClass('selected_v');
			} else {
				e.addClass('selected_v');
			}
			selectLength = base.detect('tr.selected_v').length;
			if ( selectLength === 0 ) {
				ipts.get(0).prop('disabled', true);
				ipts.get(1).prop('disabled', true);
			}
			else {
				if ( selectLength === 1 ) {
					ipts.get(0).prop('disabled', false);
				} else {
					ipts.get(0).prop('disabled', true);
				}
				ipts.get(1).prop('disabled', false);
			}
//			ipts.foreach(function(num) {
//				
//				switch () {
//				case 0:
//					this.disabled = true;break;
//				case 1:
//					this.disabled = (num > 0) ? false : true;break;
//				case 2:
//					this.disabled = (num !== 1) ? false : true;break;
//				default :
//					this.disabled = (num > 1) ? false : true;break;
//				}
//			});
		});
		base.detect('a.sz_version_preview').event('click', function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			pp = Helper.createDOMWindow('[バージョン:' + ev.target.rel + '&nbsp;]&nbsp;のプレビュー', '', '90%', '90%', true, true), that = this;

			pp.setContent((['<iframe src="', ev.target.href, '/', pid || SZ_PAGE_ID, '" frameborder="0" style="width:100%;height:100%" />']).join(''));
		}, this);

		ipts.event('click', function() {
			switch (this.id) {
			case 'make_diff': //
				// test implement
				that.__getDiffVersions(base.detect('tr.selected_v'), pid || SZ_PAGE_ID); break;
				//alert('sorry, not implemented...');break; // make diff not implement...
			case 'do_public':
				that.__approveVersion(base);break;
			case 'delete_version':
				that.__deleteVersion(base.detect('tr.selected_v'));break;
			default:break;
			}
		});
	};
	
	/**
	 * ===============================================================================================
	 * __getDiffVersions
	 * show diff
	 * @access private
	 * @execute call
	 * @param xNodeList vs
	 * @param Number pid
	 * @return void
	 * ===============================================================================================
	 */
	this.__getDiffVersions = function(vs, pid) {
		var v1 = 0, v2 = 0, that = this, handle,
			diffUrl = this.config.siteUrl() + 'page/get_diff_versions/';
		
		vs.foreach(function(num) {
			var v = DOM(this).first().getHTML();
			
			if (v > v1) {
				v1 = v;
			} else {
				v2 = v;
			}
		});
		
		diffUrl += pid + '/' + v1 + '/' + v2 + '/' + this.config.item('sz_token');
		
		handle = Helper.createDOMWindow('バージョン' + v1 + 'とバージョン' + v2 + 'の比較', '', '90%', '90%', true, false);
		
		handle.setContent((['<iframe src="', diffUrl, '" frameborder="0" style="width:100%;height:100%" />']).join(''));

//		this.ajax.post('ajax/get_diff_versions/' + this.config.item('sz_token'), {
//			success : function(resp) {
//				handle.setContent(resp.responseText);
//			},
//			error : function() { alert('Failed Request!'); }
//		});
	}

	/**
	 * ===============================================================================================
	 * __approveVersion
	 * approve selected version
	 * @access private
	 * @execute call
	 * @param xElement base
	 * @return void
	 * ===============================================================================================
	 */
	this.__approveVersion = function(base) {
		var tr = base.detect('tr.selected_v').get(0),
			target = tr.first(),
			approveName = tr.children(3),
			v;

		if (target.hasClass('approved')) {
			return alert('既に公開バージョンに設定されています。');
		} else {
			v = target.getHTML();
			this.ajax.get('ajax/approve_version/' + SZ_PAGE_ID + '/' + v + '/' + this.config.item('sz_token'), {
				error : function() { alert('バージョン設定に失敗しました。');},
				success : function(resp) {
					if (resp.responseText === 'error') {
						return alert('バージョン設定に失敗しました。');
					} else {
						// remove old approve version.
						base.detect('td.approved').get(0).removeClass('approved');
						// set new version
						target.addClass('approved');
						// and set approved username
						approveName.html(resp.responseText);
					}
				}
			});
		}
	};

	/**
	 * ===============================================================================================
	 * __deleteVersion
	 * delete selected versions
	 * @access private
	 * @execute call
	 * @param xNodeList bases
	 * @return void
	 * ===============================================================================================
	 */
	this.__deleteVersion = function(bases) {
		var dels = [], ng = false, td;

		bases.foreach (function() {
			td = DOM(this).children(0);
			if (td.hasClass('approved')) { ng = true;}
			dels.push(td.getHTML());
		});
		if (ng === true) {
			return alert('削除対象のバージョンに公開中のものが含まれるため削除できません。');
		}
		if (confirm('選択したバージョンを削除します。よろしいですか？\n（この操作はもとに戻せません）')) {
			this.ajax.post('ajax/delete_version/' + this.config.item('sz_token'), {
				param : {deletes : dels.join(':'), pid : SZ_PAGE_ID},
				error : function() { alert('バージョンの削除に失敗しました。');},
				success : function(resp) {
					if (resp.responseText === 'complete') {
						bases.foreach(function() {
							DOM(this).animate('fade', {speed : 30, afterHide : true, callback : function() {
								DOM(this).removeClass('selected_v');
							}});
						});
					} else {
						return alert('バージョンの削除に失敗しました。');
					}
				}
			});
		}
	};

	/**
	 * ===============================================================================================
	 * __doTabChange
	 * do change tab contents
	 * @access private
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * ===============================================================================================
	 */
	this.__doTabChange = function(ev) {
		ev.preventDefault();
		var e = DOM(ev.currentTarget), href = e.readAttr('href'),
			target = href.slice(href.indexOf('#') + 1);

		currentTab.removeClass('active');
		currentTab = e.addClass('active');
		currentContent.hide();
		currentContent = DOM.id(target).show();
	};

	/**
	 * ===============================================================================================
	 * showSubPopup
	 * show Sub menu window with sitemap menu
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * ===============================================================================================
	 */
	this.showSubPopup = function(ev) {
		if (this.parent.subPP.isAnimate()) {
			return;
		}
		if (!this.parent.subOpen) {
			this.parent.subOpen = true;
			var e = DOM(ev.currentTarget), href = e.readAttr('href'), sc = this.ut.getScrollPosition(),
					c, cw, p = DOM('div.cmsi_menu').get(0).absDimension();

			ev.preventDefault();
//			that.parent.subPP.addStyle({
//				display : 'block',
//				top : ev.pageY - p.top + 30 + 'px',
//				left : ev.pageX - p.left + 30 + 'px'
//			});
			c = DOM.id('sz_sub_pp_content');
			cw = DOM.id('sz_sub_pp')
					.show().addStyle('top', '19px')
					.animate('move', {left : 328 , easing : 80, callback : function() {
						if (c.isEmpty() === true) {
							c.addStyle('background', 'url(' + that.config.appPath() + 'fl_images/loading_small.gif) center center no-repeat');
							that.ajax.get('ajax/sitemap/' + SZ_PAGE_ID + '/' + that.config.item('sz_token'), {
								cache : false,
								success : function(resp) {
									c.addStyle('background', 'none')//.addStyle('overflow', 'hidden')
										.html(resp.responseText);
									DOM.id('ajax_sitemap_tree').addStyle('overflow', 'hidden');
									//Animation.expand(c, {height : c.defaultSize().height, mode : 'h', dest : 'right', speed : 30, callback : function() {
									//	c.addStyle({overflow : '', width : 'auto', height : 'auto'});
									//}});
									that.startOpenClose();
									
								}
							});
						} else {
							c.show();
							that.startOpenClose();
							that.parent.subOpen = true;
						}
					}}); // end of animate method
		} else {
			this.parent.subPP.animate('move', {left : -328, easing : 50});
			this.stopOpenClose();
			this.parent.subOpen = false;
		}
	};
	
	this.hideSubPopup = function(ev) {
		var e = this.parent.subPP;
		e.animate('move', {left : -328, easing : 50, callback : function() { e.addStyle('marginLeft', '-328px');/*guard*/ }});
		this.stopOpenClose();
		this.parent.subOpen = false;
	};

	/**
	 * ===============================================================================================
	 * toggleEdit
	 * show sub menu window with edit out menu
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * ===============================================================================================
	 */
//	this.toggleEdit = function(ev) {
//		if (!this.parent.subOpen) {
//			var e = DOM(ev.currentTarget), href = e.readAttr('href'),
//				sc = this.ut.getScrollPosition(),
//				c, cw, p = DOM('div.cmsi_menu').get(0).absDimension();
//
//			ev.preventDefault();
//			that.parent.subPP.addStyle({
//				display : 'block',
//				top : ev.pageY - p.top + 30 + 'px',
//				left : ev.pageX - p.left + 30 + 'px'
//			});
//			c = DOM.id('sz_sub_pp_content');
//			cw = DOM.id('sz_sub_pp');
//			if (c.isEmpty() === true) {
//				c.addStyle('background', 'url(' + this.config.appPath() + 'fl_images/loading_small.gif) center center no-repeat');
//				this.ajax.get('ajax/page_out/' + SZ_PAGE_ID + '/' + this.config.item('sz_token'), {
//					cache : false,
//					success : function(resp) {
//						c.addStyle('background', 'none').addStyle('overflow', 'hidden')
//							.html(resp.responseText);
//						Animation.expand(cw, { width : 460, height : c.defaultSize().height, mode : 'wh', dest : 'right', speed : 10, callback : function() {
//							c.addStyle({overflow : '', width : 'auto', height : 'auto'});
//							cw.addStyle('height', 'auto');
//						}});
//						that.startOpenClose();
//						that.parent.subOpen = true;
//						if (document.getElementById('approval_regist')) {
//							DOM.id('approval_regist').event('click', function(ev) {
//								DOM(this).parent().next()[this.checked === true ? 'show' : 'hide']();
//							});
//						}
//					}
//				});
//			} else {
//				c.addStyle({'width' : '16px', 'height' : '16px', 'overflow' :'hidden'});
//				Animation.expand(c, { width : c.defaultSize().width, height : c.defaultSize().height, mode : 'wh', dest : 'right', speed : 10, callback : function() {
//					c.addStyle({overflow : '', width : 'auto', height : 'auto'});
//				}});
//				this.startOpenClose();
//				this.parent.subOpen = true;
//			}
//		} else {
//			this.parent.subPP.hide();
//			this.stopOpenClose();
//			this.parent.subOpen = false;
//		}
//	};
	this.toggleEdit = function(ev) {
		var e = DOM.id('sz_dsp_form'), c = e.first(), apc = DOM.id('approve_comment'), ch = DOM.id('approval_regist');
		
		if ( ! this.parent.subOpen) {
			if (c.isEmpty() === true) {
			c.addStyle('background', 'url(' + this.config.appPath() + 'fl_images/loading_small.gif) center center no-repeat');
				this.ajax.get('ajax/page_out/' + SZ_PAGE_ID + '/' + this.config.item('sz_token'), {
					cache : false,
					success : function(resp) {
						c.addStyle('background', 'none').html(resp.responseText);
						that.parent.subOpen = true;
						if (document.getElementById('approval_regist')) {
							DOM.id('approval_regist').event('click', function(ev) {
								DOM(this).parent().next()[this.checked === true ? 'show' : 'hide']();
							});
						}
						if (ch && ch.get().checked === true) {
							apc.show();
						}
						e.animate('move', {top : 242, easing : 80, speed : (that.ua.IE) ? 10 : 20});
						e.getOne('form').event('submit', function() {
							unloadFlag = true;
						});
					}
				});
			} else {
				if (ch && ch.get().checked === true) {
					apc.show();
				}
				e.animate('move', {top : 242, easing : 80, speed : 20});
				this.parent.subOpen = true;
			}
		} else {
			if (apc && !apc.isHidden()) {
				apc.hide();
			}
			e.animate('move', {top : -242, easing : 50, speed: 20, callback : function() { e.addStyle('marginTop', '-242px'); /* guard */}});
			this.parent.subOpen = false;
		}
			
	};
	
	this.toggleCSS = function(ev) {
		var e = DOM.id('sz_advance_css'), c = e.first();
		
//		// fix textarea height
//		e.getOne('textarea')
//			.addStyle('height', e.getOne('form').prop('offsetHeight') - 30 + 'px');
		
		if ( ! this.parent.customCSSOpen) {
			e.animate('move', {left : 350, easing : 80});
			this.parent.customCSSOpen = true;
		} else {
			e.animate('move', {left : -355, easing : 80, callback : function(){e.addStyle('marginLeft', '-355px');}});
			this.parent.customCSSOpen = false;
		}
	};
	
	this.updateAdvanceCSSBackend = function(ev) {
		var that = this, p = DOM.id('advance_css_form').serialize();
		
		this.ajax.post('ajax/update_advance_css_edit/' + this.config.item('sz_token'), {
			param : p,
			error : function() { alert('カスタムCSSの更新に失敗しました。'); },
			success : function(resp) {
				if (resp.responseText === 'complete') {
					var link = DOM.id('sz_advance_css_val_link'), href, d;
					
					if (!link) { // advance_css is not defined
						link = DOM.create('link', {
										type : 'text/css',
										rel : 'stylesheet',
										href : that.config.siteUrl() + 'page/advance_css/' + p.template_id,
										id : 'sz_advance_css_val_link'
								}).appendTo(document.getElementsByTagName('head')[0]);
					} else {
						d = new Date();
						// simply reload
						link.attr('href', that.config.siteUrl() + 'page/advance_css/' + p.template_id + '/' + d.getTime());	
					}
				} else {
					alert(resp.responseText);
				}
			}
		});
	}

	/**
	 * ===============================================================================================
	 * togglePreview
	 * toggle preview mode
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * ===============================================================================================
	 */
	this.togglePreview = function(ev) {
		if (this.parent.isArrange === true) {
			this.setArrangeMode({currentTarget : document.getElementById('arrange_mode')});
		} else if ( this.parent.isDelete === true ) {
			this.setDeleteMode({currentTarget : document.getElementById('sz_block_delete_mode')});
		}
		DOM('div.cmsi_edit_block, div.cmsi_arrange_block_master').foreach(function() {
			DOM(this)[that.parent.isPreview ? 'removeClass' : 'addClass']('none_preview');
		});
		DOM('div.cmsi_add_block, div.sz_edit_handles, div.sz_block_disabled_view').foreach(function() {
			DOM(this)[that.parent.isPreview ? 'show' : 'hide']();
		});
		DOM(ev.currentTarget)[this.parent.isPreview ? 'removeClass' : 'addClass']('active');
		this.parent.isPreview = !this.parent.isPreview;
		
		this.parent.modeState.html(this.parent.isPreview ? 'プレビュー' : '編集');
	};
	
	/**
	 * =======================================================================================================
	 * setArrangeMode
	 * page to arrange mode
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * =======================================================================================================
	 */
	
	this.setArrangeMode = function(ev) {
		var pre,
			f = this.parent.isArrange;
		
		if (!f) {
			if (this.parent.isPreview === true) {
				pre = DOM.id('edit_preview');
				this.togglePreview({currentTarget : pre});
				pre.removeClass('active');
			} else if ( this.parent.isDelete == true ) {
				this.setDeleteMode({currentTarget : document.getElementById('sz_block_delete_mode')});
			}
			DOM(ev.currentTarget).addClass('active');
		} else {
			DOM(ev.currentTarget).removeClass('active');
		}
		(this.parent.editBlocks || DOM('div.cmsi_edit_block')).foreach(function() {
			var flag = DOM(this).hasClass('cmsi_add_block');
			if ( !flag && !DOM(this).hasClass('sz_editable')) {
				DOM(this)[!f ? 'addClass' : 'removeClass']('sz_arrange_mode');
			//} else {
				//DOM(this)[!f ? 'hide' : 'show']();
			}
		});
		this.parent.isArrange = !f;
		
		this.parent.modeState.html(this.parent.isArrange ? '移動' : '編集');
	}
	
	/**
	 * =======================================================================================================
	 * setDeleteMode
	 * page to delete mode
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * =======================================================================================================
	 */
	
	this.setDeleteMode = function(ev) {
		var pre,
			f = this.parent.isDelete;
		
		if (!f) {
			if (this.parent.isPreview === true) {
				pre = DOM.id('edit_preview');
				this.togglePreview({currentTarget : pre});
				pre.removeClass('active');
			} else if ( this.parent.isArrange === true ) {
				this.setArrangeMode({currentTarget : document.getElementById('arrange_mode')});
			}
			DOM(ev.currentTarget).addClass('active');
		} else {
			DOM(ev.currentTarget).removeClass('active');
		}
		(this.parent.editBlocks || DOM('div.cmsi_edit_block')).foreach(function() {
			var flag = DOM(this).hasClass('cmsi_add_block');
			if ( !flag && !DOM(this).hasClass('sz_editable')) {
				DOM(this)[!f ? 'addClass' : 'removeClass']('sz_delete_mode');
			} else {
				DOM(this)[!f ? 'hide' : 'show']();
			}
		});
		this.parent.isDelete = !f;
		
		this.parent.modeState.html(this.parent.isDelete ? '削除' : '編集');
	}

	/**
	 * ===============================================================================================
	 * startOpenClose
	 * sitemap menu open handle
	 * @access public
	 * @execute call
	 * @return void
	 * ===============================================================================================
	 */
	this.startOpenClose = function() {
		DOM.id('sz_sub_pp_content').event('click', this.__openClose, this);
	};

	/**
	 * ===============================================================================================
	 * stopOpenClose
	 * sitemap menu stop open/close
	 * @access public
	 * @execute call
	 * @return void
	 * ===============================================================================================
	 */
	this.stopOpenClose = function() {
		DOM.id('sz_sub_pp_content').unevent('click', this.__openClose);
	};

	/**
	 * ===============================================================================================
	 * __openClose
	 * do open/close
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * ===============================================================================================
	 */
	this.__openClose = function(ev) {
		var e = DOM(ev.target), li = e.parent();

		if (e.tag !== 'a' || !e.hasClass('oc') || e.parent().readAttr('single')) { return; }
		if (li.hasClass('ch')) { // directory
			if (e.hasClass('close_dir')) { // childs close
				if (li.detect('ul').length === 0) { // no attach
					that._makeChild(li);
				} else { // already attached
					Animation.blindDown(li.detect('ul').get(0), {speed : 30, easing : 100, callback : function(){li.detect('ul').get(0, true).addStyle('height', 'auto');}});
				}
				e.replaceClass('close_dir', 'open_dir');
			} else if (e.hasClass('open_dir')) { // childs open
				Animation.blindUp(li.detect('ul').get(0), {speed : 30, easing : 100});
				e.replaceClass('open_dir', 'close_dir');
			}
		}
	};

	/**
	 * ===============================================================================================
	 * _makeChild
	 * create sub sitemap tree
	 * @access private
	 * @execute call
	 * @param xElement e
	 * @return void
	 * ===============================================================================================
	 */
	this._makeChild = function(e) {
		var pid = e.readAttr('id').replace('page_', '');

		this.ajax.get('ajax/get_child_sitemap/' + pid + '/' + SZ_PAGE_ID + '/' +this.config.item('sz_token'), {
			success : function(resp) {
				e.append(resp.responseText);
				Animation.blindDown(e.detect('ul').get(0, true), {speed : 30, easing : 100, callback : function(){e.detect('ul').get(0, true).addStyle('height', 'auto');}});
			}
		});
	};

	/**
	 * ===============================================================================================
	 * checkPageConfig
	 * validate page configure values title and page_path
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * ===============================================================================================
	 */
	this.checkPageConfig = function(ev) {
		var title = document.getElementsByName('page_title')[0],
			page_path = document.getElementsByName('page_path')[0];

		if ((title && title.value == '') || (page_path && page_path.value == '')) {
			ev.preventDefault();
			alert('ページタイトルとページパスは必ず入力してください。');
		}
	};

	/**
	 * ===============================================================================================
	 * blockToDraft
	 * current selected block copy to draft blocks
	 * @access public
	 * @execute call
	 * @param Number bid
	 * @param String colName
	 * @return void
	 * ===============================================================================================
	 */
	this.blockToDraft = function(bid, colName) {
		var that = this,
			layer = new Module.layer(true),
			pp = this.parent.namePP
						.show()
						.getOne('h3')
						.html('下書きブロックに登録')
						.rollBack();
		
		//return;
		pp.getOne('button')
			.event('click', function(ev) {
				var v = pp.getOne('input').getValue();
				
				if ( !v ) {
					return !!alert('登録名が入力されていません。');
				}
				this.ajax.post('ajax/block_to_draft/' + this.config.item('sz_token'), {
					param : { block_id : bid, collection_name : colName, alias_name : v},
					error : function() { alert('下書き保存に失敗しました。');},
					success : function(resp) {
						pp.hide();
						layer.hide();
						if (resp.responseText === 'complete') {
							//that.parent.menuTarget.getOne('p.sz_block_msg').show();
							alert('下書きブロックに保存しました。');
						} else if (resp.responseText === 'already') {
							alert('既に下書きブロックに登録されています。');
						} else {
							alert('下書き保存に失敗しました。');
						}
						pp.getOne('button').unevent('click');
					}
				});
			}, this);
	};
	
	/**
	 * ===============================================================================================
	 * addStaticBlock
	 * current selected block add to static blocks
	 * @access public
	 * @execute call
	 * @param Number bid
	 * @param String colName
	 * @return void
	 * ===============================================================================================
	 */
	this.addStaticBlock = function(bid, colName) {
		var that = this,
			layer = new Module.layer(true),
			pp = this.parent.namePP
						.show()
						.getOne('h3')
						.html('共有ブロックに登録')
						.rollBack();

		pp.getOne('button')
			.event('click', function(ev) {
				var v = pp.getOne('input').getValue();
				
				if ( !v ) {
					return !!alert('登録名が入力されていません。');
				}
				this.ajax.post('ajax/add_to_static/' + this.config.item('sz_token'), {
					param : { block_id : bid, collection_name : colName, alias_name : v},
					error : function() { alert('通信エラーが発生しました。');},
					success : function(resp) {
						pp.hide();
						layer.hide();
						if (resp.responseText === 'complete') {
							//that.parent.menuTarget.getOne('p.sz_block_msg').show();
							alert('共有ブロックに登録しました。');
						} else if (resp.responseText === 'already') {
							alert('すでに共有ブロックに登録されています。');
						} else {
							alert('登録に失敗しました。');
						}
						pp.getOne('button').unevent('click');
					}
				});
			}, this);
	};
	
		
	/**
	 * ===============================================================================================
	 * addBlockSet
	 * add blockset
	 * @access public
	 * @execute call
	 * @param Number bid
	 * @param String colName
	 * @return void
	 * ===============================================================================================
	 */
	this.addBlockSet = function(bid, colName) {
		var that = this,
			lis;
		
		// lookup mode scope ctPP
		ctPP = Helper.createDOMWindow('ブロックセットに追加', '', 600, 400);

		this.ajax.get('ajax/add_block_set/' + bid + '/' + this.config.item('sz_token'), {
			error : function() {
				alert('データの取得に失敗しました。');
			},
			success : function(resp) {
				var addSet,
					makeAdd;
				
				ctPP.setContent(resp.responseText);
				addSet  = DOM.id('sz_blockset_add');
				makeAdd = DOM.id('sz_blockset_make_add'); 
				
				if ( addSet ) {
					addSet.event('click', function(ev) {
						var f = DOM.id('sz_blockset_list'),
							flag = false;
						
						f.detect('input[type=checkbox]').foreach(function() {
							if ( this.checked === true ) {
								flag = true;
								return false;
							}
						});
						
						if ( ! flag ) {
							return !!alert('追加するブロックセットにチェックを入れてください。');
						}
						that.ajax.post('ajax/add_block_set/' + bid + '/' + that.config.item('sz_token'), {
							param : f.serialize(),
							error : function(resp) {
								alert(resp.responseText);
							},
							success : function(resp) {
								if ( resp.responseText === 'success' ) {
									ctPP.hide();
									alert('ブロックセットに追加しました。');
								} else {
									alert(resp);
								}
							}
						});
					});
				}
				
				// make button always exists.
				makeAdd.event('click', function(ev) {
					that.ajax.post('ajax/add_block_set/' + bid + '/' + that.config.item('sz_token'), {
						param : DOM.id('sz_blockset_new_add').serialize(),
						error : function(resp) {
							alert(resp.responseText);
						},
						success : function(resp) {
							if ( resp.responseText === 'success' ) {
								ctPP.hide();
								alert('ブロックセットに追加しました。');
							} else {
								alert(resp);
							}
						}
					});
				});
				
				ctPP.setOnClose(function() {
					addSet && addSet.unevent('click');
					makeAdd.unevent('click');
				});
			}
		});
	};
	
	/**
	 * ===============================================================================================
	 * setCustomTemplate
	 * get block custom template
	 * @access public
	 * @execute call
	 * @param Number bid
	 * @param String colName
	 * @return void
	 * ===============================================================================================
	 */
	this.setCustomTemplate = function(bid, colName) {
		var that = this, lis;
		ctPP = Helper.createDOMWindow('ブロックテンプレート切り替え', '', 400, 400);

		this.ajax.get('ajax/block_custom_templates/' + colName + '/' + this.config.item('sz_token'), {
			error : function() { alert('データの取得に失敗しました。'); },
			success : function(resp) {
				ctPP.setContent(resp.responseText);
				lis = ctPP.body.detect('ul li').event('mouseover', function() {
					var e = DOM(this).addClass('hover')
										.getOne('div');
					
					e && e.show();
				})
				.event('mouseout', function() {
					var e = DOM(this).removeClass('hover')
										.getOne('div');
					
					e && e.hide();
				})
				.event('click', function() {
					that._saveCustomTemplate(bid, DOM(this).readAttr('handle') || '');
				});
				ctPP.setOnClose(function() {
					lis.unevent('mouseover').unevent('mouseout').unevent('click');
					that.parent.menuTarget.first().hide().next().hide();//.next().hide();
					that.parent.blockMenu.hide();
				});
			}
		});
	};
	

	/**
	 * ===============================================================================================
	 * _saveCustomTemplate
	 * put block custom template
	 * @access public
	 * @execute call
	 * @param Number bid
	 * @param Object DOMWidnow handle
	 * @return void
	 * ===============================================================================================
	 */
	this._saveCustomTemplate = function(bid, handle) {
		var that = this,
			json;

		this.ajax.post('ajax/set_custom_template/' + this.config.item('sz_token'), {
			param : {block_id : bid, handle : handle, page_id : SZ_PAGE_ID},
			error : function() { alert('カスタムテンプレートの変更に失敗しました。'); },
			success : function(resp) {
				json = that.json.parse(resp.responseText);
				if (json.result === 'complete') {
					location.reload();
//					ctPP.hide();
//					DOM.id('edit_block-' + bid)
//						.getOne('a.sz_block_etc_menu')
//						.hide()
//						.next()
//						.html(json.data);
//					ctPP = undefined;
					//that.reloadBlock(bid);
				} else {
					alert('カスタムテンプレートの変更に失敗しました。');
				}
			}
		});
	};

	/**
	 * ===============================================================================================
	 * reloadBlock
	 * reload block content after put custom template
	 * @access public
	 * @execute call
	 * @param Number bid
	 * @return void
	 * ===============================================================================================
	 */
	this.reloadBlock = function(bid) {
		// search target box
		var t = DOM.id('edit_block-' + bid), that = this,
			cName = t.readAttr('block_type');

		this.ajax.get('ajax/refresh_block/' + bid + '/' + cName + '/' + SZ_PAGE_ID + '/' + this.config.item('sz_token'), {
			error : function() { alert('ブロックの更新に失敗しました。'); },
			success : function(resp) {
				if (resp.responseText === 'error') {
					return alert('ブロックの更新に失敗しました。');
				}
				ctPP.hide();
				t.last().html(resp.responseText);
				// destroy GC
				ctPP = undefined;
			}
		});
	};
	
	/**
	 * ===============================================================================================
	 * setBlockPermission
	 * block permission settings
	 * @access public
	 * @execute call
	 * @param Number bid
	 * @param String colName
	 * @return void
	 * ===============================================================================================
	 */
	this.setBlockPermission = function(bid, colName) {
		var that = this, lis;
		ctPP = Helper.createDOMWindow('ブロック権限設定', '', 600, 500);

		this.ajax.get('ajax/block_permissions/' + SZ_PAGE_ID + '/' + bid + '/' + this.config.item('sz_token'), {
			error : function() { alert('データの取得に失敗しました。'); },
			success : function(resp) {
				ctPP.setContent(resp.responseText);
				lis = ctPP.body.detect('table');
				lis.event('click', function(ev) {
					var chk;
					//that._saveCustomTemplate(bid, DOM(this).readAttr('handle') || '');
					if ( ev.target.tagName === 'TD'
						  && (chk = ev.target.getElementsByTagName('input')).length > 0 ) {
						chk[0].checked = !chk[0].checked;
					}
				});
				ctPP.setOnClose(function() {
					lis.unevent('click');
					that.parent.menuTarget.first().hide().next().hide();
				});
			}
		});
	};
	
	this.setUnloadFlag = function(f) {
		unloadFlag = f || false;
	};

	this.setPageUnload = function() {
		var ua = this.ua;
		
		this.event.set(window, 'beforeunload', function(ev) {
			if (ua.webkit) {
				if (unloadFlag === false) {
					return 'ページを移動、または再読み込みします。よろしいですか？';
				}
			} else if (ua.IE) {
				// not implement of unload status check on IE...
			} else {
				(unloadFlag === false) && ev.preventDefault();
			}
		});
	};
	
	/**
	 * ===============================================================================================
	 * changeViewMode
	 * change page view mode
	 * @access public
	 * @execute event handler
	 * @param ev event
	 * @return void
	 * ===============================================================================================
	 */
	this.changeViewMode = function(ev) {
		var layer = new Module.layer();
		
		if ( ! this.parent.viewModeElement ) {
			this.parent.viewModeElement = DOM.id('sz_view_mode_window');
			this.parent.viewModeElement.event('click', function(ev) {
				if ( ev.target.tagName === 'A' && ev.target.parentNode.tagName === 'DIV' ) {
					DOM(ev.target).parent().hide();
					layer.hide();
				}
			});
		}
		this.parent.viewModeElement.show();
		layer.show();
	}
});
