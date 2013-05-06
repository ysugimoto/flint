/**
 * =======================================================================================================
 * 
 * Seezoo file_groups Controller
 * 
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * 
 * =======================================================================================================
 */
ClassExtend('Controller', function() {

	/**
	 * =======================================================================================================
	 * constructor
	 * =======================================================================================================
	 */
	this.__construct = function() {
		this.load.ajax();
	};

	/**
	 * =======================================================================================================
	 * default method
	 * =======================================================================================================
	 */
	this.index = function () {
		this.currrentEdit = null;
		DOM.css('ul.sz_blog_category_list li[class!=ttl]')
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

		DOM.id('add_cat').Cevent('click', this.addNewGroup);
	};

	/**
	 * =======================================================================================================
	 * toggle Edit
	 * toggel edit form hide/show
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.toggleEdit = function (ev) {
		var e = DOM(ev.target), p = e.parent().parent();
		
		if (e.readAttr('rel') == 1) {
			if (this.currentEdit) {
				this.currentEdit.getOne('span').show('i');
				this.currentEdit.getOne('form').hide();
				this.currentEdit.getOne('a.toggle_edit').attr('rel', 1);
			}
			this.currentEdit = p;
			p.getOne('span').hide();
			p.getOne('form').show('i')
				.getOne('input').method('focus');
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
	 * update group name by ajax backend
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
			
		states.get(1, true).show('i');
		DOM(ev.target).hide();
		this.ajax.post('dashboard/files/file_groups/ajax_update_file_group/' + this.config.item('sz_token'), {
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
				states.get(1, true).hide();
				states.get(2, true).show('i')
				setTimeout(function () { states.get(2, true).hide();}, 1500);
				that.currentEdit.getOne('a.toggle_edit').attr('rel', 1);
				that.currentEdit = null;
			}
		});
	};

	/**
	 * =======================================================================================================
	 * liDel
	 * list delte group
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
	 * addNewGroup
	 * add new file group
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.addNewGroup = function (ev) {
		var c = document.getElementsByName('group_name_master')[0],
			that = this, already = false, json, li, html,
			ul = DOM('ul.sz_blog_category_list').get(0);

		if (c.value == '') {
			alert('グループ名は空欄にできません。');
			return;
		}
		// input values exists?
		ul.detect('li').foreach(function() {
			if (DOM(this).first().getHTML() === c.value) { already = true;}
		});
		
		if (already) {
			alert('入力されたグループ名はすでに登録されています。');
			return;
		}

		this.ajax.post('dashboard/files/file_groups/ajax_add_group/' + this.config.item('sz_token'), {
			param : {'group_name' : c.value},
			success : function (resp) {
				if (resp.responseText === 'error') {
					alert('グループの追加に失敗しました。');
					return;
				}
				//eval('var json=' + resp.responseText);
				json = that.json.parse(resp.responseText);
				li = DOM.create('li');
				if (ul.detect('li').length === 1 || !ul.detect('li').get(1, true).hasClass('odd')) {
					li.addClass('odd');
				}
				html = [
			            '<span>' + c.value + '</span>',
			            '<form class="init_hide" method="post" action="' + that.config.siteUrl() + 'files/file_groups/ajax_group_edit">',
			            '<input type="text" value="' + c.value + '" name="group_name" />',
			            '<input type="hidden" value="' + json.file_groups_id + '" name="file_groups_id" />',
			            '<input type="button" class="category_edit_button" value="変更" />',
			            '</form>',
			            '<span class="state_ing">変更中...<img src="' + that.config.baseUrl() + 'images/loading_small.gif" /></span>',
			            '<span class="state_do">変更しました。</span>',
			            '<p>',
			            '<a href="javascript:void(0)" class="toggle_edit" rel="1">編集</a>&nbsp;',
			            '<a href="' + that.config.siteUrl() + 'dashboard/files/file_groups/ajax_delete_file_group/' + json.file_groups_id + '" class="li_del">削除</a>',
			            '</p>',
			            ];
				li.html(html.join('\n')).event('mouseover', function (ev) { DOM(this).addClass('hover');})
									.event('mouseout', function (ev) { DOM(this).removeClass('hover');})
									.appendTo(ul.detect('li').get(0), 'after');
				c.value = '';
			}
		});
	};
});