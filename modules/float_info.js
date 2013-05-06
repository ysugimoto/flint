/**
*flint float_info module
*create floatbox and popup
*@author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
*@create 2009/12/30
*/

(function(){
		var FL = getInstance(), win = window, doc = document;
		var DOM = FL.config.getGlobal('DOM'), Animation = FL.config.getGlobal('Animation');
		var Module = FL.config.getGlobal('Module');
		FL.load.css('float_info');

		// TODO : IE6 Fix

		var float = function(opt){
			if (FL.ua.IE6) return;
			this.opt = FL.union({timer : 0}, opt || {});
			this.box = DOM.create('div').addClass('fl_float_box').inText('testtest');
			if (FL.system.DOM_LOADED) {
				this.initialize();
			} else {
				FL.event.set(doc, 'DOMReady', this.initialize, this);
			}
		};

		float.prototype = {
			initialize : function() {
				this.box.appendTo();
				var that = this;
				win.setTimeout(function(){that.show();}, 200);
			},
			show : function() {
				var sc = FL.ut.getScrollPosition(), sh = (win.innerHeight) ? win.innerHeight : this.getWindowInnerHeight(), that = this;
				this.box.addStyle('opacity', 0).show();
				(FL.ua.IE6) ? this.box.addStyle('top', sh + sc.y + 'px') : this.box.addStyle('top', sh + 'px');
				Animation.appear(this.box, {from : 0, to : 0.7});
				Animation.moveY(this.box, {direction : false, distance : (FL.ua.IE) ? 150 : 80, __useClone : false, easing : 100, callback : function(){
					if (FL.ua.IE6) {
						that.box.prop('__currentY', sh);
						FL.event.set(win, 'scroll', that.positionFix, that);
					}
					win.setTimeout(function(){that.hide();}, 5000);
				}});
			},
			hide : function() {
				var that = this;
				Animation.fade(this.box, {from : 0.7, to : 0});
				Animation.moveY(this.box, {direction : true, distance : 80, __useClone : false, easing : 0, callback : function(){
					//that.box.hide();
					if (FL.ua.IE6) {
						FL.event.remove(win, 'scroll', that.positionFix);
					}
					win.setTimeout(function(){that.show();}, 2000);
				}});
			},
			positionFix : function(ev) {
				var sc = FL.ut.getScrollPosition().y;
				this.box.addStyle('top', this.box.prop('__currentY') + sc - 80 + 'px');
			},
			getWindowInnerHeight : function() { // for IE
				var h = doc.getElementsByTagName('body')[0];
				h.style.overflow = 'hidden';
				var def = h.style.height;
				h.style.height = 'auto';
				var ret = doc.body.clientHeight || doc.documentElement.clientHeight || 0;
				h.style.overflow = '';
				h.style.height = def;
				return ret;
			}
		};
		Module.float_info = float;
		Module.onReady('float_info');
})();