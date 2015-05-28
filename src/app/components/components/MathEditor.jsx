var React = require('react');
var Classable = require('../../mixins/classable.js');
var tweenState = require('react-tween-state');
var cx = React.addons.classSet;
var assign = require('object-assign');
var Router = require('react-router');
var urlencode = require('urlencode');

var CodeMirror = require('./ReactCodeMirror.jsx');
var Editor = require('./Editor.jsx');
var Text = require('./Text.jsx');

var EditorStore = require('../../stores/EditorStore.js');
var EditorActionCreators = require('../../actions/EditorActionCreators.js');

function getStateFromStores() {
  return {
    ohm: EditorStore.getOhm(),
    text : EditorStore.getText(),
    grammar : EditorStore.getGrammar(),
    syntaxError: EditorStore.getSyntaxError(),
  };
}

function ts(text, startIdx) {
  return text.split("").map(function(c, i) {
    var props = {
      content: c,
      startIdx: startIdx+i,
      endIdx: startIdx+i+1
    };
    return <Text {...props}/>;
  });
}
function ti(interval) {
  return interval.contents.split("").map(function(c, i) {
    var props = {
      content: c,
      startIdx: interval.startIdx+i,
      endIdx: interval.startIdx+i+1
    };
    return <Text {...props}/>;
  });
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

  _onChange: function() {
    var newState = getStateFromStores();
    this.setState(newState);

    var pos = 0;
    // setInterval(() => {
    //   this.refs.editor.setState({
    //     cursorPos: pos
    //   });
    //   this.refs.editor.updateCursorPosition();
    //   pos++;
    // }, 1000);

  },


  transform: function(text) {
    var {ohm, grammar} = this.state;
    if (grammar) {

      var toAST = grammar.synthesizedAttribute({
        Expr: function(expr) {
          return toAST(expr);
        },

        AddExpr: function(expr) {
          return toAST(expr);
        },
        AddExpr_plus: function(x, op, y) {
          return <div className="plus">{[toAST(x), toAST(op), toAST(y)]}</div>;
          // self.nest(op.interval, document.createElement('operator'));
          // self.nest(this.interval, document.createElement('plus'));
        },
        AddExpr_minus: function(x, op, y) {
          return <div className="minus">{[toAST(x), toAST(op), toAST(y)]}</div>;
          // self.decorate(op.interval, document.createElement('operator'), '\u2212');
          // self.nest(this.interval, document.createElement('minus'));
        },
        MulExpr: function(expr) {
          return toAST(expr);
        },
        MulExpr_times: function(x, op, y) {
          return <div className="times">{[toAST(x), toAST(op), toAST(y)]}</div>;
          // self.decorate(op.interval, document.createElement('operator'), '\u00D7');
          // self.nest(this.interval, document.createElement('times'));
        },
        MulExpr_divide: function(x, op, y) {
          return (<div className="divide">
                    <div className="numerator">{toAST(x)}{ts("_", x.interval.endIdx)}</div>
                    <div className="denominator">{toAST(y)}</div>
                  </div>);

          // self.decorate(op.interval, document.createElement('span'));
          // self.nest(x.interval.coverageWith(op.interval), document.createElement('numerator'));
          // self.nest(y.interval, document.createElement('denominator'));
          // self.nest(this.interval, document.createElement('fraction'));
        },
        ExpExpr: function(expr) {
          return toAST(expr);
        },
        ExpExpr_exp: function(x, op, y) {
          return <div className="exp">
                  {toAST(x)}
                  <div className="sup">{ts("^", x.interval.endIdx)}{toAST(y)}</div>
                </div>;

          // self.nest(x.interval, document.createElement('theBase'));
          // self.nest(op.interval, document.createElement('gray'));
          // self.nest(op.interval.coverageWith(y.interval), document.createElement('exponent'));
          // self.nest(this.interval, document.createElement('power'));
        },
        PriExpr: function(expr) {
          return toAST(expr);
        },
        PriExpr_paren: function(open, e, close) {
          return [toAST(open), toAST(e), toAST(close)];

          // open.value;
          // e.value;
          // close.value;
          // self.nest(open.interval, document.createElement('gray'));
          // self.nest(close.interval, document.createElement('gray'));
          // self.nest(this.interval, document.createElement('paren'));
        },
        ident: function(letter, alnum) {
          return ti(this.interval);
          // if (this.interval.contents === 'pi') {
          //   self.decorate(this.interval, document.createElement('ident'), '\u03C0');
          // } else {
          //   self.nest(this.interval, document.createElement('ident'));
          // }
        },
        number: function(number) {

          return ti(this.interval);

          // var n = createNumber();
          // n.valueChangeEventListener = function(e) {
          //   var pos = self.getCursorPos(n) + self.numCharsIn(n);
          //   self.changed('', self.getText(), true);
          //   self.setCursorPos(pos);
          // };
          // n.addEventListener('valuechange', n.valueChangeEventListener, false);
          // numbers.push(n);
          // self.nest(this.interval, n);
        },
        _terminal: function() {
          return ti(this.interval);
        },
        // ohm.actions.getValue
        _list: ohm.actions.map,
        _default: ohm.actions.passThrough
      });

      var cst = grammar.matchContents(text, "Expr", true);
      var content = toAST(cst);
      var props = {
        content: content,
        startIdx: 0,
        endIdx: text.length
      };
      return <Text {...props}/>;
    }
    return <Text content={text}></Text>;
  },

  render: function() {
    var classes = cx({
      MathEditor: true
    });

    var props = {
      source: "2^3/(4+5)+223",
      transform: this.transform,
    };
    return (
      <div className={classes}>
        <Editor ref="editor" {...props}/>
      </div>
    );
  }

});

module.exports = MathEditor;
