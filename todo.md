april 2025



CONTENT
-------
MUSEUM OF THE CHEROKEE INDIAN
- new name now


MAP
---
WEBB OVERLOOK
- collision near exit

STICKBALL/MOUSE STORY
- slightly late

EMTERING KITUWAH
- Guide says 'Turn Left on Ela Rd' (exit msg)

STAY OFF MOUND WARNING 
- include mention of "LOUD(?)"

GOOD WORK, JUDY
- remove

SOCCO FALLS
- collision between guide and music
-NAV  +CLOSED+ temporarily


GREAT SMOKEY MOUNTAINS
-NAV repeat entrance (Cherokee)


RAVENPORT
- guide way too late


AUDIO
---
JARETT INTRO
- normalize volume
- clean up  
- shorten

NOLA
- all too low

CORN WOMAN
- two audio edits needed near the end


GUI
---
FEEDBACK PAGE
- Sensitize Stars

APP
---
MODERNIZE INSTALLATION
- pwa.js

WAKELOCK
-if not already


VISIBLITY CHANGE
- review and clean up 


BACKEND
-------
PORT TO NOSQL
- Session Tracking


json tour files=> NoSQL
json weave  files=> NoSQL
sql feedback records => NoSQL

(unimplemented) feedback => NoSQL

(unimplemented) user history => NoSQL

fix
qos
pin


DEVOPS
------
DEV READY
- js/geovox/


REHOST ON --- FIREBASE?
- Docker? Kubernetes?




























\\\\\\\\\\\\

weekend run

executes END before it realizes it is in START mode






thursday run

*** captions get out of #content
*** captions linger longer
*** captions background brighter
--- text "enter pin 1" appears on lakeshore rd in XZero tour




wednesday no run


tuesday run

*** add caption hangtime
allow user to force start
popmetadata/reshow fx (birdtown) worked (only) at the base of ridge rd (in Xzero)
respect interruption on restart (broken?)
start location during udway ???

??? abort caption iƒ active textlayer
*** caption selfclose hides fx
*** only allow map.show to set content.hidden true
*** map.hide did not seem to work
*** wrong initial weave pattern
*** weave clears previous pattern
*** empty caption box is visible 




monday run

??? < and > buttons
*** textlayer obscures imagelayer

??? metadata failure
*** open.gv... splash screen needs instro
*** captionwords must be gianter
*** hide/show map button
??? auto-zoom to 17 every 60 seconds
*** (imagelayer pushes) burger offscreen (screenshot)
*** pause screen not full height
*** PIB left here too close and wrong directon
???? do not clear old weave when starting weave
*** rename duplicated pins more properly
??? pre-start performs twice
???   feedback form appears but not at the right tijme
***   animate stars 
***   optional fields should be duller not brighter



///*** save (upload) tour
*** test drive
*** hide tags by default
*** tag toggle
*** refresh after pin delete
*** zone next does not end well
*** zone delete
*** empty string = delet dnspeak
*** does not save as tour
*** loses zone.edit during testdrive
**  drag pin
*** remove all the #editor/dom crap
*** move zone.perform cleanups to zone.condition
*** switch to v05 on server
*** switch to new sounds on aws
*** close popup while selecting NEXT
*** wakelock
*** auto resume
*** default cycle
*** resist broswer location change
***resume policy
*** next->start special case
*** next->end   special case
*** mile countdown
??? zone exit/enter not set in constructor
??? trigger miss (nka/tdo)


BUGS
??? add new Zone makes error
??? adding sound => latlng error at 297
??? intermittent handler loss 
*** no weave performance kills existing weave





crashes in tour.clean if no nextpin on a zone


display pin:start, zone:0
mediasession control & display
activity while not visible


copy pin
show image
fix all references (zone.next) when pin id is changed
click on pin label




mediasession metadata

add intro music to autocache

Tour
Pin
Zone    status    color       alias 

T P Z   wait      grey 
T P Z   ready     violet      drive
T       sim       blue        testdrive
    Z   within    lavender
  P Z   next      ultraviolet

  P Z   hover     white

T P Z   edit      blue        edit mode
  P     locus     green       drag pin
    Z   radius    yellow      edit radius
    Z   focus     orange      edit sweep/slice
    Z   nexus     gold        edit next pin

T P Z   error     red 



see css: .fail  .read


d




tour
    self.render( {status:"open"} );
    self.render( {status:"close"} );
    self.render( {status:"hide"} );             
    
    all completely meaningless

    clean() - prep dna for  upload 
    tour.restart() - attempted clear tour / pin / zone status (only)

remove open/close/hide 
combine clean & restart
add tour status drive /pause /testdrive /edit /null ??



pin 
    self.render( {status:"open"} );
        ready to start

    self.render( {status:"start"} );
        draggable


    self.render( { status:"update" } );
        dragging

    self.render( {status:"close"} );
        neutral

    self.render( { status:"hide" } );
        invisible - never used

    status only used to color the pins     


ready / next / inert (modality) / drag / edit (based on zone activity) 
open/inert status is meaningful when driving



zone
    self.render( {status:"open"} );
    self.render( {status:"closed" } );  ////<<====sic
    self.render( {status:"spent"});
    let status = (dna.status ?? "close" )
    dna.status ="close_exit" : "close_enter" 
    update = { status:"update_radius",  radius: Math.max( rZero, ll2dm( self, e.latlng  )) } ;
    update = { status:"update_sweep",  slice, sweep };
    update  = { status:"update_next",   next:/*COMPLICATED*/ true }

using hidden & ready now





// preform these sound edits



Stories

ball game
    0:41 
and the old [awkward cut?] bear chose ... and  um

     0:54
and um i'm ready to play

     2:04
but he fell to the ground but he - then had - they threw him up again and again
but he fell to the ground    they threw him up again and again

    2:07
stay... in airborne
stay airborne

   2:24
across the um goal line of the birds


chunkey
    1:58 
and that she tugged so hard
She tugged so hard

     2:05 
as the [little hesitation] other mothers
 
    2:26
that is how we get our Pleiades and Pines
this punch line is absolutely unintelligible -- one of her other three takes must be better than this

evergreen
no problems

first fire
 0:23
and they were still coals
and they were still col[d]


follow directions
    1:38
illuminate the room the cave
illuminate the cave

     4:08
sounds like a faulty cut  -- can you undo?
otherwise
so he looks*p the mountain. This thing is huge
so he looks. This thing is huge

   5:45
afar from his village
far from his village

he gathered the leaves of it, he gathered  the root, the bark... (graft in from elsewhere0
or. if necessary   he gathered the leaves of it, the root, the bark

   8:12
He didn't know how to react. He looked at em on. He just said I'm happy to help.
He didn't know how to react.  He just said I'm happy to help.

Kanati

2:58
another bad edit??
..down the hill. And they met him down to clean that medicine That they  that he didn't know
..down the hill. He didn't know  or maybe you can do better?

      
Selu 
   0:39 
(hesitation)

 1:48  
scared the old Corn Woman  - Evil Spirit
scared the Evil Spirit     

  2:10
only.....only
only  

  2:32
with .. faith and everything can turn back around
with... faith, everything can turn back around

Spearfinger
okay


GUIDE

3200 acre tract
0:00
remove title slug

birdtown
ok

blue ridge
is it possible to change the begining  from 
we are now reaching the blue ridge parkway and coming to the start
to
we are now on the blue ridge parkway and coming to the start

follow directions
okay

first fire
okay

kanati
okay (script errors not fixable) 

kiuwah
okay

leaving kituwah
0:23
is reknown [mispronounced] for his help
is known for his help

0:44  
script 
Sequoya also stayed in this area While some believe he was a chief it is now known that he was not. However Sequiyah is credited with 
Sequoya also stayed in this area. Sequiyah is credited with 

museum
0:09
people like you are coming to visit us and hopes to learn who we as Cherokee really are
people like you are coming to visit us to learn who we as cherokee really are
or
people like you are coming to visit us to learn who we really are
awkward cut (as Cherokee) please fix or omit those words

new kituwah academy
okay

selu and kanati
okay but more script errors

soco falls
okay

soco gap
0:08
think back to the story of the birds and the animals
remove completely . (script error)

spanish exploration
okay

tecumseh 
okay

thomas--overlook
0:56
In 1853 a small group 
A small group (script error, date very wrong (actually 1835)

tourism
okay

welcome
okay


== 2024 ==============================================

code cleaner 
    change "self"  in tour/pin/zone to "gui" or "dom" (see geotour.js)

bac