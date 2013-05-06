/**
 * @author sugimoto
 */

 ClassExtend('Library',
 function zip()
 {
 	var FL = getInstance();
	FL.load.ajax(this);
	var thisClass = this;
	var cache = {};
	var params = {
		zipMode : 'separate',
		addrMode : 'separate',
		showError : true,
		dataPath : 'data/zip/'
	};
	var fields = {
		zip1 : null,
		zip2 : null,
		zip : null,
		pref : null,
		address : null
	};
	this.setParams = function(obj)
	{
		if (!obj)return;
		for (var i in obj)
		{
			params[i] = obj[i];
		}
	}
	this.setFields = function(obj)
	{
		if (!obj)return;
		for (p in obj)
		{
			var t = DOM.id(obj[p]);
			if (t == null) {
				t = DOM.byName(obj[p]);
				if (t.length == 0) 
					continue;
				t = t.get(0);
			}
			fields[p] = t.get();
		}
	}
	var zipToAddress = function(ev)
	{
		switch (params.zipMode)
		{
			case 'separate':
				var info = {
					zip1 : fields.zip1.value,
					zip2 : fields.zip2.value,
					zip  : fields.zip1.value + fields.zip2.value
				}
			break;
			case 'combi' :
				var info = {
					zip1 : fields.zip.value.substr(0, 3),
					zip2 : fields.zip.value.substring(3),
					zip  : fields.zip.value
				}
			break;
			case 'combi_dash' :
				var info = {
					zip1 : fields.zip.value.split('-')[0],
					zip2 : fields.zip.value.split('-')[1],
					zip  : fields.zip.value.replace(/\-/, '')
				}
			break;
			default :
			break;
		}
		if (!info || !info.zip1)return;
	//if (!(info.zip1 in cache)) {
			FL.ajax.get(params.dataPath + 'zipdata_' + info.zip1 + '.json', {
				success : function(obj) {
					eval('var json=' + obj.responseText);
					if (!(info.zip in json)) {
						if (params.showError) 
							FL.ut.isFunction(params.showError)
								? params.showError()
								: alert('inputed zip code is undefined.');
						return;
					}
					var pa = json[info.zip];
					switch (params.addrMode) {
						case 'separate':
							var opt = fields.pref.options,
								i = opt.length;
							
							while ( opt[--i] ) {
								if ( opt[i].innerHTML === pa.pref ) {
									opt[i].selected = true;
									break;
								}
							}
							
							//fields.pref.value = pa.pref;
							fields.address.value = pa.addr;
							break;
						case 'combi':
							fields.address.value = pa.pref + pa.addr;
							break;
						default:
							break;
					}
//					cache[info.zip1] = {
//						pref: pa.pref,
//						address: pa.addr
//					};
				}
			});
		return;
//		}
//		else
//		{
//			var pa = cache[info.zip];
//			switch (params.addrMode) {
//				case 'separate':
//					fields.pref.value = pa.pref;
//					fields.address.value = pa.addr;
//					break;
//				case 'combi':
//					fields.address.value = pa.pref + pa.addr;
//					break;
//				default:
//					break;
//			}
//			cache[info.zip1] = {
//				pref: pa.pref,
//				address: pa.addr
//			};			
//		}
		
	}
	this.set = function(target, event)
	{
		if (!event)return;
		else var event = event;
		if (typeof target == 'object')
		{
			var target = target;
		}
		else
		{
			var target = DOM.search('id', target);
		}
		if (target == null) return;
		FL.event.set(target, event, zipToAddress);
	}
 });
