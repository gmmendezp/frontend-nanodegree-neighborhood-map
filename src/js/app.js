/*
* Configuration options
*/
var CONFIG = {
  MAP_CENTER: {
    lat: 46.9487991,
    lng: 7.4473715
  },
  MAP_ZOOM: 16,
  FOURSQUARE_CLIENT_ID: '3Y0A1BQI1KGNCALQWUXQH4AGHXLUDOQKIMD0VANL0D5HPPZC',
  FOURSQUARE_CLIENT_SECRET: 'XNXWRZBHGVGKMDNLPVXZC0I3PSNEO041WAGAMVQ0OBG3J2EV',
  FOURSQUARE_API_URL: 'https://api.foursquare.com/v2/venues/',
  FOURSQUARE_EXPLORE: 'explore',
  MAX_PLACES: 20,
  ERROR_TEMPLATE: '<div class="error">{{error}}</div>',
  INFO_TEMPLATE: ''
};

/*
* Gets the template from the info.html file asap
*/
$(function () {
  $.get({
    url: '/info.html',
    success : function (result) {
      CONFIG.INFO_TEMPLATE = result;
    },
    error: function() {
      CONFIG.INFO_TEMPLATE = CONFIG.ERROR_TEMPLATE.replace(
        '{{error}}',
        'There was a problem retrieving a file, please refresh the page.'
      );
    }
  });
});

/*
* Variable containing the map
*/
var map;

/**
* @description Gets recommended places from Foursquare
* @param {function} callback - function to call after the places are retrieved
*/
var getPlaces = function (callback) {
  $.get({
    url: CONFIG.FOURSQUARE_API_URL + CONFIG.FOURSQUARE_EXPLORE,
    data: {
      ll: CONFIG.MAP_CENTER.lat + ',' + CONFIG.MAP_CENTER.lng,
      limit: CONFIG.MAX_PLACES,
      client_id: CONFIG.FOURSQUARE_CLIENT_ID,
      client_secret: CONFIG.FOURSQUARE_CLIENT_SECRET,
      v: 20160930,
      locale: 'en'
    },
    success: function (data) {
      callback(null, data.response.groups[0].items.map(function (item) {
        return item.venue;
      }));
    },
    error: function (error) {
      callback('There was a problem loading FourSquare places, ' +
               'reload the page to try again.');
      console.error(error, []);
    }
  });
};

/**
* @description Get info about the selected place from foursquare
* @param {object} place - place from which it requests info
* @param {function} callback - function to call after the info is retrieved
*/
var getVenueInfo = function(place, callback) {
  $.get({
    url: CONFIG.FOURSQUARE_API_URL + place.id,
    data: {
      client_id: CONFIG.FOURSQUARE_CLIENT_ID,
      client_secret: CONFIG.FOURSQUARE_CLIENT_SECRET,
      v: 20160930,
      locale: 'en'
    },
    success: function (data) {
      callback(null, place, data.response.venue);
    },
    error: function (error) {
      callback('There was a problem loading this place info from FourSquare, ' +
               'please try again later.', place);
      console.error(error);
    }
  });
};

/**
* @description Fill the info window template with the place's info
* @param {object} placeInfo - info retrieved from foursquare API
* @returns {string} Template filled with place's info
*/
var applyINFO_TEMPLATE = function (placeInfo) {
  var template = CONFIG.INFO_TEMPLATE;
  var photo = placeInfo.bestPhoto;
  template = template.split('{{photo}}').join(
    photo.prefix + 'cap200' + photo.suffix
  );
  template = template.split('{{name}}').join(placeInfo.name);
  template = template.split('{{fsUrl}}').join(placeInfo.shortUrl);
  var categories = placeInfo.categories.map(function (cat) {
    return cat.name;
  });
  template = template.split('{{categories}}').join(
    categories.length ? categories.join(', ') : 'No categories'
  );
  template = template.split('{{tags}}').join(
    placeInfo.tags.length ? placeInfo.tags.join(', ') : 'No tags'
  );
  template = template.split('{{rating}}').join(placeInfo.rating || '');
  template = template.split('{{ratingColor}}').join(placeInfo.ratingColor || 'black');
  template = template.split('{{url}}').join(placeInfo.url || '');
  template = template.split('{{phone}}').join(placeInfo.contact.formattedPhone || '');
  template = template.split('{{address}}').join(
    placeInfo.location.formattedAddress.length ?
    placeInfo.location.formattedAddress.join(', ') : ''
  );
  return template;
};

/**
* @description Decide if showing an error or place info, opens the info window
* @param {string} error - if a error happened before it comes with a message
* @param {object} place - it is the place object as saved in the knockout model
* @param {object} placeInfo - info retrieved from foursquare API
*/
var openInfoWindow = function (error, place, placeInfo) {
  var infoWindow = place.infoWindow;
  if (error) {
    infoWindow.setContent(CONFIG.ERROR_TEMPLATE.replace('{{error}}', error));
  } else {
    infoWindow.setContent(applyINFO_TEMPLATE(placeInfo));
  }
  infoWindow.open(map, place.marker);
};

/**
* @description Initializes knockout model
* @param {string} error - if a error happened before it comes with a message
* @param {array} places - an array of places
*/
var initModel = function (error, places) {
  /**
  * @description knockout model
  */
  var ViewModel = function () {
    var self = this;

    /**
    * @description changes selectedPlace and toggles the marker/info-window
    */
    var selectPlace = function () {
      var currentPlace = self.selectedPlace();
      if (currentPlace !== this) {
        if (currentPlace) {
          currentPlace.marker.setAnimation(null);
          currentPlace.infoWindow.close(map, this.marker);
        }
        self.selectedPlace(this);
        this.marker.setAnimation(google.maps.Animation.BOUNCE);
        getVenueInfo(this, openInfoWindow);
      } else {
        self.selectedPlace(null);
        this.marker.setAnimation(null);
        this.infoWindow.close(map, this.marker);
      }
    };

    /**
    * @description Initializes the markers and adds the click handler
    */
    var setMarkersAndInfo = function (places) {
      if (map && places.length > 0) {
        places.forEach(function (place) {
          place.marker = new google.maps.Marker({
            map: map,
            position: {
              lat: place.location.lat,
              lng: place.location.lng
            },
            title: place.name
          });
          place.marker.addListener('click', selectPlace.bind(place));
          place.infoWindow = new google.maps.InfoWindow();
        });
      }
    };
    setMarkersAndInfo(places);

    // Properties initialization
    self.showNav = ko.observable(false);
    self.toggleNav = function () {
      self.showNav(!self.showNav());
    };
    self.error = error;
    self.selectedPlace = ko.observable();
    self.searchTerm = ko.observable('');
    self.places = ko.computed(function () {
      var filteredPlaces = places.filter(function (place) {
        return place.name.toUpperCase()
                         .indexOf(self.searchTerm().toUpperCase()) > -1;
      });
      places.forEach(function (place) {
        place.infoWindow.close(map, place.marker);
        var showPlace = place.name.toUpperCase()
                                .indexOf(self.searchTerm().toUpperCase()) > -1;
        if (showPlace) {
          place.marker.setMap(map);
        } else {
          place.marker.setMap(null);
        }
      });
      return filteredPlaces;
    }, this);
    self.selectPlace = function (place) {
      selectPlace.call(place);
    };
  };

  ko.applyBindings(new ViewModel());
};

/**
* @description function called as callback for the loading of Google Maps API
*/
var initMap = function () {
  map = new google.maps.Map(document.getElementById('map'), {
    center: CONFIG.MAP_CENTER,
    zoom: CONFIG.MAP_ZOOM,
    clickableIcons: false,
    mapTypeControlOptions: {
      position: google.maps.ControlPosition.TOP_RIGHT
    }
  });
  getPlaces(initModel);
};
