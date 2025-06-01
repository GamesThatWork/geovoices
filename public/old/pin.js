import { idcounter }  from './util.js';
import url     from './url.js';
import newZone from './zone.js';
import newEdit from './edit.js';





const condition = p=> {
    // if(!p.tags && p.tag ){ 
    //     p.tags =  p.tag;
        //if( !Array.isArray( p.tags)) p.tags=[p.tags];
        delete(   p.tag );
        // }
    return p;
    }


export default  context =>{


    const tags= ['default','stop','story','guide','nav','music'];
    const pinStyle={
        stop:    { color:  "red",     opacity: 1.00,  showZones: false },
        story:   { color:  "violet",  opacity: 1.00,  showZones: false },
        history: { color:  "blue",    opacity: 1.00,  showZones: false },
        guide:   { color:  "blue",    opacity: 1.00,  showZones: false },
        nav:     { color:  "grey",    opacity: 1.00,  showZones: false },
        open:    { color:  "green",   opacity: 1.00,  showZones: false },
        touch:   { color:  "orange",  opacity: 1.00,  showZones: false },
        update:  { color:  "yellow",  opacity: 1.00,  showZones: false },/*gold*/
        live:    { color:  "yellow",  opacity: 1.00,  showZones: false },/*gold*/
        close:   { color:  "grey",    opacity: 1.00,  showZones: false },
        hide:    { color:  "grey",    opacity: 1.00,  showZones: false },
        active:  { color:  "green",   opacity: 1.00,  showZones: false },
        start:   { color:  "orange",  opacity: 1.00,  showZones: false },
        edit:    { color:  "yellow",  opacity: 1.00,  showZones: false },
        neutral: { color:  "grey",    opacity: 1.00,  showZones: false },
        error:   { color:  "grey",    opacity: 1.00,  showZones: false },
        spent:   { color:  "black",   opacity: 1.00,  showZones: false },
        default: { color:  "grey",    opacity:  .30,  showZones: false },
        next:    { color:  "orange",  opacity: 1.00,  showZones: true  },
        ready:   { color:  "green",   opacity:  .5,   showZones: true  },
        inert:   { color:  "black",   opacity:  .33,  showZones: false },
    }
    let iconDoubleSize=false;
    Object.values( pinStyle ).forEach( s=>
        s.icon = new L.Icon({
          iconUrl:  `${url.map.pins}marker-icon${s.doubleSize??iconDoubleSize?"-2x":""}-${s.color}.png`,
          shadowUrl:   url.map.pinshadow,
          iconSize:    [25, 41],
          iconAnchor:  [12, 41],
          popupAnchor: [1, -34],
          shadowSize:  [41, 41]
         } ) );


     const dna =  condition( context.dna
        || (context.json? JSON.parse(context.json):false ) // deprecate this!
        || {});

    const map ={           // everything that displays the pin on the map   
        base:   context.map,
        handle: false,
        };
    
    const self=   {
        pin:            true,
        parent:         context.parent,            // the tour to which this pin belongs
        siblings:       context.parent.children,   // siblings + me
        children:       [],                        // all zones belonging to this pin
        
        get map()         {  return map  }, 
        get dna()         {  return dna  }, 
        get id()          {  return dna.id  || "Pin_"+idcounter.pin++  }, 
        get name()        {  return String(dna.name || dna.notes || dna.id || "Pin" ).substring(0,64)  }, // wwas 24, mqde it 64
        get notes()       {  return dna.notes ||    "[unnamed Pin]"          },
        get latlng()      {  return {   lat: dna.lat, lng:dna.lng }; },
        get lat()         {  return dna.lat; },
        get lng()         {  return dna.lng; },
        set latlng(ll)    {  Object.assign( dna, ll); },
        set lat(l)        {  dna.lat= l; },
        set lng(l)        {  dna.lng= l; },
    

    construct: ()=>{   },
    open: ()=>{
        if( !["editor","developer"].includes( localStorage.getItem("role")) ) return; 
        self.render( {status:"open"} );
        map.handle.off(                'click',     self.open  );
     // map.base.on(                   'click',     self.close );
        map.handle.on(                 'mousedown', self.start );   
        map.base.dragging.enable();
        },
    start: ()=>{
        self.render( {status:"start"} );
        map.handle.off(                'mousedown', self.start  );
        map.base.on(                   'mousemove', self.update );
        map.base.on(                     'mouseup', self.end    );
        map.base.dragging.disable();
        },
    update: e=>{
        self.latlng = e.latlng;
        self.render( { status:"update" } );
        },
    end: ()=>{
        map.base.off(            'mouseup',   self.end    );
        map.base.off(            'mousemove', self.update );
        self.open();
        },
    close: ()=>{
        self.children.forEach( z=> z.close() );
        self.render( {status:"close"} );
        map.base.dragging.enable();
    //------------------                   
        map.base.off(               'mouseup',     self.end     );
        map.base.off(             'mousemove',     self.update );
        map.base.off(                 'click',     self.close  );
        map.handle.off(         'contextmenu',     self.spawnhere );
    //------------------  
//      map.handle.on(                'click',     self.open   );
        map.handle.on(                 'mousedown', self.start );          },

    next:  q =>{
        self.siblings.forEach( pin=> pin[ (q?.modal && !q?.none)? "inert" : "ready" ]() ); 
        if(!q?.none) self.render( { status:"next"  } );
        },
    ready: ()=>      self.render( { status:"ready" } ),
    inert: ()=>      self.render( { status:"inert" } ),
    hide:  ()=>      self.render( { status:"hide"  } ),
    destruct: ()=>{
        self.close();
        self.children.forEach( z=>z.destruct() );
        map.base.off(                       'click',         self.close );
        map.base.off(                       'mousemove',     self.update   );
        map.base.off(                       'mouseup',       self.end     );
        if( map.handle ){
            map.handle.off(  'mousedown', self.start  );
            map.handle.off(  'click',     self.open  );
            map.base.removeLayer( map.handle  );
            map.handle = false;
            }
        },
    delete: ()=>{
        self.close();
        let z;
        while ( z= self.children.shift())   z.delete();
        //self.children.forEach( z=>z.delete() );
        map.base.off(  'click',         self.close );
        map.base.off(  'mousemove',     self.update   );
        map.base.off(  'mouseup',       self.end     );
        if( map.handle ){
            map.handle.off(  'mousedown', self.start  );
            map.handle.off(  'click',     self.open  );
            //map.base.removeLayer( map.handle  );
            map.handle?.remove();
            //map.handle = false;
            }
        let i= self.parent.children.findIndex( s=> s==self );;
        self.parent.children.splice( i, 1);
        self.parent.dna.pins.splice( i, 1);
        self.parent.render();
        },

    render: dnaUpdate =>{
        Object.assign( dna, dnaUpdate || {} );

        let status= (dna.status=="close")? (String(dna.tags??"").split(",")[0]??'default') : (dna.status ||"error");
        status = dna.status;

//      self.children.forEach( z=> z.render( { status: pinStyle[status].showZones? "open":"hidden" }) );
        self.children.forEach( z=> z.render() );

        if( map.handle )  map.base.removeLayer( map.handle  );
        map.handle  = L.marker( 
                            {lat:dna.lat, lng:dna.lng }, 
                            {icon:pinStyle[ status ].icon ?? pinStyle.default.icon })
                       .addTo( map.base )
                       .bindTooltip(dna.id,  {
                            permanent:!dna.tags?.includes("nav"),  
                            direction:'bottom', 
                            style: "",
                            className:"lbl- lbl-"+status })
                       .setOpacity( pinStyle[status].opacity )
                       .on('contextmenu', e=> 
                           newEdit( self, e )  );
        },

    spawnhere: e=>  self.spawn( { class:"zone", name:"Zone "+idcounter.zone  } ),
    spawn: newdna =>{                                                                                                                                            
        if( !dna.zones.includes( newdna)) dna.zones.push( newdna );
        let z= newZone(  {
            dna:      newdna,
            parent:   self,        
            siblings: self.children,
            map:      map.base
            });
        self.children.push (z);
        z.open();
        },
    duplicate: ()=>{
        let newdna= Object.fromEntries(  Object.entries(dna) );
        newdna.zones = dna.zones.map( z=> Object.fromEntries( Object.entries(z)));
        newdna.id+="_copy";
        newdna.lat+=.01;
        newdna.lng+=.01;
        self.parent.spawn( newdna );
        },
    exform: ()=> { },
    inform: d=>{ }
    }

    self.construct(); // must build DOM before spawning zones
    self.close();
    if( dna.zones)  dna.zones.forEach( zdna  => self.spawn( zdna ));
    return self;
    } 