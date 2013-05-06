/**
 * ===================================================================================================
 *
 * Seezoo file operator library
 *
 * manage file select upload on directory mode
 * works mode:
 *   editor : rich editor mode
 *   multiple : multiple select image
 *   simple : simple image selector [default work]
 *
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 *
 * ===================================================================================================
 */
ClassExtend('Library', function file_operator() {

	// local variables
	var FL = getInstance(),
		that = this,
		current = [],
		// accept image extension
		imgExt = /.+\.gif$|.+\.jpe?g$|.+\.png$/,
		imgDisplayExt = {gif : 1, jpeg : 1, jpg : 1, png : 1},
		handles,
		// callback target
		target,
		// current window
		PP,
		// work mode (single or multiple or editor)
		mode,
		// file data cache
		fileCache = {},
		// image extensions
		IMAGE_EXT = 'jpg|jpeg|gif|png|bmp|tiff';

	// load depend model and modules
	FL.load.model('file_model');
	FL.load.module('ui');
	FL.load.module('layer');

	// public properties
	this.files = null;
	this.loading = null;
	this.multipleStack = [];
	this.dirCache = {};
	this.dragArea = null;
	this.currentShowTarget = null;


	/**
	 *  ===================================================================================================
	 *  setMultipleUpload
	 *  set up multiple upload form
	 *  @access private
	 *  @excute call
	 *  @return void
	 *  ===================================================================================================
	 */
	var setMultipleUpload = function() {
		var pp;

		DOM('a.sz_multi_upload').get(0).event('click', function(ev) {
			ev.preventDefault();
			pp = Helper.createDOMWindow('複数ファイルのアップロード', '', 400, 300, false, false);
			pp.setContent('<iframe src="' + ev.target.href + '" frameborder="0" scrolling="no" style="width:400px;height:300px"></iframe>');
			pp.setOnClose(function() {
				that.multipleCallback();
			});
		});
	};

	/**
	 * ===================================================================================================
	 * __handleSearchEvent
	 * search handle event
	 * @access private
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * ===================================================================================================
	 */
	var __handleSearchEvent = function(ev) {
		var that = this, json, f = DOM.id('sz_file_search_form'),
			name, ext, gr;

		this.__setLoading();
		ev.preventDefault();

		name = f.getOne('input[name=file_name]').getValue();
		ext = f.getOne('select[name=file_ext]').getValue();
		gr = f.getOne('select[name=file_group]').getValue();

		FL.ajax.post('dashboard/files/directory_view/search_files/' + FL.config.item('sz_token'), {
			param : { name : name, ext : ext, group : gr},
			error : function () { that.__setLoading(true);},
			success : function(resp) {
				that.__setLoading(true);
				DOM.id('search_result_view').html(resp.responseText);
				that.toggleTreeSearch(true);
			}
		});
	};

	/**
	 * ===================================================================================================
	 * __removeAllHandler
	 * remove popup event on close
	 * @access private
	 * @execute call
	 * @return void
	 * ===================================================================================================
	 */
	var __removeAllHandler = function() {
		that.files.unevent('click')
					.unevent('mouseover')
					.unevent('mouseout')
					.unevent('dblclick');

		handles.unevent('mouseover')
				.unevent('mouseout')
				.unevent('mousedown');

		FL.event.remove(document, 'keydown', that.docKeyHandle);
		FL.event.remove(document, 'click', that.docClick);
		FL.event.exprdeLive('ul#sz_dir_tree_path a', 'click', that.liveHandle);

		DOM.id('add_dir').unevent('click');
		DOM.id('add_dir_do').unevent('click');
		DOM.id('toggle_view').unevent('click');
		that.dirMenu.hide();
		that.menu.hide();
	};

	/**
	 * ====================================================================================================
	 *
	 * public functions
	 *
	 * =====================================================================================================
	 */

	/**
	 * ===================================================================================================
	 * init
	 * operator initialize
	 * @access public
	 * @execute call
	 * @param xElement t
	 * @param DOMWindow instance h
	 * @param String mode
	 * @return void
	 * ===================================================================================================
	 */
	this.init = function(t, h, m) {
		var that = this, p;

		// copy to local variable
		target = t;
		PP = h;
		mode = m || 'simple';
		// delte cache 
		fileCahce = {};

		if (!this.layer) { this.layer = new Module.layer(false);}
		if (!this.loading) { this.loading = DOM.create('div').attr('id', 'sz_saving').appendTo().addStyle('position', 'fixed');}
		this.currentPath = DOM.id('sz_dir_tree_path').getOne('a.current');

		this.files = DOM('div.sz_data')
		.event('click', function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			p = DOM(this).parent(2);
			if (DOM(this).hasClass('sz_dir')
					&& p.hasClass('active')
						&& !p.hasClass('pm_denied')) { // multi selected dir
				that.showDirMenu(p, ev.pageX, ev.pageY);
			} else if (!DOM(this).hasClass('sz_dir')){
				that.showMenuDir(DOM(this).parent().get(), ev.pageX, ev.pageY);
				return;
			}
			// if shifykey is pressed, range select like windows
			if (ev.shiftKey) {
				var flag = false;
				DOM('ul#sz_file_dir_view li').foreach(function() {
					var e = DOM(this);
					if ( e.hasClass('pm_denied') ) {
						return;
					}
					if (DOM(this).hasClass('active')) {
						flag = true;
					} else if (ev.currentTarget === this) {
						flag = false;
					}
					if (flag) {
						current.push(DOM(this).addClass('active'));
					}
				});
				current.push(p.addClass('active'));
			// elseif ctrlkey is not pressed, remove selection
			} else if (current.length > 0 && !ev.ctrlKey) {
				that.removeClassAll('active');
			} else {
				if (!p.hasClass('active')) {
					current.push(p.addClass('active'));
				}
			}
			// add selection
			DOM.id('sz_file_archive')[current.length > 1 ? 'show' : 'hide']();

		}).event('mouseover', function(ev) {
			DOM(this).addClass('hover');
		}).event('mouseout', function(ev) {
			DOM(this).removeClass('hover');
		}).event('mousedown', function(ev) {
			ev.stopPropagation();
			ev.preventDefault();
		});

		handles = DOM('ul#sz_file_dir_view li')
		.event('mouseover', function(ev) {
			var e = DOM(this);
			if ( ! e.hasClass('pm_denied') ) {
				ev.stopPropagation();
				DOM(this).addClass('hover');
			}
		}).event('mouseout', function(ev) {
			var e = DOM(this);
			if ( ! e.hasClass('pm_denied') ) {
				ev.stopPropagation();
				DOM(this).removeClass('hover');
			}
		});

		Module.ready('ui', function() {
			handles.foreach(function() {
				new Module.dragDrop(this, {
					dropClass : 'sz_sort',
					returnDefault : false,
					handle : DOM(this).getOne('div.sz_sort_handle').get(),
					dropActiveClass : 'sz_drop_active',
					callback : function(drop) {
						if (drop !== null && this !== drop) {
							that.fileMove(DOM(this).get(), drop);
						}
					}
				});
			});
			setMultipleUpload();
		});

		if (!this.menu) {this.createEditMenu();}
		if (!this.dirMenu) {this.createDirEditMenu();}

		// set initial cache
		//this.dirCache[1] = {response : DOM.id('sz_file_dir_view').getHTML(), did : 1};

		this.files.event('dblclick', function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			that.dirMenu.hide();
			var e = DOM(this);

			if (e.hasClass('sz_dir')) { // directory
				if (e.parent(2).hasClass('pm_denied')) { // permission_denied
					return alert('ディレクトリを開く権限がありません。');
				}
				that.__setLoading();
				that.removeDirEvent();
				that.loadDirectory(e.parent().readAttr('dir_id'), e.getOne('div.sz_name').getHTML());
			}
		});


		DOM.id('add_dir').event('click', function(ev) {
			ev.stopPropagation();
			DOM.id('add_dir_form').toggleShow();
		});
		DOM.id('add_dir_do').event('click', function() {
			var e = DOM(this).prev().prev(), v = e.getValue();

			if (!v || v === '') { return alert('ディレクトリ名を入力してください。');}
			else if (that.checkAlready(v) === true) { return alert('そのディレクトリ名は既に存在します。');}
			that.addDirectory(v, that.currentPath.getHTML());
			e.setValue('');
			DOM(this).parent(2).hide();
		});

		// disable auto submit on Enter key.
		FL.event.set(document, 'keydown', this.docKeyHandle);
		FL.event.set(document, 'click', this.docClick, this);
		FL.event.exprLive('ul#sz_dir_tree_path a', 'click', this.liveHandle);

		FL.event.set(DOM.id('sz_file_api_search_do'), 'click', __handleSearchEvent, this);
		DOM.id('toggle_view').event('click', this.toggleTreeSearch);

		// multiple download setup
		DOM.id('sz_file_archive').event('click', this.__multipleDownload, this);

		// draggable select set up
		this.dragArea = DOM.create('div')
							.addClass('sz_file_dir_draggable_frame');
		DOM.id('sz_file_dir_view_wrapper').event('mousedown', this.__draggableSelect, this);
		
		// Extra : multiple upload for HTML5 drag drop API enabled UA.
		if ( window.FileReader
		     && 'ondragenter' in document
		     && 'ondrop' in document
		     && 'ondragleave' in document ) {
			new DDUploader();
		}
	};

	/**
	 * ===================================================================================================
	 * doClick
	 * document clicked event handler
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * ===================================================================================================
	 */
	this.docClick = function(ev) {
		this.menu.hide();
		this.dirMenu.hide();
		if (current.length > 0) { that.removeClassAll('active');}
	};

	/**
	 * ===================================================================================================
	 * doKeyHandle
	 * document keydown event handler
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * ===================================================================================================
	 */
	this.docKeyHandle = function(ev) {if (ev.keyCode == 13) { ev.preventDefault();}};

	/**
	 * ===================================================================================================
	 * liveHandle
	 * live event handler
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * ===================================================================================================
	 */
	this.liveHandle = function(ev) {
		var e = DOM(ev.target), path = e.getHTML(),
			flag = false;

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
		that.loadDirectory(e.parent().readAttr('dir_id'), path, true);
	};

	/**
	 * ===================================================================================================
	 * toggleTreeSearch
	 * view mode change tree/search_result
	 * @access public
	 * @execute call
	 * @param bool flag
	 * @return void
	 * ===================================================================================================
	 */
	this.toggleTreeSearch = function(flag) {
		var f = FL.ut.isBool(flag), that = this;

		DOM.id('tree_mode')[f ? 'hide' :'show']();
		DOM.id('search_mode')[f ? 'show' : 'hide']();

		var results = DOM('div.sz_file_search_img');
		if (results.length > 0) {
			if (f) { // set select event
				results.event('click', function(ev) {
					ev.stopPropagation();
					that.showMenuDir(this, ev.pageX, ev.pageY);
				});
			} else {
				results.unevent('click');
			}
		}
	};

	/**
	 * ===================================================================================================
	 * checkAlready
	 * input directory name exists?
	 * @access public
	 * @execute call
	 * @param String val
	 * @return bool
	 * ===================================================================================================
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
	 * ===================================================================================================
	 * setDirEvent
	 * set some event to created directory
	 * @access public
	 * @execute call
	 * @param xElement dir
	 * @return void
	 * ===================================================================================================
	 */
	this.setDirEvent = function(dir) {
		var that = this, e, p;

		dir.getOne('div.sz_data').event('click', function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			if (DOM(this).hasClass('sz_dir')
					&& dir.hasClass('active')
						&& !dir.hasClass('pm_denied')) { // multi selected dir
				that.showDirMenu(dir, ev.pageX, ev.pageY);
			} else if (!DOM(this).hasClass('sz_dir')){
				that.showMenuDir(DOM(this).parent().get(), ev.pageX, ev.pageY);
			}
			// if shifykey is pressed, range select like windows
			if (ev.shiftKey) {
				var flag = false;
				DOM('ul#sz_file_dir_view li[class!=pm_denied]').foreach(function() {
					if (DOM(this).hasClass('active')) {
						flag = true;
					} else if (ev.currentTarget === this) {
						flag = false;
					}
					if (flag) {
						current.push(DOM(this).addClass('active'));
					}
				});
				current.push(dir.addClass('active'));
			// elseif ctrlkey is not pressed, remove selection
			} else if (current.length > 0 && !ev.ctrlKey) {
				that.removeClassAll('active');
			} else {
				if (DOM(this).parent(2).hasClass('active')) {
					current.push(DOM(this).parent(2).addClass('active'));
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
			var e = DOM(this);
			if (!e.hasClass('sz_dir')) { return; }
			if (e.parent(2).hasClass('pm_denied')) { // permission_denied
				return alert('ディレクトリを開く権限がありません。');
			}
			that.__setLoading();
			that.loadDirectory(e.parent().readAttr('dir_id'), e.getOne('div.sz_name').getHTML());
		}).event('mousedown', function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
		});

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
				handle : dir.getOne('div.sz_sort_handle').get(),
				dropActiveClass : 'sz_drop_active',
				callback : function(drop) {
					if (drop !== null && drop !== dir.get()) {
						that.fileMove(dir.first().get(), drop);
					}
				}
			}
		);
	};

	/**
	 * ===================================================================================================
	 * removeClassAll
	 * all clear selected directory/file
	 * @access public
	 * @execute call
	 * @param String c
	 * @return void
	 * ===================================================================================================
	 */
	this.removeClassAll = function(c) {
		var i = 0; len = current.length;

		for (; i < len; i++) { current[i].removeClass(c);}
		current = [];
	};

	/**
	 * ===================================================================================================
	 * removeDirEvent
	 * remove all dir event before dirs updated by ajax
	 * @access public
	 * @execute call
	 * @return void
	 * ===================================================================================================
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
	 * ===================================================================================================
	 * initDirEvent
	 * rescan and set event
	 * @access public
	 * @execute call
	 * @return void
	 * ===================================================================================================
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
								that.showDirMenu(p, ev.pageX, ev.pageY);
							} else if (!DOM(this).hasClass('sz_dir')){
								that.showMenuDir(DOM(this).parent().get(), ev.pageX, ev.pageY);
								return;
							}
							// if shifykey is pressed, range select like windows
							if (ev.shiftKey) {
								var flag = false;
								DOM('ul#sz_file_dir_view li[class!=pm_denied]').foreach(function() {
									if (DOM(this).hasClass('active')) {
										flag = true;
									} else if (ev.currentTarget === this) {
										flag = false;
									}
									if (flag) {
										current.push(DOM(this).addClass('active'));
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
							if (!e.hasClass('sz_dir')) { return; }

							if (!e.hasClass('sz_dir')) { return; }
							if (e.parent(2).hasClass('pm_denied')) { // permission_denied
								return alert('ディレクトリを開く権限がありません。');
							}
							that.__setLoading();
							that.loadDirectory(e.parent().readAttr('dir_id'), e.getOne('div.sz_name').getHTML());
						}).event('mousedown', function(ev) {
							ev.stopPropagation();
							ev.preventDefault();
						});

		DOM('ul#sz_file_dir_view li[class!=pm_denied]').foreach(function() {
			new Module.dragDrop(this, {
					dropClass : 'sz_sort',
					returnDefault : false,
					handle : this,
					dropActiveClass : 'sz_drop_active',
					callback : function(drop) {
									if (drop !== null && this !== drop) {
										that.fileMove(DOM(this).first(), drop);
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
	 * ===================================================================================================
	 * deleteConfirm
	 * confirm delete?
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * ===================================================================================================
	 */
	this.deleteConfirm = function(ev) {
		ev.preventDefault();
		if (!confirm('選択したファイルを削除します。よろしいですか？')) { return; }
		var that = this;

		FL.ajax.get(ev.currentTarget.href, {
			async : true,
			error : function() { alert('画像の削除に失敗しました。');},
			success : function(resp) {
				if (resp.responseText === 'complete') {
					that.currentShowTarget.animate('fade', {
							speed : 20,
							afterHide : true,
							callback : function() {
								that.deleteDirCache([that.getCurrentDir()]);
							}
					});
					that.menu.hide();
					that.dirMenu.hide();
					that.currentShowTarget = null;
				}
			}
		});
	};

	/**
	 * ===================================================================================================
	 * createEditMenu
	 * create edit menu
	 * @access public
	 * @execute call
	 * @return void
	 * ===================================================================================================
	 */
	this.createEditMenu = function() {
		var html = ['<div class="sz_file_info">',
		              '<div id="sz_file_data"></div>',
		              '<p class="sz_file_control">',
		                '<a href="javascript:void(0)" class="sz_file_control_set">選択</a>',
		                '<a href="javascript:void(0)" class="sz_file_control_delete">削除</a>',
		               '</p>',
		            '</div>'
		            ];

		this.menu = DOM.create('div')
						.appendTo(window['IEFIX'] ? IEFIX.body : document.body)
						.addClass('sz_file_menu')
						.html(html.join(''))
						.addStyle('border-radius', '5px')
						.hide()
						.detect('a').get(1).event('click', this.deleteConfirm, this)
						.rollBack()
						.get(0).event('click', function(ev) {
							this.setImageCallback(ev.target);
						}, this)
						.rollBack()
						.rollBack()
						.event('click', function(ev) { ev.stopPropagation();});
	};

	/**
	 * ===================================================================================================
	 * createDirEditMenu
	 * create directory edit menu
	 * @access public
	 * @execute call
	 * @return void
	 * ===================================================================================================
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
							.detect('a').event('click', this.actionDirMenu, this)
							.rollBack();
	};

	/**
	 * ===================================================================================================
	 * __setLoading
	 * show/hide loading image
	 * @access private
	 * @execute call
	 * @param bool isHide
	 * @return void
	 * ===================================================================================================
	 */
	this.__setLoading = function(isHide) {
		this.loading[isHide ? 'hide' : 'show']();
	};

	/**
	 * ===================================================================================================
	 * multipleCallback
	 * multiple uploaded stack data execute
	 * @access public [to global]
	 * @execute call
	 * @return void
	 * ===================================================================================================
	 */
	this.multipleCallback = function() {
		var i = 0; st = that.multipleStack, len = st.length;

		for (i; i < len; i++) {
			that.__addNewData(st[i], true);
		}
		that.multipleStack = [];
		that.deleteDirCache[DOM('ul#sz_dir_tree_path a.current').get(0).parent().readAttr('dir_id')];
	};

	/**
	 * ===================================================================================================
	 * __setStackMultiple
	 * data to stack
	 * @access public [to global]
	 * @execute call
	 * @param Object data
	 * @return void
	 * ===================================================================================================
	 */
	this.__setStackMultiple = function(data) {
		that.multipleStack.push(data);
	};

	/**
	 * ===================================================================================================
	 * __addNewData
	 * create new file /directory
	 * @access private
	 * @execute call
	 * @param Object data
	 * @param bool delC
	 * @return void
	 * ===================================================================================================
	 */
	this.__addNewData = function(data, delC) {
		var html, li, img;

		if (data.is_icon) {
			img = '<p style="background : transparent url(' + FL.config.baseUrl() + 'images/icons/files/' + data.extension + '.png) center center no-repeat;">&nbsp;</p>';
		} else if (/gif$|jpe?g$|png$|bmp$|tiff$/.test(data.extension)) {
			img = '<p style="background : transparent url(' + FL.config.baseUrl() + 'files/thumbnail/' + data.crypt_name + '.' + data.extension + ') center center no-repeat;">&nbsp;</p>';
		} else {
			img = '<p style="background : transparent url(' + FL.config.baseUrl() + 'images/icons/files/file.png) center center no-repeat;">&nbsp;</p>';
		}

		html = [
		        '<div class="sz_file_view sz_sort_handle" filename="', data.file_name,'.', data.extension, '" file_id="', data.file_id, '">',
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
			that.deleteDirCache[DOM('ul#sz_dir_tree_path a.current').get(0).getHTML()];
		}
	};

	/**
	 * ===================================================================================================
	 * showMenuDir
	 * show file detail
	 * @access public
	 * @execute call
	 * @param xElement e
	 * @param Number x
	 * @param Number y
	 * @return void
	 * ===================================================================================================
	 */
	this.showMenuDir = function(e, x, y) {
		var id = e.getAttribute('file_id'), al = DOM('div.sz_file_menu a'), json, that = this,
			dataBox = this.menu.getOne('div#sz_file_data').html(''), img, html;

		this.currentShowTarget = DOM(e).parent();

		al.get(0).attr('rel', id);
		al.get(1).attr('href', FL.config.siteUrl() + 'dashboard/files/directory_view/delete_file/' + id + '/' + FL.config.item('sz_token'));

		// cache exists?
		if (fileCache[id]) {
			json = fileCache[id];
			img = DOM(e).getOne('p').readStyle('backgroundImage', true);
			// create file info
			html = [
			       '<table id="sz_file_info_table"><tbody>',
			         '<tr><td><img src="', img, '" alt="" /></td></tr>',
			         '<tr><td>', json.file_name, '.', json.extension, '</td></tr>',
			         '<tr><td>', (json.width > 0 && json.height > 0) ? json.width +'px&nbsp;x&nbsp;' + json.height + 'px&nbsp;' : '', json.size, '(KB)</td></tr>',
			        '</tbody></table>'
			        ];
			dataBox.html(html.join(''));
		} else {
			dataBox.addClass('sz_file_loading');

			FL.ajax.get('ajax/get_file/' + id + '/' + FL.config.item('sz_token'), {
				success : function(resp) {
					json = FL.json.parse(resp.responseText);
					img = DOM(e).getOne('p').readStyle('backgroundImage', true);
					// create file info
					html = [
					       '<table id="sz_file_info_table"><tbodyy>',
					         '<tr><td><img src="', img, '" alt="" /></td></tr>',
					         '<tr><td>', json.file_name, '.', json.extension, '</td></tr>',
					         '<tr><td>', (json.width > 0 && json.height > 0) ? json.width +'px&nbsp;x&nbsp;' + json.height + 'px&nbsp;' : '', json.size, '(KB)</td></tr>',
					       '</tbody></table>'
					        ];

					dataBox.html(html.join('')).removeClass('sz_file_loading');
					fileCache[id] = json;
				}
			});
		}

		that.menu.addStyle({top : y + 5 + 'px', left : x + 5 + 'px', display : 'block'});
		that.dirMenu.hide();
	};

	/**
	 * ===================================================================================================
	 * showDirMenu
	 * show directory menu
	 * @access public
	 * @execute call
	 * @param xElement e
	 * @param Number x
	 * @param Number y
	 * @return void
	 * ===================================================================================================
	 */
	this.showDirMenu = function(e, x, y) {
		var id = e.first().readAttr('dir_id'),
			dirName = e.getOne('div.sz_name').getHTML();

		this.currentShowTarget = e.parent();

		DOM('div.sz_dir_menu a').foreach(function() {
			this.setAttribute('rel', id + ' ' + dirName);
		});
		this.dirMenuTarget = e.first();
		this.dirMenu.addStyle({top : y + 5 + 'px', left : x + 5 + 'px', display : 'block'});
		this.menu.hide();
	};

	/**
	 * ===================================================================================================
	 * actionDirMenu
	 * controll clicked link process
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * ===================================================================================================
	 */
	this.actionDirMenu = function(ev) {
		var c = ev.target.className,
			data = ev.target.getAttribute('rel').split(/\s/); // data = [directroy_id, directory_name]

		switch(c) {
		case 'open_dir':
			this.__setLoading();
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
	 * ===================================================================================================
	 * setRename
	 * rename directory
	 * @access private
	 * @execute call
	 * @param Array data
	 * @return void
	 * ===================================================================================================
	 */
	this.setRename = function(data) {
		var pp = Helper.createDOMWindow('名前の変更', '', 400, 200), that = this, html;

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
			var ipt = DOM.id('re_name'),
				def = DOM.id('def_name'),
				target = DOM.id('target_dir');

			if (ipt.getValue() === '') {
				return alert('名前は空欄にできません。');
			} else if (ipt.getValue() === def.getValue()) {
				pp.hide();
				return;
			}

			FL.ajax.post('dashboard/files/directory_view/update_dirname/' + FL.config.item('sz_token'), {
				param : { new_name : ipt.getValue(), target : target.getValue()},
				error : function() { alert('名前の変更に失敗しました。'); },
				success : function(resp) {
					if (resp.responseText === 'complete') {
						that.dirMenuTarget.getOne('div.sz_name')
									.html(FL.ut.clean(ipt.getValue()))
									.rollBack()
									.animate('highLight');
						that.deleteDirCache([that.getCurrentDir()]);
					}
					pp.hide();
				}
			});
		}, this); // end click event handler

		pp.setOnClose(function() {
			DOM.id('do_rename').unevent('click');
		});
	};

	/**
	 * ===================================================================================================
	 * setDirAccessPermission
	 * setup directory access permission
	 * @access private
	 * @execute call
	 * @param Array data
	 * @return void
	 * ===================================================================================================
	 */
	this.setDirAccessPermission = function(data) {
		var pp = Helper.createDOMWindow('ディレクトリ権限の設定', '', 400, 400), that = this, html;

		FL.ajax.get('dashboard/files/directory_view/show_dir_permission/' + data[0] + '/' + FL.config.item('sz_token'), {
			success : function(resp) {
				pp.setContent(resp.responseText);

				DOM.id('do_permission').event('click', function(ev) {

					FL.ajax.post('dashboard/files/directory_view/update_permission/' + FL.config.item('sz_token'), {
						param : DOM.id('sz_dir_permissions').serialize(),
						error : function() { alert('名前の変更に失敗しました。'); },
						success : function(resp) {
							if (resp.responseText === 'complete') {
								that.deleteDirCache([that.getCurrentDir()]);
							}
							pp.hide();
						}
					});
				}, this);
				pp.setOnClose(function() {
					DOM.id('do_permission').unevent('click');
					that.loadDirectory(that.getCurrentDir(), '', true);
				});
			}
		});
	};

	/**
	 * ===================================================================================================
	 * cloneDir
	 * create clone directory
	 * @access private
	 * @execute call
	 * @param Array data
	 * @return void
	 * ===================================================================================================
	 */
	this.cloneDir = function(data) {
		var current = this.currentPath.getHTML(), cnt = 1;
			newPath = data[1] + '～コピー';

		while(this.__dirIsAlready(newPath)) {
			newPath += ++cnt;
		}
		this.cloneDirectory(newPath, data[0], current);
	};

	/**
	 * ===================================================================================================
	 * __dirIsAlready
	 * directory_name exists?
	 * @access private
	 * @execute call
	 * @param String path
	 * @return bool
	 * ===================================================================================================
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
	 * ===================================================================================================
	 * deleteDir
	 * delete directory recursive
	 * @access private
	 * @execute call
	 * @param Array data
	 * @return void
	 * ===================================================================================================
	 */
	this.deleteDir = function(data) {
		var uri, param, delCache, that = this;

		if (!confirm('移動されたファイルを削除します。よろしいですか？\nディレクトリを削除すると、その中身も全て削除されます。\n\n※この処理は元に戻せません！')) { return; }
		uri = 'dashboard/files/directory_view/delete_file_or_dir/' + FL.config.item('sz_token');
		param = {del_id : data[0], mode : 'dir'};
		delCache = [that.getCurrentDir()];

		this.__setLoading();

		FL.ajax.post(uri, {
			param : param,
			error : function() { alert('ディレクトリの削除に失敗しました。');that.__setLoading(true);},
			success : function(resp) {
				that.__setLoading(true);
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
	 * ===================================================================================================
	 * hideMenu
	 * hide menu
	 * @access public
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * ===================================================================================================
	 */
	this.hideMenu = function(ev) {
		this.menu.hide();
	};


	/**
	 * ===================================================================================================
	 * loadDirectory
	 * open and move directory
	 * @access public
	 * @execute call
	 * @param Number did
	 * @param String pathName
	 * @param bool append
	 * @return void
	 * ===================================================================================================
	 */
	this.loadDirectory = function (did, pathName, append) {
		var that = this, li, json;

		// cache exists?
		if (that.dirCache[did]) {
			json = that.dirCache[did];
			DOM.id('sz_file_dir_view').html(json.response);
			that.initDirEvent();
			if (!append) {
				li = DOM.create('li')
						.html('<div class="sort_tree" dir_id="' + json.did + '"><a href="javascript:void(0)" class="current">' + pathName + '</a></div>')
						.appendTo(DOM.id('sz_dir_tree_path'));
				that.currentPath.removeClass('current').parent(2).addClass('sz_sort');
				that.currentPath = li.first().first();
			}
			that.__setLoading(true);
			return;
		// else, get data
		} else {
			FL.ajax.post('dashboard/files/directory_view/ajax_get_dir_files/' + FL.config.item('sz_token'), {
				param : { path_name : pathName, did : did},
				error : function() { alert('error');that.__setLoading(true);},
				success : function(resp) {
					json = FL.json.parse(resp.responseText);
					DOM.id('sz_file_dir_view').html(json.response);
					that.initDirEvent();
					if (!append) {
						var li = DOM.create('li')
										.html('<div class="sort_tree" dir_id="' + json.did + '"><a href="javascript:void(0)" class="current">' + pathName + '</a></div>')
										.appendTo(DOM.id('sz_dir_tree_path'));
						that.currentPath.removeClass('current').parent(2).addClass('sz_sort');
						that.currentPath = li.first().first();
					}
					that.__setLoading(true);
					// set cache
					//that.dirCache[did] = {response : json.response, did : json.did};
				}
			});
		}
		current = [];
	};

	/**
	 * ===================================================================================================
	 * addDirectory
	 * add new directory
	 * @access public
	 * @execute call
	 * @param String path
	 * @param Number current
	 * @return void
	 * ===================================================================================================
	 */
	this.addDirectory = function(path, current) {
		var that = this, numReg = /^[0-9]+$/, name, html, li;

		FL.ajax.post('dashboard/files/directory_view/ajax_add_directory/' + FL.config.item('sz_token'), {
			param : {new_path : path, target : current},
			error : function() { alert('ディレクトリの追加に失敗しました。');},
			success : function(resp) {
				if (numReg.test(resp.responseText)) {
					name = FL.ut.clean(path);
					html = [
					        '<div class="sz_dir_view sz_sort_handle" dir_id="', resp.responseText, '">',
					          '<div class="sz_data sz_dir">',
					            '<img src="', FL.config.baseUrl(), 'images/icons/files/dir.png" alt="', path, '" />',
					            '<div class="sz_name">', path, '</div>',
					          '</div>',
					        '</div>'
					            ];
					li = DOM.create('li')
								.addClass('sz_dir')
								.addClass('sz_sort')
								.html(html.join(''))
								.appendTo(DOM.id('sz_file_dir_view'))
								.animate('highLight');
					that.setDirEvent(li);
					// delete cache all!
					that.deleteDirCacheAll();
					//that.deleteDirCache([that.getCurrentDir()]);
				}
			}
		});
	};

	/**
	 * ===================================================================================================
	 * cloneDirectory
	 * do clone directory
	 * @access public
	 * @execute call
	 * @param String path
	 * @param Number target
	 * @param Number current
	 * @return void
	 * ===================================================================================================
	 */
	this.cloneDirectory = function(path, target, current) {
		var that = this, numReg = /^[0-9]+$/, name, html, li;

		FL.ajax.post('dashboard/files/directory_view/ajax_clone_directory/' + FL.config.item('sz_token'), {
			param : { new_name : path, target : target},
			error : function() { alert('ディレクトリの追加に失敗しました。');},
			success : function(resp) {
				if (numReg.test(resp.responseText)) {
					name = that.ut.clean(path);
					html = [
					        '<div class="sz_dir_view sz_sort_handle" dir_id="', resp.responseText, '">',
					          '<div class="sz_data sz_dir">',
					            '<img src="', FL.config.baseUrl(), 'images/icons/files/dir.png" alt="', path, '" />',
					            '<div class="sz_name">', path, '</div>',
					          '</div>',
					        '</div>'
					        ];
					li = DOM.create('li')
								.addClass('sz_dir')
								.addClass('sz_sort')
								.html(html.join(''))
								.appendTo(DOM.id('sz_file_dir_view'))
								.animate('highLight');
					that.setDirEvent(li);
					// delete cache
					that.deleteDirCache([that.getCurrentDir()]);
				}
			}
		});
	};

	/**
	 * ===================================================================================================
	 * fileMove
	 * move file to other level directory
	 * @access public
	 * @execute call
	 * @param xElement from
	 * @param xElement to
	 * @return void
	 * ===================================================================================================
	 */
	this.fileMove = function(from, to) {
		var that = this, f = DOM(from), t = DOM(to), param, uri, delCache;

		if (t.readAttr('id') === 'sz_file_dir_trash') { // move to trash
			if (!confirm('移動されたファイルを削除します。よろしいですか？\nディレクトリを削除すると、その中身も全て削除されます。\n\n※この処理は元に戻せません！')) { return; }
			uri = 'dashboard/files/directory_view/delete_file_or_dir/' + FL.config.item('sz_token');
			if (f.parent().readAttr('dir_id')) {
				param = {del_id : f.readAttr('dir_id'), mode : 'dir'};
			} else {
				param = {del_id : f.readAttr('file_id'), mode : 'file'};
			}
			delCache = [that.getCurrentDir()];
		} else if (f.readAttr('dir_id')) { // move file is directory
			uri = 'dashboard/files/directory_view/move_dir_to_dir/' + FL.config.item('sz_token');
			param = { from : f.readAttr('dir_id'), to : t.first().readAttr('dir_id')};
			delCache = [that.getCurrentDir(), t.first().readAttr('dir_id')];
		} else { //move file is file
			uri = 'dashboard/files/directory_view/move_file_to_dir/' + FL.config.item('sz_token');
			param = { from : f.readAttr('file_id'), to : t.first().readAttr('dir_id')};
			delCache = [that.getCurrentDir(), t.first().readAttr('dir_id')];
		}

		this.__setLoading();

		FL.ajax.post(uri, {
			param : param,
			error : function() { alert('ファイルの変更処理に失敗しました。');that.__setLoading(true);},
			success : function(resp) {
				that.__setLoading(true);
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
	 * ===================================================================================================
	 * deleteDirCache
	 * delete cache data
	 * @access public
	 * @execute call
	 * @param Array arr
	 * @return void
	 * ===================================================================================================
	 */
	this.deleteDirCache = function(arr) {
		var i = 0; len = arr.length, cache = this.dirCache;

		for (; i < len; i++) {
			if (!cache[arr[i]]) { continue; }
			try { delete cache[arr[i]];}
			catch(e) { cache[arr[i]] = undefined;}
		}
	};
	
	this.deleteDirCacheAll = function() {
		this.dirCache = {};
	};

	/**
	 * ===================================================================================================
	 * getCurrentDir
	 * get current view directory id
	 * @access public
	 * @execute call
	 * @return Number direcotry_id
	 * ===================================================================================================
	 */
	this.getCurrentDir = function() {
		return DOM('ul#sz_dir_tree_path a.current').get(0).parent().readAttr('dir_id');
	};

	/**
	 * ===================================================================================================
	 * setImageCallback
	 * callback process switch work mode
	 * @access public
	 * @execute call
	 * @param xElement e
	 * @return void
	 * ===================================================================================================
	 */
	// image set callback
	this.setImageCallback = function(e) {
		var fid = e.getAttribute('rel'), json = fileCache[fid], filePath, html, e;

		if (mode === 'editor') { // target is editor xRange
			filePath = FL.config.baseUrl() + 'files/' + json.crypt_name + '.' + json.extension;
			if ( IMAGE_EXT.indexOf(json.extension) !== -1 ) {
				// insert image
				target.setImage(filePath);
			} else {
				// insert link
				target.insertHTML('<a href="' + FL.config.siteUrl() + 'action/download_file/' + json.file_id + '">' + json.file_name + '.' + json.extension + '</a>');
			}
		} else if (mode === 'image_edit') { // target id image_edit
			if (/gif|jp[e]?g|png|bmp/i.test(json.extension)) {
				location.href = FL.config.siteUrl() + 'dashboard/image/edit/' + fid;
			} else {
				return alert('画像ファイル以外は編集できません。');
			}
		} else if (mode === 'multiple') { //target is multiple callback
			e = DOM.create('tr');
			
			DOM.create('td')
				.html([
				       '<div class="sz_file_list_sortable" style="background:#fff url(' , FL.config.baseUrl(), 'files/thumbnail/', json.crypt_name,  '.', json.extension,  ') center center no-repeat;" title="', json.file_name + json.extension, '"></div>',
				       '<input type="hidden" name="' + target.readAttr('fname') + '[]" value="' + json.file_id + '" />'
				      ].join(''))
				.appendTo(e);
			
			DOM.create('td')
				.addClass('ipt')
				.html([
				       '<div class="sz_page_api_block">',
				       '<span class="sz_page_api_block_name">ページを選択</span>',
				       '<input type="hidden" name="page_ids[]" value="" />',
				       '<a href="javascript:void(0)" class="remove_selection">&nbsp;</a>',
				       '</div>'
				       ].join(''))
//				.html([
//				       '<input type="hidden" name="' + target.readAttr('fname') + '[]" value="' + json.file_id + '" />',
//				       '<input type="text" name="links[]" value="" />'
//				      ].join(''))
				.appendTo(e);
			
			DOM.create('td')
				.html([
				       '<p class="posrel"><a href="javascript:void(0)" class="sz_file_multi_delete"></a>',
				       '<a href="javascript:void(0)" class="sz_file_list_sort_order_next"></a>',
				       '<a href="javascript:void(0)" class="sz_file_list_sort_order_prev"></a></p>'
				       ].join(''))
				.appendTo(e);
			e.appendTo(DOM.id('sz_file_api_block_multiple_results').getOne('tbody'));
//			html = ['<div class="sz_file_list_sortable" style="background:#fff url(' , FL.config.baseUrl(), 'files/thumbnail/', json.crypt_name,  '.', json.extension,  ') center center no-repeat;" title="', json.file_name + json.extension, '"></div>',
//			        	'<a href="javascript:void(0)" class="sz_file_multi_delete"></a>',
//			        	'<input type="hidden" name="' + target.readAttr('fname') + '[]" value="' + json.file_id + '" />',
//			        	'<a href="javascript:void(0)" class="sz_file_list_sort_order_next"></a>',
//			        	'<a href="javascript:void(0)" class="sz_file_list_sort_order_prev"></a>',
//			        	'</li>'
//			        ];
//			DOM.create('li').html(html.join(''))
//				.appendTo(DOM.id('sz_file_api_block_multiple_results').first());
		} else { // target is block target
			if ( ! this.__isAllowedExtension(json.extension)) {
				return alert('選択されたファイルは設置できない拡張子です。');
			}
			html = [
			        (imgDisplayExt[json.extension] ?'<img src="' + FL.config.baseUrl() + 'files/thumbnail/' + json.crypt_name + '.' + json.extension + '" alt="' + json.file_name + '" />'
			        	: '<img src="' + FL.config.baseUrl() + 'images/icons/files/' + json.extension + '.png" />'),
		            '<span class="sz_api_selected_name">', json.file_name + '.' + json.extension, '</span>'
		            ];
			target.first().html(html.join(''));
			target.getOne('input').setValue(json.file_id);
		}
		if (FL.ut.isFunction(that.callback)) {
			that.callback(json);
			that.callback = null; // callback works one time only.
		}
		PP.setOnClose(function() { __removeAllHandler();});
		PP.hide();
		PP = null;
	};
	
	this.__isAllowedExtension = function(ext) {
		if ( ! document.getElementById('sz_allowed_extension')
				|| document.getElementById('sz_allowed_extension').innerHTML === '') {
			return true;
		}
		
		var exts = DOM.id('sz_allowed_extension').getHTML();
		
		return (exts.indexOf(ext) === -1) ? false : true;
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
		if(ev.target.id !== 'sz_file_dir_view_wrapper') { return;}
		this.dragArea.addStyle({top : ev.pageY + 'px', left : ev.pageX + 'px'}).appendTo();
		this.dragAreaInitPoint = { x : ev.pageX, y : ev.pageY };
		this.dragSelectTargetElements = DOM('ul#sz_file_dir_view li[class!=pm_denied]');
		FL.event.set(document, 'mousemove', this.__draggableMove, this);
		FL.event.set(document, 'mouseup', this.__draggableMoveEnd, this);
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
			if (FL.ut.inRectPiece(this, that.dragArea)) {
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
		FL.event.remove(document, 'mousemove', this.__draggableMove);
		this.dragArea.addStyle({
			width : '0px',
			height : '0px'
		}).remove();
		current = [];
		this.dragSelectTargetElements.foreach(function() {
			if (DOM(this).hasClass('active')) {
				current.push(DOM(this));
			}
		});
		if (DOM.id('sz_file_archive')) {
			DOM.id('sz_file_archive')[current.length > 1 ? 'show' : 'hide']();
		}
	};

	// move to global function
	FL.alias('addStack', this.__setStackMultiple);
	FL.alias('addNewData', this.__addNewData);
	
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
			dat.append('directory_id', that.getCurrentDir());
			
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