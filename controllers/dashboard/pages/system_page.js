/**
 * =======================================================================================================
 * 
 * Seezoo system page controller
 * 
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
		this.load.module('ui');
		this.load.model('pages_model');
		this.load.model('page_model');
		this.load.library('sz_calendar');
	};
	
	/**
	 * =======================================================================================================
	 * default method and rescan method
	 * =======================================================================================================
	 */
	this.index = this.rescan = function () {
		var that = this;
		
		this.ready('pages_model', function () {
			DOM.id('scan_page').event('click', this.pages_model.scanPage, this.pages_model);
			this.event.exprLive('a#toggle_check', 'click', this.pages_model.toggleCheck, this.pages_model);
			this.event.exprLive('div#scaned_page_list table td', 'click', this.pages_model.checkControl, this.pages_model);
			DOM('a.delete').event('click', this.pages_model.deleteSystemPage, this.pages_model);
			DOM('a.edit').foreach(function() {
				this.href += '/' + that.config.item('sz_token');
			}).event('click', this.pages_model.systemPageConfig, this.pages_model);
			DOM('td.page_titles a').event('click', function(ev) {
				if (/logout$/.test(this.href)) {
					if (!confirm('ログアウト状態になります。よろしいですか？')) {
						ev.preventDefault();
					}
				}
			});
			this.event.exprLive('a#check_exists', 'click', function(ev) {
				var p = DOM.id('sz_input_page_path'),
					pp = that.ut.trim(p.prev().getHTML());
				
				that.pages_model.checkPageExists(p + pp);
			});
		});
		
		DOM('a.close').event('click', function(ev) {
			ev.preventDefault();
			var e = DOM(this),
				p = e.parent();
			
			if ( e.hasClass('close') ) {
				p.animate('blindDown', {
					from     : 34,
					speed    : 10,
					callback : function() {
						p.addStyle('height', 'auto');
					}
				});
				e.replaceClass('close', 'open');
			} else {
				new Animation(p, { height : 34 }, { speed : 10 });
				e.replaceClass('open', 'close');
			}
		});
		
		this.event.exprLive('a.arrow_u', 'click', this._movePageUpper, this);
		this.event.exprLive('a.arrow_d', 'click', this._movePageLower, this);
	};
	
	/**
	 * =======================================================================================================
	 * _movePageUpper
	 * move system page upper
	 * @param Event ev
	 * @return void
	 * @access private
	 * @call Event handler
	 * =======================================================================================================
	 */
	this._movePageUpper = function(ev) {
		ev.preventDefault();
		var e = DOM(ev.target),
			et = e.next(),
			current = e.parent(),
			regex = 'systempage_',
			that = this,
			ac = 'addClass',
			rc = 'removeClass',
			h = 'hide',
			dh = 'dashboard_page_',
			param,
			target;
		
		// guard process
		if ( current.parent().isFirst() ) {
			return;
		}
		target = current.prev();
		param = {
			from : current.get().id.replace(regex, ''),
			to   : target.get().id.replace(regex, '')
		};
		
		this.ajax.post('dashboard/pages/system_page/move_system_page/' + this.config.item('sz_token'), {
			param : param,
			error : function() { alert('通信エラーが発生しました。');},
			success : function(resp) {
				if ( resp.responseText === 'success' ) {
					current.appendTo(target, 'before');
					e[(!current.prev()) ? ac : rc](h);
					et.removeClass(h);
					target.getOne('a.arrow_u').removeClass(h);
					target.getOne('a.arrow_d')[(!target.next()) ? ac : rc](h);
					current.animate('highLight', { callback : function() {current.removeStyle('backgroundColor');}});
					target.animate('highLight', { callback : function() {target.removeStyle('backgroundColor');}});
					
					// move dashboard menu if exists
					if ( document.getElementById(dh + param.from)
							&& document.getElementById(dh + param.to) ) {
						DOM.id(dh + param.from)
							.appendTo(DOM.id(dh + param.to), 'before');
					}
					return;
				}
				alert('ページの移動に失敗しました。');
			}
		});
	};
	
	/**
	 * =======================================================================================================
	 * _movePageLower
	 * move system page lower
	 * @param Event ev
	 * @return void
	 * @access private
	 * @call Event handler
	 * =======================================================================================================
	 */
	this._movePageLower = function(ev) {
		ev.preventDefault();
		var e = DOM(ev.target),
			et = e.prev(),
			current = e.parent(),
			regex = 'systempage_',
			that = this,
			ac = 'addClass',
			rc = 'removeClass',
			h = 'hide',
			dh = 'dashboard_page_',
			param,
			target;
		
		// guard process
		if ( current.parent().isLast() ) {
			return;
		}
		target = current.next();
		param = {
			from : current.get().id.replace(regex, ''),
			to   : target.get().id.replace(regex, '')
		};
		
		this.ajax.post('dashboard/pages/system_page/move_system_page/' + this.config.item('sz_token'), {
			param : param,
			error : function() { alert('通信エラーが発生しました。');},
			success : function(resp) {
				if ( resp.responseText === 'success' ) {
					current.appendTo(target, 'after');
					e[(!current.next()) ? ac : rc](h);
					et.removeClass(h);
					target.getOne('a.arrow_d').removeClass(h);
					target.getOne('a.arrow_u')[(!target.prev()) ? ac : rc](h);
					current.animate('highLight', { callback : function() {current.removeStyle('backgroundColor');}});
					target.animate('highLight', { callback : function() {target.removeStyle('backgroundColor');}});
					
					// move dashboard menu is exists
					if ( document.getElementById(dh + param.from)
							&& document.getElementById(dh + param.to) ) {
						DOM.id(dh + param.from)
							.appendTo(DOM.id(dh + param.to), 'after');
					}
					return;
				}
				alert('ページの移動に失敗しました。');
			}
		});
	};
	
	/**
	 * =======================================================================================================
	 * _remap
	 * re:mapping routing method
	 * =======================================================================================================
	 */
	this._remap = function() {
		this.index();
	};
});