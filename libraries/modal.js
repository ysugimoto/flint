/**
 * ==================================================================
 * Flint modal Library
 * create and show/hide alert or confirm DOM modals
 * @package Flint.js
 * @depend Module.layer
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * ==================================================================
 */
ClassExtend('Library', function modal() {
	// local variables //
	var FL = getInstance(),
		DOM = FL.DOM,
		thisClass = this,
		params = {width : 350, height : 130},
		layer,
		bind,
		modal,
		modalTxt,
		modalbtn,
		close,
		ok,
		cn,
		pageSize;

	// load depend module
	FL.load.module('layer');
	FL.load.css('modal');

	/**
	 * ==================================================================
	 * constructor
	 * ==================================================================
	 */
	this.__construct = function() {
		this.mode = 'alert';
		this.text = '';
		this.clickListener = null;
		bind = null;
		layer = new Module.layer(false);
		modal =DOM.create('div', {'class' : 'ci_modal'});
		modalTxt = DOM.create('div', {'class' : 'ci_modal_text'}).appendTo(modal);
		modalBtn = DOM.create('div', {'class' : 'ci_modal_btn'}).appendTo(modal);
		close = DOM.create('ul');

		ok = DOM.create('img', {src : FL.config.appPath() + 'fl_images/modal/ok.gif', 'class' : 'ok_btn'});
		cn = DOM.create('img', {src : FL.config.appPath() + 'fl_images/modal/cancel.gif', 'class' : 'cn_btn'});
	};

	/** private functions **/

	/**
	 * ==================================================================
	 * generate
	 * create modal window
	 * @access private
	 * @execute call
	 * ==================================================================
	 */
	var generate = function() {
		//pageSize = FL.ut.getContentSize();
		modalBtn.html('');
		ok.unevent('click');
		cn.unevent('click');
		modal.addStyle({
			width : params.width + 'px',
			height : params.height + 'px',
			top : '50%',
			left : '50%',
			marginLeft : -(params.width / 2) + 'px',
			marginTop : -(params.height / 2) + 'px'
		});
		modalTxt.html(thisClass.text)
		switch (thisClass.mode) {
			case 'confirm':
				ok.appendTo(modalBtn);
				ok.event('click', thisClass.confirmHide);
				cn.appendTo(modalBtn);
				cn.event('click', thisClass.hide);
				modal.addStyle('background-image', 'url(' + FL.config.appPath() + 'fl_images/modal/confirm.gif)');
			break;
			default : // same alert
				ok.appendTo(modalBtn);
				ok.event('click', thisClass.hide);
				modal.addStyle('background-image', 'url(' + FL.config.appPath() + 'fl_images/modal/alert.gif)');
			break;
		}
		modal.appendTo();
	};

	/** public functions **/

	/**
	 * ==================================================================
	 * alert
	 * show alert window
	 * @access public
	 * @param String txt
	 * @param Object bindObj
	 * @return void
	 * ==================================================================
	 */
	this.alert = function(txt, bindObj) {
		var txt = txt;

		this.__show('alert', txt, false, bindObj);
	};

	/**
	 * ==================================================================
	 * confirm
	 * show conrifm window
	 * @access public
	 * @param String txt
	 * @param Function listener
	 * @param Object bindObj
	 * @return void
	 * ==================================================================
	 */
	this.confirm = function(txt, listener, bindObj) {
		var txt = txt, fn = listener || false;

		this.__show('confirm', txt, listener, bindObj);
	};

	/**
	 * ==================================================================
	 * show
	 * generate window
	 * @access private
	 * @param String mode
	 * @param String txt
	 * @param Function[boolean] listener
	 * @param Object bindObj
	 * ==================================================================
	 */
	this.__show = function(mode, txt, listener, bindObj) {
		this.mode = mode;
		this.text = txt;
		if (bindObj) {bind = bindObj;}
		if (listener) {this.clickListener = listener;}
		layer.show();
		generate();
	};

	/**
	 * ==================================================================
	 * hide
	 * hidden to modal window
	 * @access public
	 * ==================================================================
	 */
	this.hide = function() {
		modal.remove();
		layer.hide();
	};

	/**
	 * ==================================================================
	 * confirmHide
	 * hidden to modal window for confirm mode
	 * @access public
	 * ==================================================================
	 */
	this.confirmHide = function() {
		if (thisClass.clickListener != null) {
			(bind != null) ? thisClass.clickListener.call(bind) : thisClass.clickListener();
		}
		modal.remove();
		layer.hide();
	};
 });
// end of modal.js
// location : libraries/modal.js
