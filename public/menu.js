
import url          from './url.js';
import nav          from './nav.js';
import perform      from './perform.js';
import app          from "./app.js"
import webaudio     from "./webaudio.js"
import {requestedTour, titleCase}  from './util.js';


const geoVoicesCredits = [
    { head: "GamesThatWork" },
    { role: "Context Manager",          name: "Anna Leah" },
    { role: "Software Engineer",        name: "Seth Morrill" },
//  { role: "Pixel Mistress",           name: "Nicolia McCoy" },
    { role: "Field Tester",             name: "Judy Jacobson" },
    { role: "Director",                 name: "Dov Jacobson" },
    { attr: "Funded by the North Carolina Arts Council" },   
    { attr: "<a target=\"_blank\" href=\"mailto:work@gamesthatwork.com?subject=New GeoVoices\">Produce your own GeoVoices Tour?</a>" },   
]


const feedback = ()=>{
    
    //document.querySelector("#menu").innerHTML="";
    
    let dom=document.querySelector("#feedback");
    dom.hidden=false;
 
 
   //  style="enable-background:new 0 0 512 512;" version="1.1" 

    const svgStart= `<div  id="stargui" class="svg-container">
   <svg version="1.1" viewBox="0 0 500 80" preserveAspectRatio="xMinYMin meet" class="svg-content">`;

    const svgEnd   = `</svg></div>`;
    const star= (n,hot) => `<polygon id="star${n}" data-index="${n}" ]
                transform="translate(${n*100+12}, 0) scale(.15)" 
                   class="${hot? ((hot>0)?"hotstar":"notstar") : "neutstar"}"
                       points="448,208 301,208 256,64 211,208 64,208 183.1,297.3 136,448 256,352 376,448 328.9,297.3 "/>`;
    dom.innerHTML= 
    `<form action="${url.feedback.save}" method="POST" id="feedback" target="_self">  
        <h1>Feedback:
            <input id="timestamp" name="timestamp" type="hidden"  value="${Date.now()}"           />    </label>
            <input id="tourname"  name="tourname"  type="hidden"  value="${app.tour.dna.id}"      />    </label>
            <input id="version"   name="version"   type="hidden"  value="${app.tour.dna.version}" />    </label>
            </h1>      
        <label>Star rating${svgStart+star(0)+star(1)+star(2)+star(3)+star(4)+svgEnd}
            <input id="stars" name="stars" type="hidden"  value="0" />    </label>
        <label>Comments:
            <textarea name="comments"></textarea> </label>
        <label>Issues: [Please be specific!]
            <textarea name="issues"></textarea></label>
        <label> Your name [optional]
            <input name="name" type="text" placeholder="First, full or nickname" autocomplete="name"> </label>
        <label> Your email [required for reward!]
            <input name="email" id="email" type="text" placeholder="Can we contact you?" autocomplete="email"> </label>
        <div id= "permissions">
            <label><input name="device" type="checkbox" value="${window.navigator.userAgent}" checked>     Share technical data</label>
            <label><input name="user"   type="checkbox" value="${app.userID}"                 checked>        Share touring data</label>
            <label><input name="follow" type="checkbox" value="newtours">                     Contact when new tours are ready</label>
            </div>                  
  
        <button type="submit">DONE</button>
    </form>` ;

//    dom.querySelectorAll("polygon").forEach( star=>star.addEventListener( "pointerenter", e=>{
        dom.querySelectorAll("polygon").forEach( star=>star.onpointerenter= e=>{
            dom.querySelectorAll("polygon").forEach( s=> 
                s.className.baseVal= s.dataset.index<=star.dataset.index? "hotstar":"notstar") 
            dom.querySelector( "#stars").value= Number(star.dataset.index)+1;
            });
    
    dom.querySelector("#email").addEventListener( "change", e=>{
        dom.querySelector("input[name=follow]").checked= true;
        });  
    dom.querySelector("form").addEventListener( "submit", e=>setTimeout( ()=>{
       // location.href= url.website;
        // dom.hidden=true;
        // dom.innerHTML="";
        } ), 4000 );      
}










const burger = `
 <svg id="burger">
                     <rect class="icon"  x="0"    y ="0"           width="100%" height = "100%"  rx="20%" ry= "20%" stroke-width="9%"/>
  ${[0,1,2].map( i=>`<rect class="stack" x="10%"  y ="${13+i*27}%" width ="80%" height = "20%"   rx="6%"  ry= "6%"  />`).join("")}
        </svg>`; 




// const burger = `
// <svg width="68" height="64" id="burger">
//                      <rect class="icon"  x="0" y ="0"         width="54" height = "48" rx="9" ry= "9" stroke-width="3"/>
//   ${[0,1,2].map( i=>`<rect class="stack" x="5" y ="${i*13+5}" width="45" height = "10"  rx="3" ry= "3" />`).join("")}
//         </svg>`; 

const dom =          document.querySelector("#menu" )??{};
const pauseScreen  = document.querySelector("#pause")??dom;




const pause= ()=>{
    console.log("pause");
    ready();
    nav.stop();
    perform.pause( true);
    pauseScreen.innerHTML= `<div><div>Tap to Resume Tour</div></div>`;
    pauseScreen.addEventListener("click", e=>{
        pauseScreen.innerHTML= null;
        perform.pause( false);
        nav.drive();
        }, {once:true});
}


const launchpad= ()=>{
    ready();
    nav.stop();
    document.body.insertAdjacentHTML( "beforeend", `
        <div id="pause"><div>Tap to Launch Tour</div></div>` )
    
    document.querySelector("#pause").addEventListener("click", e=>{
        e.target.remove();
        nav.drive();
        });
    }



const helptext = `<div id="help">
<h1>Cherokee GeoVoices (beta)</h1>
Thank you for being part of our Beta Test.
This <i>Cherokee GeoVoices</i> is our first tour. 

<h2>Requirements</h2>
    1- <b>Android or iPhone</b>: reasonably modern (2018+)
    2- <b>Browser</b>:  up-to-date Chrome, Safari, etc
    3- <b>Automobile</b>: mountain-ready
    4- <b>Time</b>: two or three hours.

<h2>Starting</h2>
When you launch GeoVoices,it preloads all the voices so you can tour without an internet connection or cell service.
(Cell service is unreliable on much of the Cherokeee tour.)
You may see a countdown. If you do, wait for it to complete before leaving your internet connection. 


<h2>Playing</h2>
Use [PAUSE] to stop the tour.
Tap the screen to restart.

Use [RESET] to update this app. (Requires internet connectivity)

<h2>Ending</h2>
Please use the <b>Feedback</b> form to share your experience.
</div>`;




const splash = show=>new Promise( (resolve, reject)=> {
       
    let {name, resume, next} = show ?? {};
    let theme = name? name.toLowerCase() : "cherokee";
        theme = theme.replace(/[^a-zA-Z0-9]+/g, '-');
        theme = `class="english ${theme}"`;  

    let title = {
        cherokee: `<p class="tsalagi">ᏣᎳᎩ ᎡᎶᎯ ᎧᏁᎬ</p>`,
        tour:     `<p ${theme}>${titleCase(name)} GeoVoices<p>`,
        open:     `<p ${theme}>Cherokee GeoVoices<p>`,
        beta:     `<p ${theme}>Cherokee GeoVoices <small>BETA</small><p>`,
        }        
    let timestamp = resume?
        `<span class="bright">${ Date( resume ).toLocaleString().slice(0,21).replace(/\s+/g,"&nbsp;") }</span>`  
                : "";
    let [pnt, req] = next?.split(",")??[];
    let waypoint=  `<span class="bright">${ titleCase( pnt) }</span>${
            req? '<span class="small"> [required]</small>':""}`;

    document.body.insertAdjacentHTML("beforeend", `
        <div id="splash" class="${name}">
         ${resume? `<div class="resume">  Resuming tour from ${timestamp                    } </div>` : ""}
         ${next?   `<div class="resume">  Next Waypoint: ${waypoint}</div>` : ""}
          <div>
         ${name? `<div>${(title[name]?? "") + title.tour }</div>`
                    : `<div id="logo">                        </div>`  }
                 </div> 
                <div id="tap" hidden>Tap to Start</div>
        </div>`);

    var chron=[];
    const end= ()=>{
        while( chron.length )  clearInterval( chron.pop() );
        document.querySelector("#splash")?.remove();
        return resolve();
        } 
    
    chron.push(  setTimeout( end,                                            resume? 750000:240000 ) );
    chron.push(  setTimeout( e=>document.querySelector("#tap").hidden=false, resume? 45000:  9000 ) );
    document.body.addEventListener("click", end);
    });



const navigation = cmd=>{   
    nav.stop();
    if( cmd ) nav[cmd]();
    ready();
    pauseScreen.innerHTML= ``;
    //document.querySelector("#pause")?.remove();
}    

const drive      = ()=> navigation( "drive" );
const testdrive  = ()=> navigation( "test" );
const stop       = ()=> navigation( "stop" );
    

const content   = document.querySelector("#content");
const nextpoint = document.querySelector("#nextpoint");


const action = {
    credits: e=> perform.text(`<ul id="credits">
                    ${ [].concat( app.tour.dna.credits??[], geoVoicesCredits  ).map( c=> 
                    `<li>${ Object.keys(c).map( k=> `<span class="${k}">${c[k]}</span>`).join(" ") }</li>`).join(" ") }
                    </ul>`)
                .then(ready )
                .then( ()=>app.map.addEventListener( "click", ()=>perform.text( "abort" ), {once:true} )), 

    help: e=> perform.text( helptext)                
                .then(ready )
                .then( ()=>app.map.addEventListener( "click", ()=>perform.text( "abort" ), {once:true} )), 

    test: e=> perform.speak( "Testing your audio system. " + webaudio.report() )                
              .then( ()=> perform.audio( "guide/intro.mp3")), 



    select:  e=> app.newTour.select(),
//        e=> {
            // localStorage.removeItem("tour"); 
            // location.reload();
            // },
    usage: ()=>{
        app.tour.usage.add(  { zone:0, pin:0 });
        app.tour.usage.add(  { zone:0, pin:1 });
        app.tour.usage.add(  { zone:0, pin:2 });
        app.tour.usage.upload()}, 
    restart: ()=>app.tour.restart(),
    map:     ()=>content.hidden = nextpoint.hidden = !content.hidden, 
    restart: ()=>app.tour.restart(),
    reset:   app.reset,

    lost:    ()=>{ // go to google map page with latitude and longitude
                   if( app.tour.nextPin ) {
                    let lat  = app.tour.nextPin.dna?.lat;
                    let lng  = app.tour.nextPin.dna?.lng;
                    let id   = app.tour.nextPin.dna?.id  ?? `GeoVoices Tour`;
                    let parameters = `api=1&destination_place_id=${id}&destination=${lat},${lng}&travelmode=driving&dir_action=navigate`;
                    window.open( `https://www.google.com/maps/dir/?${parameters}`, "_blank" );
                    }
                },
    edit:    ()=>{
        app.editEnabled = !app.editEnabled, //toggle editting
        app.tour.render();
        },

    pause, drive, testdrive, feedback
    }        






const menus = {
    // fixed:       [ "Pause",`Map ${content.hidden?"Show":"Hide"}`,              "Help","Lost","Credits","Feedback","Reset"                   ],    
    // touring:     [ "Pause",`Map ${content.hidden?"Show":"Hide"}`,"Select Tour","Help","Lost","Credits","Feedback","Reset"                   ],    
    // developer:   [ "Pause",`Map ${content.hidden?"Show":"Hide"}`,"Select Tour","Help","Lost","Credits","Feedback","Reset","TestDrive","Edit"],    
    fixed:       [ "Pause","Map ***","Help","Lost","Credits","Feedback","Test","Reset"                   ],    
    touring:     [ "Pause","Map ***","Select Tour","Help","Lost","Credits","Feedback","Test","Reset"                   ],    
    developer:   [ "Pause","Map ***","Select Tour","Help","Lost","Credits","Feedback","Test","Reset","TestDrive","Edit"],    
    }






const open= e=>{
    e.stopPropagation(); // otherwise triggers line below!
    document.body.addEventListener("click", ready );
    document.querySelector("#feedback").hidden=true;
    perform.text( "abort" ).then( ()=>{
        let role = localStorage.getItem("role");////
        let menu = menus[role]?? menus[ requestedTour()? "fixed" : "touring"];
        menu[1]=`Map ${content.hidden?"Hide":"Show"}`;
       dom.innerHTML=
               `<div>${app.tour?.dna.id} v.${app.tour?.dna.version.toFixed(2)}</div>
                <div>geovoice v${app.version} </div> 
                <ul>${ menu.map( m=>`<li>${m}</li>` ).join("") }</ul>
                <span id="fixcounter"></span>`;   

            dom.querySelectorAll("li").forEach( k => 
                k.addEventListener( "click", 
                    action[ k.innerText.split(" ")[0].toLowerCase() ] ));
            });
        };
        


   
const ready= ()=>{
   app.map?.removeEventListener("click", ready );
   dom.innerHTML= burger;
   dom.firstElementChild.addEventListener("click", open );
};



const chooseTour = files=> new Promise( resolve=>{

    dom.innerHTML=         `
        <div id='menu'>
            <span class="label" >TOUR</span>
            <select   class="tourname" placeholder="select your tour">
                <option >Choose a Tour</option>
          ${files.map( f=> 
               `<option class="tourname"  >${f}</option>`   ).join()}
                <option class="tourname">RESUME</option>
            </select>
        </div>`;
        dom.querySelector("select").addEventListener("click", e=> e.stopPropagation());
        dom.querySelector("select").addEventListener("change", e=>{      
            resolve( e.target.value );
            ready();
            });    
    });

export  default { ready, chooseTour, pause, feedback, launchpad, splash, directions: action.lost };



// fos\\ <rect class="stack"  x="5" y =  "5"   width="45" height = "10" rx="3" ry= "3" stroke-width="0" stroke="none"  fill="black" />
// <rect  x="5" y =  "18"  width="45" height = "10" rx="3" ry= "3" stroke-width="0" stroke="none"  fill="black" />
// <rect  x="5" y =  "31"  width="45" height = "10" rx="3" ry= "3" stroke-width="0" stroke="none"  fill="black" />
// }   <rect  x="0" y =   "0"  width="55" height = "46" rx="9" ry= "9" stroke-width="7" stroke="black" fill="none"  />
