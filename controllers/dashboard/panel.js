/**
 * ===============================================================================================
 * 
 * Seezoo dashboard panel Controller
 * 
 * fake Controller (not to do.)
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * 
 * ===============================================================================================
 */
ClassExtend('Controller', function() {
	
	var pp;
	
	this.index = function() {
		// you want to see a comment?
		this.event.exprLive('a.open_approve_comment', 'click', function(ev) {
			if (ev.target.rel == 1) {
				DOM(ev.target).attr('rel', 0).next().animate('blindUp', { speed : 10 });
			} else {
				DOM(ev.target).attr('rel', 1).next().animate('blindDown', { speed : 10});
			}
		});
		
		// cancel approve order
		this.event.exprLive('a.cancel_approve_order', 'click', this.__cancelApprove, this);
		
		DOM('a.version_preview').event('click', this.__doPreview, this);
	};
	
	this.__doPreview = function(ev) {
		ev.preventDefault();
		ev.stopPropagation();
		var info = DOM.create('div').addClass('sz_sh_panel_page_preview_info')
										.appendTo(),
			html, data = ev.target.rel.split(':'); /* data = [version_number, page_id] */
		
		pp = Helper.createDOMWindow('[バージョン:' + data[0] + '&nbsp;]&nbsp;のプレビュー(承認モード)', '', '90%', '90%', false, true), that = this;

		pp.setContent((['<iframe src="', ev.target.href, '" frameborder="0" style="width:100%;height:100%" />']).join(''));
		html = [
					DOM(ev.target).parent().getOne('div.sz_approve_comment').getHTML(),
					'<form id="sz_approve_form" method="post" action="', this.config.siteUrl(), 'dashboard/panel/approve/', this.config.item('sz_token'), '">',
					'<p>コメント</p>',
					'<textarea name="approve_comment" id="approve_comment"></textarea>',
					'<input type="hidden" name="approve_type" id="approve_type" value="" />',
					'<input type="hidden" name="approve_page" id="approve_page" value="', data[1], '" />',
					'<input type="hidden" name="approve_version" id="approve_version" value="', data[0], '" />',
					'<input type="hidden" name="approve_order_id" id="approve_order_id" value="', data[2], '" />',
					'<p style="text-align:center">',
						'<a href="javascript:void(0)" rel="2">差し戻し</a>',
						'<a href="javascript:void(0)" rel="1">公開承認する</a>',
					'</p>',
					'</form>'
				];
		info.html(html.join(''));
		info.detect('a').event('click', this.__doApprove, this);
		info.getOne('textarea').method('focus');
		pp.setOnClose(function() {
			info.detect('a').unevent('click');
			info.remove();
		});
	};
	
	this.__doApprove = function(ev) {
		var type = ev.target.rel, // 1 or 2
			comment = DOM.id('approve_comment');
		
		DOM.id('approve_type').setValue((type == 2) ? 'sendback' : 'approve');
		if (type == 1) {
			if (confirm('ページを承認し、公開バージョンに変更します。よろしいですか？')) {
				this.__send();
			}
		} else if (comment.getValue() === '') {
			if (confirm('コメントが空欄です。\nこのまま送信してもよろしいですか？')) {
				this.__send();
			}
		} else {
			this.__send();
		}
	};
	
	this.__send = function() {
		DOM.id('sz_approve_form').method('submit');
	};
	
	this.__cancelApprove = function(ev) {
		if ( ! confirm('承認申請を取り消します。よろしいですか？\n\n（下書き保存したデータは削除されません）')) { return; }
		var e = DOM(ev.target), that = this;
		
		this.load.ajax();
		
		this.ajax.get('dashboard/panel/cancel_approve/' + ev.target.rel + '/' + this.config.item('sz_token'), {
			error : function() {alert('申請取り消しに失敗しました。'); },
			success : function(resp) {
				if (resp.responseText === 'complete') {
					e.parent().animate('fade', {speed : 30, callback : function() {
						var ul = e.parent(2);
						DOM(this).remove();
						if (ul.detect('li').length === 0) {
							DOM.create('li').inText('申請情報はありません。').appendTo(ul);
						}
					}});
				} else if (resp.responseText === 'error'){
					alert('申請取り消しに失敗しました。');
				} else {
					alert(resp.responseText);
				}
			}
		});
	}
});
