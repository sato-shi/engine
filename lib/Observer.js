var Observer;

Observer = (function() {
  function Observer(object) {
    this.object = object;
    if (!window.MutationObserver) {
      if (window.WebKitMutationObserver) {
        window.MutationObserver = window.WebKitMutationObserver;
      } else {
        window.MutationObserver = window.JsMutationObserver;
      }
    }
    if (!window.MutationObserver) {
      return;
    }
    this._watchers = {};
    this.listener = new MutationObserver(this.listen.bind(this));
    this.listener.observe(document.body, GSS.config.observerOptions);
  }

  Observer.prototype.match = function(queries, node, group, qualifier, changed) {
    var change, groupped, id, index, indexed, operation, watchers, _i, _j, _len, _len1;
    if (!(id = node._gss_id)) {
      return;
    }
    if (!(watchers = this._watchers[id])) {
      return;
    }
    for (index = _i = 0, _len = watchers.length; _i < _len; index = _i += 2) {
      operation = watchers[index];
      if (groupped = operation[group]) {
        if (qualifier) {
          if (indexed = groupped[qualifier]) {
            if (queries.indexOf(operation) === -1) {
              queries.push(operation, watchers[index + 1]);
            }
          }
        } else {
          for (_j = 0, _len1 = changed.length; _j < _len1; _j++) {
            change = changed[_j];
            if (indexed = groupped[change.tagName] || groupped["*"]) {
              if (queries.indexOf(operation) === -1) {
                queries.push(operation, watchers[index + 1]);
              }
            }
          }
        }
      }
    }
    return this;
  };

  Observer.prototype.set = function(node, result, operation, continuation) {
    var added, child, id, isCollection, old, path, removed, watchers, _base, _i, _j, _len, _len1;
    path = (continuation || '') + operation.path;
    old = this[path];
    if (result === old) {
      return;
    }
    if (id = GSS.setupId(node || this.object.engine.queryScope)) {
      watchers = (_base = this._watchers)[id] || (_base[id] = []);
      if (watchers.indexOf(operation) === -1) {
        watchers.push(operation, continuation);
      }
    }
    isCollection = result && result.length !== void 0;
    if (old && old.length) {
      removed = void 0;
      for (_i = 0, _len = old.length; _i < _len; _i++) {
        child = old[_i];
        if (!result || old.indexOf.call(result, child) === -1) {
          this.object.registry.remove(path, child);
          removed = true;
        }
      }
      if (continuation && (!isCollection || !result.length)) {
        this.object.registry.remove(continuation, path);
      }
    }
    if (isCollection) {
      added = void 0;
      for (_j = 0, _len1 = result.length; _j < _len1; _j++) {
        child = result[_j];
        if (!old || watchers.indexOf.call(old, child) === -1) {
          this.object.registry.append(path, child);
          if (old) {
            (added || (added = [])).push(child);
          }
        }
      }
      if (continuation && (!old || !old.length)) {
        this.object.registry.append(continuation, path);
      }
      if (result && result.item && (!old || removed || added)) {
        result = watchers.slice.call(result, 0);
      }
    } else if (result !== void 0 || old !== void 0) {
      this.object.registry.set(path, result);
    }
    this[path] = result;
    if (result) {
      console.log('found', result.nodeType === 1 && 1 || result.length, ' by', path);
    }
    return added || result;
  };

  Observer.prototype.listen = function(mutations) {
    var allChanged, changed, child, firstNext, firstPrev, index, klasses, kls, mutation, next, old, parent, prev, queries, query, target, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _m, _n, _o, _p, _q, _ref, _ref1;
    queries = [];
    for (_i = 0, _len = mutations.length; _i < _len; _i++) {
      mutation = mutations[_i];
      target = parent = mutation.target;
      switch (mutation.type) {
        case "attributes":
          if (mutation.attributeName === 'class') {
            klasses = parent.classList;
            old = mutation.oldValue.split(' ');
            changed = [];
            for (_j = 0, _len1 = old.length; _j < _len1; _j++) {
              kls = old[_j];
              if (!(kls && klasses.contains(kls))) {
                changed.push(kls);
              }
            }
            for (_k = 0, _len2 = klasses.length; _k < _len2; _k++) {
              kls = klasses[_k];
              if (!(kls && old.contains(kls))) {
                changed.push(kls);
              }
            }
            while (parent.nodeType === 1) {
              for (_l = 0, _len3 = changed.length; _l < _len3; _l++) {
                kls = changed[_l];
                this.match(queries, parent, '$class', kls, target);
              }
              parent = parent.parentNode;
            }
            parent = target;
          }
          while (parent.nodeType === 1) {
            this.match(queries, parent, '$attribute', mutation.attributeName, target);
            parent = parent.parentNode;
          }
          break;
        case "childList":
          changed = [];
          _ref = mutation.addedNodes;
          for (_m = 0, _len4 = _ref.length; _m < _len4; _m++) {
            child = _ref[_m];
            if (child.nodeType === 1) {
              changed.push(child);
            }
          }
          _ref1 = mutation.removedNodes;
          for (_n = 0, _len5 = _ref1.length; _n < _len5; _n++) {
            child = _ref1[_n];
            if (child.nodeType === 1) {
              changed.push(child);
            }
          }
          prev = next = mutation;
          firstPrev = firstNext = true;
          while ((prev = prev.previousSibling)) {
            if (prev.nodeType === 1) {
              if (firstPrev) {
                this.match(queries, prev, '+');
                this.match(queries, prev, '++');
                firstPrev = false;
              }
              this.match(queries, prev, '~', void 0, changed);
              this.match(queries, prev, '~~', void 0, changed);
            }
          }
          while ((next = next.nextSibling)) {
            if (next.nodeType === 1) {
              if (firstNext) {
                this.match(queries, next, '!+');
                this.match(queries, next, '++');
                firstNext = false;
              }
              this.match(queries, next, '!~', void 0, changed);
              this.match(queries, next, '~~', void 0, changed);
            }
          }
          this.match(queries, parent, '>', void 0, changed);
          allChanged = [];
          for (_o = 0, _len6 = changed.length; _o < _len6; _o++) {
            child = changed[_o];
            this.match(queries, child, '!>', void 0, parent);
            allChanged.push(child);
            allChanged.push.apply(allChanged, void 0, child.getElementsByTagName('*'));
          }
          while (parent && parent.nodeType === 1) {
            this.match(queries, parent, ' ', void 0, allChanged);
            for (_p = 0, _len7 = allChanged.length; _p < _len7; _p++) {
              child = allChanged[_p];
              prev = child;
              while (prev = prev.previousSibling) {
                if (prev.nodeType === 1) {
                  this.match(queries, parent, ' +', void 0, prev);
                  break;
                }
              }
              this.match(queries, parent, ' +', void 0, child);
              this.match(queries, child, '!', void 0, parent);
            }
            parent = parent.parentNode;
          }
      }
    }
    for (index = _q = 0, _len8 = queries.length; _q < _len8; index = _q += 2) {
      query = queries[index];
      this.object.evaluate(query, void 0, queries[index + 1]);
    }
    this.object.engine.dispatch('solved');
    return true;
  };

  return Observer;

})();

module.exports = Observer;