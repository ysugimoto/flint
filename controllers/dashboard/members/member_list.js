ClassExtend('Controller', function MemberListController() {
	
	this.__construct = function() {
		this.load.module('ui');
		this.load.ajax();
	};
	
	
	this.index = function() {
		var search = DOM.id('search_open'),
			fm = search.parent().next();
		
		search.event('click', function(ev) {
			ev.preventDefault();
			fm.toggleShow();
		});
		
		this.__commonProcess();
	};
	
	this.search = function() {
		this.__commonProcess();
	};
	
	this.__commonProcess = function() {
		var that = this;
		
		Module.ready('ui', function() {
			new Module.zoom('sz_zoom', 'ajax', {width : 600, height : 500});
		});
		
		DOM('a.unlock_member')
			.event('click', function(ev) {
				var e = DOM(ev.currentTarget);
				
				if ( confirm('メンバーのロック状態を解除します。よろしいですか？') ) {
					this.ajax.get('dashboard/members/member_list/ajax_unlock_member/' + ev.currentTarget.rel + '/' + this.config.item('sz_token'), {
						error : function() { alert('処理に失敗しました。')},
						success : function(resp) {
							if ( resp.responseText === 'success' ) {
								e.animate('fade');
							} else {
								alert('処理に失敗しました:' + resp.responseText);
							}
						}
					});
				}
			}, this)
		
		this.event.exprLive('a.delete', 'click', function(ev) {
			ev.preventDefault();
			
			if ( ! confirm('ユーザーを削除します。よろしいですか？') ) {
				return false;
			}
			that.ajax.get(ev.target.href + '/' + that.config.item('sz_token'), {
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
			if ( /no_image\.gif$/.test(DOM(ev.target).prev().readAttr('src'))
						|| !confirm('プロフィール画像を削除します。よろしいですか？')) {
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
	
	this.updateProfileImage = function(imgPath) {
		if (!document.getElementById('member_profile_image')) {
			return;
		}
		var FL = getInstance();
		
		DOM.id('member_profile_image')
			.attr('src', FL.config.baseUrl() + 'files/members/' + imgPath);
	};
	
	this.alias('updateProfileImage', this.updateProfileImage);

});