// information about server communication. This sample webservice is provided by Wikitude and returns random dummy places near given location
var ServerInformation = {
	POIDATA_SERVER: "http://example.wikitude.com/GetSamplePois/",
	POIDATA_SERVER_ARG_LAT: "lat",
	POIDATA_SERVER_ARG_LON: "lon",
	POIDATA_SERVER_ARG_NR_POIS: "nrPois"
};

// implementation of AR-Experience (aka "World")
var World = {

	//  user's latest known location, accessible via userLocation.latitude, userLocation.longitude, userLocation.altitude
	userLocation: null,

	// you may request new data from server periodically, however: in this sample data is only requested once
	isRequestingData: false,

	// true once data was fetched
	initiallyLoadedData: false,

	// true when world initialization is done
	initialized: false,

	// different POI-Marker assets
	markerDrawable_idle: null,
	markerDrawable_selected: null,
	markerDrawable_directionIndicator: null,

	// list of AR.GeoObjects that are currently shown in the scene / World
	markerList: [],

	// The last selected marker
	currentMarker: null,

	locationUpdateCounter: 0,
	updatePlacemarkDistancesEveryXLocationUpdates: 10,

	// called to inject new POI data
	loadPoisFromJsonData: function loadPoisFromJsonDataFn(poiData) {

		// destroys all existing AR-Objects (markers & radar)
		AR.context.destroyAll();

		// show radar & set click-listener
		PoiRadar.show();
		$('#radarContainer').unbind('click');
		//$("#radarContainer").click(PoiRadar.clickedRadar);

		// empty list of visible markers
		World.markerList = [];

		// start loading marker assets
		World.markerDrawable_idle = new AR.ImageResource("assets/marker_idle.png");
		World.markerDrawable_selected = new AR.ImageResource("assets/marker_selected.png");
		World.markerDrawable_directionIndicator = new AR.ImageResource("assets/indi.png");

		var descriptionPOI = [
            "Testing",
            "Creativity Gym",
            "Tom was here",
            "Bouse",
            "Contact me",
            "Nice weather",
            "Battery low",
            "@TomDeMoor",
            "tommoore.be",
            "Tom De Moor",
            "Looking good",
            "Thomas More ftw",
            "rate this 10/10",
            "A message",
            "Good food here",
            "Android works",
            "Airnote ftw",
            "McFlurry mm",
            "It's sunny",
            "#WeAreIMD"
        ];

        /*var myLon = [
            "4.4849561",
            "4.4852511",
            "4.4866995",
            "4.4883947",
            "4.4854013",
            "4.4860236",
            "4.4890062",
            "4.4880621",
            "4.4880621",
            "4.4880621",
            "4.4880621",
            "4.4880621",
            "4.4880621",
            "4.4880621",
            "4.4880621",
            "4.4880621",
            "4.4880621",
            "4.4880621",
            "4.4880621",
            "4.4880621"
        ];

        var myLat = [
            "51.0251250",
            "51.0248719",
            "51.0249057",
            "51.0234143",
            "51.0235830",
            "51.0252566",
            "51.0249461",
            "51.0249866",
            "51.0249866",
            "51.0249866",
            "51.0249866",
            "51.0249866",
            "51.0249866",
            "51.0249866",
            "51.0249866",
            "51.0249866",
            "51.0249866",
            "51.0249866",
            "51.0249866",
            "51.0249866"
        ];*/

		// loop through POI-information and create an AR.GeoObject (=Marker) per POI
		for (var currentPlaceNr = 0; currentPlaceNr < poiData.length; currentPlaceNr++) {
			var singlePoi = {
				"id": poiData[currentPlaceNr].id,
				"latitude": parseFloat(poiData[currentPlaceNr].latitude),
				"longitude": parseFloat(poiData[currentPlaceNr].longitude),
				//"latitude": parseFloat(myLat[currentPlaceNr]),
				//"longitude": parseFloat(myLon[currentPlaceNr]),
				"altitude": parseFloat(poiData[currentPlaceNr].altitude),
				//"title": poiData[currentPlaceNr].name,
				"title": "",
				"description": descriptionPOI[currentPlaceNr]
			};

			var myPOI = {
				"id": poiData[currentPlaceNr].id,
				"latitude": parseFloat(51.0250170),
				"longitude": parseFloat(4.4849990),
				"altitude": parseFloat(10.52),
				"title": "",
				"description": "WeAreImd"
			};

			if(currentPlaceNr === 7){
				World.markerList.push(new Marker(myPOI));
			}else{
				World.markerList.push(new Marker(singlePoi));
			}
			
		}


		// updates distance information of all placemarks
		World.updateDistanceToUserValues();

		World.updateStatusMessage(currentPlaceNr + ' Airnotes loaded');

		// set distance slider to 100%
		$("#panel-distance-range").val(100);
		$("#panel-distance-range").slider("refresh");

		World.initialized = true;
	},

	// sets/updates distances of all makers so they are available way faster than calling (time-consuming) distanceToUser() method all the time
	updateDistanceToUserValues: function updateDistanceToUserValuesFn() {
		for (var i = 0; i < World.markerList.length; i++) {
			World.markerList[i].distanceToUser = World.markerList[i].markerObject.locations[0].distanceToUser();
		}
	},

	// updates status message shon in small "i"-button aligned bottom center
	updateStatusMessage: function updateStatusMessageFn(message, isWarning) {

		var themeToUse = isWarning ? "e" : "c";
		var iconToUse = isWarning ? "alert" : "info";

		$("#status-message").html(message);
		$("#popupInfoButton").buttonMarkup({
			theme: themeToUse
		});
		$("#popupInfoButton").buttonMarkup({
			icon: iconToUse
		});
	},

	/*
		It may make sense to display POI details in your native style. 
		In this sample a very simple native screen opens when user presses the 'More' button in HTML. 
		This demoes the interaction between JavaScript and native code.
	*/
	// user clicked "More" button in POI-detail panel -> fire event to open native screen
	onPoiDetailMoreButtonClicked: function onPoiDetailMoreButtonClickedFn() {
		var currentMarker = World.currentMarker;
		var architectSdkUrl = "architectsdk://markerselected?id=" + encodeURIComponent(currentMarker.poiData.id) + "&title=" + encodeURIComponent(currentMarker.poiData.title) + "&description=" + encodeURIComponent(currentMarker.poiData.description);
		/*
			The urlListener of the native project intercepts this call and parses the arguments. 
			This is the only way to pass information from JavaSCript to your native code. 
			Ensure to properly encode and decode arguments.
			Note: you must use 'document.location = "architectsdk://...' to pass information from JavaScript to native. 
			! This will cause an HTTP error if you didn't register a urlListener in native architectView !
		*/
		document.location = architectSdkUrl;
	},

	// location updates, fired every time you call architectView.setLocation() in native environment
	locationChanged: function locationChangedFn(lat, lon, alt, acc) {

		// store user's current location in World.userLocation, so you always know where user is
		World.userLocation = {
			'latitude': lat,
			'longitude': lon,
			'altitude': alt,
			'accuracy': acc
		};


		// request data if not already present
		if (!World.initiallyLoadedData) {
			World.requestDataFromServer(lat, lon);
			World.initiallyLoadedData = true;
		} else if (World.locationUpdateCounter === 0) {
			// update placemark distance information frequently, you max also update distances only every 10m with some more effort
			World.updateDistanceToUserValues();
		}

		// helper used to update placemark information every now and then (e.g. every 10 location upadtes fired)
		World.locationUpdateCounter = (++World.locationUpdateCounter % World.updatePlacemarkDistancesEveryXLocationUpdates);
	},

	// fired when user pressed maker in cam
	onMarkerSelected: function onMarkerSelectedFn(marker) {
		World.currentMarker = marker;

		// update panel values
		$("#poi-detail-title").html(marker.poiData.title);
		$("#poi-detail-description").html(marker.poiData.description);

		var distanceToUserValue = (marker.distanceToUser > 999) ? ((marker.distanceToUser / 1000).toFixed(2) + " m") : (Math.round(marker.distanceToUser) + " m");

		$("#poi-detail-distance").html(distanceToUserValue);

		// show panel
		$("#panel-poidetail").panel("open", 123);

		$(".ui-panel-dismiss").unbind("mousedown");

		$("#panel-poidetail").on("panelbeforeclose", function(event, ui) {
			World.currentMarker.setDeselected(World.currentMarker);
		});
	},

	// screen was clicked but no geo-object was hit
	onScreenClick: function onScreenClickFn() {
		// you may handle clicks on empty AR space too
		//alert("testbby");
	},

	// returns distance in meters of placemark with maxdistance * 1.1
	getMaxDistance: function getMaxDistanceFn() {

		// sort palces by distance so the first entry is the one with the maximum distance
		World.markerList.sort(World.sortByDistanceSortingDescending);

		// use distanceToUser to get max-distance
		var maxDistanceMeters = World.markerList[0].distanceToUser;

		// return maximum distance times some factor >1.0 so ther is some room left and small movements of user don't cause places far away to disappear
		return maxDistanceMeters * 1.1;
	},

	// udpates values show in "range panel"
	updateRangeValues: function updateRangeValuesFn() {

		// get current slider value (0..100);
		var slider_value = $("#panel-distance-range").val();

		// max range relative to the maximum distance of all visible places
		var maxRangeMeters = Math.round(World.getMaxDistance() * (slider_value / 100));

		// range in meters including metric m/km
		var maxRangeValue = (maxRangeMeters > 999) ? ((maxRangeMeters / 1000).toFixed(2) + "km") : (Math.round(maxRangeMeters) + " m");

		// number of places within max-range
		var placesInRange = World.getNumberOfVisiblePlacesInRange(maxRangeMeters);

		// update UI labels accordingly
		$("#panel-distance-value").html(maxRangeValue);
		$("#panel-distance-places").html((placesInRange != 1) ? (placesInRange + " Airnotes") : (placesInRange + " Airnote"));

		// update culling distance, so only palces within given range are rendered
		AR.context.scene.cullingDistance = Math.max(maxRangeMeters, 1);

		// update radar's maxDistance so radius of radar is updated too
		PoiRadar.setMaxDistance(Math.max(maxRangeMeters, 1));
	},

	// returns number of places with same or lower distance than given range
	getNumberOfVisiblePlacesInRange: function getNumberOfVisiblePlacesInRangeFn(maxRangeMeters) {

		// sort markers by distance
		World.markerList.sort(World.sortByDistanceSorting);

		// loop through list and stop once a placemark is out of range ( -> very basic implementation )
		for (var i = 0; i < World.markerList.length; i++) {
			if (World.markerList[i].distanceToUser > maxRangeMeters) {
				return i;
			}
		};

		// in case no placemark is out of range -> all are visible
		return World.markerList.length;
	},

	handlePanelMovements: function handlePanelMovementsFn() {

		$("#panel-distance").on("panelclose", function(event, ui) {
			$("#radarContainer").addClass("radarContainer_left");
			$("#radarContainer").removeClass("radarContainer_right");
			PoiRadar.updatePosition();
		});

		$("#panel-distance").on("panelopen", function(event, ui) {
			$("#radarContainer").removeClass("radarContainer_left");
			$("#radarContainer").addClass("radarContainer_right");
			PoiRadar.updatePosition();
		});
	},

	// display range slider
	showRange: function showRangeFn() {
		if (World.markerList.length > 0) {

			// update labels on every range movement
			$('#panel-distance-range').change(function() {
				World.updateRangeValues();
			});

			World.updateRangeValues();
			World.handlePanelMovements();

			// open panel
			$("#panel-distance").trigger("updatelayout");
			$("#panel-distance").panel("open", 1234);
		} else {

			// no places are visible, because the are not loaded yet
			World.updateStatusMessage('No Airnotes available yet', true);
		}
	},

	/*
		This sample shows you how to use the function captureScreen to share a snapshot with your friends. C
		oncept of interaction between JavaScript and native code is same as in the POI Detail page sample but the urlListener now handles picture sharing instead. 
		The "Snapshot"-button is on top right in the title bar. 
		Once clicked the current screen is captured and user is prompted to share it (Handling of picture sharing is done in native code and cannot be done in JavaScript)
	*/
	// reload places from content source
	captureScreen: function captureScreenFn() {
		if (World.initialized) {
			document.location = "architectsdk://button?action=captureScreen";
		}
	},

	// request POI data
	requestDataFromServer: function requestDataFromServerFn(lat, lon) {

		// set helper var to avoid requesting places while loading
		World.isRequestingData = true;
		World.updateStatusMessage('Requesting Airnotes from web-service');

		// server-url to JSON content provider
		var serverUrl = ServerInformation.POIDATA_SERVER + "?" + ServerInformation.POIDATA_SERVER_ARG_LAT + "=" + lat + "&" + ServerInformation.POIDATA_SERVER_ARG_LON + "=" + lon + "&" + ServerInformation.POIDATA_SERVER_ARG_NR_POIS + "=20";

		var jqxhr = $.getJSON(serverUrl, function(data) {
				World.loadPoisFromJsonData(data);
			})
			.error(function(err) {
				/*
					Under certain circumstances your web service may not be available or other connection issues can occur. 
					To notify the user about connection problems a status message is updated.
					In your own implementation you may e.g. use an info popup or similar.
				*/
				World.updateStatusMessage("Invalid web-service response.", true);
				World.isRequestingData = false;
			})
			.complete(function() {
				World.isRequestingData = false;
			});
	},

	// helper to sort places by distance
	sortByDistanceSorting: function(a, b) {
		return a.distanceToUser - b.distanceToUser;
	},

	// helper to sort places by distance, descending
	sortByDistanceSortingDescending: function(a, b) {
		return b.distanceToUser - a.distanceToUser;
	}

};

/* forward locationChanges to custom function */
AR.context.onLocationChanged = World.locationChanged;

/* forward clicks in empty area to World */
AR.context.onScreenClick = World.onScreenClick;