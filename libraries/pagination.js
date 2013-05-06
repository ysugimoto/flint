ClassExtend('Library', function pagination() {

	// get BASE Object
	var FL = getInstance(),
		that = this,
		// configure
		config = {
			display_mode : 'segment', /* segment OR query */
			update_target : null,
			total_target : null,
			base_url : null, /* need */
			total_rows : 0, /* need */
			per_page : 0, /* need */
			uri_segment : 3,
			num_links : 5,
			full_tag_open : null,
			full_tag_close : null,
			first_link : '&lsaquo; First',
			first_tag_open : null,
			fisrt_tag_close : '&nbsp;',
			last_link : 'Last &rsaquo;',
			last_tag_open : '&nbsp;',
			last_tag_close : null,
			next_link : '&gt;',
			next_tag_open : '&nbsp;',
			next_tag_close : '&nbsp;',
			prev_link : '&lt;',
			prev_tag_open : '&nbsp;',
			prev_tag_close : null,
			cur_tag_open : '&nbsp;<b>',
			cur_tag_close : '</b>',
			num_tag_open : '&nbsp;',
			num_tag_close : null,
			query_string_semgnet : 'per_page',
			hook : null,
			responseMode : 'text'
		},
		currentPage,
		lastPage,
		fisrstPage = 0,
		lastSlashReg = /.+\/$/,
		dblSlash = /([^:])\/\/+/;
		linkTargets = [],
		displayPage = 0,
		dataCache = {};

	// initialize
	this.initialize = function(conf) {
		FL.union(config, conf || {});
	};

	this.setConfig = function(prop, val) {
		config[prop] = val;
	}

	this.getLinkString = function() {
		return this.createdLinks || '';
	}

	// set create pagination
	var __createLinks = function(target /* insert node */) {
		var c = config, ceil = Math.ceil, floor = Math.floor, numPage, uriPN, uri = c.base_url,
				start, end, out = [], i, loop, n, outStr = '', t = DOM(target), that = this;

//		// check config (need parameter isset?)
//		if (!c.base_url || !c.total_rows || !c.per_page) {
//			return alert('not enough configures');
//		}
		// if total_rows is 0 OR per page is 0, return empty string
		if (c.total_rows == 0 || c.per_page == 0) { return ''; }

		numPage = ceil(c.total_rows / c.per_page);

		if (numPage === 1) { return ''; }

		if (c.num_links < 1) {
			throw Error('num_links parameter must be a positive number.');
			return;
		}

		if (!currentPage) { currentPage = 0; }
		else { currentPage = parseInt(currentPage);}


		if (currentPage > c.total_rows) {
			currentPage = (numPage - 1) * c.per_page;
		}

		uriPN = currentPage;
		currentPage = floor((currentPage / c.per_page) + 1);

		start = (currentPage - c.num_links > 0) ? currentPage - (c.num_links - 1) : 1;
		end = (currentPage + c.num_links < numPage) ? currentPage + c.num_links : numPage;

		// if base_url parameter has not '/' of last, add slash
		if (c.display_mode === 'segment') {
			if (!lastSlashReg.test(uri)) { uri += '/'; }
		} else if (c.display_mode ==- 'query') {
			uri += '&amp;' + c.query_string_segment + '=';
		}

		// first link
		if (currentPage > (c.num_links + 1)) {
			out.push(([c.first_tag_open, '<a href="', uri, '" class="fl_pg_first">', c.first_link, '</a>', c.sirst_tag_close]).join(''));
		}

		// previous
		if (currentPage !== 1) {
			i = uriPN - c.per_page;
			if (i === 0) { i = '';}
			out.push(([c.prev_tag_open, '<a href="', uri, i, '" class="fl_pg_prev">', c.prev_link, '</a>', c.prev_tag_close]).join(''));
		}

		// digit links
		for (loop = start - 1; loop <= end; loop++) {
			i = (loop * c.per_page) - c.per_page;

			if (i >= 0) {
				if (currentPage === loop) {
					out.push(c.cur_tag_open + loop + c.cur_tag_close);
				} else {
					n = (i === 0) ? '' : i;
					out.push(([c.num_tag_open, '<a href="', uri, n, '" class=fl_pg_digits">', loop, '</a>', c.num_tag_close]).join(''));
				}
			}
		}

		// next link
		if (currentPage < numPage) {
			out.push(([c.next_tag_open, '<a href="', uri, currentPage * c.per_page, '" class="fl_pg_next">', c.next_link, '</a>', c.next_tag_close]).join(''));
		}

		// last link
		if (currentPage + c.num_links < numPage) {
			i = (numPage * c.per_page) - c.per_page;
			out.push(([c.last_tag_open, '<a href="', uri, i, '" class="fl_pg_last">', c.last_link, '</a>', c.last_tag_close]).join(''));
		}

		out.unshift(c.full_tag_open);
		out.push(c.full_tag_close);

		// kill double slash and return
		that.createdLinks = out.join('').replace(dblSlash, '$1');
		return that.createdLinks;

	};

	var __updateLinks = function() {
		var link = __createLinks(), i = 0, len = linkTargets.length, t, et, c = config;
		if (!link) { link = '';}

		for (; i < len; i++) {
			t = linkTargets[i];
			t.html(link);
			// set pagenation event
			t.detect('a').foreach(function() {
				DOM(this).event('click', function(ev) {ev.preventDefault();update(t, ev.target);});
			});
		}

		// set total display if exists
		if (c.total_target) {
			et = ((displayPage + c.per_page) > c.total_rows) ? c.total_rows : displayPage + c.per_page;
			DOM(c.total_target).html(([c.total_rows, '件中', displayPage + 1, '-', et, '件表示']).join(''));
		}
	};


	this.createLinks = function(target) {
		linkTargets.push(DOM(target));
		__updateLinks();
	}

	this.setLinkTarget = function(target) {
		linkTargets.push(DOM(target));
	};

	this.setUp = function(elm) {
		var json;

		if (elm) { config.update_target = DOM(elm);}
		if (config.base_url in dataCache) {
			json = dataCache[config.base_url];
			config.update_target.html(json.result);
			config.total_rows = json.total;
			__updateLinks();
		} else {
			FL.ajax.get(config.base_url, {
				success : function(resp) {
					json = FL.json.parse(resp.responseText);
					config.update_target.html(json.result);
					config.total_rows = json.total;
					__updateLinks();
					dataCache[config.base_url] = json;
				}
			});
		}
	};

	// update local function
	function update(t, target) {
		var href = target.href, c = config, data;

		if (FL.ut.isFunction(c.hook)) { c.hook();}

		if (href in dataCache) {
			data = dataCache[href];
			if (c.responseMode === 'text') {
				DOM(c.update_target).html(data);
			} else if (c.responseMode === 'json') {
				DOM(c.update_target).html(data.result);
			}
			currentPage = displayPage = Number(href.slice(href.lastIndexOf('/') + 1));
			__updateLinks();
		} else {
			FL.ajax.get(href, {
				error : function() { throw Error('pagination missed.');},
				success : function(resp) {
					if (c.responseMode === 'text') {
						data = resp.responseText;
						DOM(c.update_target).html(data);
					} else if (c.responseMode === 'json') {
						data = FL.json.parse(resp.responseText);
						DOM(c.update_target).html(data.result);
					}
					dataCache[href] = data;
					currentPage = displayPage = Number(href.slice(href.lastIndexOf('/') + 1));
					__updateLinks();
				}
			});
		}

		//c.update_target.html('<p style="background : url(' + FL.config.siteUrl() + 'images/loading_small.gif) top center no-repeat;margin-top : 20px;height : 30px"></p>');


	}

});