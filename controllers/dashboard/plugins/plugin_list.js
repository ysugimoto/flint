ClassExtend('Controller', function PluginListController() {
	
	this.__construct = function() {
		this.load.ajax();
		this.load.module('ui');
	};
	
	this.index = function() {
		
		Module.ready('ui', function() {
			new Module.zoom('plugin_detail', 'ajax', {width : 700, height : 500});
		}) ;
		
		//DOM.id('scan_plg').event('click', this.__scanPlugins, this);
		this.event.exprLive('a#toggle_check', 'click', this.toggleCheck, this);
		this.event.exprLive('div#scaned_plugin_list table td', 'click', this.checkControl, this);
		// remove confirm
		this.event.exprLive('a#remove_plugin, a.delete', 'click', this.__deleteConfirm, this);
	};
	
	this.toggleCheck = function(ev) {
		var t = DOM(ev.target),
		checked = (t.readAttr('rel') === 'is_check') ? false : true,
		nch = checked ? 'is_check' : '';
	
		DOM('div#scaned_plugin_list table input').foreach(function() {
			this.checked = checked;
		});
		t.attr('rel', nch);
	};
	
	this.checkControl = function (ev) {
		var check = DOM(ev.target).parent().getOne('input').get();
		
		if (!check) { return;}
		else {
			check.checked = (check.checked === true) ? false : true;
		}
	};
	
	this.__deleteConfirm = function(ev) {
		if ( ! confirm('プラグインをアンインストールします。\n'
				          + 'このプラグインにより生成されたページがある場合、バージョンも含め削除されます。'
				          + '（ブロックは以前のバージョンのものは表示されますが、新規追加はできなくなります。）\n\nよろしいですか？')) {
			return false;
		}
	};
	
	this.__scanPlugins = function(ev) {
		ev.preventDefault();
		
		var that = this,
			state = DOM(ev.target).next().show('i'),
			box = DOM.id('scaned_plugin_list')
						.addStyle({
							height : '0px',
							overflow : 'hidden'
						});
		
		this.ajax.get(ev.target.href, {
			error : function() {
				alert('プラグインのスキャンに失敗しました。');
			},
			success: function(resp) {
				box.html(resp.responseText)
					.animate('blindDown', {
						mode : 'y',
						speed : 30,
						easing : -50,
						callback : function () {state.hide();}
				});
			}
		});
	};
	
	this.__getPluginDescription = function(ev) {
		var e = DOM(ev.target),
			pName = ev.target.rel,
			target = e.parent().prev().last();
		
		if (target.isEmpty()) {
			this.ajax.get('dashboard/plugins/plugin_list/get_plugin_detail/' + pName + '/' + this.config.item('sz_token'), {
				error : function() {
					alert('プラグイン詳細の取得に失敗しました。');
				},
				success: function(resp) {
					target.html(resp.responseText)
							.show();
				}
			});
		} else {
			target.show();
		}
	};
	
});