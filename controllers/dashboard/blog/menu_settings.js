ClassExtend('Controller', function() {
	
	this.__construct = function() {
		this.load.module('ui');
		this.load.ajax();
	};
	
	this.index = function() {
		var that = this;
		
		Module.ready('ui', function() {
			new Module.sortable({
				sortClass : 'sz_blog_menu_piece',
				callback : function() {
					//that.save();
				}
			});
		});
		
		// toggle hidden/visible
		DOM('#sz_blog_menu_setting_area a')
			.event('click', this.__toggleHidden)
			.event('mousedown', function(ev) { ev.stopPropagation();});
		
		// save
		DOM.id('save_state').event('click', this.__save, this);
	};
	
	this.__toggleHidden = function(ev) {
		var flag = this.rel,
			t = DOM(this).parent();
		
		if (flag > 0) { // hidden
			t.removeClass('hidden');
			this.rel = 0;
		} else {
			t.addClass('hidden');
			this.rel = 1;
		}
	};
	
	this.__save = function() {
		var param = [],
			ind = -1,
			msg,
			e,
			list = DOM('#sz_blog_menu_setting_area div.sz_blog_menu_piece');
		
		list.foreach(function(n) {
			e = DOM(this);
			param[++ind] = [this.getAttribute('sbid'), n + 1, e.hasClass('hidden') ? 1 : 0].join(':');
		});
		
		this.ajax.post('dashboard/blog/menu_settings/update_menu_setting', {
			param : { token : this.config.item('sz_token'), settings : param },
			success : function(resp) {
				if (resp.responseText === 'complete') {
					msg = DOM.id('state_msg').addStyle('opacity', 1).show();
					setTimeout(function() {
						msg.animate('fade');
					}, 3000);
					window.scrollTo(0, 0);
				} else {
					alert('保存に失敗しました。');
				}
			}
		})
	}
});