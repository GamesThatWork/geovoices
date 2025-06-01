import app  from './app.js';
import url  from './url.js';




const defaultLL = L.latLng( [33.983667, -84.181541]);


export default  {
    defaultLL,
    launch: ()=>{
        if(    !app.map ){
                app.map=  L.map('maplayer',     {attributionControl:false, zoomControl:false} )
                       .setView( app.tour??defaultLL, 12);
                      L.tileLayer( url.map.tiles, {attribution: `&copy; <a href="${url.map.attribution}">OpenStreetMap</a>`,  })
                       .addTo( app.map );
            }
        return  app.map;
        }
  }
  