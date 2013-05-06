/**
 * Flint Form UI Library
 * 
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * @create 2011/05/11
 */

ClassExtend('Library', function form_ui() {
	
	// create Base Instance on this scope and extract
	var FL = getInstance(),
		DOM = FL.DOM,
		Animation = FL.Animation;
		
		// Form parts Maps
		inputMap = {
			input : 'input',
			select : 'select',
			textarea : 'textarea'
		},
		
		// default Stacks
		defaults = {},
		resizes = {},
		
		// this scope
		that = this;
				
		// export publics
		this.defaultColor = '#999999';
		this.defaultCheck = defaultCheck;
		this.defaultSelect = defaultSelect;
		this.defaultValue = defaultValue;
		//this.autoFix = autoFix;
		this.selectToTable = selectToTable;
		
	// private
	function __defaultSet(elm, value, name) {
		if ( name in defaults ) {
			return;
		}
		var e = elm,
			val = value,
			v = e.getValue(),
			c = e.readStyle('color'),
			def = that.defaultColor;
			
		defaults[name] = [val, c];
		if ( v === '' || c == val ) {
			e.addStyle('color', def)
				.setValue(val);
		}
		
		e.event('focus', function(ev) {
			ev.stopPropagation();
			if ( this.value == val ) {
				this.value = '';
				this.style.color = c; 
			}
		})
		.event('blur', function(ev) {
			ev.stopPropagation();
			if ( this.value === '' ) {
				this.value = val;
				this.style.color = def;
			}
		});
	}
	
	function defaultCheck (targets, index) {
		if ( ! targets ) {
			return false;
		}
		var ind = index || 0,
			regex = /radio|checkbox/,
			elm = DOM(targets).get(index) || null;
		
		if ( elm && elm.tag === 'input' && regex.test(elm.get().type) ) {
			elm.prop('checked', true);
			return true;
		}
		return false;
	}
	
	function defaultSelect(target, index) {
		if ( !target || DOM(target).tag !== 'select' ) {
			return false;
		}
		var ind = index || 0;
		
		DOM(target).detect('option')
					.foreach(function(num) {
						if ( num === ind ) {
							this.selected = true;
							return false;
						}
					});
		return true;
	}
	
	function defaultValue(target, value) {
		if ( !target ) {
			return false;
		}
		var e = ( FL.ut.isString(target) )
					? e = DOM.byName(target).get(0)
					: DOM(target);
		
		if ( !e ) {
			return false;
		}
		switch ( e.tag ) {
		case 'input':
		case 'textarea':
			__defaultSet(e, value || '', e.readAttr('name'));
			break;
		default:
			return false;
		}
		return true;
	}
	
	function autoResize(textarea) {
		if ( ! textarea || DOM(textarea).tag !== 'textarea' ) {
			return false;
		}
		var e = DOM(textarea),
			ne = e.get(0),
			h = e.readAtyle('height', true) || ne.offsetHeight;
		
		while( ne.scrollHeight <= ne.offsetHeight ) {
			e.addStyle('height', (h - 10) + 'px');
		}
		e.method('focus');
	}
	
	function selectToTable(elm, ignore) {
		
		var e = DOM(elm),
			ipt,
			tbl,
			tb,
			tr,
			td,
			optg,
			opt,
			f,
			opts = [],
			i = -1,
			cnt;
		
		if ( ! e || !e.tag || e.tag !== 'select' ) {
			return false;
		}
		
		// create dummy input
		ipt = DOM.create('input')
				.attr({
					type : 'text',
					readonly : 'readonly'
				})
				.addStyle('width', e.get().offsetWidth + 'px')
				.appendTo(e, 'after');
		
		// create table
		f = document.createDocumentFragment();
		tbl = DOM.create('table')
					.addStyle({
						position : 'absolute',
						fontSize : '12px',
						border : 'ridge 1px #baa88d',
						background : '#ffffea',
						display : 'none'
					});
		f.appendChild(tbl.get());
		tb = DOM.create('tbody').appendTo(tbl);
		optg = e.detect('optgroup');
		
		// Does <optgroup> exists?
		if ( optg.length > 0 ) {
			optg.foreach(function() {
				var tr = DOM.create('tr'),
					options = DOM(this).detect('option'),
					len = options.length,
					cnt = 0;
				
				DOM.create('th')
					.inText(this.label)
					.addStyle({
						borderRight : 'solid 1px #666',
						paddingRight : '5px'
					})
					.appendTo(tr);
				
				options.foreach(function() {
					var v = this.innerHTML;
					
					if (this.value != ignore ) {
						if ( this.selected === true ) {
							ipt.setValue(this.innerHTML);
						}
						DOM.create('td')
							.addStyle({padding :'3px', textAlign: 'center'})
							.appendTo(tr)
							.append([
							         '<a href="javascript:void(0)" rel="', this.value, '" title="', v, '">',
							         v,
							         '</a>'
							         ].join('')
									);
					}
				});
				tr.appendTo(tb);
			});
		} else {
			// option factory
			e.detect('option')
				.foreach(function() {
					opts[opts.length] = [this.value, this.innerHTML];
					if ( this.selected === true ) {
						ipt.setValue(this.innerHTML);
					}
				});
			// create cells
			cnt = 0;
			tr = DOM.create('tr');
			while ( opts[++i] ) {
				if ( opts[i][0] == ignore ) {
					continue;
				} else if ( cnt > 0 && cnt % 4 === 0) {
					tr.appendTo(tb)
					tr = DOM.create('tr');
				}
				
				td = DOM.create('td')
						.addStyle({
							textAlign : 'center',
							padding : '3px'
						})
						.appendTo(tr)
						.html([
						       '<a href="javascript:void(0)" rel="', opts[i][0], '" title="', opts[i][1], '">',
						       opts[i][1],
						       '</a>'
						       ].join(''));
				++cnt;
			}
		}

		// append table ( initial hidden )
		document.body.appendChild(f);
		
		// set show event
		ipt.event('focus', function(ev) {
			ev.stopPropagation();
			var dim = DOM(this).absDimension();
			
			tbl.addStyle({
				top : dim.top + 'px',
				left : dim.left + 'px',
				display : 'block'
			});
			
			FL.event.once(document, 'click', function() {
				tbl.hide();
			});
		});
		
		// hide event
		tbl.event('click', function(ev) {
			ev.stopPropagation();
			var t = ev.target;
			
			if ( t.tagName !== 'A' ) {
				return false;
			}
			ipt.setValue(t.innerHTML);
			e.setValue(t.rel);
			tbl.hide();
		});
		
		e.hide();
	}
});