/*******************************************************\
  run = datatracking session 
  pin = point of interest
  fix
  map



\*******************************************************/


const point = cnfg =>{
          {
          var lat = cnfg.lat, long = cnfg.long;
          
          }  
        }




//import * as L from 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.js'

const el ={
        status:   document.querySelector('#status'   ),
        bell:     document.querySelector('#bell'     ),
        flat:     document.querySelector('#bellflat' ),
        form:     document.querySelector('#startrun' ),
        dash:     document.querySelector('#dashboard'),
        map:      document.querySelector('#mapid'    ),
        dump:     document.querySelector('#dbdump'   ),
        gps: {
          fix:    document.querySelector('#gps .fix' ),
          cyc:    document.querySelector('#gps .age' ),
          age:    document.querySelector('#fix .age' ),
          acc:    document.querySelector('#fix .acc' ),
          len:    document.querySelector('#gps .len' ),
          dbg:    document.querySelector('#dbggps' ),
          },
        put: {
          fix:    document.querySelector('#put .fix' ),
          xhr:    document.querySelector('#put .online' ),
          age:    document.querySelector('#buf .age' ),
          len:    document.querySelector('#buf .len' ),
          try:    document.querySelector('#xhr .try' ),
          put:    document.querySelector('#xhr .put' ),
          dbg:    document.querySelector('#dbgput' ),
          },
        inf: {
          ses:    document.querySelector('#inf .session' ),
          dev:    document.querySelector('#inf .device' ),
          },
        now: {
          sec:    document.querySelector('#now .seconds' ),
          mil:    document.querySelector('#now .miles' ),
          mph:    document.querySelector('#now .mph' ),
          },
        all: {
          sec:    document.querySelector('#all .seconds' ),
          mil:    document.querySelector('#all .miles' ),
          mph:    document.querySelector('#all .mph' ),
          },
        fix: {
          clk:    document.querySelector('#clk .data' ),
          lat:    document.querySelector('#lat .data' ),
          lon:    document.querySelector('#lon .data' ),
          },
    
        ids: {
          ses:    document.querySelector('#ids .session' ),
          fix:    document.querySelector('#ids .count' ),
          },
        pad: {
          form:    document.querySelector('#notepad' ),
          open:    document.querySelector('#npOpen'  ),
          send:    document.querySelector('#npSubmit'  ),
          okay:    document.querySelector('#npResult'  ),
          },
        cache: {
          view:    document.querySelector('#cacheView'  ),
          clear:   document.querySelector('#cacheClear' ),
          reset:   document.querySelector('#cacheReset' ),
          },
        start:     document.querySelector('#runstart' ),
        resume:    document.querySelector('#runresume' ),
        name:      document.querySelector('#runname' ),
        device:    document.querySelector('#rundevice' ),
        video:     document.querySelector('#videoplayer'  ),
        audio:     document.querySelector('#audioplayer'  ),
  
        }
 
  const url    = "https://geotour.glitch.me";
  const cache = {
      tries:0, 
      puts:0,
      lastPut: Date.now(),
      buf:[]
      };
  const gps = {
      count:0, 
      tries:0,
      gets:0,
      lastGet: null,
      busy:false,
      options:    {   //extended geolocation API positionOptions object (last two memebeers are mine)
        enableHighAccuracy: true,
        timeout:    5000,
        maximumAge:    0,
        TTL:         3.5,  //added /seconds before we need a new fix
        watch:      false  //added
        }  
    
    
    };
 


const msg= ( selector, text, bg, color )=>{
     let e = document.querySelector(selector);
     if( text  )    e.textContent = text;
     if( bg    )    e.style.backgroundColor = bg;
     if( color )    e.style.color = color;
     }
const visible= ( selector, yes=true )=>
    document.querySelector(selector).style.display= yes? 'block':'none';

  var   fixPaused =false;
  const sender = {};
  const session = {el:document.querySelector('#session'), id:0};


// UTILITY GEO/TIME CALCULATORS

// calculate distance between two fixes in miles
  const haversine = ( fix0, fix1 )=>{
    if( !fix0 || !fix1 )  return 0;
    const π = Math.PI;
    const R = 3956; // miles
    const φ0 = fix0.lat * π/180; // φ, λ in radians
    const φ1 = fix1.lat * π/180;
    const λ0 = fix0.long* π/180; // φ, λ in radians
    const λ1 = fix1.long* π/180;
    const Δφ = φ1 - φ0;
    const Δλ = λ1 - λ0;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.sin(Δλ/2) * Math.sin(Δλ/2) * Math.cos(φ0) * Math.cos(φ1);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // in miles
  }

// calculate time between two fixes in milliseconds
//    either parameter can be a fix, a time or null ( default= now )
  const deltaTime =  (fix0,fix1) => Math.abs( (fix0.time||fix0||Date.now())-(fix1.time||fix1||Date.now()) );


// calculate speed between two fixes in mph
  const haverspeed = (fix0, fix1) =>  (haversine(fix0,fix1) / (deltaTime(fix0,fix1))) *1000 *60 *60; //mph 




const fixAge = ()=> deltaTime( {time: Date.now() }, f.last);
const prev={ count:0 };
const f = { count:0, new:{}, now:{}, first:{}, last:{time: Date.now()}  };



var oldInterval = null; // permits a series of runs

function microManage(){
  if( oldInterval ) clearInterval( oldInterval);
  oldInterval = setInterval( e=>{
      let gpsAge = deltaTime( {time: Date.now() },     f.last   )/1000;
      let putAge = deltaTime( {time: Date.now() }, cache.lastPut)/1000;
      el.gps.age.textContent = r1( gpsAge );
      el.gps.cyc.textContent = gps.options.watch? "watch":"force";
      el.put.age.textContent = r1( putAge );
      if( gps.paused )                    msg("#dbggps", "PAUSED", 'yellow', 'black');
      else if( gpsAge < gps.options.TTL){ msg("#dbggps", "cycle" , 'black', 'yellow');  msg('#fix .age', false,'#DDD');   }
      else if( gps.busy )                 msg("#dbggps", "BUSY" , '#700', 'white');
      else                       getFix();
      }, 
    250);
}

const getPosition = function (options) {
  return new Promise(function (resolve, reject) {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}



function getFix(){
   if(!navigator.geolocation) 
    el.status.textContent = 'Geolocation is not supported by your browser';
  else if( !gps.busy ){
    gps.busy=true;
    msg("#fix .age", null,"#FBB");
    msg("#gps .fix", null,"#FBB");
    msg("#dbggps", 'obtaining fix',"lightgrey", "black");
    if(!gps.options.watch )    // forcce gelkocation
        getPosition( gps.options )
          .then( position => positionProcess( position ) )
          .catch(   error => positionFail(    error    ) );
     }
  }

function positionFail( error ) {
        gps.busy= false;
        msg("#dbggps", error.message,"#F99", "black");
        }  

function positionProcess( position ) {  
      
       console.log( "POSITION", position);
         
        gps.busy= false;
        msg("#gps .fix", null,"#666");
        f.new = { 
            session: session.id,
            id:   f.count, 
            lat:  position.coords.latitude,
            long: position.coords.longitude,
            time: Date.now()
            };
        
        if( f.now.lat  ){ // always accept first fix
            let speed=haverspeed(f.new, f.now );
//            if( f.new.lat==f.now.lat && f.new.long==f.now.long ){
            if( speed < 0.001 ){
// GPS FROZEN - or car stationary
               let t = deltaTime(f.new, f.now )/1000;
               let s = t>59.9? ( r2(t/60)+" min." ):( r1(t)+" sec.");          
               msg("#dbggps", "Stopped or GPS Jammed "+s,"#911", "white");
   //           el.flat.play();
               return;
               }
            if( ( speed>99 ) && (deltaTime(f.new, f.now )< 9000  )){
  // 100MPH?  No way. But do I trust the reference fix? - don't reject three in a row
                msg("#dbggps", speed+" mph? Rejected Fix","#911", "white");
                el.flat.play();
                return;
                }
            }
        Object.assign( f.now, f.new );
        el.bell.play();
        if( !f.first.lat )  Object.assign( f.first, f.now );
        if( !f.last.lat  )  Object.assign( f.last,  f.now );
        el.ids.ses.textContent = session.id;
        msg('#ids .count', session.id, "white", "#007" );
        let a0  = position.coords.accuracy;
        let a   = Math.floor( 16 * Math.min(0.9999, a0/5000));
        const hex= ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'];
        msg('#fix .acc', a0, '#'+ hex[a]+hex[15-a]+'0', "white");
        el.ids.fix.textContent = f.count;
        el.gps.fix.textContent = f.count;
          
        msg('#gps .fix', f.count, false,  "white" );
        msg('#bigNumber', f.count, false,  "white" );
        el.fix.clk.textContent = new Date( f.now.time ).toLocaleString();
        el.fix.lat.textContent = f.now.lat;
        el.fix.lon.textContent = f.now.long;
        el.now.sec.textContent = r2( deltaTime( f.now, f.last )/1000);
        el.now.mil.textContent = r3( haversine(  f.now, f.last ));
        el.now.mph.textContent = r1( haverspeed( f.now, f.last ));
        el.all.sec.textContent = r2( deltaTime( f.now, f.first )/1000);
        el.all.mil.textContent = r3( haversine( f.now, f.first ));
        el.all.mph.textContent = r1( haverspeed(f.now, f.first ));
        el.status.style.backgroundColor="#FBB";
        Object.assign( f.last,  f.now );
        f.count++;      
      
        let here =[ f.now.lat, f.now.long]; 
        if( prev.marker )  {
          map.removeLayer( prev.marker );
          L.marker( prev.here, {icon: icon.red } ).addTo(map);
          }       
        prev.here=here;
        prev.marker = L.marker( here, {icon: icon.spider }  ).addTo(map);
        prev.here=here;
        if( !(f.now.id %10) ) map.setView(here);  // recenter map every 10 fixes
        localStorage.setItem('lastFix', f.now.id );
        put( f.now );
        tour.tick();
        }





















const r0 =  x=> Math.floor(x*1   +0.5)/1   ;
const r1 =  x=> Math.floor(x*10  +0.5)/10  ;
const r2 =  x=> Math.floor(x*100 +0.5)/100 ;
const r3 =  x=> Math.floor(x*1000+0.5)/1000;




el.resume.onclick = event => {  
          event.preventDefault();
          launchRun( false,"Resume");
          }
 
//el.form.onsubmit =
el.start.onclick = event => {
 
  event.preventDefault();
  console.log("GETSESSION start", event); 
  
  fetch( url + "/getSession", {
    method: "POST", 
    body: JSON.stringify(new FormData( el.form )),
    headers: { "Content-Type": "application/json" }
    })
  .then(res      => res.json())
  .then(response => launchRun( response.session, "Success" ))
  .catch(  error => launchRun(            false,     error )); //resume previous run
  };



  const launchRun = (id, text )=>{
   
    console.log("GETSESSION "+ text, id );

    const data = { name: el.name.value, device: el.device.value};
    if( id ){
      session.id = id; 
      f.count=0;
      localStorage.setItem('lastSession',      session.id );
      localStorage.setItem('lastFix',          f.count    );
      localStorage.setItem('lastSessionName',  data.name );
      localStorage.setItem('lastSessionDevice',data.device );
      }
    else{
      session.id  =          localStorage.getItem('lastSession');
      f.count    =1+ Number( localStorage.getItem('lastFix')) ;
      data.name   =          localStorage.getItem('lastSessionName');
      data.device =          localStorage.getItem('lastSessionDevice');
      }
    msg('#inf .session', data.name  );
    msg('#inf .device' , data.device);
    microManage();
    
    //el.form.style.display= "none";
    //el.dash.style.display= "block";
    //el.map.style.display= "block";
    //el.pad.open.style.display="block";
    el.video.play();
    visible( "#startrun", false);  
    visible( "#mapid"     );  
    visible( "#dashboard" );  
    visible( "#btnPinDrop"    );  
  }
  



const put = data=> {
 
  const msg = ( msg="", color=0 )=> {
      el.put.dbg.textContent          =  msg;
      el.put.dbg.style.backgroundColor= ["#F88","#AAA","#8F8"][color+1];
  }

  
  const queue = JSON.parse( localStorage.getItem('putQueue') || "[ ]" );
    
  
  if( data )  queue.push( data );
  
  el.put.len.textContent=  queue.length; 
  msg();
  
  if( queue.length<1 )   return;

  localStorage.setItem( 'putQueue', JSON.stringify( queue ));
    
  
  
  msg('Uncaching...');
  cache.tries++;
  fetch( url + "/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify( queue[0] )
          })
    .then(res => {
        msg('Decoding...');
        if (  !res.ok)  throw new Error( res.error );
        return res.json();
        })
    .then(response => {
        msg('Decaching...', 1);
        console.log( response );
        cache.lastPut= Date.now() ;
        cache.puts++;
        let stored     = queue.findIndex( f=> f.id==response.stored.id );
        if( stored>=0 )  queue.splice(    stored, 1 );
        localStorage.setItem( 'putQueue', JSON.stringify( queue ));
       
        el.put.fix.textContent=  response.stored.id;
        el.put.xhr.textContent=  "online";    
        el.put.xhr.style.backgroundColor =  "#8F8"; 
        el.put.len.textContent=  queue.length; 
        el.put.age.textContent=  ""; 
        el.put.try.textContent=  cache.tries; 
        el.put.put.textContent=  cache.puts;
        if( queue.length)        put();
        else                     msg( "Queue Empty", 1)
        })
     .catch( error => {
        el.put.xhr.textContent=  "offline";    
        el.put.xhr.style.color           =  "#8F8"; 
        el.put.xhr.style.backgroundColor =  "#141"; 
        msg( error, -1) 
        });
};


const map = L.map('mapid').setView([35.5011179,-83.2966019], 13);





const icon = {
    red: L.icon({
      iconUrl: 'https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Fxdotred.png?v=1597379072995',
      shadowUrl: 'https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Fxdothadow.png?v=1597379276815',
      iconSize:     [8, 8],  shadowSize:   [0, 0], iconAnchor:   [6, 6], shadowAnchor: [2, 2], popupAnchor:  [-1, -6] }),
    grey: L.icon({
      iconUrl:   'https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Fxdothadow.png?v=1597379276815',
      shadowUrl: 'https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Fxdothadow.png?v=1597379276815',
      iconSize:     [8, 8],  shadowSize:   [0, 0], iconAnchor:   [6, 6], shadowAnchor: [2, 2], popupAnchor:  [-1, -6] }),
    spider: L.icon({
      iconUrl:   'https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Fspider.png?v=1598354432023',
      shadowUrl: 'https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Fspidershadow.png?v=1598354776236',
      iconSize:     [32, 32],  shadowSize:   [32, 32], iconAnchor:   [16, 16], shadowAnchor: [8, 8], popupAnchor:  [-1, -6] }),
    car: L.icon({
      iconUrl: 'https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Fcar.png?v=1598353096341',
      shadowUrl: 'https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Fxdothadow.png?v=1597379276815',
      iconSize:     [24, 24],  shadowSize:   [0, 0], iconAnchor:   [16, 16], shadowAnchor: [2, 2], popupAnchor:  [-1, -6] })
}



function mark (session, id, note, icon=icon.red ){
  fetch( `/mark?session=${session}&id=${id}`, { method: "GET"})
     .then(res      =>   res.json())
     .then(response => {
      el.put.dbg.textContent = JSON.stringify(response);
      if( response.failure )
        document.querySelector("textarea").value+= `
failed: ${note}`;
      else 
        L.marker([ response.lat, response.long], {icon: icon}).addTo(map)
          .bindPopup(note)
      });
  };


L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);





  const adj={
    
    field: {
        enableHighAccuracy: {  type: "checkbox"                               },
        timeout:            {  type: "range", min:0,   max:60000, step:2000   }, 
        maximumAge:         {  type: "range", min:0,   max:15000, step: 500   }, 
        TTL:                {  type: "range", min:0,   max:120,   step: 1     }, 
        watch:              {  type: "checkbox"                               }, 
        },

    inform: () => {
        if (gps.watch )  navigator.geolocation.clearWatch( gps.watch );
        gps.watch = false;
        document.querySelector('#pinpad' ).innerHTML =  '<form id="adj_form"><div id="adjmsg">ADJUSTMENTS FOR GPS PERFORMANCE</div>'
                  +  Object.keys( adj.field ).map( k=> `
                          <div>
                          <label  for"${ 'adj_'+k }" id="lbl_${ k }" > ${ k }</label>                                        
                          <input  id="${ 'adj_'+k }"   name="${ k }" 
                          ${ Object.keys( adj.field[k] ).map( kk=> ` ${kk} = "${ adj.field[k][kk] }" `).join(" ")   }
                          ${(adj.field[k].type=='checkbox')?  ( gps.options[k]? 'checked': '') : ('value="'+ gps.options[k] + '"')   } >
                          </div>`).join(" ")
                  +  '<button id="adjCancel">save</button></form>';

      document.querySelector('#adj_form' ).onchange= adj.exform;
        document.querySelector('#adjCancel' ).onclick= adj.close;
        },
      exform: ()=>{
        Object.keys( adj.field ).forEach( k=>{ 
                 gps.options[k]  = adj.field[k].type=='checkbox'?  document.querySelector('#adj_'+k).checked :  document.querySelector('#adj_'+k).value ;
                 document.querySelector('#lbl_'+k ).innerHTML = `${k} <b>${gps.options[k]}</b>`;
                                        });
      
        if(      gps.options.watch)  gps.watch= navigator.geolocation.watchPosition( positionProcess, positionFail, gps.options );
        },
       close: ()=> document.querySelector('#pinpad' ).innerHTML = '',
    
}
  const pin ={

    field: {
      id:        {  type:"number",  readonly:"true" },
      time:      {  type:"datetime-local" },
      session:   {  type:"number" },
      fix:       {  type:"number" }, 
      lat:       {  type:"number" }, 
      long:      {  type:"number" }, 
      name:      {  type:"text"   }, 
      note:      {  type:"textarea", rows:6, cols:40}, 
      tags:      {  type:"text"   }, 
      worth:     {  type: "range", min:-1, max:1, step:0.1   }, 
      active:    {  type:"checkbox"   }, 
      trigger:   {  type:"checkbox"   }, 
      station:   {  type:"checkbox"   }, 
      direction: {  type:"checkbox"   }, 
      },
 
    inform: data => {
        document.querySelector('#pinpad' ).innerHTML =  '<form id="pin_form">'
                  +  Object.keys( pin.field ).map( k=> `
                          <label  for"${ 'pin_'+k }>${ k }</label>                                        
                          <${ pin.field[k].type==='textarea'?'textarea':'input' }  id="${ 'pin_'+k }" name="${ k }" 
                          ${ Object.keys( pin.field[k] ).map( kk=> ` ${kk} = "${ pin.field[k][kk] }" `).join(" ")   }" 
                          ${ k==='time'? "valueAsNumber":"value"}="${ data[k] ||"" }" 
                          ${(pin.field[k].type==='checkbox')     &&   data[k] ? "checked":''}
                          ${ pin.field[k].type==='textarea'?`>     ${ data[k] ||"" }</textarea>`:'/>' }
                          `).join(" ")
                  +  '<button id="pinSave"  >Save Pin</button>'
                  +  '<button id="pinCancel">Cancel  </button></form>';
        document.querySelector('#pinSave' ).onclick= pin.exform;
        document.querySelector('#pinCancel' ).onclick= pin.close;
        },
    exform: ()=>{
        let data={ pin:true };
        Object.keys( pin.field ).forEach( k=>  data[k]  = document.querySelector('#pin_'+k).value || "null" );
        data.time= Date.now();
        pin.close();
        put( data );
        },
    close: ()=> document.querySelector('#pinpad' ).innerHTML = '',
    
    place: p => L.marker( [ p.lat, p.long] ).addTo(map).bindPopup( p.note|| "Pin 1" )
}


/*  
pin.inform({ 
    id: 22,
    time:    1602392582397,
    session: 1,
    fix:     2, 
    lat:     3.0000, 
    long:    4.0000, 
    name:   "Kuwahi", 
    note:   "Mountainy", 
    tags:   "Lora",  
    worth:  0.7, 
    active:    1, 
    trigger:   1, 
    station:   0, 
    direction: 1
  });
  
  */
const pad ={
  visible: true,
  toggle: ()=>{
      //el.pad.form.reset();
      //el.pad.form.style.display= (pad.visible=!pad.visible)?"block":"none";
      //el.pad.open.style.display=              !pad.visible ?"block":"none";
    pin.inform( { session: session.id,  fix:f.last.id,  time: Date.now(), lat: f.last.lat,  long:f.now.long  }); 
    
    //if( pad.visible )
    //    pad.datagram = {
    //   session: session.id,
    //    fix:     f.last.id,
   //     time:    Date.now(),
    //    video:   "",
    //    audio:   "",
    //      lat:     f.now.lat,
  //        long:    f.now.long
     //   }
    },
  send:  ()=>{
      event.preventDefault(); 
      let fD = new FormData(el.pad.form);
      for (var k of fD.keys())      pad.datagram[k]=fD.get(k);
      put ( pad.datagram );
      pad.toggle();
      pad.datagram.lat =   f.now.lat,
      pad.datagram.long=   f.now.long,
      pin.place( pad.datagram );
      pad.datagram={};
 //    pad.form.reset();
      //L.marker( [ f.now.lat, f.now.long] ).addTo(map).bindPopup( data.note );
      }
  }
//pad.toggle();
//el.pad.open.onclick = pad.toggle;
//el.pad.send.onclick = pad.send;
//el.pad.open.style.display=    "none";










function path (session  ){
  fetch( `/path?runs=${session}`, { method: "GET"})
     .then(res      =>   res.json())
     .then(response => {
        if( response.failure )  document.querySelector("textarea").value+= `  failed.`;
        else                    L.geoJSON(response).addTo(map);
    });
  };


function fixes (session  ){
  fetch( `/fixes?runs=${session}`, { method: "GET"})
     .then(res      =>   res.json())
     .then(response => {
      if( response.failure )     document.querySelector("textarea").value+= `failed.`;
      else {
         response.fixes.forEach( f=> 
                L.marker([ f.lat, f.long], {icon: icon.red } ).addTo(map)
                  .bindPopup(f.session+':'+ f.id+  '<br/>  '+ new Date( f.fixTime).toDateString() 
                                                               +  '<br/>  '+ new Date(f.fixTime).toLocaleTimeString() 
                                                               +  '<br/>  '+ new Date(f.dbTime ).toLocaleTimeString() 
                                                               +  `<button class="pinbutton" session="${f.session}"  fix="${f.id}" onclick="alert( this )">MAKE PIN</button>`)
                  .bindTooltip( String(f.id), {permanent: false, className: "mapnote", style:"opacity:0.3;", offset: [0, 0] }) )
        }
   });
  };

function mapRuns( runs ){
  path( runs );
  fixes( runs );
  }


function pinFromMap( button ){
  console.log( "PinfromMap", button );
  pin.inform(button );
  }







const tour ={
   silent: false, 
   poi:[
      {utter:{ mile01:1, mile25:1, mile50:1, dir: 0 }, lat: 35.5010728, long:-83.2965555, name: "Arizona Jane's Cabin"  } ,
      {utter:{ mile01:1, mile25:1, mile50:1, dir: 1 }, lat: 35.5884124, long:-83.4053661, name: "Webb Overlook"  } ,
      {utter:{ mile01:1, mile25:1, mile50:1, dir: 0 }, lat: 35.4475105, long:-83.4007491, name: "Railroad Bridge" } ,
      {utter:{ mile01:1, mile25:1, mile50:1, dir: 1 },   lat: 35.4848761, long:-83.3163265, name: "The Museum of the Cherokee Indian" } ,
      {utter:{ mile01:1, mile25:1, mile50:0, dir: 1 },   lat: 35.5001151, long:-83.3109673, name: "The  New Giddooowah Academy" } ,
      {utter:{ mile01:0, mile25:0, mile50:0, dir: 1 },   lat: 35.4995525, long:-83.3020768, name: "Turn left on Sanooky Road. Careful! It is hard to see the turn-off,  but turn left and take the bridge to Big Cove Road" } ,
      {utter:{ mile01:0, mile25:0, mile50:0, dir: 1 },   lat: 35.4591418, long:-83.3579219, name: "Go straight past the Bridge" } ,
      {utter:{ mile01:0, mile25:0, mile50:0, dir: 1 },   lat: 35.4995525, long:-83.3020768, name: "Go straight through this light" } ,
      ],

  load: name=>{
    fetch( url + "/getTour/"+(name||""), { method: "GET" })
      .then(res      => res.json())
      .then(response => tour.pin = response.pin )
      .catch(  error => console.log(error) )
      },
  
  load: name=>{
    fetch( url + "/getTour/"+(name||""), { method: "GET" })
      .then(res      => res.json())
      .then(response => tour.pin = response.pin )
      .catch(  error => console.log(error) )
      },
  
  play: url =>{
    if( url.endsWith(".mp3")||url.endsWith(".ogg")||url.endsWith(".wav") ) 
      el.audio.src= "https://geo-tour.s3-us-west-2.amazonaws.com/cherokee/"+url;
    else window.speechSynthesis.speak(new SpeechSynthesisUtterance( url ));
  },
  
  tick: ()=>{
    if( tour.silent )  return;
    tour.poi.forEach( p=>{
      let d = p.distance = haversine( p, f.now );
      console.log(p.name+":  "+d+" miles");
      
      if(      d<0.01 && p.utter.mile01 ){
          tour.play("We have arived at " +p.name );
          p.utter.mile01 = false;
          p.utter.dir = false;
          p.utter.mile25 = false;
          p.utter.mile50 = false;
          }  
      else if( d<0.04 && p.utter.dir   ){
          tour.play("Careful, now. " +p.name );
          p.utter.dir = false;
          p.utter.mile25 = false;
          p.utter.mile50 = false;
          }  
      else if( d<0.26 && p.utter.mile25 ){
          tour.play("In a quarter mile we will approach " +p.name );
          p.utter.mile25 = false;
          p.utter.mile50 = false;
          }  
      else if( d<0.50 && p.utter.mile50 ){
          tour.play("In a half mile we will see  " +p.name );
          p.utter.mile50 = false;
          }  
    })} 
}




















const pastRuns = { monday:"120,121,122", tuesday:138, wednesday:"159", thursday:"179,183"}


window.onload = e=>{
  
 // gps.watch= navigator.geolocation.watchPosition( positionProcess, positionFail, gps.options );
  
  document.querySelector('#btnCache').addEventListener("click", 
           e=> {
            let w=window.open("cachemenu", "cache"); 
            setTimeout(e=> window,close(w), 2000); });
  document.querySelector('#btnPinDrop').addEventListener("click",
           e=> pin.inform( { session: session.id,  fix:f.last.id,  time: Date.now(), lat: f.last.lat,  long:f.now.long  }) );
  document.querySelector('#btnGPS').addEventListener("click",
           e=> adj.inform() );
  document.querySelector('#btnDashboard').addEventListener("click",
           e=>  el.dash.style.display =  el.dash.style.display=='none'? 'block':'none');
  document.querySelector('#btnMap').addEventListener("click",
           e=>  mapRuns( pastRuns.thursday ));//el.map.style.display  =  el.map.style.display== 'none'? 'block':'none');
  document.querySelector('#btnPause').addEventListener("click",
           e=>  {gps.paused = !gps.paused;
                document.querySelector('#btnPause').textContent=gps.paused? "PLAY":"PAUSE";});
  document.querySelector('#btnNoTalk').addEventListener("click",
           e=>  {tour.silent = !tour.silent;
                msg( '#btnNoTalk',  tour.silent?"Resume Talk":"Stop Talk", tour.silent? "#CC5":"#BBB")});
  
      
  visible("#dashboard", false);  
  document.querySelector('#dashboard').style.display= 'none';
  
  put(); //anything in the persistent cache from earlier sessions?
  
  console.log('page is fully loaded', e);
  if ('serviceWorker' in navigator)  
    navigator.serviceWorker.register('sw.js', {scope:'/'})
      .then(   reg =>console.log(' serviceworker loaded:', reg) )
      .catch(  err =>console.log(' serviceworker FAILURE', err) )
  
  if ('Notification' in window) 
    Notification.requestPermission()
    .then( permission =>{
          if( permission == 'granted') 
            navigator.serviceWorker.getRegistration()
            .then(reg => {if(reg) reg.showNotification('TUESDAY: Welcome to Cherokee GeoTour')})
          else console.log("Notification Permission Denied")
          })
  
  
//  el.video.addEventListener( "ended", e=>{ el.video.play(); tour.play("Stay awake");});
  el.video.addEventListener( "ended", e=>  e.target.play() );
    

  
};

//window.onbeforeunload = ()=>"Are you sure you want to navigate away?";