/**
 * ===============================================================================================
 *
 * Seezoo dashboard gadget manage Controller
 *
 * manage gadget add/delete and connect gadget library
 * @package Seezoo Core
 * @author Yoshikaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 *
 * ===============================================================================================
 */
ClassExtend('Controller', function Gadget() {

	// local variables
	var pp;

	/**
	 * ===============================================================================================
	 * constructor
	 * ===============================================================================================
	 */
	this.__construct = function() {
		this.load.module('ui');
		this.load.library('gadget');
		this.load.ajax();
	};

	/**
	 * ===============================================================================================
	 * default method
	 * ===============================================================================================
	 */
	this.index = function() {
		var ul, li, json, that = this, icon,
			iconPath = this.config.appPath() + 'fl_images/gadget/icons/';

		this.ready('gadget', function() { this.gadget.init(DOM.id('gadget'));});
		DOM.id('add_gadget').Cevent('click', function() {
			// create popup
			pp = Helper.createDOMWindow('ガジェットの追加', '', 500, 500);
			this.ajax.get('gadget_ajax/get_gadget_list/' + this.config.item('sz_token'), {
				success : function(resp) {
					//eval('var json=' + resp.responseText);
					json = that.json.parse(resp.responseText);
					ul = DOM.create('ul').addClass('sz_gadget_list');
					for (var i in json) {
						icon = json[i].icon ? iconPath + json[i].gadget_name + '.png' : iconPath + 'common.png';
						li = DOM.create('li')
							.attr('class', 'sz_gadget')
							.attr('gadget_id', json[i].gadget_id)
							.html(([
							        '<img src="', icon, '" alt="" />&nbsp;&nbsp;', json[i].gadget_name, '&nbsp;ガジェット',
							        '<br /><span>', json[i].gadget_description, '</span>']).join(''))
							.appendTo(ul);
					}
					ul.detect('li').event('mouseover', function() { DOM(this).addStyle('backgroundColor', '#ffc');})
									.event('mouseout', function() { DOM(this).addStyle('backgroundColor', '#fff');})
									.event('click', function() {
						that.addGadget(DOM(this));
					});
					pp.setContent(ul);
				}
			});
		})
	};

	/**
	 * ===============================================================================================
	 * addGadget
	 * add new Gadget
	 * @access public
	 * @execute call
	 * @param xElement e
	 * @return void
	 * ===============================================================================================
	 */
	this.addGadget = function(e) {
		var gid = e.readAttr('gadget_id'), that = this, json;

		this.ajax.get('gadget_ajax/add_gadget/' + gid + '/' + this.config.item('sz_token'), {
			error : function() {
				alert('ガジェットの追加に失敗しました。');
			},
			success : function(resp) {
				//eval('var json=' + resp.responseText);
				try {
					json = that.json.parse(resp.responseText);
					that.gadget.gadget.create(json);
				} catch(e) {}
				pp.hide();
			}
		});
	};
});