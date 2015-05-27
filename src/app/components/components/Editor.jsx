var React = require('react');
var Classable = require('../../mixins/classable.js');
var tweenState = require('react-tween-state');
var cx = React.addons.classSet;
var assign = require('object-assign');
var urlencode = require('urlencode');

var Editor = React.createClass({
  mixins: [Classable],

  propTypes: {
    text: React.PropTypes.string.isRequired,
    cursorPod: React.PropTypes.number.isRequired,
    transform: React.PropTypes.func.isRequired,
  },

  render: function() {

    return (
      <div>Editor
        <p>{this.props.text}</p>
      </div>
    );
  }

});

module.exports = Editor;
