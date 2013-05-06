ClassExtend('Controller', function() {
	
	this.__construct = function() {
		
	};
	
	this.index = function() {
		if (!document.getElementById('open_close')) { return; }
		
		var btn = DOM.id('open_close')
						.event('click', function() {
							return confirm('システムのアップグレードを実行します。よろしいですか？');
						})
		
		DOM.id('up_checked').event('click', function() {
			if (this.checked === true) {
				btn.visible().animate('appear');
			} else {
				btn.invisible();
			}
		}).get().checked = false;
		
	};
});