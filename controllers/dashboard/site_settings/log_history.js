ClassExtend('Controller', function LogHistoryController() {
	
	this.__construct = function() {
		this.load.ajax();
	};
	
	this.index = function() {
		var filter = DOM.id('filter_dd'),
			fm = DOM.id('log_form'),
			chs = fm.detect('input[type=checkbox]'),
			chLink = DOM.id('ch_all'),
			flag = false,
			base = this.config.siteUrl() + 'dashboard/site_settings/log_history/index/',
			offset = this.uri.segment(6, 0);
		
		// change and jump
		filter.change(function(ev) {
			location.href = base + this.value + '/' + offset;
		});
		
		// tr line click and record check or uncheck
		fm.detect('tr').click(function() {
			var c = DOM(this).getOne('input').get();
			
			c.checked = !!!c.checked;
		});
		
		// chechbox all check or uncheck
		chLink && chLink.click(function() {
			flag = !flag;
			chs.foreach(function() {
				this.checked = !!flag;
			});
		});
		
		// delete confirm
		fm.submit(function(ev) {
			if ( ! confirm('チェックを入れたものを削除します。よろしいですか？')) {
				ev.preventDefault();
			}
		});
		
		// clear confirm
		DOM.id('clear_log') && DOM.id('clear_log').event('click', function(ev) {
			return confirm('ログを全て削除します。よろしいですか？');
		});
	};
	
});