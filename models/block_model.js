/**
 * =======================================================================================================
 *  
 * Seezoo block model Class
 *  
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * 
 * =======================================================================================================
 */

ClassExtend('Model', function block_model() {
	
	var that = this;
	
	/**
	 * =======================================================================================================
	 * showMenu
	 * show block description
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.showMenu = function(ev) {
		var e = DOM(ev.currentTarget),
			desc = e.detect('p.alw_hide').get(0, true).getHTML();
		
		if (!desc) {
			desc = '概要はありません。';
		}
		this.parent.ppMenu.html(desc).addStyle({top : ev.pageY + 10 + 'px', left : ev.pageX + 5 +'px', display : 'block'});
	};
	
	/**
	 * =======================================================================================================
	 * hideMenu
	 * hide block description
	 * @access public
	 * @exeute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.hideMenu = function(ev) {
		var e = DOM(ev.currentTarget);
		
		this.parent.ppMenu.hide();
	};
	
	/**
	 * =======================================================================================================
	 * deleteConfirm
	 * confirm block uninstall
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.deleteConfirm = function(ev) {
		if (!confirm('ブロックをアンインストールします。よろしいですか？')) {
			ev.preventDefault();
		}
	}
});