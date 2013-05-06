/**
 * =======================================================================================================
 *
 * Seezoo dashboard blog entry_list Controller
 *
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 *
 * =======================================================================================================
 */
ClassExtend('Controller', function() {

	this.tooltip;

	/**
	 * =======================================================================================================
	 * constructor
	 * =======================================================================================================
	 */
	this.__construct = function() {
		this.load.module('ui');
	};

	// no works...
	this.detail = this.delete_confirm = function() {
		// preview
		Module.ready('ui', function() {
			new Module.zoom('sz_zoom', 'image', {width : '100%', height : 500});
		});

	};

	this.index = function() {
		this.tooltip = DOM.create('div')
							.addClass('tooltip')
							.appendTo();

		DOM('td.tooltip a').event('mouseover', this.__showTip, this)
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