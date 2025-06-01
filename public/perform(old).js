import url from './url.js';
import {titleCase}  from './util.js';
import newEffects from './weave.js';
import audio from './audio.js';





var audioplayer   = new Audio();
var ambientplayer = new Audio();

var musicplayer   = new Audio();
var silentplayer  = new Audio();
var videoplayer   = null;

let effects; 



    const setMetadata= 
        'mediaSession' in navigator?
            ( name, generator=cherokeeMetaGen )=> { 
                let mdata={};
                for( let k in generator ) mdata[k] = generator[k]( name );
                document.title = mdata.title; 
                navigator.mediaSession.metadata =  new window.MediaMetadata( mdata );
                console.log(     navigator.mediaSession.metadata      );
                }
          : ()=>console.warn( "mediaSession not supported")
            ;
    
    const metaStack= [ null ]; 
    const pushMetadata=  name=> { setMetadata( name );   metaStack.push( name );   };
    const popMetadata =    ()=>   setMetadata(           metaStack.pop()           );






const playAmbience = ()=> {
    ambientplayer?.pause();
    ambientplayer?.remove();
    
    ambientplayer= new Audio( url.content.load + "ambience/blue-ridge.mp3" );
    ambientplayer.volume = 0.13;
    ambientplayer.loop   = true;
    ambientplayer.addEventListener( "error",       console.error );
    ambientplayer.addEventListener( "canplay", e=> ambientplayer.play().then( pushMetadata ), {once:true} );
  
  
  
  
  
    const CYCLES =3, MINVOL= 0.03, MAXVOL = 0.125-MINVOL;
    
    setInterval( ()=> (ambientplayer.currentTime && ambientplayer.duration) &&
                      (ambientplayer.volume =
                        ((Math.cos( CYCLES *2*Math.PI* ambientplayer.currentTime/ambientplayer.duration)+1)/2)
                         * MAXVOL + MINVOL, 150));
    
    };

document.body.addEventListener("pointerdown", e=>playAmbience(), {once:true});

const playSilent = ()=> {
    silentplayer?.pause();
    silentplayer?.remove();
    
    silentplayer= new Audio( url.content.silence );
    silentplayer.volume = 0.001;
    silentplayer.loop   = true;
    silentplayer.addEventListener( "error",   console.error );
    silentplayer.addEventListener( "canplay", silentplayer.play );
    };

var woundBack=0;

const playSound = src=>    new Promise( (resolve, reject)=> {
    audioplayer.src= src;
    audioplayer.addEventListener( "error",   reject );
    audioplayer.addEventListener( "canplay", audioplayer.play );

    audioplayer.addEventListener( "ended", ()=>{
        audioplayer.src= null;
        resolve (src);
        }); 
    
    const WINDBACK = 2.75;  

    audioplayer.addEventListener('play', () => {

       // when interrupted (eg: by driving directions) wind back a few seconds
        if(  ( audioplayer.currentTime <= WINDBACK  )
          || ( audioplayer.currentTime == woundBack ) 
          || ( audioplayer.currentTime >= (audioplayer.duration-0.5 ) )) return;
        
        audioplayer.currentTime -= WINDBACK;
        woundBack= audioplayer.currentTime;
        audioplayer.volume = 0.0; 
        let fader = setInterval( ()=>{
                if  ( audioplayer.volume  > 0.9 )   clearInterval( fader );
                else  audioplayer.volume += 0.125;
            },
            100*WINDBACK); // WINDBACK/10 (while converting seconds to ms)
        });
    });




const clearLayer = (which="text")=>{
    let layer = document.querySelector(`#${which}layer`);
    layer.style.transition="opacity .25s";
    layer.style.opacity=0;
    setTimeout( e=> layer.parentElement.hidden=true,  280);
    }
const clearTextLayer = ()=>clearLayer( "text");
const clearImageLayer = ()=>clearLayer( "image");
const clear = ()=>{
    // clearLayer( "text");
    // clearLayer( "image");
    }



    const intro=  src=> playSound( src.replace( /(.*\/)[^\/^.]*(\.[^\/^.]*)$/m, "$1intro$2" ));
    const outro=  src=> playSound( src.replace( /(.*\/)[^\/^.]*(\.[^\/^.]*)$/m, "$1outro$2" ));






const actionHandler= {
    seekforward:  e=> audioplayer.currentTime+=10,
    seekbackward: e=> audioplayer.currentTime-=10,
    }
 
Object.keys( actionHandler ).forEach( key=> 
    navigator.mediaSession.setActionHandler( key, actionHandler[key]) );


 const fade={
    in:         layer=> {  
                            layer.hidden = false;
                            layer.classList.add(    "fade"   );
        setTimeout( ()=>    layer.classList.add(    "fadein2"    ),   100 );
        setTimeout( ()=>    layer.classList.remove( "fadein2", 
                                                    "fade"       ),  2000 );
                        },
    out:        layer=> { 
                            layer.classList.add(    "fadeout5"  );
        setTimeout( ()=>{   layer.classList.remove( "fadeout5"  );
                            layer.innerHTML = "";
                            layer.hidden = true;
                                                                 }, 5000);
                        },
    quick:      layer=> {   layer.innerHTML = "";
                            layer.hidden = true;
                        },
    inprogress: layer=>    !layer.hidden
    };
    

const 
    audio=  content=>    new Promise( (resolve, reject)=> {

            content = content?.file ?? content;

            if( !content )                              return resolve();
            //if( defer.untilVisible("audio", content))   return resolve();
            let src = url.content.load + content;
            if( audioplayer?.currentSrc== src)   		    return resolve();
            if( content=="abort" )        	            return resolve();
        //    clear();
            pushMetadata( content );
            if( content=="init"  )        	            return resolve();
      
      
                         effect(  content  );
                         intro(      src  )
            .then(  ()=> playSound(  src ))    
            .then(  ()=> outro(      src ))
            .then(  ()=> popMetadata()    )    
            .catch( ()=> playSound(  src ))    
            }),
        
    speak= content=>    new Promise( (resolve, reject)=> {
            if( !content )                              return resolve();
            speechSynthesis.cancel()
            if( content=="abort" )                      return resolve();
        //  clear();
            pushMetadata( content );
            caption( content );
            let utt = new SpeechSynthesisUtterance(content?.text ?? content);
            utt.pitch = 0.8;
            utt.rate  = 0.8;
            audioplayer.pause();
            utt.addEventListener( "end",  ()=>{
                caption( false );
                if( audioplayer.currentTime >0 ) audioplayer.play();
                popMetadata();
                resolve();
                });
            // playSilent();   //wake up sleeping device
            setTimeout( ()=>speechSynthesis.speak( utt ), 250);    // also maybe fix issue with UConnect players
            }),
        
    video=  content=>    new Promise( (resolve, reject)=> {
    
            if( !content )                              return resolve();
           // if( defer.untilVisible("video", content))   return resolve();
            let src = url.content.load+ (content?.file ?? content);
            if( videoplayer?.currentSrc==src )	     	return resolve();
            if( videoplayer )   videoplayer.dispatchEvent( new Event("ended"));
            if( content=="abort" )        	            return resolve();
            clear();
            videoplayer= document.querySelector("video");
            videoplayer.src =  src;
            videoplayer.volume = content.volume ?? 1 ;
            videoplayer.addEventListener( "canplay", videoplayer.play  );
            videoplayer.addEventListener( "error",   reject );
            videoplayer.addEventListener( "ended", ()=>{
                videoplayer.pause();
                videoplayer.remove();
                videoplayer=null;
                resolve ();
                }); 
            }),

    image=   content=>    new Promise( (resolve, reject)=> {  
            if( !content )                              return resolve();
            //if( defer.untilVisible("image", content))   return resolve();
            clear();
            if( content=="abort" )        	            return resolve();
    
            setTimeout( e=> {   
                let layer = document.querySelector("#imagelayer");
                let src = url.content.load+ (content?.file ?? content);
                layer.style.backgroundImage= `url(${src})`;
                layer.style.backgroundSize= "cover";
                layer.style.transition="opacity 2s";
                layer.hidden = false;
                layer.style.opacity=1;
                }, 550);
             return resolve();     //  layer.innerHTML = `<img src=>`;
           }),
        
    effect=      content=>    new Promise( (resolve, reject)=> {  
            if( !content )                              return resolve();
            if(  content=="abort" )        	            return resolve();
            newEffects( { container:document.querySelector("#effectlayer")})
                .then( fx=> ( effects=fx ).perform( content));
            return resolve();   
           }),
    
    background= x=>
            newEffects( { container:document.querySelector("#effectlayer")})
                .then( fx=> ( effects=fx ).background( x )),     

    text=    content=>   new Promise( (resolve, reject)=> {  
          
           // if( defer.untilVisible("text", content))   return resolve();
            let layer = document.querySelector("#textlayer");
            layer.innerHTML = ``;
//            clear();
            if( content=="abort" )        	           return resolve();
            content= content.text ?? content; 
            layer.hidden =  layer.parentElement.hidden = false;
            layer.innerHTML =`<div>${content}</div>`;
            fade.quick( document.querySelector("#captionlayer") );
            fade.in(  layer );
            let ms = 300 * content.length +( layer.querySelector("a")? 30000 : 0);
            setTimeout( e=> fade.out( layer ), ms );
            return resolve(); 
            }),

    caption=    content=>  { 
                if( fade.inprogress( document.querySelector("#textlayer")))  return false;
                let layer = document.querySelector("#captionlayer");
                layer.hidden =  layer.parentElement.hidden = false;
                if(  content= content?.text ?? content ){
                    layer.innerHTML =`<div class="reframe"><div>${content}</div></div>`;
                    fade.in(  layer );
                    }
                else fade.out( layer );
                },
    debug=      content=>  { 
                    let layer = document.querySelector("#captionlayer");
                    layer.hidden =  layer.parentElement.hidden = false;
                    layer.innerHTML =`<div class="reframe"><div class="debug">${content?.text ?? content}<div><div>`;
                    },
    isPlaying = player=> player && 
                       ( ( player.speaking && !player.paused)
                      || (!player.paused   && !player.ended && ( player.currentTime>0) ) ),
    resume=     player=> player.resume? player.resume() : player.play(),        
    paused=[],
    pause= (pausing=true)=> {
        console.log( "pause", pausing, paused );
            if( pausing ) {
                if( isPlaying(audioplayer) )  {
                    audioplayer.pause();
                    paused.push( audioplayer );
                    }
                if( isPlaying(videoplayer) )  { 
                    videoplayer.pause();
                    paused.push( videoplayer );
                    }
                if( isPlaying(speechSynthesis) )  {
                    speechSynthesis.pause();
                    paused.push( speechSynthesis );
                    }
               }
            else  while( paused.length)    resume( paused.pop()) 
            };       
    

export default { audio, speak, video, image, effect, text, background, pause, debug };   



const cherokeeMetaGen = {
    title:  choice=>
                !choice? "Cherokee Land and Lore" :
                    (
                    !choice.includes('/')?           choice.split(' ').filter( (s,i)=> i<8 ).join(' ')+"..."
                                        : titleCase( choice.split('/').pop().replace( /\-|\_/g," ").replace( /\.mp3/g," ") )
                    ),
    artist: choice=>{
                if( !choice )                   return  "Museum of the Cherokee People";
                if( !choice.includes(   '/') )  return  "Navigator";
                let key  = choice.split('/')[0];
                if( key=="story") key = choice.split('/')[1].split('-')[0];
                return {
                    guide:       "Nola Teesatuskie / Shenelle Feather",
                    ballgame:    "Jarett Wildcatt",
                    chunkey:     "Nola Teesatuskie",
                    clan:        "Jarett Wildcatt",
                    evergreen:   "Nola Teesatuskie",
                    first:       "Freeman Owle",
                    forever:     "Jarett Wildcatt",
                    how:         "John John Toineeta",
                    kanati:      "Freeman Owle",
                    rabbit:      "Jarett Wildcatt",
                    selu:        "Freeman Owle",
                    spearfinger: "Kathi Littlejohn",
                    }[ key.toLowerCase() ] ?? "Tribal Voices";
                },
    album:   choice=> "Cherokee.GeoVoices.org",
    artwork: choice=>
        [  {  
            src: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABwTFRgVERwYFhgfHRwhKUUtKSYmKVQ8QDJFZFhpZ2JYYF9ufJ6GbnWWd19giruLlqOpsbOxa4TC0MGszp6usar/2wBDAR0fHykkKVEtLVGqcmByqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/wAARCAEsArwDASIAAhEBAxEB/8QAGgABAQADAQEAAAAAAAAAAAAAAAEEBQYDAv/EAEMQAAIBAwEEAg4JAwQCAwAAAAABAgMEEQUSITFRBkETFBUWIjJTYXGRkqGxwTM0NVJUcnOB0UJEgiNiouHw8SRjo//EABoBAQADAQEBAAAAAAAAAAAAAAABAgMEBQb/xAAqEQEAAgIBBAEEAQUBAQAAAAAAAQIDEQQSEyExURQiMkEzNEJxgZEjRP/aAAwDAQACEQMRAD8A2IIDdioIAKCACggAoIAKCACggAoIAKCACggAoIAKCACggAoIAKCACggAoIAKCACggAoIAKCACggAoIAKCACggAoIAKCACggAoIAKCACggAoIAKCACggAoIAKCACggAoIAKCACggAoIAKCACggAoIAPkAAAAAAAAAAAAAAAAAAAAAAAAAAACAU+KtaFKLlOSil1tipNU4OUnhJZZzN5d1Lus229nPgxK2nSYjbb1Nat4vEVOXnSPju5R8nP3GPb6Dc1qanUlGlngpcT173Kv4iHss5p5NInW2vbffdyj5OfuHdyj5OfuPjvcq/iIeyx3uVfxEPZY+qx/J25ffdyj5OfuHdyj5OfuPjvcq/iIeyx3uVfxEPZY+qx/J25ffdyj5OfuHdyj5OfuPjvcq/iIeyx3uVfxEPZY+qx/J25ffdyj5OfuHdyj5OfuPjvcq/iIeyx3uVfxEPZY+qx/J25ffdyj5OfuPahq1vVlsuTg397cY3e5V/EQ9lmFfaXcWS2ppTh96PV6Sa8ilp1EonHp0qkmsoGi0e9kp9gqPKfit9XmN4mdMTtnMaXJ4TvbeEnGVaCa4raPq5k40JtPDUWavR9Ot722nUr7Tkp43PHUZ5csY43K1a9TY9v2vl4e0O37Xy8PaPnuDZcqntDuDZcqntHN9bRp2Ze9OtCrHapyUlzTPs0unR7BqlehBvYi2kn5mbk7K26o2xmNSoICyFBMnnVr06Udqc1FedgeoyaurqylPsdtTlVk+HUjJtYV2+yXE/C6oR3JfyRtOmWCFJQAAAMgwdWuJULOTg8Sk9lPkRPgh6VtRtqMtmdRbXJbzz7r2nlH7LNdpeldv05VZ1HCCeFhZbZnd7tH8RP1I5bcqlZ1Mtoxbffde08o/ZY7r2nlH7LPjvdo/iJ+pDvdo/iJ+pFfrMfydqX33XtPKP2WO69p5R+yz473aP4ifqQ73aP4ifqQ+sx/J2pffde08o/ZY7r2nlH7LPjvdo/iJ+pDvdo/iJ+pD6zH8nallW95QuPoppvl1nuc1d0J6XfJRnnGJRfNHQ0Z7dNS5o6qXi0bhnaunoAC6oAAAAAAAAAAAAAAAAAAAAAAAAAAPkEAFBABQQAUEAFBABQQAUEAFBABQQAUEAFBABh6vNxsKmOvC95rdCpRq6lDaWVBOWPOZ+s/UZelfEw+jv2i/038jm5E6pP8AhrjdOADxHUAAAAAAAAAAAfFenGrQnTmsxlFpn2SXisR4kcTQbhcQa4qSOrg8xRycPp4/m+Z1VPxUfQUcd0uU5UJpcXFms0fUreytp06+2pOedyz1G2PCdnQnJylSg2+LwRlxRkjUlbdJ3esudT2T1lq1nG3jW7I3FvGEt6foMftC38lD1GsvtMlSzOgnKHXHrRyzwqNIyvXT5KtqletBPYk20352bk0+i104uk0k47/SjPub2jbx8OSz1JcTspqKsreZZOTHuL2jbrw5rPJcTTXWq1quY0v9OPvMBtt5bbb5ib/CYr8tnc6xUnlUY7C5vezGoW9e+qZbbXXKR62GnSrtTqpqHUuZvaVONOKjFJJdSIiJn2TMR6eNpZU7aGIrf1t8WZRAX0ooICRQQAU1uu/VI/nRsTW659Uj+dEW9Jj2yejn2dL9R/BG1NV0c+zpfqP4I2p4Of8Akl2V9AAMlgAAAABzXST6/D9NfFmzs/q8Pyo1nST6/D9NfFmys/q8Pyo9vjfxw5cntkAgOlkoIAKCACggAoIAKCACggAoIAKCACggAoIAICACggAoIAKCACggAoIAKCACggAoIAKCACggAwtY+oy9K+Jh9HftF/pv5GXrH1GXpXxMTo79ov8ATfyObk/hP+GuN04APEdQAAAAAAAAAABJeKykl4rA4iH08fzfM6mn4qOWh9OvzfM6in4qPoKOO77BAaKKfFSpCEHKbSS62fFxXhQpOc3hI5+7vKl1PMniK4RKzOkxG3vc30I1JdqwUHLjPG9mBKTlJyk22+tkBntpEaDYaZZqvPsk1mEXuXNmvOj02mqdpBLrWSaxuUWnUMuMVFYRSA1ZqCACggAoIAKa3XPqkfzo2JharRlWtHsrLi84In0mPb26OfZ0v1H8EbU5nSdVjZUpUqsJSi3tJx4pm1tNZtrqvGjGM4ylw2luZ42fFfrm2vDrraNNiAa+61m1tqrpvaqSXHY3pHPWlrTqsLTMQ2ANR3w2vk6vqX8jvhtfJ1fUv5NOxk+EdUNuDUd8Nr5Or6l/I74bXydX1L+R2MnwdUMHpJ9fh+mvizY2f1eH5UaW/uXqV8pQg0sKMV1m8oR2KUY8ketx6zWkRLmyTuXqCA6GaggAoIAKCACggAoIAKCACggAoIAKCACggAgIAhQQAUEAFBABQQAUEAFBABQQAUEAFBABQQAYWr/UpelfExejv2i/038jJ1f6lL0r4mN0d+0X+m/kc3J/Cf8ADbG6cAHiOoAAAAAAAAAAAkvFZSS8VgcRD6dfm+Z08PFRzEfpl+b5nTQ8VH0FHHd9ggNFGj1etKdz2PPgwXDzmvNprFu1NV4rc90jVmNvbWPQACEht9LvlsqjUeGt0XzNQUmJ0iY26tPJTR2epSpYhWzKPPrRuKVaFWClCSafI1ids5iYegJkEoUEAQoIAKGQxr26jbUXLjJ7khKWu1WNCE8QiuyPe8GZoVioR7dr+CkvAz8TX2dKNerK4u57NGDzNv8AqfJHpfahVvpqjRi4UlujBdfpOPL1X+yv+29fHmWTqmsyq5o2jahwc+t+gxrPTXVW3Xyk+C6zIsdOVLFSqsz9yNktxriw1pGoUteZYHcm3/3esdybf/d6zPBt0wpuWB3Jt/8Ad6x3Jt/93rM8Dpg6pY9vZUbd5hHfzfEySAnSNqCAIUEAFBABQQAUEAFBABQQAUEAFBABQQAUEAEBABQQAUEAFBABQQAUEAFBABQQAUEAFBABQQAYerfUpelfExujv2k/038jK1KDnZzS4rea/RriFtqEJVHiMk4t8snPyImazENsbrQE8rcDw3UAAAAAAAAAAASXisp43lxC2tp1ZtJJblzfImImZ1BLjY/TL83zOlh4qOboRdS4glxckdJHdFH0FHHd9AgLs0qQjUg4yWU+KNFe2UreTlFN0318jfHzKKkmmspkTG1onTlwbK801xbnQWV1x/g1zWHhmUxppE7QAEJU9KFxUoSzTljmupnkAN3banTqYjU8CXn4GdGakspnLnrRuq1B+BN45PgXi/ypNXSg1dDVYvCqrZfNb0Z9OtCoswkmvMy8TEqTEw9QTJG8IlCVakaUHKTwkc9d3Eris5vh1LkZGpXfZp9jg/Ajx87PG0s53Ms8IdcjO078Q0iNeUpRrXLjSh4seC6l5zcWdnC3jzk+LPShQhQgowWD2LVrpE22oICyiggAoIAKCACggAoIAKCACggAoIAKCACggAoIAKCACggAoIAICACggAoIAKCACggAoIAKCACggAoIAKCACggASSkmmaO9sp0JuUE3TfuN4RpPiRMbWidNHQ1K8t4bFOtJRXBPfj1nr3Zv/Lf8UbCdnQm8unHPoPjtC38mjGcNZ9xC/cYXdm/8t/xQ7s3/AJb/AIoze0LfyaHaFv5NEdivxCe4wu7N/wCW/wCKHdm/8t/xRm9oW/k0O0LfyaHYr8Qdxhd2b/y3/FGy03W1UapXbUZPhPgn6Tyen0GmuxpGsurOdu8rwoc+RS/HpMa0muTy7I8L2tK3s6taMdqUI5SOf0zV52rVKvmdH3xOkp1KdxSUoSjOEl+zPMyYpxW8+m8W3Dl3rV+39Ml/ijFr3NxdzTrVJVH1L/oztY0x2k3VpLNGT9l8jG0+vCnU2aiWHwlyPTxRjtHVWGNpmPbL06zdN9lqLEupcjZHzFrG4p1RGmEztQQEoUEAB7zDu7CFfMo+DPnzMwCY2mJ05ytQqUJbNSOOT6meR0lWlCrBxnFNM1N3p86WZU8yjy60ZTXTSLbYIKQqsAAAfcKk6cswk4vzHwANhQ1SpDCqraXNcTJrXkbi2lGhLw2uD3M0xS3VKvTDOs9PlUltVlsx5dbNxCEYRUYrCRoaN7Wo8JbS5M2FDU6c91TwH5+Baswi0S2APiNSM1mLTXmPrJdmoIAKCACggAoIAKCACggAoIAKCACggAoIAKCACggAoIAKCACggAgJkZAoJkZAoJkZAoJkZAoJkZAoJkZAoJkZAoJkZAoJkZAoJkZAoJkZAoJkZAoyTIyBcjJMjIFyMkyMgU+ZRUlhrJcjIGpvLBxzOisrrieVjf1rGpmDzF+NB8Gbp7zCvLGNXM6e6fxM744tGmlb6bq2urfUbdqOJJrE4S4o53VdOlZVcxy6Mn4MuXmZi051rSupQbhUidDZ6hb6nRdvcxUaklhx6peg4Oi2Cd181b7izVafe4xSqP8AK2bRPJpdRsaljX2Xvg98JczJsLzbSp1H4S4Pmd2O8WjwwtXTZA+clyas1BMjIFBMjIFI94yMgYN5YRq5nT8GfuZqZwlTk4zWGjpDGurWFxDfukuD5FLV+F4t8tED7q05UpuE1ho+DNoAAAAAAAA9KVapReYSa8xsKGprhWWPOjVgmJmETES6OnWhUjmEk15j0yc3TqTpS2oSaZsLfUuEayx50Xiyk1bQHnCpGcU4tNPkfeS6igmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkD5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFIAB4XNtCvHDWH1M1FajUt5+F+0kb0+KtONSLjJZTKzXa0W0x7bUad1Q7U1HfF+LV60/Oa+7tqlnX2Jb+uM1wkuaPu6s5UXtRzKHwPmnc5o9gr5lS/pfXB+b+Dm6OifDbe4Z9jeKrHYm/DXvMzJz2XTnmMt64NG2s7pVoYe6a4o6K22ytX9ssEyUuoAAAAABSADC1Kgp0ttLwo/A1J0M0pRafWaCpHYqSjyeDO8NKS+AAUXAAAAAAAAAAB60a9SjLMHu5dRtba9hW3PwZcmaUqeHlFotpExt0eclNZZ329Qqv0SNink0idspjSgAlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+QQAUEAFBABQQAUEAFBABQQAUEAFBABQQAUEAFBABQQAUEAFBABQQAUEAFBABWk1hmuu7HjOivTE2AImNpidOfaaeGsM+qc5U5qUXho2l1ZxreFHdPnzNXUpypycZrDMpiYaxO24tbmNaGetcUe5oaVWVKalF/8AZuLevGtBSi/25GlbbZ2rp7AgLKqCACggyBKklCDk3uRoaktupKXN5M3ULnafYoPcuLMEztO2tY0gAKLAAAAAAAAAAAAACmwsLp5VKb9DNcVNpprc0TE6RMbdDkHha1uy0VLr6z2NoYqCACggAoIAKCACggAoIAKCACggAoIAKCACggAgJkZAoJkZAoJkZAoJkZAoJkZAoJkZAoJkZAoJkZAoJkZAoJkZAoJkZAoJkZAoJkZAoJkZAoJkZAoJkZAoJkZAoJkZAoJkZAp5V6EK0cSXofI9MjIGmr286Mt6zHqZKFaVGe0uHWjcTjGcWpLKZrbmzlTzKG+PwM5rrzDSLb8S2VGrGrBSi9zPs1FnVlCsorhLijbJ7i9Z2rMaUEyMkqrkw7667GtiD8J8fMfd3cKjDdvk+CNTKTk228tlLW/S9a/sIAZtAAAAAAAAAAAAAAAAAAAZum1MVJQ57zZmltZbNxB+fBuU9xrSfDO/tQTIyWUUEyMgUEyMgUEyMgUEyMgUEyMgUEyMgUEyMgUEyMgUEyMgUEyMgQEyMkigmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCh7yZGSB8Ro04y2oxSfPB6EyMgU8rivGjDL49S5nzcXEaMcve+pGrq1JVZuUmVtbS1a7KlSVWblJ72fABk1AAAAAAAAAAAAAAAAAAAAAH1B4mnyZu4PwTRm6pvwEaUUu+wTIyaM1BMjIFBMjIFBMjIFBMjIFBMjIFBMjIFBMjIFBMjIFBMjIFBMjIEBABQQAUEAFBABQQAUEAFBABQQAUEAFBABQQAUEAFBjVbuFN7KzKXJCMr2os07WbXPZZSb1j3K0VmWSDH2NSX9pL2WfMq9zT+ltpx9KaIjLWf2dEsoHhQuY1m0k011M9i8TtWfCggJFBABQQAUEAFB51anYqbnjOOox1d1JLMaEmuaKzaI9piJlmAw5XlSKzKg0vOZMJqcFJcGItE+iYmH3kx7m5jSWFvlyPO5u1HMae+XPkYbpVZPLhNt+ZlbX0tWvy+ZzlOTlJ5bPk+pQlB4lFx9KPkzaAAAAFAA6HTtJtLixpVakZOUll4l5zD1uxoWXYewJrbznLzyMa562v0R7W6ZiNtSCkNlQAAAAAAAAAAAABTcUvEXoNOuJuIboovRS77BAas1BABQQAUEAFBABQQAUEAFBABQQAUEAFBABATIyBQTIyBQTIyBQTIyBQTIyBQTIyBQTIyBQTIyBQTIyBQTIyBQTIyBTHu6rhTUY+NLce+TyoQ7PrNCD3pNP1bymS3TWZWpG5bjS9Mp2lKM6kVKs1lt9XmRsAczqeoV7m7nSo1JRpxeylF4z5zxKUtnt7dczFYdNlA47tas+M36wqNxDfGpJehnR9DPyp3YenDU6/55fEyzCtqVSNZynxfFsyalWNOOZPB6dI1Xy57eZ8PQGKrqpUeKNGUv2yfW1efhJ+wxOSsfs6JZAMXtqUJYrUpQMiM1OKlF5TLRMT6RMTD6B5Va8KS8J7+SPKNxWqfRW8pLzJsibRHsisyygY+1eddpP2GfPbcoPFWlKBEXrP7T0S96q2qUo80Z/RyptWM6b4wn7n/4zAhONSOYvKPXo/Psd9Xo9Ullfs/+zm5ld45lpinU6bHW6fZNLq844l7zme2JKiqcd3NnYXVPstrVp/eg17jiTn4dvtmGmSPL7oQ7LXp0/vSS953CWFuOR0en2TVKC5Pa9SydcZ8yfuiFsfpy3SCr2TUnHqpxUfn8zWHveVezXlap96ba9B4pNvcduOvTWIZz5lAe0bW4ksxoVWvNBiVrcRWZUKiXngy24Q8QVpriCRsbbWbm2oQowjTcYLCynn4njfahWvtjsqgtjONlGNGnUksxhJrmkSUJw8aLj6VgzilIncR5TuXyCljCU3iMXJ8ksmiHyD37Tufw9X2Gec6c6bxOEo+lYI3Ej4BQk28JEiA9laXMllUKrX5GSdtXgszo1Irm4tEbgeQKCRAfcKc6jxCEpPklk9O07nGe16vsMjcQPKms1Irzm3jwNWoTo1E505LD4NYNhRrRqxzHd5maUmFLvUEyMmrNQTIyBQTIyBQTIyBQTIyBQTIyBQTIyBQTIyBQTIyBQTIyBQTIyBATIyBQTIyBQTIyBQTIyBQTIyBQTIyBQTIyBQTIyBQTIyBQTIyBQTIyBRpK2tbzyi/gQ+tF+2Z/kfyOfk/xy0xfk6N8DjKElGrOcuCOzfBnErxav/nWcPC/bfL6ZXblLlL1Dtynyl6jc6Ra29TTaM50KcpNPLcU3xZmdpWv4al7CNbc2KzMaUjDEudpV4VW1HOVzPrT7ZahqMlU30qay1z8xjSShqNZRWEpywl6Ta9GYf6depzkl/56zXPkmMW4RSsdTcf6dCl/TTpxXoSMeGp2VSahG4jtPcs5Rj9IZuOm4X9U0n8fkc24RVJSUltcjiw8eMleqZa2v0zp2dehTuKUqdWKlF+45Wknb3NWhJ52ZNeo6m0m6lpRm+MoJv1HL3/g6tcfmZfh2mLTVXJG4ZeiWsLy5q16y2ow4RfDJ0O6K6kkano0v/hVHzqfJHp0hqOGnYi8bc1F+jj8jLNvJm6V6+K7Z0bmhOWzGtTlLkpI+q1GnXpuFWCnF9TRxjpuFKNRPrOxtZupaUpy3uUE36iM2Ds6mJK26nLV49oX1WjvcU93o4o+tLr41alN7tqWy/33H30gWNTk+cUzX05unUjNcYtNHoVmb4tT+4Za1Z3JxF1T7FdVaf3Zte87aMlOCkuDWUcnrdPseqVeUsS9xxcSdWmGl/TI6N09q9nP7kPizf3tXsNnWqfdg2vSarozTxRrVOclH1f+zJ6QVdjTXHrnJR+fyIy/fn0V8VcsdXo9jTt7SFTZTqzSk5Nb1nqOUO5pLZpQS6opG3LtMViIRSEqVadJJ1KkYZ+88Fp1adVZpzjNc4vJy2u1JT1Som90Ukly3H30eqOOoqCe6cWmveYzxv8Az69p6/Om31ixp3FpUqKKVWC2lJLe8dRyp3NVbVGafXFo4Zm3EtM1mJRePLq9C+yqXpfxZhdJ/wC3/wAvkZuhfZVL0v4swek/9v8A5fIxx/1H/Uz+LRwi5zjGKy5PCOys7SnZ0I06cVnHhS62zltLjtalbr/en6jsS/MtPiqMcft8VK9Kl9JUhDP3pJGt1u4o1dNnGnVpzeVuUk+s0F7WlXvKtSTbzJ49B4F8fFisxbZN/wBCWXg6/TbClZ0I+CnVazKXXk5ayh2S9owfXOK952pXl3mNVgxwxq9/a289itWjGXLietGtSuKe3Rmpx4ZRx15N1LytNvjN/E23Rmb2q8M7sJlMnGiuPqifKYvudPjpFZwpThXpxUdttSS5mqtqLuLmnRjxnLHoOi6Rxzp8XyqL4M1Gh47q0c+f4M3w3ns7+FbR9zp7e3pW1JU6UVGK955zv7SnNxncU1JcVk9bja7XqbGdrYeMc8HEyTTaeU/OcuHFGXc2le1ul1d1fWlS0rRjcU23BpLa8xz1jxkY9KEZ7pSUWZtCj2LO/OT0cGGMfphktt7gmRk62KgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkCgmRkD5BMjIFBMjIFBMjIFBMjIFBMjIFBMjIFBMjIFBMjIFBMjIFBMjIFBMjIFPvR3jWmucWeeRYS7HrVFvhJ49awYciN45aY/ydQ+BxUIuUqsFxO1OQrw7V1GrCe5KTx6Oo8/hTG5hvl9Pq0vLu3q0aSqyUNpLZ6uJ1px8pxndUNlp4kvidgRzaxFo0YpmY8uOrfaFx+eXxN10b+pVP1PkjTVvtGv+eXxNv0alm2rR5TT93/RvyP4Vafk2F/b0Li32bmWxBPO1nGGazuZpX4v/wDSJ79I03p8WuCqLPqZz9OjGcU9tIy4+O1qbi2lr2iJ8w6ync2dKnGnC4pKMUklto5nUJRnqdeUJKUW3hp+Y8+14+UXrLGhFKTUk8I6cXH7dpnbO2TcN70c+z5fqP4I+Okv1Ol+p8mfXRt5sZrlUfwQ6RxzYQf3ai+DOL/6P9tv7GgqVE6EYLjxOusfqND9OPwOLO1sliyoJ+Tj8DbmzuIUxxpz3SL7SX6a+ZqzZ9IXnU35oI1Zvh/jhW3t2OlVey6bQl1qOy/23Gn6S08XVKp96GPU/wDszOjdXasp0+uE/czI1bT5X9OmoTUJQb48jirMY8879NZ81fOg09jS4P77cvl8jB6TVfDoUl1JyZurWire2p0U87EUs8zmdcq9k1OouqCUUTg+/NNkW8V0164o7qPir0HCridzB5hF+YvzP7UY3Ka39q1v2+CGh/atH9/gxraa1WtnzfBH3oEdrVIP7qb9xvP8P+lf7nUz8R+g4V8WdzUeKcnyTOGfEw4f7WyOr0L7Kpel/FmD0n/t/wDL5GdoX2VS9L+LMHpP/b/5fIzx/wBR/wBTP4Ndo/2pQ/N8jr3wOP0l41O3f+7B2BPM/OCnpws/Hl6T5PSvFwuKkHxjJr3nmehHpky9L+0rf86OxOM06WzqFu//ALF8Tszz+Z+UNcfppq2maY603O42JN749kW497Glp1i5OlcwblublURzVynG5qxfFTfxPI6OxNq6m0q9Wv06XXbihV05xp1qc5bS3RkmaKwrq3vaVV8Iy3+jrMcGmPFFK9KJnc7dzSrUqsVKnUjNPk8kq29Gt9LShP8ANFM4hNp5TaMqhqN1QknGvNpf0yeUzlniTHmsrdfy6C40WzqxexT7FLqcX8jRUXKlVnQnxg2jrIS26cZfeSZyt54OsV8ffZfh5LTaazKMtY09QTIyeo5VBMjIFBMjIFBMjIFBMjIFBMjIFBMjIFBMjIFBMjIFBMjIFBMjIEBABQQAUEAFBABQQAUEAFBABQQAUEAFBABQQAfR4V3KFSFaPGLyepJJSi0+DItG40mJ1LpbW4hdW8atN7pLeuT5Hzc2Vvd47PSUmuD4M5elO5s5uVvUlHPUuv8AYy4a9eRWJ06cvO00eTbi3rbdJdUZImPLb0tIsqU1ONLMk8rMmzOOdfSG56qFP3nnPXL6fiqEPRH+Sk8fNf8AJPXWGLU+0q36kviZ2gVlRvqtCTx2RbvSjX01UlWdSfGTy35z7q025KcHiS60ejbF14+lh1att1lejTr0pUqsdqEuKNXLo9bN+DVqr90zX0tZvqK2Z7NTH3l/B698Nx5Cn7zgjDnx+Ky36qyyl0etuurVfq/g0sIqncVYJ+Cm1vMyev3jW6NKP+L/AJNXOcpzlJvfJ5Z1YYyVnd5Z21MeG86NVop1qDe94kvPzNzc29O5oSo1VmMuRxUJypzU4ScZLg0+BsqWvXlNYlsVPzLf7jHNx7Wv10XraIjUtlDo/bRmnKpUkl1bt5tUklhbkjnX0iuMbqNLP7/yYtzq93cxcZTUIvioLBnODNkn75T1Vj0+dXrRr6lVnB5jnZT9G4wikO+sdMREMp8tz0aq7N1Up9UoZ9X/ALOjOJtripa1lVpNKa5ozO7l99+HsI48/Hte/VVpW0RDqm8Jt8EcRcVHWr1Kj/rk2Zk9avZwlBzjiSw8RRrjTj4Zx72i1tqdlp1aNexpTi8+Ck/M0cYZFteV7STdCo454rin+xbPi7ldQittOlvtKoXtRVJylCeMNx6z6sNMo2MpSpuUpyWMy6kaiHSG6S8KnSl+zXzE+kN01iNOlH9m/mc3Zz66d+F+qvtu9Srxt7CrOTw3Fpeds409rq8r3ctqvUcscFwS/Y8TpwYu3XUqWtt1ehfZVL0v4swek/8Ab/5fI19tqt1bUY0qUoqEeGY5PO8vq97s9nkns5xhYM64LRl6/wBJm0dOnlb1Ow3FOqv6JKXqZ2tOcalOM4PMZLKZwxl2epXNmtmlPMPuyWUWz4ZyREx7K206C80e2u6jqPahN8XF8TX3+i0bWyqVo1akpRxhPGOJ8d8VxjfRpZ/f+THu9YubqjKlONOMJcdlGeOmeJiJnwmZqwIScJxkuKeUdvQqxr0YVYPMZLKOHMm01C5tN1GpiP3XvRrnw9yPHtWttOju9Htbqo6ktqE3xcXxMbvdt/LVfcYcekNyl4VKk/2a+Yl0huXwpUl+z/kwjHyIjUSvury1jTqVgqXYpTlt5ztNdWDAoQVSvTg9ylJJ49J73t/Xvtns2z4OcKKwY0JuE4zjxi8o66RaK6t7Zzrfh0EujtJ+LcTXpimfdHo/QhNSqVZ1EurGEzAjr94uMaUvTF/yfa6Q3GPoaWf3Oaa8j1tfdHRNxhFttKKXqRx86nZ9QqVVwlNtHtdapd3kHTeIQfFRWMnnQpbCy+JtxcE082UyXiYewIDvc6ggAoIAKCACggAoIAKCACggAoIAKCACggAgIAKCACggAoIAKCACggAoIAKCACggAoIAKCACggApGk+oABsx5IuFyIAKCACvD4o+JuEFmSRKlVU1zfIxJzc3lspa2lq12tSe2+S5HwAZNQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMq2gnBtrrMYzKKxTSL0jyrefD0SS4IEBqyUEAFBABQQAUEAFBABQQAUEAFBABQQAUEAFBABAQBCggAoIAKCACggAoIAKCACggAoIAKCACggAoIAKCACggAp5VayhuW9/AVpOMd3WYxS1teF6135G23l8SAGTUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYrLSM5bkYdL6SPpMs0ozuoIDRmoIAKCACggAoIAKCACggAoIAKCACggAoIAKCAD/2Q==",
            sizes: '700x300', 
            type: 'image/jpg' 
            }   ]
    }
