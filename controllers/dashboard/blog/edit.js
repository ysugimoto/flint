/**
 * =======================================================================================================
 * 
 * Seezoo dashboard blog edit Controller
 * 
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * 
 * =======================================================================================================
 */
ClassExtend('Controller', function() {
	
	// local variable
	var sendList, pointer, timer = 15000, timerID;
	
	// public property
	this.draftBtn;
	
	/**
	 * =======================================================================================================
	 * constructor
	 * =======================================================================================================
	 */
	this.__construct = function() {
		this.load.library(['editor', 'page_operator', 'file_operator', 'sz_calendar']);
		this.load.helper('date');
		this.load.ajax();
	};
	
	/**
	 * =======================================================================================================
	 * default method
	 * =======================================================================================================
	 */
	this.index = function() {
		
		var that = this;
		
		this.ready('editor', function () {
			this.editor.setUp(document.getElementsByName('body')[0], {width : 660, height : 400,emoji:true});
		});
		
		DOM.id('add_category').event('click', function (ev) {
			ev.stopPropagation();
			DOM.id('additional_body').toggleShow();
		});
		
		DOM.id('additional_body').event('click', function (ev) {ev.stopPropagation();});
		
		this.event.set(document, 'click', function (ev) {
			DOM.id('additional_body').hide();
		});
		
		DOM.id('add_cat').Cevent('click', this.addCategory);
		
		this.load.library('validation');
		
		// wait untill validation loaded
		this.ready('validation', function () {
			this._setValidation();
		});
		this.ready('sz_calendar', function() {
			this.sz_calendar.initialize({
				template : 'sz_calendar',
				yearRange : 'current-current+1'
			});
			this.sz_calendar.setUp(DOM.id('cal_target'));
		});
		
		timerID = setTimeout(function() {
			that.__setDraftTimerProcess();
		}, timer);
		
		if ( document.getElementById('save_to_draft_btn') ) {
			this.draftBtn = DOM.id('save_to_draft_btn')
									.event('click', function() {
										try {
											clearTimeout(timerID);
										} catch(e) {}
										this.__setDraftTimerProcess();
									}, this);
		}
		
	};
	
	/**
	 * =======================================================================================================
	 * edit confirm ( but validation errored process only)
	 * =======================================================================================================
	 */
	this.confirm = function() {
			
		var that = this,
			b = document.getElementsByName('body');
		
		if ( b.length === 0 || b[0].tagName === 'INPUT' ) {
			return;
		}
		
		this.ready('editor', function () {
			this.editor.setUp(document.getElementsByName('body')[0], {width : 660, height : 400});
		});
		
		DOM.id('add_category').event('click', function (ev) {
			ev.stopPropagation();
			DOM.id('additional_body').toggleShow();
		});
		
		DOM.id('additional_body').event('click', function (ev) {ev.stopPropagation();});
		
		this.event.set(document, 'click', function (ev) {
			DOM.id('additional_body').hide();
		});
		
		DOM.id('add_cat').Cevent('click', this.addCategory);
		
		this.load.library('validation');
		
		// wait untill validation loaded
		this.ready('validation', function () {
			//this._setValidation();
		});
		this.ready('sz_calendar', function() {
			if ( DOM.id('cal_target') ) {
				this.sz_calendar.initialize({
					template : 'sz_calendar',
					yearRange : 'current-current+1'
				});
				this.sz_calendar.setUp(DOM.id('cal_target'));
			}
		});
		
		timerID = setTimeout(function() {
			that.__setDraftTimerProcess();
		}, timer);
		
		if ( document.getElementById('save_to_draft_btn') ) {
			this.draftBtn = DOM.id('save_to_draft_btn')
									.event('click', function() {
										try {
											clearTimeout(timerID);
										} catch(e) {}
										this.__setDraftTimerProcess();
									}, this);
		}
		
	};

	/**
	 * =======================================================================================================
	 * addCategory
	 * add new Category
	 * @access public
	 * @execute evetn handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.addCategory = function (ev) {
		var c = document.getElementsByName('category_name')[0],
			json, that = this, opt;
		
		// validate is Empty
		if (c.value == '') {
			alert('カテゴリ名は空欄にできません。');
			return;
		}
		
		this.ajax.post('dashboard/blog/categories/ajax_add_category/' + this.config.item('sz_token'), {
			param : {'category_name' : c.value},
			success : function (resp) {
				if (resp.responseText === 'error') {
					alert('カテゴリの追加に失敗しました。');
					return;
				}
				//eval('var json=' + resp.responseText);
				json = that.json.parse(resp.responseText);
				opt = DOM.create('option', {value : json.sz_blog_category_id}).inText(c.value).appendTo(DOM.id('category_list'));
				DOM.id('additional_body').hide();
				DOM.id('add_msg').addStyle('display', 'inline');
				DOM(c).setValue('').parent(2).hide();
				setTimeout(function () {DOM.id('add_msg').hide();}, 2000);
			}
		});
	};
	
	/**
	 * =======================================================================================================
	 * do_edit
	 * regist blog complete, and select send ping
	 * @access public
	 * @execute routing
	 * @return void
	 * =======================================================================================================
	 */
	this.do_edit = function() {
		this.pingBtn = DOM('input.send_ping');
		if (this.pingBtn.length === 0) { return; }
		sendList = [];
		// if sendbutton pushed, send ping request order by checked ping_id
		this.pingBtn.event('click', function(ev) {
			// get checked inputs
			DOM('div.sz_blog_ping_list input[type=checkbox]').foreach(function() {
				if (this.checked === true) {
					sendList.push([this.value, DOM(this)]);
				}
			});
			pointer = 0;
			// ordered request
			this.__orderRequest();
		}, this);
	};
	
	/**
	 * =======================================================================================================
	 * __orderRequest
	 * send ping order by checked asc
	 * @access private
	 * @execute call
	 * @return void
	 * =======================================================================================================
	 */
	
	this.__orderRequest = function() {
		if (!sendList[pointer]) {
			this.pingBtn.get(0).prop('disabled', false);
			return;
		}
		var that = this, ping_id = sendList[pointer][0],
			current = sendList[pointer][1],
			hiddens = DOM('div.sz_blog_ping_list input[type=hidden]');
		
		current.next().html('送信中...').show();
		current.visible();
		current.parent()
			.addClass('sending')
			.removeClass('send_error')
			.removeClass('success');
		
		this.ajax.post('dashboard/blog/edit/send_ping_single', {
			param : { ping_id : sendList[pointer][0], token : this.config.item('sz_token'), title : hiddens.get(0).getValue(), id : hiddens.get(1).getValue()},
			error : function() { that.__displayError(current); },
			success : function(resp) {
				if (resp.responseText === 'complete') {
					that.__displaySuccess(current);
				} else {
					that.__displayError(current);
				}
			}
		});
	};
	
	/**
	 * =======================================================================================================
	 * __displayError
	 * show error result
	 * @access private
	 * @execute call
	 * @param xElement e
	 * @return void
	 * =======================================================================================================
	 */
	this.__displayError = function(e) {
		e.invisible().parent()
			.removeClass('sending')
			.addClass('send_error')
			.getOne('span').html('失敗');
		this.__orderRequest(++pointer);
	};
	
	/**
	 * =======================================================================================================
	 * __displaySuccess
	 * show success result
	 * @access private
	 * @execute call
	 * @param xElement e
	 * @return void
	 * =======================================================================================================
	 */
	this.__displaySuccess = function(e) {
		e.invisible().parent()
			.removeClass('sending')
			.addClass('success')
			.getOne('span').html('成功');
		this.__orderRequest(++pointer);
	};
	
	/**
	 * =======================================================================================================
	 * _setValidation
	 * setting validation library parameters
	 * @access private
	 * @execute call
	 * @return void
	 * =======================================================================================================
	 */
	this._setValidation = function () {
		var fields = {
			'title'					: '記事タイトル',
			'sz_blog_category_id'	: '登録カテゴリ',
			'body'						: '本文',
			'permalink'				: 'URIセグメント'
		};
		
		this.validation.setFields(fields);
		
		var rules = {
			'title'					: 'trim|required|max_length[255]',
			'sz_blog_category_id'	: 'trim|required|numeric',
			'body'						: 'trim|required',
			'permalink'				: 'trim|alpha_numeric'
		};
		
		this.validation.setRules(rules);
		
		this.validation.run(DOM.id('entry_form'));
	};
	
	/**
	 * =======================================================================================================
	 * __setDraftTimerProcess
	 * timer to save draft
	 * @access privare
	 * @execute call
	 * @return void
	 * =======================================================================================================
	 */
	this.__setDraftTimerProcess = function() {
		var that = this,
			target = DOM.id('eid'),
			text = DOM.id('save_to_draft_btn').prev();
		
		this.draftBtn.get().disabled = true;
		
		this.ajax.post('dashboard/blog/edit/ajax_save_to_draft', {
			param : DOM.id('entry_form').serialize(),
			success: function(resp) {
				that.draftBtn.get().disabled = false;
				
				if ( /^[0-9]+$/.test(resp.responseText) ) {
					text.html(Helper.date('Y-m-d H:i:s') + 'に保存しました');
					target.setValue(resp.responseText);
				}
				setTimeout(function() {
					that.__setDraftTimerProcess();
				}, timer);
			}
		});
	};
});