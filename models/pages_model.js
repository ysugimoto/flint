/**
 * =======================================================================================================
 *  
 * Seezoo pages model Class
 *  
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * 
 * =======================================================================================================
 */

ClassExtend('Model', function pages_model() {

	// local variables
	var that = this,
		uri = this.config.siteUrl(),
		isMaster = false,
		hrefList = [uri, uri + 'ajax/edit_page/', uri + 'ajax/add_page/', uri + 'ajax/delete_page/'],
		systemPageTarget = null,
		pp;
	
	/**
	 * =======================================================================================================
	 * constructor
	 * =======================================================================================================
	 */
	this.__construct = function() {
		this.load.ajax();
	};

	/**
	 * =======================================================================================================
	 * scanPage
	 * scan new system page
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.scanPage = function (ev) {
		ev.preventDefault();
		var state = DOM(ev.currentTarget).next().show('i'),
			that = this,
			box = DOM.id('scaned_page_list').html('').addStyle({'height' : '0px', overflow : 'hidden'});
		
		this.ajax.get('dashboard/pages/system_page/scan_system_page/' + this.config.item('sz_token'), {
			success : function (resp) {
				box.html(resp.responseText).animate('blindDown', {
						mode : 'y',
						speed : 30,
						easing : -50,
						callback : function () {state.hide();}
				});
			}
		});
	};

	/**
	 * =======================================================================================================
	 * toggleCheck
	 * toggle check install page
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.toggleCheck = function (ev) {
		var t = DOM(ev.target),
			checked = (t.readAttr('rel') === 'is_check') ? false : true,
			nch = checked ? 'is_check' : '';
		
		DOM('div#scaned_page_list table input').foreach(function() {
			this.checked = checked;
		});
		t.attr('rel', nch);
	};

	/**
	 * =======================================================================================================
	 * checkControl
	 * checkbox state decied by rel attribute
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.checkControl = function (ev) {
		var check = DOM(ev.target).parent().getOne('input').get();
		
		if (!check) { return;}
		else {
			check.checked = (check.checked === true) ? false : true;
		}
	};

	/**
	 * =======================================================================================================
	 * deleteSystemPage
	 * delete confirm selected page?
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.deleteSystemPage = function(ev) {
		ev.preventDefault();
		if (!confirm('システムページを削除します。よろしいですか？\n設定した権限等も削除されます')) { return; }
		
		this.ajax.get(ev.target.href + '/' + this.config.item('sz_token'), {
			error : function() { alert('ページの削除に失敗しました。') },
			success : function(resp) {
				if (resp.responseText === 'complete') {
					DOM(ev.target).parent().parent().animate('fade', {speed : 30, afterHide : true});
				} else {
					alert('ページの削除に失敗しました。');
				}
			}
		});
	};
	
	/**
	 * =======================================================================================================
	 * systemPageConfig
	 * view configure elements for update
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.systemPageConfig = function(ev) {
		ev.preventDefault();
		var href = ev.target.href, that = this;
			
		pp = Helper.createDOMWindow('システムページ設定', '', 600, '90%', false, false);
		systemPageTarget = DOM(ev.target).parent().prev();//children(1);
		
		this.ajax.get(href, {
			success : function(resp) {
				pp.setContent(resp.responseText);
				pp.box.getOne('h3').remove();
				that.parent.sz_calendar.initialize({template : 'sz_calendar', yearRange : 'current-2011'});
				that.parent.sz_calendar.setUp(DOM.byName('public_ymd').get(0));
				// cancel submit event and process ajax
				DOM.create('input').attr({type : 'hidden', name : 'from_po', value : 1}).prependTo(DOM('p.sz_add_form_submit').get(0));
				pp.box.getOne('form#sz-page_add_form').event('submit', that.editPageBackendSystem, that);
				pp.setOnClose(function() {
					pp.box.getOne('form#sz-page_add_form').unevent('submit');
				});
				that.parent.page_model.tabChange();
			}
		});
	};
	
	/**
	 * =======================================================================================================
	 * editPageBackendSystem
	 * edit page config by Ajax request
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.editPageBackendSystem = function(ev) {
		ev.preventDefault();
		var e = DOM(ev.target), that = this, json, pid;

		// validate required values.
		if (this.__validate() === false) { return;}

		this.ajax.post('ajax/page_edit_process/' + this.config.item('sz_token'), {
			param : e.serialize(),
			error : function() {alert('ページ設定の変更に失敗しました。');},
			success : function(resp) {
				try {
					json = that.json.parse(resp.responseText);
					if (json.error_message) {
						return alert(json.error_message);
					}
					systemPageTarget.getOne('a').html(json.page_title);
					if (document.getElementById('dashboard_page_' + json.page_id)) {
						DOM.id('dashboard_page_' + json.page_id).first().html(json.page_title);
					}
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
	 * __validate
	 * validate value simply.
	 * @access private
	 * @execute call
	 * @return bool
	 * =======================================================================================================
	 */
	this.__validate = function() {
		var ttl = DOM.byName('page_title').get(0),
			err = [];

		if (ttl.getValue() === '') {
			err.push('ページタイトルは必須入力です。');
		}
		
		if (err.length > 0) {
			alert(err.join('\n'));
			return false;
		}
		return true;
	};

});
