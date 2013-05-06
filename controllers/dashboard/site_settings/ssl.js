ClassExtend('Controller', function SslController() {
	
	this.index = function() {
		if ( document.getElementById('ssl_base_url')
				|| document.getElementById('enc') ) {
			var ipt = DOM.id('ssl_base_url'),
				trigger = DOM.id('enc'),
				enc = window.encodeURIComponent;
				
			
			trigger.click(function() {
				var v = enc(ipt.getValue())
							.replace(/%2F/g, '/')
							.replace(/%20/g, '+');
				
				ipt.setValue(v);
			});
			
			DOM.id('delete').click(function(ev) {
				if ( !confirm('SSL設定を解除します。よろしいですか？\n(現在設定されているSSLページもすべて解除されます)') ) {
					ev.preventDefault();
				}
			});
		}
	};
	
});