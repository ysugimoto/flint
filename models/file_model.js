/**
 * =======================================================================================================
 *
 * Seezoo file manager model Class
 *
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 *
 * =======================================================================================================
 */
ClassExtend('Model', function file_model() {

	// local variavles
	var thisClass = this,
		imgExt = /.+\.gif$|.+\.jpg$|.+\.jpeg$|.+\.png$/, // file extensions of image
		searchMenuFlag = false,
		contentSize;

	/**
	 * =======================================================================================================
	 * constructor
	 * =======================================================================================================
	 */
	this.__construct = function() {
		this.dirCache = {};
		this.load.ajax();
		contentSize = this.ut.getContentSize();
	};

	/**
	 * =======================================================================================================
	 * confCheck
	 * checkbox data control
	 * @access public
	 * @execute event handler
	 * @return void
	 * =======================================================================================================
	 */
	this.confCheck = function() {
		if (this.checked === true) {
			DOM('input.edit_targets').foreach(function() {
				this.checked = true;
			});
			DOM.id('edit_method').get().disabled = false;
		} else {
			DOM('input.edit_targets').foreach(function() {
				this.checked = false;
			});
			DOM.id('edit_method').get().disabled = true;
		}
	};

	/**
	 * =======================================================================================================
	 * doEdit
	 * delete file
	 * @access public
	 * @execute event handler
	 * @return void
	 * =======================================================================================================
	 */
	this.doEdit = function() {
		if (this.value == 0) { return; }
		if (this.value === 'delete') {
			if (confirm('選択したファイルを削除します。よろしいですか？')) {
				DOM.id('file_edit_form').get().submit();
			} else {
				this.value = 0;
			}
		} else if (this.value === 'group') {
			thisClass.setGroup();
		}
		else {
			DOM.id('file_edit_form').get().submit();
		}
	};

	/**
	 * =======================================================================================================
	 * setGroup
	 * set up group control view
	 * @access public
	 * @execute call
	 * @param Number fid
	 * @return void
	 * =======================================================================================================
	 */
	this.setGroup = function(fid) {
		var pp = Helper.createDOMWindow('ファイルグループ設定', '', 500, 300), that = this;

		this.ajax.post('ajax/get_file_group_list/' + this.config.item('sz_token'), {
			param : {vals : fid || this.__setCheckedValue()},
			error : function() {alert('データの取得に失敗しました。'); pp.hide();},
			success : function(resp) {
				pp.setContent(resp.responseText);

				function submitMakeAdd(ev) {
					that.ajax.post('ajax/set_file_group/' +that.config.item('sz_token'), {
						param : DOM.id('sz_file_groups_add').serialize() ,
						error : function() {alert('グループ設定に失敗しました。');},
						success : function() {location.reload();}
					});
				}
				if (document.getElementById('sz_file_groups_list_add')) {
					function submitAdd(ev) {
						that.ajax.post('ajax/set_file_group/' + that.config.item('sz_token'), {
							param : DOM.id('sz_file_groups_list').serialize(),
							error : function() {alert('グループ設定に失敗しました。');},
							success : function() {location.reload();}
						});
					}
					DOM.id('sz_file_groups_list_add').event('click', submitAdd);
				}
				DOM.id('sz_file_groups_list_make_add').event('click', submitMakeAdd);
				pp.setOnClose(function() {
					try{
						DOM.id('sz_file_groups_list_add').unevent('click');
						DOM.id('sz_file_groups_list_make_add').unevent('click');
					} catch(e){}
				});
			}
		});
	};
	
	/**
	 * =======================================================================================================
	 * renameFile
	 * Rename dest file
	 * @access public
	 * @execute call
	 * @param Number fid
	 * @return void
	 * =======================================================================================================
	 */
	this.renameFile = function(fid) {
		var pp = Helper.createDOMWindow('ファイル名の変更', '', 400, 150), that = this;

		this.ajax.post('dashboard/files/directory_view/rename_file_init/' + this.config.item('sz_token'), {
			param : {val : fid},
			error : function() {
				alert('データの取得に失敗しました。');
				pp.hide();
			},
			success : function(resp) {
				var form,
					ipt;
				
				pp.setContent(resp.responseText);
				form = DOM.id('sz_file_name_form');
				ipt  = form.getOne('input.new_filename')
							.method('focus');

				function submitNewName(ev) {
					if ( ipt.getValue() === '' ) {
						return !!alert('ファイル名を入力してください。');
					}
					that.ajax.post('dashboard/files/directory_view/do_rename_file/' + that.config.item('sz_token'), {
						param : form.serialize() ,
						error : function() {alert('リネームに失敗しました。');},
						success : function(resp) {
							var node;
							
							if ( resp.responseText === 'error' ) {
								alert('リネームに失敗しました。');
							}
							else if ( /.+\.[a-z]+$/.test(resp.responseText) ){
								node = DOM.origCSS('div[file_id=' + fid + ']').get(0);
								node.attr({
									filename : resp.responseText,
									title    : resp.responseText
								});
								node.getOne('div.sz_name').html(resp.responseText);
								pp.hide();
							} else {
								alert('error:' + resp.responseText);
							}
							
						}
					});
				}
				
				if ( document.getElementById('sz_file_rename_btn') ) {
					DOM.id('sz_file_rename_btn').event('click', submitNewName);
				}
				pp.setOnClose(function() {
					try{
						DOM.id('sz_file_rename_btn').unevent('click');
					} catch(e){}
				});
			}
		});
	};

	/**
	 * =======================================================================================================
	 * __setCheckedValue
	 * get checked value
	 * @access private
	 * @execute call
	 * @return sring
	 * =======================================================================================================
	 */
	this.__setCheckedValue = function() {
		var vals = [];
		DOM('input.edit_targets').foreach(function() {
			if (this.checked === true) { vals.push(this.value);}
		});
		return vals.join(':');
	};

	/**
	 * =======================================================================================================
	 * changeSelect
	 * change selection
	 * @access public
	 * @execute event handler
	 * @return void
	 * =======================================================================================================
	 */
	this.changeSelect = function() {
		var flag = false;
		DOM('input.edit_targets').foreach(function() {
			if (this.checked === true) {
				flag = true;
			}
		});

		if (flag) {
			DOM.id('edit_method').get().disabled = false;
		} else {
			DOM.id('edit_method').get().disabled = true;
		}
	};

	/**
	 * =======================================================================================================
	 * showZoom
	 * show garget file to zoom element
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.showZoom = function(ev) {
		var path, e, tag = ev.target.tagName.toLowerCase(), point;

		e = ev.target.parentNode;
		path = e.getAttribute('filename');
		point = DOM(e).absDimension();
		if (imageExt.test(path) === false) { return; }
		this.parent.zoom.addStyle({top : point.top + 65 + 'px', left : point.left + 65 + 'px', display : 'block'})
						.show()
						.first()
						.attr('src', this.config.baseUrl() + 'files/' + path);
	};

	/**
	 * =======================================================================================================
	 * hideZoom
	 * hide zoom element
	 * @access public
	 * @execute event handler
	 * @return void
	 * =======================================================================================================
	 */
	this.hideZoom = function(ev) {
		this.parent.zoom.hide();
	};

	/**
	 * =======================================================================================================
	 * setUpReplace
	 * show replace target view
	 * @access public
	 * @execute event handler
	 * @return void
	 * =======================================================================================================
	 */
	this.setUpReplace = function(ev) {
		ev.preventDefault();
		var PP = Helper.createDOMWindow('ファイルの差し替え', '', 400, '80%', false, false),
			that = this;

		// temp reset
		this.parent.replaceData = null;

		this.ajax.get(ev.target.href, {
			success : function(resp) {
				PP.setContent(resp.responseText);

				DOM.id('sz_close').event('click', function(ev) {
					if (that.parent.replaceData) {
						if (confirm('差し替えは完了していません。アップロードしたデータを破棄してもよろしいですか？')) {
							that.__deleteTempFiles();
							PP.hide();
						}
					} else {
						PP.hide();
					}
				});

				DOM.id('sz_submit').event('click', function(ev) {
					if (!that.parent.replaceData) {
						alert('差し替え対象のファイルがアップロードされていません。');
					} else {
						that.parent.replaceStack();
						PP.hide();
					}
				});
				PP.setOnClose(function() {
					DOM.id('sz_close').unevent('click');
					DOM.id('sz_submit').unevent('click');
				});
			}
		});
	};

	/**
	 * =======================================================================================================
	 * __deleteTempFiles
	 * delete temp stacked files
	 * @access public
	 * @execute call
	 * @return void
	 * =======================================================================================================
	 */
	this.__deleteTempFiles = function() {
		var data = this.parent.replaceData, that = this;

		if (!data) { return; }

		this.ajax.post('dashboard/files/directory_view/delete_temp_file/', {
			param : {file_name : data.crypt_name, ext : data.extension}
		});
	};

	/**
	 * =======================================================================================================
	 * showMenu
	 * show file menu
	 * @access public
	 * @execute call
	 * @param HTMLElement e
	 * @param Number x
	 * @param Number y
	 * @return void
	 * =======================================================================================================
	 */
	this.showMenu = function(e, x, y) {
		var id = e.getAttribute('file_id'),
			al = DOM('div.sz_file_menu a');

		al.get(0).attr('href', thisClass.config.siteUrl() + 'dashboard/files/file_list/ajax_file_view/' + id + '/' + thisClass.config.item('sz_token'));
		al.get(1).attr('href', thisClass.config.siteUrl() + 'dashboard/files/file_list/file_download_from_popup/' + id + '/' + thisClass.config.item('sz_token'));
		al.get(2).attr('rel', id);
		if (!imgExt.test(e.getAttribute('filename'))) {
			al.get(3).hide();
		} else {
			al.get(3).attr('href', thisClass.config.siteUrl() + 'dashboard/image/edit/' + id).show();
		}
		al.get(4).attr('href', thisClass.config.siteUrl() + 'dashboard/files/file_list/delete_file/' + id + '/' + thisClass.config.item('sz_token'));

		thisClass.parent.menu.addStyle({
			top : y + 5 + 'px',
			left : x + 5 + 'px',
			display : 'block'
			});
		thisClass.parent.selectCurrent = DOM(e);
	};

	/**
	 * =======================================================================================================
	 * showMenuDir
	 * show file menu for directory view mode
	 * @access public
	 * @execute call
	 * @param HTMLElement e
	 * @param Number x
	 * @param Number y
	 * @return void
	 * =======================================================================================================
	 */
	this.showMenuDir = function(e, x, y, up) {
		var id = e.getAttribute('file_id'),
			al = DOM('div.sz_file_menu a'),
			isUp = up || false;
		
		if ( /.+\.zip$/i.test(e.getAttribute('filename')) ) {
			al.get(0).show().attr('rel', id);
		} else {
			al.get(0).hide();
		}
		al.get(1).attr('href', thisClass.config.siteUrl() + 'dashboard/files/directory_view/ajax_file_view/' + id + '/' + thisClass.config.item('sz_token'));
		al.get(2).attr('href', thisClass.config.siteUrl() + 'dashboard/files/directory_view/file_download_from_popup/' + id + '/' + thisClass.config.item('sz_token'));
		al.get(3).attr('rel', id);
		al.get(4).attr('rel', id);
		if (!imgExt.test(e.getAttribute('filename'))) {
			al.get(5).hide();
		} else {
			al.get(5).attr('href', thisClass.config.siteUrl() + 'dashboard/image/edit/' + id).show();
		}
		al.get(6).attr('href', thisClass.config.siteUrl() + 'dashboard/files/directory_view/replace_file/' + id + '/' + thisClass.config.item('sz_token'));
		al.get(7).attr('href', thisClass.config.siteUrl() + 'dashboard/files/directory_view/delete_file/' + id + '/' + thisClass.config.item('sz_token'));

		thisClass.parent.menu.addStyle({top : (isUp ? y - 160 : y)  + 5 + 'px', left : x + 5 + 'px', display : 'block'});
		//thisClass.parent.dirMenu.hide();
		thisClass.parent.selectCurrent = DOM(e).parent();
	};

	/**
	 * =======================================================================================================
	 * showDirMenu
	 * show Direcotry manage menu
	 * @access public
	 * @execute call
	 * @param xElement e
	 * @param Number x
	 * @param Number y
	 * @return void
	 * =======================================================================================================
	 */
	this.showDirMenu = function(e, x, y, up) {
		var id = e.first().readAttr('dir_id'),
			dirName = e.getOne('div.sz_name').getHTML(),
			isUp = up || false;

		DOM('div.sz_dir_menu a').foreach(function() {
			this.setAttribute('rel', id + ' ' + dirName);
		});
		this.dirMenuTarget = e.first();
		thisClass.parent.dirMenu.addStyle({top : (isUp ? y - 150 : y) + 5 + 'px', left : x + 5 + 'px', display : 'block'});
		thisClass.parent.menu.hide();
	};

	/**
	 * =======================================================================================================
	 * actionDirMenu
	 * control directory menu clicked action
	 * @access public
	 * @execute event handler
	 * @return void
	 * =======================================================================================================
	 */
	this.actionDirMenu = function(ev) {
		var c = ev.target.className,
			data = ev.target.getAttribute('rel').split(/\s/);

		switch(c) {
		case 'open_dir':
			this.parent.__setLoading();
			this.loadDirectory(data[0], data[1]); break;
		case 'rename':
			this.setRename(data); break;
		case 'edit_permission':
			this.setDirAccessPermission(data); break;
		case 'clone':
			this.cloneDir(data); break;
		case 'delete':
			this.deleteDir(data); break;
		default : break;
		}
	};

	/**
	 * =======================================================================================================
	 * setRename
	 * set up rename form
	 * @access public
	 * @execute call
	 * @param Array data
	 * @return void
	 * =======================================================================================================
	 */
	this.setRename = function(data) {
		var pp = Helper.createDOMWindow('名前の変更', '', 400, 200),
			that = this,
			html, ipt, def, target;

		html = [
		        '<form id="sz_file_groups_list">',
		        '<p>新しい名前を入力してください。</p>',
		        '<dl>',
		          '<dt></dt>',
		          '<dd><input type="text" class="long-text" size="40" value="', data[1], '" name="new_name" id="re_name" /></dd>',
		        '</dl>',
		        '<p style="text-align:center;margin-top:10px;">',
		          '<input type="button" id="do_rename" value="名前を変更する" />',
		          '<input type="hidden" id="def_name" value="', data[1], '" />',
		          '<input type="hidden" id="target_dir" value="', data[0], '" />',
		        '</p>'
		        ];
		pp.setContent(html.join(''));

		DOM.id('do_rename').event('click', function(ev) {
			ipt = DOM.id('re_name'),
			def = DOM.id('def_name'),
			target = DOM.id('target_dir');

			if (ipt.getValue() === '') {
				return alert('名前は空欄にできません。');
			} else if (ipt.getValue() === def.getValue()) {
				pp.hide();
				return;
			}

			this.ajax.post('dashboard/files/directory_view/update_dirname/' + this.config.item('sz_token'), {
				param : { new_name : ipt.getValue(), target : target.getValue()},
				error : function() { alert('名前の変更に失敗しました。'); },
				success : function(resp) {
					if (resp.responseText === 'complete') {
						that.dirMenuTarget.getOne('div.sz_name').html(that.ut.clean(ipt.getValue()))
							.rollBack().animate('highLight');

						that.deleteDirCache([that.getCurrentDir()]);
					}
					pp.hide();
				}
			});
		}, this);
		pp.setOnClose(function() {
			DOM.id('do_rename').unevent('click');
		});
	};

	/**
	 * =======================================================================================================
	 * setDireAccessPermission
	 * set up Directory access permission view
	 * @access public
	 * @execute call
	 * @param Array data
	 * @return void
	 * =======================================================================================================
	 */
	this.setDirAccessPermission = function(data) {
		var pp = Helper.createDOMWindow('ディレクトリ権限の設定', '', 400, 400), that = this, html;

		this.ajax.get('dashboard/files/directory_view/show_dir_permission/' + data[0] + '/' + this.config.item('sz_token'), {
			success : function(resp) {
				pp.setContent(resp.responseText);

				DOM.id('do_permission').event('click', function(ev) {
					that.ajax.post('dashboard/files/directory_view/update_permission/' + that.config.item('sz_token'), {
						param : DOM.id('sz_dir_permissions').serialize(),
						error : function() { alert('名前の変更に失敗しました。'); },
						success : function(resp) {
							if (resp.responseText === 'complete') {
								that.deleteDirCache([that.getCurrentDir()]);
							}
							pp.hide();
						}
					});
				}, that);
				pp.setOnClose(function() {
					DOM.id('do_permission').unevent('click');
					that.loadDirectory(that.getCurrentDir(), '', true);
				});
			}
		});
	};

	/**
	 * =======================================================================================================
	 * cloneDir
	 * create cloned direcotry
	 * @access public
	 * @execute call
	 * @param Array data
	 * @return void
	 * =======================================================================================================
	 */
	this.cloneDir = function(data) {
		var current = this.parent.currentPath.getHTML(), cnt = 1;
			newPath = data[1] + '～コピー';

		while(this.__dirIsAlready(newPath)) {
			newPath += ++cnt;
		}
		this.cloneDirectory(newPath, data[0], current);
	};

	/**
	 * =======================================================================================================
	 * __dirIsAlready
	 * check create directory name exists?
	 * @access public
	 * @execute call
	 * @param String path
	 * @return bool
	 * =======================================================================================================
	 */
	this.__dirIsAlready = function(path) {
		var ret = false;

		DOM('div.sz_name').foreach(function(num) {
			if (this.innerHTML === path) {
				ret = true;
				return false;
			}
		});
		return ret;
	};

	/**
	 * =======================================================================================================
	 * deleteDir
	 * delete Directory data and inner files/directory recuesive
	 * @access public
	 * @execute call
	 * @param Array data
	 * @return void
	 * =======================================================================================================
	 */
	this.deleteDir = function(data) {
		var uri, param, delCache, that = this;

		if (!confirm('移動されたファイルを削除します。よろしいですか？\nディレクトリを削除すると、その中身も全て削除されます。\n\n※この処理は元に戻せません！')) { return; }
		uri = 'dashboard/files/directory_view/delete_file_or_dir/' + this.config.item('sz_token');
		param = {del_id : data[0], mode : 'dir'};
		delCache = [that.getCurrentDir()];

		this.parent.__setLoading();
		this.ajax.post(uri, {
			param : param,
			error : function() { alert('ディレクトリの削除に失敗しました。');that.parent.__setLoading(true);},
			success : function(resp) {
				that.parent.__setLoading(true);
				if (resp.responseText === 'complete') {
					DOM.origCSS('div[dir_id=' + data[0] + ']').get(0).parent().remove();
					// delete cache
					that.deleteDirCache([data[0]]);
				} else {
					alert('ディレクトリの削除に失敗しました。');
				}
			}
		});
	};

	/**
	 * =======================================================================================================
	 * popupMenu
	 * popup menu
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.popupMenu = function(ev) {
		var e = ev.target, tag = e.tagName.toLowerCase();
		if (tag === 'p' && e.parentNode.className === 'thumbnail_frame') {
			this.showMenu(e.parentNode, ev.pageX, ev.pageY);
		} else {
			this.hideMenu();
		}
	};

	/**
	 * =======================================================================================================
	 * hideMenu
	 * hide menu element
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.hideMenu = function(ev) {
		this.parent.menu.hide();
	};

	/**
	 * =======================================================================================================
	 * deleteConfirm
	 * confirm delete?
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.deleteConfirm = function(ev) {
		ev.preventDefault();
		if (!confirm('選択したファイルを削除します。よろしいですか？')) { return; }
		var p;


		thisClass.ajax.get(ev.currentTarget.href, {
			async : true,
			error : function() { alert('画像の削除に失敗しました。');},
			success : function(resp) {
				if (resp.responseText === 'complete') {
					if (thisClass.parent.selectCurrent) {
						p = thisClass.parent.selectCurrent;//.parent();
						p.animate('fade', {speed : 40, callback : function() {
							p.hide();
							thisClass.deleteDirCache([thisClass.getCurrentDir()]);
						}});
					}
				}
			}
		});
	};

	/**
	 * =======================================================================================================
	 * toggleSearchMenu
	 * toggle show treeview/search_result
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.toggleSearchMenu = function(ev) {
		if (!searchMenuFlag) {
			this.parent.searchBox
						.show()
						.animate('blindDown', {height : 160, mode : 'y', speed : 30, easing : 0});
		} else {
			var that = this;
			this.parent.searchBox
						.animate('blindUp', {speed : 30, easing : 0, callback : function() {that.parent.searchBox.hide();}});
		}
		searchMenuFlag = !searchMenuFlag;
	};

	/**
	 * =======================================================================================================
	 * loadDirectory
	 * loading directory inner
	 * @access public
	 * @execute call
	 * @param Number did
	 * @param String pathName
	 * @param Boolean append
	 * @return void
	 * =======================================================================================================
	 */
	this.loadDirectory = function (did, pathName, append) {
		var that = this, li, json;

//		if (that.dirCache[did]) {
//			json = that.dirCache[did];
//			DOM.id('sz_file_dir_view').html(json.response);
//			that.parent.initDirEvent();
//			if (!append) {
//				li = DOM.create('li').html('<div class="sort_tree" dir_id="' + json.did + '"><a href="javascript:void(0)" class="current">' + pathName + '</a></div>').appendTo(DOM.id('sz_dir_tree_path'));
//				that.parent.currentPath.removeClass('current').parent(2).addClass('sz_sort');
//				that.parent.currentPath = li.first().first();
//			}
//			that.parent.__setLoading(true);
//			return;
//		} else {
			this.ajax.post('dashboard/files/directory_view/ajax_get_dir_files/' + this.config.item('sz_token'), {
				param : { path_name : pathName, did : did},
				error : function() { alert('error');that.parent.__setLoading(true);},
				success : function(resp) {
					json = that.json.parse(resp.responseText);
					DOM.id('sz_file_dir_view').html(json.response);
					that.parent.initDirEvent();
					if (!append) {
						li = DOM.create('li').html('<div class="sort_tree" dir_id="' + json.did + '"><a href="javascript:void(0)" class="current">' + pathName + '</a></div>').appendTo(DOM.id('sz_dir_tree_path'));
						that.parent.currentPath.removeClass('current').parent(2).addClass('sz_sort');
						that.parent.currentPath = li.first().first();
					}
					that.parent.__setLoading(true);
					that.dirCache[did] = {response : json.response, did : json.did};
				}
			});
//		}
	};

	/**
	 * =======================================================================================================
	 * addDirectory
	 * create and append new Directory
	 * @access public
	 * @execute ecall
	 * @param String path
	 * @param xElement current
	 * @return void
	 * =======================================================================================================
	 */
	this.addDirectory = function(path, current) {
		var that = this, numReg = /^[0-9]+$/;

		this.ajax.post('dashboard/files/directory_view/ajax_add_directory/' + this.config.item('sz_token'), {
			param : {new_path : path, target : current},
			error : function() { alert('ディレクトリの追加に失敗しました。');},
			success : function(resp) {
				if (numReg.test(resp.responseText)) {
					that.createDirectory({directory_id : resp.responseText, dir_name : path});
				}
			}
		});
	};

	/**
	 * =======================================================================================================
	 * cloneDirectory
	 * created cloned directory
	 * @access public
	 * @execute call
	 * @param String path
	 * @param Number target
	 * @param xElement current
	 * @return void
	 * =======================================================================================================
	 */
	this.cloneDirectory = function(path, target, current) {
		var that = this, numReg = /^[0-9]+$/;

		this.ajax.post('dashboard/files/directory_view/ajax_clone_directory/' + this.config.item('sz_token'), {
			param : { new_name : path, target : target},
			error : function() { alert('ディレクトリの追加に失敗しました。');},
			success : function(resp) {
				if (numReg.test(resp.responseText)) {
					var name = that.ut.clean(path),
						html = [
					            '<div class="sz_dir_view sz_sort_handle" dir_id="', resp.responseText, '">',
					              '<div class="sz_data sz_dir">',
					                '<img src="', that.config.baseUrl(), 'images/icons/files/dir.png" alt="', path, '" />',
					                '<div class="sz_name">', path, '</div>',
					              '</div>',
					            '</div>'
					            ],
					li = DOM.create('li').addClass('sz_dir').addClass('sz_sort').html(html.join('')).appendTo(DOM.id('sz_file_dir_view')).animate('highLight');
					that.parent.setDirEvent(li);
					// delete cache
					that.deleteDirCache([that.getCurrentDir()]);
				}
			}
		});
	};

	/**
	 * =======================================================================================================
	 * fileMove
	 * moveing file to child directory or parent dreictory
	 * @access public
	 * @execute call
	 * @param xElement from
	 * @param xElement to
	 * @return void
	 * =======================================================================================================
	 */

	this.fileMove = function(from, to) {
		var that = this, f = DOM(from), t = DOM(to), param, uri, delCache;

		if (t.readAttr('id') === 'sz_file_dir_trash') { // move to trash
			if (!confirm('移動されたファイルを削除します。よろしいですか？\nディレクトリを削除すると、その中身も全て削除されます。\n\n※この処理は元に戻せません！')) { return; }
			uri = 'dashboard/files/directory_view/delete_file_or_dir/' + this.config.item('sz_token');
			if (f.readAttr('dir_id')) {
				param = {del_id : f.readAttr('dir_id'), mode : 'dir'};
			} else {
				param = {del_id : f.readAttr('file_id'), mode : 'file'};
			}
			delCache = [that.getCurrentDir()];
		} else if (f.readAttr('dir_id')) { // move file is directory
			uri = 'dashboard/files/directory_view/move_dir_to_dir/' + this.config.item('sz_token');
			param = { from : f.readAttr('dir_id'), to : t.first().readAttr('dir_id')};
			delCache = [that.getCurrentDir(), t.first().readAttr('dir_id')];
		} else { //move file is file
			uri = 'dashboard/files/directory_view/move_file_to_dir/' + this.config.item('sz_token');
			param = { from : f.readAttr('file_id'), to : t.first().readAttr('dir_id')};
			delCache = [that.getCurrentDir(), t.first().readAttr('dir_id')];
		}

		this.parent.__setLoading();

		this.ajax.post(uri, {
			param : param,
			error : function() { alert('ファイルの変更処理に失敗しました。');that.parent.__setLoading(true);},
			success : function(resp) {
				that.parent.__setLoading(true);
				if (resp.responseText === 'complete') {
					f.parent().remove();
					// delete cache
					that.deleteDirCache(delCache);
				} else {
					alert('ファイルの移動に失敗しました。');
				}
			}
		});
	};

	/**
	 * =======================================================================================================
	 * deleteDireCache
	 * delete directory view cache
	 * @access public
	 * @execute call
	 * @param Array arr
	 * @return void
	 * =======================================================================================================
	 */
	this.deleteDirCache = function(arr) {
		var i = 0; len = arr.length, cache = this.dirCache;

		for (; i < len; i++) {
			if (typeof cache[arr[i]] === 'undefiend') { continue; }
			try { delete cache[arr[i]];}
			catch(e) { cache[arr[i]] = undefined;}
		}
		this.dirCache = cache;
	};
	
	this.deleteDirCacheAll = function() {
		this.dirCache = {};
	};

	/**
	 * =======================================================================================================
	 * getCurrentDir
	 * get current viewing diretory id
	 * @access public
	 * @return void
	 * @return Number dir_id
	 * =======================================================================================================
	 */
	this.getCurrentDir = function() {
		return DOM('ul#sz_dir_tree_path a.current').get(0).parent().readAttr('dir_id');
	};
	
	this.extractArchive = function(ev) {
		if ( ! confirm('アーカイブを展開します。よろしいですか？') ) {
			ev.preventDefault();
			return;
		}
		
		var that = this,
			url = [
		           'dashboard/files/directory_view/extract_archive',
		           ev.target.rel,
		           this.file_model.getCurrentDir(),
		           this.config.item('sz_token')
		           ].join('/');
		this.ajax.get(url, {
			error : function(msg) {
				alert(msg);
			},
			success: function(resp) {
				var json, i = -1;
				
				try {
					json = that.json.parse(resp.responseText);
					if ( json.directory.length > 0 ) {
						while ( json.directory[++i] ) {
							that.file_model.createDirectory(json.directory[i]);
						}
					}
					if ( json.files.length > 0 ) {
						that.multipleStack = json.files;
						that.multipleCallback();
					}
				} catch ( e ) {
					alert(e.message);
				}
			}
		});
	};
	
	this.createDirectory = function(dir) {
		var name,
			html,
			li;
		
		name = this.ut.clean(dir.dir_name),
		html = [
		        '<div class="sz_dir_view sz_sort_handle" dir_id="', dir.directory_id, '">',
		          '<div class="sz_data sz_dir">',
		            '<img src="', this.parent.config.baseUrl(), 'images/icons/files/dir.png" alt="', name, '" />',
		            '<div class="sz_name">', name, '</div>',
		           '</div>',
		        '</div>'
		        ],
		li = DOM.create('li')
				.addClass('sz_dir')
				.addClass('sz_sort')
				.html(html.join(''))
				.appendTo(DOM.id('sz_file_dir_view'));
		li.animate('highLight', { callback : function() {li.removeStyle('backgroundColor');}});
		this.parent.setDirEvent(li);
		// delete cache
		// that.deleteDirCache([that.getCurrentDir()]);
		this.deleteDirCacheAll();
	}
});
