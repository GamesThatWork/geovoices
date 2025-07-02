      
      
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
      fetch("cacheclear")
        .then(  res => console.log( 'ClearCache: ', res )             )
        .then(  ()  => localStorage.removeItem("tour")                )
        .then(  ()  => navigator?.serviceWorker?.getRegistration(`/`) )
        .then(  reg => reg?.unregister?.()                            )
        .then(  ()  => location.reload()                              )
        .catch( console.warn )
    }
    

