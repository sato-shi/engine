var References;

References = (function() {
  function References(input, output) {
    this.input = input;
    this.output = output;
    this.output || (this.output = this.input);
  }

  References.prototype.write = function() {
    return this.output.clean.apply(this.output, arguments);
  };

  References.prototype.read = function() {
    return this.set.apply(this, arguments);
  };

  References.prototype.combine = function(path, value) {
    if (typeof object === 'string') {
      return object;
    }
    return continuation + References.get(object);
  };

  References.prototype.set = function(path, value) {
    var old;
    if (value === void 0) {
      old = this[path];
      if (old) {
        return this.clean(path, old);
      }
    } else {
      return this[path] = this.combine(path, value);
    }
  };

  References.prototype.append = function(path, value) {
    var group;
    group = this[path] || (this[path] = []);
    return group.push(this.combine(path, value));
  };

  References.prototype.remove = function(path, value) {
    var group, id, index;
    if (typeof value !== 'string') {
      id = value._gss_id;
      value = this.combine(path, id);
    }
    if (group = this[path]) {
      console.group('remove ' + path);
      delete this[path];
      if (group instanceof Array) {
        if ((index = group.indexOf(value)) > -1) {
          group.splice(index, 1);
          this.write(path, value, id);
        }
      } else {
        this.write(path, value, id);
      }
      return console.groupEnd('remove ' + path);
    }
  };

  References.get = function(object, force) {
    var id;
    id = object && object._gss_id;
    if (!id && force) {
      object._gss_id = id = ++References.uid;
    }
    return id;
  };

  References.uid = 0;

  return References;

})();

module.exports = References;