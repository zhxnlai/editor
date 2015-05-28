var React = require('react');
var Classable = require('../../mixins/classable.js');
var tweenState = require('react-tween-state');
var cx = React.addons.classSet;

var Text = React.createClass({

  propTypes: {
    content: React.PropTypes.string.isRequired,
    startIdx: React.PropTypes.number.isRequired,
    endIdx: React.PropTypes.number.isRequired,
    // children: function(props, propName, componentName) {
    //     return new Error('Validation failed! Text should not have any child.');
    // }
  },

  render: function() {
    var {content, startIdx, endIdx} = this.props;

    var classes = cx({
      text: true
    });

    var attributes = {
      "data-start-idx": startIdx,
      "data-end-idx": endIdx
    };

    return (
      <div className={classes} {...attributes}>{content}</div>
    );
  }
});

module.exports = Text;
