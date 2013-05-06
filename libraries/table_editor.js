ClassExtend('Library', function table_editor() {
	
	// initialize parameters
	var FL = getInstance(),
		DOM = FL.DOM,
		BASE_URL = FL.config.baseUrl(),
		PATH = FL.config.appPath(),
		box,
		frame,
		win,
		winC,
		doc = document,
		docC,
		body,
		table;
	
	// status mapping
	var cols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
		status = {
			cols : 0,
			rows : 0
		},
		ipt,
		current;
	
	/**
	 * editor set up 
	 */
	function _setUp() {
		var html,
			i = 1,
			j = 0,
			link, ttl
		
		winC = frame.contentWindow;
		docC = frame.contentDocument || winC.document;
		body = docC.body;
		DOM(frame).addStyle({
			width : '100%',
			height : '400px'
		});
		
		body.innerHTML = table;
		
		// CSS Insertion
		link = docC.createElement('link');
		link.type = 'text/css';
		link.rel = 'stylesheet';
		link.href = PATH + 'fl_css/fl_table_editor.css';
		docC.getElementsByTagName('head')[0].appendChild(link);
		
		table = docC.getElementById('table');
		
		if ( ! table ) {
			html= [
			       '<table celllspacing="0" cellpadding="0">',
			         '<tbody>',
			           '<tr>',
			             '<th class="igore"></th><th class="igore">A</th><th class="igore">B</th><th class="igore">C</th>',
			           '</tr>'
			       ];
			for (; i < 4; ++i) {
				html[html.length] = '<tr><th class="igore">' + i + '</th>';
				for (j = 0; j < 3; ++j) {
					html[html.length] = '<td class="cell-' + i + '-' + (j + 1) + '"></td>';
				}
				html[html.length] = '</tr>';
			}
			html[html.length] = '</tbody></table>';
			
			body.innerHTML = html.join('');
			status.col = 3;
			status.row = 3;
			
			table = docC.getElementsByTagName('table')[0];
		}
		
		// popup textarea
		ttl = docC.createElement('textarea');
		ttl.id = 'sz_table_input';
		body.appendChild(ttl);
		ipt = DOM(ttl);
		
		FL.event.set(docC, 'click', inputCell);
	}
	
	/**
	 * input cell
	 */
	function inputCell(ev) {
		if(current) {
			current.html(ipt.getValue());
			current.removeClass('focus');
		}
		if (ev.target.tagName === 'TD') {
			FL.connect(winC);
			var dim = DOM(ev.target).addClass('focus').absDimension();
			FL.disConnect();
			ipt.addStyle({
				top : dim.bottom + 'px',
				left : dim.left + 'px',
				display : 'block'
			}).setValue(ev.target.innerHTML);
			current = DOM(ev.target);
			ipt.method('focus');
		} else if (ev.target.tagName !== 'TEXTAREA'){
			if (current) {
				current.removeClass('focus');
				current = null;
			};
			ipt.hide();
		}
	}
	
	this.init = function(div) {
		box = DOM(div);
		frame = doc.createElement('iframe');
		frame.scrolling = 'yes';
		frame.frameBorder = '0';
		table = box.getHTML();
		box.append(frame);
		
		if (FL.ua.IE) {
			frame.onreadystatechange = function() {
				if (frame.readyState === 'complete' || frame.readyState === 'loaded') {
					_setUp();
					frame.onreadystatechange = null;
				}
			}
		} else {
			frame.onload = _setUp;
		}
		frame.src = PATH + 'index.html';
	};
	
});