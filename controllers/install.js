/**
 * =======================================================================================================
 * 
 * Seezoo install Controller
 * 
 * install action set up
 * @package Seezoo Core
 * @author Yuta Sakurai <sakutai.yuta@gmail.com>
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
		this.image.preLoad(this.config.baseUrl() + 'images/login/login_on.gif');
	};
	
	/**
	 * =======================================================================================================
	 * default method
	 * @access public
	 * @execute routing
	 * =======================================================================================================
	 */
	this.index = function() {
		var base = this.config.baseUrl();
		
		this.ready('validation', function() {
			this.__validation();
			this.validation.run(DOM.tag('form').get(0));
		});
		
		DOM.id('btn').event('mouseover', function() {
			DOM(this).attr('src', base + 'images/login/login_on.gif');
		}).event('mouseout', function() {
			DOM(this).attr('src', base + 'images/login/login_btn.gif');
		});
	};
	
	/**
	 * =======================================================================================================
	 * _remap
	 * re:mapping method
	 * @access private
	 * @execute call
	 * @param String m
	 * =======================================================================================================
	 */
	this._remap = function(m) {
		this.index();
	};
	
	/**
	 * =======================================================================================================
	 * __validation
	 * set up validation library parameters like CodeIgniter
	 * @access private
	 * @execute call
	 * =======================================================================================================
	 */
	this.__validation = function() {
		var field = {
			'site_name' : 'サイト名',
			'admin_email' : '管理者のメールアドレス',
			'db_address' : 'データベースサーバのアドレス',
			'db_username' : 'データベースサーバのユーザ名',
			'db_password' : 'データベースサーバのパスワード',
			'db_name' : 'データベース名'
		};

		this.validation.setFields(field);

		var rules = {
			'site_name' : 'trim|required',
			'admin_email' : 'trim|required',
			'db_address' : 'trim|required',
			'db_username' : 'trim|required',
			'db_password' : 'trim',
			'db_name' : 'trim|required'
		};
		
		this.validation.setRules(rules);
	};
});

