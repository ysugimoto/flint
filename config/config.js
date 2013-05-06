/**
 * @author sugimoto
 */

CodeIgniter.config = {
	//chenge your site url
	site_url : 'http://example.com/your_seezoojr_dir/',
	
	//if use google map API, change state to 'true';
	//true : use google map API
	//false : unuse google map API
	useGmap : false,
	
	//if use googlemap API, insert your API key.
	GmapAPIkey : 'your_googlemap_api_key',
	
	
	//define google map API path.
	GmapAPI_path : 'http://maps.google.com/maps?file=api&amp;v=2&amp;key=',
	
	//initialize set center point
	Gmap_initPoint : '',
	
	
	//debug mode
	debugMode : true,
	
	//use output profiler
	useProfiler : false,
	
	//autoload library
	autoload_Library : [],
	
	//autoload helper
	autoload_Helper : [],
	
	//autoload models
	autoload_Models : [],
	
	//use modules
	useModules : ['ci_modules', 'canvasapi'],
	
	//IE fix
	//positionFix : element style 'posision:fixed' enables in IE6.
	//floatFix    : element style margin bug fix for 'float' in IE6.
	//pngFix      : image or backgroundImage in 'png' extentions fix in IE6.
	IEFix : {
		positionFix : true,
		floatFix	: true,
		pngFix		: false
	},
	
	//routing mode
	//load Controller and execute method decide from these mode.
	// 'none'	 :  
	// 'default' : load Controller from attribute 'src' in <script>. execute method from attirbute 'id' in <script>.
	// 'query'   : query base approache. load Controller from 'load=' of parameter. execute method from 'method=' of parameter. 
	// 			   if you use this mode, other parameters supply method arguments.
	// 'segment' : segment base approache. load Controller from first segment after site_url. execute method from second segment after site_url. 
	// 			   if you use this mode,other parameters supply method arguments.
	// 			   if you use CodeIgniter, please set this mode is 'segment'.
	routingMode : 'default',
		
	//cookie config
	//cookie prefix
	cookieName		: 'ciCookie',
	cookieDomain	: '',
	cookiePath 		: '/',
	cookieMaxAge	: 0,
	cookieDelimiter : '&',
	cookieSeparator : ':'
}

