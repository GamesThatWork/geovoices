export { l2m, m2l, l2p, perill, xy2ll, dLat, dLng, ll2xy, ll2dm, ll2d2, 
        titleCase, opacity, idcounter, statusColor, requestedTour 
    }; 
 

const defaultPin = { lat:33.983667, lng:-84.181541 };

const idcounter = { tour:0, pin:0, zone:0 }
//degrees to meters
const l2m   =  l => l*111000;

// meters to degrees
const m2l   =  m => m/111000;

//degrees to pixels
const l2p   =  l => Math.round(
                    map.project( [     defaultPin.lat, defaultPin.lng] ).y -
                    map.project( [ l + defaultPin.lat, defaultPin.lng] ).y); 

const perill = (c,r,θ) =>[ c.lat + r * Math.sin( θ+4*Math.PI ), c.lng + r * Math.cos( θ+4*Math.PI ) ];

// x/y pixel (on current map) to lat/lng degrees
const xy2ll  =  p  => map.unproject( L.point(  p  ).add(       map.getPixelBounds().min ).round() );    

// lat/lng degrees to x/y pixel (on current map) 
const ll2xy  =  w  => map.project(             w  ).subtract(  map.getPixelBounds().min ).round()  ;    


const dlat    =  (a,b) => a.lat-b.lat; 
const dlng    =  (a,b) => a.lng-b.lng; 

const dLat    =  (a,b) => Math.abs( dlat(a,b) ); 
const dLng    =  (a,b) => Math.abs( dlng(a,b) ); 


// distance (in meters) between two latlng points
const ll2dm  =  (a,b) => l2m( Math.sqrt( (a.lat-b.lat)**2 + (a.lng-b.lng)**2)); 

// distance squared between two latlng points
const ll2d2   =  (a,b) => (a.lat-b.lat)**2 + (a.lng-b.lng)**2;

  
const opacity= {    zero: {opacity:0,   fillOpacity:0  }, 
                    thin: {opacity:1,   fillOpacity:0.2},
                    full: {opacity:0.4, fillOpacity:1 }   };



const statusColor ={
    wait:   "grey",
    ready:  "violet",
    within: "lavender",
    sim:    "lavender",
    error:  "red", 
    edit:   "blue",
    locus:  "green",
    radius: "yellow",
    sweep:  "orange",
    next:   "gold",
    hover:  "white"
    };




const requestedTour =()=>{
    let tour = new URLSearchParams(window.location.search).get("tour")
        ?? document.location.href.match( /([^\/]*)\.geovoices/i )?.[1] 
        ?? document.location.href.match( /([^\/]*)\.localhost/i )?.[1]        
        ?? document.location.href.split("/").pop()
        ?? null; 
    return  /open/i.test(tour)? null : titleCase( tour );
}

/*
 * Title Caps
 * 
 * Ported to JavaScript By John Resig - http://ejohn.org/ - 21 May 2008
 * Original by John Gruber - http://daringfireball.net/ - 10 May 2008
 * License: http://www.opensource.org/licenses/mit-license.php
 */
 
const small = "(a|an|and|as|at|but|by|en|for|if|in|of|on|or|the|to|v[.]?|via|vs[.]?)";
const punct = "([!\"#$%&'()*+,./:;<=>?@[\\\\\\]^_`{|}~-]*)";
const lower = word=> word.toLowerCase();
const upper = word=> word.substr(0,1).toUpperCase() + word.substr(1);
  
const titleCase = title=>{

    if(!title) return title;

    title= title.replace(/[_-]/g, " ");

    var parts = [], split = /[:.;?!] |(?: |^)["Ò]/g, index = 0;
	while (true) {
        var m = split.exec(title);
            parts.push( title.substring(index, m ? m.index : title.length)
                .replace(/\b([A-Za-z][a-z.'Õ]*)\b/g, function(all){
                    return /[A-Za-z]\.[A-Za-z]/.test(all) ? all : upper(all);
                })
                .replace(RegExp("\\b" + small + "\\b", "ig"), lower)
                .replace(RegExp("^" + punct + small + "\\b", "ig"), function(all, punct, word){
                    return punct + upper(word);
                })
                .replace(RegExp("\\b" + small + punct + "$", "ig"), upper));
            
            index = split.lastIndex;
            
            if ( m ) parts.push( m[0] );
            else break;
        }
        
        return parts.join("").replace(/ V(s?)\. /ig, " v$1. ")
            .replace(/(['Õ])S\b/ig, "$1s")
            .replace(/\b(AT&T|Q&A)\b/ig, function(all){
                return all.toUpperCase();
            });
	};
    
