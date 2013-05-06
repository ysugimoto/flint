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
		this.load.library('tab_changer');
		this.load.library('file_operator');
		this.load.ajax();
	};

	/**
	 * ===============================================================================================
	 * default method ad update method
	 * ===============================================================================================
	 */
	this.index = this.update = function() {
		var that = this, sending = false, t, rewrite, ogp, ogps;

		this.ready('site_model', function() {
			DOM.id('setting_form').event('submit', this.site_model.validate, this.site_model);
		});
		this.ready('tab_changer', function() {
			// hash mapping
			var hash = this.uri.getHash(),
				initial = 0;
			
			if ( hash !== '' ) {
				initial = parseInt(hash.replace('tab_content', ''), 10) - 1;
			}
			
			this.tab_changer.setUp({
				tabClass : 'tab',
				boxClass : 'sz_tab_content',
				activeClass : 'active',
				initial : initial
			});
		});

		if (DOM('span#favicon_area span').length > 0) {
			DOM.create('a').attr({href : 'javascript:void(0)', id : 'delete_favicon'})
							.html('削除する')
							.appendTo(DOM.id('favicon_area'));
		};

		// set favicon update event
		this.event.exprLive('a#delete_favicon', 'click', function(){
			if (confirm('現在登録されているアイコンを削除します。よろしいですか？')) {
				that.ajax.get('dashboard/site_settings/base/delete_favicon/' + that.config.item('sz_token'), {
					error : function() { alet('faviconの削除に失敗しました。');},
					success : function(resp) {
						if (resp.responseText === 'complete') {
							location.reload();
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

			this.ajax.get('dashboard/site_settings/base/delete_site_cache/' + this.config.item('sz_token'), {
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
				that.ajax.get('dashboard/site_settings/base/set_mod_rewrite_flag/1/' + that.config.item('sz_token'), {
					success: function(resp) {
						if (resp.responseText === 'not_found') {
							alert('.htaccessファイルが見つかりません。');
						} else {
							location.href = that.config.baseUrl() + 'dashboard/site_settings/base#tab_content2';
						}
					}
				});
			});
		}

		if (DOM.id('remove_mod_rewrite')) {
			DOM.id('remove_mod_rewrite').event('click', function(ev) {
				if ( ! confirm('短縮URLを解除します。よろしいですか？')) { return; }
				that.ajax.get('dashboard/site_settings/base/set_mod_rewrite_flag/0/' + that.config.item('sz_token'), {
					success: function(resp) {
						location.href = that.config.baseUrl() + 'index.php/dashboard/site_settings/base' + that.uri.getHash(true);
					}
				});
			});
		}
		
		if ( DOM.id('mod_rewrite_text') ) {
			DOM.id('mod_rewrite_text').event('click', function(ev) {
				this.select();
			});
		}

		DOM.id('change_site_cache_btn').event('click', function(ev) {
			var e = DOM(ev.currentTarget), flag = (ev.currentTarget.rel > 0) ? 0 : 1, txt, t;

			ev.stopPropagation();
			if (sending) { return; }
			sending = true;
			t = DOM.id('sz_cache_setting_message').show().addClass('processing');

			this.ajax.get('dashboard/site_settings/base/change_site_cache/' + flag + '/' + this.config.item('sz_token'), {
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
		
		DOM.id('log_level').event('change', function(ev) {
			var v = this.value;
			
			DOM(this).parent().detect('span').foreach(function(n) {
				if ( n == v ) {
					DOM(this).show('i');
				} else {
					DOM(this).hide();
				}
			});
		});
		
		DOM.id('update_log_level').event('click', function(ev) {
			var t, txt;

			ev.stopPropagation();
			if (sending) { return; }
			sending = true;
			t = DOM.id('sz_log_setting_message').show().addClass('processing');

			this.ajax.post('dashboard/site_settings/base/update_log_level/' + this.config.item('sz_token'), {
				param : { level : DOM.id('log_level').getValue() },
				success : function(resp) {
					txt = (resp.responseText === 'complete') ? 'ログレベルを変更しました。'
																	: 'ログレベルの変更に失敗しました。';
					t.html(txt).removeClass('processing');
					setTimeout(function() { t.hide();sending = false;}, 3000);
				}
			});
		}, this);
		
		
		
		DOM.id('debug_level').event('change', function(ev) {
			var v = this.value;
			
			DOM(this).parent().detect('span').foreach(function(n) {
				if ( n == v ) {
					DOM(this).show('i');
				} else {
					DOM(this).hide();
				}
			});
		});
		DOM.id('update_debug_level').event('click', function(ev) {
			var t, txt;

			ev.stopPropagation();
			if (sending) { return; }
			sending = true;
			t = DOM.id('sz_debug_setting_message').show().addClass('processing');

			this.ajax.post('dashboard/site_settings/base/update_debug_level/' + this.config.item('sz_token'), {
				param : { level : DOM.id('debug_level').getValue() },
				success : function(resp) {
					txt = (resp.responseText === 'complete') ? 'デバッグレベルを変更しました。'
																	: 'デバッグレベルの変更に失敗しました。';
					t.html(txt).removeClass('processing');
					setTimeout(function() { t.hide();sending = false;}, 3000);
				}
			});
		}, this);
		
		// OGP initialize
		this.setUpAPIHandle();
		if ( document.getElementById('ogp_enabled') ) {
			ogp  = DOM.id('ogp_enabled');
			ogps = ogp.parent(2).detect('div.division');
			ogps.foreach(function() {
					toggleOGP(DOM(this));
				});
			ogp.event('click', function() {
				ogps.foreach(function() {
					toggleOGP(DOM(this));
				});
			});
		}
		
		function toggleOGP(e) {
			e[ogp.get().checked === true ? 'show' : 'hide']();
		}
		
		// mobile carrier flag control
		if ( document.getElementById('enable_carriers') ) {
			DOM('#enable_carriers dl').event('click', function(ev) {
				var elm = DOM(this),
					ipt = elm.getOne('input'),
					enb = elm.hasClass('enable');
				
				elm[enb ? 'removeClass' : 'addClass']('enable');
				ipt.get().checked = !!!enb;
			});
		}

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
	
	
	this.setUpAPIHandle = function() {
		var that = this, target, handle,
			multiInited = false;

		// file API handler
		var setImageCallback = function() {
			that.file_operator.init(target, handle, 'simple');
		};

		// file API
		var fileAPIHandleClass = 'div.sz_file_api_block, div.sz-pp-contents span.sz_file_api_block_name';
		
		this.event.exprLive(fileAPIHandleClass, 'click', function(ev) {
			ev.preventDefault();
			target = DOM(ev.target);
			if (target.tag === 'span') { target = target.parent();}
			handle = Helper.createDOMWindow('画像の選択', '', 918, '85%', false, true);
			that.ajax.get('ajax/get_files_image_dir/' + (target.getOne('input').getValue() || 0) + '/' + that.config.item('sz_token'), {
				success : function(resp) {
					handle.setContent(resp.responseText);
					setImageCallback();
				}
			});
		});

		// remove current selects
		var removeFileSelectionClass = 'div.sz_file_api_block > a.remove_selection';

		this.event.exprLive(removeFileSelectionClass, 'click', function(ev) {
			DOM(ev.target).parent().detect('input').get(0, true).setValue('');
			DOM(ev.target).parent().detect('span').get(0, true).html('ファイルを選択');
		});
	};

	// move global to member function
	this.alias('sendData', this.catchFaviconUploaded);
});