/**
 * =======================================================================================================
 * 
 * Seezoo dashboard blog settings Controller
 * 
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * 
 * =======================================================================================================
 */
ClassExtend('Controller', function() {
	
	/**
	 * =======================================================================================================
	 * default method
	 * =======================================================================================================
	 */
	this.index = function() {};
	
	/**
	 * =======================================================================================================
	 * edit
	 * base info or template tab hangeer
	 * @access public
	 * @execute routing
	 * @return void
	 * =======================================================================================================
	 */
	this.edit = function () {
		var ct, cb, tabs = DOM('ul.sz_dashboard_tabs li a'), href;
		
		tabs.event('click', function (ev) {
			ev.preventDefault();
			if (cb) {cb.addClass('init_hide');}
			ct.removeClass('active');
			href = this.href;
			cb = DOM.id(href.slice(href.indexOf('#') + 1)).removeClass('init_hide');
			ct = DOM(this).addClass('active');
		});
		ct = tabs.get(0);
		cb = DOM.id('content1');
	};
	
	/**
	 * =======================================================================================================
	 * do_settigns
	 * empty method
	 * =======================================================================================================
	 */
	this.do_settings = function() {};
});