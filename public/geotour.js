  
/*

TIP= tour in progress (saved in localStorage)
dna = tour definition object


------- app flow -- 

display splashscreen, then

                   launch Tour In Progress  (from localStorage )
or
            load & launch Fixed Tour        (named in url, as subdomain or query param)
0r
   select & load & launch Any Tour

then perform prestart and start driving




the  register a ServiceWorker (will test version)

  if Serviceworker updates
      serviceworker clears cache
      app reloads (filling new cache with freshest code)

 

Tour, Pin, Zone
    self - my node in the tree of editobjects = html elements building realtime data tree
    dna  - my node in the tree of definitions = javascript/json objects defining the tree 
    map  - my node in the tree of geographics = svg/html elements buiding the visual tree
*/
  
import newTour      from './tour.js';
import url          from './url.js';
import nav          from './nav.js';
import menu         from './menu.js';
import app          from './app.js';
import geo          from './geo.js';
import {requestedTour, titleCase}  from './util.js';
import perform from './perform.js';




const dateCode= ( hyphen )=>{
  const formatter = new Intl.DateTimeFormat('en-us',{ year:"2-digit",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false});
  const o={}, f= formatter.formatToParts( Date.now() );
  f.forEach( i=> o[i.type]=i.value );
  return o.year +o.month +o.day+ (hyphen?'-':'') +o.hour +o.minute;
  }

app.userID = localStorage.getItem("userID") ?? Number(dateCode()+Math.floor( Math.random()*900+100)); //YYMMDDHHMM+3 random digits w/o leading zero
localStorage.setItem("userID", app.userID)
console.log( "userID", app.userID)

const tourbase={      
    launch:  newDNA => new Promise( (resolve,reject)=>{
        if(!(newDNA?.pins))   return reject( null );
       // localStorage.setItem('tour', json );
        app.tour?.destruct();  
        app.tour = newTour(  {  tour:newDNA       });
        app.tour.analytics.memo( {  event:"tour.launch" });
        //if( tour?.timestamp )      app.tour.trigger("start");
        app.tour.setNext( newDNA?.next ?? "start,required");
        nav.drive();
        console.log("launch: ", app.tour);   
        resolve( app.tour );  
        }),

    load: tour => new Promise( (resolve,reject)=>{
        if( !tour )    return reject( null );
        progressBar();
        fetch( url.tour.load + tour )
          .then(  response => {
            if (!response.ok) {
              // Try to parse error as JSON, fall back to status text
              return response.text().then( text => {
                  try {
                      let error = JSON.parse( text )?.error  ?? response.statusText; 
                      throw new Error(`Tour load failed: ${response.status} ${error}`);
                  } catch (parseError) {
                      throw new Error(`Tour load failed: ${response.status} ${text || response.statusText}`);
                  }
              });
            }
            return response.json();
          })   // get remote file
          .then(  tourbase.launch )
          .catch( error => {
            console.error("Error loading tour:", error);
            reject(error);
          })
          }),

    select: ()  => new Promise( (resolve,reject)=>{
        fetch( url.tour.list )
          .then(  response => {
            if (!response.ok)   throw new Error(`Tour list fetch failed: ${response.status} ${response.statusText}`);
            return response.json();
            })// get remote file list
          .then(  menu.chooseTour )
          .then(  tourbase.load   )
          .catch( error => {
            console.error("Error loading tour list:", error);
            reject(error);
          })
          }),

    }
      
app.newTour= tourbase;



// const mapbase= {
//   launch: ()=>{
//       app.map=  L.map('maplayer',     {attributionControl:false, zoomControl:false} )
//                  .setView( app.tour??defaultPin, 12);
//                 L.tileLayer( url.map.tiles, {attribution: `&copy; <a href="${url.map.attribution}">OpenStreetMap</a>`,  })
//                  .addTo( app.map );
//               }
// }

window.onload= ()=>{


  // var installPrompt= ()=>true;

  // window.addEventListener('beforeinstallprompt', 
  //     e=> {
  //       console.log( 'beforeinstallprompt',e);
  //       e.preventDefault(); // Prevents immediate prompt display
  //       installPrompt= e.prompt();
  //       });

  // if( performance.getEntriesByType("navigation")[0].entryType != "navigation" ){
  //   console.warn( `Hard Reload   performance.getEntriesByType("navigation")[0].entryType=${performance.getEntriesByType("navigation")[0].entryType}` );
  //   window.open(window.location.href, "_self");
  //   };
  

  // determine tour from url, localStorage, or interactive user choice - in that order

      let tourRequested      =  requestedTour()?.toLowerCase(); 
      let tourInProgress     =  JSON.parse( localStorage.getItem( "tour" ));
      let tourInProgressName =  tourInProgress?.id?.toLowerCase();
      if( tourRequested &&      tourRequested!= tourInProgressName ) 
          tourInProgress= tourInProgressName = null;
      
      let name   =   tourInProgressName ?? tourRequested;
      let resume =   tourInProgress?.interrupted;
      let next   =   tourInProgress?.next;
  
          console.log( {tourRequested,tourInProgress,tourInProgressName,name,resume,next} );

  
//   tourbase methods:
  
//     .launch - instantiate from memory & start
//     .load   - load from cloud,           then   .launch
//     .select - user chooses filename      then   .load
  
  
  
  

  menu.splash( {name, resume, next} )
    // .then( installPrompt)
        .then( ()=>    perform.background( 2 )  ) 
        .then( ()=>{   tourbase.launch(  tourInProgress ) 
          .catch( ()=> tourbase.load(    tourRequested  ) 
              .catch(  tourbase.select                  ))})
        .then( ()=>{
                 console.log("now  READY");
                 menu.ready();
                })
        .catch( perform.debug ) ;
   

  





  //experimental
  if( 'mediaSession' in navigator)
          navigator.mediaSession.metadata = new MediaMetadata({ 
                 title:  "GeoVoices",
                 artist: "GamesThatWork",
                 album:  "Cherokee Lands and Lore",
                 artwork: []
                 });

  if ("serviceWorker" in navigator) 
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none",  scope:'/', type:"module" })
      .then(registration=> {
        registration.addEventListener("updatefound", reg =>{ 
            console.log(`New Service Worker`, reg.target);
            navigator.serviceWorker.ready
              .then( r =>{ 
                setTimeout( e=>{
                  let progbar = document.querySelector("#progressbar" );
                  if( progbar ){
                    progbar.innerHTML= `<div class="ontop">GeoVoice Engine Update</div>`;
                    progbar.hidden= false;
                    progbar.style.zIndex=6;
                 }
                 let splash = document.querySelector("#splash" );
                 if( splash ) splash.style.opacity=0.25;
                 }, 750);
                console.log(`New Service Worker Ready`, r );
                setTimeout(  ()=>location.reload(),3000) ;
              });
         console.log(`Service Worker registered`, registration);           })
      })
    .catch((error) => {
      console.error(`Service worker registration failed: ${error}`);
    });



  if ('Notification' in window) 
    Notification.requestPermission()////
    .then( permission =>{
          if( permission == 'granted') 
            navigator.serviceWorker.getRegistration()
                .then( reg =>  reg?.active?.state=="activated"?  
                      reg.showNotification(`Welcome to ${app.tour?.dna.id??"Cherokee Storytour: "} GeoVoice ${app.version} `)
                    : null)
          console.log("Notification Permission: " + permission);
          })
  else console.warn("Notification not available");



  let   woke = null;

  const maybeStayAwake = ()=>
      (document.visibilityState=="visible") &&  
      (!woke || woke.released) &&
        navigator.wakeLock?.request("screen")
          .then(     sentinel => (woke=sentinel).onrelease = maybeFallAsleep )
          .catch (   err=> perform.debug( "WakeLock: "+err) );

  const maybeFallAsleep = e=> {
    console.log(`SLEEP? ${e.type} event  doc.vis= ${ document.visibilityState }`); 
    maybeStayAwake();
    let hibernate = app.tour && (
           (document.visibilityState == "hidden"  ) 
        || (e.type                   == "release" ) )// this means wakeLock is released - screen is off/dimmed/locked
    if( hibernate  ){
        console.log('SLEEP?  tour state saved'   );
        app.tour.updateTIP( {interrupted:Date.now() })
        app.tour.analytics.flushEvent({  type:"hibernate"  });          // analytics to server
        }
     };

  window.onblur               = maybeFallAsleep;
  document.onvisibilitychange = maybeFallAsleep;
  window.onfocus              = maybeStayAwake;
  if ('wakeLock' in navigator)  
                  setTimeout(   maybeStayAwake, 3000); // page must already be visible
  else console.warn("WakeLock not available");







  // if ('wakeLock' in navigator) {
  //   let stayAwake = ()=>{
  //     console.log('visibilitychange event', document.visibilityState ); 
  //     if( document.visibilityState === 'visible')
  //         navigator.wakeLock.request()
  //           .then(     sentinel => document.onvisibilitychange = stayAwake )
  //           .catch (   console.warn )
  //     else if( app.tour ){
  //           console.log('interrupted tour state saved'   ); 
  //           app.tour?.updateTIP( {interrupted:Date.now() })
  //           app.tour.usage.upload();
  //       } }
  //   stayAwake();
  //   } 
  // else console.warn("WakeLock not available");



  if('mediaSession' in navigator )
    perform.audio("init");
  else  console.warn( "mediaSession not supported")


 };//onload


function progressBar() {
  var bar = document.querySelector("#progressbar");
  bar.innerHTML = 
                `<div class="label" >CONTENT DOWNLOADING</div>
                 <div class="number" >100</div>`;

  var msgID          = bar.querySelector(".label");
  var percentDisplay = bar.querySelector(".number");
  const bc = new BroadcastChannel("cacheProgress");
  bc.onmessage = (event) => {
    bar.hidden = false;
    if (event.data.messageType === "progress" && event.data.progress < 0.99) {
      percentDisplay.textContent = 100 - Math.floor(event.data.progress * 100);
    } else if (event.data.messageType === "error") {
      percentDisplay.textContent = "";
      msgID.innerHTML =
        "Uncached Files: <OL>" +
        event.data.uncachedFiles
          .map((text) => "<li>" + text + "</li>")
          .join("") +
        "</OL>";
    } else if (event.data.messageType === "end") {
      percentDisplay.innerHTML = `<span class="ready">READY</span>`;
      setTimeout(() => {  
        bar.hidden = true;
      }, 5000);
    }
  };
}