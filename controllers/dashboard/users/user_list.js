/**
 * =======================================================================================================
 * 
 * Seezoo dashboard user_list Controller
 * 
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * 
 * =======================================================================================================
 */
ClassExtend('Controller', function() {

	var that = this;
	/**
	 * =======================================================================================================
	 * constructor
	 * =======================================================================================================
	 */
	this.__construct = function() {
		this.load.module('ui');
		this.load.model('user_model');
		this.load.ajax();
	};

	/**
	 * =======================================================================================================
	 * default method
	 * =======================================================================================================
	 */
	this.index = this.search = function() {
		var t, txt, d;
		
		Module.ready('ui', function() {
			new Module.zoom('sz_zoom', 'ajax', {width : 600, height : 500});
		});

		if (DOM.id('search_open')) {
			d = DOM('div.user_search_form').get(0);
			DOM.id('search_open').event('click', function(ev) {
				d.toggleShow();
				t = document.createTextNode((d.isHidden()) ? '検索フォームを開く' : '検索フォームを閉じる');
				txt = DOM(this).get();
				txt.replaceChild(t, txt.lastChild);
				if (!d.isHidden()) {
					d.detect('input').get(0).method('focus');
				}
			});
		}
		
		this.ready('user_model', function() {
			this.event.exprLive('a.delete', 'click', this.user_model.deleteConfirm, this.user_model);
			this.event.exprLive('a#re_login', 'click', this.user_model.re_login, this.user_model);
			this.event.exprLive('a.unlock', 'click', this.user_model.unlockUser, this.user_model);
			this.event.exprLive('a.dpi', 'click', this.user_model.deleteUserProfileImage, this.user_model);
		});
	};
	
	this.search = function() {
		Module.ready('ui', function() {
			new Module.zoom('sz_zoom', 'ajax', {width : 600, height : 500});
		});
		
		this.ready('user_model', function() {
			this.event.exprLive('a.delete', 'click', this.user_model.deleteConfirm, this.user_model);
			this.event.exprLive('a#re_login', 'click', this.user_model.re_login, this.user_model);
			this.event.exprLive('a.unlock', 'click', this.user_model.unlockUser, this.user_model);
			this.event.exprLive('a.dpi', 'click', this.user_model.deleteUserProfileImage, this.user_model);
		});

	}
	
	this.updateProfileImage = function(imgPath) {
		if (!document.getElementById('prof_caption')) {
			return;
		}
		var FL = getInstance(),
			target = DOM.id('prof_caption');
		
		if (target.next().first().tag === 'img') { // already exists
			target.next().first().attr('src', FL.config.baseUrl() + 'files/members/' + imgPath);
		}
	};
	
	this.alias('updateProfileImage', this.updateProfileImage);
});