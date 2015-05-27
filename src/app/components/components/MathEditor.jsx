var React = require('react');
var Classable = require('../../mixins/classable.js');
var tweenState = require('react-tween-state');
var cx = React.addons.classSet;
var assign = require('object-assign');
var Router = require('react-router');
var urlencode = require('urlencode');

var CodeMirror = require('./ReactCodeMirror.jsx');
var Editor = require('./Editor.jsx');

var EditorStore = require('../../stores/EditorStore.js');
var EditorActionCreators = require('../../actions/EditorActionCreators.js');

function getStateFromStores() {
  return {
    text : EditorStore.getText(),
    traceIter: EditorStore.getTraceIter(),
    syntaxError: EditorStore.getSyntaxError(),
  };
}

var MathEditor = React.createClass({
  mixins: [Classable, Router.State, Router.Navigation],

  getInitialState: function() {
    return getStateFromStores();
  },

  componentDidMount: function() {
    EditorStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    EditorStore.removeChangeListener(this._onChange);
  },

  /**
   * Event handler for 'change' events coming from the stores
   */
  _onChange: function() {
    var newState = getStateFromStores();
    this.setState(newState);
  },

  render: function() {

    return (
      <Editor text="text"/>
    );
  }

});

module.exports = MathEditor;
