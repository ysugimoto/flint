ClassExtend('Controller', function EditMemberController() {
	
	this.__construct = function() {
		this.load.module('ui');
		this.load.ajax();
	};
	
	this.index = function() {
		var t, txt, d;
		
		Module.ready('ui', function() {
			new Module.zoom('sz_zoom', 'ajax', {width : 600, height : 500});
		});
		
		this.event.exprLive('a.delete', 'click', function(ev) {
			ev.preventDefault();
			
			if ( ! confirm('ユーザーを削除します。よろしいですか？') ) {
				return false;
			}
			this.ajax.get(ev.target.href + '/' + this.config.item('sz_token'), {
				error : function() { alert('ユーザーの削除に失敗しました。');},
				success : function(resp) {
					if (resp.responseText === 'complete') {
						DOM(ev.target).parent()
										.parent()
										.animate('fade', {
													speed : 30,
													afterHide : true
													}
												);
					} else if (resp.responseText === 'cannot') {
						alert('指定したユーザーは削除できません！');
					} else {
						alert('ユーザーの削除に失敗しました。');
					}
				}
			});
		});
		this.event.exprLive('a.unlock', 'click', function(ev) {
			ev.preventDefault();
			if ( !confirm('アカウントロックを解除します。よろしいですか？') ) {
				return;
			}
			location.href = DOM(ev.target).readAttr('href') + '/' + FL.config.item('sz_token');
		});
		this.event.exprLive('a.dpi', 'click', function(ev) {
			ev.preventDefault();
			if (!confirm('プロフィール画像を削除します。よろしいですか？')
					|| /no_image\.gif$/.test(DOM(ev.target).prev().readAttr('src'))) {
				return;
			}
			this.ajax.get(ev.target.href + '/' + FL.config.item('sz_token'), {
				error : function() { alert('プロフィール画像の削除に失敗しました。');},
				success : function(resp) {
					if (resp.responseText === 'complete') {
						DOM(ev.target).prev()
										.attr('src', FL.config.baseUrl() + 'images/no_image.gif');
					} else {
						alert('プロフィール画像の削除に失敗しました。');
					}
				}
			});
		});

	};
});