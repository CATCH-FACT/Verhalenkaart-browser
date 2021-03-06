//fires when the system is waiting for data (location data, since this loads the longest by far)
function WaitViewer(vm){
    this.init = function(){
        vm.waiting.subscribe( function (){
            if (vm.waiting()){
                d3.select("#waitWindow")
                    .style("background", "white")
                    .transition()
                    .duration(1000)
                    .style("opacity", 1)
                    .style("background", "green")
                    .transition()
                    .delay(1000)
                    .style("visibility", "visible");
            }
            else {
                d3.select("#waitWindow")
                    .transition()
                    .duration(1000)
                    .style("opacity", 0)
                    .transition()
                    .delay(1000)
                    .style("visibility", "hidden");
            }
        });
    }
}


function MapViewer(vm){
    
    d3.select("waitWindow").style("visibility", "hidden");
    
    // Create the Google Mapâ€¦
    var mapOptions ={
      zoom: 8,
      center: new google.maps.LatLng(52.27, 6.01948),
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true,
      styles: [
      {
        "featureType": "poi",
        "stylers": [
          { "color": "#C6D0C6" }
        ]
      },{
        "featureType": "poi"  },{
        "featureType": "poi",
        "elementType": "labels",
        "stylers": [
          { "visibility": "off" }
        ]
      },{
        "featureType": "landscape",
        "stylers": [
          { "color": "#F5FFFA" }
        ]
      },{
        "featureType": "landscape",
        "elementType": "labels",
        "stylers": [
          { "visibility": "off" }
        ]
      },{
        "featureType": "transit",
        "stylers": [
          { "visibility": "off" }
        ]
      },{
        "featureType": "administrative",
        "elementType": "geometry",
        "stylers": [
          { "visibility": "off" }
        ]
      },{
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [
          { "visibility": "off" }
        ]
      },{
        "featureType": "road.highway",
        "elementType": "geometry.fill",
        "stylers": [
          { "color": "#a1a1a0" },
          { "lightness": 5 }
        ]
      },{
        "featureType": "road.highway",
        "elementType": "labels",
        "stylers": [
          { "visibility": "off" }
        ]
      },{
        "featureType": "water",
        "stylers": [
          { "color": "#ADD8E6" }
        ]
      },{
        "featureType": "administrative.country",
        "elementType": "geometry.stroke",
        "stylers": [
          { "visibility": "on" },
          { "color": "#474747" },
          { "gamma": 1.67 }
        ]
      },{
        "featureType": "administrative.province",
        "elementType": "geometry.stroke",
        "stylers": [
          { "visibility": "on" },
          { "color": "#474747" },
          { "gamma": 1.67 }
        ]
        }
    ]};

    var map = new google.maps.Map(d3.select("#map").node(), mapOptions);
    var overlay = new google.maps.OverlayView();

    var locality_data = {};
    var val_max = 0;
    var marker;

    bijma = [{"naam": "A.A. Jaarsma", "latitude": 53.1737932, "longitude": 6.0567412},
            {"naam": "Hendrik Entjes", "latitude": 52.5845594, "longitude": 6.285519399999998},
            {"naam": "C. Bakker", "latitude": 52.4357808, "longitude": 4.991315699999973},
            {"naam": "Boekenoogen, Gerrit Jacob", "latitude": 52.158494, "longitude": 4.496198999999933}];

    provincies = ["Drenthe", "Flevoland", "Friesland", "Fryslân", "Gelderland", "Groningen", "Limburg", "Noord-Brabant", "Noord-Holland", "Overijssel", "UUtrecht", "Zeeland", "Zuid-Holland"];

    object_colors = {   "country":      "yellow",
                        "locality":     "red",
                        "administrative_area_level_1": "purple",
                        "rest":         "black",
                        "collector":    "blue",
                        "creator":      "lightgreen"};

//    colors = ["#E56717", "#E66C2C", "#F87217", "#F87431", "#E67451", "#FF8040", "#F88017", "#FF7F50", "#F88158", "#F9966B", "#E78A61", "#E18B6B", "#E77471", "#F75D59", "#E55451", "#E55B3C", "#FF0000", "#FF2400", "#F62217", "#F70D1A", "#F62817", "#E42217", "#E41B17", "#DC381F", "#C34A2C", "#C24641", "#C04000", "#C11B17", "#9F000F", "#990012", "#8C001A", "#954535", "#7E3517", "#8A4117", "#7E3817", "#800517"];

    function n_decimals(nr, n){
        if (nr){
//            return Math.floor(nr*100)/100;
            return nr.toFixed(n);
        }
        return nr;
    }
    
    this.update_data_location = function(location){
        console.log("updating data from: " + location);
        d3.json(location, function(json_data){
            //process data to fit d3
            locality_data = d3.nest()
                .key(function(d) { return [n_decimals(d.latitude, 3), n_decimals(d.longitude, 3)]; })
    //            .key(function(d) { return d.locality; })
                .entries(json_data.response.docs);
        });
    }
    
    // Add the container when the overlay is added to the map.
    this.init = function(){
        overlay.onAdd = function() {
//            console.log("Adding overlay");
            var object_layer = d3.select(this.getPanes().overlayLayer)
                .append("div")
                .attr("class", "objects")
                .append("svg")
                .attr("class","objects")
            
            var locatie_layer = object_layer
                .append("g")
                .attr("class","locaties");

            var creator_layer = object_layer
                .append("g")
                .attr("class","creators");

            var collector_layer = object_layer
                .append("g")
                .attr("class","collectors");

                
            // drop this into global scope
            chor=locatie_layer;

            var projection = this.getProjection(), padding = 10;

            function transform2(d) {
                var lat_lon = d.key.split(",");
                if (lat_lon[0] == ""){ lat_lon = [52.655694, 3.913930]}
                d = new google.maps.LatLng(lat_lon[0], lat_lon[1]);
                d = projection.fromLatLngToDivPixel(d); 
                return d3.select(this)
                    .attr("cx", (d.x + 4000) + "px")
                    .attr("cy", (d.y + 4000) + "px");
            }
            
            function transformRect(d, size) {
                size = 10;
                var lat_lon = d.key.split(",");
                if (lat_lon[0] == ""){ lat_lon = [52.655694, 3.913930]}
                d = new google.maps.LatLng(lat_lon[0], lat_lon[1]);
//                d = new google.maps.LatLng(d.value.latitude, d.value.longitude);
                d = projection.fromLatLngToDivPixel(d); 
                return d3.select(this)
                    .attr("x", ((d.x - (size/2)) + 4000) + "px")
                    .attr("y", ((d.y - (size/2)) + 4000) + "px");
            }

            function transformPath(d) {
                var lat_lon = d.key.split(",");
                d = new google.maps.LatLng(lat_lon[0], lat_lon[1]);
                d = projection.fromLatLngToDivPixel(d); 
                return d3.select(this)
                    .attr("transform", "translate(" + (d.x + 4000) + "," + (d.y + 4000) + ")");
            }

            var info_click_tip = d3.select("body")
                .append("div")
                .attr("class", "click_tip")
                .style("position", "absolute")
                .style("background", "white")
                .style("z-index", "10")
                .style("visibility", "hidden")
                .text("ITEMS CLICKABLE INFO");
                            
            var tooltip = d3.select("body")
                .append("div")
                .style("position", "absolute")
                .style("background", "white")
                .style("z-index", "10")
                .style("visibility", "hidden")
                .text("");
            
            function updateCollectors(collectors_data){
//                console.log("collectors_data: " + collectors_data.length);

                var symbol = d3.svg.symbol().type('diamond');

                var collector_marker = collector_layer.selectAll("path")
                    .data(collectors_data)
                    .each(transformPath);
                    
                collector_marker.enter()
                    .append("path")
                    .attr('d', symbol.size(2000))
                    .attr("stroke","black")
                    .attr("stroke-width", "1.5px")
                    .attr("fill", object_colors["collector"])
                    .on("mouseover", function(d){
                        map.setOptions({draggableCursor:'crosshair'});
                        d3.select(this)
                            .transition()
                            .ease("elastic")
                            .attr("d", symbol.size(function(d){
                                return 50 + (d.values.length * 5) + (map.getZoom() * 50);
                            }))
                            .style("opacity", 1);
                    })
                    .on("mouseout", function(d){
                        map.setOptions({draggableCursor:'default'});
                        d3.select(this)
                            .transition()
                            .ease("elastic")
                            .attr("d", symbol.size(function(d){
                                    return 20 + (d.values.length * 10) + (map.getZoom() * 50);
                            }))
                            .style("opacity", vm.opacity_collectors()); //get the opacity value from the slider again
                        tooltip.style("visibility", "hidden");
                    })
                    .on("click", function(d){
                        // search all tales from these collectors
                        console.log(d);
                    })
                    .on("mousemove", function(){
                    });

                //Update…
                collector_marker.transition()
                    .delay(function(d, i){
                        return i + Math.sqrt(d.values.length) * 20;
                    })
                    .duration(1500)
                    .attr("d", symbol.size(function(d){
                        return 20 + (d.values.length * 10) + (map.getZoom() * 50);
                    }))
                    .attr("fill", function(d){
//                        if (vm.bubbles_color_intensity()){
//                            return d3.rgb(255, 255 - (Math.log(d.values.length) * 150), 155 - (Math.log(d.values.length) * 150));
//                            return d3.rgb((Math.log(d.values.length) * 100), 255 - (Math.log(d.values.length) * 70), 255);
//                        }
                        return object_colors["collector"];
                    })
                    .style("opacity", function(){
                        return vm.opacity_collectors();
                    })
                    .style("visibility", function() {
                        return vm.show_collectors() ? "visible" : "hidden";
                    });
                    
                //exit
                collector_marker.exit()
                    .transition()
                    .duration(1000)
                    .attr("d", 0)
                    .attr("opacity", 0)
                    .remove();
            }
            
            function updateCreators(creators_data){
                
//                console.log("creators_data: " + creators_data.length);
                
                var symbol = d3.svg.symbol().type('triangle-down');
                
                var creator_marker = creator_layer.selectAll("path")
                    .data(creators_data)
                    .each(transformPath);

                creator_marker.enter()
                    .append("path")
                    .attr('d', symbol.size(10))
                    .attr("stroke","black")
                    .attr("stroke-width", "1.5px")
                    .attr("fill", object_colors["creator"])
                    .on("mouseover", function(d){
                        map.setOptions({draggableCursor:'crosshair'});
                        d3.select(this)
                            .transition()
                            .ease("elastic")
                            .attr("d", symbol.size(function(d){
                                return (d.values.length * 5) + (map.getZoom() * 50);
                            }))
                            .style("opacity", 1);
                    })
                    .on("mouseout", function(d){
                        map.setOptions({draggableCursor:'default'});
                        d3.select(this)
                            .transition()
                            .ease("elastic")
                            .attr("d", symbol.size(function(d){
                                    return (d.values.length * 5) + (map.getZoom() * 5);
                            }))
                            .style("opacity", vm.opacity_creators()); //get the opacity value from the slider again
                        tooltip.style("visibility", "hidden");
                    })
                    .on("click", function(d){
                        // search tales from these creators
                        console.log(d);
                    })
                    .on("mousemove", function(){
                    });
                
                //Update…
                creator_marker.transition()
                    .delay(function(d, i){
                        return i + Math.sqrt(d.values.length) * 20;
                    })
                    .duration(1500)
                    .attr("d", symbol.size(function(d){
                        return (d.values.length * 50) + (map.getZoom() * 5);
                    }))
                    .attr("fill", function(d){
                        if (vm.bubbles_color_intensity()){
                            return d3.rgb(255, 255 - (Math.log(d.values.length) * 150), 155 - (Math.log(d.values.length) * 150));
//                            return d3.rgb((Math.log(d.values.length) * 100), 255 - (Math.log(d.values.length) * 70), 255);
                        }
                        return object_colors["creator"];
                    })
                    .style("opacity", function(){
                        return vm.opacity_creators();
                    })
                    .style("visibility", function() {
                        return vm.show_creators() ? "visible" : "hidden";
                    });
                    
                //exit
                creator_marker.exit()
                    .transition()
                    .duration(1000)
                    .attr("d", 0)
                    .attr("opacity", 0)
                    .remove();
            }
            
            function updateLocations(locality_data){
//                console.log("locality_data: " + locality_data.length);
                
                //init locations
                var locality_marker = locatie_layer.selectAll("circle")
                    .data(locality_data)
                    .each(transform2);

                //location enter
                locality_marker.enter()
                    .append("circle")
                    .each(transform2)
                    .attr("class", "location")
                    .attr("r", 0)
                    .attr("fill", object_colors["locality"])
//                    .style("opacity", vm.opacity_locations())
                    .attr("stroke","black")
                    .attr("stroke-width","1px")
                    .on("mouseover", function(d){
//                        console.log(d);
                        map.setOptions({draggableCursor:'crosshair'});
                        d3.select(this)
                            .transition()
                            .ease("elastic")
                            .attr("r", function(d){
                                return Math.sqrt(d.values.length) + 25;
                            })
                            .style("opacity", 1);
                        tooltip.style("visibility", "visible")
                            .text(d.values[0].administrative_area_level_1 + " - " + d.values[0].locality + ": " + d.values.length);
                    })
                    .on("mouseout", function(d){
                        map.setOptions({draggableCursor:'default'});
                        d3.select(this)
                            .transition()
                            .attr("r", function(d){
                                if (vm.bubbles_same_size()){
                                    return map.getZoom() + 1;
                                }
                                return (Math.sqrt(d.values.length) * bubble_sizes_multiplier) + map.getZoom(); //sqrt so circles don't get too large
                            })
                            .style("opacity", vm.opacity_locations()); //get the opacity value from the slider again
                        tooltip.style("visibility", "hidden");
                    })
                    .on("mousemove", function(){
                        tooltip.style("top", (event.pageY-10)+"px")
                                    .style("left",(event.pageX+10)+"px");
                    })
                    .on("click", function(d){
                        info_click_tip.style("visibility", "visible")
                            .style("top", (event.pageY-25)+"px")
                            .style("left",(event.pageX+10)+"px")
                            .html(function(){
                                var return_this = "Volksverhalen:<br>";
                                d.values.forEach(function(item){
                                    return_this += "<a target=\"vb\" href=\"http://www.verhalenbank.nl/items/show/" + item.id + "\">" + item.identifier + "</a><br>";
                                })
                                return return_this;
                            })
                    })
                    .transition()
                    .duration(200)
                    .delay(function(d, i){
                        return 2000 - Math.sqrt(d.values.length) * 40; //largest first!
//                        return (i) + Math.sqrt(d.values.length) * 40;
                    })
                    .attr("r", function(d){
                        return 100
                        return Math.sqrt(d.values.length/2) + map.getZoom(); //sqrt so circles don't get too large
                    });

                //Update…
                locality_marker.transition()
                    .delay(function(d, i){
                        return i + Math.sqrt(d.values.length) * 20;
                    })
                    .duration(500)
                    .attr("r", function(d){
                        if (vm.bubbles_same_size()){
                            return map.getZoom() + 1;
                        }
                        return (Math.sqrt(d.values.length) * bubble_sizes_multiplier) + map.getZoom(); //sqrt so circles don't get too large
                    })
                    .style("opacity", vm.opacity_locations())
                    .style("visibility", function() {
                                    return vm.show_locations() ? "visible" : "hidden";
                    })
                    .attr("fill", function(d){
                        if (vm.bubbles_color_intensity()){
//                                return d3.rgb((Math.log(d.values.length) * 35), 0, 0);
                                return d3.rgb(255, 255 - (Math.log(d.values.length) * 35), 155 - (Math.log(d.values.length) * 35));
//                                return d3.rgb((Math.log(d.values.length) * 35), 155 - (Math.log(d.values.length) * 35), 155 - (Math.log(d.values.length) * 35));
                        }
                        return object_colors["locality"];
                    });
                    
                //exit
                locality_marker.exit()
                    .transition()
                    .duration(1000)
                    .attr("r", 0)
                    .attr("opacity", 0)
                    .remove();
            }
            //settings subscriptions
            vm.location_results.subscribe( function (){
                console.log("redrawing map: location update");
                updateLocations(vm.location_results());
                updateCreators(vm.creator_results());
                updateCollectors(vm.collector_results());
            });
            vm.bubbles_same_size.subscribe( function (){
                updateLocations(vm.location_results());
//                updateCreators(vm.creator_results());
            });
            vm.bubbles_color_intensity.subscribe( function (){
                updateLocations(vm.location_results());
                updateCreators(vm.creator_results());
                updateCollectors(vm.collector_results());
            });
            //opacity subscriptions
            vm.opacity_locations.subscribe( function (){
                updateLocations(vm.location_results());
            });
            vm.opacity_creators.subscribe( function (){
                updateCreators(vm.creator_results());
            });
            vm.opacity_collectors.subscribe( function (){
                updateCollectors(vm.collector_results());
            });
            //show subscriptions
            vm.show_locations.subscribe( function (){
                updateLocations(vm.location_results());                        
            });
            vm.show_creators.subscribe( function (){
                updateCreators(vm.creator_results());
            });
            vm.show_collectors.subscribe( function (){
                updateCollectors(vm.collector_results());
            });
            // Draw each marker as a separate SVG element.
            // We could use a single SVG, but what size would it have?
            // here we keep track of all changes in the viewmodel
            overlay.draw = function() {
                updateLocations(vm.location_results());
                updateCreators(vm.creator_results());
                updateCollectors(vm.collector_results());

                //events for zooming
                google.maps.event.addListener(map, 'center_changed', function() {
                    info_click_tip.style("visibility", "hidden");
                });
                google.maps.event.addListener(map, 'click', function() {
//                    info_click_tip.style("visibility", "hidden");
                });
            }
        }
    };
    // Bind our overlay to the map¦
    overlay.setMap(map);    
}