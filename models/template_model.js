/**
 * =======================================================================================================
 *  
 * Seezoo template model Class
 *  
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * 
 * =======================================================================================================
 */
ClassExtend('Model', function template_model() {
	
	// capture this scope
	var that = this;
	
	/**
	 * =======================================================================================================
	 * hoverHandle
	 * mouseover event handler
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.hoverHandle = function(ev) {
		DOM(ev.currentTarget).addStyle('backgroundColor', '#ffc');
	};
	
	/**
	 * =======================================================================================================
	 * hoverOutHandle
	 * mouseout event handler
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.hoverOutHandle = function(ev) {
		DOM(ev.currentTarget).addStyle('backgroundColor', '#fbfbfb');
	};
	
	/**
	 * =======================================================================================================
	 * confirmUninstall
	 * confirm uninstall template
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.confimUninstall = function(ev) {
		var e = ev.currentTarget,
			p = this._getParentDIV(e);
		
		if (p) {
			if (DOM(p).detect('p.use_default').length > 0) {
				ev.preventDefault();
				alert('デフォルトに指定したテンプレートは削除できません！');
				return;
			}
		}
		
		if (!confirm('テンプレートをアンインストールします。\nこのテンプレートを適用しているページは\nデフォルトのテンプレートになります。よろしいですか？')) {
			ev.preventDefault();
		}
	};
	
	/**
	 * =======================================================================================================
	 * setDefault
	 * selected template to site default template
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.setDefault = function(ev) {
		ev.preventDefault();
		var e = ev.currentTarget, p = e;
		
		this.ajax.get(ev.currentTarget.href, {
			success : function(resp) {
				if (resp.responseText === 'complete') {
					p = that._getParentDIV(p);
					DOM('p.use_default').get(0).appendTo(p);
				} else {
					alert('デフォルト設定に失敗しました');
				}
			}
		});
	};
	
	/**
	 * =======================================================================================================
	 * _getParentDIV
	 * get target parent DIV element
	 * @access private
	 * @execute call
	 * @param HTMLElement p
	 * @return HTMLElement p
	 */
	this._getParentDIV = function(p) {
		while (p) {
			if (p.tagName.toLowerCase() === 'div' && DOM(p).hasClass('templates')) {
				break;
			}
			p = p.parentNode;
		}
		return p;
	};
});