const AWSBUCKET= "geo-tour",
root =     "https://geotour.glitch.me/",
website =  "https://www.geovoices.org",
assets=    `https://${AWSBUCKET}.s3-us-west-2.amazonaws.com/`
      ;


export default 
 {
    website,
    server:          `${root}`,
    tour: {
        list:        `${root}tours/`,
        load:        `${root}tour/`,
        save:        `${root}tour/`,
        edit:        `${root}tour/`,
        },
    feedback: {
        save:        `${root}add/Feedback/`,
        },  
    usage: {
        save:        `${root}add/Usage/`,
        },
    content: {
        list:        `${root}contents/`,
        load:        `${assets}cherokee/`,
        save:        `${root}upload/`,
        edit:        ``,
        silence:     `${assets}silence.ogg`,
        weave:       `${root}weave/Cherokee`,   
        },
    json:            "https://jsoneditoronline.org/#left=url.",
    map:{
        tiles:       "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>contributors`,
        bell:        ``,
        pins:        `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/`,
        car:         //"https://cdn.glitch.com/82396493-cf04-4e83-9abb-cf8ed0317c6d%2Fcar.png?v=1610361026290",
                     "https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Ficon-192x192.png?v=1600674220629",
        guibg:       "https://cdn.glitch.com/82396493-cf04-4e83-9abb-cf8ed0317c6d%2Fsubtletexture1.jpg?v=1610206007889",
        pinshadow:   "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
        }    
    }

