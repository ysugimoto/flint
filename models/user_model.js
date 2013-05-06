/**
 * =======================================================================================================
 * 
 * Seezoo user model Class
 * 
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * 
 * =======================================================================================================
 */
ClassExtend('Model', function user_model() {

	/**
	 * =======================================================================================================
	 * constructor
	 * =======================================================================================================
	 */
	this.__construct = function() {
		this.load.ajax();
	}
	
	/**
	 * =======================================================================================================
	 * deleteConfirm
	 * confirm delete?
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.deleteConfirm = function(ev) {
		ev.preventDefault();
		if (ev.target.rel === 'master') {
			return alert('マスターユーザーは削除できません。');
		}
		if (!confirm('選択したユーザーを削除します。よろしいですか？\n権限等も削除されます'))　{ return; }
		this.ajax.get(ev.target.href + '/' + this.config.item('sz_token'), {
			error : function() { alert('ユーザーの削除に失敗しました。');},
			success : function(resp) {
				if (resp.responseText === 'complete') {
					DOM(ev.target).parent().parent().animate('fade', { speed : 30, afterHide : true});
				} else if (resp.responseText === 'cannot') {
					alert('指定したユーザーは削除できません！');
				} else {
					alert('ユーザーの削除に失敗しました。');
				}
			}
		});
	};

	/**
	 * =======================================================================================================
	 * re_login
	 * confirm change login user?
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.re_login = function(ev) {
		ev.preventDefault();
		if (!confirm('ユーザーを変更してログインします。よろしいですか？')) { return;}
		location.href = DOM(ev.target).readAttr('href') + '/' + this.config.item('sz_token');
	};
	
	/**
	 * =======================================================================================================
	 * unlockUser
	 * confirm unlock account?
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.unlockUser = function(ev) {
		ev.preventDefault();
		if (!confirm('アカウントロックを解除します。よろしいですか？')) { return; }
		location.href = DOM(ev.target).readAttr('href') + '/' + this.config.item('sz_token');
	};
	
	/**
	 * =======================================================================================================
	 * deleteUserProfileImage
	 * confirm delete profile image?
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.deleteUserProfileImage = function(ev) {
		var that = this;
		
		ev.preventDefault();
		if (!confirm('プロフィール画像を削除します。よろしいですか？')
				|| /no_image\.gif$/.test(DOM(ev.target).prev().readAttr('src'))) {
			return;
		}
		this.ajax.get(ev.target.href + '/' + this.config.item('sz_token'), {
			error : function() { alert('プロフィール画像の削除に失敗しました。');},
			success : function(resp) {
				if (resp.responseText === 'complete') {
					DOM(ev.target).prev().attr('src', that.config.baseUrl() + 'images/no_image.gif');
				} else {
					alert('プロフィール画像の削除に失敗しました。');
				}
			}
		});
	};
	
});
