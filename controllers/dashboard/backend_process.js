
ClassExtend('Controller', function() {
	
	this.__construct = function() {
		this.load.ajax();
	};
	
	this.index = function() {
		if (document.getElementById('exe_process')) { 
			DOM.id('exe_process').event('click', this.__executeProcess, this);
		}
		DOM.id('cron_address').event('click', function(ev) {
			ev.preventDefault();
			this.select();
		});
	};
	
	this.__executeProcess = function(ev) {
		var chList = DOM('table.backend_list').get(0).detect('td.pr'),
			that = this, ch, img;
		
		chList.foreach(function() {
			ch = DOM(this).first().get();
			img = DOM(this).last();
			
			if (ch.checked === true) {
				that.__doBackendProcess(ch, img);
			}
		});
	};
	
	this.__doBackendProcess = function(ch, img) {
		var that = this;
		
		DOM(ch).invisible();
		img.visible();
		
		this.ajax.post('dashboard/backend_process/run', {
			async : false,
			param : { id : ch.value, token : this.config.item('sz_token')},
			success : function(resp) {
				try {
					var json  = that.json.parse(resp.responseText);
					DOM(ch).parent(2).children(3).html(json.last_run)
										.next().html(json.result);
				} catch(e) {}
				finally {
					DOM(ch).visible();
					img.invisible();
				}
			}
		})
	}
});