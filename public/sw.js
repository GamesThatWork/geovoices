import app from "./app.js";
import url from "./url.js";

const version = 56335;
const idCache = "v" + version;

const coreFiles = [
  "/favicon.ico",
  "https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Ficon-256x256.png?v=1600674220690",
//  "https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Ficon-192x192.png?v=1600674220629",   
  "https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Fvideo.mp4?v=1597966654897",
  "https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Fbell.ogg?v=1596142355686",
  "https://cdn.glitch.com/82396493-cf04-4e83-9abb-cf8ed0317c6d%2Fbellflat.ogg?v=1602666868937",
  "https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Fspider.png?v=1598354432023",
  "https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Fspidershadow.png?v=1598354776236",
  "https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Fxdotred.png?v=1597379072995",
  "https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Fxdothadow.png?v=1597379276815",
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
  url.map.car,         //  "https://cdn.glitch.com/eb91c95e-0ab7-4dca-bea8-9d13e48bdbde%2Ficon-192x192.png?v=1600674220629",
  url.map.guibg,       //  "https://cdn.glitch.com/82396493-cf04-4e83-9abb-cf8ed0317c6d%2Fsubtletexture1.jpg?v=1610206007889",
  url.map.pinshadow,   // "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  ];

const ig = (url) =>
  ["/add", "/getSession", "/mark","weave","/qos"].reduce(
    (found, key) => found || String(url).includes(key),
    false
  );

const ignore = (url) => {
  const i = ig(url);
  //console.log( url, i );
  return i;
};

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

const metaResponse = (req) => {
  const menu = `<H2> <a href="/cacheview"   target="_self">View Cache Contents</a>   </H2>
              <H2> <a href="/cacheupload" target="_self">Upload Cache URLs</a>     </H2>
              <H2> <a href="/cacheclear"  target="_self">Clear Volatile Cache</a>  </H2>
              <H2> <a href="/cachereset"  target="_self">Clear Core Cache</a>      </H2><p></p>`;
  const opts = { headers: { "Content-Type": "text/html" } };

  //  var dbPromise = idb.open('test-db1', 1);
  //  console.log( "idb dbPromise: ", dbPromise );

  //  console.log("META FETCH test: "+ req.url);
  if (String(req.url) === "/")
    return fetch("/version")
      .then((res) => res.json())
      .then((response) => {
        //        console.log("Version: "+ response.version );
        return null;
      });
  if (String(req.url).includes("cachemenu"))
    return new Response(menu, { headers: { "Content-Type": "text/html" } });
  if (String(req.url).includes("cachereset"))
    return caches
      .delete("core")
      .then(
        (ok) => new Response(`${menu} <h4>Core cache deleted: ${ok}</h4>`, opts)
      )
      .catch(
        (err) =>
          new Response(`${menu} <h4>Core delete failed: ${err}</h4>`, opts)
      );
  if (String(req.url).includes("cacheclear"))
    return caches
      .delete(idCache)
      .then(
        (ok) =>
          new Response(`${menu} <h4>Volatile cache deleted: ${ok}</h4>`, opts)
      )
      .catch(
        (err) =>
          new Response(
            `${menu} <h4>Volatile cache delete failed: ${err}</h4>`,
            opts
          )
      );
  if (String(req.url).includes("cacheview"))
    return Promise.all([
      menu,
      caches
        .open("core")
        .then((cache) => cache.keys())
        .then(
          (keys) =>
            `<h4>Files in Core cache</h4>${
              keys.reduce((html, k) => html + `<li>${k.url}</li>`, "<UL>") +
              "</UL>"
            }`
        ),
      caches
        .open(idCache)
        .then((cache) => cache.keys())
        .then(
          (keys) =>
            `<h4>Files in volatile cache ${idCache}</h4> ${
              keys.reduce((html, k) => html + `<li>${k.url}</li>`, "<UL>") +
              "</UL>"
            }`
        ),
    ])
      .then((htmlarray) => new Response(htmlarray.join(), opts))
      .catch(
        (err) =>
          new Response(`${menu} <h4>Display caches failed: ${err}</h4>`, opts)
      );

  if (String(req.url).includes("cacheupload"))
    return Promise.all([
      caches
        .open("core")
        .then((cache) => cache.keys())
        .then((keys) => keys.map((k) => k.url)),
      caches
        .open(idCache)
        .then((cache) => cache.keys())
        .then((keys) => keys.map((k) => k.url)),
    ]).then(
      (
        arrayofarrays //save to server and pass through the server response to the app
      ) =>
        fetch(
          `https://geotour.glitch.me/cache/upload/${new Date()
            .toISOString()
            .replaceAll(":", "-")
            .replaceAll(".", "_")
            .replace("T", "__")
            .replace("Z", "")}`,
          { method: "post", body: JSON.stringify(arrayofarrays.flat()) }
        )
          .then((serverresponse) => serverresponse.text())
          .then(
            (servertext) =>
              new Response(`${menu} <h4>Cache Upload: ${servertext}</h4>`, opts)
          )
          .catch(
            (err) =>
              new Response(`${menu} <h4>Cache Upload failed: ${err}</h4>`, opts)
          )
    );

  return null;
};

self.addEventListener("fetch", (event) => {
  //console.log("fetch", event);
  event.respondWith(
    metaResponse(event.request) ??
      caches.match(event.request).then(
        (resp) =>
          resp ??
          fetch(event.request /*, {'mode': 'no-cors'}*/)
          
          .then((response) => {
            //                if (event.request.url.match(/tour\//i) && localStorage.getItem("cachedTour") != event.request.url) {
            //                  localStorage.setItem("cachedTour", event.request.url);
            if (
              event.request.url.match(/tour\//i) &&
              event.request.method == "GET"
            ) {
              let clone = response.clone();
              clone.text().then((json) => {
                const tour = JSON.parse(json);
                const mediaArr = [];
                const latArr = [];
                const lngArr = [];
                const urlTileArr = [];
                findMedia(tour, mediaArr, latArr, lngArr);
                
                for(var x = app.zoomRange.min; x <= app.zoomRange.max; x++) {
                  createUrlTileArr(latArr, lngArr, urlTileArr, x);
                }
                
                //   createUrlTileArr(latArr, lngArr, urlTileArr, 16);
                //const { mediaArr, latArr, lngArr } = findMedia(tour); //destructure

                let mediaUrls = mediaArr.map(
                  (element) =>
                    "https://geo-tour.s3-us-west-2.amazonaws.com/cherokee/" +
                    element
                );
                console.log(mediaArr);
                console.log(mediaUrls);

                let combinedMediaTiles = [...mediaUrls, ...urlTileArr];
                console.log(combinedMediaTiles);

                messagingSystem.reportProgress(combinedMediaTiles.length);

                caches.delete("tourContent").then(() =>
                  caches.open("tourContent").then((cache) => {
                    fillCache(cache, combinedMediaTiles);
                  })
                );
              });
            }

            if (!ignore(event.request.url)) {
              let clone = response.clone();
              caches.open(idCache).then((cache) =>
                cache
                  .put(event.request.url, clone)
                  .then(() =>
                    console.log(
                      `FOUND & CACHED  - unanticipated file  ${event.request.url}     `
                    )
                  )
                  .catch((e) =>
                    console.log(
                      `Failed to CACHE - unanticipated file  ${event.request.url} ${e}`
                    )
                  )
              );
            } //            newcache
            return response;
          }) //   passthru or newcache
      ) // cached, passthru or newcache
  ); ///respondwith
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
