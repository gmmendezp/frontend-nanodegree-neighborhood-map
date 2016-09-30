var places = [{
  name: 'test1',
  location: {
    x: 123,
    y: 321
  }
}, {
  name: 'test2',
  location: {
    x: 123,
    y: 321
  }
},
{
  name: 'test3',
  location: {
    x: 123,
    y: 321
  }
},
{
  name: 'test4',
  location: {
    x: 123,
    y: 321
  }
}];
var filteredPlaces = places.slice(0);

function ViewModel () {
  var self = this;
  self.searchTerm = ko.observable('');
  self.places = ko.computed(function () {
    filteredPlaces = places.filter(function (place) {
      return place.name.indexOf(self.searchTerm()) > -1;
    });
    return filteredPlaces;
  }, this);
  self.chosenPlace = ko.observable();
  self.selectPlace = function (place) {
    self.chosenPlace(place);
  }
};

ko.applyBindings(new ViewModel());
