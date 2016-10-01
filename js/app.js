// Configuration options
var config = {
  mapCenter: {
    lat: 46.9487991,
    lng: 7.4473715
  },
  mapZoom: 16,
  foursquareClientId: '3Y0A1BQI1KGNCALQWUXQH4AGHXLUDOQKIMD0VANL0D5HPPZC',
  foursquareClientSecret: 'XNXWRZBHGVGKMDNLPVXZC0I3PSNEO041WAGAMVQ0OBG3J2EV',
  foursquareAPIUrl: 'https://api.foursquare.com/v2/venues/',
  foursquareExplore: 'explore',
  maxPlaces: 20,
  errorTemplate: '<div class="error">{{error}}</div>',
  infoTemplate: ''
};

$(function () {
  $.get({
    url: '/info.html',
    success : function (result) {
      config.infoTemplate = result
    },
    error: function() {
      config.infoTemplate = config.errorTemplate.replace(
        '{{error}}',
        'There was a problem retrieven a file, please refresh the page.'
      );
    }
  });
});

// variable that contains the map
var map;

// Get recommended places from foursquare
var getPlaces = function (callback) {
  $.get({
    url: config.foursquareAPIUrl + config.foursquareExplore,
    data: {
      ll: config.mapCenter.lat + ',' + config.mapCenter.lng,
      limit: config.maxPlaces,
      client_id: config.foursquareClientId,
      client_secret: config.foursquareClientSecret,
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
      console.error(error);
    }
  });
};

// Get info about the selected place from foursquare
var getVenueInfo = function(place, callback) {
  $.get({
    url: config.foursquareAPIUrl + place.id,
    data: {
      client_id: config.foursquareClientId,
      client_secret: config.foursquareClientSecret,
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

var applyInfoTemplate = function (placeInfo) {
  console.log(placeInfo)
  var template = config.infoTemplate;
  var photo = placeInfo.bestPhoto;
  template = template.split('{{photo}}').join(
    photo.prefix + 'cap200' + photo.suffix
  );
  template = template.split('{{name}}').join(placeInfo.name);
  template = template.split('{{fsUrl}}').join(placeInfo.shortUrl);
  var categories = placeInfo.categories.map(function (cat) {
    return cat.name
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

// Fill the info window and open it with info from a place
var openInfoWindow = function (error, place, placeInfo) {
  var infoWindow = place.infoWindow;
  if (error) {
    infoWindow.setContent(config.errorTemplate.replace('{{error}}', error));
  } else {
    infoWindow.setContent(applyInfoTemplate(placeInfo));
  }
  infoWindow.open(map, place.marker);
};

// Initialize knockout model
var initModel = function (error, places) {
  if (error) {
    places = [];
  }
  var filteredPlaces = places.slice(0);

  var ViewModel = function () {
    var self = this;

    // function to select a place, changes selectedPlace and toggles the marker
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

    // Initializes the markers and adds the click handler
    var setMarkersAndInfo = function () {
      if (map && filteredPlaces.length > 0) {
        filteredPlaces.forEach(function (place) {
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
    setMarkersAndInfo();

    // Properties initialization
    self.showNav = ko.observable(false);
    self.toggleNav = function () {
      self.showNav(!self.showNav());
    };
    self.error = error;
    self.searchTerm = ko.observable('');
    self.places = ko.computed(function () {
      filteredPlaces = places.filter(function (place) {
        return place.name.toUpperCase()
                         .indexOf(self.searchTerm().toUpperCase()) > -1;
      });
      places.forEach(function (place) {
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
    self.selectedPlace = ko.observable();
    self.selectPlace = function (place) {
      selectPlace.call(place);
    }
  };

  ko.applyBindings(new ViewModel());
};

var initMap = function () {
  map = new google.maps.Map(document.getElementById('map'), {
    center: config.mapCenter,
    zoom: config.mapZoom,
    clickableIcons: false,
    mapTypeControlOptions: {
      position: google.maps.ControlPosition.TOP_RIGHT
    }
  });
  getPlaces(initModel);
};
