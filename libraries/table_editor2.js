ClassExtend('Library', function table_editor2() {
	
	// get base instance on this scope
	var FL = getInstance(),
		DOM = FL.DOM;
	
	// private vars
	var editor,
		status,
		data,
		brRegex = /<br\s?\/?>/g,
		defValue = (FL.ua.is('I6|I7')) ? '&nbsp;' : '';
		
	
	this.init = function(e) {
		if ( ! e ) {
			throw Error('Table editor can\'t startup: invalid argument on init()');
			return;
		}
		editor = new TableEditor(e);
		status = new TableEditorStatus(e);
		data = DOM.create('textarea')
			.attr('name', 'body')
			.appendTo(e, 'after')
			.hide();
	};
	
	this.buildTableHTML = function() {
		return editor.getData();
	};
	
	
	// Inner classes ============================================================
	
	// main, Table editor
	function TableEditor(area) {
		this.area = DOM(area);
		this.current = {
			col : null,
			row : null,
			cell : null,
			ipt : null
		};
		this.__currentBorder = '#cccccc';
		
		// edit area is Empty?
		if ( this.area.detect('table').length === 0) {
			this.__createInitTable();
		} else {
			this.__setUpEditTable();
		}
		this.__construct();
	}
	
	TableEditor.prototype = {
		__createInitTable : function() {
			var initTable = [
			                   '<table style="width:100%;border-collapse:separate;border:solid 1px #ccc">',
			                     '<tbody>',
			                       '<tr>',
			                         '<td class="default">&nbsp;</td>',
			                         '<td class="default">&nbsp;</td>',
			                         '<td class="control">',
			                           '<a href="javascript:void(0)" class="up">上</a>',
			                           '<a href="javascript:void(0)" class="down">下</a>',
			                         '</td>',
			                       '</tr>',
			                       '<tr>',
			                         '<td class="default">&nbsp;</td>',
			                         '<td class="default">&nbsp;</td>',
			                         '<td class="control">',
			                           '<a href="javascript:void(0)" class="up">上</a>',
			                           '<a href="javascript:void(0)" class="down">下</a>',
			                         '</td>',
			                       '</tr>',
			                     '</tbody>',
			                   '</table>'
			                 ];
			
			this.area.html(initTable.join(''));
		},
		__setUpEditTable : function() {
			var tbl = this.area.getOne('table'),
				html = [
				        '<a href="javascript:void(0)" class="up">上</a>',
				        '<a href="javascript:void(0)" class="down">下</a>'
				        ].join('');
			
			tbl.detect('tr')
				.foreach(function() {
					DOM.create('td')
						.addClass('control')
						.html(html)
						.appendTo(this);
				});
			// kill default focused
			tbl.detect('td.focus')
				.foreach(function() {
					DOM(this).removeClass('focus');
				});
		},
		
		__construct : function() {
			this.table = this.area.getOne('table');
			this.colCount = this.table.getOne('tr').children().length;
			this.rowCount = this.table.detect('tr').length;
			// box event handling
			this.__initTableEvent();
		},
		
		__initTableEvent : function() {
			var that = this;
			
			this.table.event('click', function(ev) {
				ev.stopPropagation();
				var e = ev.target;
				
				switch ( e.tagName ) {
				case 'TD':
				case 'TH':
					that.setCurrent(e);
					status.setStatus(e);
					status.setFocus();
					break;
				case 'A': // a up/down event
					ev.preventDefault();
					ev.stopPropagation();
					that.moveRow(e);
					break;
				}
			});
			
			this.table.event('keyup', function(ev) {
				if ( that.current.cell ) {
					status.cellValue.setValue(ev.target.value);
				}
			});
		},
		
		setCurrent : function(td) {
			if ( this.current.cell && this.current.cell.getHTML() === '' ) {
				this.current.cell.html(defValue);
			}
			this.current.cell && this.current.cell.removeClass('focus');
			this.current.cell = DOM(td).addClass('focus');
		},
		
		updateAttr : function(key, value) {
			if ( ! this.current.cell ) {
				return;
			}
//			var e = this.current.cell;
//				att = e.readAttr('atts') ? FL.json.parse(e.readAttr('atts')) : {};
//				
//			att[key] = value;
//			e.attr('atts', FL.json.stringify(att));
			this.current.cell.addStyle(key, value);
		},
		
		getData : function() {
			this.table.detect('td.control').foreach(function() {
				DOM(this).remove();
			});
			
			return this.area.getHTML();
		},
		
		moveCell : function(isPrev) {
			if ( ! this.current.cell ) {
				return;
			}
			var e = this.current.cell,
				p = e.parent(),
				that = this,
				t;
			
			// previous case
			if ( isPrev ) {
				// curent is first col?
				if ( e.isFirst() ) {
					// previous row exists?
					if ( p.prev() ) {
						t = p.prev().last().prev();
					} else {
						// move last cell
						t = this.table.first().last().last().prev();
					}
				} else {
					// simply previous cell
					t = this.current.cell.prev();
				}
			} else { // next case
				// current is last col?
				if ( e.isLast() || e.next().hasClass('control') ) {
					// next row exists?
					if ( p.next() ) {
						t = p.next().first();
					} else {
						// move first cell
						t = this.table.first().first().first();
					}
				} else {
					// simply next cell
					t = this.current.cell.next();
				}
			}
			
			// target cell exists?
			if ( t ) {
				// for IE
				if ( t.getHTML() === '' ) {
					t.html(defValue);
				}
//				setTimeout(function() {
//					that.setCurrent(t);
//				}, 100);
				this.setCurrent(t);
				status.setStatus(t.get());
				status.setFocus();
			}
		},
		
		moveRow : function(a) {
			var e = DOM(a),
				up = e.hasClass('up'),
				row = e.parent(2);
			
			if ( row.parent().detect('tr').length === 1 ) {
				return;
			} 
			
			if ( up ) { // case upper
				// Is target row first?
				if ( ! row.prev() ) {
					return;
				}
				row.appendTo(row.prev(), 'before');
			} else { // case lower
				// Is target row last?
				if ( ! row.next() ) {
					return;
				}
				row.appendTo(row.next(), 'after');
			}
		},
		
		__cellControl : function(ev) {
			ev.stopPropagation();
			if ( ev.target.tagName !== 'A' ) {
				return;
			}
			switch ( ev.target.className ) {
			case 'col_left':
				this.__addColumn('left');
				break;
			case 'col_right':
				this.__addColumn('right');
				break;
			case 'row_upper':
				this.__addRow('upper');
				break;
			case 'row_lower':
				this.__addRow('lower');
				break;
			case 'col_delete':
				this.__deleteColumn();
				break;
			case 'row_delete':
				this.__deleteRow();
				break;
			default:
				break;
			}
		},
		
		// add column
		__addColumn : function(direction) {
			var pos = 0,
				e,
				tr,
				tds,
				mr = Math.round;
				 
			
			if ( this.current.cell ) {
				e = this.current.cell.get();
				this.current.cell
								.parent().children()
								.foreach(function(num) {
									if (this === e) {
										pos = num;
										return false;
									}
								});
			}
			
			tr = this.table
					.detect('tr')
					.foreach(function() {
						DOM.create('td')
							.addClass('default')
						//	.addStyle('border', 'solid 1px ' + editor.__currentBorder)
							.appendTo(DOM(this).detect('td').get(pos), ( direction === 'left' ) ? 'before' : 'after')
							.html('&nbsp;')
					})
					.get(0);
			
			// Recalculate td width
			tds = tr.detect('td, th');
			tds.foreach(function() {
				this.style.width = mr(100 / (tds.length - 1)) + '%';
			});
		},
		
		// add row
		__addRow : function(direction) {
			var tr = DOM.create('tr'),
				target,
				cellCount = this.table.getOne('tr').detect('td, th').length - 1,
				ind = -1;
			
			if ( this.current.cell ) {
				target = this.current.cell.parent();
			} else {
				target = (direction === 'upper') ? this.table.getOne('tr')
													: this.table.detect('tr').last();
			}
			
			tr.appendTo(target, (direction === 'upper') ? 'before' : 'after');
			
			// append td cells
			while ( ++ind < cellCount ) {
				DOM.create('td')
					.appendTo(tr)
					.addClass('default')
					.html('&nbsp;');
					//.addStyle('border', 'solid 1px '+ editor.__currentBorder);
			}
			DOM.create('td')
				.html('<a href="javascript:void(0)" class="up">上</a><a href="javascript:void(0)" class="down">下</a>')
				.addClass('control')
				.appendTo(tr);
		},
		
		// delete column
		__deleteColumn : function() {
			var pos = -1,
			e,
			tr,
			len,
			tds;
			 
		
			if ( this.current.cell ) {
				e = this.current.cell.get();
				len = this.current.cell
								.parent().children()
								.foreach(function(num) {
									if (this === e) {
										pos = num;
										return false;
									}
								})
								.length;
				if ( len === 2 ) {
					return alert('これ以上は削除できません。');
				}
			}
			
			if ( pos < 0 ) {
				return;
			}
			
			if ( ! confirm('列を削除します。よろしいですか？') ) {
				return;
			}
			
			tr = this.table
					.detect('tr')
					.foreach(function() {
						DOM(this).detect('td, th')
									.get(pos)
									.remove();
					})
					.get(0);
			
			this.current.cell = null;
			
			// Recalculate td width
			tds = tr.detect('td, th');
			tds.foreach(function() {
				this.style.width = mr(100 / (tds.length - 1)) + '%';
			});
		},
		
		// delete row
		__deleteRow : function() {
			if ( ! this.current.cell ) {
				return;
			}
			var e = this.current.cell.parent();
			
			if ( e.parent().detect('tr').length === 1 ) {
				return alert('これ以上は削除できません。');
			}
			
			if ( ! confirm('行を削除します。よろしいですか？') ) {
				return;
			}
			e.remove();
			this.current.cell = null;
		}
	};
	
	// sub editor cell statuses
	function TableEditorStatus(area) {
		this.area = DOM(area);
		
		this.__setUpStatusTable();
		this.__construct();
	}
	
	TableEditorStatus.prototype = {
		__setUpStatusTable : function() {
			var wrapper = DOM.create('div', {id : 'table-editor-status'}),
				status = [
				          '<ul class="clearfix">',
				            '<li><a href="javascript:void(0)" class="active" rel="0">セル情報</a></li>',
				            '<li><a href="javascript:void(0)" rel="1">テーブル設定</a></li>',
				          '</ul>',
				          '<div class="status_content">',
				          '<table style="zoom:1">',
				            '<tbody>',
				            '<tr>',
				              '<td colspan="3" class="cell_control">',
				              '<a href="javascript:void(0)" class="col_left">列を左に追加</a>',
				              '<a href="javascript:void(0)" class="col_right">列を右に追加</a>',
				              '<a href="javascript:void(0)" class="row_upper">行を上に追加</a>',
				              '<a href="javascript:void(0)" class="row_lower">行を下に追加</a>|',
				              '<a href="javascript:void(0)" class="col_delete">列を削除</a>',
				              '<a href="javascript:void(0)" class="row_delete">行を削除</a>',
				              '</td>',
				            '</tr>',
				              '<tr>',
				                '<td>タグ書式：',
				                  '<select name="tag_name">',
				                    '<option value="td" selected="selected">td</option>',
				                    '<option value="th">th</option>',
				                  '</select>',
				                '</td>',
				                '<td class="forcolor">文字色：',
				                  '<input type="text" name="forcolor" value="#000000" />',
				                '</td>',
				                '<td class="bgcolor">背景色：',
				                  '<input type="text" name="bgcolor" value="#ffffff" />',
				                '</td>',
				              '</tr>',
				              '<tr>',
				                '<td colspan="3" class="cell_v">テキスト：<br />',
				                  '<textarea name="cell_value" value="" id="cv"></textarea>',
				                '</td>',
				              '</tr>',
				            '</tbody>',
				          '</table>',
				          '</div>',
				          '<div class="status_content" style="display:none">',
				          '<table class="table_info">',
				            '<tbody>',
				              '<tr>',
				                '<td colspan="2">class属性：<input type="text" name="table_class" /></td>',
				                '<td class="table_border_color">枠線色：<input type="text" name="table_border_color" value="#cccccc" /></td>',
				              '</tr>',
				              '<tr>',
				                '<td colspan="3">',
				                '表の横幅：<input type="text" name="table_width" value="100" class="number" />',
				                  '<select name="width_unit">',
				                    '<option value="%">%</option>',
				                    '<option value="px">px</option>',
				                  '</select>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
				                'セルの間隔：<input type="text" name="table_cellspacing" value="0" class="number" />&nbsp;&nbsp;&nbsp;&nbsp;',
				                'セルの余白：<input type="text" name="table_cellpadding" value="0" class="number" />',
				                '</td>',
				              '</tr>',
				            '</tbody>',
				          '</table>',
				          '</div>'
				          ];
			wrapper.html(status.join(''));
			this.box = wrapper.appendTo(this.area, 'after');
		},
		__construct : function() {
			var fp, bp, tb;
			
			this.tagField = this.box.getOne('select');
			this.forColor = this.tagField.parent().next().getOne('input');
			this.bgColor = this.tagField.parent().next().next().getOne('input');
			this.tableBorder = this.box.getOne('td.table_border_color').first();
			this.cellValue = this.box.getOne('textarea');
			
			this.tabChanger();
			
			this.cellValue.event('keyup', function(ev) {
				ev.stopPropagation();
				var v = this.value;
				
				if ( editor.current.cell ) {
					v = (v === '') ? defValue : FL.ut.nl2br(v);
					editor.current.cell.html(v);
				}
			});
			FL.event.set(this.box, 'keydown', function(ev) {
				if ( ! editor.current.cell ) {
					return;
				}
				if ( ev.keyCode == 9 ) { // tab key pressed
					ev.preventDefault();
					ev.stopPropagation();
					// move prev/next cell
			//		if ( !FL.ua.is('I6|I7') ) {
						editor.moveCell(!!ev.shiftKey);
			//		}
					//editor.moveCell(!!ev.shiftKey);
				}
			});
			this.tagField.event('change', function(ev) {
				if ( editor.current.cell ) {
					this.replaceTag(ev.target.value);
				}
			}, this);
			
			// create colorPicker
			// for forcolor
			fp = new ColorPicker('forColor');
			fp.get().addStyle({
				top : '-155px',
				left : '185px'
			});
			bp = new ColorPicker('bgColor');
			bp.get().addStyle({
				top : '-155px',
				left : '465px'
			});
			tb = new ColorPicker('tableBorder');
			tb.get().addStyle({
				top : '-155px',
				left : '365px'
			});
			this.box.append(tb.get());
			this.box.append(fp.get());
			this.box.append(bp.get());
			
			// set picker event
			this.forColor.event('click', function(ev) {
				ev.stopPropagation();
				fp.get().show();
				bp.get().hide();
			});
			this.bgColor.event('click', function(ev) {
				ev.stopPropagation();
				bp.get().show();
				fp.get().hide();
			});
			this.tableBorder.event('click', function(ev) {
				ev.stopPropagation();
				tb.get().show();
			});
			FL.event.set(document, 'click', function(ev) {
				fp.get().hide();
				bp.get().hide();
				tb.get().hide();
			});

			// cell control event
			this.box.getOne('td.cell_control')
					.event('click', editor.__cellControl, editor);
			
			// table setting handle
			this.box.detect('table.table_info td input').foreach(function(num) {
				DOM(this).event('change', function(ev) {
					var m,
						t = editor.table.get();
					
					switch ( num ) {
					case 0 :
						t.className = this.value;
						break;
					case 2 :
						m = DOM(this).next().getValue();
						t.style.width = (this.value === '' ) ? '100%' : this.value + m;
						break;
					case 3 :
						t.style.borderSpacing = this.value + 'px';
						break;
					case 4 :
						t.cellPadding = this.value;
						break;
					default : break;
					}
				});
			});
			this.box.getOne('table.table_info select').event('change', function() {
				var v = DOM(this).prev().getValue();
				
				editor.table.addStyle('width', (v === '') ? '100%' : v + this.value);
			});
			
		},
		
		tabChanger : function() {
			var that = this;
			
			this.tab = this.box.detect('ul.clearfix a'),
			this.boxes = this.box.detect('div.status_content'),
				
			this.currentTab = this.tab.get(0),
			this.currentBox = this.boxes.get(0);
			
			this.tab.event('click', function(ev) {
				ev.preventDefault();
				that.currentTab.removeClass('active');
				that.currentBox.hide();
				
				that.currentTab = DOM(this).addClass('active');
				that.currentBox = that.boxes.get(this.rel).show();
			});
		},
		
		// force change tab
		__setTab : function (num) {
			this.currentTab.removeClass('active');
			this.currentBox.hide();
			
			this.currentTab = this.tab.get(num).addClass('active');
			this.currentBox = this.boxes.get(num).show();
		},
		
		replaceTag : function(v) {
			var e = DOM.create(v),
				c = editor.current.cell,
				html = c.getHTML().replace(brRegex, '\n');
			
			e.appendTo(c, 'before');
			e.get().className = c.get().className;
			c.remove();
			e.html(html);
			editor.current.cell = e;
		},
		
		setFocus : function() {
			this.__setTab(0);
			this.cellValue.method('focus');
		},
		
		// handle message by editor Object
		setStatus : function(e) {
			this.tagField.setValue(e.tagName.toLowerCase());
			if ( e.innerHTML === '&nbsp;' ) {
				this.cellValue.setValue('');
			} else {
				this.cellValue.setValue(e.innerHTML.replace(brRegex, '\n'));
			}
			this.forColor.setValue(FL.ut.rgbToHex(e.style.color || '#000000'));
			this.bgColor.setValue(FL.ut.rgbToHex(e.style.backgroundColor || '#ffffff'));
		},
		
		setForColor : function(color) {
			this.forColor.setValue(color);
			editor.updateAttr('color', color);
		},
		
		setBGColor : function(color) {
			this.bgColor.setValue(color);
			editor.updateAttr('backgroundColor', color);
		},
		
		setTableBorder : function(color) {
			this.tableBorder.setValue(color);
			editor.table.addStyle('border', 'solid 1px ' + color);
			editor.table.detect('td, th').foreach(function() {
				if ( this.className !== 'control' ) {
					this.style.border = 'solid 1px ' + color;
				}
			});
			editor.__currentBorder = color;
		}
	};
	
	// =========== color picker ==============================================
	function ColorPicker(type) {
		this.type = type;
		this.showFlag = false;
		this.picker = DOM.create('div', {'class' : 'table_editor_colorpicker'});
		var colors = [
	              '<table class="colorpicker_base_grays">',
	              '<tbody>',
	              '<tr></tr>',
	              '</tbody>',
	              '</table>',
	              '<table class="colorpicker_base_vivids">',
	              '<tbody>',
	              '<tr></tr>',
	              '</tbody>',
	              '</table>',
	              '<table class="colorpicker_others">',
	              '<tbody>',
	              '</tbody>',
	              '</table>'
		            ];
		
		this.picker.html(colors.join('\n'));
		this.createColors();
	};

	ColorPicker.prototype = {
		createColors : function () {
			var grays = ['000000', '444444', '666666', '999999', 'cccccc', 'eeeeee', 'f3f3f3', 'ffffff'],
				vivids = ['ff0000', 'ff9900', 'ffff00', '00ff00', '00ffff', '0000ff', '9900ff', 'ff00ff'],
				others = [
			              ['f4cccc', 'fce5cd', 'fff2cc', 'd9ead3', 'd0e0e3', 'cfe2f3', 'd9d2e9', 'ead1dc'],
			              ['ea9999', 'f9cb9c', 'ffe599', 'b6d7a8', 'a2c4c9', '9fc5e8', 'b4a7d6', 'd5a6bb'],
			              ['e06666', 'f6b26b', 'ffd966', '93c47d', '76a5af', '6fa8dc', '8e7cc3', 'c27ba0'],
			              ['cc0000', 'e69138', 'f1c232', '6aa83f', '45818e', '3d85c6', '674ea7', 'a64d79'],
			              ['990000', 'b45f06', 'bf9000', '38761d', '134f5c', '0b5394', '351c75', '741b47'],
			              ['660000', '783f04', '7f6000', '274e13', '0c343d', '073763', '20124d', '4c1130']
			             ],
			i = 0,
			j = 0,
			k = 0,
			m = 0,
			glen = grays.length,
			vlen = vivids.length,
			olen = others.length,
			olen2,
			tr,
			g = this.picker.detect('tr').get(0),
			v = this.picker.detect('tr').get(1);
			
			for (i; i < glen; i++) {
				DOM.create('td')
					.append('<div style="background-color:#' + grays[i] + '" title="#' + grays[i] + '" unselectable="on">&nbsp;</div>')
					.appendTo(g);
			}
			for (j; j < vlen; j++) {
				DOM.create('td')
					.append('<div style="background-color:#' + vivids[j] + '" title="#' + vivids[j] + '" unselectable="on"></div>')
					.appendTo(v);
			}

			for (k; k < olen; k++) {
				tr = DOM.create('tr');
				for (m = 0, olen2 = others[k].length; m < olen2; m++) {
					DOM.create('td')
						.append('<div style="background-color:#' + others[k][m] + '" title="#' + others[k][m] + '" unselectable="on"></div>')
						.appendTo(tr);
				}
				this.picker.getOne('table.colorpicker_others tbody').append(tr);
			}
			this.picker.event('mouseover', this.setTarget, this)
						.event('mouseout', this.removeTarget, this)
						.event('click', this.setColor, this);
		},
		setTarget : function (ev) {
			var e = ev.target;
			
			if ( e.tagName === 'DIV'
					&& e.parentNode.tagName === 'TD') {
				DOM(ev.target)
					.addStyle({
						border : 'solid 1px #fff',
						width : '14px',
						height : '14px'
					});
			}
		},
		removeTarget : function (ev) {
			var e = ev.target;
			
			if ( e.tagName === 'DIV'
					&& e.parentNode.tagName === 'TD') {
				DOM(ev.target)
					.addStyle({
						border : 'none',
						width : '16px',
						height : '16px'
					});
			}
		},
		setColor : function (ev) {
			ev.stopPropagation();
			var e = ev.target;

			if ( e.tagName === 'DIV'
					&& e.parentNode.tagName === 'TD') {
				ev.stopPropagation();
				if ( this.type === 'forColor' ) {
					status.setForColor(e.title);
				} else if ( this.type === 'bgColor' ) {
					status.setBGColor(e.title);
				} else if ( this.type === 'tableBorder' ) {
					status.setTableBorder(e.title);
				}
				this.picker.hide();
			}
		},
		show : function () {
			this.picker.show();
			this.showFlag = true;
		},
		hide : function () {
			this.picker.hide();
			this.showFlag = false;
		},
		toggle : function () {
			this[(this.showFlag === true) ? 'hide' : 'show']();
		},
		get : function () {
			return this.picker;
		},
		isHidden : function () {
			return !this.showFlag;
		}
	};
});
