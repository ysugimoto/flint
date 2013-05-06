/**
 * =======================================================================================================
 * 
 * Seezoo blog Controller
 * 
 * set up blog for front-end action
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
	
	this.index = this.entries = function() {
		this.__calendar();
	};
	
	/**
	 * =======================================================================================================
	 * article and regist_comment
	 * set comment validation
	 * @access public
	 * @execute routing
	 * =======================================================================================================
	 */
	this.article = this.regist_comment = function() {
		this.ready('validation', function() {
			this.__validation();
			this.validation.run(DOM('div.sz_blog_comment_form > form').get(0));
		});
		this.__calendar();
		
		// commented?
		if ( document.getElementById('sz_blog_commented') ) {
			this.__commentedPP();
		}
	};
	
	/**
	 * =======================================================================================================
	 * __commentedPP
	 * show and hide popup
	 * @access private
	 * @execute call
	 * =======================================================================================================
	 */
	this.__commentedPP = function() {
		var e = DOM.id('sz_blog_commented');
		
		e.addStyle('position', 'fixed')
			.appendTo(document.body)
			.show()
			.animate({height : 80});
		
		setTimeout(function() {
			new Animation(e, {height : 0}, {callback : function() {e.remove()}});
		}, 3000);
	};
	
	/**
	 * =======================================================================================================
	 * __validation
	 * set up validation
	 * @access private
	 * @execute call
	 * =======================================================================================================
	 */
	this.__validation = function() {
		var isCaptcha = !!DOM.id('captcha');
		
		var field = {
			'name' : 'お名前',
			'comment_body' : 'コメント'
		};
		if (isCaptcha) {
			field['captcha'] = '画像認証';
		}
		
		this.validation.setFields(field);
		
		var rules = {
			'name' : 'trim',
			'comment_body' : 'trim|required|max_length[255]'
		};
		
		if (isCaptcha) {
			rules['captcha'] = 'trim|required|alpha_numeric';
		}
		
		this.validation.setRules(rules);
	};
	
	this.__calendar = function() {
		if (!DOM.id('sz_blog_calendar')) {
			return;
		}
		var wrap = DOM.id('sz_blog_calendar'),
			that = this;
		this.event.exprLive('div#sz_blog_calendar tr.head_row a', function(ev) {
			that.ajax.get(ev.target.href, {
				success : function(resp) {
					wrap.html(resp.responseText);
				}
			});
		});
	}
});