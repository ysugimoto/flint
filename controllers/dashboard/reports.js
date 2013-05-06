/**
 * ================================================================================
 * Seezoo report Controller
 * 
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * ================================================================================
 */
ClassExtend('Controller', function() {
	
	this.__construct = function() {
		
	};
	
	this.index = function() {
		DOM('a.delete').event('click', this.__confirmDeleteReport, this);
	};
	
	this.detail = function() {
		DOM('a.detail_show').event('click', this.__toggleAnswerDetails, this);
		DOM('a.delete_report').event('click', this.__confirmDeleteAnswer, this);
	};
	
	this.__toggleAnswerDetails = function(ev) {
		var e = DOM(ev.target),
			mode = e.readAttr('rel'),
			t = e.parent().prev().detect('tr').getRange(4),
			ntNode = document.createTextNode(mode === 'hide' ? '回答を数件表示' : '回答を全て表示');
		
		t.foreach(function() {
			DOM(this).addStyle('display', mode === 'hide' ? '' : 'none');
		});
		e.attr('rel', mode === 'hide' ? 'show' : 'hide');
		e.get().replaceChild(ntNode, e.get().lastChild);
	};
	
	this.__confirmDeleteAnswer = function(ev) {
		ev.preventDefault();
		if ( ! confirm('お問い合せを削除します。よろしいですか？\n（この処理は元に戻せません）')) {
			return;
		}
		var that = this,
			e = DOM(ev.currentTarget);
		
		this.ajax.get(ev.currentTarget.href, {
			error : function() {
				alert('レポートの削除に失敗しました。');
			},
			success : function(resp) {
				if (resp.responseText === 'complete') {
					e.parent(2).animate('fade');
				}
			}
		});
	};
	
	this.__confirmDeleteReport = function(ev) {
		ev.preventDefault();
		if ( ! confirm('このフォームに投稿されたレポートが全て削除されます。よろしいですか？\n（この処理は元に戻せません）')) {
			return;
		}
		var that = this,
			e = DOM(ev.currentTarget);
		
		this.ajax.get(ev.currentTarget.href, {
			error : function() {
				alert('レポートの削除に失敗しました。');
			},
			success : function(resp) {
				if (resp.responseText === 'complete') {
					DOM.create('span').inText('問い合わせはありません。')
						.replaceTo(e.prev());
				}
			}
		});
	};
});