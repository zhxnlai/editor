var React = require('react');
var Classable = require('../../mixins/classable.js');
var tweenState = require('react-tween-state');
var cx = React.addons.classSet;
var assign = require('object-assign');
var urlencode = require('urlencode');
var k = require('keymaster').noConflict();

var Cursor = require('./Cursor.jsx');

var nextEditorId = 0;

String.prototype.splice = function(idx, rem, s) {
  return (this.slice(0, idx) + s + this.slice(idx + Math.abs(rem)));
};


var Editor = React.createClass({
  mixins: [Classable],

  getInitialState: function() {
    return {
      cursorPos: 0,
      cursorRect: {
        top: 0,
        left: 0,
        height: 0
      }
    };
  },

  propTypes: {
    source: React.PropTypes.string.isRequired,
    transform: React.PropTypes.func.isRequired,
  },

  componentDidMount: function() {
    this.editorID = 'editor_' + nextEditorId++;

    var self = this;

    k('left',               this.editorID, function() { self._cursorLeft();  return false; });
    k('right',              this.editorID, function() { self._cursorRight(); return false; });
    // k('up',                 this.editorID, function() { EditorActionCreators.cursorUp();    return false; });
    // k('down',               this.editorID, function() { EditorActionCreators.cursorDown();  return false; });
    // k('home, command+left', this.editorID, function() { EditorActionCreators.home();        return false; });
    // k('end, command+right', this.editorID, function() { EditorActionCreators.end();         return false; });
    // k('backspace',          this.editorID, function() { EditorActionCreators.backspace();   return false; });
    // k('enter',              this.editorID, function() { EditorActionCreators.keyPress('\n');  return false; });
  },

  _cursorLeft: function() {
    this.setState({
      cursorPos: Math.max(this.state.cursorPos-1, 0)
    }, this.updateCursorPosition);
  },
  _cursorRight: function() {
    var {source} = this.props;

    this.setState({
      cursorPos: Math.min(this.state.cursorPos+1, source.length)
    }, this.updateCursorPosition);

  },

  _onBlur: function() {
    k.setScope('');
  },

  _onFocus: function() {
    k.setScope(this.editorID);
  },

  _onKeyPress: function(e) {
    if (e.charCode > 0 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      // this.insert(String.fromCharCode(e.charCode));
      // EditorActionCreators.keyPress(String.fromCharCode(e.charCode));
    } else {
      e.stopPropagation();
    }
  },

  _onMouseDown: function() {
    // var target = this.getNodeAt(e.clientX, e.clientY);
    // var pos = this.getCursorPosFor(target, e.clientX, e.clientY);
    // if (pos >= 0) {
    //   this.setCursorPos(pos);
    // }

    // console.log('down');

  },

  componentWillReceiveProps: function() {
    this.updateCursorPosition();
  },

  updateCursorPosition: function() {
    var {source} = this.props;
    var {cursorPos} = this.state;
    var {editorNode, contentNode} = this.refs;

    if (cursorPos !== undefined && contentNode !== undefined) {

      var textNodes = contentNode.getDOMNode().querySelectorAll(".text");
      if (cursorPos > source.length) {
        return;
      }
      console.log(source.splice(cursorPos, 0, '|'));

      var minDiff = Number.MAX_VALUE;
      var minStart = 0;
      var minEnd = 0;
      var closestTextNode;
      for (var i = 0; i < textNodes.length; i++) {
        var textNode = textNodes[i];
        var startIdx = parseInt(textNode.getAttribute("data-start-idx"));
        var endIdx = parseInt(textNode.getAttribute("data-end-idx"));
        if (startIdx <= cursorPos && cursorPos < endIdx && endIdx - startIdx < minDiff) {
          closestTextNode = textNode;
          minDiff = endIdx - startIdx;
          minStart = startIdx;
          minEnd = endIdx;
        }
      }

      if (closestTextNode) {
        var rect = closestTextNode.getBoundingClientRect();
        var editorRect = editorNode.getDOMNode().getBoundingClientRect();

        console.log(JSON.stringify(rect));
        this.setState({
          cursorRect: {
            left: (rect.left - editorRect.left) + this.getDOMNode().scrollLeft - 1,
            top: rect.top - editorRect.top + this.getDOMNode().scrollTop,
            height: rect.height
          }
        });
      }
    } else {
      console.log("Error");
    }
  },

  render: function() {
    var classes = cx({
      Editor: true
    });

    var {cursorRect} = this.state;
    var content = this.props.transform(this.props.source);
    return (
      <div ref="editorNode" className={classes} onBlur={this._onBlur} onFocus={this._onFocus} onKeyPress={this._onKeyPress} onMouseDown={this._onMouseDown}
        tabIndex={0}>
        <div ref="contentNode">{content}</div>
        <Cursor {...cursorRect}/>
      </div>
    );
  }

});

module.exports = Editor;
