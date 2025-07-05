// ZONE
// this defines a geofenced area 
// and a game content whose display is triggered by crossing its perimeter

// the behavior is currently (6/22)


// shaped like pie wedge
// (of which  a full circle is a degenerate case)
// defined in meters and radians, 
// It inherits its lat/lon center from the PIN to which it belongs
// The Zone specifies behavior when the tourist enters or leaves 
// (typically speech or audio perforrmance)
// and identifies 


// zone
// name





import { ll2dm, l2m, m2l, l2p, perill, xy2ll, ll2xy,  ll2d2, opacity, dLat, dLng }  from './util.js';
import perform  from './perform.js';
import newEdit  from './edit.js';
import app from './app.js';

const π2 = 2*Math.PI;
const DEFAULT_RADIUS =100;


const idcounter= 0;

const condition = z=> {
    let str= z.content;     
    z.radius = z.radius ?? DEFAULT_RADIUS;
    if( str) {

        z[ (str.endsWith(".mp3") || str.endsWith(".ogg")|| str.endsWith(".wav"))? 
            "perform" : "speak" ] = str;
        
        console.log( str,   (str.endsWith(".mp3") || str.endsWith(".ogg")|| str.endsWith(".wav"))?  "perform" : "speak");

        delete z.content;
        }
    if(!z.slice && z.start ){ 
        z.slice  = z.start;
        delete(    z.start );
        }
    if( z.speak ) z.speak=z.speak.replace( /<[^>]*>|\&[^;]*;/g,'');
    if( z.peak )  delete z.peak;
    return z;
    }

const properties =[
    "id",
//    "enter",
    "exit",
    "cycle",
    "radius",
    "slice",
    "sweep",
    "text",
    "speak",
    "audio",
    "image",
    "video",
    "next",
    "play" ];
   
const inputType  ={
    id:    "text",
    enter: "button",
    exit:  "checkbox",
    cycle: "number",
    radius:"number",
    sweep: "number",
    slice: "number",
    text:  "text",
    speak: "text",
    audio: "text",
    image: "text",
    video: "text",
    next:  "select",
    play:  "button",
};
       



const touch= { lat:0, lng:0};


export default  context =>{
    const dna =  condition( context.dna); // inition ||//     (context.json? JSON.parse(context.json):false) || 
      
    
    const dom ={            // all DOM nodes that display tour components
        root: context.dom,  // pre-exisiting DOM anchor
        unit: null,        // contains interactive html representation of this zone
        head: null,        // miminimized html representation
        body: null,        // head+body = maximized representation
        field:{}            // a graph of data fields

    };
    
    const map ={           // everything that displays the pin on the map   
        base:   context.map ||  document.querySelector('#map' ),
        arc:    null   // the interactive visual display of the actual zone footprint
        }

    var handling = false;
    var radiusSq = null; // this zone's radius (in latlng) squared,for fast trigger testing (no square root needed)
   
    const  statusStyle = {
        close:         { smoothFactor:.3, fillColor:"red",    color:"blue",   weight:.7, interactive:true  },
        close_exit:    { smoothFactor:.3, fillColor:"cyan",   color:"black",  weight:.7, interactive:true  },
        close_enter:   { smoothFactor:.3, fillColor:"blue",   color:"white",  weight:.7, interactive:true  },
        open:          { smoothFactor:.3, fillColor:"green",  color:"white",  weight:1,  interactive:true  },
        start:         { smoothFactor:.3, fillColor:"white",  color:"black",  weight:1,  interactive:false },
        update:        { smoothFactor:.3, fillColor:"yellow", color:"black",  weight:1,  interactive:false },
        update_pending:{ smoothFactor:.3, fillColor:"black",  color:"red",    weight:1,  interactive:false },
        update_next:   { smoothFactor:.3, fillColor:"purple", color:"red",    weight:1,  interactive:false },
        update_radius: { smoothFactor:.3, fillColor:"yellow", color:"orange", weight:1,  interactive:false },
        update_sweep:  { smoothFactor:.3, fillColor:"orange", color:"red",    weight:1,  interactive:false },
        spent:         { smoothFactor:.3, fillColor:"black",  color:"black",  weight:2,  interactive:false },
        error:         { smoothFactor:.3, fillColor:"red",    color:"red",    weight:1,  interactive:false },
        rim:           { smoothFactor:.3, fill:false,         color:"#080",   weight:3,  interactive:false, dashArray:"6,6" },
        };


        const extendLines = p=>{
            p[0][0] = p[1][0] + 2 * ( p[0][0] - p[1][0]); 
            p[0][1] = p[1][1] + 2 * ( p[0][1] - p[1][1]); 
            p[2][0] = p[1][0] + 2 * ( p[2][0] - p[1][0]); 
            p[2][1] = p[1][1] + 2 * ( p[2][1] - p[1][1]); 
            return p;    
            }


    const fatArrow = line=> arrow( line, { tip: 0.98, height: 0.25, width:.4 } );
        
    const arrow = (line, head = { tip: 0.9, height: 0.125, width:0.2 } )=>{
        if( !line[0].lat )   line = line.map( l=> Object({ lat:l[0], lng:l[1], }) );

        const d =  { lat: line[1].lat-line[0].lat, lng: line[1].lng-line[0].lng };
        const m =  d.lng/(d.lat||0.0001);
        const o =  line[0].lat;
        const b =  line[0].lng - m * o;

        const online = length => {
                let lat = o + d.lat * length;
                let lng = m * lat + b;
                return [ lat, lng];
                }
        const x  = online( head.tip - head.height );
        const xo = x[0];
        const xm = -1 / (m||0.0001);
        const xb = x[1] - xm * xo;
        const xline = length => {
            let lat = xo + d.lat * length;
            let lng = xm * lat + xb;
            return [ lat, lng];
            }
        
        const HEADW = .1 **2;
        // hw = sqrt( x**2 + (m*x)**2  )
        // x**2 +x**2 * m**2 = h**2 
        // x**2 * (1+m**2)= h**2
        // x**2 = h**2/(1+m**2) 
        // x=sqrt(h**2/(1+m**2)) 
        head.width = Math.sqrt( HEADW / (1+xm**2)); 

        return [ online(0), xline(0), xline( head.width/2), online( head.tip ), online(1), online( head.tip ), xline(-head.width/2), xline(0)]
        }



/*
        let θ =  Math.atan2( d.lat, d.lng );
        let Δ =  Math.sqrt(  d.lat*d.lat +  d.lng*d.lng );
        


        let slope    =  (line[1].x-line[0].x) / (line[1].y-line[0].y);
   
*/




    let dsq={};    // a place to keep distance squared numbers for fast evaluation

    let wasIn = false;     // was the player within the zone when last tested?



    
    const self=   {
        

        zone:       true,
        parent:     context.parent,  // the pin to which this zone belongs
     //   if( !parent ) console.error("Zone creation without parent", context);
     //   siblings:   context.siblings,
     //   children:   [],                  // maybe zones will have sub objects someday?


        

        get dna()         {  return dna  }, 

//        get dna.radius()   { return  dna.radius ?? DEFAULT_RADIUS },
//        get id()          {  return dna.id  || self.parent.id+".zone_"+idcounter++      }, 
        get id()          {  return dna.id   }, 
        get name()        {  return String(dna.name || dna.content || dna.id || "Zone" ).substring(0,24)  }, 
        get map()         {  return map                },
        get lat()         {  return self.parent.lat;   },
        get lng()         {  return self.parent.lng;   },
        get latlng()      {  return self.parent.latlng;},
        set lat(l)        {  self.parent.lat= l; },
        set lng(l)        {  self.parent.lng= l; },
        set latlng(ll)    {  self.parent.latlng =ll; },

        get siblings()    { return self.parent.children.filter( z=> z.id != self.id )   },

        get class()       { return dna?.speak? "nav":
                                   dna?.audio?.match(/([^\/]+)\/[^\/]*(\.mp3|\.ogg|\.wav)$/ )?.[1]     },


    construct: ()=>{
      self.inform( dna );
         },



// open:  editing =>{  
//    self.siblings.forEach( p=>p.close() );
//    self.render( {status:"open"} );
//    //------------------  
//    map.arc.off(                'mousedown', self.open  );
//    map.arc.on(                 'mousedown', self.start );   
//    map.base.on(                   'click',  self.close );
//    map.base.dragging.enable();
   
// },


// start: e=>{
//    self.render( {status:"start"} );
//    //------------------  
//    map.arc.off(                'mousedown', self.start  );
//    //------------------  
//    Object.assign( touch, e.latlng);
//    touch.event= e;
//    touch.timer= setTimeout(                    self.longtouch, touch.time );
//    map.base.on(                   'mousemove', self.shorttouch );
//    map.base.on(                     'mouseup', self.end        );
//    map.base.dragging.disable();
//    },

// longtouch: e =>{   
//    return;
//    console.log( "CLICK LONG");
//    self.editing = "next"
//    map.base.off( 'mousemove',    self.shorttouch );
//    map.base.on ( 'mousemove',    self.update     );
//    map.base.on ( 'mouseup',      self.end    );   
//    map.arc.on  ( 'mouseup',      self.end    );
//    self.update( touch.event ); 
//    },

// shorttouch: e=>{
//    console.log( "CLICK SHORT");
//    if (e.originalEvent.buttons!=1) return;
//    touch.radius =  ll2dm(  self, e.latlng);
//    touch.dna    =  { ...dna };
//    //if( len < 12 ) return;

//    console.log( "CLICK SHORT2");
//    clearTimeout( touch.timer ) //     longtouch
//    map.base.off( 'mousemove',    self.shorttouch );
//    map.base.on ( 'mousemove',    self.update     );
//    map.base.on ( 'mouseup',      self.end    );   
//    map.arc.on  ( 'mouseup',      self.end    );

//    let onEdge = Math.abs( dna.radius -touch.radius )/dna.radius < .08; 

//    self.editing = onEdge?   "radius" : "sweep"; 
//    self.update(e); 
//    },


   open:  e =>{  
    if (!e || e.originalEvent.buttons!=1 ) return;
    if( !["editor","developer"].includes( localStorage.getItem("role")) ) return; 

    self.siblings.forEach( z=>z.close() );
    self.render( {status:"open"} );

    map.arc.off ( 'mousedown',  self.open    );
    //------------------  
    map.base.on ( 'mousemove',  self.update  );
    map.base.on ( 'click',      self.end     );
    map.base.on ( 'mouseup',    self.end     );
    map.base.dragging.disable();

    touch.event= e;
    Object.assign( touch, e.latlng);

    touch.radius =  ll2dm(  self, e.latlng);
    touch.dna    =  { ...dna };
 
    let onEdge = Math.abs( dna.radius -touch.radius )/dna.radius < .08; 
    self.editing = onEdge?   "radius" : "sweep"; 
    },
 
end: ()=>{
    map.base.off(  'click',     self.end    );
    map.base.off(  'mouseup',   self.end    );
    map.base.off(  'mousemove', self.update );
    map.arc.on(    'mousemove', self.open   );
    map.base.dragging.enable();
    self.render(   {status:"closed" } );
    //    self.open();
    //     radius= dna.zones.reduce( (biggest, z) => (z.radius.max >biggest)? z.radius.max:biggest, 0  );
         },
     
 

update: e=>{// zone only----    
   const THRESHHOLD= .003**2;  // mouse distance (in latlng) within which a pin is selected as "next"
   const rZero  =  30;         // smallest radius supported (in meters)
   let   sweepZer0 =     .03;// narrowest sweep supported ( in turns)
   let  update={};
 
   // UNITS:  zone distance in Meters 
   //         zone angles   in Turns   ( 1 turn = 360 degrees = 2PI radians
    

 
    if( self.editing == "radius" && e ) 
        update = { status:"update_radius",  radius: Math.max( rZero, ll2dm( self, e.latlng  )) } ;
      

    if( self.editing == "sweep" ) {
        let dLng = l2m( self.lng- e.latlng.lng);
        let dLat = l2m( self.lat- e.latlng.lat);
        let radius = Math.max( rZero, Math.sqrt( dLat*dLat +  dLng*dLng ) );
        let unit       = 2    * dna.radius;
        let threshhold = 0.25  * unit;
        // let sweep = radius<= threshhold? false : 
        //              1-3*(Math.min( unit-minimum, Math.max( radius, threshhold +minimum ))-threshhold) / (unit-threshhold);

    // sweep is the fraction of the full circle which is sensitive; slice is the starting angle. Both are unit circle measures (0-1).
    // when editing: the cursor always remains at the center of sweep
    // radial cursor motion increases or reduces sweep, while slice is compensated to keep cursor centered      
    // angular motion rotates the zone by increasing/decreasing only slice
        let sweep = ( touch.dna.sweep ?? 1 ) - ((radius- touch.radius)/dna.radius)*2 ;
        sweep = sweep>0.99 ? false : Math.max( .01, sweep);

        let slice = !sweep?      false :
                      Math.atan2( dLat,dLng )/π2 + (1-sweep)*.5; 
     
        update = { status:"update_sweep",  slice, sweep };
        }

    if( self.editing == "next"  ) 
            update  = { status:"update_next",   next:               // next = nearest pin to the pointer, or dummy pin with no id
                self.parent.siblings.filter( pin=>pin!=self.parent)
                    .reduce( (nearest, pin)=> {
                            let d2 =  ll2d2( pin, e.latlng);        
                            return   (nearest && nearest.d2 <d2)? nearest : (d2 < THRESHHOLD ? {pin, d2}  : false);
                    }, false )?.pin?.id ?? e.latlng };   

        

    console.log( self.editing, update );
    self.render( update );

    ///--------------
   
   },

    close: ()=>{ },
    hide: ()=>{ },
    delete: ()=>{
        //todo        
        map.base.off( 'mouseup',   self.end    );
        map.base.off( 'mousemove', self.update );
        map.arc?.remove();
        map.rim?.remove();
        map.sector?.remove();
        let i= self.parent.children.findIndex( s=> s==self );;
        console.log( "Found ", i, self.parent.id, self.parent.children.length);
        self.parent.children.splice( i, 1);
        self.parent.dna.zones.splice( i, 1);
        self.parent.render();
        },
    destruct: ()=>self.delete(),

    render: update =>{
        // apply update
        Object.assign( dna,  update ?? {} );     
  
        //Object.assign( dna, self.exform(), update ?? {} );
        // clear any existing Zone diagram from map
        if( map.arc        ) map.arc.remove(); 
        if( map.rim        ) map.rim.remove(); 
        if( map.sector     ) map.sector.remove();
        if( map.next       ) map.next.remove(); 
        if( map.nextpath   ) map.nextpath.remove();


        
        if( update?.radius ) radiusSq = m2l( dna.radius )**2;

        if( dna.status=="hidden" )  return;

        let nextIsRealPin = typeof dna.next=="string";
        let nextll = nextIsRealPin? self.parent.parent.getPin( dna.next ) : dna.next;
        let nextpt = nextll? [ nextll.lat, nextll.lng ] : [0,0];
        if(!nextIsRealPin ) delete dna.next;

        let r    = m2l ( dna.radius );           // arc radius in ll       
        let θMin = π2 * (dna.sweep?              dna.slice  : 0);  // arc start angle in rad
        let θMax = π2 * (dna.sweep? (dna.sweep + dna.slice) : 1);  // arc end angle in rad
        let chord= π2 * 1/120;                                     // arc approximation step size in rad

        let outlines=[ [],[] ];                                    // an arrray of arrays (to support holes))
        
        
    // draw arc
        let outline= outlines[0]; 
        for ( let   θ=θMin;   θ<θMax;  θ+= chord)
            outline.push(              perill( self.parent, r, θ ));
        outline.push(                  perill( self.parent, r, θMax ));     
        let rim = [...outline];
        if( dna.sweep )  outline.push( perill( self.parent, 0, 0 ));
        let arcMidPoint = outline[ Math.floor(outline.length/2)];
/*
oz
7088
7200
*/
    //punch hole
        let thickness=   r/2;    
        let r2 =  r + (dna.exit? thickness: -thickness);
        outline= outlines[1]; 
        for ( let   θ=θMax;   θ>θMin;  θ-= chord)
            outline.push(              perill( self.parent, r2, θ ));
        outline.push(                  perill( self.parent, r2, θMin ));
        if( dna.sweep )  outline.push( perill( self.parent, 0, 0 ));

        let status = (dna.status || "close" )
            + (dna.status!="close"? "" :
                ( dna.exit? "_exit" :"_enter" ));

        // let options = statusStyle[ status ];
        // options.pin  = self.parent.id;
        // options.zone = dna.id;
        
        map.arc = L.polygon( outlines, statusStyle[ status ] ).addTo( map.base );
        map.arc.id= { pin:self.parent.id, zone:dna.id}; 
        map.rim = L.polyline( rim, statusStyle[ "rim" ] ).addTo( map.base );

        if( dna.next && self.parent.parent.showNext )
            map.nextpath = L.polyline(   arrow([arcMidPoint, nextpt]), { fill:"blue", color:"blue", width:10, dashArray:"4,8"} ).addTo( map.base );
            


        // CAN YOU GET RID OF UPDATE_RADIUS & UPDATE_SWEEP & UPDATE_SWEEP?

        let closed = !" open start update end".includes( dna.status );


        if( status.includes("update" )){
            closed=false;
            let path = [...outlines[0]]; 
            if( self.editing== "sweep" && dna.sweep )  {
                path =  [ path[0], [self.lat,self.lng], path[path.length-2] ];
                path = extendLines( path )
                }
            else if( self.editing== "next" )   path =  fatArrow( [ arcMidPoint, nextpt ]);
            else path.pop();
            map.sector = L.polyline(   path, { color:"purple", dashArray:"4,8"} ).addTo( map.base );
            
            if( self.editing== "next" && dna.next )
                map.next = L.circleMarker( nextpt, {radius:40, fill:false, color:"purple", width:15}).addTo( map.base );
            }
    map.arc.on(  'mousedown',   self.open  );
    map.arc.on(  'contextmenu', e=> newEdit( self, e)  ); //self.popup );
     },
    

    spawn:  ()=>{ },
    inform: ()=>{ },
    xxform: ()=>{ },    
    exform: ()=>{ },    
    
    detect: probe =>{  // in LatLan space
        

        if( !self.parent.detectable())  return false;

        probe= probe.now ?? probe; // deprecated data format


        let wasWithin= dna.within ?? false;  // saved in dna for state persistence in localStorage

        let dLat = probe.lat - self.parent.lat; //  pin.latlng.lat;  
        let dLng = probe.lng - self.parent.lng; //  pin.latlng.lng;      ;
        let rSq  =  dLat*dLat + dLng*dLng;


        
        
        radiusSq ??= m2l( dna.radius )**2;
        dna.within=  rSq <= radiusSq;


        if( dna.within == wasWithin )   return false;  // no perimeter crossing
        if( dna.within &&  dna.exit )   return false;  // entered an Exit Zone
        if(!dna.within && !dna.exit )   return false;  // exited  an Enter Zone
        if(!dna.sweep               )   return true;   // no need to test angle

        let slice = (dna.slice+5)%1;       // range:    0<= slice <1
        let sweep = (dna.sweep+5)%1;       // range:    0<= sweep <1
        let s  = Math.atan2( dLat,dLng );  // radians
        s  = s/π2           ;              // turns
        s  = s+5-slice;                    // 4 < s < 6  
        s  = s%1;                          // 0<= s  <1
        return  s<=sweep;        
 


},



    perform: () =>
                ["audio","image","video","speak","text"].forEach( medium=>{
                       if(    dna[medium] ) 
                          perform[medium]
                            ( dna[medium] )
                            .catch( console.warn  );  }),    
    
    trigger: probe =>  {
        if( dna.status!="spent"  &&  self.detect( probe )) {
            self.perform( dna.content );
            const memo =  {
                pin:  self.parent.dna.id,
                zone: dna.id ?? self.parent.dna.zones.findIndex( zdna => zdna==dna  ),
                };
            if( dna.content )  memo.content = dna.content;
            app.tour.analytics.memo(memo);

            self.render( {status:"spent"});
            setTimeout( ()=>  self.render( {status:"close"}), (dna.cycle ?? 180)*10 );//1000
            app.tour.setNext( dna.next );  
            }
        }
    };
    self.construct();
    self.close();
    return self;
    } 







    const svggrads=`
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 500 250" version="1.1">
    <defs>
        <radialGradient id="enter-grad"  >
            <stop stop-opacity="0"  stop-color="lightblue" offset="50%"/>
            <stop stop-opacity=".3" stop-color="blue"      offset="85%"/>
            <stop stop-opacity=".7" stop-color="purple"    offset="95%"/>
            <stop stop-opacity=".3" stop-color="black"     offset="97%"/>
            <stop stop-opacity="0"  stop-color="black"     offset="100%"/>
        </radialGradient>
        <radialGradient id="exit-grad" x1="50%" >
            <stop stop-opacity="0"  stop-color="black"     offset="75%"/>
            <stop stop-opacity=".3" stop-color="black"     offset="77%"/>
            <stop stop-opacity=".7" stop-color="purple"    offset="80%"/>
            <stop stop-opacity=".3" stop-color="blue"      offset="85%"/>
            <stop stop-opacity="0"  stop-color="lightblue" offset="100%"/>
        </radialGradient>
    </defs>


    <circle r="75"  cx="270" cy="90" fill="url(#enter-grad)" />
    <circle r="100" cx="90" cy="90" fill="url(#exit-grad)"  />
</svg>`;