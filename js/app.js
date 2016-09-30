var config = {
  mapCenter: {
    lat: 46.9487991,
    lng: 7.4473715
  },
  mapZoom: 15,
  foursquareClientId: '3Y0A1BQI1KGNCALQWUXQH4AGHXLUDOQKIMD0VANL0D5HPPZC',
  foursquareClientSecret: 'XNXWRZBHGVGKMDNLPVXZC0I3PSNEO041WAGAMVQ0OBG3J2EV',
  foursquareAPIUrl: 'https://api.foursquare.com/v2/',
  foursquareExplore: 'venues/explore',
  maxPlaces: 20
};

$(function () {
  getPlaces(init);
});

var map;
var filteredPlaces = [];
var currentPlace = null;
var init = function (error, places) {
  if(error) {
    places = []
  }
  filteredPlaces = places.slice(0);
  setMarkers();

  var ViewModel = function () {
    var self = this;
    self.showNav = ko.observable(false);
    self.toggleNav = function () {
      self.showNav(!self.showNav());
    };
    self.error = error;
    self.searchTerm = ko.observable('');
    self.places = ko.computed(function () {
      filteredPlaces = places.filter(function (place) {
        return place.venue.name.toUpperCase().indexOf(self.searchTerm().toUpperCase()) > -1;
      });
      places.forEach(function (place) {
        if(place.venue.name.toUpperCase().indexOf(self.searchTerm().toUpperCase()) > -1) {
          place.marker.setMap(map);
        } else {
          place.marker.setMap(null);
        }
      });
      return filteredPlaces;
    }, this);
    self.chosenPlace = ko.observable();
    self.selectPlace = function (place) {
      self.chosenPlace(place);
      selectPlace.call(place);
    }
  };

  ko.applyBindings(new ViewModel());
};

var initMap = function () {
  map = new google.maps.Map(document.getElementById('map'), {
    center: config.mapCenter,
    zoom: config.mapZoom,
    mapTypeControlOptions: {
      position: google.maps.ControlPosition.TOP_RIGHT
    }
  });
  setMarkers();
};

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
      callback(null, data.response.groups[0].items)
    },
    error: function (error) {
      callback('There was a problem loading FourSquare places, reload the page to try again.');
      console.error(error);
    }
  });
};

var setMarkers = function () {
  if(map && filteredPlaces.length > 0) {
    filteredPlaces.forEach(function(place) {
      place.marker = new google.maps.Marker({
        map: map,
        position: {
          lat: place.venue.location.lat,
          lng: place.venue.location.lng
        },
        title: place.venue.name
      });
      place.marker.addListener('click', selectPlace.bind(place));
    })
  }
};

var selectPlace = function () {
  if (currentPlace === this) {
    currentPlace = null;
    this.marker.setAnimation(null);
  } else {
    if(currentPlace) {
      currentPlace.marker.setAnimation(null);
    }
    currentPlace = this;
    this.marker.setAnimation(google.maps.Animation.BOUNCE);
  }
};
