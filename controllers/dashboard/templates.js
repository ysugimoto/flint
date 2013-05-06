/**
 * ===============================================================================================
 * 
 * Seezoo dashboard template Controller
 * 
 * manage template change/preview/CSSEdit
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * 
 * ===============================================================================================
 */
ClassExtend('Controller', function templates() {
	
	/**
	 * ===============================================================================================
	 * constructor
	 * ===============================================================================================
	 */
	this.__construct = function() {
		this.load.module('ui');
		this.load.model('template_model');
		this.load.ajax();
	};
	
	/**
	 * ===============================================================================================
	 * default method
	 * ===============================================================================================
	 */
	this.index = function() {
		
		this.ready('template_model', function() {
			// template div hover
			DOM('div.templates').event('mouseover', this.template_model.hoverHandle)
								.event('mouseout', this.template_model.hoverOutHandle);
			
			// config menu events
			// uninstall?
			DOM('a.uninstall').event('click', this.template_model.confimUninstall, this.template_model);
			
			// set_default
			DOM('a.set_default').event('click', this.template_model.setDefault, this.template_model);
		});
		// preview
		Module.ready('ui', function() {
			new Module.zoom('sz_zoom', 'external', {width : '90%', height : 500});
			new Module.zoom('sz_zoom_css', 'ajax', {width : 600, height : 500});
		});
		
		if ( document.getElementById('get_template') ) {
			new GetTemplateConnector(DOM.id('get_template'));
		}
	};
	
	/**
	 * ===============================================================================================
	 * _remap
	 * re:mapping routing method
	 * @access private
	 * @exrcute call
	 * @param String method
	 * ===============================================================================================
	 */
	this._remap = function(method) {
		if (this[method]) {
			this[method]();
		} else {
			this.index();
		}
	};
	
	
	function GetTemplateConnector(element) {
		this.FL      = getInstance();
		this.trigger = element;
		this.uri     = element.readAttr('href');
		this.layer;
		this.box;
		
		// stack paramters
		this.page = 0;
		
		this.__construct();
	}
	
	GetTemplateConnector.prototype = {
		__construct : function() {
			this.FL.load.module('layer');
			this.layer = new Module.layer();
			this.box   = DOM.create('div')
								.addClass('template_api_box')
								.appendTo()
								.addStyle('position', 'fixed');
			// inner content
			this.content = DOM.create('div')
								.addClass('api_content')
								.appendTo(this.box);
			// next previous button
			this.prev  = DOM.create('a')
								.addClass('next_prev prev')
								.attr({href : 'javascript:void(0)', rel :  'prev'})
								.inText('前へ')
								.appendTo(this.box);
			this.next  = DOM.create('a')
								.addClass('next_prev next')
								.attr({href : 'javascript:void(0)', rel :  'next'})
								.inText('次へ')
								.appendTo(this.box);
			// close button
			this.close = DOM.create('a')
								.addClass('close')
								.attr({href : 'javascript:void(0)', rel :  'close'})
								.inText('閉じる')
								.appendTo(this.box);
			// event listening start
			this.trigger.event('click', this.request, this);
			// API handles
			this.FL.event.exprLive('div.template_api_box a.next_prev', 'click', this.nextPrev, this);
			// close handle
			this.close.event('click', this.closeHandle, this);
		},
		request : function(ev) {
			ev.preventDefault();
			var that = this;
			
			this.layer.show();
			this.box.addClass('tpl_loading')
						.addStyle('height', '0px')
						.show();
			
			new Animation(
				this.box,
				{
					height : 400,
					marginTop : -200
				},
				{
					easing : 100,
					speed : 40,
					callback : function() {
						that.FL.ajax.get(that.uri + '/' + that.page, {
							success : function(resp) {
								that.box.removeClass('tpl_loading');
								
								if ( resp.responseText === 'error' ) {
									that.box.hide();
									that.layer.hide();
									return;
								}
								that.content.html(resp.responseText);
							},
							error : function() {
								//alert('通信に失敗しました。');
								that.box.removeClass('tpl_loading');
								//that.layer.hide();
							}
						});
					}
				});
		},
		closeHandle : function(ev) {
			var that = this;
			
			new Animation(
				this.box.addClass('tplbox_closing'),
				{
					height : 0,
					marginTop : 0
				},
				{
					easing : 100,
					speed : 40,
					callback : function() {
						that.box.removeClass('tplbox_closing').hide();
						that.layer.hide();
					}
				}
			);
		}
	};
	
});