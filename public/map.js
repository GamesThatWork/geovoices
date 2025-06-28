//if(!L) const L ={};
var map = L.map('mapid').setView([35.5011179,-83.2966019], 12);    


const redDot = L.icon({
    iconUrl: '/assets/xdotred.png',
    shadowUrl: '/assets/xdothadow.png',

    iconSize:     [12, 12], // size of the icon
    shadowSize:   [0, 0], // size of the shadow
    iconAnchor:   [6, 6], // point of the icon which will correspond to marker's location
    shadowAnchor: [2, 2],  // the same for the shadow
    popupAnchor:  [-1, -6] // point from which the popup should open relative to the iconAnchor
});

const greyDot = L.icon({
    iconUrl: 
      '/assets/xdothadow.png',
  shadowUrl: 
      '/assets/xdotred.png',
    iconSize:     [8, 8], // size of the icon
    shadowSize:   [0, 0], // size of the shadow
    iconAnchor:   [6, 6], // point of the icon which will correspond to marker's location
    shadowAnchor: [2, 2],  // the same for the shadow
    popupAnchor:  [-1, -6] // point from which the popup should open relative to the iconAnchor
});


//const features = L.geoJSON(geojsonFeature).addTo(map);


L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

//L.marker([35.5011179,-83.2966019]).addTo(map)
  //  .bindPopup('Arizona Jane\'s DANCING STONES Cabin.')
    //.openPopup();

function path (session  ){
  fetch( `/path?runs=${session}`, { method: "GET"})
     .then(res      =>   res.json())
     .then(response => {
        document.querySelector("#reading").textContent = JSON.stringify(response);
        if( response.failure )
          document.querySelector("textarea").value+= `
  failed.`;
        else {
          L.geoJSON(response).addTo(map);

        }
    });
  };


function fixes (session  ){
  fetch( `/fixes?runs=${session}`, { method: "GET"})
     .then(res      =>   res.json())
     .then(response => {
      //document.querySelector("#reading").textContent = JSON.stringify(response);
      if( response.failure )
        document.querySelector("textarea").value+= `
failed.`;
      else {
         response.fixes.forEach( f=> 
                L.marker([ f.lat, f.long], {icon: redDot } ).addTo(map)
                  .bindPopup(f.session+':'+ f.id+  '<br/>  '+ new Date( f.fixTime).toDateString() 
                                                               +  '<br/>  '+ new Date(f.fixTime).toLocaleTimeString() 
                                                               +  '<br/>  '+ new Date(f.dbTime ).toLocaleTimeString() 
                                                               +  `<button class="pinbutton" session="${f.session}"  fix="${f.id}" onclick="console.log( this )">MAKE PIN</button>`)
                  .bindTooltip( 'f.id', {permanent: false, className: "mapnote", style:"opacity:0.3;", offset: [0, 0] }) )
        }
   });
  };








function mark (session, id, note, icon){
  fetch( `/mark?session=${session}&id=${id}`, { method: "GET"})
     .then(res      =>   res.json())
     .then(response => {
      document.querySelector("#reading").textContent = JSON.stringify(response);
      if( response.failure )
        document.querySelector("textarea").value+= `
failed: ${note}`;
      else {
        L.marker([ response.lat, response.long], icon?{icon: icon}:{} ).addTo(map)
          .bindPopup(note || ( response.session+':'+response.id+  '<br/>  '+ new Date(response.fixTime).toDateString() 
                                                               +  '<br/>  '+ new Date(response.fixTime).toLocaleTimeString() 
                                                               +  '<br/>  '+ new Date(response.dbTime ).toLocaleTimeString() 
                                                               +  `<button class="pinbutton" session="${response.session}"  fix="${response.id}"         onclick="console.log( this )">MAKE PIN</button>`
                              /*+'<br/>'+ JSON.stringify(response) */ ))
          .bindTooltip( response.id, {permanent: false, className: "mapnote", style:"opacity:0.3;", offset: [0, 0] })
            .
                
        
        
        
        document.querySelector("textarea").value+= '\n'+ response.id
                                                  +': [ '+ response.lat +', '+ response.long +'] ' 
                                                  +'   fx:'+ new Date(response.fixTime).toLocaleTimeString() 
                                                  +'   db:'+ new Date(response.dbTime ).toLocaleTimeString();
        
        
        
        
        
        }
    });
  };



function setView(session, id){
  fetch( `/mark?session=${session}&id=${id}`, { method: "GET"})
     .then(res      =>   res.json())
     .then(response =>   map.setView([ response.lat, response.long], 12) );
  };





let notes = [
  [ 87, 253, 'Kuwahi'],
  [ 87, 246, 'Lookout Southeast'],
//  [ 87, 249, 'Lookout East'],
 //// [ 87, 249, 'Lookout East'],
  [ 87, 252, 'Lookout HUGE'],
  [ 87, 255, 'Collins Creek'],
  [ 87, 273, 'Beautiful River'],
  [ 87, 321, 'Big Cove Road'],
  [ 87, 490, 'Corn'],
  [ 87, 486, 'Socco Falls'],
  [ 87, 525, 'William Holland Thomas'],
  [ 87, 555, 'Tuckagesee River'],
  [ 87, 714, 'Yonaguska Home'],
  [ 87, 804, 'Kituwa Mound'],
//  [ 87, 804, 'Ancient Railroad Bridge'],
 // [ 87, 804, 'Ela River Access'],
 // [ 87, 828, 'Shortcut across bridge?'],
//  [ 91,  20, 'Island Park'],
//  [ 91,  37, 'Mollie Blankenship Rd'],
//  [ 91,  44, 'Yellow Hill'],
  [ 325, 1152, 'Ravensford'],
  [ 325, 1170, 'New Kituwah Academy'],
  [ 325, 1234, 'Museum of the Cherokee Indian'],
];

//notes.forEach( n=> mark(n[0],n[1],n[2]) );

//for( let i=0; i<33; i++)  mark( 323, i, `${i}: Sunday 8/23`, redDot) ;
//for( let i=0; i<24; i++)  mark( 324, i, `${i}: Sunday 8/23`, redDot) ;
//for( let i=554; i<1234; i++)  mark( 325, i, `${i}: Sunday 8/23`, redDot) ;


let session = 122, start = 1, end = 666;

setView( session, start );
//for( let i=0; i<774; i++)  mark( session, i, null, redDot) ;


//path( 122 );
fixes(122);
//for( let i=start; i<end; i++)  mark( session, i, null, redDot) ;



 
//for( let i=230; i<290; i++)   mark( 87, i, `${i}: Kuwahi?`, redDot) ;
//for( let i=0; i<91; i++)       mark( 91, i, `${i}: Session 91`, greyDot) ;

//for( let i=0; i<79; i++)  mark( 94, i, `${i}: Session 94`, redDot) ;

