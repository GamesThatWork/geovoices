      
      
export default  { 
  
    version: 4.00, 
    userID: null,
    map:    null,
    tour:   null,
     
    zoomRange: {
      min: 12,
      max: 16
      },


    reset: (scope="all")=>
      fetch("cache://clear")
        .then(  res => console.log( 'Cleared cache: ', res )             )
        .then(  ()  => localStorage.removeItem("tour")                )
        .then(  () =>  console.log( "Localstorage.tour cleared", localStorage.getItem("tour") ) )
        .then(  ()  => navigator?.serviceWorker?.getRegistration(`/`) )
        .then(  reg => reg?.unregister?.()                            )
        .then(  () =>  console.log( "Service worker de-registered", navigator?.serviceWorker?.getRegistration(`/`) ) )  
        .then(  ()  => new Promise( resolve => setTimeout(resolve, 3000) ) )//wait 3 seconds
        .then(  ()  => location.reload()                              )
        .catch( console.warn )
    }
    

