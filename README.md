# Cherokee Geo Tour
Geospecific audio delivery system to provide a motor tour of Cherokee oral tradition in the Cherokee homeland

## Technology
- PWA / Serviceworker caching
- Geolocation API
- Leaflet / openstreetmap map display
- SQLite3 Database

#### made by [GamesThatWork](http://gamesthatwork.com/) and the [Museum of the Cherokee Indian](https://motcp.org)


 ----------------------------------------------------------


## Documentation

#### API  (Server)
except as noted
 * all requests are GET 
 * all responses are HTML

### App and tour development

**/**
	load general player/editor app

**/version**
	current version number (JSON)

**/tours**
	names of all current tour files (JSON array)

**/tour/:tourname**
	tour definition json file
	use GET (download) or POST (upload)
    tourname does not use path or extension
	
	both tours and tour have deprecated v0.4/tour(s) variant

**/contents?medium=""&folder=""**
    lists available content in named cloud (eg:AWS) folder
	filtered by (single) medium: (audio,video,image)	
	example: .../contents?medium=audio&folder=cherokee/story

**/content**
    POST content file to cloud

**/files/:medium/:folder**
	standalone version of 'contents' above
	returns interactive html page



**/reset**
	remove serviceworker (does NOT empty caches)

**/clear**
	empty caches (requires serviceworker)




### Experimental/ Developmental/ Site Survey

	



**/qos**
	load gps quality of service mapping app

**/map**
	load gps position mapping application 

**/fixes?runs=(comma,delimited,list,of,session,numbers)**
    dump contents of named sessions (JSON array)

**/mark?session=(number)&id=(numbers)**
    individual data point from specific session  (JSON)

**/pts**
	all fixes (JSON array of tracking data)

**/null**
	alias of pts

**/track**
	alias of pts

**/path**
	alias of fixes

**/tour/upload/:tourname**
    POST tour definition  //deprecated

**/qos/upload/:filename**
    POST gps qos survey  

**/cache/upload/:filename**
    POST contents of serviceworker cache 

**/getSession** 
    POST name and devicename; receive identifier of new session  (JSON)

**/add**
	store datapoint (fix, qos reading, pin) into database


 **/cachemenu**
 **/cachereset**

 **/cacheclear**
 **/cacheview**
 **/cacheupload**
