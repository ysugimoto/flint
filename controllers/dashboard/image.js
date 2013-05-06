/**
 * ===============================================================================================
 * 
 * Seezoo Image editor Controller
 * 
 * manage image edit or select
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto
 * 
 * ===============================================================================================
 */
ClassExtend('Controller', function() {

	/**
	 * ===============================================================================================
	 * constructor
	 * ===============================================================================================
	 */
	this.__construct = function() {
		this.load.library('image_editor');
		this.load.module('layer');
		this.load.library('file_operator');
	};

	/**
	 * ===============================================================================================
	 * default method
	 * ===============================================================================================
	 */
	this.index = function() {
		//this.ready('file_operator', function() {
			DOM.id('select_edit_image_target').event('click',this.__setImage, this);
		//});
	};

	/**
	 * ===============================================================================================
	 * edit
	 * set up image editor library
	 * @access public
	 * @execute routing
	 * @return void
	 * ===============================================================================================
	 */
	this.edit = function() {
		this.ready('image_editor', function() {
			this.image_editor.initialize({canvasWidth : 900, canvasHeight : 500});
			this.image_editor.setUp(DOM.id('sz_image_target'));
		});
	};

	/**
	 * ===============================================================================================
	 * __setImage
	 * select immage from file manager and callback
	 * @access private
	 * @execute event handler
	 * @param Event ev
	 * @return void
	 * ===============================================================================================
	 */
	this.__setImage = function(ev) {
		var p = ev.target.parentNode,
			pp = Helper.createDOMWindow('画像ファイルの選択', '', 938, '90%', false, false),
			that = this;

		this.ajax.get('ajax/get_files_image_dir/' + 1 + '/' + this.config.item('sz_token'), {
			success : function(resp) {
				pp.setContent(resp.responseText);
				that.file_operator.init(p, pp, 'image_edit');
			}
		});
	};
});