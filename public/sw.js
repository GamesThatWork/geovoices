
const version = "4.01.52";
const idCache = "v" + version;



// Resilient imports with fallbacks for both url.js and app.js, because these files may not be available in the service worker context

let url = { // hardcoded fallback url object
  content: {
    silence:  '/assets/silence.ogg',
    load:     '/content/cherokee/'
  },
  map: {
    car:      '/assets/icon-192x192.png',
    guibg:    '/assets/subtletexture1.jpg',
    pinshadow:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png'
  }
};
import('./url.js').then(urlModule => url = urlModule?.default ?? url).catch(e => {}); // use url.js if available


let zoomRange = { min: 12, max: 16 }; // hardcoded fallback
import('./app.js').then(appModule =>  zoomRange = appModule?.default?.zoomRange ?? zoomRange ).catch(e => {});  // use app.js zoom range if available





const coreFiles = [
  "/favicon.ico",
  "/assets/icon-256x256.png",
  "/assets/icon-192x192.png",   
  "/assets/weavetile.png", 
  "/assets/video.mp4",
  "/assets/bell.ogg",
  "/assets/bellflat.ogg",
  "/assets/spider.png",
  "/assets/spidershadow.png",
  "/assets/xdotred.png",
  "/assets/xdothadow.png",
  // used only during installation , but maybe they will try to install while offline
  "/assets/icon-384x384.png",
  "/assets/icon-512x512.png", 
  "/assets/maskable_icon_x384.png",
  "/assets/maskable_icon_x512.png",
  "/assets/GeotourScreenShot.PNG",
  
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.js",
  "https://unpkg.com/leaflet@1.6.0/dist/leaflet.css",
  "https://fonts.googleapis.com/css2?family=Cherry+Swash&family=Share+Tech+Mono&display=swap",
  "https://fonts.gstatic.com/s/cherryswash/v18/i7dNIFByZjaNAMxtZcnfAy5MSXK_IwU.woff2",
  "https://fonts.gstatic.com/s/cherryswash/v18/i7dNIFByZjaNAMxtZcnfAy5MR3K_.woff2",
  "https://fonts.gstatic.com/s/sharetechmono/v15/J7aHnp1uDWRBEqV98dVQztYldFcLowEF.woff2",

  url.content.silence, 
  url.content.load +       "intro.mp3",
  url.content.load + "music/intro.mp3",
  url.content.load + "story/intro.mp3",
  url.content.load + "guide/intro.mp3",
  url.content.load + "music/outro.mp3",
  url.content.load + "story/outro.mp3",
  url.content.load + "guide/outro.mp3",
  url.map.car,         //  "/assets/icon-192x192.png",
  url.map.guibg,       //  "/assets/subtletexture1.jpg",
  url.map.pinshadow,   // "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  ];

const ig = (url) =>
  ["/add", "/getSession", "/mark","/weave","/qos"].reduce(
    (found, key) => found || String(url).includes(key),
    false
  );

const ignore = (url) => {
  const i = ig(url);
  //console.log( url, i );
  return i;
};

// Offline POST request handling system
const postMethod = (() => {
  const cacheName = 'deferredPosts',

  // Store failed POST request for retry
  encache = request =>  
    caches.open(cacheName)
      .then(cache => {
        const timestamp = Date.now();
        const storageUrl = `${self.location.origin}/deferred-${timestamp}`;
        
        return request.clone().text().then(body => {
          const postData = {
            url: request.url,
            method: request.method,
            headers: Array.from(request.headers.entries()),
            body: body,
            timestamp: timestamp
          };
          
          const getRequest = new Request(storageUrl);
          const response = new Response(JSON.stringify(postData), {
            headers: { 'Content-Type': 'application/json' }
          });
          
          return cache.put(getRequest, response)
            .then(() => console.log('POST request stored for offline retry:', request.url));
        });
      })
      .catch(error => console.error('Failed to store POST request offline:', error));
  
  // Retry all stored POST requests
  const retryAll = () => caches.open(cacheName)
    .then(cache => 
      cache.keys()
        .then(requests => {
          const retryPromises = requests
            .filter(req => req.url.includes('/deferred-'))
            .map(storageRequest => {
              return cache.match(storageRequest)
                .then(response => response.json())
                .then(original => {
                  const originalRequest = new Request(original.url, {
                    method: original.method,
                    headers: new Headers(original.headers),
                    body: original.body
                  });

                  return fetch(originalRequest)
                    .then(retryResponse => {
                      if (retryResponse.ok) {
                        return cache.delete(storageRequest)
                          .then(() => console.log('Offline POST request successfully retried:', original.url));
                      }
                    })
                    .catch(error => console.log('POST retry failed, keeping for next attempt:', error));
                });
            });
          return Promise.all(retryPromises);
        })
    );

  // respond to  POST request with offline fallback
  const fetchPost = request => {
    return fetch(request.clone())
      .then(response => {
        if (response.ok) {
          retryAll();
          return response;
        } else {
          return encache(request)
            .then(() => 
              new Response(JSON.stringify({ status: 'Stored for retry', offline: true }), { 
                status: 200,  /// return fake success to prevent app-level error handling
                headers: { 'Content-Type': 'application/json' }
              })
            );
        }
      })
      .catch(error => 
        encache(request)
          .then(() => {
            console.log('POST request failed (offline), stored for retry:', request.url);
            return new Response(JSON.stringify({ status: 'Stored offline', offline: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          })
      );
  };

  return fetchPost;
})();





self.addEventListener("install", (event) => {
  self.skipWaiting();
  console.log("SW install--:", event);
  event.waitUntil(
    caches.open("core").then((cache) =>
      Promise.all(
        coreFiles.map((f) =>
          cache
            .add(f)
            .then(() => console.log(`Cached  ${f}`))
            .catch((e) => console.log(`Failed to cache ${f}   ${e} `))
        )
      )
    )
  );
});

self.addEventListener("activate", (event) => {
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

  var cacheKeeplist = ["core", idCache, "tourContent"];

  console.log("SW activate:", event);
  event.waitUntil(
    self.clients.claim().then(() =>
      caches.keys().then((keyList) =>
        Promise.all(
          keyList.map((key) => {
            if (cacheKeeplist.indexOf(key) === -1)
              caches
                .delete(key)
                .then(() => console.log(`Deleted obsolete cache ${key}`))
                .catch((e) =>
                  console.log(`Failed to delete cache ${key}   ${e} `)
                );
          })
        )
      )
    )
  );
});

// // respond to  custom cache:// URL scheme
// const handleCacheCommand = (command) => {
//   console.log('Cache command:', command);
  
//   switch (command) {
//     case 'clear':
//       return caches.delete(idCache)
//         .then(ok => new Response(JSON.stringify({ status: 'cleared', cache: idCache, success: ok }), {
//           headers: { 'Content-Type': 'application/json' }
//         }))
//         .catch(err => new Response(JSON.stringify({ error: err.message }), {
//           status: 500,
//           headers: { 'Content-Type': 'application/json' }
//         }));
    
//     case 'reset':
//       return caches.delete('core')
//         .then(ok => new Response(JSON.stringify({ status: 'reset', cache: 'core', success: ok }), {
//           headers: { 'Content-Type': 'application/json' }
//         }))
//         .catch(err => new Response(JSON.stringify({ error: err.message }), {
//           status: 500,
//           headers: { 'Content-Type': 'application/json' }
//         }));
    
//     default:
//       return new Response(JSON.stringify({ error: `Unknown cache command: ${command}` }), {
//         status: 400,
//         headers: { 'Content-Type': 'application/json' }
//       });
//   }
//};


const opts = { headers: { "Content-Type": "text/html" } };

const menu = `<H2> <a href="cache://view"   target="_self">View Cache Contents</a>   </H2>
              <H2> <a href="cache://upload" target="_self">Upload Cache URLs</a>     </H2>
              <H2> <a href="cache://clear"  target="_self">Clear Volatile Cache</a>  </H2>
              <H2> <a href="cache://reset"  target="_self">Clear Core Cache</a>      </H2><p></p>`;

const cacheMethod = {
  menu: () => new Response(menu, opts),
  
        reset: ()=>   caches
                        .delete("core")
                        .then(  ok    => new Response(`${menu} <h4>Core cache deleted: ${ok}</h4>`, opts) )
                        .catch( err   => new Response(`${menu} <h4>Core delete failed: ${err}</h4>`, opts) ),

        clear: ()=>   caches
                        .delete(idCache)
                        .then( ok   => new Response(`${menu} <h4>Volatile cache deleted: ${ok}</h4>`, opts) )
                        .catch( err => new Response(`${menu} <h4>Volatile delete failed: ${err}</h4>`, opts) ),

        view:  ()=> Promise.all([
                      caches
                        .open("core")
                        .then( cache => cache.keys())
                        .then( keys  =>`<h4>Files in Core cache</h4><UL>${keys.map( k=>`<li>${k.url}</li>`)}</UL>`),
                      caches
                        .open( idCache )
                        .then( cache => cache.keys())
                        .then( keys  =>`<h4>Files in volatile cache ${idCache}</h4><UL>${keys.map( k=>`<li>${k.url}</li>`)}</UL>`)
                        ])
                      .then( htmlarray => new Response( htmlarray.join(), opts))
                      .catch(      err => new Response(`${menu} <h4>Display caches failed: ${err}</h4>`, opts)  ),
      
      upload: ()=> Promise.all([
                     caches
                      .open("core")
                      .then((cache) => cache.keys())
                      .then((keys) => keys.map((k) => k.url)),
                    caches
                      .open(idCache)
                      .then((cache) => cache.keys())
                      .then((keys) => keys.map((k) => k.url)),
                      ])
                    .then( arrayofarrays =>
                          fetch(
                            `/cache/upload/${new Date()
                              .toISOString()
                              .replaceAll(":", "-")
                              .replaceAll(".", "_")
                              .replace("T", "__")
                              .replace("Z", "")}`,
                            { method: "post", body: JSON.stringify(arrayofarrays.flat()) } )
                          .then( serverresponse => serverresponse.text())
                          .then( servertext     => new Response(`${menu} <h4>Cache Upload: ${servertext}</h4>`, opts) )
                          .catch(           err => new Response(`${menu} <h4>Cache Upload failed: ${err}</h4>`, opts) )
                          ),
        default: ()=>new Response(`${menu} <h4>Unknown cache command: ${command}</h4>`, opts)
        }; 



 const versionMethod = () => new Response( JSON.stringify({ version }), opts);
  




self.addEventListener("fetch", (event) => {
  //console.log("fetch", event);
  
  let [ , method, key ] = /^\/?(cache|version):?[\/]*(.*)/.exec(String(event.request.url)) ?? [null, null, null];
  console.log('Fetch method:', method, 'Key:', key, 'URL:', event.request.url );

  // respond to  custom cache:// scheme
  if ( method === 'version'           )  return event.respondWith( versionMethod() );
  // respond to  custom cache:// scheme  
  if ( method === 'cache'             )  return event.respondWith( cacheMethod[key]?.() ?? cacheMethod.default() );
  // redirect POST fetches to use outbound caching system, resilient to connection drops!!
  if ( event.request.method === 'POST')  return event.respondWith( postMethod(event.request) );

  // meanwhile GET fetches use cache-first strategy to expedite loading
  event.respondWith(
    caches.match(event.request).then(  // normal GET fetches use cache-first strategy
        resp =>
          resp ??  // cache hit!! our work is done, return cached response
          
        
          fetch(event.request /*, {'mode': 'no-cors'}*/)  // cache miss. time for a real fetch
          
          .then((response) => {
            //                if (event.request.url.match(/tour\//i) && localStorage.getItem("cachedTour") != event.request.url) {
            //                 localStorage.setItem("cachedTour", event.request.url);
        
           if (  event.request.url.match(/tour\//i) ) {
              // if this is a tour deinition, we must cache all the resources it references (media, map tiles, etc)
              let clone = response.clone();
              clone.text().then( json => {
                try {
                  const tour = JSON.parse(json);
                  const mediaArr = [];
                  const latArr = [];
                  const lngArr = [];
                  const urlTileArr = [];
                  findMedia(tour, mediaArr, latArr, lngArr);
                  
                  for(var x = zoomRange.min; x <= zoomRange.max; x++) 
                    createUrlTileArr(latArr, lngArr, urlTileArr, x);
                  
                  
                  //   createUrlTileArr(latArr, lngArr, urlTileArr, 16);
                  //const { mediaArr, latArr, lngArr } = findMedia(tour); //destructure

                  let mediaUrls = mediaArr.map( element =>"/content/cherokee/" + element);
                  console.log(mediaArr);
                  console.log(mediaUrls);

                  let combinedMediaTiles = [...mediaUrls, ...urlTileArr];
                  console.log(combinedMediaTiles);

                  messagingSystem.reportProgress(combinedMediaTiles.length);

                caches.delete("tourContent")
                  .then(    () => caches.open("tourContent") )
                  .then( cache => fillCache(cache, combinedMediaTiles))
                  .catch( err => console.error("Failed to cache tour content:", err));
                }                 
                catch (error) {
                  console.error('Failed to parse tour JSON:', error);
                  return; // Skip caching if JSON is invalid
                }
              });
            }
            // if it is not on out ignore list, cache it
            if (!ignore(event.request.url)) {
              let clone = response.clone();
              caches.open( idCache )
                .then( cache => cache.put(event.request.url, clone)
                      .then( ()=> console.log(  `FOUND & CACHED  - unanticipated file  ${event.request.url}`) )
                      .catch( e =>console.log(  `Failed to CACHE - unanticipated file  ${event.request.url} ${e}`))
                );
            } //            newcache
            return response;
          }) //   passthru or newcache
      ) // cached, passthru or newcache
  ); // respondWith
});

const messagingSystem = {
  interval: null,
  channel: new BroadcastChannel("cacheProgress"),
  reportProgress: (expectedTotal) => {
    cacheCount = 0;
    messagingSystem.interval = setInterval(() => {
      let i = cacheCount / expectedTotal;
      messagingSystem.channel.postMessage({
        messageType: "progress",
        progress: i,
        cached: cacheCount,
        expected: expectedTotal,
      });

      if (i >= 1) {
        messagingSystem.channel.postMessage({
          messageType: "end",
        });
        clearInterval(messagingSystem.interval);
      }
    }, 200);
  },
  reportUncachedFiles: (files) => {
    console.warn("Uncached Files", files);
    messagingSystem.channel.postMessage({
      messageType: "error",
      uncachedFiles: files,
    });
  },
};

var cacheCount = 0;

function fillCache(cache, files) {
  console.log("caching");
  const good = [];
  const bad = [];

  let promiseArr = files.map((element) =>
    cache
      .add(element)
      .then(() => {
        good.push(element);
        cacheCount++;
      })
      .catch(() => bad.push(element))
  );
  Promise.allSettled(promiseArr)
    .then(() => {
      //console.log("good: ", good, "bad: ", bad);

      if (bad.length != 0 && good.length == 0) {
        throw new Error(bad);
      }

      if (bad.length != 0 && good.length != 0) {
        console.log("recursing", good.length, bad.length);
        setTimeout(() => fillCache(cache, bad), 1000);
      }
    })
    .catch(() => {
      messagingSystem.channel.postMessage({
        messageType: "end",
      });
      clearInterval(messagingSystem.interval);
      messagingSystem.reportUncachedFiles(bad);
    });
}

function findMedia(tour, mediaArr, latArr, lngArr) {
  for (var k in tour) {
    if (tour[k] instanceof Object) {
      findMedia(tour[k], mediaArr, latArr, lngArr);
    } else {
      var found = [
        ".ogg",
        ".mp4",
        ".wav",
        ".jpg",
        ".jpeg",
        ".png",
        ".mp3",
        ".gif",
      ].find((key) => String(tour[k]).includes(key));

      if (found && !mediaArr.includes(tour[k])) {
        mediaArr.push(tour[k]);
      }

      if (k == "lat") {
        latArr.push(tour[k]);
      }

      if (k == "lng") {
        lngArr.push(tour[k]);
      }
    }
  }
}

function createUrlTileArr(latArr, lngArr, urlTileArr, zoom) {
  var latMin = lat2tile(Math.min.apply(Math, latArr), zoom); //Works in North Western Hemisphere
  var latMax = lat2tile(Math.max.apply(Math, latArr), zoom);
  var lngMin = lon2tile(Math.min.apply(Math, lngArr), zoom);
  var lngMax = lon2tile(Math.max.apply(Math, lngArr), zoom);

  for (var lat = latMax; lat < latMin; lat++) {
    for (var lng = lngMin; lng < lngMax; lng++) {
      urlTileArr.push(
        `https://b.tile.openstreetmap.org/${zoom}/${lng}/${lat}.png`
      );
    }
  }
}

function lon2tile(lon, zoom) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}
function lat2tile(lat, zoom) {
  return Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom)
  );
}
