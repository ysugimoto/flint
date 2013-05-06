ClassExtend('Controller', function AttributesController() {
	
	this.construct = function() {
		this.load.ajax();
	};
	
	this.index = function() {
		var baseNode = DOM.id('att_table'),
			ups = baseNode.detect('a.up'),
			downs = baseNode.detect('a.down'),
			that = this;
		
		ups.event('click', this.__moveDisplayOrderUp, this);
		downs.event('click', this.__moveDisplayOrderDown, this);
		
		// nouse event
		DOM('a.view').event('click', this.__setNoUseAttribute, this);
		// delete completely
		DOM('a.delete').event('click', this.__deleteAttribute, this)
						.foreach(function() {
							this.href += '/' + that.config.item('sz_token');
						});
	};
	
	this.edit = function() {
		var trs = DOM.id('att_form_table').detect('tr'),
			type = trs.get(2),
			colRows = trs.get(3),
			options = trs.get(4),
			validate = trs.get(5),
			inputable = trs.get(0).getOne('input'),
			typeSelect = type.getOne('select'),
			addOpt = DOM.id('add_options'),
			optBase = DOM.id('option_base');
		
		changeInputable(inputable.get().checked);
		changeField(typeSelect.getValue());
		
		// inputable toggle
		inputable.event('click', function() {
			changeInputable(this.checked);
		});
		
		// inputType changed
		typeSelect.event('change', function() {
			changeField(this.value);
		});
		
		// add Option
		addOpt.event('click', addOptionField, this);
		
		// option delete
		optBase.event('click', deleteOption, this);
		
		DOM.id('att_form').event('submit', function(ev) {
			if ( !confirm('追加項目を登録します。よろしいですか？') ) {
				ev.preventDefault();
			}
		});
		
		
		
		// inline Event handlers =====================================
		function changeInputable(flag) {
			var m = (flag) ? 'removeClass' :'addClass';
			
			type[m]('init_hide');
			options[m]('init_hide');
			validate[m]('init_hide');
		}
		
		function changeField(v) {
			var ac = 'addClass',
				rc = 'removeClass',
				ih = 'init_hide';
			
			switch (v) {
			case 'text':
			case 'pref':
				options[ac](ih);
				colRows[ac](ih);
				break;
			case 'textarea':
				options[ac](ih);
				colRows[rc](ih);
				break;
			case 'selectbox':
			case 'radio':
			case 'checkbox':
				options[rc](ih);
				colRows[ac](ih);
				break;
			}
		}
		
		function addOptionField(ev) {
			ev.stopPropagation();
			var p = DOM.create('p').addClass('opts'),
				html;
			
			html = [
			          'オプション名：<input type="text" name="options[]" value="" id="options" />',
			        '&nbsp;<a href="javascript:void(0)" class="att_option">',
	               '<img src="', this.config.baseUrl(), 'images/delete.png" alt="" />&nbsp;削除',
	               '</a>'
			        ];
			p.html(html.join(''));
			p.appendTo(optBase.last(), 'after');
		}
		
		function deleteOption(ev) {
			var ps = optBase.detect('p.opts'),
				p;
			
			if ( ev.target.className === 'att_option'
					|| ev.target.parentNode.className === 'att_option') {
				
				if ( ps.length === 1 ) {
					return alert('これ以上は削除できません。');
				}
				
				p = ev.target;
				while ( p.className !== 'opts' || p === document.body ) {
					p = p.parentNode;
				}
				
				DOM(p).remove();
			}
		}
	};
	
	this.__moveDisplayOrderUp = function(ev) {
		var tr = DOM(ev.target).parent(3),
			from = tr.readAttr('id').replace('order_', ''),
			ttr = tr.prev(),
			to;
		
		if ( ttr.hasClass('head') ) {
			return;
		}
		to = ttr.readAttr('id').replace('order_', '');
		
		this.ajax.post('dashboard/members/attributes/change_display_order/' + this.config.item('sz_token'), {
			param : {from : from, to : to},
			success : function(resp) {
				if ( resp.responseText === 'success' ) {
					tr.appendTo(ttr, 'before');
				} else {
					throw Error('Error:' + resp.responseText);
				}
			}
		});
	};
	
	this.__moveDisplayOrderDown = function(ev) {
		var tr = DOM(ev.target).parent(3),
			from = tr.readAttr('id').replace('order_', ''),
			ttr = tr.next(),
			to;

		
		if ( ! ttr ) {
			return;
		}
		
		to = ttr.readAttr('id').replace('order_', '');
		
		this.ajax.post('dashboard/members/attributes/change_display_order/' + this.config.item('sz_token'), {
			param : {from : from, to : to},
			success : function(resp) {
				if ( resp.responseText === 'success' ) {
					tr.appendTo(ttr, 'after');
				} else {
					throw Error('Error:' + resp.responseText);
				}
			}
		});
	};
	
	this.__setNoUseAttribute = function(ev) {
		ev.preventDefault();
		
		var that = this,
			uri = ev.target.href,
			e = ev.target;
		
		if ( uri.indexOf('nouse') !== -1
				&& ! confirm('項目を一時的に未使用にします。よろしいですか？'
								+ '\n（データは削除されませんが、ユーザーの項目には表示されなくなります）') ) {
			return;
		} else if ( uri.indexOf('douse') !== -1
				&& ! confirm('項目を使用状態にします。よろしいですか？'
								+ '\n（ユーザーの項目に表示されるようになります')) {
			return;
		}
		
		this.ajax.get(uri + '/' + this.config.item('sz_token'), {
			error : function() { alert('通信に失敗しました。') },
			success: function(resp) {
				if ( resp.responseText === 'success' ) {
					if (uri.indexOf('nouse') !== -1) {
						e.href = uri.replace('nouse', 'douse');
						e.innerHTML = '使用する';
						DOM(e).parent(2)
							.first()
							.last()
							.visible();
								
					} else {
						e.href = uri.replace('douse', 'nouse');
						e.innerHTML = '未使用にする';
						DOM(e).parent(2)
							.first()
							.last()
							.invisible();
					}
				} else {
					alert('処理に失敗しました：' + resp.responseText);
				}
			}
		});
	};
	
	this.__deleteAttribute = function(ev) {
		if ( ! confirm('選択した項目を削除します。よろしいですか？\n（データベースから完全に削除されます。ここのユーザーが入力したデータも削除されます）')) {
			ev.preventDefault();
		}
	};
});