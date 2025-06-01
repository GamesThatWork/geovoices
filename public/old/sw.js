const version = 1.11
  ;//DO NOT CHANGE UNTIL RUN IS RECOVERED
const idCache = "v" + version;

const coreFiles = [
  "/",
  "/style.css",
  "/client.js",
  "/favicon.ico",
  "https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Ficon-256x256.png?v=1600674220690",
  "https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Fvideo.mp4?v=1597966654897",
  "https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Fbell.ogg?v=1596142355686",
  "https://cdn.glitch.com/82396493-cf04-4e83-9abb-cf8ed0317c6d%2Fbellflat.ogg?v=1602666868937",
  "https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Fspider.png?v=1598354432023",
  "https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Fspidershadow.png?v=1598354776236",
  "https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Fxdotred.png?v=1597379072995",
  "https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Fxdothadow.png?v=1597379276815",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.js",
  "https://unpkg.com/leaflet@1.6.0/dist/leaflet.css",
  "https://geo-tour.s3-us-west-2.amazonaws.com/cherokee/guide/welcome.ogg",
  "https://geo-tour.s3-us-west-2.amazonaws.com/cherokee/guide/birdtown.ogg",
  "https://geo-tour.s3-us-west-2.amazonaws.com/cherokee/guide/first-fire.ogg",
  "https://geo-tour.s3-us-west-2.amazonaws.com/cherokee/guide/how-to-follow-directions.ogg",
  "https://geo-tour.s3-us-west-2.amazonaws.com/cherokee/guide/kuwahi-1.ogg",
  "https://geo-tour.s3-us-west-2.amazonaws.com/cherokee/guide/kuwahi-2.ogg",
  "https://geo-tour.s3-us-west-2.amazonaws.com/cherokee/guide/selu-and-kanate.ogg",
  "https://geo-tour.s3-us-west-2.amazonaws.com/cherokee/story/ballgame-of-birds-and-animals.ogg",
  "https://geo-tour.s3-us-west-2.amazonaws.com/cherokee/story/first-fire.ogg",
  "https://geo-tour.s3-us-west-2.amazonaws.com/cherokee/story/how-to-follow-directions.ogg",
  "https://geo-tour.s3-us-west-2.amazonaws.com/cherokee/story/kanati.ogg",
  "https://geo-tour.s3-us-west-2.amazonaws.com/cherokee/story/selu.ogg",
  "https://geo-tour.s3-us-west-2.amazonaws.com/cherokee/story/spearfinger.ogg"
];

const ig = url => [
  "/add",
  "/getSession",
  "/mark",
  "/tours",
  "/tour",
  "/qos"
].reduce((found, key) => found || String(url).includes(key), false);


const ignore = url => {
  const i = ig(url);
  return i;
}




self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log("SW install--:", event);
  event.waitUntil(
    caches.open('core')
      .then(cache =>
        Promise.all(coreFiles.map(f =>
          cache.add(f)
            //             .then(  ()=>   console.log(`Cached  ${f}`)) 
            .catch(e => console.log(`Failed to cache ${f}   ${e} `))
        )
        )
      )
  )
});





self.addEventListener('activate', (event) => {

  /****
  
var request = indexedDB.open("GPSdata", 1);
var db;
request.onerror =   e=>  console.log("Why didn't you allow my web app to use IndexedDB?!");

request.onsuccess = e=>{
  db = event.target.result;
  console.log( "idb=>", db );
};
  
  
db.onerror = function(event) {
  console.error("Database error: " + event.target.errorCode);
};

// This event is only implemented in recent browsers   
request.onupgradeneeded = function(event) { 
  // Save the IDBDatabase interface 
  var db = event.target.result;

  // Create an objectStore for this database
  var objectStore = db.createObjectStore("name", { keyPath: "myKey" });
};

*******************/





  var cacheKeeplist = ['core', idCache];

  console.log("SW activate:", event);
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(keyList.map(key => {
        if (cacheKeeplist.indexOf(key) === -1)
          caches.delete(key)
            .then(() => console.log(`Deleted obsolete cache ${key}`))
            .catch(e => console.log(`Failed to delete cache ${key}   ${e} `));
      }))
    )
  );
});



const metaResponse = req => {
  const menu = `<H2> <a href="/cacheview"   target="_self">View Cache Contents</a>   </H2>
              <H2> <a href="/cacheupload" target="_self">Upload Cache URLs</a>     </H2>
              <H2> <a href="/cacheclear"  target="_self">Clear Volatile Cache</a>  </H2>
              <H2> <a href="/cachereset"  target="_self">Clear Core Cache</a>      </H2><p></p>`;
  const opts = { headers: { 'Content-Type': 'text/html' } };





  if (String(req.url) === '/')
    return fetch('/version')
      .then(res => res.json())
      .then(response => {
        return null;
      });
  if (String(req.url).includes("cachemenu"))
    return new Response(menu, { headers: { 'Content-Type': 'text/html' } });
  if (String(req.url).includes("cachereset"))
    return caches.delete('core')
      .then(ok => new Response(`${menu} <h4>Core cache deleted: ${ok}</h4>`, opts))
      .catch(err => new Response(`${menu} <h4>Core delete failed: ${err}</h4>`, opts))
  if (String(req.url).includes("cacheclear"))
    return caches.delete(idCache)
      .then(ok => new Response(`${menu} <h4>Volatile cache deleted: ${ok}</h4>`, opts))
      .catch(err => new Response(`${menu} <h4>Volatile cache delete failed: ${err}</h4>`, opts))
  if (String(req.url).includes("cacheview"))
    return Promise.all([
      menu,
      caches.open('core')
        .then(cache => cache.keys())
        .then(keys =>
          `<h4>Files in Core cache</h4>${keys.reduce((html, k) => html + `<li>${k.url}</li>`, "<UL>") + "</UL>"}`),
      caches.open(idCache)
        .then(cache => cache.keys())
        .then(keys =>
          `<h4>Files in volatile cache ${idCache}</h4> ${keys.reduce((html, k) => html + `<li>${k.url}</li>`, "<UL>") + "</UL>"}`)
    ])
      .then(htmlarray => new Response(htmlarray.join(), opts))
      .catch(err => new Response(`${menu} <h4>Display caches failed: ${err}</h4>`, opts))

  if (String(req.url).includes("cacheupload"))

    return Promise.all([
      caches.open('core').then(cache => cache.keys()).then(keys => keys.map(k => k.url)),
      caches.open(idCache).then(cache => cache.keys()).then(keys => keys.map(k => k.url))
    ])
      .then(arrayofarrays => //save to server and pass through the server response to the app
        fetch(`https://geotour.glitch.me/cache/upload/${new Date().toISOString().replaceAll(':', '-').replaceAll('.', '_').replace('T', '__').replace('Z', '')}`,
          { method: 'post', body: JSON.stringify(arrayofarrays.flat()) })
          .then(serverresponse => serverresponse.text())
          .then(servertext => new Response(`${menu} <h4>Cache Upload: ${servertext}</h4>`, opts))
          .catch(err => new Response(`${menu} <h4>Cache Upload failed: ${err}</h4>`, opts))
      );

  return null;
}


self.addEventListener('fetch', event =>
  event.respondWith(

    metaResponse(event.request)
    ??
    caches.match(event.request)
      .then(resp =>
        resp
        ??
        fetch(event.request /*, {'mode': 'no-cors'}*/)
          .then(response => {
            if (!ignore(event.request.url)) {
              let clone = response.clone();
              caches.open(idCache)
                .then(cache =>
                  cache.put(event.request.url, clone)
                    //                             .then( ()=>   console.log(`FOUND & CACHED  - unanticipated file  ${event.request.url}     `)) 
                    .catch(e => console.log(`Failed to CACHE - unanticipated file  ${event.request.url} ${e}`))
                );
            } //            newcache 
            return response;
          }) //   passthru or newcache 
      ) // cached, passthru or newcache 
  ) ///respondwith
)

