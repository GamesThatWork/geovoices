// server.js
// where your node app starts
const versionID = 5;

import express from "express";
import path from "path";
import fs from "fs";
import bodyParser from "body-parser";
import { createProxyMiddleware } from "http-proxy-middleware";
import sqlite3 from "sqlite3";
import fileUpload from "express-fileupload";

const app = express();

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// this imports an aggregated version of S3 that exposes the .send operation
import {
  S3Client,
  ListObjectsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
  region: "us-west-2",
});

const extensions = {
  audio: ".webm,.mp3,.ogg,.wav,.m4a",
  image: ".webp,.jpg,.gif,.png,.jpeg",
  video: ".webm,.mp4,.mov,.avi,.mkv",
};

const sendList = (response, medium, pfx) =>
  s3
    .send(new ListObjectsCommand({ Bucket: AWSBUCKET }))
    .then((list) =>
      response.send(
        JSON.stringify(
          list.Contents.map((o) => o.Key.toLowerCase())
            .filter(
              (name) =>
                !extensions[medium] ||
                extensions[medium].includes(name.match(/\.[a-z0-9]*$/) ?? ".")
            )
            .filter((name) => !pfx || name.startsWith(pfx))
            .filter((name) => name != "")
            .map((name) => name.replace(pfx, ""))
        )
      )
    )
    .catch((err) => response.send(err.stack));

// example: .../contents?medium=audio&folder=cherokee/story
app.get("/contents", (request, response) =>
  sendList(
    response,
    request.query.medium,
    `${(request.query.folder ?? "").replace(/\/$/, "")}/`
  )
);

// app.get("/contents/:medium/:project*?", (request, response) =>
//     sendList(  response,
//                request.params.medium,
//                request.params.project? request.params.project+"/" :""
//     ));
// app.get("/contents/:project*?", (request, response) =>{
//     console.log("project=",request.params.project? request.params.project+"/" :"");
//     sendList(  response, false,  );
//     });

const sendHTML = (response, medium, pfx) =>
  s3
    .send(new ListObjectsCommand({ Bucket: AWSBUCKET }))
    .then((list) =>
      response.send(
        `<h2>Contents of ${pfx}</h2><ol>` +
          list.Contents.map((o) => o.Key.toLowerCase())
            .filter(
              (name) =>
                !extensions[medium] ||
                extensions[medium].includes(name.match(/\.[a-z0-9]*$/) ?? ",")
            )
            .filter((name) => name.startsWith("cherokee/" + pfx))
            .filter((name) => name)
            .map((name) =>
              name.includes(".")
                ? `<li><a href="${urlAWS + name}">${name
                    .replace("cherokee/" + pfx + (pfx ? "/" : ""), "")
                    .replace(".mp3", "")
                    .replace(/\-/g, " ")}`
                : `</ol><h4>${name.replace("cherokee/" + pfx, "")}</h4><ol>`
            )
            .join("") +
          `</ol>
      
      
     <form   action="/content" method="POST" 
             enctype="multipart/form-data"   >
        <label for="uploadfile">
          upload (or overload) a file within the '<b><u>${pfx}</u></b>' folder<BR>
         <input type="file"  id="uploadfile" name="uploadfile" accept="audio/*"><br/>
         <input type="text"  id="key" name="key" placeholder="watch this space, edit name and path if needed" size="120">
         <br><br>
         <button type="submit">submit</button>
    </form>

  <script>
      var key = document.querySelector( "#key" );
      var upf = document.querySelector( "#uploadfile" );
      upf.addEventListener( "change", e=> 
        key.value ="${pfx}"+
                '/'+String(upf.value).match( /[A-Za-z0-9\\.\\-\\_]*$/, "") );
      </script>`
      )
    )
    .catch((err) => response.send(err.stack));

app.get("/files/:medium/*?", (request, response) =>
  sendHTML(response, request.params.medium, request.params[0] ?? "")
);

const AWSBUCKET = "geo-tour"; //"geotour.content"

const urlAWS = `https://${AWSBUCKET}.s3-us-west-2.amazonaws.com/`;
const pfxCherokee = "cherokee/";
app.use(fileUpload());

app.post("/content", (request, response) => {
  // Binary data base64
  const incoming = request.files.uploadfile;
  // console.log(incoming.key, incoming.name, incoming, request);

  //  console.log(incoming.key, incoming.name, incoming, request);
  const fileContent = Buffer.from(incoming.data, "binary");
  // Setting up S3 upload parameters
  const params = {
    Bucket: AWSBUCKET,
    Key: pfxCherokee + (request.body?.key ?? incoming.name), // File name you want to save as in S3
    Body: fileContent,
    ContentType: incoming.type ?? incoming.mimetype,
    Metadata: {
      author: request.body?.author ?? "anonymous",
    },
  };
  console.log(request);
  // response.status(200).send( JSON.stringify( request.body ));
  // return;

  s3.send(new PutObjectCommand(params))
    .then((ok) =>
      response
        .status(200)
        .send(JSON.stringify({ status: "saved", url: urlAWS + params.Key }))
    )
    .catch((err) => response.send(err.stack));
});

app.use(
  "/content/",
  createProxyMiddleware({
    logLevel: "info",
    onProxyRes: (proxyRes, req, res) => {
      console.log("PROXY RES", proxyRes);
    },
    onProxyReq: (proxyRes, req, res) => {
      console.log("PROXY REQ", proxyRes);
    },
    target: "https://cdn.glitch.com/", // target host
    changeOrigin: true, // needed for virtual hosted sites
    ws: true, // proxy iockets
    pathRewrite: {
      //  '^/api/old-path': '/api/new-path', // rewrite path
      //  '^/api/remove/path': '/path', // remove base path
    },
    router: {
      // when request.headers.host == 'dev.localhost:3000',
      // override target 'http://www.example.org' to 'http://localhost:8000'
      //  'dev.localhost:3000': 'http://localhost:8000',
    },
  })
);

// http://localhost:3000/api/foo/bar -> http://www.example.org/api/foo/bar
const XL = { limit: "50mb", extended: true };

app.use(bodyParser.urlencoded(XL));
app.use(bodyParser.json(XL));
app.use(bodyParser.text(XL));

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public", { dotfiles: "allow" }));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// init sqlite db
const dbFile = "./.data/geotour.db";
const exists = fs.existsSync(dbFile);
const db = new sqlite3.Database(dbFile);

const TEXT    = "TEXT",
      REAL    = "REAL",
      INTEGER = "INTEGER";

  
const model = {
  Session: { 
    name:         TEXT,
    userAgent:    TEXT, 
    device:       TEXT, 
    timestamp:    INTEGER 
   },
  Fix: {
    session:      INTEGER,
    id:           INTEGER,
    lat:          REAL,
    long:         REAL,
    fixTime:      INTEGER,
    dbTime:       INTEGER,
   "PRIMARY KEY": "(session, id)"
    },
  Pin: {
    id:           INTEGER,
    time:         INTEGER,
    session:      INTEGER, 
    fix:          INTEGER, 
    lat:          REAL,
    long:         REAL,
    name:         TEXT,
    note:         TEXT, 
    tags:         TEXT, 
    worth:        REAL,
    active:       INTEGER, 
    trigger:      INTEGER, 
    station:      INTEGER, 
    direction:    INTEGER,
   "PRIMARY KEY": "(id)",
  },
  Qos: {
    id:           INTEGER, 
    session:      INTEGER,
    lat:          REAL,
    long:         REAL, 
    accuracy:     REAL, 
    fixTime:      INTEGER,
    responseTime: INTEGER,
    error:        INTEGER,
    message:      TEXT,
   "PRIMARY KEY": "(id)",
    },
  Usage: {
    user:         INTEGER,
    timestamp:    INTEGER,
    tourname:     TEXT, 
    version:      REAL,  
    pin:          TEXT, 
    zone:         INTEGER
    },
  Feedback: {
    user:         INTEGER,
    timestamp:    INTEGER,
    tourname:     TEXT,
    version:      REAL,
    stars:        INTEGER,
    comments:     TEXT,
    issues:       TEXT,
    name:         TEXT,
    email:        TEXT,
    device:       TEXT,
    follow:       TEXT
  },
};  
   



// const table = {
//   Session: " name TEXT, userAgent TEXT, device TEXT, timestamp INTEGER ",
//   Fix: "session INTEGER, id INTEGER, lat DOUBLE, long DOUBLE, fixTime UNSIGNED BIG INT, dbTime UNSIGNED BIG INT,   PRIMARY KEY (session, id)",
//   Pin: `id INTEGER PRIMARY KEY,  time UNSIGNED BIG INT,
//         session INTEGER, fix INTEGER, lat DOUBLE, long DOUBLE, 
//         name TEXT, note TEXT, tags TEXT, worth FLOAT,
//         active INTEGER, trigger INTEGER, station INTEGER, direction INTEGER
//         `,
//   Qos: "id INTEGER PRIMARY KEY, session INTEGER, lat DOUBLE, long DOUBLE, accuracy DOUBLE, fixTime UNSIGNED BIG INT, responseTime UNSIGNED BIG INT, error INTEGER, message TEXT",
// };

db.serialize(  () => {
    Object.keys( model ).forEach( table => {
      let cmd= `CREATE TABLE IF NOT EXISTS 
                  ${table} (
                    ${ Object.keys(model[table]).map( k=>
                        `${k}  ${model[table][k]}`
                                  ).join(",\n") }
                                  )`; 
      db.run( cmd, err=>console.error( err??"Succeess: ", err? cmd :  `New Table "${table}" created!` ) );
      });
});

//app.get("/",        (request, response) =>   response.sendFile(`${__dirname}/views/index.html`));
app.get("/", (request, response) =>{
  let [sub,domain,tld] =( request.headers.host ??"").split(".");
  let html=  ((domain=="glitch")   || (sub=="www"))? 
          `${__dirname}/views/landingpage.html`
      :   `${__dirname}/views/geotour.html`;
  console.log({ sub, domain, tld, html });
  response.sendFile( html );
});

app.get("/qos", (request, response) =>
  response.sendFile(`${__dirname}/views/qos.html`)
);

app.get("/weave", (request, response) =>  response.sendFile(`${__dirname}/views/weaver.html`) );

app.get("/map", (request, response) =>  response.sendFile(`${__dirname}/views/map.html`));

app.get("/reset", (request, response) =>
  response.sendFile(`${__dirname}/views/reset.html`)
);
app.get("/clear", (request, response) =>
  response.sendFile(`${__dirname}/views/clear.html`)
);
app.get("/version", (request, response) =>
  response.send(JSON.stringify({ version: versionID }))
);

app.get("/.well-known/assetlinks.json", (request, response) =>
  response.sendFile(`${__dirname}/.data/assetlinks.json`)
);
app.get("/thanks", (request, response) =>
  response.sendFile(`${__dirname}/views/thanks.html`)
);
app.get("/home", (request, response) =>
  response.sendFile(`${__dirname}/views/landingpage.html`)
);

app.get("/role", (request, response) =>
  response.sendFile(`${__dirname}/views/role.html`)
);

app.get("/uconnect", (request, response) =>
  response.sendFile(`${__dirname}/views/test-uconnect.html`)
);



// app.get("/favicon.ico", (request, response) =>
//         response.send( `${__dirname}/views/favicon.ico`)
// );

/*
app.get("/role", (request, response) =>
  response.status(200).send(`<!DOCTYPE html>
                  <html>
                      <div >My role is <select><option>editor</optoion><option>developer</optoion><option>player</optoion></select></div>   
                      <script type="module">
                          window.onload= ()=>{
                              document.querySelectorAll( "option" ).forEach( o=>  o.selected = o.value==localStorage.getItem( "role" ) )
                              document.querySelector(    "select" ).addEventListener( "change", e=>localStorage.setItem( "role", e.currentTarget.value ))
                              };
                      </script>
                  </html>`));

// depredated old crap
*/





app.get("/v0.4/tours", (request, response) =>
  response.send(
    JSON.stringify(
      fs
        .readdirSync("./tours/v0.4")
        .filter((e) => e.match(/\.json$/))
        .map((f) => f.split(".")[0])
    )
  )
);
app.get("/v0.4/tour/:tourname", (request, response) =>
  response.sendFile(`${__dirname}/tours/v0.4/cjson`)
);

app.post("/v0.4/tour/upload/:tourname", (request, response) =>
  fs.writeFile(
    `${__dirname}/tours/v0.4/${request.params.tourname}.json`,
    request.body,
    (err) => response.send(err || "successful file save")
  )
);

/*app.get( "/v0.5/tour/:tourname",        (request, response) =>
    response.sendFile(`${__dirname}/tours/${request.params.tourname}.tour`)
    );  
app.post("/v0.5/tour/upload/:tourname", (request, response) => 
         fs.writeFile(`${__dirname}/tours/${request.params.tourname}.tour`,
                request.body,
                  (err) => response.send(err? `<u>${err}</u>`:`Successful file save: <b>${request.params.tourname}.tour</b>`) ));   
*/



const tourlist= filter=>
      fs
        .readdirSync("./tours")
        .filter((e) => e.match(/\.tour$/))
        .map((f) => f.split(".")[0]);
    



app.get("/tours", (request, response) =>
  response.send( JSON.stringify( tourlist() )  ));




app.get("/tour/:tourname", (request, response) =>
  response.sendFile(`${__dirname}/tours/${
//     tourlist().find( tour=> 0== tour.localeCompare( request.params.tourname ))
     tourlist().find( tour=> tour.toLowerCase()==request.params.tourname.toLowerCase()  )
                                }.tour`)
);





app.post("/tour/:tourname", (request, response) =>
  fs.writeFile(
    `${__dirname}/tours/${request.params.tourname}.tour`,
    typeof request.body == "string"
      ? request.body
      : JSON.stringify(request.body),
    (err) =>
      response.send(
        err
          ? `<u>${err}</u>`
          : `Successful file save: <b>${request.params.tourname}.tour</b>`
      )
  )
);

app.get("/weaves/", (request, response) =>
  response.send(
    JSON.stringify(
      fs
        .readdirSync("./weaves")
        .filter((e) => e.match(/\.json$/))
        .map((f) => f.split(".")[0])
    )
  )
);
app.get("/weave/:name", (request, response) =>
  response.sendFile(`${__dirname}/weaves/${request.params.name}.json`)
);
app.post("/weave/:name", (request, response) =>
  fs.writeFile(
    `${__dirname}/weaves/${request.params.name}.json`,
    typeof request.body == "string"
      ? request.body
      : JSON.stringify(request.body),
    (err) =>
      response.send(
        err
          ? `<u>${err}</u>`
          : `Successful file save: <b>${request.params.name}</b>`
      )
  )
);

app.post("/feedback/upload", (request, response) =>
  response.send(
    Object.keys(request.body)
      .map((k) => `<li> ${k}:${request.body[k]}</li>`)
      .join("")
  )
);

app.post("/use/upload", (request, response) => {
  console.log(request.params.filename + " user upload attempt");
  let { userID, tour, version, history } = JSON.parse(request.body);
  let r = `received:<br/>
     ${history
       .map(
         (h) =>
           `${userID}: ${tour} (v${version} ${h.pin}, ${h.zone},  ${h.time} <br/>`
       )
       .join("")}`;
  response.send(r);

  //  fs.writeFile(  `${__dirname}/cache/${request.params.filename}.json`,  request.body,
  //    (err) => response.send( `<u>${err}</u>` || "successful file save"));
});

app.post("/qos/upload/:filename", (request, response) => {
  console.log(request.params.filename + " upload attempt");
  fs.writeFile(
    `${__dirname}/qos/${request.params.filename}.json`,
    request.body,
    (err) => response.send(err || "successful file save")
  );
});

app.post("/cache/upload/:filename", (request, response) => {
  console.log(request.params.filename + " CACHE upload attempt");
  fs.writeFile(
    `${__dirname}/cache/${request.params.filename}.json`,
    request.body,
    (err) => response.send(`<u>${err}</u>` || "successful file save")
  );
});

app.get("/null", (request, response) => {
  db.all("SELECT * from Fix", (err, rows) =>
    response.send(JSON.stringify(rows))
  );
});

// endpoint to get a session ID assisigment
app.post("/getSession", (request, response) => {
  console.log("/getSession");
  let sql = `INSERT INTO Session VALUES (
          "${request.body.name || "unnamed"}",
          "${request.get("User-Agent") || "agent unknown"}",
          "${request.body.device || "device unknown"}",          
          ${Date.now()} 
        )`;
  console.log(sql);
  db.run(sql, {}, function (err) {
    console.log(err, this.lastID);
    response.send(JSON.stringify({ session: this.lastID }));
  });
});

const trackgJ = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [],
      },
      properties: {
        name: "Track Session",
      },
    },
  ],
};

const pointsgJ = {
  type: "FeatureCollection",
  features: [],
};

app.get("/track", (request, response) => {
  db.all("SELECT * from Fix WHERE `Session`=87 ", (err, rows) =>
    rows.forEach((r) =>
      trackgJ.features[0].geometry.coordinates.push([r.long, r.lat])
    )
  );
  db.all("SELECT * from Fix WHERE `Session`=91 ", (err, rows) =>
    rows.forEach((r) =>
      trackgJ.features[0].geometry.coordinates.push([r.long, r.lat])
    )
  );
  response.send(JSON.stringify(trackgJ));
});

app.get("/mark", (request, response) => {
  let sql = `
    SELECT * from Fix  
      WHERE \`session\`= ${request.query.session}
      AND   \`id\`     = ${request.query.id}
    `;
  console.log(sql);
  db.get(sql, {}, (err, row) => {
    if (err) console.log(err);
    else if (row) response.send(JSON.stringify(row));
    else
      response.send(
        JSON.stringify(Object.assign({ failure: true }, request.query))
      );
    console.log(err, row);
  });
});

app.get("/path", (request, response) => {
  let sql = "";
  let runs = request.query.runs.split(",");
  if (!runs.length) runs = runs ? [runs] : [];
  trackgJ.features[0].geometry.coordinates = [];
  sql = `SELECT * from Fix ${runs
    .map((r, i) => (i ? " OR " : " WHERE ") + " session = " + r)
    .join(" ")}; `;
  console.log(request.query, sql);
  trackgJ.features[0].properties.name = `Runs ${runs.join(" + ")}; `;
  db.all(sql, (err, rows) => {
    rows.forEach((r) =>
      console.log(
        trackgJ.features[0].geometry.coordinates.push([r.long, r.lat])
      )
    );
    response.send(JSON.stringify(trackgJ));
  });
});

app.get("/fixes", (request, response) => {
  let runs = request.query.runs.split(",");
  if (!runs.length) runs = runs ? [runs] : [];
  trackgJ.features[0].geometry.coordinates = [];
  let sql = `SELECT * from Fix ${runs
    .map((r, i) => (i ? " OR " : " WHERE ") + " session = " + r)
    .join(" ")}; `;
  console.log(request.query, sql);
  trackgJ.features[0].properties.name = `Runs ${runs.join(" + ")}; `;
  db.all(sql, (err, rows) => response.send(JSON.stringify({ fixes: rows })));
});

app.get("/track", (request, response) => {
  db.all("SELECT * from Fix WHERE `Session`=87 ", (err, rows) =>
    rows.forEach((r) =>
      trackgJ.features[0].geometry.coordinates.push([r.long, r.lat])
    )
  );
  db.all("SELECT * from Fix WHERE `Session`=91 ", (err, rows) =>
    rows.forEach((r) =>
      trackgJ.features[0].geometry.coordinates.push([r.long, r.lat])
    )
  );
  response.send(JSON.stringify(trackgJ));
});

app.get("/pts", (request, response) => {
  db.all(
    "SELECT * from Fix WHERE `Session`=87 ORDER BY `fixTime` ASC",
    (err, rows) =>
      rows.forEach((r) =>
        pointsgJ.features.push({
          type: "Feature",
          properties: {
            timeReported: new Date(r.fixTime).toLocaleTimeString(),
          },
          geometry: {
            type: "Point",
            coordinates: [r.long, r.lat],
          },
        })
      )
  );
  db.all(
    "SELECT * from Fix WHERE `Session`=91 ORDER BY `fixTime` ASC",
    (err, rows) =>
      rows.forEach((r) =>
        pointsgJ.features.push({
          type: "Feature",
          properties: {
            timeReported: new Date(r.fixTime).toLocaleTimeString(),
          },
          geometry: {
            type: "Point",
            coordinates: [r.long, r.lat],
          },
        })
      )
  );
  response.send(JSON.stringify(pointsgJ));
});

//Implementation
function clean(s) {
  return typeof s === "string"
    ? s.replace(/'/g, "\\x27").replace(/"/g, "\\x22")
    : s;
}
     



app.post("/add/:datatype", (request, response) => {

  const table = request.params.datatype;
  
  /*if      (!process.env.DISALLOW_WRITE) response.status(500).send('{"status":"Disallowed write"}').end();
  
  else */if (!model[table] )              response.status(500).send(`{"status":"${table} is not a known datatype"}`).end();

  else {
    
    const body =( "string"==typeof request.body)? JSON.parse(request.body) : request.body;
    const vals = Array.isArray( body )? body : [ body ];
    console.log( vals );
    const sql = `INSERT OR REPLACE INTO ${table} 
                             ( ${Object.keys(model[table]).join()} )
                      VALUES
                 ${vals.map( v=>
                            `( ${Object.keys(model[table]).map( k=> `"${clean(v[k])}"` ?? "null").join()})`
                               ).join() }`;
    console.log(sql);
    db.run(sql, error=> {
        console.log(error, "B");
        let thx= "Feedback" == table;
 
      
      if( thx ) console.log(fs.readFileSync(`${__dirname}/views/thanks.html`,'binary') )
      
      
      
        if (!error)
          if( thx )  response
                .status(200)
//                .setHeader('Content-Type',       'text/html':'application/json')
//                .setHeader('Content-Disposition',thx? 'inline'   :'')
                .sendFile( `${__dirname}/views/thanks.html` )
        //        .end()
                ;
          else       response
            .status(200)
            // .setHeader('Content-Type',       thx? 'text/html':'application/json')
            // .setHeader('Content-Disposition',thx? 'inline'   :'')
                .send( JSON.stringify({
                   error: 0,
                   status: `${table} ${vals.length} rows  starting at #${vals[0].id ?? "unnumbered"} stored`,
                   stored: {
                          id:     vals[0].id ?? "implicit",
                          rows:   vals.length, 
                          table,
                        },
                      })
                   )
//            .end()
            ;
        else {
          console.log(error.toString());
          response.status(500).send(error.toString()).end();
        }
    });
  }
});









app.post("/add", (request, response) => {
  // console.log(request.body);

  if (!process.env.DISALLOW_WRITE)
    response.status(500).send('{"status":"Disallowed write"}').end();
  else {
    const r = request.body;
    r.note = clean(r.note); // needed for pin - harmless for fix
    r.worth = clean(r.worth);
    r.worth = clean(r.name);
    const type  = r.stars? "FEEDBACK" : (r.pin? "PIN": (r.responseTime? "QOS": "FIX"));
    const table = { FEEDBACK:"Feedback" }[type];
    const s     = str=> `"${str == "null" ? "" : str}"`;
    let sql;

    if (table)
      sql = `INSERT OR REPLACE INTO ${table}
                ( ${Object.keys(model[table]).join()} ),
         VALUES ( ${Object.keys(model[table]).map( k=> r[k] ?? "null").join()} ) `;

    if (type == "FIX")
      sql = `INSERT OR REPLACE INTO Fix
                (    session,          id,      lat,      long,   fixTime,   dbTime        )
         VALUES (${r.session || 0},  ${r.id}, ${r.lat}, ${r.long}, ${
        r.time
      },  ${Date.now()} ) `;

    if (type == "PIN")
      sql = `INSERT OR REPLACE INTO Pin
          (${
            r.id ? "id," : ""
          }     time,     session,     fix,     lat,     long,      name,         note,        tags,      worth,     active,     trigger,     station,     direction)
   VALUES (${r.id ? `${r.id},` : ""} ${r.time},${r.session},${r.fix},${r.lat},${
        r.long
      },${s(r.name)},${s(r.note)},${s(r.tags)},${r.worth},${r.active},${
        r.trigger
      },${r.station},${r.direction})`;

    if (type == "QOS")
      sql = `INSERT OR REPLACE INTO Fix
                (    session,        lat,      long,     accuracy,     fixTime,     responseTime,     error,       message)
         VALUES (${r.session || 0},${r.lat}, ${r.long},${r.accuracy},${
        r.fixTime
      },${r.responseTime},${r.error},${s(r.message)}`;
    console.log(sql);
    db.run(sql, (error) => {
      console.log(error, "B");
      if (!error)
        response
          .status(200)
          .send(
            JSON.stringify({
              error: 0,
              status: `${type} #${r.id ? r.id : this.lastID} stored`,
              stored: {
                id: r.hasOwnProperty("id") ? r.id : this.lastID,
                type,
              },
            })
          )
          .end();
      else {
        console.log(error.toString());
        response.status(500).send(error.toString()).end();
      }
    });
  }
});

// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your server is set up on port ${listener.address().port}`);
});
