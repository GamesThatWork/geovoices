import app      from './app.js';
import url      from './url.js';
import perform  from './perform.js';
import nav      from './nav.js';

export default  (node, evt) =>{
    
//    if( !["editor","developer"].includes( localStorage.getItem("role")))
    if( !app.editEnabled )   
        return {  
            open:    ()=>false,
            refresh: ()=>false,
            close:   ()=>false,
            };

    const dom={}
    const { dna } = node; 
    const e= evt.originalEvent;
    if( e.handled ) return; 
    e.handled = true;
    // e.stopImmediatePropagation();
    // e.stopPropagation();
    // node.map.base.stop( evt );

    var popup;

    const listeners=[];

 
    const unlisten = ()=>{
        while ( listeners.length ){
            const              {target, event, handler, options }  = listeners.pop();
            target.removeEventListener( event, handler, options );
            }
        }

    const listen=  root=>{
        if( !root ) unlisten();
        ["click", "change", "blur","mousedown"].forEach( event=>
            (root ?? document.querySelector('#contextmenu'))
                .querySelectorAll( `[data-${event}]` ).forEach( target=>{
                    let handler = cmd[ target.dataset[event]   ];
                    let options = target.dataset.once? {once:true} : {} 
                    target.addEventListener( event, handler, options );
                    listeners.push( {target, event, handler, options })
                }))};
                


// [event];                install( 
//                     target, 
//                     event, 
//                     handle, //( action=>e=>cmd[action](e) )( element.dataset[event]  ),
//                     e.target.dataset.once? {once:true} : {} );
//                 } ) )
//              }
    
    // const listen= (root=document.querySelector('#contextmenu') )=>
    //     ["click", "change", "blur","mousedown"].forEach( event=>
    //         root.querySelectorAll( `[data-${event}]` ).forEach( element=>
    //             element.addEventListener( event,  e=>
    //                 cmd[ e.target.dataset[event]](e) ) ) );
            


    const cmd={

        debug: e=> 
            console.log(  node  ),           

        toggle: e=> {
            let toggler =  e.target;
            let togglee =  toggler.parentElement.querySelector(".togglable");
            let on =       togglee.hidden = !togglee.hidden;
            if( toggler.nodeName=="BUTTON") toggler.innerText = on? 'show' : 'hide';         
        },

        delete:e=> {
            node.delete();
            app.map.closePopup();
            },
    
        json:e=> {
            open( url.json + encodeURIComponent( url.tour.edit + node.dna.id ),"json");
            app.map.closePopup();
            },
    
        exit: e=>{
            e.target.innerText= (dna.exit=!dna.exit)? "trigger on EXIT":"trigger on ENTER";
            node.render();    
            },

        next: e=>{
            let nextFound = e=>{
                node.editing = "false";
                node.end();
                node.map.base.off( 'mousemove',  node.update    );
                node.map.base.off( 'click',      nextFound      );    
                }

            node.editing = "next";
            node.map.base.on ( 'mousemove',  node.update     );
            node.map.base.on ( 'click',      nextFound       );   
            app.map.closePopup();
            },
        
        shownext: e=>{
            node.showNext = !node.showNext;
            node.render();    
            },
    

        play: node.perform,

        reset: e=>node.reset(),
    
        save: e=>node.save().then( result=> e.target.innerHTML= result),
    
        rename: e=>{
            let id = (e.target.innerText.match(/[a-zA-Z()0-9.\-+]+/gm)??[]).join("_");
            if( !node.pin || !node.parent.getPin( id ) )        dna.id=id;
            node.render();    
            },
                
                  
        dbug: e=> console.log("edit node dna: ", dna ),

 
        preview:   e=>
                perform[  e.target.dataset.medium ]( e.target.dataset.url )
                    .then( ()=> document.body.addEventListener(     "mouseup",  cmd.unview )),
        unview:   e=>{
                    let media = e.target.dataset.medium ? [e.target.dataset.medium ]:["speak","text","audio","image","video"];
                    let abortions = media.map( m=> perform[m]("abort") ); 
                    Promise.all( abortions )
                //perform[  e.target.dataset.medium ]( "abort" )
                    .then( ()=> document.body.removeEventListener(  "mouseup",  cmd.unview ));        
                },
            
        seturl: e=>{ 
                dna[      e.target.dataset.medium ]= e.target.dataset.url;
                document.querySelector("#filepicker" ).remove();
                document.querySelector("#playthis").innerHTML= e.target.dataset.url;
                node.update();
                },       
        list: e=>  {
                e.currentTarget.removeEventListener( "click", cmd.list, {once:true});
                e.stopPropagation();
                fetch( url.content.list 
                            +`?folder=cherokee/&medium=${e.target.dataset.medium}`)
                    .then(  response =>  response.json()               )// get remote file list
                    .then(  files    => {
                                let f; if( f= document.querySelector("#filepicker")) f.remove;
                                files = files.sort();
                                let medium = e.target.dataset.medium;
                                var groups= files.filter( name=>name.endsWith('/') );
                                
                                groups = groups.map( name => Object({ name,
                                            files: files.filter( fname=> fname.startsWith( name  ))
                                                        .map(    fname=> fname.replace( name, "" ))
                                                        .filter( fname=> fname                    ) }))
                                            .filter( group => group.files.length );



                               // groups.map( group=> `${group.name}
                               //                      ${group.files.map( fname=> `<li><a href="${group.name+fname}">${fname}

                                groups.push( { name:"", files:files.filter( name=>!name.includes('/'))}) ;
                                
                                const filepicker=`<div id="filepicker"><h1>Choose ${medium} File</h1>
                                                        <ul>
                                    ${ groups.map( group=> `<li>
                                                                <h2 class="toggle" data-click="toggle"  >${group.name ?? "[base]"}</h2>
                                                                <ul class="togglable" hidden> ${ group.files.map( fname=> 
                                                                    `<li> 
                                                                        <button data-click="seturl"  data-url="${group.name+fname}"  data-medium="${medium}" >✓</button>
                                                                        <button data-mousedown="preview" data-url="${group.name+fname}"  data-medium="${medium}" >▶</button>   
                                                                        ${fname.match(/(.*)\.[^.]+$/m)?.[1] ?? "-blank-" }
                                                                    </li>`).join("") }
                                                                    <li data-click="upload" data-folder="${group.name}" data-medium="${medium}">
                                                                        upload ${medium} file to <b>${group.name?? "[base]" }</b></li>
                                                                </ul></li>`).join("")}
                                                        </ul></div>`;
                                e.target.insertAdjacentHTML("beforeEnd", filepicker );
                                listen( e.target );
                                e.target.querySelectorAll("[data-click=upload]").forEach( up=>
                                    up.addEventListener( 'click',      me=>{ 
                                        e.target.insertAdjacentHTML("beforeEnd", 
                                           `<form action="${url.content.save}" target="_blank"  method="post" enctype="multipart/form-data">
                                                <div>
                                                    <label for="uploadfile">upload and name ${medium} file</label>
                                                    <input type="text" id="key" name="key" value=""  >
                                                    <input type="file" id="uploadfile" name="uploadfile" accept="${medium}/*" multiple capture >
                                                </div>
                                                <div class="previewer"><p>No files currently selected for upload</p></div>
                                                <button>Submit</button>
                                            </form>`);   
                                        
                                        e.target.querySelector( ".previewer" ).innerHTML="";         
                                        e.target.querySelector( "#uploadfile" ).addEventListener("change", fe=>{
                                            const image = document.createElement('img');
                                            image.src = URL.createObjectURL( fe.target.files?.[0] );
                                            e.target.querySelector( ".preview" ).appendChild(image);                                                
                                            e.target.querySelector( "#key" ).value = fe.target.files?.[0]?.name;                                                
                                            });
                            }))})} ,

        addpin: e=>{
            node.spawn( { 
                id:"New Pin",
                ...evt.latlng, 
                tags:[], 
                zones:[{ 
                    id:"Zone_0",
                    radius: 300
                  }]
                });
            app.map.closePopup();
            },
        
        addzone: e=>{
            node.spawn( { 
                id:"Zone_"+node.children.length,
                radius: 300
                    });
            node.render();
            app.map.closePopup();
            },
            
        center: e=>{
            node.dna.lat=evt.latlng.lat;
            node.dna.lng=evt.latlng.lng;
            node.dna.zoom= node.map.base.getZoom();
            node.map.base.setView( node, node.dna.zoom);
            app.map.closePopup();
            },

        testdrive: e=>{
            if( nav.active())  nav.stop();
            else               nav.test( { tour:node, map:node.map } );
            app.map.closePopup();
            },
    

        drive: e=>{
            if( nav.active())  nav.stop();
            else               nav.drive( { tour:node, map:node.map } );
            app.map.closePopup();
            },
    
        form: e=> {
            dna[ e.target.name ] =  e.target.value;
            },

        tag: e=>{
            let tag =e.target.dataset.tag +","; 
            if( dna.tags?.includes( tag ) )  dna.tags = dna.tags.replace( tag,"" );
            else                             dna.tags = (dna.tags?? "" )+ tag; 
            if( dna.tags?.includes( tag ) )  e.target.classList.add(   "active");
            else                             e.target.classList.remove("active");
            },

        media: e=>{
            let str=  e.target.innerHTML;
            if( str?.length )   dna[ e.target.dataset.medium] =  str;
            else                delete dna[ e.target.dataset.medium];
            document.querySelector("#playthis").innerHTML= str ?? "[no playable content]";
            cmd[ str? "preview":"unview" ](e );
            },
        }





    let empty=" ";

    app.map.closePopup();
    
    document.querySelector('#contextmenu')?.remove();
    app.map.openPopup(

        node.tour?

            `<div id='contextmenu'>
            <H2>geoTour</H2>
            <H1 data-blur="rename" contenteditable > ${dna.id.replaceAll("_"," ")}</H1>    
                <ul id="contentmenu">
                    <li data-click= "addpin"       >Drop Pin Here</li> 
                    <li data-click= "center"       >Center Tour Here</li>
                    <li data-click= "reset"        >Reset App and Data</li>
                    <li data-click= "save"         >Save This Tour</li>
                    <li data-click= "shownext"     >${node.showNext?"Hide ":"Show "} routing network</li>
                    <li data-click= "json"         >Edit JSON Directly</li>       
                    <li data-click= "testdrive"    >${nav.active()?"End ":""}Test Drive</li>
                    <li data-click= "drive"        >${nav.active()?"END ":"START"} TOUR</li>
                    <li ><button data-click= "dbug">DEBUG</button></li>
                </ul>
            </div>`

    :(  node.pin? 
        
        `<div id='contextmenu'>
            <H2> ${node.parent.id.replaceAll("_"," ")}</H2>
            <H1 data-blur="rename" contenteditable > ${dna.id.replaceAll("_"," ")}</H1> 
            <ul>
                <li id="contentmenu">tags 
                    <button class="toggleindicator" data-click="toggle" >show all tags</button>                                    
                    <ul class ="togglable" id="contenttypes" hidden >
                    ${ ["story","guide","music","waypt"].map( tag=> 
                        `<li data-click="tag" data-tag="${tag}" class="tag${dna.tags?.includes(tag)?" active":""}"  >${tag}</li>` ).join("")}
                    </ul>
                </li>
                <li data-click= "addzone" >add a new zone</li>
                <li data-click= "delete" >delete this Pin</li>
                <li ><button data-click="dbug" >DEBUG</button></li>
            </ul>
        </div>`

    :// node.zone?

        `<div id='contextmenu'>
            <H2> ${node.parent.parent.id.replaceAll("_"," ")}</H2>
            <H2> ${node.parent.id.replaceAll("_"," ")}</H2>
            <H1 data-blur="rename" contenteditable > ${dna.id.replaceAll("_"," ")}</H1>    
                <ul>
                    <li id="contentmenu">
                        <button data-click= "play">▶</button>
                        <span id="playthis">${node.dna.speak??node.dna.audio??node.dna.image??node.dna.video??"[playable content]"}</span>
                        <button class="toggleindicator" data-click="toggle" >edit</button>                                    
                        <ul class ="togglable" id="contenttypes" hidden>
                            <li><button data-click="toggle" data-medium="speak">speak</button> 
                                <div data-blur="media"    data-medium="speak" class="togglable" contenteditable>${dna.speak??empty}</div></li>
                            <li><button data-click="toggle" data-medium="text" >text</button> 
                                <div data-blur="media"    data-medium="text"  class="togglable" contenteditable >${dna.text ??empty}</div></li>
                            <li><span data-click="list"   data-medium="audio">audio</span> 
                                <div  data-blur="media"   data-medium="audio" contenteditable>${dna.audio ??empty}</div></li>
                            <li><span data-click="list"   data-medium="image">image</span> 
                                <div  data-blur="media"   data-medium="image" contenteditable>${dna.image ??empty}</div></li>
                            <li><span data-click="list"   data-medium="video">video</span> 
                                <div  data-blur="media"   data-medium="video" contenteditable>${dna.video ??empty}</div></li>
                            </ul>
                    </li>
                    <li data-click= "exit" >trigger on ENTER</li>
                    <li data-click= "next" >next PIN</li>
                    <li>recycle in <input data-change="form" type="number" name="cycle" min="5" step="5" value="${dna.cycle}"> sec</li>
                    <li data-click= "delete" >delete this zone</li>
                    <li ><button data-click= "dbug">DEBUG</button></li>
                </ul>
    </div>` ), evt.latlng);

    listen();

}
        