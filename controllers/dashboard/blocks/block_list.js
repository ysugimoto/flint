/**
 * =======================================================================================================
 * 
 * Seezoo blocks Controller
 * 
 * blocks action set up
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * 
 * =======================================================================================================
 */

ClassExtend('Controller', function Blocks() {

	/**
	 * =======================================================================================================
	 * constructor
	 * =======================================================================================================
	 */
	this.__construct = function() {
		this.load.module('ui');
		this.load.model('block_model');
	};

	/**
	 * =======================================================================================================
	 * default method
	 * =======================================================================================================
	 */
	this.index = function() {
		this.createMenu();
		this.ready('block_model', function() {
			DOM('div.installed_list li').event('mouseover', this.block_model.showMenu, this.block_model)
										.event('mouseout', this.block_model.hideMenu, this.block_model);
		});
	};

	/**
	 * =======================================================================================================
	 * detail
	 * block details
	 * @access public
	 * @execute routing
	 * @return void
	 * =======================================================================================================
	 */
	this.detail = function() {
		DOM.id('block_delete').event('submit', function(ev) {
			if ( !confirm('ブロックを削除します。よろしいですか？')) {
				ev.preventDefault();
			}
		});
	};
	
	/**
	 * =======================================================================================================
	 * createMenu
	 * create DOM Element for show block description
	 * @access public
	 * @execute call
	 * =======================================================================================================
	 */
	this.createMenu = function() {
		this.ppMenu = DOM.create('div').addClass('sz_pp_menu').appendTo(window['IEFIX'] ? IEFIX.body : document.body);
	};

	/**
	 * =======================================================================================================
	 * _remap
	 * re:mapping routing method
	 * @access private
	 * @execute call
	 * @param String method
	 * =======================================================================================================
	 */
	this._remap = function(method) {
		if (this[method]) {
			this[method]();
		} else {
			this.index();
		}
	};
});