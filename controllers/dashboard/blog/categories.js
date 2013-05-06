/**
 * =======================================================================================================
 * 
 * Seezoo dashboard blog category Controller
 * 
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * 
 * =======================================================================================================
 */
ClassExtend('Controller', function() {

	var sortHandle;
	
	/**
	 * =======================================================================================================
	 * constructor
	 * =======================================================================================================
	 */
	this.__construct = function() {
		this.load.ajax();
		this.load.module('ui');
	}

	/**
	 * =======================================================================================================
	 * default method
	 * =======================================================================================================
	 */
	this.index = function () {
		this.currrentEdit = null;
		DOM('ul.sz_blog_category_list li[class!=ttl]')
			.event('mouseover', function (ev) { DOM(this).addClass('hover');})
			.event('mouseout', function (ev) { DOM(this).removeClass('hover');});
		
		this.event.exprLive('a.toggle_edit', 'click', this.toggleEdit, this);
		this.event.exprLive('a.li_del', 'click', this.liDel, this);
		this.event.exprLive('input.category_edit_button', 'click', this.ajaxEdit, this);

		DOM.id('add_category').event('click', function (ev) {
			ev.stopPropagation();
			DOM.id('additional_body').toggleShow();
		});
		
		DOM.id('additional_body').event('click', function (ev) {ev.stopPropagation();});
		
		this.event.set(document, 'click', function (ev) {
			DOM.id('additional_body').hide();
		});

		DOM.id('add_cat').Cevent('click', this.addCategoryMaster);
		
		Module.ready('ui', function() {
			sortHandle = new Module.sortable({
				sortClass : 'sz_cat_sortable',
				animate : true,
				callback : function() {
					var orders = {},
						FL = getInstance();
					
					DOM('li.sz_cat_sortable').foreach(function(num) {
						var e = DOM(this);
						// make order data
						orders['order' + ++num] = this.getAttribute('data-catid');
						
						// update odd-even
						e[num % 2 === 0 ? 'addClass' : 'removeClass']('odd');
					});
					
					FL.ajax.post('dashboard/blog/categories/ajax_sort_order/' + FL.config.item('sz_token'), {
						param : orders,
						error : function(resp) {
							alert(resp.responseText);
						},
						success : function(resp) {
							if ( resp.responseText !== 'complete' ) {
								alert(resp.responseText);
							}
						}
					});
				}
			});
		});
		DOM('li.sz_cat_sortable a, li.sz_cat_sortable input').event('mousedown', function(ev) { ev.stopPropagation(); });
	};

	/**
	 * =======================================================================================================
	 * toggleEdit
	 * toggle show/hide edit category form
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.toggleEdit = function (ev) {
		var e = DOM(ev.target), p = e.parent().parent(), f;
		
		if (e.readAttr('rel') == 1) {
			if (this.currentEdit) {
				this.currentEdit.getOne('span').show('i');
				this.currentEdit.getOne('form').hide();
				this.currentEdit.getOne('a.toggle_edit').attr('rel', 1);
			}
			this.currentEdit = p;
			p.getOne('span').hide();
			f = p.getOne('form').show('i').getOne('input').method('focus');
			e.attr('rel', 0);
		} else {
			this.currentEdit = null;
			p.getOne('span').show('i');
			p.getOne('form').hide();
			e.attr('rel', 1);
		}
	};

	/**
	 * =======================================================================================================
	 * ajaxEdit
	 * send category edti data to server
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.ajaxEdit = function (ev) {
		var form = DOM(ev.target).parent();
			states = form.parent().detect('span'),
			that = this;
			
		states.get(1).show('i');
		DOM(ev.target).hide();
		this.ajax.post('dashboard/blog/categories/ajax_update_category/' + this.config.item('sz_token'), {
			param : form.serialize(),
			success : function (resp) {
				if (resp.responseText === 'error') {
					alert('更新に失敗しました。');
					return;
				}
				form.prev().html(resp.responseText)
					.parent().first().show('i');
				form.getOne('input').setValue(resp.responseText)
					.rollBack()
					.hide()
					.getOne('input[type=button]').show('i');
				states.get(1).hide();
				states.get(2).show('i')
				setTimeout(function () { states.get(2).hide();}, 1500);
				that.currentEdit.getOne('a.toggle_edit').attr('rel', 1);
				that.currentEdit = null;
			}
		});
	};

	/**
	 * =======================================================================================================
	 * liDel
	 * delete category and fade out
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.liDel = function (ev) {
		ev.preventDefault();
		if (confirm('削除してよろしいですか？')) {
			var that = this, p;
			
			this.ajax.get(ev.target.href + '/' + this.config.item('sz_token'), {
				success : function (resp) {
					if (resp.responseText === 'error') {
						alert('削除に失敗しました。');
						return;
					}
					p = DOM(ev.target).parent(2);
					p.animate('fade', {speed : 30, callback : function () {
						p.remove();
						DOM('ul.sz_blog_category_list li[class!=ttl]').foreach(function(num){
							if (num % 2 === 0) {
								DOM(this).removeClass('odd');
							} else {
								DOM(this).addClass('odd');
							}
						});
					}});
				}
			})
		}
	};
	
	/**
	 * =======================================================================================================
	 * addCategoryMaster
	 * add category
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.addCategoryMaster = function (ev) {
		var c = document.getElementsByName('category_name_master')[0],
			that = this, ul, li, html, json;

		if (c.value == '') {
			alert('カテゴリ名は空欄にできません。');
			return;
		}

		this.ajax.post('dashboard/blog/categories/ajax_add_category/' + this.config.item('sz_token'), {
			param : {'category_name' : c.value},
			success : function (resp) {
				if (resp.responseText === 'error') {
					alert('カテゴリの追加に失敗しました。');
					return;
				}
				//eval('var json=' + resp.responseText);
				json = that.json.parse(resp.responseText);
				ul = DOM('ul.sz_blog_category_list').get(0);
				li = DOM.create('li');
				if ( ! ul.last().hasClass('odd') ) {
					li.addClass('odd');
				}
				li.addClass('sz_cat_sortable')
					.attr('data-catid', json.sz_blog_category_id);
				html = [
				        '<span>' + c.value + '</span>',
				        '<form class="init_hide" method="post" action="' + that.config.siteUrl() + 'blog/ajax_category_edit">',
				        '<input type="text" value="' + c.value + '" name="category_name" />',
				        '<input type="hidden" value="' + json.sz_blog_category_id + '" name="sz_blog_category_id" />',
				        '<input type="button" class="category_edit_button" value="変更" />',
				        '</form>',
				        '<span class="state_ing">変更中...<img src="' + that.config.baseUrl() + 'images/loading_small.gif" /></span>',
				        '<span class="state_do">変更しました。</span>',
				        '<p>',
				        '<a href="javascript:void(0)" class="toggle_edit" rel="1">編集</a>&nbsp;',
				        '<a href="' + that.config.siteUrl() + 'dashboard/blog/categories/ajax_delete_category/' + json.sz_blog_category_id + '" class="li_del">削除</a>',
				        '</p>',
				       ];
				li.html(html.join('\n'))
					.event('mouseover', function (ev) { DOM(this).addClass('hover');})
					.event('mouseout', function (ev) { DOM(this).removeClass('hover');})
					.appendTo(ul);
				li.detect('a, input').event('mousedown', function(ev) { ev.stopPropagation(); });
				sortHandle && sortHandle.addSortElement(li);
				DOM(c).setValue('').parent(2).hide();
			}
		});
	};
});