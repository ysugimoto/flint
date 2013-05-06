/**
 * =======================================================================================================
 * 
 * Seezoo site mangae model Class
 * 
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * 
 * =======================================================================================================
 */
ClassExtend('Model', function site_model() {
	
	/**
	 * =======================================================================================================
	 * constructor
	 * =======================================================================================================
	 */
	this.__construct = function() {};
	
	/**
	 * =======================================================================================================
	 * validate
	 * analog validate values
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.validate = function(ev) {
		var is_validate = true, errorStack = [],
			title = document.getElementsByName('site_title')[0],
			an = document.getElementsByName('google_analytics')[0],
			mn = document.getElementsByName('is_maintenance')[0],
			smf = document.getElementsByName('system_mail_from')[0];
		
		ev.preventDefault();
		
		if (title.value == '') {
			errorStack.push('サイトタイトルは空欄にできません');
		} else if (title.value.length > 255) {
			errorStack.push('サイトタイトルは255文字以内で入力してください');
		}
		
		if (smf.value != '') {
			if (!/\w{1,}[@][\w\-]{1,}([.]([\w\-]{1,})){1,3}$/.test(smf.value)) {
				errorStack.push('システムメールアドレスの形式が不正です');
			}
		}
		
		if (errorStack.length > 0) {
			this.parent.modal.alert(errorStack.join('<br />'));
		} else {
			if (mn.checked === true) {
				this.parent.modal.confirm('サイトがメンテナンスモードに<br />なります。よろしいですか？', this.__submit, this);
			} else {
				this.__submit();
			}
		}
	};
	
	/**
	 * =======================================================================================================
	 * __submit
	 * submit settings
	 * @access private
	 * @execute call
	 * @return void
	 * =======================================================================================================
	 */
	this.__submit = function() {
		DOM.id('setting_form').get().submit();
	};
});