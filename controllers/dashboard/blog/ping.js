/**
 * =======================================================================================================
 * 
 * Seezoo dashboard blog ping Controller
 * 
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * 
 * =======================================================================================================
 */
ClassExtend('Controller', function() {
	
	/**
	 * =======================================================================================================
	 * constructor
	 * =======================================================================================================
	 */
	this.__construct = function() {
		this.load.module('ui');
	};
	/**
	 * =======================================================================================================
	 * default method
	 * =======================================================================================================
	 */
	this.index = function() {
		var that = this;
		
		// set some event
		DOM.id('add_category').event('click', function (ev) {
			ev.stopPropagation();
			DOM.id('additional_body').toggleShow();
		});
		
		DOM.id('additional_body').event('click', function (ev) {ev.stopPropagation();});
		this.event.set(document, 'click', function (ev) {
			DOM.id('additional_body').hide();
		});

		DOM.id('add_cat').Cevent('click', this.addPingList);
		DOM('table td.action a.delete').event('click', this.actionPing, this);
		
		Module.ready('ui', function() { new Module.zoom('edit', 'ajax', { width : 300, height : 150, openCallback : that.editEvent});});
	};
	
	/**
	 * =======================================================================================================
	 * addPingList
	 * check add ping value and submit
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.addPingList = function (ev) {
		var c = document.getElementsByName('ping_name')[0],
			c2 = document.getElementsByName('ping_server')[0],
			that = this;

		if (c.value == '') {
			alert('ping名は空欄にできません。');
			return;
		}

		if (c2.value == '') {
			alert('URLは空欄にできません。');
			return;
		} else if (/^http[s]?:\/\/[\w\.\/]+([\/|\?]?[\-_.!~\*a-zA-Z0-9\/\?:;@&=+$,%#]+)?$/.test(c2.value) === false) {
			alert('URLの形式が正しくありません。');
			return;
		}

		this.ajax.post('dashboard/blog/ping/ajax_add_ping/' + this.config.item('sz_token'), {
			param : {'ping_name' : c.value, 'ping_server' : c2.value},
			success : function (resp) {
				if (resp.responseText === 'error') {
					alert('カテゴリの追加に失敗しました。');
					return;
				}
				c.value = c2.value = '';
				// sucess and reload
				location.reload()
			}
		});
	};

	/**
	 * =======================================================================================================
	 * actionPing
	 * delete action before confirm
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.actionPing = function(ev) {
		ev.preventDefault();
		if (!confirm('pingデータを削除します。よろしいですか？')) { return;}
		var url = ev.target.href, tr;
		
		this.ajax.get(url, {
			error : function() { alert('操作に失敗しました。');},
			success : function(resp) {
				if (resp.responseText === 'error') {
					alert('操作に失敗しました。');
					return;
				}
				tr = DOM(ev.target).parent(2)
									.animate('fade', {speed : 30, afterHide : true});
			}
		});
	};
});