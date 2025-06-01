import newPin   from './pin.js';
import perform  from './perform.js';
import newEdit  from './edit.js';
import url      from './url.js';
import nav      from './nav.js';
import {idcounter, ll2dm}    from './util.js';
import app      from "./app.js"
import geo      from "./geo.js"
import menu     from "./menu.js"



const dragEnable = (selector, handleselector=".handle") => {
    var x=0, y=0, dx=0, dy=0;
    var element= document.querySelector( selector );
    var handle = element.querySelector(  handleselector ) || element.firstChild || element;
    var drag= {
        start:  e => {
            e = e || window.event;
            e.preventDefault();
            x = e.clientX;
            y = e.clientY;
            document.onmouseup   = drag.end;
            document.onmousemove = drag.update;
            },
        update:     e=> {
            e = e || window.event;
            e.preventDefault();
            dx = e.clientX - x;    x = e.clientX;  
            dy = e.clientY - y;    y = e.clientY;
            element.style.left  = (element.offsetLeft + dx ) + " px";
            element.style.top   = (element.offsetTop  + dy ) + "px";
            },
        end:  e=>  document.onmouseup =  document.onmousemove = null
        }
        handle.onmousedown = drag.start;
    } 







export default  context=> {


    const condition = dna=>{
        if( dna.center ) {
            dna.lat= dna.center.lat;
            dna.lng= dna.center.lng;
            delete dna.center;
            }
        dna.id = dna.id?? dna.name?? "New Tour";
        delete  dna.name;  
        return dna;  
    }


    // remove ephemeral data in preparation for saving edited file
    const clean = d=>{
        delete d.status;
        delete d.name;
        d.pins.forEach( p=>{
            if( self.getPin( p.id).dna != p ) {
                let [ dummy, name, version ] = p.id.match( /(.*?)(\d*$)/);
                p.id = name+ (Number( version??0 )+1);
                console.log( "rename pin: ", {name, version, rename:p.id});
                }
        delete p.status;
        delete p.name;
        p.zones.forEach( (z,i) =>{
            if(   !z.id )   z.id="Zone_"+i;
            delete z.status;
            delete z.name;
            delete z.enter;
            delete z.within;
            delete z.visited;
            if( !self.getPin( z.next )) delete self.next;
            ["cycle","exit","radius","sweep","slice","audio","image","video","speak","text","next"].forEach( k=>
                {if( z.hasOwnProperty(k) && !z[k] ) delete z[k];} );
        })
        })
        return d;
    }


    const nextPin = ()=>{ // factory function that returns a single function whihc maintains some static data
        let pin, interval; 
        return pinName=> {
            let root = document.querySelector("#gauge" );
            clearInterval( interval);
            
            pin = self.getPin( pinName);
            root.hidden= !pin;

            if( pinName =="end" )   setTimeout( menu.feedback, 2000   );
            else if( !pin )         self.children[0]?.next({ none:true })
            else{
                pin.next();
                root.innerHTML= (pinName.toLowerCase() =='start')?
                `<div  class="start">
                    <p><span class="dist"></span><span> to Start&nbsp;Point.</span></p>
                    <p>Tour begins when you arrive.</p>
                </div>`
            :   `<span class="dist"></span> to <span class="name">${pinName}</span>`;
                let distance = root.querySelector(".dist" );
                let update   =()=> {
                    let meters    = pin? ll2dm( pin.dna, nav.current ) : 0;
                    let miles     = meters/1609.34;
                    let precision = miles<.3? 3: (miles<.6? 2:(miles<2? 1:0));
                    distance.innerText= `${miles.toFixed( precision )} ${miles<1.3? "mile":"miles"}`;
                    }
                interval = setInterval( update, 3000);
                update();
                }
            }
        }




    const dna = condition( 
         context.tour
        || (context.json? JSON.parse(context.json):false ) ); // deprecate this!
 
    const map={};    

    const self=   {
        tour:           true,
        parent:         null,        // maybe we will edit multiple tours one day
        siblings:       [],          // maybe we will edit multiple tours one day    
        children:       [],

        showNext:      false,
        get dna()      {  return dna  },  
        get map()      {  return map  }, 
        get id()       {  return dna.id  || dna.author+".tour_"+idcounter.tour++      }, 
        get lat()      { return dna.lat; },
        get lng()      { return dna.lng; },
        get latlng()   { return { lat:dna.lat, lng:dna.lng };  },
        set lat(l)     { dna.lat= l; },
        set lng(l)     { dna.lng= l; },
        set latlng(ll) { dna.lat= ll.lat;  dna.lng= ll.lng; },
        
        contextmenu:   e=> newEdit( self, e),  
 

        construct: ()=>{   
          geo.launch();
          map.base = app.map;
          map.wrap = map.base.getContainer();
            if( self.lat )   map.base.setView( self, 12);
            let testaudio= ()=> perform.speak("Cherokee Voices Geotour");
            dna.pins.forEach( pdna => self.spawn( pdna ));
            self.close();
            },
        open: ()=>{
            self.render( {status:"open"} );
            self.children.forEach( p=>p.open());
            map.base.on('contextmenu', self.contextmenu );  
            },
        start:  ()=>{ },
        update: ()=>{ },
        end:    ()=>{ },
        close: ()=>{
            self.render( {status:"close"} );
            self.children.forEach( p=>p.close()); 
            map.base.off('contextmenu', self.contextmenu );  
            },
        hide: ()=>{ self.render( {status:"hide"} );             },
        destruct: ()=>{
            self.close();
            self.children.forEach(p =>p.destruct()); 
            },
        render: dnaUpdate =>{
            Object.assign(   dna, dnaUpdate || {} );
            self.children.forEach( p=> p.render() );
            },
        exform: ()=>{ },
        inform: ()=>{ },
        spawn: newdna=> {
            if( !dna.pins.includes( newdna )) dna.pins.push( newdna);
            let p= newPin(  {
                dna:       newdna,
                parent:    self,        
                siblings:  self.children,
                map:       map.base
                });
            self.children.push ( p );
            p.open();
            p.render();
            },
        upload: (e)=>
            fetch( url.tour.save + self.dna.id, { method:'post', body:JSON.stringify( clean( dna ))  })
                .then( response => response.text() ),
        updateTIP: tip=> localStorage.getItem('tour')? self.store( tip ) : null, // allow functions to clear TIP w/o autosave spoilingit
        store:    (tip={}) => localStorage.setItem('tour', JSON.stringify( Object.assign( {}, dna, tip, {timestamp:Date.now()} ) )),  // save TIP locally with optional staus
        save:  ()=>{
            dna.version+=0.01;  
            self.store();
            return self.upload();
            },
        restart: ()=>{
            delete dna.status;
            dna.pins.forEach( p=>{
                    delete p.dna.status;
                    p.zones.forEach( z=>
                        delete z.dna.status )})
            self.store( dna );
            location.reload();
            },
        track: (ll, options )=>{                   //display
            const bit=.0003,  {lat,lng} =ll, {pan,zoom}=options;
            const z = zoom ?? app.map.getZoom();
            if( self.trackMarker ) self.trackMarker.remove();
            else                   map.wrap.classList.add( "track")
            self.trackMarker     = L.imageOverlay(  url.map.car, [[ lat-bit, lng-bit],[lat+bit, lng+bit]] ).addTo( app.map );
            if( pan ) app.map.setView( ll, z );
            },
        untrack: ()=>{     
            if( self.trackMarker ) self.trackMarker.remove();
            map.wrap.classList.remove( "track");
            self.trackMarker     = null;
            },
        reset: app.reset, 
        setNext: nextPin(),
        getPin: id=> self.children.find( pin=>id==pin.dna.id ),
        trigger: probe =>                   
            self.children.forEach(  pin => 
                pin.children.forEach( zone=> 
                    zone.trigger( probe ))),
        usage:{
            cache: [{ 
                    user:       app.userID ?? 0,
                    timestamp:  Date.now(),
                    tourname:   dna?.id      ?? "",
                    version:    dna?.version ?? 0,
                    pin:        "app.launch",
                    zone:       0                   
                }],
            memo: data=>{
                self.usage.add( data );
                self.usage.upload();
                },
            add:  data => self.usage.cache.push( Object.assign(
                {   user:        app.userID,
                    timestamp:   Date.now(),
                    tourname:    dna.id,
                    version:     dna.version,
                    pin:         "",
                    zone:        0
                }, 
                data)),
            upload: (e)=>
                self.usage.cache.length?
                    fetch( url.usage.save, { method:'post', body:JSON.stringify(self.usage.cache) })
                        .then(  response => response.text() )
                        .then(  console.log )
                        .then(  ()=> self.usage.cache.length=0 )
                        .catch( console.error )
                : null,
            }    
        }

    self.construct();
    self.open();
    return self;
    } 