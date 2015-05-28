var AppDispatcher = require('../dispatcher/AppDispatcher');
var Constants = require('../constants/Constants');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

// using brfs transform
// var fs = require('fs');
// var text = fs.readFileSync(__dirname + '/../../../resources/examples.json', 'utf8');
var examples = {}//JSON.parse(text);

var ActionTypes = Constants.ActionTypes;

var CHANGE_EVENT = 'change-examples';

var store = function() {
  return {
    getExamples: function() {
      return examples;
    },

  };
};

var ExamplesStore = assign({}, EventEmitter.prototype, store(), {

  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },

  /**
   * @param {function} callback
   */
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },

});

ExamplesStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;
  switch (action.type) {
    case ActionTypes.DID_MOUNT:
      // load json from the web
      break;

    default:
      // console.log("No implementation for action: "+action.type);
      break;
  }
});

module.exports = ExamplesStore;
