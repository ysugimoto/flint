/**
 * =======================================================================================================
 * 
 * Seezoo dashboard blog comment Controller
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
		this.load.ajax();
	};

	/**
	 * =======================================================================================================
	 * default method
	 * =======================================================================================================
	 */
	this.index = function() {
		var that = this, chk, chFlag = false;
		
		DOM('div.sz_blog_comment').event('mouseover', function() {
			DOM(this).addStyle('backgroundColor', '#ffc');
			DOM(this).getOne('p.comment_action').show();
		}).event('mouseout', function() {
			DOM(this).addStyle('backgroundColor', '#f6f6f6');
			DOM(this).getOne('p.comment_action').hide();
		}).event('click', function(ev) {
			if (/input/i.test(ev.target.tagName)) { return;}
			chk = DOM(this).getOne('input[type=checkbox]').get();
			chk.checked = !chk.checked;
		});

		// ajax delete
		DOM('p.comment_action a').event('click', function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			var p = this.parentNode.parentNode;
			
			if (!confirm('このコメントを削除します。よろしいですか？')) { return;}
			that.ajax.get(this.href + '/' + that.config.item('sz_token'), {
				success : function(resp) {
					if (resp.responseText === 'complete') {
						Animation.fade(DOM(p), {speed : 30, afterHide : true});
					} else {
						alert('削除に失敗しました。');
					}
				},
				error : function () { alert('削除に失敗しました。');}
			});
		});

		// checkbox control is exists
		if (document.getElementById('all_checked')) {
			DOM.id('all_checked').event('click', function() {
				DOM('div.sz_blog_comment input').foreach(function() { this.checked = !chFlag;});
				chFlag = !chFlag;
			});
		}

		// selectable comment confirm?
		if (document.getElementById('sz_blog_comment_selectable')) {
			DOM.id('sz_blog_comment_selectable').event('submit', function(ev) {
				if (!confirm('選択したコメントを削除します。よろしいですか？')) {
					ev.preventDefault();
				}
			});
		}
	};
});