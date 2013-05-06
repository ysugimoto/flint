/**
 * ==============================================================================
 *
 * Flint validation library
 * validate some input, select, textarea value by user rules.
 * user rules set like CodeIgniter :
 *        required|max_length[20]|callback_some function.
 *
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * @create 2011/05/18
 *
 * ==============================================================================
 */

// ==============================================================================
//  @Notice this library works user input field only.
//  Hidden type like:
// <input type="hidden" /> field is not works.
// ==============================================================================

ClassExtend('Library', function validation() {

	// get base instance and extract this scope
	var FL = getInstance(),
		DOM = FL.DOM,
		Animation = FL.Animation,

		// capture this scope
		that = this,

		// shortcut alias
		win = window,
		doc = document,
		GEBN = 'getElementsByName',

		// error delimiter
		errorDelimiter = 'p', // <p>

		// stack fields and rules
		valF = [],
		valR = [],

		// result flag
		validateResult = 'not',
		// stack Errors
		ErrObj = [],
		ErrElms = [],

		// balloon
		balloon,
		balloonCSS = false,

		// filedmap
		fieldMap = {},

		// work parameters
		params = {
			animate      : false,    // fadein animation
			fontColor    : '#c00',   // error message color
			changeStatus : false,    // realtime validation on keyup
			fontSize     : 9,        // error message font-size
			displayMode  : 'balloon' // messsage display mode (use balloon or inline or block)
		},

		// validate function maps
		validateMethod = {
			required     : required,
			valid_email  : valid_email,
			max_length   : max_length,
			min_length   : min_length,
			alpha        : alpha,
			alpha_numeric: alpha_numeric,
			integer      : integer,
			numeric      : numeric,
			telnumber    : telnumber,
			nut_zero     : not_zero,
			valid_url    : valid_url,
			matches      : matches
		},

		// error messages
		errorMessages = {
			required      : 'msgは必須入力です。',
			valid_email   : 'msgの形式が正しくありません。',
			max_length    : 'msgはcondition文字以内で入力してください。',
			min_length    : 'msgはcondition文字以上で入力してください。',
			alpha         : 'msgは英字のみで入力してください。',
			alpha_numeric : 'msgは英数字のみで入力してください。',
			numeric       : 'msgは数字のみ入力できます。',
			integer       : 'msgは整数のみ入力できます。',
			telnumber     : 'msgの形式が正しくありません。',
			not_zero      : 'msgに0は入力できません。',
			valid_url     : 'msgの形式が正しくありません。',
			matches       : 'msgの入力値がconditionと一致しません。'
		};


	// public ==============================================

	this.targetForm = null;

	this.setParams = function(obj) {
		params = FL.union(params, obj || {});
	};

	this.result = function() {
		return validateResult;
	};
	this.setFields = function(obj) {
		var k,
			t;

		for ( k in obj ) {
			if ( k.isPrototypeOf(obj) ) {
				continue;
			}
			t = doc[GEBN](k);
			if ( t.length === 0 ) {
				continue;
			}
			valF[valF.length] = [DOM(t[0]), obj[k]];
			fieldMap[k] = obj[k]
		}
	};

	this.setRules = function(obj) {
		var k,
			t,
			fn,
			cb = /callback_/;

		for ( k in obj ) {
			if ( k.isPrototypeOf(obj) ) {
				continue;
			}
			t = doc[GEBN](k);
			if ( t.length === 0 ) {
				continue;
			}

			if ( cb.test(obj[k]) ) {
				fn = obj[k].replace(/(?:.*)callback_(.*)\|?(?:.*)?/g, '$1');
				validateMethod[fn] = function(val, condition) {
					var C = FL.system.CONTROLLER;

					C.apply(C, [val, condition]);
				};
				obj[k] = obj[k].replace(/callback_/g, '');
			}

			valR[valR.length] = [DOM(t[0]), obj[k]];
		}
	};

	this.setErrorDelimiters = function(tag) {
		errorDelimiter = tag;
	};

	this.setMessage = function(rule, msg) {
		if ( typeof rule === 'string' ) {
			errorMessages[rule] = msg;
		} else if ( FL.ut.isObject(rule) ) {
			errorMessages = FL.union(errorMessages, rule);
		}
	};

	this.run = function(form, $callback) {
		var path = FL.config.appPath() + 'fl_images/validation/',
			callback = $callback || null,
			i, j, k,
			F,
			R,
			condReg = /\[(.+)\]/,
			condRegR = /(?:.*)\[(.*?)\]$/,
			rules,
			condition,
			rule;

		if ( form == null ) {
			return false;
		}

		this.targetForm = DOM(form);

		// Is balloon already setup?
		if ( params.displayMode === 'balloon' && balloonCSS === false ) {
			FL.load.css('fl_validation');
			_createBalloon();
			balloonCSS = false;
			FL.event.exprLive('span.fl_validation_balloon_close', 'click', _closeBalloon);
			FL.image.preLoad([
			                    path + 'balloon_back.gif',
			                    path + 'balloon_close.gif',
			                    path + 'balloon_left.png',
			                    path + 'balloon_right.png'
			                  ]);
		}
		DOM(form).event('submit', function(ev) {
			ev.preventDefault();

			i = -1;
			while( valF[++i] ) {
				F = valF[i];
				j = -1;
				while ( valR[++j] ) {
					R = valR[j];
					if ( F[0].readAttr('name') !== R[0].readAttr('name') ) {
						continue;
					}
					rules = R[1].split('|');
					k = -1;
					while ( rules[++k] ) {
						if ( rules[k] === '' ) {
							continue;
						}
						if ( condReg.test(rules[k]) ) {
							condition = rules[k].replace(condRegR, '$1');
							rule = rules[k].replace(condReg, '');
						} else {
							condition = R[0];
							rule = rules[k];
						}
						if ( ! FL.ut.isFunction(validateMethod[rule]) ) {
							continue;
						}
						if ( validateMethod[rule](R[0].getValue(), condition) === false ) {
							ErrObj[ErrObj.length] = [R[0], rule, F[1], condition];
						}
					}
				}
			}

			// Is all green?
			if ( ErrObj.length === 0 ) {
				if(document.news_entry_form != undefined) {
					document.news_entry_form.target = '_top';
					document.news_entry_form.hidAction.value = '';
				}
				validateResult = true;
				DOM(form).method('submit');
				return true;
			} else {
				setError();
				validateResult = false;
				FL.ut.isFunction(callback) && callback();
				return false;
			}
		})
	};

	// ==================================================================
	// validate method
	// ==================================================================

	// required
	function required(val, ve) {
		var e = ve.get(),
			rcs,
			s,
			i = -1;

		if ( /select(?:\-multiple)?/.test(ve.tag) ) {
			rcs = e.getElementsByTagName('option');
			while ( rcs[++i] ) {
				if ( rcs[i].selected === true && rcs[i].value !== '' ) {
					return true;
				}
			}
			return false;
		}

		switch ( e.type ) {
		case 'radio':
		case 'checkbox':
			rcs = DOM(that.targetForm.tag + ' input[name=' + e.name + ']').nodeList;
			while ( rcs[++i] ) {
				if ( rcs[i].checked === true && rcs[i].value !== '' ) {
					return true;
				}
			}
			return false;
		case 'text':
		case 'file':
		case 'password':
			return !!( e.value && e.value !== '');
		default:
			if ( ve.tag === 'textarea' ) {
				return !!( e.value && e.value !== '');
			}
		}
	}

	// valid_email
	function valid_email(val) {
		return !!( val === '' || /\w{1,}[@][\w\-]{1,}([.]([\w\-]{1,})){1,3}$/.test(val) );
	}

	// max_length
	function max_length(val, cond) {
		return !!( val.length < cond );
	}

	// min _length
	function min_length(val, cond) {
		return !!( val.length > cond );
	}

	// alpha
	function alpha(val) {
		return !!( val === '' || /^[a-zA-Z\-_]+$/.test(val) );
	}

	// alpha_numric
	function alpha_numeric(val) {
		return !!( val === '' || /^[0-9a-zA-Z\-_]+$/.test(val) );
	}

	// integer
	function integer(val) {
		return !!( val === '' || /^[0-9]+$/.test(val) );
	}

	// numeric
	function numeric(val) {
		return !!( val === '' || !isNaN(parseInt(val)) );
	}

	// not_zero
	function not_zero(val) {
		return !!( val === '' || val !== '0' );
	}

	// valid_url
	function valid_url(val) {
		return !!( val === '' || /^http[s]?:\/\/[\w\.\/]+([\/|\?]?[\-_.!~\*a-zA-Z0-9\/\?:;@&=+$,%#]+)?$/.test(val) );
	}

	// matches
	function matches(val, cond) {
		var to = that.targetForm.getOne('[name=' + cond + ']');

		return !!( to && t.getValue() === val );
	}

	// telnumber
	function telnumber(val, conf) {
		return !!( val === '' || /^\d+\-\d+\-\d+$/.test(val))
	}


	// private functions =======================================

	function setError() {
		var i = -1,
			error = -1,
			j = -1,
			err,
			e,
			text;

		while ( ErrElms[++error] ) {
			ErrElms[error].remove();
		}
		ErrElms = []; // reset
		while ( ErrObj[++i] ) {
			err = ErrObj[i];
			// Does error setting exists or that error already validated?
			if ( ! err || err.length === 0 ) {
				continue;
			}

			// crate Error Element
			e = DOM.create(errorDelimiter)
					.addStyle({
						fontSize : params.fontSize + 'px',
						color    : params.fontColor,
						padding  : '0px',
						margin   : '0px'
					});

			// setup error message
			if ( ! ( err[1] in errorMessages ) ) {
				throw Error('Undefined error message for ' + err[1] + ' rule.');
			}

			text = errorMessages[err[1]] ? errorMessages[err[1]].replace('msg', err[2]) : '';

			if ( typeof err[3] === 'string' ) {
				if ( err[3] in fieldMap ) {
					err[3] = fieldMap[err[3]];
				}
				text = text.replace('condition', err[3]);
			}
			e.inText(text);

			if ( err[0].__validated === true ) {
				continue;
			}
			e = attachError(e, err[0]);
			// guard
			err[0].__validated = true;

			ErrElms[ErrElms.length] = e;
		}
		// unlock
		while ( ErrObj[++j] ) {
			err = ErrObj[j];
			if ( ! err || err.length === 0 ) {
				continue;
			}
			try {
				delete err[0].__validated;
			} catch(e) {
				err[0].__validated = false;
			}
		}
		// reset
		ErrObj = [];
	}

	function attachError(e, target) {
		var B,
			t = target.get(),
			tl,
			text = e.getText(),
			ie = FL.ua.IE,
			dim;

		// Does error type show balloon?
		if ( params.displayMode === 'balloon' ) {
			tl = (text.length > 0) ? FL.ut.getTextSize(text, '9px').width : 80;
			dim = target.absDimension();
			B = balloon.copy(true)
						.addStyle({
							top : dim.top - 35 + 'px',
							left : dim.right - ((ie) ? 0 : 30) + 'px',
							width : tl + (ie ? 70 : 47) + 'px'
						})
						.appendTo();
			e.appendTo(B.last(), 'before')
				.addClass('fl_validation_error')
				.addStyle({
					color : '#fff',
					paddingTop : (ie) ? '12px' : '10px'
				});
			if ( params.animate ) {
				B.addStyle('opacity', 0);
				Animation.apper(B);
			}
		} else {
			if ( /textarea|select(?:\-multiple)/.test(target.tag) || t.type === 'text' ) {
				e.appendTo(target.parent());
			} else {
				e.appendTo(target.parent(2));
			}
			if ( params.animate ) {
				e.addStyle('opacity', 0);
				Animation.apper(e);
			} else {
				e.addStyle('display', params.displayMode);
			}
		}
		return B || e;
	}

	function _createBalloon() {
		var path = FL.config.appPath() + 'fl_images/validation/',
			backs;

		balloon = DOM.create('div')
						.addClass('fl_validation_balloon')
						.append('<span class="fl_validation_balloon_left">&nbsp;</span>')
						.append('<span class="fl_validation_balloon_right">&nbsp;</span>')
						.append('<span class="fl_validation_balloon_close">&nbsp;</span>');
		backs = balloon.detect('span[class$=t]');
		if ( FL.ua.IE ) {
			backs.get(0).addStyle('filter', FL.ut.makeFilter('png', path + 'balloon_left.png'));
			backs.get(1).addStyle('filter', FL.ut.makeFilter('png', path + 'balloon_right.png'));
		} else {
			backs.get(0).addStyle('background', 'url(' + path + 'balloon_left.png' + ') top left no-repeat');
			backs.get(1).addStyle('background', 'url(' + path + 'balloon_right.png'+ ') top right no-repeat');
		}
	}

	function _closeBalloon(ev) {
		ev.stopPropagation();
		ev.target.parentNode.style.display = 'none';
	};



});
