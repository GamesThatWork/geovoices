import url  from "./url.js";  
 
let     context;
const   bufferCache  = {}, 
        playerRoot   = {},
        playerKey    = soundFileName=> /ambience/i.test(soundFileName) ?  "ambience":"audio",
        getPlayer    = p=>( (( p==playerRoot.audio )||( p==playerRoot.ambience ))? p : playerRoot[ playerKey(p) ] )?? playerRoot.audio,
      
        soundFiles   = [

          "ambience/blue-ridge.mp3",

             "music/flute.mp3",
             "music/friendship-dance-1.mp3",
          
          "guide/3200-acre-tract.mp3",          ,
          "guide/birdtown.mp3",
            "guide/education.mp3",   //directions
              
          "guide/first-fire.mp3",
          "guide/kawahi.mp3",
          "guide/kituwah.mp3",
          "guide/leaving-kituwah.mp3",
          "guide/museum.mp3",
          "guide/new-kituwah-academy.mp3",
          "guide/selu-kanati.mp3",
          "guide/soco-falls.mp3",
          "guide/soco-gap.mp3",
          "guide/spanish-encounter.mp3",
          "guide/smoky-mountains-park.mp3", //blue-ridge-gsm
          "guide/tecumseh.mp3",
          "guide/thomas-overlook.mp3",
          "guide/tourism.mp3",
          "guide/welcome.mp3",

          "story/ballgame-of-birds-and-animals.mp3",
          "story/chunkey.mp3",
             "story/clan-mothers.mp3",
          "story/evergreen.mp3",
          "story/first-fire-story.mp3",
          "story/kanati.mp3",
              "story/rabbit-and-possum.mp3",  //how-to-follow-directions
          "story/selu.mp3",
          "story/spearfinger.mp3",
          ],
  
    init = ()=> new Promise( resolve=>
                             resolve( context =new (window.AudioContext  || window.webkitAudioContext) () ))
                // ? preload( soundFiles )
                // : console.log(`Sorry. Your browser does not support modern Web Audio. 
                //          Please update or use the latest Safari or  Chrome"}.`)
          ,
                            
      
    play  =  (soundName, options={} ) => new Promise( (resolve,reject)=> 

//              (/suspended|interrupted/i.test(context.state)) ?
               
//                  context.resume()
//                         .then(   ()=>  options.alreadyFailed?  reject()
//                                      : play(  soundName, Object.assign( options, {alreadyFailed:true})).then( resolve ) 
//                              )
//                         .catch(  ()=>  console.error( "AUDIO: context suspended")  )
//                     :
      
                 fetch( url.content.load + soundName  )
                      .then(  response    => response.arrayBuffer()                               )
                      .then(  arrayBuffer => context?.decodeAudioData(arrayBuffer)                )
                      .then(  buffer => {
                        const id      = playerKey(    soundName ),
                              node        = new AudioBufferSourceNode( context, {buffer}),
                              startTime   = context.currentTime,
                              gainNode    =  new GainNode(context),
                              ended       =  e=>{
                                                console.log("Play End "+ soundName, playerRoot[ id ].started , e);
                                                if( playerRoot[ id ].started )   resolve( playerRoot[ id ] );
                                                };

                              playerRoot[ id ]?.node?.stop();   
                              playerRoot[ id ] = {id,  soundName, buffer, node, startTime, gainNode, context, resolve, reject, ended };

                              node.connect(gainNode);
                              gainNode.connect(context.destination);
                              gainNode.gain.setValueAtTime( 1.0, context.currentTime);
                              if( options.latent )         return resolve( playerRoot[ id ] );
                              node.start();
                              playerRoot[ id ].started = true; 
                              node.addEventListener( "ended", ended, {once:true});
                              })
                      .catch( error => console.error(`AUDIO: Error loading ${ soundName}:`, error)  )
              ),
      
      
      
      
      
      
//     preload =soundFileNames=> 
//             Promise.all( 
//               (Array.isArray(soundFileNames)? soundFileNames:[soundFileNames] )
//               .map(fileName => 
//                   fetch( url.content.load + fileName  )
//                   .then(  response    => response.arrayBuffer()                               )
//                   .then(  arrayBuffer => context?.decodeAudioData(arrayBuffer)                )
//                   .then(  audioBuffer => bufferCache[fileName] =  audioBuffer                        )
//                   .catch( error       => console.error(`AUDIO: Error loading ${ fileName}:`, error)  )
//                   )),
    

      
      
//     play1  =  (soundName, options={} ) => new Promise( (resolve,reject)=> {

//                if (!bufferCache[ soundName ] )  
//                    return preload( soundName )
//                           .then(   ()=>  play(soundName, {}))
//                           .then(   resolve                   )
//                           .catch(  ()=>  console.error( `"AUDIO: ${soundName} not found`));
           

//                if (/suspended|interrupted/i.test(context.state)) 
//                    return context.resume()
//                           .then(   ()=>  
//                                      options.alreadyFailed?  reject()
//                                                          :   play( soundName, Object.assign( options, {alreadyFailed:true} )))
//                           .then(   resolve                   )
//                           .catch(  ()=>  console.error( "AUDIO: context suspended"));

//                const id          = playerKey(    soundName ),
//                  buffer      = bufferCache[  soundName ],
//                  node        = new AudioBufferSourceNode( context, {buffer}),
//                  startTime   = context.currentTime,
//                //  gainNode    = playerRoot[ k ]?.gainNode ?? new GainNode(context);
//                  gainNode    =  new GainNode(context);

//                playerRoot[ id ]?.node?.stop();   
//                playerRoot[ id ] = {id,  soundName, buffer, node, startTime, gainNode, context };

//                node.connect(gainNode);
//                gainNode.connect(context.destination);
//                gainNode.gain.setValueAtTime( 1.0, context.currentTime);
//                if( options.latent )         return resolve( playerRoot[ id ] );
//                node.start();
//                playerRoot[ id ].started = true; 
//                node.addEventListener( "ended", e=> resolve( playerRoot[ id ] ));
//                node.addEventListener( "ended", e=> console.log("Play End "+ soundName,e));
//                }),


      
    pause     = player => {
                player = getPlayer( player );
                console.log(`pausing player ${player?.id}`);
                if( !player?.started   )  return;
                player.pauseTime = context.currentTime - player.startTime;
                player.started = false; 
                player.node.stop();
                },

    resume    = player => {
                player = getPlayer( player );
                console.log(`resuming player ${player?.id}`);
                if( !player?.pauseTime   )  return;
                player.node      =  new AudioBufferSourceNode( context, {buffer:player.buffer}),
                player.gainNode  =  new GainNode(context),
                player.node.connect(     player.gainNode);
                player.gainNode.connect( context.destination);          
                let freshStart = Math.max( 0, player.pauseTime-2.5 );
                player.pauseTime =  undefined;
                player.startTime = context.currentTime - freshStart;
                player.node.start( 0, freshStart );
                player.started = true;  
                player.node.addEventListener( "ended", player.ended, {once:true});
                fadeIn( player );
                },  
      
    seek      =(player, delta)=> {
                player = getPlayer( player );
                if( !player   )  return;
      
                let head = context.currentTime - player.startTime;
                player.started = false;  
                player.node.stop();
                player.node = new AudioBufferSourceNode( context, {buffer:player.buffer}),
                player.gainNode  =  new GainNode(context),
                player.node.connect( player.gainNode);
                player.gainNode.connect(context.destination);                    
                player.node.start( 0, Math.max( 0, head + delta ));
                player.startTime-=delta;
                player.started = true;  
                player.node.addEventListener( "ended", player.ended, {once:true});
                fadeIn( player ); 
                },    
      
    
   setVolume = (player, volume) => 
                getPlayer( player )?.gainNode.gain.setValueAtTime( volume, context.currentTime),
                
          
   fadeIn    = (player, time=1.5 ) => {
                let gain = getPlayer( player )?.gainNode.gain;
                if( !gain )  return; 
                gain.setValueAtTime( 0, context.currentTime)
                const fader = setInterval( ()=>
                   (gain.value <1.0) ?  gain.setValueAtTime( gain.value+0.10, context.currentTime)
                                     :  clearInterval( fader ),   time*100 );
                // for( let v=0; v+=0.1; v<=1)
                //      getPlay}er( player )?.gainNode.gain.setValueAtTime( v, context.currentTime+v*time)
                },      
      
      

   loop    = (soundName, startTime=0, endTime=null, loopCount=Infinity) => 
                  play( soundName, {latent:true} )
                     .then( player=>{
                          console.log( "WEBAUDIO LOOP", player);
                          const node= player?.node;
                          if( !node ) return null;
                          node.loop      = true;
                          node.loopStart = startTime;
                          node.loopEnd   = endTime;
                          node.start();
                          player.started=true;
                          return player;
                          }),
   report  = ()=> Object.values( playerRoot ).map( p=>
        `The ${ p.id } player has ${ p.node? "a healthy":"no discernable"} node and is ${ p.started? "running":"stopped on "}  ${ p.soundName } `).join()
      + ( Object.values(bufferCache).length? 
                         `There are ${             Object.values(bufferCache).filter( b=>b.length>10000).length      } buffers of 10Kb or more, 
                          totaling  ${ Math.floor( Object.values(bufferCache).reduce( (t,b)=>t+b.length,0)/1000000 ) } meg`
                     :   `Nothing preloaded` ),


   webaudio = { init, play, pause, resume, loop, setVolume, report};

export default webaudio;