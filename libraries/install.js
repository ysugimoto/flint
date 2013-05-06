/**
 * ==========================================================================================
 * 
 * Seezoo install manage library
 * 
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * @required libraries/validation.js
 * ==========================================================================================
 */

ClassExtend('Library', function install() {
	
	var FL = getInstance(), that = this,
		pool = ('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890').split(''),
		poolLength = pool.length,
		pslength = 16;
		
	
	FL.load.library('validation');
	FL.ready('validation', function() {
		that.__setValidation();
	});
	
	/**
	 * ==========================================================================================
	 * initialize
	 * intialize event
	 * @access public
	 * @return void
	 * ==========================================================================================
	 */
	this.init = function() {
		DOM('div#install_data_wrapper table input').event('focus', function(ev) {
			DOM(this).addClass('focused');
		}).event('blur', function(ev) {
			DOM(this).removeClass('focused');
		});
		
		if ( DOM.id('reload') != null ) {
			DOM.id('reload').event('click', function() {
				location.reload();
			});
		}
		
		if ( DOM.id('randomize') ) {
			DOM.id('randomize').event('click', this.__createRandomPassword);
		}

		DOM.id('btn').removeAttr('disabled');
	};

	/**
	 * ==========================================================================================
	 * __setValidation
	 * set up validation parameter
	 * @access private
	 * @return void
	 * ==========================================================================================
	 */
	this.__setValidation = function() {
		var f = {
				site_name : 'サイト名',
				site_uri : 'サイトアドレス',
				admin_email : '管理者のメールアドレス',
				admin_username : '管理者のユーザー名',
				admin_password : '管理者のパスワード',
				db_address : 'データベースサーバのアドレス',
				db_username : 'データベースサーバのユーザー名',
				db_password : 'データベースサーバのパスワード',
				db_name : 'データベース名'
		};
		FL.validation.setFields(f);
		var r = {
				site_name : 'required',
				site_uri : 'required',
				admin_email : 'required|valid_email',
				admin_username : 'required|alpha_dash',
				admin_password : 'required',
				db_address : 'required',
				db_username : 'required',
				db_password : '',
				db_name : 'required'
		};
		FL.validation.setRules(r);
		FL.validation.run(DOM.id('sz_install_form'));
	};
	
	this.__createRandomPassword = function() {
		var mr = Math.round,
			rr = Math.random,
			i = 0,
			ret = [];
		
		for ( ; i < pslength; ++i ) {
			ret[i] = pool[mr(rr() * poolLength)];
		}
		
		DOM.id('admin_password').setValue(ret.join(''));
	}
});
