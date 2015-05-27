// ---------------------------------------------------------
// "Classes" that represent AST nodes
// ---------------------------------------------------------

function Program(rules, query) {
  this.rules = rules;
  this.query = query;
}

function Rule(head, optBody, interval, substituting, rewritten, env) {
  this.head = head;
  this.body = optBody || [];
  this.interval = interval;
  this.substituting = substituting;
  this.rewritten = rewritten;
}

function Clause(name, optArgs) {
  this.name = name;
  this.args = optArgs || [];
}

function Var(name) {
  this.name = name;
}

Rule.prototype.hasSucceeded = function () {
  return !!this.rewritten;
};
Rule.prototype.hasFailed = function () {
  return this.rewritten === null;
};

// ---------------------------------------------------------
// Substitutions
// ---------------------------------------------------------

function Subst() {
  this.bindings = Object.create(null);
}

Subst.prototype.lookup = function(varName) {
  return this.bindings[varName];
};

Subst.prototype.bind = function(varName, term) {
  this.bindings[varName] = term;
  return this;
};

Subst.prototype.unbind = function(varName) {
  delete this.bindings[varName];
  return this;
};

Subst.prototype.clone = function() {
  var clone = new Subst();
  for (var varName in this.bindings) {
    clone.bind(varName, this.lookup(varName));
  }
  return clone;
};


// -----------------------------------------------------------------------------
// Part I: Rule.prototype.makeCopyWithFreshVarNames() and
//         {Clause, Var}.prototype.rewrite(subst)
// -----------------------------------------------------------------------------

Clause.prototype.containsVar = function() {
  if (this.hasVar === undefined) {
    this.hasVar = this.args.some(term => {
      if (term.constructor.name === Clause.name) {
        return term.containsVar();
      } else {
        return true;
      }
    });
  }
  return this.hasVar;
};

Clause.prototype.makeCopy = function(options) {
  // if (!this.containsVar) {
  //   return this;
  // }
  return new Clause(this.name, this.args.map(function(term) {
    switch (term.constructor.name) {
      case Var.name:
        if (options) {
          var suffix = options.suffix;
          var varNamesToSkip = options.varNamesToSkip;
          var subst = options.subst;

          if (varNamesToSkip && suffix) {
            if (varNamesToSkip.indexOf(term.name) < 0) {
              return new Var(term.nextVarName());
            } else {
              return new Var(term.name);
            }
          }
          if (subst && subst[term.name]) {
            return new Var(subst[term.name]);
          }
        }
        return new Var(term.name);
      case Clause.name:
        return term.makeCopy(options);
      default:
        return null;
    }
  }));
};

Rule.prototype.makeCopy = function(options) {
  if (options) {
    var suffix = options.suffix;
    var existingVarNames = options.existingVarNames;

    if (suffix && existingVarNames) {
      var ruleVarNames = this.getQueryVarNames();
      options.varNamesToSkip = ruleVarNames.filter(function(varName) {
        return existingVarNames.indexOf(varName) < 0;
      });
    }
  }

  var head = this.head.makeCopy(options);
  var body = this.body.map(function(clause) {
    return clause.makeCopy(options);
  });
  if (options) {
    return new Rule(head, body, this.interval);
  } else {
    return new Rule(head, body, this.interval, this.substituting, this.rewritten);
  }
};

Clause.prototype.rewrite = function(subst) {
  var args = this.args.map(function(term) {
    return term.rewrite(subst);
  });
  var newClause = new Clause(this.name, args);
  return newClause;
};

Rule.prototype.rewrite = function(subst) {
  var newRule = this.makeCopy();
  newRule.head = newRule.head.rewrite(subst);
  newRule.body = newRule.body.map(c => c.rewrite(subst));
  return newRule;
};

function checkCircular(name, term) {
  if (term && term.constructor.name === Var.name && term.name === name) {
    return true;
  } else if (term && term.constructor.name === Clause.name) {
    return term.args.some(function(term) {
      return checkCircular(name, term);
    });
  }
}

Var.prototype.rewrite = function(subst) {
  var thisName = this.name;
  var value = subst.lookup(thisName);
  if (value && value.constructor.name === Clause.name) {
    if (!checkCircular(thisName, value)) {
      return value.rewrite(subst);
    }
  }
  return new Var(thisName);
};

// -----------------------------------------------------------------------------
// Part II: Subst.prototype.unify(term1, term2)
// -----------------------------------------------------------------------------

// term1: goal, term2: rule
Subst.prototype.unify = function(term1, term2) {
  var term1 = term1.rewrite(this);
  var term2 = term2.rewrite(this);
  // console.log("unifying term1: "+JSON.stringify(term1)+" term2: "+JSON.stringify(term2));
  if (term1.constructor.name === Var.name && term2.constructor.name === Var.name) {
    if (term1.name === term2.name) {
      return this;
    }
    if (this.lookup(term1.name)) {
      this.bind(term2.name, this.lookup(term1.name));
    } else if (this.lookup(term2.name)) {
      this.bind(term1.name, this.lookup(term2.name));
    } else {
      this.bind(term1.name, term2);
    }
  } else if (term1.constructor.name === Var.name && term2.constructor.name === Clause.name) {
    this.bind(term1.name, term2);
  } else if (term1.constructor.name === Clause.name && term2.constructor.name === Var.name) {
    this.bind(term2.name, term1);
  } else if (term1.constructor.name === Clause.name && term2.constructor.name === Clause.name &&
    term1.name === term2.name && term1.args.length === term2.args.length) {

    for (var i = 0; i < term1.args.length; i++) {
      // TODO: failed case?
      this.unify(term1.args[i], term2.args[i]);
    }

  } else {
    throw new Error("unification failed");
  }

  for (var varName in this.bindings) {
    this.bind(varName, this.lookup(varName).rewrite(this));
  }
  return this;
};

// -----------------------------------------------------------------------------
// Part III: Program.prototype.solve()
// -----------------------------------------------------------------------------

var count = 0;
Program.prototype.solve = function(hideRulesWithIncompatibleName, TIME_LIMIT, Env, Trace) {
  // console.log("=== solve#"+count+" ===");
  count++;
  // this limit is set by React: https://github.com/facebook/react/blob/dea7efbe16596bbab7965331e277de113aeaff27/src/core/ReactInstanceHandles.js#L25
  var MAX_TREE_DEPTH = 100;
  // each goal has 4 levels: goal > rulesAndChildren > ruleAndChild > goalWrapper > goal
  var DEPTH_LIMIT = Math.floor(MAX_TREE_DEPTH/4-4);
  var startTime = Date.now();

  var queryVarNames = this.getQueryVarNames();
  var trace = new Trace(new Env(this.query, this.rules, new Subst()));

  var resolution = (body, goals, subst) => body.slice().concat(goals.slice(1)).map(term => term.rewrite(subst));

  var solve = env => {
    if (Date.now() - startTime > TIME_LIMIT || !env || env.constructor.name !== Env.name || env.getDepth() >= DEPTH_LIMIT) {
      trace.logLastFrame();
      return false;
    } else if (env.hasSolution()) {
      env.isFinal = true;
      trace.setCurrentEnv(env.parent);
      return env.subst;
    } else if (env.isEmpty()) {
      env.isFinal = true;
      return solve(env.parent);
    } else if (env.children.length >= env.rules.length) {
      env.isFinal = true;
      env.setCurRuleIndex(-1);
      trace.setCurrentEnv(env);
      trace.log();
      return solve(env.parent);
    } else {
      var goal = env.goals[0];
      var rule = env.rules[env.children.length];
      var subst = env.subst.clone();

      if (hideRulesWithIncompatibleName) {
        if (goal.name !== rule.head.name) {
          env.addChild(new Env());
          return solve(env);
        }
      }

      trace.setCurrentEnv(env);
      env.setCurRuleIndex(-1);
      trace.log();

      env.setCurRuleIndex(env.children.length);

      // Step 1
      trace.log("1");

      var newEnv;
      try {
        subst.unify(goal, rule.head);

        // Step 2.1
        rule.substituting = subst.filter(rule.getQueryVarNames().concat(goal.getQueryVarNames()));

        // dedup equivalent vars in goals from rules
        var reversedSubst = {};
        goal.getQueryVarNames().forEach(varName => {
          var value = subst.lookup(varName);
          if (value.constructor.name === Var.name) {
            reversedSubst[value.name] = varName;
            subst.unbind(varName);
          }
        });
        var dedupedRule = rule.makeCopy({ subst: reversedSubst });
        // rewrite the rule and removed vars from subst
        var newRule = dedupedRule.rewrite(subst);
        var varNamesInNewRule = newRule.getQueryVarNames();
        dedupedRule.getQueryVarNames()
          .filter(varName => varNamesInNewRule.indexOf(varName) < 0)
          .forEach(varName => {
            if (queryVarNames.indexOf(varName) < 0) {
              subst.unbind(varName);
            }
          });
        rule.rewritten = newRule;

        var newGoals = resolution(newRule.body, env.goals, subst);
        newEnv = new Env(newGoals, env.rules, subst, { // TODO
          "numLatestGoals": newRule.body.length,
          "solution": subst.filter(queryVarNames), // this could be parital solution
          });
        env.addChild(newEnv);

        // Step 2.1
        trace.log("2.1");

        if (Array.isArray(newRule.body) && newRule.body.length > 0) {
          // Step 2.2
          trace.log("2.2");
        }

        // Step 2.3
        trace.log("2.3");
      } catch(e) {
        if (e.message !== "unification failed") {
          throw e;
        }
        rule.rewritten = null;

        newEnv = new Env();
        env.addChild(newEnv);

        // Step 3
        trace.log("3");
      }
      return solve(newEnv);
    }
  };

  return {
    next: function() {
      return solve(trace.currentEnv);
    },
    getTraceIter: function() {
      return trace.getIterator();
    }
  };
};

// -----------------------------------------------------------------------------
// Plumbing!
// -----------------------------------------------------------------------------

// Note: these methods are not really part of your prototype, they're just the
// "plumbing" that's required to hook up your prototype to our test harness,
// playground, etc.

Subst.prototype.toString = function() {
  var output = [];
  var first = true;
  for (var v in this.bindings) {
    if (first) {
      first = false;
    } else {
      output.push(", ");
    }
    output.push(v + " = " + this.bindings[v]);
  }
  if (first) {
    output.push("yes");
  }
  return output.join("");
};

Subst.prototype.filter = function(names) {
  var ans = new Subst();
  for (var idx = 0; idx < names.length; idx++) {
    var name = names[idx];
    var term = this.lookup(name);
    if (term) {
      ans.bind(name, term);
    }
  }
  return ans;
};

Program.prototype.getQueryVarNames = function() {
  var varNames = Object.create(null);
  this.query.forEach(function(clause) {
    clause.recordVarNames(varNames);
  });
  return Object.keys(varNames);
};

Rule.prototype.getQueryVarNames = function() {
  var varNames = Object.create(null);
  this.head.recordVarNames(varNames);
  this.body.forEach(function(c) {
    c.recordVarNames(varNames);
  });
  return Object.keys(varNames);
};

Clause.prototype.getQueryVarNames = function() {
  var varNames = Object.create(null);
  this.recordVarNames(varNames);
  return Object.keys(varNames);
};

Clause.prototype.recordVarNames = function(varNames) {
  this.args.forEach(function(arg) {
    arg.recordVarNames(varNames);
  });
};

Var.prototype.recordVarNames = function(varNames) {
  varNames[this.name] = true;
};

// JS.prettyPrintValue = function(x) {
//   return x instanceof Program || x instanceof Rule || x instanceof Clause || x instanceof Var ?
//     L.prettyPrintAST(x) :
//     String(x);
// };

// --------------------------------------------------------------

Rule.prototype.toString = function(hideBody, showEclipse) {
  var ret = this.head.toString();
  if (this.body.length > 0) {
    if (hideBody) {
      ret += " :- ";
      if (showEclipse) {
        ret += "...";
      }
    } else {
      ret += " :- "+this.body.map(function(term) {
        return term.toString();
      }).join(", ");
    }
  } else {
    ret += " ";
  }
  return ret;
};

Clause.prototype.toString = function() {
  if (this.name === '_nil') {
    return '[]';
  } else if (this.name === '_cons') {
    var strm = new IndentingOutputStream();
    strm.write('[');
    var first = true;
    var curr = this;
    while (curr.name === '_cons') {
      if (first) {
        first = false;
      } else {
        strm.write(',');
      }
      strm.write(curr.args[0].toString());
      curr = curr.args[1];
    }
    if (curr.name !== '_nil') {
      strm.write('|');
      strm.write(curr.toString());
    }
    strm.write(']');
    return strm.contents();
  } else {
    return this.args.length === 0 ?
      this.name :
      this.name + "(" + this.args.map(function(arg) { return arg.toString(); }).join(", ") + ")";
  }
};

Var.prototype.toString = function() {
  return this.name;
};

Var.prototype.nextVarName = function() {
  // run-length encoding of 's
  var indexOfFirst_ = this.name.indexOf("_");
  if (indexOfFirst_ === -1) {
    return this.name+"_1";
  }
  var letters = this.name.substring(0, indexOfFirst_);
  var number = this.name.substring(indexOfFirst_+1, this.name.length);
  var ret = letters+"_"+(parseInt(number)+1);
  return ret;
};

module.exports = {
  Program: Program,
  Rule: Rule,
  Clause: Clause,
  Var: Var,
  Subst: Subst,
};

function IndentingOutputStream() {
  this.baseCols = [0];
  this.lines = [[]];
}

IndentingOutputStream.prototype.indentSpaces = 2;

IndentingOutputStream.prototype._currLine = function() {
  return this.lines[this.lines.length - 1];
};

IndentingOutputStream.prototype.baseCol = function() {
  return this.baseCols[this.baseCols.length - 1];
};

IndentingOutputStream.prototype.indent = function() {
  this.baseCols.push(this.baseCol() + this.indentSpaces);
};

IndentingOutputStream.prototype.indentToHere = function() {
  var currLineLength = this._currLine().join('').length;
  this.baseCols.push(currLineLength);
};

IndentingOutputStream.prototype.indentFromHere = function() {
  var currLineLength = this._currLine().join('').length;
  this.baseCols.push(currLineLength + this.indentSpaces);
};

IndentingOutputStream.prototype.dedent = function() {
  this.baseCols.pop();
};

IndentingOutputStream.prototype.nl = function() {
  var newLine = [];
  for (var idx = 0; idx < this.baseCol(); idx++) {
    newLine.push(' ');
  }
  this.lines.push(newLine);
};

IndentingOutputStream.prototype.write = function(str) {
  this._currLine().push(str);
};

IndentingOutputStream.prototype.contents = function() {
  var lines = this.lines.map(function(line) { return line.join(''); });
  return lines.join('\n');
};
