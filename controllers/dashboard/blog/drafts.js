/**
 * =======================================================================================================
 * 
 * Seezoo dashboard drafted drafted entry_list Controller
 * 
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * 
 * =======================================================================================================
 */
ClassExtend('Controller', function() {
	
	// no works...
	this.index = function() {
		DOM('a.delete').event('click', function() {
			return confirm('下書きを削除します。よろしいですか？');
		});
		
		this.tooltip = DOM.create('div')
							.addClass('tooltip')
							.appendTo();

		DOM('td.tooltip span').event('mouseover', this.__showTip, this)
								.event('mouseout', this.__hideTip, this)
	};
		
	this.__showTip = function(ev) {
		var dim = DOM(ev.currentTarget).absDimension(),
			text = DOM(ev.currentTarget).next().getHTML();
		
		this.tooltip.addStyle({
			top : dim.top - dim.height - 25 + 'px',
			left : dim.left + 'px',
			display : 'block'
		})
		.html(text)
		.animate('appear', {speed : 20});
	};
	
	this.__hideTip = function(ev) {
		this.tooltip.hide();
	};
});