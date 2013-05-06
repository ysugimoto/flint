/**
 * @author sugimoto
 */

 ClassExtend('Library',
 function styleswitch()
 {
 	var FL = getInstance(), thisClass = this;
	FL.load.helper('cookie');
	this.lifeTime = 365;
	var link = (function(){
		var tmp = [];
		var l = Flint._doc.getElementsByTagName('link');
		for (var i = 0, len = l.length; i < len; i++)
		{
			if (!l[i].title)continue;
			tmp.push(l[i]);
		}
		return tmp;		
	})();
	var update = function()
	{
		var tmp = [];
		var l = Flint._doc.getElementsByTagName('link');
		for (var i = 0, len = l.length; i < len; i++)
		{
			if (!l[i].title)continue;
			tmp.push(l[i]);
		}
		link = tmp;
	}

	this.initialize = function(list){
		if (list) {
			var head = Flint._doc.getElementsByTagName('head')[0];
			for (var s in list) {
				var st = DOM.create('link');
				st.type = 'text/css';
				st.rel = 'alternate stylesheet';
				st.title = s;
				st.href = FL.config.site_url + list[s];
				st.media = 'all';
				head.appendChild(st);
			}
			update();
		}
		this.set();
	}
	this.set = function()
	{
		var current = Helper.getCookie('style');
		if (current) {
			for (var i = 0, len = link.length; i < len; i++) {
				if (/style/.test(link[i].rel) && link[i].title) {
					link[i].disabled = (current.indexOf(link[i].title) != -1) ? false : true;
				}
			}
		}
	}
	this.change = function()
	{
		var titleList = [];
		var i = 0;
		while(arguments[i])
		{
			titleList.push(arguments[i]);
			i++;
		}
		var titleString = titleList.join('_');
		for (var j = 0, len2 = link.length; j < len2; j++)
		{
			if (link[j].title)
			{
				link[j].disabled = (titleString.indexOf(link[j].title) != -1) ? false : true;
			}
			
		}

	}
	var save = function()
	{
		var tmp = [];
		for (var i = 0, len = link.length; i < len; i++)
		{
			if (/style/.test(link[i].rel) && link[i].title && !link[i].disabled)tmp.push(link[i].title);
		}
		Helper.setCookie({
			'style' : tmp.join('_'),
			'max-age' : thisClass.lifeTime
		});
	}
	if (window.addEventListener)window.addEventListener('unload', save, false);
	else if (window.attachEvent)window.attachEvent('onunload', save);
	else window.onunload = save;
	
 });
