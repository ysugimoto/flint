/**
 * =======================================================================================================
 * 
 * Seezoo dashboard edit user Controller
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
		this.load.library('validation');
	};
	
	/**
	 * =======================================================================================================
	 * default method
	 * =======================================================================================================
	 */
	this.index = function() {
		var that = this, uid = this.uri.segment(5, 0);
		
		this.ready('validation', function() {
			this._validation(uid);
			this.validation.run(DOM('form').get(0));
		});
	};
	
	/**
	 * =======================================================================================================
	 * cofirm
	 * view confirm method
	 * @access public
	 * @execute routing
	 * @return void
	 * =======================================================================================================
	 */
	this.confirm = function() {
		if (DOM('form.inline').length > 1) { return; }
		this.index();
	};
	
	/**
	 * =======================================================================================================
	 * regist
	 * empty method
	 * =======================================================================================================
	 */
	this.regist = function() {};
	
	/**
	 * =======================================================================================================
	 * _remap
	 * re:mapping rpouting method
	 * @access public
	 * @execute call
	 * @param String m
	 * @return void
	 * =======================================================================================================
	 */
	this._remap = function(m) {
		this[this[m] ? m : 'index']();
	};
	
	/**
	 * =======================================================================================================
	 * _validation
	 * set up validation library
	 * @acess private
	 * @execute call
	 * @param Number uid
	 * @return void
	 * =======================================================================================================
	 */
	this._validation = function(uid) {
		
		var fields = {
			'user_name' : 'ユーザー名',
			'email' : 'メールアドレス',
			'password' : 'パスワード',
			'admin_flag' : '管理者権限'
		};
		
		this.validation.setFields(fields);
		
		var rules = {
			'user_name' : 'trim|required|min_length[3]|max_length[100]',
			'email' : 'trim|required|min_length[3]|max_length[100]|valid_email',
			'password' : 'trim' + (uid > 0 ? '' : '|required') + '|max_length[100]|alpha_numeric',
			'admin_flag' : 'trim|numeric'
		};
		
		this.validation.setRules(rules);
	};
});