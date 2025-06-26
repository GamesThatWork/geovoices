import fs from 'fs';
import path from 'path';
import { Firestore } from '@google-cloud/firestore';



const firestore = new Firestore({
  projectId: 'geo-voices',
  keyFilename: 'C:/Users/dov/Desktop/js/geotour/geotour/secret/geo-voices-15d0c9265de7.json'
});


const sanitizeKeys = obj=> {
  if (Array.isArray(obj))     return obj.map(sanitizeKeys);
  if (obj && typeof obj === 'object') 
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key.replace(  /[/.]/g, '$') // replace '.' and '/' with '$' for Firestore compatibility
           .replace( /^collection$/i, "group" ), // replace 'collection' with 'group' for Firestore compatibility
        sanitizeKeys(value)
        ])
      );
  return obj;
}








console.log('Firestore initialized');


const   type      = 'weave',  // 'tour', 'weave', 'place', 'event'

        groupName = type+ 's',
        dir       = path.join( path.resolve(), groupName);

fs.readdirSync( dir )
  .filter(  file => file.endsWith('.json') || file.endsWith('.'+type) )
  .forEach( file => {
    const 
        filePath = path.join( dir, file ),
        raw      = fs.readFileSync(filePath, 'utf8'),
        data     = sanitizeKeys(  JSON.parse( raw )),
        docId    = path.basename(file, path.extname(file)),
        
        payload = type=== 'weave' ? {json: raw} : data;

    console.log(`(file) ${file} => (coll) ${ groupName } (doc) ${ docId }`);   
    
    
    //firestore.collection( groupName ).doc(docId).set( data )
    firestore.collection( groupName ).doc(docId).set( payload )
      .then( res=> console.log(  `           Uploaded ${file} as document ${docId}`, res))
      .catch(err=> console.log(`           Failed to upload ${file}:`, err, "offending data follows: ", JSON.stringify(data)) );

    });

