

import  urls   from './url.js'
 
export  default config=> new Promise( (resolve, reject) => {




    let {rows= 66, cols= 19, svg, collection, active, container, url= urls.content.weave, scale=1, i=0, j=0, defaultColor=0, selection=null }= config??{};

    var rects, rectgroup;
    

    const construct= ()=>{

      //  if( !Number.isInteger(   Object.values( collection??{})[0]?.[0]?.[0] ) ) collection={ zero:blankSlate() };
        if( !active  )  active = Object.keys(   collection )[0];
        
           

        const unhide= c=>{ while ( c ) {  
                                   c.hidden=false; 
                                   c.style.opacity=1; 
                                   c=c.parentElement;
                                   } }



     const injectColorClasses = ()=>{


        if( document.head.querySelector("#weavecolors") )   return;

            /*  override these defaults by pre-defining these variables in css. Note: you must use hls color model*/
        if( !getComputedStyle(document.documentElement).getPropertyValue(`--color-0`))
                 document.head.insertAdjacentHTML( "beforeend", `<style id="basecolors" >
                 :root {
                    --color-0:hsl( 64, 47%, 87%); 
                    --color-1:hsl( 70, 48%, 54%); 
                    --color-2:hsl( 39, 61%, 56%); 
                    --color-3:hsl(  0, 56%, 48%); 
                    --color-4:hsl(  8, 71%, 20%);
                    }                  </style>`);
        let ncolors= 0;
        while( getComputedStyle(document.documentElement).getPropertyValue(`--color-${ncolors}`)) ncolors++;


            let compsty = getComputedStyle(document.documentElement);
            const hsl=Array(ncolors).fill( null ).map( (v,i)=>{
                    let style =  compsty.getPropertyValue(`--color-${i}` );
                    let hsl   =  style.match(/hsl\(\D*(\d*)\D*(\d*)\D*(\d*)/);
                    return  { h:Number(hsl[1]), s:Number(hsl[2]), l:Number(hsl[3]) };
                    })  ;

            let colors="";
            for( let i =0; i<ncolors; i++ )
                for( let color=0; color <ncolors; color++ )
                    for( let bias =0; bias  <2; bias++ )
                        for( let cane =0; cane  <5; cane++ ){
                            let {h,s,l} = hsl[color];
                        // h=  Math.floor( h + [   -2,   -1,   0,    1,    2][cane]);
                        // s=  Math.floor( s * [ 1.25, 1.10, 1.0, 0.94, 0.85][cane]);
                        // l=  Math.floor( l * [           1.0,         0.82][bias]);
                            h=  Math.floor( h + [   -2,   -1,   0,    1,    2][cane]);
                            s=  Math.floor( s * [ 1.24, 1.10, 1.0, 0.94, 0.85][cane]);
                            l=  Math.floor( l * [           1.0,         0.92][bias]);

                            h = (h+360)%360; s=  Math.min( 100, Math.max(s, 0)); l=  Math.min( 100, Math.max(l, 0));
                            colors+= `.fill-${color}-${bias}-${cane} { fill:hsl( ${h}, ${s}%, ${l}%); }\n`
                            }
        let oldColors= document.head.querySelector("#weavecolors");
        if( oldColors ) oldColors.remove();  //actually unreachable 
        document.head.insertAdjacentHTML( "beforeend", `<style id="weavecolors" >${ colors }</style>`);
        }



    




        const injectSVG = (  )=>{


            unhide( container);
            container ??= document.querySelector("#weave, #imagelayer, #view") ?? document.body;
            container  =  document.querySelector("#view") ?? container;
            let unleft = -(container.style.left ?? 0);
            let untop  = -(container.style.top  ?? 0);

         if( !document.head.querySelector("#weavelayout") )
              document.head.insertAdjacentHTML( "afterbegin",` 
                    <style id="weavelayout">
                        .fx.bg {
                        /*  z-index:3;*/
                            position:absolute; left:${unleft}; top:${untop}; 
                            width:100vw; height:100vh;
                            background-color: rgba( 15, 45, 0, 0.6);
                            }

                        .fx.portrait   {
                        /* z-index:4;*/
                            width: 54vh; height:100vh; left:calc(50vw - 27vh);  top:0;
                            position:absolute; 
                            background-color: rgba(255, 55, 55, 0.386);
                            border: .4vmin inset rgb(194, 174, 57);
                            box-shadow: -5px -5px 20px rgba(246, 203, 248, 0.61), 9px 7px 24px rgba(27, 9, 28, 0.61);
                            }
                        @media( min-aspect-ratio: 57/100 ){  .fx.portrait { width: 57vh; height:100vh; left:calc(50vw - 29vh);  top:0; } }
                        @media( max-aspect-ratio: 57/100 ){  .fx.portrait { width:100vw; height:176vw;  top:calc(50vh - 88vw); left:0; } }
                        svg.fxsvg  { position: absolute; left: 0;   top:0;   }
                    </style>`);
    



        if( !container.querySelector("div.fx") )
             container.innerHTML=`<div class="fx bg"></div>    <div class="fx portrait"></div>  `;
                 
        container= container.querySelector("div.portrait");
        const rectSize= ( (container.clientWidth||(1920*.45))/cols )/ 1.38 ; //trial & error
    
        const pitch = { x:scale*container.clientWidth, y:scale*container.clientHeight };     
        const id = scale==1?"weave" :`weave_${i}_${j}`
        
        if( !container.querySelector(`svg#${id}` ))
             container.insertAdjacentHTML( "beforeend",`
                <svg id="${id}" class="fxsvg" width="100%" height="100%" pointer-events="none" version="1.1" xmlns="http://www.w3.org/2000/svg"></svg>`);
  //         else container.querySelector(`svg#${id}` ).innerHTML="";
        svg= container.querySelector(`svg#${id}` );

        svg.innerHTML=`
            <g id="g-${id}" transform="translate(${pitch.x*i} ${pitch.y*j}) scale(${scale})"  pointer-events="all" >
              ${rects.map( (column,u)=>column.map( (row,v)=> `
               <rect
                    data-u ="${u}"     data-v = "${v}"
                    x="0"              y      = "0" 
                    width="1"          height = "1" 
                    rx=".15"           ry     = ".15"
                    stroke-width=".05" stroke="orange" 
                    transform="     translate( ${(.5+u-(v/2)%1)*1.4141414*rectSize} ${(v-.7)*0.7070707*rectSize} )
                                    rotate(45)
                                    scale(${rectSize} )" />`) ).flat().join("")}
            </g>`;
        rectgroup =  svg.querySelector(`#g-${id}` );
        rects     =  rects.map( (column,u)=>column.map( (r,v)=> rectgroup.querySelector(`[data-u="${u}"][data-v="${v}"]`)) );
       }

    

        var   randcane =    new Array(200).fill(0).map( ()=>Math.floor( Math.random()*5) );
        const randomize= ()=> randcane =  randcane.map( ()=>Math.floor( Math.random()*5) );

        const paint = (r, color, shade) =>{
            const {u,v}  =  r.dataset;
            color??= collection[ active  ] ??0;
            if( Array.isArray( color )) color= color[u][v];
            let bias =(v&1)? 1:0;
            shade??= Math.floor(Math.random()*5); 
            r.className.baseVal=`fill-${color}-${bias}-${shade}`;
        }        

       const paintAll =  color=>  rects.forEach( column=> column.forEach( r=>paint(r,color) ));     
    

 
        // recursively weave a pattern
        // based on the pattern color, and -only when recursing- an advancing cane number

        const loom= ( art, c ) =>new Promise(( resolve, reject)=>{
            let cFore= c?? 1-rows;
            let cBack= -cFore+cols;
            if( cFore >= 2*rows+cols ) resolve()
            else        cane(  art,  false, cBack     )
            .then(()=>  cane(  art,  true,  cFore   ) ) 
            .then(()=>  loom(  art,         cFore+1 ) )
            .then(      resolve ) 
            .catch( ()=> console.error("198"))
            });
            

        // recursively weave a single cane of the pattern
        // based on the weave direction, pattern color, cane number, and -only when recursing- an advancing stitch number

        const cane= (    art, forward, c, s ) =>new Promise(( resolve, reject)=>{
            if( !s )
                if( forward )
                    if( c<0 )               s=    Math.abs( 2*c );
                    else                    s=    0;
                else        
                    if(      c< 0    )      s=    Math.abs( 2*c ) +1;
                    else if( c>=cols )      s=    Math.abs( 2*(c-cols+1) );
                    else                    s=    0;
                    
            if( !stitch( art, forward, c, s) )         return resolve();
            setTimeout( ()=> 
                cane( art, forward, c, s+2 )
                .then( resolve )
                .catch( ()=> console.error("219"))
                , 5);
            });


        // weave a single stitch of the pattern
        // based on the weave direction, pattern color, cane number, stitch number

        const stitch = (  art, forward, c, s ) => {
        
        let u= c + (forward? 1:-1) * Math.floor((s)/2);
        let v= s + (forward? 0:1 );
        if((u<0) || (v<0) || (v>=rows) || (u>=cols)) return false;
        let shade = randcane[ Math.abs(c) ];
        let color =  art?.[u]?.[v] ?? art;  // pattern or flat color

        // color = ( !u || !v || v==rows-1 || u==cols-1 )? 0:4;
        
            let rect =rects[u]?.[v];
            if( rect ) paint( rect, color, shade );
            else console.log( `No rect at u=${u} v=${v} `)
            return !!rect;
        }


        

                
        
        injectColorClasses();
        injectSVG(  );
        window.addEventListener("resize", ()=>injectSVG() );
        

        const churn = {
            enable: ink => churn.cycle = setInterval( ()=>{
                            randomize();
                            loom( ink )
                            }, 8000 ),  
            disable: ()=> clearInterval(  churn.cycle )
              }                                       







        resolve( {
            get pattern()     { return collection[ active ] },
            get active( )     { return active               },
            set active( str)  { active = str;               },
            collection,
            svg,
            rectgroup,
            blankSlate,
            one:   (u,v)=> paint(rects[u][v]), 

            background: (color=2)=>{
                paintAll( color );
          //      churn.enable();            
                },

        perform: key=>{
            churn.disable();
            if( key ) active = String(key).match(/[^\.]*/)[0]; // eg: strip out ".mp3" if present 

            let ink = collection[ active ] ?? Number(active);
            if( !ink )                    return false;

            setTimeout( ()=> unhide(container),                     500 );
            setTimeout( ()=> loom(  2  ).catch( console.error ),     10 );             
            setTimeout( ()=> loom(  2  ).catch( console.error ),   1250 );
            setTimeout( ()=> loom(  1  ).catch( console.error ),   2250 );
            setTimeout( ()=> loom(  0  ).catch( console.error ),   3500 );
            setTimeout( ()=> loom( ink ).catch( console.error ),   5000 );
//                    setTimeout( ()=> loom(  pattern ).then( churn.enable ).catch( console.error ),   5000 );
            return true;
            },

        unperform: ()=>{
            setTimeout( ()=> loom(    4     )                     .catch( console.error ),      1 );             
            setTimeout( ()=> loom(    3     )                     .catch( console.error ),   3000 );
            setTimeout( ()=> loom(    2     )                     .catch( console.error ),   6250 );
            setTimeout( ()=> loom(    1     )                     .catch( console.error ),   9500 );
            setTimeout( ()=> loom(    0     )                     .catch( console.error ),  12750 );
            },
        clone: data =>
            Object.keys(data.collection).forEach( key =>
                collection[key].forEach( (column,c) =>
                collection[key][c].forEach( (row,r) =>
                collection[key][c][r] = data.collection?.[key]?.[c]?.[r]  ?? 0
            ))) ,
      newClone:   () =>{
            let data ={};
            Object.keys(collection).forEach( image =>{
                    data[image]=[];
                    collection[image].forEach( (column,c) =>{
                        data[image][c]=[];
                        collection[image][c].forEach( (row,r) =>
                                data[image][c][r] =  collection[image][c][r]
                    ) }) }) 
            console.log( data );
            return data;
            },
        show: key=>{
//            if( key ) active = key.match(/[^\.]*/)[0] ?? active;
            // if( key ) active = key.split('.')[0] ?? active;
            active = key?.split('.')?.[0] ?? active;
            // console.log( {key, active} );
            // // if( collection[ active ]== null)    return false;
            setTimeout( ()=> unhide(container),     500 );            
            paintAll( collection[ key?.split('.')?.[0]  ] );
            return true;
            },
        hide:   ()=> svg.style.display="none", 
        unhide: ()=> svg.style.display="block",
        remove: ()=>{
            svg.remove(),
            collection = null;
            active = null;
            },
        loom
        }); //returned object
    
   
    } // construct

    
    
    const blankSlate= ()=>  Array(cols).fill( Array(rows).fill(  0 ));    
    rects??=                Array(cols).fill( Array(rows).fill(null));

    if( collection )    return construct();
    else

        fetch(url)
            .then( response => response.json())
            .then( data=> ({collection, active} = data))
            .then(        construct)
            .catch(       reject   );
    

}) // newwweave promise

