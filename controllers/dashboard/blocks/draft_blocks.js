/**
 * ===============================================================================================
 * 
 * Seezoo dashboard drafted block Controller
 * 
 * manage draft block edti action
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * 
 * ===============================================================================================
 */
ClassExtend('Controller', function() {

	var handle;
	
	/**
	 * ===============================================================================================
	 * constructor
	 * ===============================================================================================
	 */
	this.__construct = function() {
		this.currentShow = null;
		this.load.ajax();
		this.load.module('layer');
	};

	/**
	 * ===============================================================================================
	 * default method
	 * ===============================================================================================
	 */
	this.index = function() {
		var that = this;
		
		DOM('h4.draft_block_caption').event('click', function(ev) {
			var e = DOM(ev.target), t, p, m;

			if (e.tag !== 'a') { return;}
			if (e.hasClass('view')) {
				t = e.parent().next();
				if (t.isHidden()) {
					t.show().animate('blindDown', {speed : 10, easing : 30});
				} else {
					t.animate('blindUp', {speed : 10, easing : 30, afterHide : true});
				}
			} else if (e.hasClass('delete')) {
				ev.preventDefault();
				m = (e.hasClass('static')) ? '共有' : '下書き';
				if (confirm(m + 'ブロックを削除します。よろしいですか？')) {
					that.__deleteDraft(e);
				}
			} else if ( e.hasClass('edit') ) {
				//handle && handle.release();
				handle = new RenameBox(e);
			}
		});
	};
	
	/**
	 * ===============================================================================================
	 * __deleteDraft
	 * delete drafted block
	 * @access private
	 * @execute call
	 * @param xElement e
	 * @return void
	 * ===============================================================================================
	 */
	this.__deleteDraft = function(e) {
		var href = e.readAttr('href') + '/' + this.config.item('sz_token');

		this.ajax.get(href, {
			error : function() { alert('下書きブロックの削除に失敗しました。');},
			success: function(resp) {
				if (resp.responseText === 'complete') {
					e.parent().animate('fade', { speed : 15})
						.next().animate('fade', {speed : 15});
				} else {
					alert('下書きブロックの削除に失敗しました。');
				}
			}
		})
	};
	
	
	/* ===================== Inner Class ====================== */
	
	
	function RenameBox(elm) {
		this.element = elm.get();
		this.layer   = new Module.layer(true);
		this.box     = DOM.id('sz_block_draft_static_namespace')
		                  .addStyle('position', 'fixed');
		this.closeBtn = this.box.getOne('a');
		this.construct();
	}
	
	RenameBox.prototype = {
		construct : function() {
			this.box.show();
			var name = this.box.getOne('input#rec_name'),
				id     = this.box.getOne('input#block_id'),
				fm     = this.box.getOne('form'),
				FL     = getInstance(),
				action = FL.config.siteUrl() + 'dashboard/blocks/draft_blocks/rename_' + this.element.rel + '/' + FL.config.item('sz_token');
			
			name.setValue(FL.ut.trim(this.element.previousSibling.nodeValue));
			id.setValue(this.element.id.replace('block_', ''));
			fm.attr('action',  action);
			this.closeBtn.event('click', this.close, this);
		},
		close : function(ev) {
			this.layer.hide();
			this.box.hide();
		}
	}
});