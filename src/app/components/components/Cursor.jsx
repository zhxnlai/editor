var React = require('react');

var SetIntervalMixin = {
  componentWillMount: function() {
    this.intervals = [];
  },
  setInterval: function() {
    this.intervals.push(setInterval.apply(null, arguments));
  },
  componentWillUnmount: function() {
    this.intervals.map(clearInterval);
  }
};

var Cursor = React.createClass({
  mixins: [SetIntervalMixin],

  propTypes: {
    top: React.PropTypes.number.isRequired,
    left: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
  },

  getInitialState: function() {
    return {
      visiable: true
    };
  },

  componentDidMount: function() {
    this.setInterval(this.tick, 350); // Call a method on the mixin
  },

  tick: function() {
    this.setState({
      visiable: !this.state.visiable
    });
  },

  componentWillUnmount: function() {
  },

  render: function() {
    var cursorStyle = {
      top: this.props.top,
      left: this.props.left,
      height: this.props.height,
      visibility: this.state.visiable ? 'visible' : 'hidden',
    };

    return (
      <div className="editorCursor" style={cursorStyle}/>
      );
    }
});

module.exports = Cursor;
