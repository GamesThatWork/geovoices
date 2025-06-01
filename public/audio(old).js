/*  written by GitHUb Copilot
   iteratively prompted and heavily tweaked by me 
    .... heavily tweaked by me
   */

   import url  from "./url.js";  
 









let     context = null,    
        musicNode = null,
        voiceNode = null,
        ambientNode = null,
        sfxNodes = [],
        elapsedTime = null;

const   
        cache = {},                                                                                                                   channel =soundFileName=> /story\/|guide\//i.test(soundFileName) ?  "voice":"sfx" ,
        makeURL =soundFileName=> url.content.load + soundFileName,  
      
        audioClips={  all:[
              "ambience/blue-ridge.mp3",
              "guide/3200-acre-tract.mp3",
              "guide/birdtown.mp3",
              "guide/blue-ridge-gsm.mp3",
              "guide/directions.mp3",
              "guide/first-fire.mp3",
              "guide/great-smoky-mountain-national-park.mp3",
              "guide/kawahi.mp3",
              "guide/kituwah.mp3",
              "guide/leaving-kituwah.mp3",
              "guide/museum.mp3",
              "guide/New Kituwah Academy (uncut).mp3",
              "guide/new-kituwah-academy.mp3",
              "guide/selu-kanati.mp3",
              "guide/soco-falls.mp3",
              "guide/soco-gap.mp3",
              "guide/spanish-encounter.mp3",
              "guide/stckball.mp3",
              "guide/story-of-kawohi.mp3",
              "guide/tecumseh.mp3",
              "guide/thomas-overlook.mp3",
              "guide/tourism.mp3",
              "guide/welcome.mp3",
              "story/ballgame-of-birds-and-animals.mp3",
              "story/chunkey.mp3",
              "story/evergreen.mp3",
              "story/first-fire-story.mp3",
              "story/how-to-follow-directions.mp3",
              "story/kanati.mp3",
              "story/selu.mp3",
              "story/spearfinger.mp3",
              "music/flute.mp3",
              "music/friendship-dance-1.mp3",
              "music/friendship-dance-2.mp3",
              "music/friendship-dance-3.mp3",
              "music/friendship-dance-4.mp3",
              "music/friendship-dance-5.mp3",
              "music/friendship-dance-6.mp3" ],
         },

    latentSegments=[],
        

    preloadSegment =segment=> {
            if(  audioClips[ segment ])
                if( context)  return preload( audioClips[ segment ] ); 
                else                 latentSegments.push( segment );
            else console.warn( `AUDIO: unknown audioClip segment ${segment}` );

            return Promise.resolve();
            },    
        
   
    init =( segment="all" )=> {
            const _AudioContext = window.AudioContext  || window.webkitAudioContext ;
            
            if(   _AudioContext && !context )   context =new _AudioContext();
            else    return  console.log(`Sorry. Your browser does not support modern Web Audio. 
                         Please update or use the latest Safari or  Chrome"}.`);
            
            if( segment ||  (segment= latentSegments.shift()))
                preloadSegment( segment );
            console.log( "AUDIO init", {context, segment});
            },
        
    preload =soundFileNames=> {
            if (!Array.isArray(soundFileNames))       soundFileNames = [soundFileNames];
            play("loading");
            return Promise.all( soundFileNames.map(fileName => 
                fetch( makeURL(      fileName  ))
                .then(  response    => response.arrayBuffer()                               )
                .then(  arrayBuffer => context?.decodeAudioData(arrayBuffer)           )
                .then(  audioBuffer => cache[fileName] = audioBuffer                        )
                .catch( error       => console.error(`AUDIO: Error loading ${ fileName}:`, error)  )
                ))
                .then( ()=> play("ding") );
            },

        play   =soundFileName=>  context && (  playPreloaded( soundFileName) ?? playDirect(soundFileName) ),
    
        playPreloaded =( soundFileName, latent=false )=> {
             
            if (!cache[soundFileName] )  return null;
            if( context==="suspended" )  return console.error( "AUDIO: context suspended") && null;

            let     node  = new AudioBufferSourceNode( context, { buffer: cache[soundFileName] }),
                    audioChannel = channel(soundFileName);  
            stop(   audioChannel );
            switch( audioChannel ) {
                case "music":     musicNode    = node;   break;
                case "sfx":       sfxNodes.push( node);  break;
                case "voice":     voiceNode =    node;   break;
                default: console.warn( `AUDIO: unknown channel for ${soundFileName}`);   break;
            }
            node.connect( context.destination);
            if( !latent ) node.start();
            console.log( `AUDIO:  playing ${soundFileName} from cache`, {soundFileName, latent, node, audioChannel });
            return node;
            },

        playDirect = (soundFileName, firstTry = true) => {
            if (/suspended|interrupted/i.test(context.state)) 
                return context.resume()
                        .then(() => firstTry && playDirect( soundFileName, false));
        
            const url = makeURL(soundFileName),
                audioElement = new Audio(url),
                track = context.createMediaElementSource(audioElement),
                isVoice = channel(soundFileName) === "voice",
                bufferSize = 4096, // Choose a suitable buffer size
                buffer = []; // This will hold the audio data
        
            track.connect(context.destination);
        
            console.log(`AUDIO: streaming from ${url}`);
        
            audioElement.addEventListener('canplaythrough', () => {
                audioElement.play();
                if (isVoice)  voiceNode = track;
                else          sfxNodes.push(track);
                });
                
            audioElement.addEventListener('ended', () => {
                track.disconnect();
                if (isVoice) voiceNode = null;
                else         sfxNodes  = sfxNodes.filter(node => node !== track);
                audioElement.remove();
                });
            return audioElement;
            },

    stop =target=> {
        if(!context )                                    return console.error( "AUDIO: context not initialized");
        if(/suspended|interrupted/i.test(context.state)) return console.error( "AUDIO: context suspended"      ); 
        if(!target)                                      return console.warn ( "AUDIO: no target"              );  

        if( target.disconnect ){//  is a node
            target.disconnect();
          //  target.remove();
            return;
            }

        if      (target === 'music')    stop( musicNode  );
        else if (target === 'voice')    stop( voiceNode  );
        else if (target === 'sfx')   sfxNodes.forEach(node => 
                                        stop( node ));
        else if (target === 'all') {
                                        stop('music');
                                        stop('voice');
                                        stop('sfx');
                                    }
        else if (target)                stop( _getNode(target) );       
        },

    pause     = soundFileName=>{
            if( soundFileName) return  _getNode(soundFileName)?.pause?.();
            context.suspend();
            },

    resume    = soundFileName=>{
            if( soundFileName) return  _getNode(soundFileName)?.resume?.();
            context.resume();
            },
    
    playFrom =(soundFileName, time)=> {
        stop(soundFileName);
        playPreloaded(soundFileName, {latent:true}).start(time);
        },

    loop    =(soundFileName, startTime=0, endTime = null, loopCount = Infinity)=> {
        stop(soundFileName);
         let  node = playPreloaded(soundFileName, {latent:true});
         if( !node ) return null;
         node.loop = true;
         node.loopStart = startTime;
         node.loopEnd = endTime || node.buffer.duration;
         node.start(0, startTime);
         if (loopCount !== Infinity)
            setTimeout(() => node.stop(), (node.loopEnd - node.loopStart) * loopCount * 1000);
        },


    _getNode =soundFileName=>{
        switch (channel(soundFileName)) {
            case "music": return musicNode;
            case "sfx":   return sfxNodes.find(node => node.buffer === cache[soundFileName]);
            case "voice": return voiceNode;
            default:      return null;
            }},
        
    clearCache =soundFileName=> {
        if (soundFileName)     delete cache[soundFileName];
        else                   cache = {};
        } ;

init();


const audio = { init, play, stop, pause, resume, playFrom, loop};

export default audio;