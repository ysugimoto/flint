/**
 * ===============================================================================================
 *
 * Seezoo dashboard site setting Controller
 *
 * manage edit setting event
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 *
 * ===============================================================================================
 */
ClassExtend('Controller', function() {

	// local variable
	var uri = this.config.baseUrl(),
		head = document.getElementsByTagName('head')[0];

	/**
	 * ===============================================================================================
	 * constructor
	 * ===============================================================================================
	 */
	this.__construct = function() {
		this.load.module('layer');
		this.load.model('site_model');
		this.load.library('modal');
		this.load.ajax();
	};

	/**
	 * ===============================================================================================
	 * default method ad update method
	 * ===============================================================================================
	 */
	this.index = this.update = function() {
		var that = this, sending = false, t, rewrite;

		this.ready('site_model', function() {
			DOM.id('setting_form').event('submit', this.site_model.validate, this.site_model);
		});

		if (DOM('span#favicon_area img').length > 0) {
			DOM.create('a').attr({href : 'javascript:void(0)', id : 'delete_favicon'})
							.html('削除する')
							.appendTo(DOM.id('favicon_area'));
		};

		// set favicon update event
		this.event.exprLive('a#delete_favicon', 'click', function(){
			if (confirm('現在登録されているアイコンを削除します。よろしいですか？')) {
				that.ajax.get('dashboard/site_settings/delete_favicon/' + that.config.item('sz_token'), {
					error : function() { alet('faviconの削除に失敗しました。');},
					success : function(resp) {
						if (resp.responseText === 'complete') {
							DOM.id('favicon_area').html('なし');
						} else {
							alet('faviconの削除に失敗しました。');
						}
					}
				});
			}
		});

		DOM.id('delete_site_cache_btn').event('click', function(ev) {
			var t, txt;

			ev.stopPropagation();
			if (sending) { return; }
			sending = true;
			t = DOM.id('sz_cache_delete_message').show().addClass('processing');

			this.ajax.get('dashboard/site_settings/delete_site_cache/' + this.config.item('sz_token'), {
				success : function(resp) {
					txt = (resp.responseText === 'complete') ? 'キャッシュを削除しました。'
																	: 'キャッシュの削除に失敗しました。';
					t.html(txt).removeClass('processing');
					setTimeout(function() { t.hide();sending = false;}, 3000);
				}
			});
		}, this);

		// mod_rewrite form exists?
		if (DOM.id('use_mod_rewrite')) {
			DOM.id('use_mod_rewrite').event('click', function(ev) {
				that.ajax.get('dashboard/site_settings/set_mod_rewrite_flag/1/' + that.config.item('sz_token'), {
					success: function(resp) {
						if (resp.responseText === 'not_found') {
							alert('.htaccessファイルが見つかりません。');
						} else {
							location.reload();
						}
					}
				});
			});
		}

		if (DOM.id('remove_mod_rewrite')) {
			DOM.id('remove_mod_rewrite').event('click', function(ev) {
				if ( ! confirm('短縮URLを解除します。よろしいですか？')) { return; }
				that.ajax.get('dashboard/site_settings/set_mod_rewrite_flag/0/' + that.config.item('sz_token'), {
					success: function(resp) {
						location.reload();
					}
				});
			});
		}
		
		DOM.id('change_site_cache_btn').event('click', function(ev) {
			var e = DOM(ev.currentTarget), flag = (ev.currentTarget.rel > 0) ? 0 : 1, txt, t;
			
			ev.stopPropagation();
			if (sending) { return; }
			sending = true;
			t = DOM.id('sz_cache_setting_message').show().addClass('processing');

			this.ajax.get('dashboard/site_settings/change_site_cache/' + flag + '/' + this.config.item('sz_token'), {
				success : function(resp) {
					txt = 'キャッシュ設定を変更しました。';
					t.html(txt).removeClass('processing')
						.prev().html(flag > 0 ? 'キャッシュを使用する' : 'キャッシュを使用しない');
					e.first().html(flag > 0 ? 'キャッシュをオフにする' : 'キャッシュをオンにする');
					e.attr('rel', flag);
					setTimeout(function() { t.hide();sending = false;}, 3000);
				}
			});
		}, this);
		
//		if (DOM.id('toggle_rewrite')) {
//			rewrite = DOM.id('mod_rewrite_code').detect('textarea');
//			if (DOM.id('toggle_rewrite').get().checked === true) {
//				rewrite.get(0).hide();
//				rewrite.get(1).show('i');
//			}
//			DOM.id('toggle_rewrite').event('click', function(ev) {
//				var ch = this.checked;
//				
//				rewrite.get(0)[ch ? 'hide' : 'show']('i');
//				rewrite.get(1)[ch ? 'show' : 'hide']('i');
//			});
//		}
	};

	/**
	 * ===============================================================================================
	 * catchFaviconUploaded
	 * catch favion uploaded from iframe
	 * @access public [global sendData]
	 * @execute call
	 * @return void
	 * ===============================================================================================
	 */
	this.catchFaviconUploaded = function() {
		var links = head.getElementsByTagName('link'),
				len = links.length,
				i = 0;

		// create favicon image
		DOM.id('favicon_area').html('<img src="' + uri + 'files/favicon/favicon.ico" />&nbsp;<a href="javascript:void(0)" id="delete_favicon">削除する</a>');
		// delete old favicon

		for (; i < len; i++) {
			if (links[i].rel == 'shortcut icon') {
				head.removeChild(links[i]);
			}
		}
		DOM.create('link').attr({type : 'image/x-icon', rel : 'shortcut icon', href : uri + 'files/favicon/favicon.ico'})
					.appendTo(head);
	};

	// move global to member function
	this.alias('sendData', this.catchFaviconUploaded);
});