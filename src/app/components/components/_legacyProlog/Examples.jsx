var React = require('react');
var Classable = require('../../mixins/classable.js');
var assign = require('object-assign');
var Router = require('react-router');
var urlencode = require('urlencode');

var ExamplesStore = require('../../stores/ExamplesStore.js');
// var ExamplesActionCreators = require('../../actions/ExamplesActionCreators.js');

function getStateFromStores() {
  return {
    examples : ExamplesStore.getExamples(),
  };
}

var Examples = React.createClass({
  mixins: [Classable, Router.Navigation],

  getInitialState: function() {
    return getStateFromStores();
  },

  componentDidMount: function() {
    ExamplesStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    ExamplesStore.removeChangeListener(this._onChange);
  },

  /**
   * Event handler for 'change' events coming from the stores
   */
  _onChange: function() {
    this.setState(getStateFromStores());
  },

  onLinkClicked: function(name) {
    this.replaceWith('examples', {exampelName: urlencode.encode(name)});
  },

  render: function() {
    var classes = this.getClasses('examples', {
    });


    return (
      <div className={classes} >
      </div>
      );
    }
});

module.exports = Examples;
