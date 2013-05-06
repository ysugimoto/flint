/**
 * =======================================================================================================
 *
 * Seezoo page_list Controller
 *
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 *
 * =======================================================================================================
 */
ClassExtend('Controller', function DashboardPagesPageListController() {

	var pp;

	/**
	 * =======================================================================================================
	 * constructor
	 * =======================================================================================================
	 */
	this.__construct = function() {
		this.load.module('ui');
		this.load.model('page_model');
		this.load.library(['page_operator', 'sz_calendar']);
	};

	/**
	 * =======================================================================================================
	 * default method
	 * =======================================================================================================
	 */
	this.index = function() {
		var that = this;

		// create sitemap menu
		this.menu = this._createSitemapMenu();

		// set up page_operator library
		this.ready('page_operator', function() {
			this.page_operator.init();

		});

		this.menu.detect('a').Cevent('click', function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			switch (ev.target.className) {
			case 'delete_page':
				if (this.menu.readAttr('target_page_id') !== '1') {
					this.page_operator.deleteCurrent(ev.target.href);
				} else {
					alert('トップページ(ページIDが1のもの)は削除できません。');
					this.menu.hide();
				}
				break;
			case 'visit':
				location.href = ev.target.href;
				break;
			case 'sz_page_move_upper':
				this.page_operator.movePageLevel(true);
				break;
			case 'sz_page_move_lower':
				this.page_operator.movePageLevel(false);
				break;
			}
		});

//		DOM.id('with_system').event('click', function() {
//			// submit and set cookie value
//			this.parentNode.submit();
//		});

		// set event
		DOM('a.sz_zoom').event('click', this.editPage, this);
	};

	/**
	 * =======================================================================================================
	 * _createSitemapMenu
	 * create sitemap control menu
	 * @access public
	 * @execute call
	 * @return xElement map
	 * =======================================================================================================
	 */
	this._createSitemapMenu = function() {
		var map = DOM.create('div', {'class' : 'sz_sitemap_menu', 'id' : 'sz_sitemaps'})
						.appendTo(window['IEFIX'] ? IEFIX.body : document.body),
						links, html;

		html =['<div class="sz_sitemap_menu_top"></div>',
	           '<div id="sz_sitemap_content">',
	           '<ul>',
	           '<li><a href="#" class="visit">訪問</a></li>',
	           '<li><a href="#" class="sz_zoom page_config">ページ設定</a></li>',
	           '<li><a href="#" class="sz_zoom create_page">子ページ作成</a></li>',
	           '<li><a href="#" class="sz_zoom create_external_link">外部リンク作成</a></li>',
	           '<li><a href="#" class="sz_zoom view_version">バージョン情報</a></li>',
	           '<li><a href="javascript:void(0)" class="sz_page_move_upper">ページ順を上へ</a></li>',
	           '<li><a href="javascript:void(0)" class="sz_page_move_lower">ページ順を下へ</a></li>',
	           '<li><a href="#" class="copy_page">ページを複製する</a></li>',
	           '<li><a href="#" class="delete_page">削除</a></li>',
	           '</ul>',
	           '</div>',
	           '<div class="sz_sitemap_menu_bottom"></div>'
	           ];

		return map.html(html.join('\n'));
	};



	this.editPage = function(ev) {
		var e = DOM(ev.target), tab = true, that = this,
			ttl, add, v = true;

		if (e.hasClass('page_config')) {
			if ( e.readAttr('href').indexOf('external') !== -1 ) {
				ttl = '外部リンク設定の変更'; add = false; tab = false; v = false;
			} else {
				ttl = 'ページ設定の変更'; add = false;
			}
		} else if (e.hasClass('view_version')) {
			ttl = 'バージョン情報'; add = false; tab = false;
		} else if ( e.hasClass('create_external_link') ) {
			ttl = '外部リンクを追加'; add = false; v = false; tab = false;
		} else {
			ttl = '子ページの追加'; add = true;
		}

		pp = Helper.createDOMWindow(ttl, '', 650, (v) ? '90%' : 300, false, true);

		this.ajax.get(e.readAttr('href'), {
			success : function(resp) {
				pp.setContent(resp.responseText);
				// pre delete caption...
				pp.box.getOne('h3').remove();
				if (tab) {
					// set up tab
					that.page_model.tabChange();
					// set up calendar
					that.sz_calendar.initialize({template : 'sz_calendar', yearRange : 'current-2011'});
					that.sz_calendar.setUp(DOM.byName('public_ymd').get(0));
					// cancel submit event and process ajax
					DOM.create('input').attr({type : 'hidden', name : 'from_po', value : 1}).prependTo(DOM('p.sz_add_form_submit').get(0));
					pp.box.getOne('form#sz-page_add_form').event('submit', that[add ? 'pageAddBackend' : 'editPageBackend'], that);
					pp.setOnClose(function() {
						if (pp.box) {
							pp.box.getOne('form#sz-page_add_form').unevent('submit');
						}
					});
					if (DOM.id('check_exists')) {
						DOM.id('check_exists').event('click', function(ev) {
							ev.stopPropagation();
							
							var p = DOM.id('sz_input_page_path'),
								path = p.getValue();
								parentPath = that.ut.trim(p.prev().getHTML()),
								pid = ev.target.rel;
						
							if (path == '') {
								return alert('ページパスを入力してください。');
							}
							that.page_operator.checkPagePathExists(parentPath + path, pid);
						})
					}
				} else {
					window.SZ_PAGE_ID = DOM.id('sz_sitemaps').readAttr('target_page_id');
					if ( v ) {
						that.page_model.pv_init(DOM.id('sz_sitemaps').readAttr('target_page_id'));
					} else {
						DOM.id('sz_sitemaps').hide();
						pp.setOnClose(function() {
							if (pp.box) {
								pp.box.getOne('form#sz-page_add_form').unevent('submit');
							}
						});
						pp.box.getOne('form#sz-page_add_form').event('submit', function(ev) {
							ev.preventDefault();
							
							var uri = DOM.id('add_external_uri').getValue(),
								title = DOM.id('add_external_title').getValue(),
								err = [];
							
							if ( uri === '' ) {
								err[err.length] = 'URLは必須入力です。';
							} else if ( ! /^http[s]?:\/\/[\w\.\/]+([\/|\?]?[\-_.!~\*a-zA-Z0-9\/\?:;@&=+$,%#]+)?$/.test(uri) ) {
								err[err.length] = 'URLの形式が正しくありません。';
							}
							
							if ( title === '' ) {
								err[err.length] = 'リンクタイトルは必須入力です。';
							} else if ( title.length > 255 ) {
								err[err.length] = 'リンクタイトルは255文字以内で入力してください。';
							}
							
							if ( err.length > 0 ) {
								alert(err.join('\n'));
								return;
							}
							that.externalPageAddBackend(this);
						});
					}
				}
			}
		});
	};

	/**
	 * =======================================================================================================
	 * editPageBackend
	 * edit page config on ajax backend
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.editPageBackend = function(ev) {
		ev.preventDefault();
		var e = DOM(ev.target), that = this, json, pid;

		// validate required values.
		if (this.__validate() === false) { return;}

		this.ajax.post('ajax/page_edit_process/' + this.config.siteUrl(), {
			param : e.serialize(),
			error : function() {alert('ページ設定の変更に失敗しました。');},
			success : function(resp) {
				var txtNode;
				
				if (resp.responseText === 'editting') {
					return alert('このページを編集中のユーザーがいます。編集が終わってから再度実行してください。');
				}
				try {
					json = that.json.parse(resp.responseText);
					if (json.error_message) {
						return alert(json.error_message);
					}
					txtNode = DOM.origCSS('span[pid=' + json.page_id + ']').get(0).get();
					txtNode.normalize();
					txtNode.removeChild(txtNode.firstChild);
					txtNode.insertBefore(document.createTextNode(json.page_title), txtNode.firstChild);
					
				} catch(e) {
					return alert((['予期しない例外が発生しました。ページを更新し、再度お試し下さい。',
					          'それでも問題が解決しない場合は、以下の情報を添えてサイトの管理者にお問い合わせ下さい。\n',
					          'レスポンス:',
					         resp.responseText
							]).join('\n'));
				}
				pp.hide();
			}
		});
	};

	/**
	 * =======================================================================================================
	 * pageAddBackend
	 * add new page on ajax backend
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.pageAddBackend = function(ev) {
		ev.preventDefault();
		var e = DOM(ev.target), that = this, json, pid, spn;

		// validate required values.
		if (this.__validate() === false) { return;}

		this.ajax.post('ajax/page_add_process/' + this.config.item('sz_token'), {
			param : e.serialize(),
			error : function() {alert('ページの追加に失敗しました。');},
			success : function(resp) {
				if (resp.responseText === 'editting') {
					alert('このページを編集中のユーザーがいます。編集が終わってから再度実行してください。');
				} else {
					try {
						json = that.json.parse(resp.responseText);
						if (json.page_id == 1) {
							that.page_operator._makeChild(DOM.id('page_' + json.page_id));
						} else {
							that.page_operator._makeChild(DOM.origCSS('span[pid=' + json.page_id + ']').get(0).parent(4));
						}
					} catch(e) {}
				}
				pp.hide();
			}
		});
	};
	
	/**
	 * =======================================================================================================
	 * externalPageAddBackend
	 * add new external linked page on ajax backend
	 * @access public
	 * @execute call
	 * @param xElement form
	 * @return void
	 * =======================================================================================================
	 */
	this.externalPageAddBackend = function(form) {
		var that = this, json, pid, spn;

		this.ajax.post('ajax/page_add_process/' + this.config.item('sz_token'), {
			param : DOM(form).serialize(),
			error : function() { 
				alert('外部リンクの追加に失敗しました。');
			},
			success : function(resp) {
				if (resp.responseText === 'editting') {
					alert('このページを編集中のユーザーがいます。編集が終わってから再度実行してください。');
				} else {
					try {
						json = that.json.parse(resp.responseText);
						if (json.page_id == 1) {
							that.page_operator._makeChild(DOM.id('page_' + json.page_id));
						} else {
							that.page_operator._makeChild(DOM.origCSS('span[pid=' + json.page_id + ']').get(0).parent(4));
						}
					} catch(e) {}
				}
				pp.hide();
			}
		});
	};

	/**
	 * =======================================================================================================
	 * __validate
	 * validate value simply.
	 * @access private
	 * @execute call
	 * @return bool
	 * =======================================================================================================
	 */
	this.__validate = function() {
		var ttl = DOM.id('sz_input_page_title'),
			path = DOM.id('sz_input_page_path'),
			err = [];

		if (ttl && ttl.getValue() === '') {
			err.push('ページタイトルは必須入力です。');
		}
		if (path) {
			if (path.getValue() === '') {
				err.push('ページパスは必須入力です。');
			} else if (path.getValue().indexOf('/') !== -1) {
				err.push('ページパスに / は使用できません。');
			}
		}

		if (err.length > 0) {
			alert(err.join('\n'));
			return false;
		}
		return true;
	};

});
