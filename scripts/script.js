// Creating map options via JavaScript - this sets the default lat/lon and zoom
var mapOptions = {
  center: [48.75120012506536, -122.47226044458226],
  zoom: 11
};
           
// Creating a map object - we will talk about this in JavaScript session
var map = new L.map('map', mapOptions);


////////////////////////////////////////
/////          BASEMAPS         ////////
////////////////////////////////////////

// OSM 
var layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'});
// Stamen 
var Stamen_Watercolor = L.tileLayer.provider('Stamen.Watercolor');
var Stamen_Toner = L.tileLayer.provider('Stamen.Toner');
var Esri_WorldGrey = L.tileLayer.provider('Esri.WorldGrayCanvas');  

// ADD BASEMAPS
// map.addLayer(Esri_WorldGrey);
map.addLayer(Stamen_Toner);
// L.esri.basemapLayer('Topographic').addTo(map);



////////////////////
// REST ENDPOINTS //
////////////////////

var censusKey = '119eaf7602ceb06df7795ec0e12f9b01a1d84e64' //census api key (ericrannestad@gmail.com)
arrayCensus = []; //create a new array to store the formatted census data

function getCensusData(){

      // VARIABLES FOR 5 YR ACS DATA: https://api.census.gov/data/2019/acs/acs5/variables.html

      // REST ENDPOINT -- all tracts in WA -- //
      // Name: -
      // Total Pop: DP05_0001E
      // Med Age: DP05_0018E
      var url = 'https://api.census.gov/data/2019/acs/acs5/profile?get=NAME,DP02_0001E,DP05_0018E&for=tract:*&in=state:53' 

      // REST ENDPOINT -- all tracts in WA -- Name, Total households  -- //
      // var url = 'https://api.census.gov/data/2019/acs/acs5/profile?get=NAME,DP02_0001E&for=tract:*&in=state:53' 

      // REST ENDPOINT -- all counties in WA -- NAME, unknown variable -- //
      // var url = 'https://api.census.gov/data/2019/acs/acs5?get=NAME,B01001_001E&for=county:*&in=state:53' 
      
      $.getJSON(url + '&key=' + censusKey, // JQuery AJAX function getting data from the Census API
      function(data){ // and call a return function processing the Census JSON object in ‘data’ variable
            var keys = data[0]; //extract the first row of the returned 2d array that are the column headers
            var values = data; //copy the array
            values.splice(0,1); //delete the first row of headers in the copied array
            // arrayCensus = []; //create a new array to store the formatted object outputs
            //nested loops combining the column header with appropriate values as {key:value} pair objects
            for(var i = 0 ; i < values.length; i++){
                var obj = {};
                for(var j = 0 ; j < values[i].length; j++){
                    obj[keys[j]] = values[i][j];
                }
                arrayCensus.push(obj);
            }
            console.log('JSON_loaded...')
            $(document).trigger('JSON_loaded');
      });
  // console.log(arrayCensus);
};

getCensusData();


/////////////////////
//  MATCH GEOID'S  //
/////////////////////

function createGEOID() {  // constructs a geoid from tract geographic properties
  console.log('creating GEOID\'s...')
  for (var i = 0; i < arrayCensus.length; i++) {
    // geo id structure: (STATE) xx + (County) xxx + (Tract) xxxxxx
    arrayCensus[i].GEOID = arrayCensus[i].state + arrayCensus[i].county + arrayCensus[i].tract;
  };
  // console.log(arrayCensus);
  $(document).trigger('GEOID_created');

} 

$(document).bind('JSON_loaded', createGEOID); // calls createGEOID() only after getCensusData() is complete.





//////////////////////////////////////
///       FEATURE LAYERS         ///// 
//////////////////////////////////////

L.esri.featureLayer({
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Earthquakes_Since1970/MapServer/0'
      // url: 'https://services1.arcgis.com/r8cox3o5ztkWWPgI/arcgis/rest/services/PROF_point_data/FeatureServer'
  }).addTo(map);

// Icons
var myIcon = L.icon({
  iconUrl: 'icons/sq_holding_nut_200px.png',
  iconSize: [32, 37],
  iconAnchor: [16, 37],
  popupAnchor: [0, -28]
});

//Test WA Airports geojson file
fetch('https://opendata.arcgis.com/datasets/ddb7c46710a44a5884a3f95dc8672fef_0.geojson') //needs a "fetch" and "promises" polyfill for older browsers
  .then(function (response){
    return response.json();
  })
  .then(function (data) {
    L.geoJSON(data, {

      style: function (feature) {
        // return {color: 'green'}
        return L.marker({
  iconUrl: 'icons/sq_holding_nut_200px.png',
  iconSize: [32, 37],
  iconAnchor: [16, 37],
  popupAnchor: [0, -28]
});

      }
    }).addTo(map);
  });







var tractsEric = L.geoJSON(tracts,{
  onEachFeature: function (feature, layer) {
    
    function match() {
      // console.log(feature.properties.GEOID);
      // console.log(arrayCensus[0].GEOID);
      var result = arrayCensus.filter(arrayCensusFeature => {
        // console.log(arrayCensusFeature.GEOID);
      return arrayCensusFeature.GEOID == feature.properties.GEOID;
      });
      // console.log(result);
      
      layer.bindPopup('<h3>'+ result[0].NAME +'</h3><p>Median Age: '+ result[0].DP05_0018E +'</p>');
    }
    $(document).bind('GEOID_created', match);


  },
  fillOpacity: 1.0,
  fillColor: 'red',
  weight: 1,
  color: 'orange',
}).addTo(map);
// L.geoJSON(tractsTrimmed).addTo(map);





//////////////////////////////////////
///       CSV DATA LAYER         //// 
//////////////////////////////////////


Read markers data from data.csv
  $.get('data-sets/squirrel/data.csv', function(csvString) {

    // Use PapaParse to convert string to array of objects
    var data = Papa.parse(csvString, {header: true, dynamicTyping: true}).data;

    console.log(data);

    // For each row in data, create a marker and add it to the map
    // For each row, columns `Latitude`, `Longitude`, and `Title` are required
    for (var i in data) {
      var row = data[i];
      var imagePopup = row.filepath

      var popupContent = "<p>"+"This squirrel right here was: "+row.Age+" and "+row.Title+"<p> <img src='"+imagePopup+"' width='300px'> </p>"+"</p>" ;

      var marker = L.marker([row.Latitude, row.Longitude], {
          opacity: 1, 
          // Custom icon
          icon: L.icon({
          iconUrl:  'icons/sq_holding_nut_200px.png',
          iconSize: [40, 60] })
      }).bindPopup(popupContent);
      
      marker.addTo(map);
    };
}); 


