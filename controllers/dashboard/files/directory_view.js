/**
 * =======================================================================================================
 *
 * Seezoo file view Controller
 *
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 *
 * =======================================================================================================
 */
ClassExtend('Controller', function directory_view() {

	// local variables
	var current = [],
		currentPath,
		that = this,
		contentSize;

	// public properties
	this.files = null;
	this.loading = null;
	this.sortHandle = null;
	this.multipleStack = [];
	this.replaceData = null;
	this.selectCurrent = null;
	this.dragArea = null;

	this.__construct = function() {
		this.load.module('ui');
		this.load.module('layer');
		this.load.model('file_model');
	};

	/**
	 * =======================================================================================================
	 * default method
	 * =======================================================================================================
	 */
	this.index = function() {
		var that = this, hanldes, p;
		
		contentSize = this.ut.getContentSize();

		// create layer
		this.layer = new Module.layer(false);

		// create loading image
		this.loading = DOM.create('div').attr('id', 'sz_saving').appendTo().addStyle('position', 'fixed');

		// initialize currentPath
		this.currentPath = DOM.id('sz_dir_tree_path').getOne('a.current');

		this.files = DOM('div.sz_data').event('click', function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			p = DOM(this).parent(2);
			if (DOM(this).hasClass('sz_dir')
					&& p.hasClass('active')
						&& !p.hasClass('pm_denied')) { // multi selected dir
				that.file_model.showDirMenu(p, ev.pageX, ev.pageY, !!(contentSize.height - 100 < ev.clientY));
			}
			// if shiftkey is pressed, range select like windows
			if (ev.shiftKey) {
				var flag = false;
				DOM('ul#sz_file_dir_view li').foreach(function() {
					var e = DOM(this);
					
					if ( e.hasClass('pm_denied') ) {
						return;
					}
					if (e.hasClass('active')) {
						flag = true;
					} else if (ev.currentTarget === this) {
						flag = false;
					}
					if (flag) {
						current.push(e.addClass('active'));
					}
				});
				current.push(p.addClass('active'));
			// elseif ctrlkey is not pressed, remove selection
			} else if (current.length > 0 && !ev.ctrlKey && ev.currentTarget !== this) {
				that.removeClassAll('active');
			} else {
				// add selection
				if (!p.hasClass('active')) {
					current.push(p.addClass('active'));
				}
			}
			DOM.id('sz_file_archive')[current.length > 1 ? 'show' : 'hide']();

		}).event('mouseover', function(ev) {
			DOM(this).addClass('hover');
		}).event('mouseout', function(ev) {
			DOM(this).removeClass('hover');
		}).event('mousedown', function(ev) { ev.preventDefault();ev.stopPropagation()});

		handles = DOM('ul#sz_file_dir_view li').event('mouseover', function(ev) {
			ev.stopPropagation();
			DOM(this).addClass('hover');
		}).event('mouseout', function(ev) {
			ev.stopPropagation();
			DOM(this).removeClass('hover');
		});

		Module.ready('ui', function() {
			handles.foreach(function() {
				if (DOM(this).hasClass('pm_denied')) {
					return;
				}
				new Module.dragDrop(this, {
						dropClass : 'sz_sort',
						returnDefault : false,
						handle : DOM(this).getOne('div.sz_sort_handle').get(),
						dropActiveClass : 'sz_drop_active',
						callback : function(drop) {
										if (drop !== null && this !== drop) {
											that.file_model.fileMove(this, drop);
										}
						}
					});
			});
			that.setMultipleUpload();
		});

		this.ready('file_model', function() {
			var that = this, e;

			// create edit menu
			this.createEditMenu();

			// create edit directory menu
			this.createDirEditMenu();

			// set initial cache
			this.file_model.dirCache[1] = {response : DOM.id('sz_file_dir_view').getHTML(), did : 1};

			this.files.event('dblclick', function(ev) {
				ev.preventDefault();
				ev.stopPropagation();
				that.dirMenu.hide();
				e = DOM(this);

				if (!e.hasClass('sz_dir')) { // file
					that.file_model.showMenuDir(e.parent().get(), ev.pageX, ev.pageY, !!(contentSize.height - 100 < ev.clientY));
				} else {
					if (e.parent(2).hasClass('pm_denied')) { // permission_denied
						return alert('ディレクトリを開く権限がありません。');
					}
					that.__setLoading();
					that.removeDirEvent();
					that.file_model.loadDirectory(e.parent().readAttr('dir_id'), e.getOne('div.sz_name').getHTML());
					current = [];
				}
			});

			// menu close event attach to document::click
			this.event.set(document, 'click', function() {
				this.menu.hide();
				this.dirMenu.hide();
				DOM.id('sz_file_archive').hide();
				if (current.length > 0) { that.removeClassAll('active');}
			}, this);
		});

		this.event.exprLive('ul#sz_dir_tree_path a', 'click', function(ev) {
			var e = DOM(ev.target), path = e.getHTML(), flag = false;

			if (e.hasClass('current')) { return; }
			DOM('ul#sz_dir_tree_path a').foreach(function() {
				if (flag === true) {
					DOM(this).parent(2).remove();
				}
				if (this.innerHTML === path) {
					flag = true;
				}
			});
			that.currentPath = e.addClass('current').parent().removeClass('sz_sort').rollBack();
			that.__setLoading();
			that.removeDirEvent();
			that.file_model.loadDirectory(e.parent().readAttr('dir_id'), path, true);
		});

		DOM.id('add_dir').event('click', function(ev) {
			ev.stopPropagation();
			DOM.id('add_dir_form').toggleShow();
		});
		DOM.id('add_dir_do').event('click', function() {
			var e = DOM(this).prev().prev(), v = e.getValue();

			if (!v || v === '') {
				return alert('ディレクトリ名を入力してください。');
			} else if (that.checkAlready(v) === true) {
				return alert('そのディレクトリ名は既に存在します。');
			}
			that.file_model.addDirectory(v, that.currentPath.getHTML());
			e.setValue('');
			DOM(this).parent(2).hide();
		});

		// disable auto submit on Enter key.
		this.event.set(document, 'keydown', function(ev) {
			if (ev.keyCode == 13) { ev.preventDefault();}
		});

		// multiple download setup
		DOM.id('sz_file_archive').event('click', this.__multipleDownload, this);

		// draggable select set up
		this.dragArea = DOM.create('div')
							.addClass('sz_file_dir_draggable_frame')
							.appendTo();
		DOM.id('sz_file_dir_view_wrapper').event('mousedown', this.__draggableSelect, this)
																.event('click', function(ev) {
																	if ( ev.target !== DOM.id('sz_file_dir_view_wrapper') ) {
																		ev.stopPropagation();
																	}
																	this.removeClassAll('active');
																}, this);
		
		// Extra : multiple upload for HTML5 drag drop API enabled UA.
		if ( (window.FormData || window.XMLHttpRequest.prototype.sendAsBinary)
		     && 'ondragenter' in document
		     && 'ondrop'      in document
		     && 'ondragleave' in document ) {
			new DDUploader();
		}
	};

	/**
	 * =======================================================================================================
	 * checkAlready
	 * directory name exists?
	 * @access public
	 * @execute call
	 * @param String val
	 * @return bool
	 * =======================================================================================================
	 */
	this.checkAlready = function(val) {
		var already = false;

		DOM('div.sz_dir_view div.sz_name').foreach(function() {
			if (DOM(this).getHTML() === val) {
				already = true;
				return false;
			}
		});
		return already;
	};

	/**
	 * =======================================================================================================
	 * setDirEvent
	 * attach some evetns on created new directory
	 * @access public
	 * @execute call
	 * @param xElement dir
	 * @return void
	 * =======================================================================================================
	 */
	this.setDirEvent = function(dir) {
		var that = this, e;

		dir.getOne('div.sz_data').event('click', function(ev) { // click event
			ev.preventDefault();
			ev.stopPropagation();
			if (dir.hasClass('sz_dir') && dir.hasClass('active') && !dir.hasClass('pm_denied')) { // multi selected dir
				that.file_model.showDirMenu(dir, ev.pageX, ev.pageY, !!(contentSize.height - 100 < ev.clientY));
			}
			// if shifykey is pressed, range select like windows
			if (ev.shiftKey) {
				var flag = false;
				DOM('ul#sz_file_dir_view li').foreach(function() {
					var e = DOM(this);
					
					if ( e.hasClass('pm_denied') ) {
						return;
					}
					if (e.hasClass('active')) {
						flag = true;
					} else if (ev.currentTarget === this) {
						flag = false;
					}
					if (flag) {
						current.push(e.addClass('active'));
					}
				});
				current.push(DOM(this).parent(2).addClass('active'));
			// elseif ctrlkey is not pressed, remove selection
			} else if (current.length > 0 && !ev.ctrlKey && ev.currentTarget !== this) {
				that.removeClassAll('active');
			} else {
				// add selection
				if (!DOM(this).parent(2).hasClass('active')) {
					current.push(DOM(this).parent(2).addClass('active'));
				}
			}
			DOM.id('sz_file_archive')[current.length > 1 ? 'show' : 'hide']();

		}).event('mouseover', function(ev) { // mouseover
			DOM(this).addClass('hover');
		}).event('mouseout', function(ev) { // mouseout
			DOM(this).removeClass('hover');
		}).event('dblclick', function(ev) { // double click
			ev.preventDefault();
			ev.stopPropagation();
			that.dirMenu.hide();
			e = DOM(this);
			if (!e.hasClass('sz_dir')) { // file
				that.file_model.showMenuDir(e.parent().get(), ev.pageX, ev.pageY, !!(contentSize.height - 100 < ev.clientY));
			} else {
				if (e.parent(2).hasClass('pm_denied')) { // permission_denied
					return alert('ディレクトリを開く権限がありません。');
				}
				that.__setLoading();
				that.file_model.loadDirectory(e.parent().readAttr('dir_id'), e.getOne('div.sz_name').getHTML());
				current = [];
			}
		}).event('mousedown', function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
		});

		// handle event set
		dir.event('mouseover', function(ev) {
			ev.stopPropagation();
			DOM(this).addClass('hover');
		}).event('mouseout', function(ev) {
			ev.stopPropagation();
			DOM(this).removeClass('hover');
		});

		// atach dragdrop
		new Module.dragDrop(dir, {
					dropClass : 'sz_sort',
					returnDefault : false,
					dropActiveClass : 'sz_drop_active',
					callback : function(drop) {
									if (drop !== null && drop !== this) {
										that.file_model.fileMove(DOM(this).first().get(), drop);
									}
					}
				}
			);
	};

	/**
	 * =======================================================================================================
	 * removeClassAll
	 * remove className current all selected files or directories
	 * @access public
	 * @execute call
	 * @param String c
	 * @return void
	 * =======================================================================================================
	 */
	this.removeClassAll = function(c) {
		var i = 0; len = current.length;

		for (; i < len; i++) { current[i].removeClass(c);}
		current = [];
	};

	/**
	 * =======================================================================================================
	 * removeDirEvent
	 * remove all dir event before dirs updated by ajax
	 * against for memory leak
	 * @access public
	 * @execute call
	 * @return void
	 * =======================================================================================================
	 */
	this.removeDirEvent = function() {
		this.files.unevent('mouseover')
					.unevent('mouseout')
					.unevent('click')
					.unevent('dblclick')
					.unevent('mousedown')
					.foreach(function() {
						DOM(this).parent(2)
						.unevent('mousedown')
						.unevent('mouseover')
						.unevent('mouseout');
					});
	};

	/**
	 * =======================================================================================================
	 * initDirEvent
	 * rescan and set event
	 * @access public
	 * @execute call
	 * @return void
	 * =======================================================================================================
	 */
	this.initDirEvent = function() {
		var that = this, e, p;

		this.files = DOM('div.sz_data')
						.event('click', function(ev) {
							ev.preventDefault();
							ev.stopPropagation();
							p = DOM(this).parent(2);
							if (p.hasClass('sz_dir')
									&& p.hasClass('active')
									&& !p.hasClass('pm_denied')) { // multi selected dir
								that.file_model.showDirMenu(p, ev.pageX, ev.pageY, !!(contentSize.height - 100 < ev.clientY));
							}
							// if shifykey is pressed, range select like windows
							if (ev.shiftKey) {
								var flag = false;
								DOM('ul#sz_file_dir_view li').foreach(function() {
									var e = DOM(this);
									
									if ( e.hasClass('pm_denied') ) {
										return;
									}
									if (e.hasClass('active')) {
										flag = true;
									} else if (ev.currentTarget === this) {
										flag = false;
									}
									if (flag) {
										current.push(e.addClass('active'));
									}
								});
								current.push(p.addClass('active'));
							// elseif ctrlkey is not pressed, remove selection
							} else if (current.length > 0 && !ev.ctrlKey && ev.currentTarget !== this) {
								that.removeClassAll('active');
							} else {
								// add selection
								if (!p.hasClass('active')) {
									current.push(p.addClass('active'));
								}
							}
							DOM.id('sz_file_archive')[current.length > 1 ? 'show' : 'hide']();

						}).event('mouseover', function(ev) {
							DOM(this).addClass('hover');
						}).event('mouseout', function(ev) {
							DOM(this).removeClass('hover');
						}).event('dblclick', function(ev) {
							ev.preventDefault();
							ev.stopPropagation();
							that.dirMenu.hide();
							e = DOM(this);

							if (!e.hasClass('sz_dir')) { // file
								that.file_model.showMenuDir(e.parent().get(), ev.pageX, ev.pageY, !!(contentSize.height - 100 < ev.clientY));
							} else {
								if (e.parent(2).hasClass('pm_denied')) { // permission_denied
									return alert('ディレクトリを開く権限がありません。');
								}
								that.__setLoading();
								that.file_model.loadDirectory(e.parent().readAttr('dir_id'), e.getOne('div.sz_name').getHTML());
								current = [];
							}
						}).event('mousedown', function(ev) {
							ev.stopPropagation();
							ev.preventDefault();
						});

		DOM('ul#sz_file_dir_view li').foreach(function() {
			if (DOM(this).hasClass('pm_denied')) {
				return;
			}
			new Module.dragDrop(this, {
					dropClass : 'sz_sort',
					returnDefault : false,
					handle : this,
					dropActiveClass : 'sz_drop_active',
					callback : function(drop) {
									if (drop !== null && this !== drop) {
										that.file_model.fileMove(DOM(this).first(), drop);
									}
					}
				}
			);
		}).event('mouseover', function(ev) {
			ev.stopPropagation();
			DOM(this).addClass('hover');
		}).event('mouseout', function(ev) {
			ev.stopPropagation();
			DOM(this).removeClass('hover');
		});
	};

	/**
	 * =======================================================================================================
	 * createEditMenu
	 * create file edit menu
	 * @access public
	 * @execute call
	 * @return void
	 * =======================================================================================================
	 */
	this.createEditMenu = function() {
		var that = this,
		    html = ['<ul>',
		            '<li><a href="javascript:void(0)" class="extract">展開</a></li>',
		            '<li><a href="javascript:void(0)" class="sz_zoom file_view">表示</a></li>',
		            '<li><a href="javascript:void(0)" class="dl_file">ダウンロード</a></li>',
		            '<li><a href="javascript:void(0)" class="file_group">グループ</a></li>',
		            '<li><a href="javascript:void(0)" class="file_name">名前の変更</a></li>',
		            '<li><a href="javascript:void(0)" class="edit_file">編集</a></li>',
		            '<li><a href="javascript:void(0)" class="replace">差し替え</a></li>',
		            '<li><a href="javascript:void(0)" class="delete_conf">削除</a></li>',
		            '</ul>'
		            ],
		    menu = DOM.create('div')
						.appendTo(window['IEFIX'] ? IEFIX.body : document.body)
						.addClass('sz_file_menu')
						.html(html.join('\n'))
						.addStyle('border-radius', '5px')
						.hide(),
			links = menu.detect('a');
		
		// delete confirm?
		links.get(7)
			.event('click', this.file_model.deleteConfirm, this.file_model);
		// repalce file
		links.get(6)
			.event('click', this.file_model.setUpReplace, this.file_model);
		// group setting
		links.get(3)
			.event('click', function(ev) {this.file_model.setGroup(ev.target.rel);}, that);
		// rename
		links.get(4)
			.event('click', function(ev) {this.file_model.renameFile(ev.target.rel);}, that);
		// extract
		links.get(0)
			.event('click', this.file_model.extractArchive, this);
		this.menu = menu;

		Module.ready('ui', function() {
			new Module.zoom('sz_zoom', 'ajax', {width : 700, height : 500});
		});
	};

	/**
	 * =======================================================================================================
	 * createDirEditMenu
	 * create direcotry controls menu
	 * @access public
	 * @execute call
	 * @return void
	 * =======================================================================================================
	 */
	this.createDirEditMenu = function() {
		var html = ['<ul>',
		            '<li><a href="javascript:void(0)" class="open_dir">開く</a></li>',
		            '<li><a href="javascript:void(0)" class="rename">名前の変更</a></li>',
		            '<li><a href="javascript:void(0)" class="edit_permission">権限の設定</a></li>',
		            '<li><a href="javascript:void(0)" class="clone">複製</a></li>',
		            '<li><a href="javascript:void(0)" class="delete">削除</a></li>',
		            '</ul>'
		            ];

		this.dirMenu = DOM.create('div')
							.appendTo(window['IEFIX'] ? IEFIX.body : document.body)
							.addClass('sz_dir_menu')
							.html(html.join('\n'))
							.addStyle('border-radius', '5px')
							.hide()
							.detect('a').event('click', this.file_model.actionDirMenu, this.file_model)
							.rollBack();
	};

	/**
	 * =======================================================================================================
	 * __setLoading
	 * show or hide loadign image
	 * @access private
	 * @execute call
	 * @param bool isHide
	 * @return void
	 * =======================================================================================================
	 */
	this.__setLoading = function(isHide) {
		this.layer[isHide ? 'hide' : 'show']();
		this.loading[isHide ? 'hide' : 'show']();
	};

	/**
	 * =======================================================================================================
	 * setMultipleUpload
	 * set up multiple upload event
	 * @access public
	 * @execute call
	 * @return void
	 * =======================================================================================================
	 */
	this.setMultipleUpload = function() {
		var that = this;

		Module.ready('ui', function() {
			new Module.zoom('sz_multi_upload', 'external', {closeCallback : that.multipleCallback, width : 500, height : 300});
		});
	};

	/**
	 * =======================================================================================================
	 * mulipleCallback
	 * multiple uploaded data catch this method
	 * @access public [to global]
	 * @execute call
	 * @return void
	 * =======================================================================================================
	 */
	this.multipleCallback = function() {
		var i = 0; st = that.multipleStack, len = st.length;

		for (i; i < len; i++) {
			that.__addNewData(st[i], true);
		}
		that.multipleStack = [];
		that.file_model.deleteDirCache[DOM('ul#sz_dir_tree_path a.current').get(0).parent().readAttr('dir_id')];
	};

	/**
	 * =======================================================================================================
	 * __setStackMultiple
	 * add uploaded data to this scope stack
	 * @access public [to global]
	 * @execute call
	 * @param Object data
	 * @return void
	 * =======================================================================================================
	 */
	this.__setStackMultiple = function(data) {
		that.multipleStack.push(data);
	};

	/**
	 * =======================================================================================================
	 * __addNewData
	 * uploaded data format and add document
	 * @access public [to global]
	 * @execute call
	 * @param Object data
	 * @param String delC
	 * @return void
	 * =======================================================================================================
	 */
	this.__addNewData = function(data, delC) {
		var html, li, img;

		if (data.is_icon) {
			img = '<p style="background : transparent url(' + that.config.baseUrl() + 'images/icons/files/' + data.extension + '.png) center center no-repeat;">&nbsp;</p>';
		} else if (/gif$|jpe?g$|png$|bmp$|tiff$/.test(data.extension)) {
			img = '<p style="background : transparent url(' + that.config.baseUrl() + 'files/thumbnail/' + data.crypt_name + '.' + data.extension + ') center center no-repeat;">&nbsp;</p>';
		} else {
			img = '<p style="background : transparent url(' + that.config.baseUrl() + 'images/icons/files/file.png) center center no-repeat;">&nbsp;</p>';
		}

		html = [
		        '<div class="sz_file_view sz_sort_handle" filename="', data.file_name,'.', data.extension, '" file_id="', data.file_id, '" filename="', data.file_name,'.', data.extension, '">',
		          '<div class="sz_data">',
		            img,
		            '<div class="sz_name">', data.file_name,'.', data.extension, '</div>',
		          '</div>',
		        '</div>'
		        ];
		// create <li> of file
		li = DOM.create('li').html(html.join(''))
					.appendTo(DOM.id('sz_file_dir_view'))
					.animate('highLight');

		// attach file event
		that.setDirEvent(li);
		if (!delC) {
			that.file_model.deleteDirCacheAll();//deleteDirCache([DOM('ul#sz_dir_tree_path a.current').get(0).getHTML()]);
		}
	};

	/**
	 * =======================================================================================================
	 * __replaceNewFile
	 * replace file to document
	 * @access private
	 * @execute call
	 * @param Object data
	 * @return void
	 * =======================================================================================================
	 */
	this.__replaceNewFile = function(data) {
		var html, li, img,
			repTarget = DOM.origCSS('div[file_id=' + data.old_file_id + ']').get(0).parent();

		if (data.is_icon) {
			img = '<p style="background : transparent url(' + that.config.baseUrl() + 'images/icons/files/' + data.extension + '.png) center center no-repeat;">&nbsp;</p>';
		} else if (/gif$|jpe?g$|png$|bmp$|tiff$/.test(data.extension)) {
			img = '<p style="background : transparent url(' + that.config.baseUrl() + 'files/thumbnail/' + data.crypt_name + '.' + data.extension + ') center center no-repeat;">&nbsp;</p>';
		} else {
			img = '<p style="background : transparent url(' + that.config.baseUrl() + 'images/icons/files/file.png) center center no-repeat;">&nbsp;</p>';
		}

		html = [
		        '<div class="sz_file_view sz_sort_handle" file_name="', data.file_name,'.', data.extension, '" file_id="', data.old_file_id, '">',
		          '<div class="sz_data">',
		            img,
		            '<div class="sz_name">', data.file_name,'.', data.extension, '</div>',
		          '</div>',
		        '</div>'
		        ];
		// create <li> of file
		li = DOM.create('li').html(html.join(''))
					.appendTo(repTarget, 'before')
					.animate('highLight');
		repTarget.remove();

		// attach file event
		that.setDirEvent(li);
		that.file_model.deleteDirCache([that.file_model.getCurrentDir()]);
	};

	/**
	 * =======================================================================================================
	 * __replaceStacks
	 * add stack to replaced data
	 * @aceess public [to global]
	 * @execute call
	 * @param Object data
	 * @return void
	 * =======================================================================================================
	 */
	this.__replaceStacks = function(data) {
		that.replaceData = data;
	};

	/**
	 * =======================================================================================================
	 * replaceStack
	 * send replace request on CI
	 * @access public
	 * @execute call
	 * @return void
	 * =======================================================================================================
	 */
	this.replaceStack = function() {
		if (!this.replaceData) { return;}

		var that = this, data = this.replaceData;

		this.ajax.post('dashboard/files/directory_view/do_replace_file/' + this.config.item('sz_token'), {
			param : {file_name : data.file_name, crypt_name : data.crypt_name, extension : data.extension, old_file_id : data.old_file_id,
						size : data.size, width : data.width, height : data.height, added_date : data.added_date
					},
			success: function(resp) {
				that.__replaceNewFile(data);
			}
		});
	};

	/**
	 * =======================================================================================================
	 * __multipleDownload
	 * set multiple download
	 * @access private
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.__multipleDownload = function(ev) {
		ev.preventDefault();
		ev.stopPropagation();
		var files = [], dirs = [], e;

		DOM('ul#sz_file_dir_view li.active').foreach(function() {
			e = DOM(this);
			if (e.hasClass('sz_dir')) {
				dirs.push(e.first().readAttr('dir_id'));
			} else {
				files.push(e.first().readAttr('file_id'));
			}
		});
		DOM.id('archive_files').setValue(files.join(':'));
		DOM.id('archive_directories').setValue(dirs.join(':'));
		if (dirs.length > 0) {
			if (confirm('ディレクトリの中にあるファイルも全て追加します。よろしいですか？\n\n(ディレクトリ自体は追加されません)')) {
				DOM.id('sz_file_multiple_download').method('submit');
			}
		} else{
			DOM.id('sz_file_multiple_download').method('submit');
		}
	};

	/**
	 * =======================================================================================================
	 * __draggableSelect
	 * selectable multiple file/directory on mouse dragging
	 * @access private
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.__draggableSelect = function(ev) {
		ev.preventDefault();
		this.menu.hide();
		this.dirMenu.hide();
		if(ev.target.id !== 'sz_file_dir_view_wrapper') { return;}
		this.removeClassAll('active');
		this.dragArea.addStyle({top : ev.pageY + 'px', left : ev.pageX + 'px'}).show();
		this.dragAreaInitPoint = { x : ev.pageX, y : ev.pageY };
		this.dragSelectTargetElements = DOM('ul#sz_file_dir_view li');
		this.event.set(document, 'mousemove', this.__draggableMove, this);
		this.event.set(document, 'mouseup', this.__draggableMoveEnd, this);
	};

	/**
	 * =======================================================================================================
	 * __draggableMove
	 * mousemove event handle and judge file/directory point in frame rectangle?
	 * @access private
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.__draggableMove = function(ev) {
		ev.preventDefault();
		ev.stopPropagation();
		var abs = Math.abs, init = this.dragAreaInitPoint, that = this;

		this.dragArea.addStyle({
			height : abs(init.y - ev.pageY) + 'px',
			width : abs(init.x - ev.pageX) + 'px',
			top : (ev.pageY > init.y ? init.y : ev.pageY) + 'px',
			left : (ev.pageX > init.x ? init.x : ev.pageX) + 'px'
		});
		this.dragSelectTargetElements.foreach(function() {
			if (this.className.indexOf('pm_denied') !== -1) {
				return;
			}
			if (that.ut.inRectPiece(this, that.dragArea)) {
				DOM(this).addClass('active');
			} else {
				DOM(this).removeClass('active');
			}
		});
	};

	/**
	 * =======================================================================================================
	 * __draggableMoveEnd
	 * mousemove event detach and after process
	 * @access private
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * =======================================================================================================
	 */
	this.__draggableMoveEnd = function(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		this.event.remove(document, 'mousemove', this.__draggableMove);
		this.event.remove(document, 'mouseup', arguments.callee);
		this.dragArea.addStyle({
			width : '0px',
			height : '0px'
		}).hide();
		current = [];
		// a few times delay for IE...
		if (this.ua.IE) {
			var that = this;
			setTimeout(function() {
				that.dragSelectTargetElements.foreach(function() {
					if (DOM(this).hasClass('active')) {
						current.push(DOM(this));
					}
				});
				DOM.id('sz_file_archive')[current.length > 1 ? 'show' : 'hide']();
			}, 100);
		// else brower works smoothly
		} else {
			this.dragSelectTargetElements.foreach(function() {
				if (DOM(this).hasClass('active')) {
					current.push(DOM(this));	
				}
			});
			DOM.id('sz_file_archive')[current.length > 1 ? 'show' : 'hide']();
		}
	}

	// move to global scope
	this.alias('addStack', this.__setStackMultiple);
	this.alias('addNewData', this.__addNewData);
	this.alias('replaceStacks', this.__replaceStacks);
	
	
	/**
	 * =============================================================
	 * HTML5 Drap and Drop API and File API class
	 * 
	 * This class instantiate on API implements Browser only.
	 * =============================================================
	 */
	function DDUploader() {
		this.fileArea = DOM.id('sz_file_dir_view_wrapper');
		this.dropArea = DOM.id('sz_file_drop_area');
		this.doc      = document;
		this.allowedTypes  = '|gif|jpg|jpeg|png|bmp|tiff|zip|txt|csv|doc|rtf|xls|pdf|swf|fla|flv|gz|html|css|js|php|mp4|';
		this.processTimes  = 0;
		this.processLength = 0;
		this.processFiles  = [];
		this.successFiles  = [];
		this.file_model    = that.file_model;
		this.isFormDataEnable = false;
		
		this.construct();
	}
	
	DDUploader.prototype = {
		constructor : DDUploader,
		construct : function() {
			var that = this,
				drop = this.dropArea.get(),
				FL = getInstance();
			
			// feature detection
			this.isFormDataEnable = !!window.FormData;
			
			// drag drop API event handle start
			// Document event handle
			this.doc.addEventListener('dragenter', function(ev) {
				that.dragInit(ev);
			}, false);
			this.doc.addEventListener('dragover',  function(ev) {
				that.dragInit(ev);
			}, false);
			this.doc.addEventListener('dragleave', function(ev) {
				that.dragEnd(ev);
			}, false);
			
			// Drop element event handle
			drop.addEventListener('dragenter', cancel, false);
			drop.addEventListener('dragover',  cancel, false);
			drop.addEventListener('dragleave', cancel, false);
			drop.addEventListener('drop', function(ev) {
				that.dropFile(ev);
			}, false);
			
			function cancel(ev) {
				ev.stopPropagation();
				ev.preventDefault();
			}
		},
		createFileReader : function() {
			var FR = new FileReader(),
				that = this;
			
			FR.onload = function(ev) {
				that.fileLoadCompletedHandler(ev);
			};
			FR.onerror = function() {
				that.fileLoadErrorHandler(ev);
			};
			
			return FR;
		},
		dragInit : function() {
			this.fileArea.hide();
			this.dropArea.show();
		},
		dragEnd : function(ev) {
			ev.preventDefault();
			if ( ev.pageX < 1 || ev.pageY < 1 ) {
				this.fileArea.show();
				this.dropArea.hide();
			}
		},
		dropFile : function(ev) {
			ev.stopPropagation();
			ev.preventDefault();
			
			var i    = -1,
				FL    = getInstance(),
				files = ev.dataTransfer.files,
				len   = files.length;
			
			if ( len > 0 ) {
				if ( this.isFormDataEnable ) {
					this.successFiles = files;
					this.__uploadRequest();
				} else {
					this.processFiles  = files;
					this.processLength = len;
					this.processTimes  = 0;
					
					this.createFileReader().readAsBinaryString(files[0]);
				}
			}
			
			this.fileArea.show();
			this.dropArea.hide();
		},
		fileLoadCompletedHandler : function(ev) {
			var file = this.processFiles[this.processTimes],
				FR;
			
			this.successFiles.push({file : file, binaryString : ev.target.result});
			this.processTimes++;
			ev.target = null; // GC
			if ( this.processLength === this.processTimes ) {
				this.__uploadRequest();
			} else if ( this.processLength > this.processTimes ) {
				FR = this.createFileReader();
				FR.readAsBinaryString(this.processFiles[this.processTimes]);
			}
		},
		fileLoadErrorHandler : function(ev) {
			var FR;
			
			this.processTimes++;
			ev.target = null; // GC
			if ( this.processLength === this.processTimes ) {
				this.__uploadRequest();
			} else if ( this.processLength > this.processTimes ) {
				FR = this.createFileReader();
				FR.readAsBinaryString(this.processFiles[this.processTimes]);
			}
		},
		__uploadRequest : function() {
			var xhr = new XMLHttpRequest();
			
			// GC
			this.processFiles = [];
			
			if ( window.FormData ) { // Chrome, Safari, Firefox4+ etc...
				this.__uploadByFormDataNativeAPI(xhr);
			} else if ( xhr.sendAsBinary ) { // Firefox extension API
				this.__uploadByXHRExtension(xhr);
			} else {
				alert('アップロードをサポートしていないブラウザです。');
			}
		},
		__uploadByFormDataNativeAPI : function(xhr) {
			var dat = new FormData(),
				i   = -1,
				FL = getInstance(),
				json,
				file,
				fileName,
				extension;
			
			that.loading.show();
			
			while ( this.successFiles[++i] ) {
				file = this.successFiles[i];
				fileName = file.fileName || file.name;
				// uploaded file is allowed extension and has mimetype string?
				extension = fileName.slice(fileName.lastIndexOf('.') + 1);
				if ( this.allowedTypes.indexOf('|' + extension + '|') === -1 || file.type === '' ) {
					continue;
				}
				dat.append('upload_file' + (i + 1), this.successFiles[i]);
			}
			dat.append('directory_id', that.file_model.getCurrentDir());
			
			// reset
			this.successFiles = [];
			
			xhr.open('POST', FL.config.siteUrl() + 'dashboard/files/directory_view/ajax_api_upload', true);
			xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			xhr.send(dat);
			
			xhr.onload = function(ev) {
				try {
					json = FL.json.parse(xhr.responseText);
					that.multipleStack = json;
					that.multipleCallback();
				} catch (e) {
					alert(e.message);
				} finally {
					that.loading.hide();
				}
			};
		},
		__uploadByXHRExtension : function(xhr) {
			var i       = -1,
				FL       = getInstance(),
				boundary = '----flintjsapiuploadboundary' + (new Date() | 0),
				dd       = '--',
				crlf     = '\r\n',
				header   = [dd + boundary],
				j        = 0,
				xhr      = new XMLHttpRequest(),
				file,
				json,
				fileName,
				formData,
				extension,
				requestHeader;
			
			that.loading.show();
			
			while ( this.successFiles[++i] ) {
				file = this.successFiles[i];
				fileName = file.fileName || file.name || '';
				
				// uploaded file is allowed extension?
				extension = fileName.slice(fileName.lastIndexOf('.') + 1);
				if ( this.allowedTypes.indexOf('|' + extension + '|') === -1 ) {
					continue;
				}
				// add header
				header[++j] = 'Content-Disposition: form-data; name="upload_file' + (i + 1) + '"';
				if ( fileName ) {
					header[j] += '; filename="' + fileName + '"';
				}
				header[++j] = 'Content-Type: application/octet-stream';
				header[++j] = crlf;
				header[++j] = file.binaryString;
				header[++j] = dd + boundary;
			}
			
			header[++j] = 'Content-Disposition: form-data; name="directory_id"';
			header[++j] = 'Content-Type: text/plain';
			header[++j] = crlf;
			header[++j] = this.file_model.getCurrentDir();
			header[++j] = dd + boundary;
			
			header[++j]   = dd + boundary + dd;
			requestHeader = header.join(crlf) + crlf;
			
			// reset
			this.successFiles = [];
			
			xhr.open('POST', FL.config.siteUrl() + 'dashboard/files/directory_view/ajax_api_upload', true);
			xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
			xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			xhr.sendAsBinary(requestHeader);
			
			xhr.onload = function(ev) {
				try {
					json = FL.json.parse(xhr.responseText);
					that.multipleStack = json;
					that.multipleCallback();
				} catch (e) {
					alert(e.message);
				} finally {
					that.loading.hide();
				}
			};
		}
	};

});
