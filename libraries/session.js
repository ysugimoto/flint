/**
 * @author sugimoto
 */

 ClassExtend('Library',
 function session()
 {
 	var FL = getInstance(), thisClass = this;
 	if (window.sessionStorage)
	{
		var storage = window.sessionStorage;
		var stMode = 'local';
	}
	else
	{
		var storage = undefined;
		var stMode = 'cookie';
	} 
	//set local function	
	var __setSession = function(name, value)
	{
		var cookieValue = '';
		document.cookie = FL.config.sessionName + '_' + name + '=' + encodeURIComponent(value);
	}
	var __getSession = function(name)
	{
		var cookie = document.cookie;
		if (!cookie || !name)return false;
		var cookieValues = cookie.split(';'), cookieValue = null;
		for (var c = 0; c < cookieValues.length; c++)
		{
			if (cookieValues[c].indexOf(FL.config.sessionName + '_' + name) != -1)cookieValue = cookieValues[c];break;
		}
		if (cookieValue == null)return false;
		var value = cookieValue.split('=');
		return decodeURIComponent(value[1]);
	}
	 var __deleteSession = function(name)
	{
		var cookie = document.cookie;
		if (!cookie || !name)return false;
		var cookieValues = cookie.split(';');
		var cookieValue = null, cookieDomain = null, cookiePath = null, cookieMaxAge = null;
		for (var c = 0; c < cookieValues.length; c++)
		{
			if (cookieValues[c].indexOf(FL.config.sessionName + '_' + name) != -1)cookieValue = cookieValues[c];break;
		}
		if (cookieValue == null)return false;
		var cName = cookieValue.split('=');
		document.cookie = cName[0] + "=;max-age=0";
	}
	var deleteAllSession = function()
	{
		var cookie = document.cookie;
		if (!cookie)return ;
		var cookieValues = cookie.split(';');
		for (var c = 0; c < cookieValues.length; c++)
		{
			if (cookieValues[c].indexOf(FL.config.sessionName) != -1) {
				var cName = cookieValues[c].split('=');
				document.cookie = cName[0] + '=;max-age=0';
			}
		}
	}
	var __deleteFlashSession = function()
	{
		var cookie = document.cookie;
		if (!cookie)return;
		var cookieValues = cookie.split(';');
		var cookieValue = null, cookieDomain = null, cookiePath = null, cookieMaxAge = null;
		for (var c = 0; c < cookieValues.length; c++)
		{
			if (cookieValues[c].indexOf('flash') != -1)
			{
				if (cookieValues[c].indexOf(document.referrer) == -1) {
					var cName = cookieValues[c].split('=');
					document.cookie = cName[0] + "=;max-age=0";
				}
			}
		}
	}
	//delete flashData
	if (stMode == 'local') {
		if (storage && storage.length > 0) {
			for (var s = 1, len = storage.length; s < len; s++) {
				if (storage.key(s).indexOf('flash') != -1) {
					if (storage.key(s).indexOf(document.referrer) == -1) storage.removeItem(storage.key(s));
				}
			}
		}
	}
	else if (stMode == 'cookie')__deleteFlashSession();	
	//methods
	this.setUserData = function(name, value)
	{
		if (!name)return;
		var value = (value) ? value : null;
		switch(stMode)
		{
			case 'local':
				if (typeof name == 'string')storage.setItem(name, value);
				else if (typeof name == 'object')
				{
					for (var i in name)arguments.callee(i, name[i]);
				}
			break;
			case 'cookie':
				if (typeof name == 'string')__setSession(name, value);
				else if (typeof name == 'object')
				{
					for (var i in name)arguments.callee(i, name[i]);
				}
			break;
			default : return false;break;
		}
	}
	this.setFlashData = function(name, value)
	{
		if (!name)return;
		var value = (value) ? value : null;
		switch (stMode) {
			case 'local':
				if (typeof name == 'string')storage.setItem('flash_' + location.href + ':' + name, value);
				else 
					if (typeof name == 'object') {
						for (var i in name)arguments.callee(i, name[i]);
					}
				break;
			case 'cookie':
				if (typeof name == 'string') __setSession('flash_' + location.href + ':' + name, value);
				else 
					if (typeof name == 'object') {
						for (var i in name)arguments.callee(i, name[i]);
					}
				break;
			default: return false;
				break;
		}	
				
	}
	this.unsetUserData = function(name)
	{
		if (!name)return;
		switch(stMode)
		{
			case 'local':
				if (typeof name == 'string')
				{
					if (typeof storage.getItem(name) == 'undefined')return false;
					else return storage.removeItem(name);
				}
				else if (typeof name == 'object')
				{
					for (var i = 0, len = name.length; i < len; i++)arguments.callee(name[i]);
				}			
			break;
			case 'cookie':
				if (typeof name == 'string')__deleteSession(name);
				else if (typeof name == 'object')
				{
					for (var i = 0, len = name.length; i < len; i++)arguments.callee(name[i]);
				}			
			break;
			default : return false;break;
		}
	}
	this.userData = function(name)
	{
		if (!name || typeof name != 'string') return false;
		if (stMode == 'local')
		{
			if (typeof storage.getItem(name) == 'undefined')return false;
			return (storage.getItem(name) == null) ? false : storage.getitem(name);
		}
		else if (stMode == 'cookie')return __getSession(name);
		return false;

	}
	this.flashData = function(name)
	{
		if (!name || typeof name != 'string') return false;
		if (stMode == 'local') {
			if (typeof storage.getItem('flash_' + Flint._doc.referrer + ':' + name) == 'undefined') return false;
			return (storage.getItem('flash:' + name) == null) ? false : storage.getItem('flash:' + name);
		}
		else if (stMode == 'cookie')return __getSession('flash_' + Flint._doc.referrer + ':' + name)
		return false;		
	}
	this.sessDestroy = function(){
		if (stMode == 'local') {
			for (var i = 0, len = storage.length; i < len; i++) 
				storage.removeItem(storage.key(i));
		}
		else 
			if (stMode == 'cookie') 
				__deleteAllSession();
	}
});
