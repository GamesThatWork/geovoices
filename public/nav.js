import { ll2dm }  from './util.js';
import app  from './app.js';
  


var   
    last       =   {  lat:0,lng:0}, 
    count      =   0,
    simulation = false,
    flasher    = null,
    next       =   ()=>{};
     


const  

    current =   {  lat:100,lng:100}, 
    options =   {  enableHighAccuracy: true,  timeout: 5000,  maximumAge: 0 },


    fail    = ()=>{
                flash("fail");
                next();
                },

    flash   = signal=> {               
                flasher ??= app.map.getContainer().classList;                        
                       if( simulation && signal=="read") signal= "simread";
                 flasher.add(  signal  );
        setTimeout( ()=>flasher.remove(signal), signal=="fail"? 1500:500 );
                },
                


    getFix =  () =>    navigator.geolocation.getCurrentPosition( read, fail, options ),

    
    read    = fix=>{
                let fixcounter  =document.querySelector("#fixcounter");  
                let odometer =document.querySelector("#distance");  
                let km = odometer?.dataset.metric;
 
             //decode
                const { timestamp: fixTime, coords } = fix;
                const { latitude: lat, longitude: lng } = coords;
                const pos = { last, now: {lat,lng} };
                Object.assign( current, pos.now)
                if( ll2dm(pos.last, pos.now) >3)  {
                //flasher ////
                    if( fixcounter ) fixcounter.innerHTML= `<p class="bignum">${count++}</p>`;
                    flash( "read" );
                //display
                    app.tour?.track({ lat, lng },{pan:!simulation, zoom: (count%100)? null: app.zoomRange.max });
                //trigger   
                    app.tour?.children.forEach(  pin => 
                        pin.children.forEach( zone=> 
                            zone.trigger( pos ) )); 
                        }
                next();  
              },

    simulatedGPS =  evt => read( {coords:{ latitude:evt.latlng.lat,longitude:evt.latlng.lng}, timestamp:Date.now }),
    
    sim = () =>{
        simulation = !simulation;   
        if(    simulation ) app.map.   addEventListener( "mousemove", simulatedGPS );
        else                app.map.removeEventListener( "mousemove", simulatedGPS );
//        next = simulation?  ()=>{} : getFix;
        next = ()=>{};
};

export default { 
    current,
    sim,
    test: sim,  //deprecated alias
        
    drive: ()=> (next = getFix)(),

    active: ()=> !!app.tour?.trackMarker,
    
    stop:   ()=> {
        app.tour.untrack();
        app.map.removeEventListener( "mousemove", simulatedGPS );
        simulation=false;
        next = ()=>{};
        }      }