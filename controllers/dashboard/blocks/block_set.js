/**
 * ===============================================================================================
 * 
 * Seezoo dashboard block set Controller
 * 
 * manage block set action
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * 
 * ===============================================================================================
 */
ClassExtend('Controller', function BlockSetController() {

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
		
		DOM('#main table').event('click', function(ev) {
			var e = DOM(ev.target), t, p, m;

			if ( e.tag !== 'a' ) {
				return;
			} else if ( e.hasClass('delete') ) {
				ev.preventDefault();
				if ( confirm('ブロックマスタを削除します。よろしいですか？') ) {
					that.__deleteBlockSetMaster(e);
				}
			} else if ( e.hasClass('edit') ) {
				//handle && handle.release();
				handle = new RenameBox(e);
			}
		});
	};
	
	/**
	 * ===============================================================================================
	 * __deleteBlockSetMaster
	 * delete block set master
	 * @access private
	 * @execute call
	 * @param xElement e
	 * @return void
	 * ===============================================================================================
	 */
	this.__deleteBlockSetMaster = function(e) {
		var href = e.readAttr('href') + '/' + this.config.item('sz_token'),
			def;

		this.ajax.get(href, {
			error : function() { alert('ブロックマスタの削除に失敗しました。');},
			success: function(resp) {
				if (resp.responseText === 'complete') {
					def = e.parent(2).animate('fade', { speed : 15 });
					def.success(function() {
						e.parent(2).remove();
					});
				} else {
					alert('ブロックマスタの削除に失敗しました。');
				}
				
				DOM('table tr').foreach(function(num) {
					this.className = ( num % 2 > 0 ) ? 'odd' : '';
				});
				
				
			}
		})
	};
	
	/**
	 * ===============================================================================================
	 * __deleteBlockSetData
	 * delete block set data
	 * @access private
	 * @execute call
	 * @param xElement e
	 * @return void
	 * ===============================================================================================
	 */
	this.__deleteBlockSetData = function(e) {
		var href = e.readAttr('href') + '/' + this.config.item('sz_token');

		this.ajax.get(href, {
			error : function() { alert('ブロックの削除に失敗しました。');},
			success: function(resp) {
				if (resp.responseText === 'complete') {
					e.parent(2).animate('fade', { speed : 15});
						//.next().animate('fade', {speed : 15});
				} else {
					alert('ブロックの削除に失敗しました。');
				}
			}
		})
	};
	
	
	this.detail_edit = function() {
		var that = this;
		
		DOM('a.view, a.delete').event('click', function(ev) {
			
			var e = DOM(ev.target), t;
			
			if ( e.tag !== 'a' ) {
				return;
			} else if ( e.hasClass('view') ) {
				t = e.parent().next();
				if (t.isHidden()) {
					t.show().animate('blindDown', {speed : 10, easing : 30});
				} else {
					t.animate('blindUp', {speed : 10, easing : 30, afterHide : true});
				}
			} else if ( e.hasClass('delete') ) {
				ev.preventDefault();
				if ( confirm('登録ブロックを削除します。よろしいですか？') ) {
					that.__deleteBlockSetData(e);
				}
			}
		})
		.event('mousedown', function(ev) {
			ev.stopPropagation();
		});
		
		this.load.module('ui');
		Module.ready('ui', function() {
			new Module.sortable({
				sortClass : 'blockset',
				animate : true,
				callback : function() {
					var order = {};
					
					DOM('div.blockset').foreach(function(num) {
						order['order' + ++num] = this.getAttribute('data-blocksetid');
					});
					
					that.ajax.post('dashboard/blocks/block_set/update_sort_order/' + that.config.item('sz_token'), {
						param : order,
						error : function(resp) { alert(resp.responseText); },
						success : function(resp) {
							var txt = resp.responseText;
							
							if ( txt !== 'success' ) {
								alert(txt);
							}
						}
					});
				}
			});
		})
	}
	
	/* ===================== Inner Class ====================== */
	
	function RenameBox(elm) {
		this.element = elm;
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
				action = FL.config.siteUrl() + 'dashboard/blocks/block_set/rename/' + FL.config.item('sz_token');
			
			name.setValue(FL.ut.trim(this.element.parent().prev().prev().get().firstChild.nodeValue));
			name.method('focus');
			id.setValue(this.element.readAttr('id').replace('masterid_', ''));
			fm.attr('action',  action);
			this.closeBtn.event('click', this.close, this);
		},
		close : function(ev) {
			this.layer.hide();
			this.box.hide();
		}
	}
});