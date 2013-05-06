ClassExtend('Library', function teX() {

	var FL = getInstance();

	FL.load.css('fl_tex');

	// capture this scope
	var that = this, DOM = FL.DOM;

	// shortcut alias
	var doc = document, win = window, enc = win.encodeURIComponent;

	// textarea
	var editArea;

	// wrapper element
	var target;

	// result area
	var result;

	// image data
	var imagedata;

	// guard flag
	var guard;

	// current show table
	var current;

	/* ================ common local functions =================== */

	// google chart API query build
	var buildQuery = function() {
		return 'http://chart.apis.google.com/chart?cht=tx&amp;chs=1x0&amp;chf=bg,s,FFFFFF00&amp;chl=' + enc(editArea.value);
	};

	// create img element
	var request = function() {
		result.innerHTML = '<img src="' + buildQuery() + '" />';
	};

	// insert textarea
	var draw = function(v) {
		editArea.value += v + ' ';
		request();
	};

	// easy make table
	var makeTable = function(arr, cl) {
		var tbl = ['<table class="' + cl + '_table" style="display:none"><tbody>'];
		for (var i = 0; i < arr.length; i++) {
			tbl.push('<tr>');
			for (var j = 0; j < arr[i].length; j++) {
				tbl.push('<td class="' + cl +(i + 1) + '-' +(j + 1) +'" unselectable="on" command="' + arr[i][j] + '"></td>');
			}
			tbl.push('</tr>');
		}
		tbl.push('</tbody></table>');
		return tbl.join('');
	};

	// set up menu
	var createMenu = function(elm) {
		var html = [
		            	'<ul class="fl_tex_menus">',
		            		'<li class="fl_tex_sign">',
		            			makeTable([
		            			              ['\\alpha','\\beta','\\gamma','\\delta','\\epsilon','\\varepsilon','\\zeta'],
		            			              ['\\eta','\\theta','\\vartheta','\\iota','\\lappa','\\lambda','\\mu'],
		            			              ['\\nu','\\xi','\\pi','\\varpi','\\rho','\\varrho','\\sigma'],
		            			              ['\\varsigma','\\tau','\\upsilon','\\phi','\\varphi','\\chi','\\psi'],
		            			              ['\\omega','\\Gamma','\\Delta','\\Theta','\\Lambda','\\Xi','\\Pi'],
		            			              ['\\Sigma','\\Upsilon','\\Phi', 'Psi','\\Omega', '', '']
		            			           ], 'sign'),
		            		'</li>',
		            		'<li class="fl_tex_math">',
		            			makeTable([
		            			              ['\\times','\\div','\\cdot','\\pm','\\mp','\\ast','\\star'],
		            			              ['\\circ','\\bullet','\\oplus','\\ominus','\\pslash','\\otimes','\\odot'],
		            			              ['\\dagger','\\ddagger','\\vee','\\wedge','\\cap','\\cup','\\aleph'],
		            			              ['\\Re','\\lm','\\top','\\bot','\\infty','\\partial','\\forall'],
		            			              ['\\exists','\\neg','\\angle','\\triangle','\\diamnd','','']
		            			           ], 'math'),
		            		'</li>',
		            		'<li class="fl_tex_caps">',
		            			makeTable([
		            			              ['\\leq','\\geq','\\prec','\\succ','\\preceq','\\succeq','\\ll'],
		            			              ['\\gg','\\equiv','\\sim','\\simq','\\asymp','\\approx','\\ne'],
		            			              ['\\subset','\\supset','\\subseteq','\\supseteq','\\in','\\ni','\\notin']
		            			           ], 'cap'),
		            		'</li>',
		            		'<li class="fl_tex_fracs">',
		            			makeTable([
		            			              ['x_{a}','x^{b}','x_{a}^{b}','\\bar{x}','\\tlide{x}','\\frac{a}{b}','\\sqrt{x}','\\sqrt[n]{x}','\\bigcap_{a}^{b}','\\bigcup_{a}^{b}'],
		            			              ['\\prod_{a}^{b}','\\coprod_{a}^{b}','\\left( x \\right)','\\left[ x \\right]','\\left{ x \\right}','\\left| x \\right|','\\int_{a}^{b}','\\oint{a}^{b}','\\sum_{a}^{b}','\\lim_{a rightarrow b}{x}']
		            			           ], 'frac'),
		            		'</li>',
		            		'<li class="fl_tex_arrows">',
		            			makeTable([
		            			              ['\\leftarrow','\\rightarrow','\\leftrightarrow','\\Leftarrow','\\Rightarrow','\\Leftrightarrow','\\uparrow','\\downarrow','\\updownarrow','\\Uparrow','\\Downarrow','\\Updowmarrow']
		            			           ], 'arrow'),
		            		'</li>',
		            	'</ul>'
		            ];
		elm.innerHTML = html.join('');
	};

	// editor initialize
	var __editorInit = function() {
		// preview image request
		target.onkeyup = request;

		// alias command show
		DOM('ul.fl_tex_menus li').event('click', function(ev) {
			ev.stopPropagation();
			if (current && current.get() !== this) { current.hide();}
			current = DOM(this).getOne('table').toggleShow();
		});

		// table cell click events cancel bubbling
		DOM('ul.fl_tex_menus li table td')
		.event('click', function(ev) {
			ev.stopPropagation();
			draw(DOM(this).readAttr('command'));
			DOM(this).parent(3).hide();
		})
		.event('mouseover', function() {
			DOM(this).addClass('hover');
		})
		.event('mouseout', function() {
			DOM(this).removeClass('hover');
		});

		// if table is blur, hide tables
		FL.event.set(doc, 'click', function() {
			current && current.hide();
		})
	};

	/* ================= public functions ======================== */

	this.setUp = function(elm /* wrapper element */) {
		// editor forms
		target = elm;
		createMenu(target);
		var txt = doc.createElement('textarea');
		txt.className = 'fl_tex_edit_area';
		elm.appendChild(txt);
		var view = doc.createElement('div');
		view.innerHTML = '<p>プレビュー</p>';
		var previewArea = doc.createElement('div');
		previewArea.className = 'fl_tex_preview';
		view.appendChild(previewArea);
		result =previewArea;
		elm.appendChild(view);
		editArea = txt; // set editor area

		__editorInit();
	};


});