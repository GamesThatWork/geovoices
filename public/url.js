const 
    root =     "/",      // "https://geotour.glitch.me/",
    website =  "https://www.geovoices.org";  // used when relative paths will not work, eg: qr code or link passed in email

  // this routing should be entirely transparent and managed by the server alone
    // AWSBUCKET= "geo-tour",
    // GCPBUCKET= "geo-voices";
    // assets   = `https://${AWSBUCKET}.s3-us-west-2.amazonaws.com/`
    // assets   = `https://storage.googleapis.com/${GCPBUCKET}/`;


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
        save:        `${root}feedback/`,
        },
    analytics: {
        save:        `${root}analytics`,
        },  
    content: {
        list:        `${root}contents/`,
        load:        `/content/cherokee/`,
        save:        `${root}upload/`,
        edit:        ``,
        silence:     `/assets/silence.ogg`,
        weave:       `${root}weave/Cherokee`,   
        },
    json:            "https://jsoneditoronline.org/#left=url.",
    map:{
        tiles:       "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>contributors`,
        bell:        ``,
        pins:        `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/`,
        car:         "/assets/icon-192x192.png", //"/assets/car.png",
        guibg:       "/assets/subtletexture1.jpg",
        pinshadow:   "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
        }    
    }

