require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 *  Copyright (c) 2014-2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Immutable = factory());
}(this, function () { 'use strict';var SLICE$0 = Array.prototype.slice;

  function createClass(ctor, superClass) {
    if (superClass) {
      ctor.prototype = Object.create(superClass.prototype);
    }
    ctor.prototype.constructor = ctor;
  }

  function Iterable(value) {
      return isIterable(value) ? value : Seq(value);
    }


  createClass(KeyedIterable, Iterable);
    function KeyedIterable(value) {
      return isKeyed(value) ? value : KeyedSeq(value);
    }


  createClass(IndexedIterable, Iterable);
    function IndexedIterable(value) {
      return isIndexed(value) ? value : IndexedSeq(value);
    }


  createClass(SetIterable, Iterable);
    function SetIterable(value) {
      return isIterable(value) && !isAssociative(value) ? value : SetSeq(value);
    }



  function isIterable(maybeIterable) {
    return !!(maybeIterable && maybeIterable[IS_ITERABLE_SENTINEL]);
  }

  function isKeyed(maybeKeyed) {
    return !!(maybeKeyed && maybeKeyed[IS_KEYED_SENTINEL]);
  }

  function isIndexed(maybeIndexed) {
    return !!(maybeIndexed && maybeIndexed[IS_INDEXED_SENTINEL]);
  }

  function isAssociative(maybeAssociative) {
    return isKeyed(maybeAssociative) || isIndexed(maybeAssociative);
  }

  function isOrdered(maybeOrdered) {
    return !!(maybeOrdered && maybeOrdered[IS_ORDERED_SENTINEL]);
  }

  Iterable.isIterable = isIterable;
  Iterable.isKeyed = isKeyed;
  Iterable.isIndexed = isIndexed;
  Iterable.isAssociative = isAssociative;
  Iterable.isOrdered = isOrdered;

  Iterable.Keyed = KeyedIterable;
  Iterable.Indexed = IndexedIterable;
  Iterable.Set = SetIterable;


  var IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
  var IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
  var IS_INDEXED_SENTINEL = '@@__IMMUTABLE_INDEXED__@@';
  var IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';

  // Used for setting prototype methods that IE8 chokes on.
  var DELETE = 'delete';

  // Constants describing the size of trie nodes.
  var SHIFT = 5; // Resulted in best performance after ______?
  var SIZE = 1 << SHIFT;
  var MASK = SIZE - 1;

  // A consistent shared value representing "not set" which equals nothing other
  // than itself, and nothing that could be provided externally.
  var NOT_SET = {};

  // Boolean references, Rough equivalent of `bool &`.
  var CHANGE_LENGTH = { value: false };
  var DID_ALTER = { value: false };

  function MakeRef(ref) {
    ref.value = false;
    return ref;
  }

  function SetRef(ref) {
    ref && (ref.value = true);
  }

  // A function which returns a value representing an "owner" for transient writes
  // to tries. The return value will only ever equal itself, and will not equal
  // the return of any subsequent call of this function.
  function OwnerID() {}

  // http://jsperf.com/copy-array-inline
  function arrCopy(arr, offset) {
    offset = offset || 0;
    var len = Math.max(0, arr.length - offset);
    var newArr = new Array(len);
    for (var ii = 0; ii < len; ii++) {
      newArr[ii] = arr[ii + offset];
    }
    return newArr;
  }

  function ensureSize(iter) {
    if (iter.size === undefined) {
      iter.size = iter.__iterate(returnTrue);
    }
    return iter.size;
  }

  function wrapIndex(iter, index) {
    // This implements "is array index" which the ECMAString spec defines as:
    //
    //     A String property name P is an array index if and only if
    //     ToString(ToUint32(P)) is equal to P and ToUint32(P) is not equal
    //     to 2^32−1.
    //
    // http://www.ecma-international.org/ecma-262/6.0/#sec-array-exotic-objects
    if (typeof index !== 'number') {
      var uint32Index = index >>> 0; // N >>> 0 is shorthand for ToUint32
      if ('' + uint32Index !== index || uint32Index === 4294967295) {
        return NaN;
      }
      index = uint32Index;
    }
    return index < 0 ? ensureSize(iter) + index : index;
  }

  function returnTrue() {
    return true;
  }

  function wholeSlice(begin, end, size) {
    return (begin === 0 || (size !== undefined && begin <= -size)) &&
      (end === undefined || (size !== undefined && end >= size));
  }

  function resolveBegin(begin, size) {
    return resolveIndex(begin, size, 0);
  }

  function resolveEnd(end, size) {
    return resolveIndex(end, size, size);
  }

  function resolveIndex(index, size, defaultIndex) {
    return index === undefined ?
      defaultIndex :
      index < 0 ?
        Math.max(0, size + index) :
        size === undefined ?
          index :
          Math.min(size, index);
  }

  /* global Symbol */

  var ITERATE_KEYS = 0;
  var ITERATE_VALUES = 1;
  var ITERATE_ENTRIES = 2;

  var REAL_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
  var FAUX_ITERATOR_SYMBOL = '@@iterator';

  var ITERATOR_SYMBOL = REAL_ITERATOR_SYMBOL || FAUX_ITERATOR_SYMBOL;


  function Iterator(next) {
      this.next = next;
    }

    Iterator.prototype.toString = function() {
      return '[Iterator]';
    };


  Iterator.KEYS = ITERATE_KEYS;
  Iterator.VALUES = ITERATE_VALUES;
  Iterator.ENTRIES = ITERATE_ENTRIES;

  Iterator.prototype.inspect =
  Iterator.prototype.toSource = function () { return this.toString(); }
  Iterator.prototype[ITERATOR_SYMBOL] = function () {
    return this;
  };


  function iteratorValue(type, k, v, iteratorResult) {
    var value = type === 0 ? k : type === 1 ? v : [k, v];
    iteratorResult ? (iteratorResult.value = value) : (iteratorResult = {
      value: value, done: false
    });
    return iteratorResult;
  }

  function iteratorDone() {
    return { value: undefined, done: true };
  }

  function hasIterator(maybeIterable) {
    return !!getIteratorFn(maybeIterable);
  }

  function isIterator(maybeIterator) {
    return maybeIterator && typeof maybeIterator.next === 'function';
  }

  function getIterator(iterable) {
    var iteratorFn = getIteratorFn(iterable);
    return iteratorFn && iteratorFn.call(iterable);
  }

  function getIteratorFn(iterable) {
    var iteratorFn = iterable && (
      (REAL_ITERATOR_SYMBOL && iterable[REAL_ITERATOR_SYMBOL]) ||
      iterable[FAUX_ITERATOR_SYMBOL]
    );
    if (typeof iteratorFn === 'function') {
      return iteratorFn;
    }
  }

  function isArrayLike(value) {
    return value && typeof value.length === 'number';
  }

  createClass(Seq, Iterable);
    function Seq(value) {
      return value === null || value === undefined ? emptySequence() :
        isIterable(value) ? value.toSeq() : seqFromValue(value);
    }

    Seq.of = function(/*...values*/) {
      return Seq(arguments);
    };

    Seq.prototype.toSeq = function() {
      return this;
    };

    Seq.prototype.toString = function() {
      return this.__toString('Seq {', '}');
    };

    Seq.prototype.cacheResult = function() {
      if (!this._cache && this.__iterateUncached) {
        this._cache = this.entrySeq().toArray();
        this.size = this._cache.length;
      }
      return this;
    };

    // abstract __iterateUncached(fn, reverse)

    Seq.prototype.__iterate = function(fn, reverse) {
      return seqIterate(this, fn, reverse, true);
    };

    // abstract __iteratorUncached(type, reverse)

    Seq.prototype.__iterator = function(type, reverse) {
      return seqIterator(this, type, reverse, true);
    };



  createClass(KeyedSeq, Seq);
    function KeyedSeq(value) {
      return value === null || value === undefined ?
        emptySequence().toKeyedSeq() :
        isIterable(value) ?
          (isKeyed(value) ? value.toSeq() : value.fromEntrySeq()) :
          keyedSeqFromValue(value);
    }

    KeyedSeq.prototype.toKeyedSeq = function() {
      return this;
    };



  createClass(IndexedSeq, Seq);
    function IndexedSeq(value) {
      return value === null || value === undefined ? emptySequence() :
        !isIterable(value) ? indexedSeqFromValue(value) :
        isKeyed(value) ? value.entrySeq() : value.toIndexedSeq();
    }

    IndexedSeq.of = function(/*...values*/) {
      return IndexedSeq(arguments);
    };

    IndexedSeq.prototype.toIndexedSeq = function() {
      return this;
    };

    IndexedSeq.prototype.toString = function() {
      return this.__toString('Seq [', ']');
    };

    IndexedSeq.prototype.__iterate = function(fn, reverse) {
      return seqIterate(this, fn, reverse, false);
    };

    IndexedSeq.prototype.__iterator = function(type, reverse) {
      return seqIterator(this, type, reverse, false);
    };



  createClass(SetSeq, Seq);
    function SetSeq(value) {
      return (
        value === null || value === undefined ? emptySequence() :
        !isIterable(value) ? indexedSeqFromValue(value) :
        isKeyed(value) ? value.entrySeq() : value
      ).toSetSeq();
    }

    SetSeq.of = function(/*...values*/) {
      return SetSeq(arguments);
    };

    SetSeq.prototype.toSetSeq = function() {
      return this;
    };



  Seq.isSeq = isSeq;
  Seq.Keyed = KeyedSeq;
  Seq.Set = SetSeq;
  Seq.Indexed = IndexedSeq;

  var IS_SEQ_SENTINEL = '@@__IMMUTABLE_SEQ__@@';

  Seq.prototype[IS_SEQ_SENTINEL] = true;



  createClass(ArraySeq, IndexedSeq);
    function ArraySeq(array) {
      this._array = array;
      this.size = array.length;
    }

    ArraySeq.prototype.get = function(index, notSetValue) {
      return this.has(index) ? this._array[wrapIndex(this, index)] : notSetValue;
    };

    ArraySeq.prototype.__iterate = function(fn, reverse) {
      var array = this._array;
      var maxIndex = array.length - 1;
      for (var ii = 0; ii <= maxIndex; ii++) {
        if (fn(array[reverse ? maxIndex - ii : ii], ii, this) === false) {
          return ii + 1;
        }
      }
      return ii;
    };

    ArraySeq.prototype.__iterator = function(type, reverse) {
      var array = this._array;
      var maxIndex = array.length - 1;
      var ii = 0;
      return new Iterator(function() 
        {return ii > maxIndex ?
          iteratorDone() :
          iteratorValue(type, ii, array[reverse ? maxIndex - ii++ : ii++])}
      );
    };



  createClass(ObjectSeq, KeyedSeq);
    function ObjectSeq(object) {
      var keys = Object.keys(object);
      this._object = object;
      this._keys = keys;
      this.size = keys.length;
    }

    ObjectSeq.prototype.get = function(key, notSetValue) {
      if (notSetValue !== undefined && !this.has(key)) {
        return notSetValue;
      }
      return this._object[key];
    };

    ObjectSeq.prototype.has = function(key) {
      return this._object.hasOwnProperty(key);
    };

    ObjectSeq.prototype.__iterate = function(fn, reverse) {
      var object = this._object;
      var keys = this._keys;
      var maxIndex = keys.length - 1;
      for (var ii = 0; ii <= maxIndex; ii++) {
        var key = keys[reverse ? maxIndex - ii : ii];
        if (fn(object[key], key, this) === false) {
          return ii + 1;
        }
      }
      return ii;
    };

    ObjectSeq.prototype.__iterator = function(type, reverse) {
      var object = this._object;
      var keys = this._keys;
      var maxIndex = keys.length - 1;
      var ii = 0;
      return new Iterator(function()  {
        var key = keys[reverse ? maxIndex - ii : ii];
        return ii++ > maxIndex ?
          iteratorDone() :
          iteratorValue(type, key, object[key]);
      });
    };

  ObjectSeq.prototype[IS_ORDERED_SENTINEL] = true;


  createClass(IterableSeq, IndexedSeq);
    function IterableSeq(iterable) {
      this._iterable = iterable;
      this.size = iterable.length || iterable.size;
    }

    IterableSeq.prototype.__iterateUncached = function(fn, reverse) {
      if (reverse) {
        return this.cacheResult().__iterate(fn, reverse);
      }
      var iterable = this._iterable;
      var iterator = getIterator(iterable);
      var iterations = 0;
      if (isIterator(iterator)) {
        var step;
        while (!(step = iterator.next()).done) {
          if (fn(step.value, iterations++, this) === false) {
            break;
          }
        }
      }
      return iterations;
    };

    IterableSeq.prototype.__iteratorUncached = function(type, reverse) {
      if (reverse) {
        return this.cacheResult().__iterator(type, reverse);
      }
      var iterable = this._iterable;
      var iterator = getIterator(iterable);
      if (!isIterator(iterator)) {
        return new Iterator(iteratorDone);
      }
      var iterations = 0;
      return new Iterator(function()  {
        var step = iterator.next();
        return step.done ? step : iteratorValue(type, iterations++, step.value);
      });
    };



  createClass(IteratorSeq, IndexedSeq);
    function IteratorSeq(iterator) {
      this._iterator = iterator;
      this._iteratorCache = [];
    }

    IteratorSeq.prototype.__iterateUncached = function(fn, reverse) {
      if (reverse) {
        return this.cacheResult().__iterate(fn, reverse);
      }
      var iterator = this._iterator;
      var cache = this._iteratorCache;
      var iterations = 0;
      while (iterations < cache.length) {
        if (fn(cache[iterations], iterations++, this) === false) {
          return iterations;
        }
      }
      var step;
      while (!(step = iterator.next()).done) {
        var val = step.value;
        cache[iterations] = val;
        if (fn(val, iterations++, this) === false) {
          break;
        }
      }
      return iterations;
    };

    IteratorSeq.prototype.__iteratorUncached = function(type, reverse) {
      if (reverse) {
        return this.cacheResult().__iterator(type, reverse);
      }
      var iterator = this._iterator;
      var cache = this._iteratorCache;
      var iterations = 0;
      return new Iterator(function()  {
        if (iterations >= cache.length) {
          var step = iterator.next();
          if (step.done) {
            return step;
          }
          cache[iterations] = step.value;
        }
        return iteratorValue(type, iterations, cache[iterations++]);
      });
    };




  // # pragma Helper functions

  function isSeq(maybeSeq) {
    return !!(maybeSeq && maybeSeq[IS_SEQ_SENTINEL]);
  }

  var EMPTY_SEQ;

  function emptySequence() {
    return EMPTY_SEQ || (EMPTY_SEQ = new ArraySeq([]));
  }

  function keyedSeqFromValue(value) {
    var seq =
      Array.isArray(value) ? new ArraySeq(value).fromEntrySeq() :
      isIterator(value) ? new IteratorSeq(value).fromEntrySeq() :
      hasIterator(value) ? new IterableSeq(value).fromEntrySeq() :
      typeof value === 'object' ? new ObjectSeq(value) :
      undefined;
    if (!seq) {
      throw new TypeError(
        'Expected Array or iterable object of [k, v] entries, '+
        'or keyed object: ' + value
      );
    }
    return seq;
  }

  function indexedSeqFromValue(value) {
    var seq = maybeIndexedSeqFromValue(value);
    if (!seq) {
      throw new TypeError(
        'Expected Array or iterable object of values: ' + value
      );
    }
    return seq;
  }

  function seqFromValue(value) {
    var seq = maybeIndexedSeqFromValue(value) ||
      (typeof value === 'object' && new ObjectSeq(value));
    if (!seq) {
      throw new TypeError(
        'Expected Array or iterable object of values, or keyed object: ' + value
      );
    }
    return seq;
  }

  function maybeIndexedSeqFromValue(value) {
    return (
      isArrayLike(value) ? new ArraySeq(value) :
      isIterator(value) ? new IteratorSeq(value) :
      hasIterator(value) ? new IterableSeq(value) :
      undefined
    );
  }

  function seqIterate(seq, fn, reverse, useKeys) {
    var cache = seq._cache;
    if (cache) {
      var maxIndex = cache.length - 1;
      for (var ii = 0; ii <= maxIndex; ii++) {
        var entry = cache[reverse ? maxIndex - ii : ii];
        if (fn(entry[1], useKeys ? entry[0] : ii, seq) === false) {
          return ii + 1;
        }
      }
      return ii;
    }
    return seq.__iterateUncached(fn, reverse);
  }

  function seqIterator(seq, type, reverse, useKeys) {
    var cache = seq._cache;
    if (cache) {
      var maxIndex = cache.length - 1;
      var ii = 0;
      return new Iterator(function()  {
        var entry = cache[reverse ? maxIndex - ii : ii];
        return ii++ > maxIndex ?
          iteratorDone() :
          iteratorValue(type, useKeys ? entry[0] : ii - 1, entry[1]);
      });
    }
    return seq.__iteratorUncached(type, reverse);
  }

  function fromJS(json, converter) {
    return converter ?
      fromJSWith(converter, json, '', {'': json}) :
      fromJSDefault(json);
  }

  function fromJSWith(converter, json, key, parentJSON) {
    if (Array.isArray(json)) {
      return converter.call(parentJSON, key, IndexedSeq(json).map(function(v, k)  {return fromJSWith(converter, v, k, json)}));
    }
    if (isPlainObj(json)) {
      return converter.call(parentJSON, key, KeyedSeq(json).map(function(v, k)  {return fromJSWith(converter, v, k, json)}));
    }
    return json;
  }

  function fromJSDefault(json) {
    if (Array.isArray(json)) {
      return IndexedSeq(json).map(fromJSDefault).toList();
    }
    if (isPlainObj(json)) {
      return KeyedSeq(json).map(fromJSDefault).toMap();
    }
    return json;
  }

  function isPlainObj(value) {
    return value && (value.constructor === Object || value.constructor === undefined);
  }

  /**
   * An extension of the "same-value" algorithm as [described for use by ES6 Map
   * and Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#Key_equality)
   *
   * NaN is considered the same as NaN, however -0 and 0 are considered the same
   * value, which is different from the algorithm described by
   * [`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is).
   *
   * This is extended further to allow Objects to describe the values they
   * represent, by way of `valueOf` or `equals` (and `hashCode`).
   *
   * Note: because of this extension, the key equality of Immutable.Map and the
   * value equality of Immutable.Set will differ from ES6 Map and Set.
   *
   * ### Defining custom values
   *
   * The easiest way to describe the value an object represents is by implementing
   * `valueOf`. For example, `Date` represents a value by returning a unix
   * timestamp for `valueOf`:
   *
   *     var date1 = new Date(1234567890000); // Fri Feb 13 2009 ...
   *     var date2 = new Date(1234567890000);
   *     date1.valueOf(); // 1234567890000
   *     assert( date1 !== date2 );
   *     assert( Immutable.is( date1, date2 ) );
   *
   * Note: overriding `valueOf` may have other implications if you use this object
   * where JavaScript expects a primitive, such as implicit string coercion.
   *
   * For more complex types, especially collections, implementing `valueOf` may
   * not be performant. An alternative is to implement `equals` and `hashCode`.
   *
   * `equals` takes another object, presumably of similar type, and returns true
   * if the it is equal. Equality is symmetrical, so the same result should be
   * returned if this and the argument are flipped.
   *
   *     assert( a.equals(b) === b.equals(a) );
   *
   * `hashCode` returns a 32bit integer number representing the object which will
   * be used to determine how to store the value object in a Map or Set. You must
   * provide both or neither methods, one must not exist without the other.
   *
   * Also, an important relationship between these methods must be upheld: if two
   * values are equal, they *must* return the same hashCode. If the values are not
   * equal, they might have the same hashCode; this is called a hash collision,
   * and while undesirable for performance reasons, it is acceptable.
   *
   *     if (a.equals(b)) {
   *       assert( a.hashCode() === b.hashCode() );
   *     }
   *
   * All Immutable collections implement `equals` and `hashCode`.
   *
   */
  function is(valueA, valueB) {
    if (valueA === valueB || (valueA !== valueA && valueB !== valueB)) {
      return true;
    }
    if (!valueA || !valueB) {
      return false;
    }
    if (typeof valueA.valueOf === 'function' &&
        typeof valueB.valueOf === 'function') {
      valueA = valueA.valueOf();
      valueB = valueB.valueOf();
      if (valueA === valueB || (valueA !== valueA && valueB !== valueB)) {
        return true;
      }
      if (!valueA || !valueB) {
        return false;
      }
    }
    if (typeof valueA.equals === 'function' &&
        typeof valueB.equals === 'function' &&
        valueA.equals(valueB)) {
      return true;
    }
    return false;
  }

  function deepEqual(a, b) {
    if (a === b) {
      return true;
    }

    if (
      !isIterable(b) ||
      a.size !== undefined && b.size !== undefined && a.size !== b.size ||
      a.__hash !== undefined && b.__hash !== undefined && a.__hash !== b.__hash ||
      isKeyed(a) !== isKeyed(b) ||
      isIndexed(a) !== isIndexed(b) ||
      isOrdered(a) !== isOrdered(b)
    ) {
      return false;
    }

    if (a.size === 0 && b.size === 0) {
      return true;
    }

    var notAssociative = !isAssociative(a);

    if (isOrdered(a)) {
      var entries = a.entries();
      return b.every(function(v, k)  {
        var entry = entries.next().value;
        return entry && is(entry[1], v) && (notAssociative || is(entry[0], k));
      }) && entries.next().done;
    }

    var flipped = false;

    if (a.size === undefined) {
      if (b.size === undefined) {
        if (typeof a.cacheResult === 'function') {
          a.cacheResult();
        }
      } else {
        flipped = true;
        var _ = a;
        a = b;
        b = _;
      }
    }

    var allEqual = true;
    var bSize = b.__iterate(function(v, k)  {
      if (notAssociative ? !a.has(v) :
          flipped ? !is(v, a.get(k, NOT_SET)) : !is(a.get(k, NOT_SET), v)) {
        allEqual = false;
        return false;
      }
    });

    return allEqual && a.size === bSize;
  }

  createClass(Repeat, IndexedSeq);

    function Repeat(value, times) {
      if (!(this instanceof Repeat)) {
        return new Repeat(value, times);
      }
      this._value = value;
      this.size = times === undefined ? Infinity : Math.max(0, times);
      if (this.size === 0) {
        if (EMPTY_REPEAT) {
          return EMPTY_REPEAT;
        }
        EMPTY_REPEAT = this;
      }
    }

    Repeat.prototype.toString = function() {
      if (this.size === 0) {
        return 'Repeat []';
      }
      return 'Repeat [ ' + this._value + ' ' + this.size + ' times ]';
    };

    Repeat.prototype.get = function(index, notSetValue) {
      return this.has(index) ? this._value : notSetValue;
    };

    Repeat.prototype.includes = function(searchValue) {
      return is(this._value, searchValue);
    };

    Repeat.prototype.slice = function(begin, end) {
      var size = this.size;
      return wholeSlice(begin, end, size) ? this :
        new Repeat(this._value, resolveEnd(end, size) - resolveBegin(begin, size));
    };

    Repeat.prototype.reverse = function() {
      return this;
    };

    Repeat.prototype.indexOf = function(searchValue) {
      if (is(this._value, searchValue)) {
        return 0;
      }
      return -1;
    };

    Repeat.prototype.lastIndexOf = function(searchValue) {
      if (is(this._value, searchValue)) {
        return this.size;
      }
      return -1;
    };

    Repeat.prototype.__iterate = function(fn, reverse) {
      for (var ii = 0; ii < this.size; ii++) {
        if (fn(this._value, ii, this) === false) {
          return ii + 1;
        }
      }
      return ii;
    };

    Repeat.prototype.__iterator = function(type, reverse) {var this$0 = this;
      var ii = 0;
      return new Iterator(function() 
        {return ii < this$0.size ? iteratorValue(type, ii++, this$0._value) : iteratorDone()}
      );
    };

    Repeat.prototype.equals = function(other) {
      return other instanceof Repeat ?
        is(this._value, other._value) :
        deepEqual(other);
    };


  var EMPTY_REPEAT;

  function invariant(condition, error) {
    if (!condition) throw new Error(error);
  }

  createClass(Range, IndexedSeq);

    function Range(start, end, step) {
      if (!(this instanceof Range)) {
        return new Range(start, end, step);
      }
      invariant(step !== 0, 'Cannot step a Range by 0');
      start = start || 0;
      if (end === undefined) {
        end = Infinity;
      }
      step = step === undefined ? 1 : Math.abs(step);
      if (end < start) {
        step = -step;
      }
      this._start = start;
      this._end = end;
      this._step = step;
      this.size = Math.max(0, Math.ceil((end - start) / step - 1) + 1);
      if (this.size === 0) {
        if (EMPTY_RANGE) {
          return EMPTY_RANGE;
        }
        EMPTY_RANGE = this;
      }
    }

    Range.prototype.toString = function() {
      if (this.size === 0) {
        return 'Range []';
      }
      return 'Range [ ' +
        this._start + '...' + this._end +
        (this._step !== 1 ? ' by ' + this._step : '') +
      ' ]';
    };

    Range.prototype.get = function(index, notSetValue) {
      return this.has(index) ?
        this._start + wrapIndex(this, index) * this._step :
        notSetValue;
    };

    Range.prototype.includes = function(searchValue) {
      var possibleIndex = (searchValue - this._start) / this._step;
      return possibleIndex >= 0 &&
        possibleIndex < this.size &&
        possibleIndex === Math.floor(possibleIndex);
    };

    Range.prototype.slice = function(begin, end) {
      if (wholeSlice(begin, end, this.size)) {
        return this;
      }
      begin = resolveBegin(begin, this.size);
      end = resolveEnd(end, this.size);
      if (end <= begin) {
        return new Range(0, 0);
      }
      return new Range(this.get(begin, this._end), this.get(end, this._end), this._step);
    };

    Range.prototype.indexOf = function(searchValue) {
      var offsetValue = searchValue - this._start;
      if (offsetValue % this._step === 0) {
        var index = offsetValue / this._step;
        if (index >= 0 && index < this.size) {
          return index
        }
      }
      return -1;
    };

    Range.prototype.lastIndexOf = function(searchValue) {
      return this.indexOf(searchValue);
    };

    Range.prototype.__iterate = function(fn, reverse) {
      var maxIndex = this.size - 1;
      var step = this._step;
      var value = reverse ? this._start + maxIndex * step : this._start;
      for (var ii = 0; ii <= maxIndex; ii++) {
        if (fn(value, ii, this) === false) {
          return ii + 1;
        }
        value += reverse ? -step : step;
      }
      return ii;
    };

    Range.prototype.__iterator = function(type, reverse) {
      var maxIndex = this.size - 1;
      var step = this._step;
      var value = reverse ? this._start + maxIndex * step : this._start;
      var ii = 0;
      return new Iterator(function()  {
        var v = value;
        value += reverse ? -step : step;
        return ii > maxIndex ? iteratorDone() : iteratorValue(type, ii++, v);
      });
    };

    Range.prototype.equals = function(other) {
      return other instanceof Range ?
        this._start === other._start &&
        this._end === other._end &&
        this._step === other._step :
        deepEqual(this, other);
    };


  var EMPTY_RANGE;

  createClass(Collection, Iterable);
    function Collection() {
      throw TypeError('Abstract');
    }


  createClass(KeyedCollection, Collection);function KeyedCollection() {}

  createClass(IndexedCollection, Collection);function IndexedCollection() {}

  createClass(SetCollection, Collection);function SetCollection() {}


  Collection.Keyed = KeyedCollection;
  Collection.Indexed = IndexedCollection;
  Collection.Set = SetCollection;

  var imul =
    typeof Math.imul === 'function' && Math.imul(0xffffffff, 2) === -2 ?
    Math.imul :
    function imul(a, b) {
      a = a | 0; // int
      b = b | 0; // int
      var c = a & 0xffff;
      var d = b & 0xffff;
      // Shift by 0 fixes the sign on the high part.
      return (c * d) + ((((a >>> 16) * d + c * (b >>> 16)) << 16) >>> 0) | 0; // int
    };

  // v8 has an optimization for storing 31-bit signed numbers.
  // Values which have either 00 or 11 as the high order bits qualify.
  // This function drops the highest order bit in a signed number, maintaining
  // the sign bit.
  function smi(i32) {
    return ((i32 >>> 1) & 0x40000000) | (i32 & 0xBFFFFFFF);
  }

  function hash(o) {
    if (o === false || o === null || o === undefined) {
      return 0;
    }
    if (typeof o.valueOf === 'function') {
      o = o.valueOf();
      if (o === false || o === null || o === undefined) {
        return 0;
      }
    }
    if (o === true) {
      return 1;
    }
    var type = typeof o;
    if (type === 'number') {
      if (o !== o || o === Infinity) {
        return 0;
      }
      var h = o | 0;
      if (h !== o) {
        h ^= o * 0xFFFFFFFF;
      }
      while (o > 0xFFFFFFFF) {
        o /= 0xFFFFFFFF;
        h ^= o;
      }
      return smi(h);
    }
    if (type === 'string') {
      return o.length > STRING_HASH_CACHE_MIN_STRLEN ? cachedHashString(o) : hashString(o);
    }
    if (typeof o.hashCode === 'function') {
      return o.hashCode();
    }
    if (type === 'object') {
      return hashJSObj(o);
    }
    if (typeof o.toString === 'function') {
      return hashString(o.toString());
    }
    throw new Error('Value type ' + type + ' cannot be hashed.');
  }

  function cachedHashString(string) {
    var hash = stringHashCache[string];
    if (hash === undefined) {
      hash = hashString(string);
      if (STRING_HASH_CACHE_SIZE === STRING_HASH_CACHE_MAX_SIZE) {
        STRING_HASH_CACHE_SIZE = 0;
        stringHashCache = {};
      }
      STRING_HASH_CACHE_SIZE++;
      stringHashCache[string] = hash;
    }
    return hash;
  }

  // http://jsperf.com/hashing-strings
  function hashString(string) {
    // This is the hash from JVM
    // The hash code for a string is computed as
    // s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
    // where s[i] is the ith character of the string and n is the length of
    // the string. We "mod" the result to make it between 0 (inclusive) and 2^31
    // (exclusive) by dropping high bits.
    var hash = 0;
    for (var ii = 0; ii < string.length; ii++) {
      hash = 31 * hash + string.charCodeAt(ii) | 0;
    }
    return smi(hash);
  }

  function hashJSObj(obj) {
    var hash;
    if (usingWeakMap) {
      hash = weakMap.get(obj);
      if (hash !== undefined) {
        return hash;
      }
    }

    hash = obj[UID_HASH_KEY];
    if (hash !== undefined) {
      return hash;
    }

    if (!canDefineProperty) {
      hash = obj.propertyIsEnumerable && obj.propertyIsEnumerable[UID_HASH_KEY];
      if (hash !== undefined) {
        return hash;
      }

      hash = getIENodeHash(obj);
      if (hash !== undefined) {
        return hash;
      }
    }

    hash = ++objHashUID;
    if (objHashUID & 0x40000000) {
      objHashUID = 0;
    }

    if (usingWeakMap) {
      weakMap.set(obj, hash);
    } else if (isExtensible !== undefined && isExtensible(obj) === false) {
      throw new Error('Non-extensible objects are not allowed as keys.');
    } else if (canDefineProperty) {
      Object.defineProperty(obj, UID_HASH_KEY, {
        'enumerable': false,
        'configurable': false,
        'writable': false,
        'value': hash
      });
    } else if (obj.propertyIsEnumerable !== undefined &&
               obj.propertyIsEnumerable === obj.constructor.prototype.propertyIsEnumerable) {
      // Since we can't define a non-enumerable property on the object
      // we'll hijack one of the less-used non-enumerable properties to
      // save our hash on it. Since this is a function it will not show up in
      // `JSON.stringify` which is what we want.
      obj.propertyIsEnumerable = function() {
        return this.constructor.prototype.propertyIsEnumerable.apply(this, arguments);
      };
      obj.propertyIsEnumerable[UID_HASH_KEY] = hash;
    } else if (obj.nodeType !== undefined) {
      // At this point we couldn't get the IE `uniqueID` to use as a hash
      // and we couldn't use a non-enumerable property to exploit the
      // dontEnum bug so we simply add the `UID_HASH_KEY` on the node
      // itself.
      obj[UID_HASH_KEY] = hash;
    } else {
      throw new Error('Unable to set a non-enumerable property on object.');
    }

    return hash;
  }

  // Get references to ES5 object methods.
  var isExtensible = Object.isExtensible;

  // True if Object.defineProperty works as expected. IE8 fails this test.
  var canDefineProperty = (function() {
    try {
      Object.defineProperty({}, '@', {});
      return true;
    } catch (e) {
      return false;
    }
  }());

  // IE has a `uniqueID` property on DOM nodes. We can construct the hash from it
  // and avoid memory leaks from the IE cloneNode bug.
  function getIENodeHash(node) {
    if (node && node.nodeType > 0) {
      switch (node.nodeType) {
        case 1: // Element
          return node.uniqueID;
        case 9: // Document
          return node.documentElement && node.documentElement.uniqueID;
      }
    }
  }

  // If possible, use a WeakMap.
  var usingWeakMap = typeof WeakMap === 'function';
  var weakMap;
  if (usingWeakMap) {
    weakMap = new WeakMap();
  }

  var objHashUID = 0;

  var UID_HASH_KEY = '__immutablehash__';
  if (typeof Symbol === 'function') {
    UID_HASH_KEY = Symbol(UID_HASH_KEY);
  }

  var STRING_HASH_CACHE_MIN_STRLEN = 16;
  var STRING_HASH_CACHE_MAX_SIZE = 255;
  var STRING_HASH_CACHE_SIZE = 0;
  var stringHashCache = {};

  function assertNotInfinite(size) {
    invariant(
      size !== Infinity,
      'Cannot perform this action with an infinite size.'
    );
  }

  createClass(Map, KeyedCollection);

    // @pragma Construction

    function Map(value) {
      return value === null || value === undefined ? emptyMap() :
        isMap(value) && !isOrdered(value) ? value :
        emptyMap().withMutations(function(map ) {
          var iter = KeyedIterable(value);
          assertNotInfinite(iter.size);
          iter.forEach(function(v, k)  {return map.set(k, v)});
        });
    }

    Map.of = function() {var keyValues = SLICE$0.call(arguments, 0);
      return emptyMap().withMutations(function(map ) {
        for (var i = 0; i < keyValues.length; i += 2) {
          if (i + 1 >= keyValues.length) {
            throw new Error('Missing value for key: ' + keyValues[i]);
          }
          map.set(keyValues[i], keyValues[i + 1]);
        }
      });
    };

    Map.prototype.toString = function() {
      return this.__toString('Map {', '}');
    };

    // @pragma Access

    Map.prototype.get = function(k, notSetValue) {
      return this._root ?
        this._root.get(0, undefined, k, notSetValue) :
        notSetValue;
    };

    // @pragma Modification

    Map.prototype.set = function(k, v) {
      return updateMap(this, k, v);
    };

    Map.prototype.setIn = function(keyPath, v) {
      return this.updateIn(keyPath, NOT_SET, function()  {return v});
    };

    Map.prototype.remove = function(k) {
      return updateMap(this, k, NOT_SET);
    };

    Map.prototype.deleteIn = function(keyPath) {
      return this.updateIn(keyPath, function()  {return NOT_SET});
    };

    Map.prototype.update = function(k, notSetValue, updater) {
      return arguments.length === 1 ?
        k(this) :
        this.updateIn([k], notSetValue, updater);
    };

    Map.prototype.updateIn = function(keyPath, notSetValue, updater) {
      if (!updater) {
        updater = notSetValue;
        notSetValue = undefined;
      }
      var updatedValue = updateInDeepMap(
        this,
        forceIterator(keyPath),
        notSetValue,
        updater
      );
      return updatedValue === NOT_SET ? undefined : updatedValue;
    };

    Map.prototype.clear = function() {
      if (this.size === 0) {
        return this;
      }
      if (this.__ownerID) {
        this.size = 0;
        this._root = null;
        this.__hash = undefined;
        this.__altered = true;
        return this;
      }
      return emptyMap();
    };

    // @pragma Composition

    Map.prototype.merge = function(/*...iters*/) {
      return mergeIntoMapWith(this, undefined, arguments);
    };

    Map.prototype.mergeWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
      return mergeIntoMapWith(this, merger, iters);
    };

    Map.prototype.mergeIn = function(keyPath) {var iters = SLICE$0.call(arguments, 1);
      return this.updateIn(
        keyPath,
        emptyMap(),
        function(m ) {return typeof m.merge === 'function' ?
          m.merge.apply(m, iters) :
          iters[iters.length - 1]}
      );
    };

    Map.prototype.mergeDeep = function(/*...iters*/) {
      return mergeIntoMapWith(this, deepMerger, arguments);
    };

    Map.prototype.mergeDeepWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
      return mergeIntoMapWith(this, deepMergerWith(merger), iters);
    };

    Map.prototype.mergeDeepIn = function(keyPath) {var iters = SLICE$0.call(arguments, 1);
      return this.updateIn(
        keyPath,
        emptyMap(),
        function(m ) {return typeof m.mergeDeep === 'function' ?
          m.mergeDeep.apply(m, iters) :
          iters[iters.length - 1]}
      );
    };

    Map.prototype.sort = function(comparator) {
      // Late binding
      return OrderedMap(sortFactory(this, comparator));
    };

    Map.prototype.sortBy = function(mapper, comparator) {
      // Late binding
      return OrderedMap(sortFactory(this, comparator, mapper));
    };

    // @pragma Mutability

    Map.prototype.withMutations = function(fn) {
      var mutable = this.asMutable();
      fn(mutable);
      return mutable.wasAltered() ? mutable.__ensureOwner(this.__ownerID) : this;
    };

    Map.prototype.asMutable = function() {
      return this.__ownerID ? this : this.__ensureOwner(new OwnerID());
    };

    Map.prototype.asImmutable = function() {
      return this.__ensureOwner();
    };

    Map.prototype.wasAltered = function() {
      return this.__altered;
    };

    Map.prototype.__iterator = function(type, reverse) {
      return new MapIterator(this, type, reverse);
    };

    Map.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      var iterations = 0;
      this._root && this._root.iterate(function(entry ) {
        iterations++;
        return fn(entry[1], entry[0], this$0);
      }, reverse);
      return iterations;
    };

    Map.prototype.__ensureOwner = function(ownerID) {
      if (ownerID === this.__ownerID) {
        return this;
      }
      if (!ownerID) {
        this.__ownerID = ownerID;
        this.__altered = false;
        return this;
      }
      return makeMap(this.size, this._root, ownerID, this.__hash);
    };


  function isMap(maybeMap) {
    return !!(maybeMap && maybeMap[IS_MAP_SENTINEL]);
  }

  Map.isMap = isMap;

  var IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@';

  var MapPrototype = Map.prototype;
  MapPrototype[IS_MAP_SENTINEL] = true;
  MapPrototype[DELETE] = MapPrototype.remove;
  MapPrototype.removeIn = MapPrototype.deleteIn;


  // #pragma Trie Nodes



    function ArrayMapNode(ownerID, entries) {
      this.ownerID = ownerID;
      this.entries = entries;
    }

    ArrayMapNode.prototype.get = function(shift, keyHash, key, notSetValue) {
      var entries = this.entries;
      for (var ii = 0, len = entries.length; ii < len; ii++) {
        if (is(key, entries[ii][0])) {
          return entries[ii][1];
        }
      }
      return notSetValue;
    };

    ArrayMapNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
      var removed = value === NOT_SET;

      var entries = this.entries;
      var idx = 0;
      for (var len = entries.length; idx < len; idx++) {
        if (is(key, entries[idx][0])) {
          break;
        }
      }
      var exists = idx < len;

      if (exists ? entries[idx][1] === value : removed) {
        return this;
      }

      SetRef(didAlter);
      (removed || !exists) && SetRef(didChangeSize);

      if (removed && entries.length === 1) {
        return; // undefined
      }

      if (!exists && !removed && entries.length >= MAX_ARRAY_MAP_SIZE) {
        return createNodes(ownerID, entries, key, value);
      }

      var isEditable = ownerID && ownerID === this.ownerID;
      var newEntries = isEditable ? entries : arrCopy(entries);

      if (exists) {
        if (removed) {
          idx === len - 1 ? newEntries.pop() : (newEntries[idx] = newEntries.pop());
        } else {
          newEntries[idx] = [key, value];
        }
      } else {
        newEntries.push([key, value]);
      }

      if (isEditable) {
        this.entries = newEntries;
        return this;
      }

      return new ArrayMapNode(ownerID, newEntries);
    };




    function BitmapIndexedNode(ownerID, bitmap, nodes) {
      this.ownerID = ownerID;
      this.bitmap = bitmap;
      this.nodes = nodes;
    }

    BitmapIndexedNode.prototype.get = function(shift, keyHash, key, notSetValue) {
      if (keyHash === undefined) {
        keyHash = hash(key);
      }
      var bit = (1 << ((shift === 0 ? keyHash : keyHash >>> shift) & MASK));
      var bitmap = this.bitmap;
      return (bitmap & bit) === 0 ? notSetValue :
        this.nodes[popCount(bitmap & (bit - 1))].get(shift + SHIFT, keyHash, key, notSetValue);
    };

    BitmapIndexedNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
      if (keyHash === undefined) {
        keyHash = hash(key);
      }
      var keyHashFrag = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
      var bit = 1 << keyHashFrag;
      var bitmap = this.bitmap;
      var exists = (bitmap & bit) !== 0;

      if (!exists && value === NOT_SET) {
        return this;
      }

      var idx = popCount(bitmap & (bit - 1));
      var nodes = this.nodes;
      var node = exists ? nodes[idx] : undefined;
      var newNode = updateNode(node, ownerID, shift + SHIFT, keyHash, key, value, didChangeSize, didAlter);

      if (newNode === node) {
        return this;
      }

      if (!exists && newNode && nodes.length >= MAX_BITMAP_INDEXED_SIZE) {
        return expandNodes(ownerID, nodes, bitmap, keyHashFrag, newNode);
      }

      if (exists && !newNode && nodes.length === 2 && isLeafNode(nodes[idx ^ 1])) {
        return nodes[idx ^ 1];
      }

      if (exists && newNode && nodes.length === 1 && isLeafNode(newNode)) {
        return newNode;
      }

      var isEditable = ownerID && ownerID === this.ownerID;
      var newBitmap = exists ? newNode ? bitmap : bitmap ^ bit : bitmap | bit;
      var newNodes = exists ? newNode ?
        setIn(nodes, idx, newNode, isEditable) :
        spliceOut(nodes, idx, isEditable) :
        spliceIn(nodes, idx, newNode, isEditable);

      if (isEditable) {
        this.bitmap = newBitmap;
        this.nodes = newNodes;
        return this;
      }

      return new BitmapIndexedNode(ownerID, newBitmap, newNodes);
    };




    function HashArrayMapNode(ownerID, count, nodes) {
      this.ownerID = ownerID;
      this.count = count;
      this.nodes = nodes;
    }

    HashArrayMapNode.prototype.get = function(shift, keyHash, key, notSetValue) {
      if (keyHash === undefined) {
        keyHash = hash(key);
      }
      var idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
      var node = this.nodes[idx];
      return node ? node.get(shift + SHIFT, keyHash, key, notSetValue) : notSetValue;
    };

    HashArrayMapNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
      if (keyHash === undefined) {
        keyHash = hash(key);
      }
      var idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
      var removed = value === NOT_SET;
      var nodes = this.nodes;
      var node = nodes[idx];

      if (removed && !node) {
        return this;
      }

      var newNode = updateNode(node, ownerID, shift + SHIFT, keyHash, key, value, didChangeSize, didAlter);
      if (newNode === node) {
        return this;
      }

      var newCount = this.count;
      if (!node) {
        newCount++;
      } else if (!newNode) {
        newCount--;
        if (newCount < MIN_HASH_ARRAY_MAP_SIZE) {
          return packNodes(ownerID, nodes, newCount, idx);
        }
      }

      var isEditable = ownerID && ownerID === this.ownerID;
      var newNodes = setIn(nodes, idx, newNode, isEditable);

      if (isEditable) {
        this.count = newCount;
        this.nodes = newNodes;
        return this;
      }

      return new HashArrayMapNode(ownerID, newCount, newNodes);
    };




    function HashCollisionNode(ownerID, keyHash, entries) {
      this.ownerID = ownerID;
      this.keyHash = keyHash;
      this.entries = entries;
    }

    HashCollisionNode.prototype.get = function(shift, keyHash, key, notSetValue) {
      var entries = this.entries;
      for (var ii = 0, len = entries.length; ii < len; ii++) {
        if (is(key, entries[ii][0])) {
          return entries[ii][1];
        }
      }
      return notSetValue;
    };

    HashCollisionNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
      if (keyHash === undefined) {
        keyHash = hash(key);
      }

      var removed = value === NOT_SET;

      if (keyHash !== this.keyHash) {
        if (removed) {
          return this;
        }
        SetRef(didAlter);
        SetRef(didChangeSize);
        return mergeIntoNode(this, ownerID, shift, keyHash, [key, value]);
      }

      var entries = this.entries;
      var idx = 0;
      for (var len = entries.length; idx < len; idx++) {
        if (is(key, entries[idx][0])) {
          break;
        }
      }
      var exists = idx < len;

      if (exists ? entries[idx][1] === value : removed) {
        return this;
      }

      SetRef(didAlter);
      (removed || !exists) && SetRef(didChangeSize);

      if (removed && len === 2) {
        return new ValueNode(ownerID, this.keyHash, entries[idx ^ 1]);
      }

      var isEditable = ownerID && ownerID === this.ownerID;
      var newEntries = isEditable ? entries : arrCopy(entries);

      if (exists) {
        if (removed) {
          idx === len - 1 ? newEntries.pop() : (newEntries[idx] = newEntries.pop());
        } else {
          newEntries[idx] = [key, value];
        }
      } else {
        newEntries.push([key, value]);
      }

      if (isEditable) {
        this.entries = newEntries;
        return this;
      }

      return new HashCollisionNode(ownerID, this.keyHash, newEntries);
    };




    function ValueNode(ownerID, keyHash, entry) {
      this.ownerID = ownerID;
      this.keyHash = keyHash;
      this.entry = entry;
    }

    ValueNode.prototype.get = function(shift, keyHash, key, notSetValue) {
      return is(key, this.entry[0]) ? this.entry[1] : notSetValue;
    };

    ValueNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
      var removed = value === NOT_SET;
      var keyMatch = is(key, this.entry[0]);
      if (keyMatch ? value === this.entry[1] : removed) {
        return this;
      }

      SetRef(didAlter);

      if (removed) {
        SetRef(didChangeSize);
        return; // undefined
      }

      if (keyMatch) {
        if (ownerID && ownerID === this.ownerID) {
          this.entry[1] = value;
          return this;
        }
        return new ValueNode(ownerID, this.keyHash, [key, value]);
      }

      SetRef(didChangeSize);
      return mergeIntoNode(this, ownerID, shift, hash(key), [key, value]);
    };



  // #pragma Iterators

  ArrayMapNode.prototype.iterate =
  HashCollisionNode.prototype.iterate = function (fn, reverse) {
    var entries = this.entries;
    for (var ii = 0, maxIndex = entries.length - 1; ii <= maxIndex; ii++) {
      if (fn(entries[reverse ? maxIndex - ii : ii]) === false) {
        return false;
      }
    }
  }

  BitmapIndexedNode.prototype.iterate =
  HashArrayMapNode.prototype.iterate = function (fn, reverse) {
    var nodes = this.nodes;
    for (var ii = 0, maxIndex = nodes.length - 1; ii <= maxIndex; ii++) {
      var node = nodes[reverse ? maxIndex - ii : ii];
      if (node && node.iterate(fn, reverse) === false) {
        return false;
      }
    }
  }

  ValueNode.prototype.iterate = function (fn, reverse) {
    return fn(this.entry);
  }

  createClass(MapIterator, Iterator);

    function MapIterator(map, type, reverse) {
      this._type = type;
      this._reverse = reverse;
      this._stack = map._root && mapIteratorFrame(map._root);
    }

    MapIterator.prototype.next = function() {
      var type = this._type;
      var stack = this._stack;
      while (stack) {
        var node = stack.node;
        var index = stack.index++;
        var maxIndex;
        if (node.entry) {
          if (index === 0) {
            return mapIteratorValue(type, node.entry);
          }
        } else if (node.entries) {
          maxIndex = node.entries.length - 1;
          if (index <= maxIndex) {
            return mapIteratorValue(type, node.entries[this._reverse ? maxIndex - index : index]);
          }
        } else {
          maxIndex = node.nodes.length - 1;
          if (index <= maxIndex) {
            var subNode = node.nodes[this._reverse ? maxIndex - index : index];
            if (subNode) {
              if (subNode.entry) {
                return mapIteratorValue(type, subNode.entry);
              }
              stack = this._stack = mapIteratorFrame(subNode, stack);
            }
            continue;
          }
        }
        stack = this._stack = this._stack.__prev;
      }
      return iteratorDone();
    };


  function mapIteratorValue(type, entry) {
    return iteratorValue(type, entry[0], entry[1]);
  }

  function mapIteratorFrame(node, prev) {
    return {
      node: node,
      index: 0,
      __prev: prev
    };
  }

  function makeMap(size, root, ownerID, hash) {
    var map = Object.create(MapPrototype);
    map.size = size;
    map._root = root;
    map.__ownerID = ownerID;
    map.__hash = hash;
    map.__altered = false;
    return map;
  }

  var EMPTY_MAP;
  function emptyMap() {
    return EMPTY_MAP || (EMPTY_MAP = makeMap(0));
  }

  function updateMap(map, k, v) {
    var newRoot;
    var newSize;
    if (!map._root) {
      if (v === NOT_SET) {
        return map;
      }
      newSize = 1;
      newRoot = new ArrayMapNode(map.__ownerID, [[k, v]]);
    } else {
      var didChangeSize = MakeRef(CHANGE_LENGTH);
      var didAlter = MakeRef(DID_ALTER);
      newRoot = updateNode(map._root, map.__ownerID, 0, undefined, k, v, didChangeSize, didAlter);
      if (!didAlter.value) {
        return map;
      }
      newSize = map.size + (didChangeSize.value ? v === NOT_SET ? -1 : 1 : 0);
    }
    if (map.__ownerID) {
      map.size = newSize;
      map._root = newRoot;
      map.__hash = undefined;
      map.__altered = true;
      return map;
    }
    return newRoot ? makeMap(newSize, newRoot) : emptyMap();
  }

  function updateNode(node, ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
    if (!node) {
      if (value === NOT_SET) {
        return node;
      }
      SetRef(didAlter);
      SetRef(didChangeSize);
      return new ValueNode(ownerID, keyHash, [key, value]);
    }
    return node.update(ownerID, shift, keyHash, key, value, didChangeSize, didAlter);
  }

  function isLeafNode(node) {
    return node.constructor === ValueNode || node.constructor === HashCollisionNode;
  }

  function mergeIntoNode(node, ownerID, shift, keyHash, entry) {
    if (node.keyHash === keyHash) {
      return new HashCollisionNode(ownerID, keyHash, [node.entry, entry]);
    }

    var idx1 = (shift === 0 ? node.keyHash : node.keyHash >>> shift) & MASK;
    var idx2 = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;

    var newNode;
    var nodes = idx1 === idx2 ?
      [mergeIntoNode(node, ownerID, shift + SHIFT, keyHash, entry)] :
      ((newNode = new ValueNode(ownerID, keyHash, entry)), idx1 < idx2 ? [node, newNode] : [newNode, node]);

    return new BitmapIndexedNode(ownerID, (1 << idx1) | (1 << idx2), nodes);
  }

  function createNodes(ownerID, entries, key, value) {
    if (!ownerID) {
      ownerID = new OwnerID();
    }
    var node = new ValueNode(ownerID, hash(key), [key, value]);
    for (var ii = 0; ii < entries.length; ii++) {
      var entry = entries[ii];
      node = node.update(ownerID, 0, undefined, entry[0], entry[1]);
    }
    return node;
  }

  function packNodes(ownerID, nodes, count, excluding) {
    var bitmap = 0;
    var packedII = 0;
    var packedNodes = new Array(count);
    for (var ii = 0, bit = 1, len = nodes.length; ii < len; ii++, bit <<= 1) {
      var node = nodes[ii];
      if (node !== undefined && ii !== excluding) {
        bitmap |= bit;
        packedNodes[packedII++] = node;
      }
    }
    return new BitmapIndexedNode(ownerID, bitmap, packedNodes);
  }

  function expandNodes(ownerID, nodes, bitmap, including, node) {
    var count = 0;
    var expandedNodes = new Array(SIZE);
    for (var ii = 0; bitmap !== 0; ii++, bitmap >>>= 1) {
      expandedNodes[ii] = bitmap & 1 ? nodes[count++] : undefined;
    }
    expandedNodes[including] = node;
    return new HashArrayMapNode(ownerID, count + 1, expandedNodes);
  }

  function mergeIntoMapWith(map, merger, iterables) {
    var iters = [];
    for (var ii = 0; ii < iterables.length; ii++) {
      var value = iterables[ii];
      var iter = KeyedIterable(value);
      if (!isIterable(value)) {
        iter = iter.map(function(v ) {return fromJS(v)});
      }
      iters.push(iter);
    }
    return mergeIntoCollectionWith(map, merger, iters);
  }

  function deepMerger(existing, value, key) {
    return existing && existing.mergeDeep && isIterable(value) ?
      existing.mergeDeep(value) :
      is(existing, value) ? existing : value;
  }

  function deepMergerWith(merger) {
    return function(existing, value, key)  {
      if (existing && existing.mergeDeepWith && isIterable(value)) {
        return existing.mergeDeepWith(merger, value);
      }
      var nextValue = merger(existing, value, key);
      return is(existing, nextValue) ? existing : nextValue;
    };
  }

  function mergeIntoCollectionWith(collection, merger, iters) {
    iters = iters.filter(function(x ) {return x.size !== 0});
    if (iters.length === 0) {
      return collection;
    }
    if (collection.size === 0 && !collection.__ownerID && iters.length === 1) {
      return collection.constructor(iters[0]);
    }
    return collection.withMutations(function(collection ) {
      var mergeIntoMap = merger ?
        function(value, key)  {
          collection.update(key, NOT_SET, function(existing )
            {return existing === NOT_SET ? value : merger(existing, value, key)}
          );
        } :
        function(value, key)  {
          collection.set(key, value);
        }
      for (var ii = 0; ii < iters.length; ii++) {
        iters[ii].forEach(mergeIntoMap);
      }
    });
  }

  function updateInDeepMap(existing, keyPathIter, notSetValue, updater) {
    var isNotSet = existing === NOT_SET;
    var step = keyPathIter.next();
    if (step.done) {
      var existingValue = isNotSet ? notSetValue : existing;
      var newValue = updater(existingValue);
      return newValue === existingValue ? existing : newValue;
    }
    invariant(
      isNotSet || (existing && existing.set),
      'invalid keyPath'
    );
    var key = step.value;
    var nextExisting = isNotSet ? NOT_SET : existing.get(key, NOT_SET);
    var nextUpdated = updateInDeepMap(
      nextExisting,
      keyPathIter,
      notSetValue,
      updater
    );
    return nextUpdated === nextExisting ? existing :
      nextUpdated === NOT_SET ? existing.remove(key) :
      (isNotSet ? emptyMap() : existing).set(key, nextUpdated);
  }

  function popCount(x) {
    x = x - ((x >> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
    x = (x + (x >> 4)) & 0x0f0f0f0f;
    x = x + (x >> 8);
    x = x + (x >> 16);
    return x & 0x7f;
  }

  function setIn(array, idx, val, canEdit) {
    var newArray = canEdit ? array : arrCopy(array);
    newArray[idx] = val;
    return newArray;
  }

  function spliceIn(array, idx, val, canEdit) {
    var newLen = array.length + 1;
    if (canEdit && idx + 1 === newLen) {
      array[idx] = val;
      return array;
    }
    var newArray = new Array(newLen);
    var after = 0;
    for (var ii = 0; ii < newLen; ii++) {
      if (ii === idx) {
        newArray[ii] = val;
        after = -1;
      } else {
        newArray[ii] = array[ii + after];
      }
    }
    return newArray;
  }

  function spliceOut(array, idx, canEdit) {
    var newLen = array.length - 1;
    if (canEdit && idx === newLen) {
      array.pop();
      return array;
    }
    var newArray = new Array(newLen);
    var after = 0;
    for (var ii = 0; ii < newLen; ii++) {
      if (ii === idx) {
        after = 1;
      }
      newArray[ii] = array[ii + after];
    }
    return newArray;
  }

  var MAX_ARRAY_MAP_SIZE = SIZE / 4;
  var MAX_BITMAP_INDEXED_SIZE = SIZE / 2;
  var MIN_HASH_ARRAY_MAP_SIZE = SIZE / 4;

  createClass(List, IndexedCollection);

    // @pragma Construction

    function List(value) {
      var empty = emptyList();
      if (value === null || value === undefined) {
        return empty;
      }
      if (isList(value)) {
        return value;
      }
      var iter = IndexedIterable(value);
      var size = iter.size;
      if (size === 0) {
        return empty;
      }
      assertNotInfinite(size);
      if (size > 0 && size < SIZE) {
        return makeList(0, size, SHIFT, null, new VNode(iter.toArray()));
      }
      return empty.withMutations(function(list ) {
        list.setSize(size);
        iter.forEach(function(v, i)  {return list.set(i, v)});
      });
    }

    List.of = function(/*...values*/) {
      return this(arguments);
    };

    List.prototype.toString = function() {
      return this.__toString('List [', ']');
    };

    // @pragma Access

    List.prototype.get = function(index, notSetValue) {
      index = wrapIndex(this, index);
      if (index >= 0 && index < this.size) {
        index += this._origin;
        var node = listNodeFor(this, index);
        return node && node.array[index & MASK];
      }
      return notSetValue;
    };

    // @pragma Modification

    List.prototype.set = function(index, value) {
      return updateList(this, index, value);
    };

    List.prototype.remove = function(index) {
      return !this.has(index) ? this :
        index === 0 ? this.shift() :
        index === this.size - 1 ? this.pop() :
        this.splice(index, 1);
    };

    List.prototype.insert = function(index, value) {
      return this.splice(index, 0, value);
    };

    List.prototype.clear = function() {
      if (this.size === 0) {
        return this;
      }
      if (this.__ownerID) {
        this.size = this._origin = this._capacity = 0;
        this._level = SHIFT;
        this._root = this._tail = null;
        this.__hash = undefined;
        this.__altered = true;
        return this;
      }
      return emptyList();
    };

    List.prototype.push = function(/*...values*/) {
      var values = arguments;
      var oldSize = this.size;
      return this.withMutations(function(list ) {
        setListBounds(list, 0, oldSize + values.length);
        for (var ii = 0; ii < values.length; ii++) {
          list.set(oldSize + ii, values[ii]);
        }
      });
    };

    List.prototype.pop = function() {
      return setListBounds(this, 0, -1);
    };

    List.prototype.unshift = function(/*...values*/) {
      var values = arguments;
      return this.withMutations(function(list ) {
        setListBounds(list, -values.length);
        for (var ii = 0; ii < values.length; ii++) {
          list.set(ii, values[ii]);
        }
      });
    };

    List.prototype.shift = function() {
      return setListBounds(this, 1);
    };

    // @pragma Composition

    List.prototype.merge = function(/*...iters*/) {
      return mergeIntoListWith(this, undefined, arguments);
    };

    List.prototype.mergeWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
      return mergeIntoListWith(this, merger, iters);
    };

    List.prototype.mergeDeep = function(/*...iters*/) {
      return mergeIntoListWith(this, deepMerger, arguments);
    };

    List.prototype.mergeDeepWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
      return mergeIntoListWith(this, deepMergerWith(merger), iters);
    };

    List.prototype.setSize = function(size) {
      return setListBounds(this, 0, size);
    };

    // @pragma Iteration

    List.prototype.slice = function(begin, end) {
      var size = this.size;
      if (wholeSlice(begin, end, size)) {
        return this;
      }
      return setListBounds(
        this,
        resolveBegin(begin, size),
        resolveEnd(end, size)
      );
    };

    List.prototype.__iterator = function(type, reverse) {
      var index = 0;
      var values = iterateList(this, reverse);
      return new Iterator(function()  {
        var value = values();
        return value === DONE ?
          iteratorDone() :
          iteratorValue(type, index++, value);
      });
    };

    List.prototype.__iterate = function(fn, reverse) {
      var index = 0;
      var values = iterateList(this, reverse);
      var value;
      while ((value = values()) !== DONE) {
        if (fn(value, index++, this) === false) {
          break;
        }
      }
      return index;
    };

    List.prototype.__ensureOwner = function(ownerID) {
      if (ownerID === this.__ownerID) {
        return this;
      }
      if (!ownerID) {
        this.__ownerID = ownerID;
        return this;
      }
      return makeList(this._origin, this._capacity, this._level, this._root, this._tail, ownerID, this.__hash);
    };


  function isList(maybeList) {
    return !!(maybeList && maybeList[IS_LIST_SENTINEL]);
  }

  List.isList = isList;

  var IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@';

  var ListPrototype = List.prototype;
  ListPrototype[IS_LIST_SENTINEL] = true;
  ListPrototype[DELETE] = ListPrototype.remove;
  ListPrototype.setIn = MapPrototype.setIn;
  ListPrototype.deleteIn =
  ListPrototype.removeIn = MapPrototype.removeIn;
  ListPrototype.update = MapPrototype.update;
  ListPrototype.updateIn = MapPrototype.updateIn;
  ListPrototype.mergeIn = MapPrototype.mergeIn;
  ListPrototype.mergeDeepIn = MapPrototype.mergeDeepIn;
  ListPrototype.withMutations = MapPrototype.withMutations;
  ListPrototype.asMutable = MapPrototype.asMutable;
  ListPrototype.asImmutable = MapPrototype.asImmutable;
  ListPrototype.wasAltered = MapPrototype.wasAltered;



    function VNode(array, ownerID) {
      this.array = array;
      this.ownerID = ownerID;
    }

    // TODO: seems like these methods are very similar

    VNode.prototype.removeBefore = function(ownerID, level, index) {
      if (index === level ? 1 << level : 0 || this.array.length === 0) {
        return this;
      }
      var originIndex = (index >>> level) & MASK;
      if (originIndex >= this.array.length) {
        return new VNode([], ownerID);
      }
      var removingFirst = originIndex === 0;
      var newChild;
      if (level > 0) {
        var oldChild = this.array[originIndex];
        newChild = oldChild && oldChild.removeBefore(ownerID, level - SHIFT, index);
        if (newChild === oldChild && removingFirst) {
          return this;
        }
      }
      if (removingFirst && !newChild) {
        return this;
      }
      var editable = editableVNode(this, ownerID);
      if (!removingFirst) {
        for (var ii = 0; ii < originIndex; ii++) {
          editable.array[ii] = undefined;
        }
      }
      if (newChild) {
        editable.array[originIndex] = newChild;
      }
      return editable;
    };

    VNode.prototype.removeAfter = function(ownerID, level, index) {
      if (index === (level ? 1 << level : 0) || this.array.length === 0) {
        return this;
      }
      var sizeIndex = ((index - 1) >>> level) & MASK;
      if (sizeIndex >= this.array.length) {
        return this;
      }

      var newChild;
      if (level > 0) {
        var oldChild = this.array[sizeIndex];
        newChild = oldChild && oldChild.removeAfter(ownerID, level - SHIFT, index);
        if (newChild === oldChild && sizeIndex === this.array.length - 1) {
          return this;
        }
      }

      var editable = editableVNode(this, ownerID);
      editable.array.splice(sizeIndex + 1);
      if (newChild) {
        editable.array[sizeIndex] = newChild;
      }
      return editable;
    };



  var DONE = {};

  function iterateList(list, reverse) {
    var left = list._origin;
    var right = list._capacity;
    var tailPos = getTailOffset(right);
    var tail = list._tail;

    return iterateNodeOrLeaf(list._root, list._level, 0);

    function iterateNodeOrLeaf(node, level, offset) {
      return level === 0 ?
        iterateLeaf(node, offset) :
        iterateNode(node, level, offset);
    }

    function iterateLeaf(node, offset) {
      var array = offset === tailPos ? tail && tail.array : node && node.array;
      var from = offset > left ? 0 : left - offset;
      var to = right - offset;
      if (to > SIZE) {
        to = SIZE;
      }
      return function()  {
        if (from === to) {
          return DONE;
        }
        var idx = reverse ? --to : from++;
        return array && array[idx];
      };
    }

    function iterateNode(node, level, offset) {
      var values;
      var array = node && node.array;
      var from = offset > left ? 0 : (left - offset) >> level;
      var to = ((right - offset) >> level) + 1;
      if (to > SIZE) {
        to = SIZE;
      }
      return function()  {
        do {
          if (values) {
            var value = values();
            if (value !== DONE) {
              return value;
            }
            values = null;
          }
          if (from === to) {
            return DONE;
          }
          var idx = reverse ? --to : from++;
          values = iterateNodeOrLeaf(
            array && array[idx], level - SHIFT, offset + (idx << level)
          );
        } while (true);
      };
    }
  }

  function makeList(origin, capacity, level, root, tail, ownerID, hash) {
    var list = Object.create(ListPrototype);
    list.size = capacity - origin;
    list._origin = origin;
    list._capacity = capacity;
    list._level = level;
    list._root = root;
    list._tail = tail;
    list.__ownerID = ownerID;
    list.__hash = hash;
    list.__altered = false;
    return list;
  }

  var EMPTY_LIST;
  function emptyList() {
    return EMPTY_LIST || (EMPTY_LIST = makeList(0, 0, SHIFT));
  }

  function updateList(list, index, value) {
    index = wrapIndex(list, index);

    if (index !== index) {
      return list;
    }

    if (index >= list.size || index < 0) {
      return list.withMutations(function(list ) {
        index < 0 ?
          setListBounds(list, index).set(0, value) :
          setListBounds(list, 0, index + 1).set(index, value)
      });
    }

    index += list._origin;

    var newTail = list._tail;
    var newRoot = list._root;
    var didAlter = MakeRef(DID_ALTER);
    if (index >= getTailOffset(list._capacity)) {
      newTail = updateVNode(newTail, list.__ownerID, 0, index, value, didAlter);
    } else {
      newRoot = updateVNode(newRoot, list.__ownerID, list._level, index, value, didAlter);
    }

    if (!didAlter.value) {
      return list;
    }

    if (list.__ownerID) {
      list._root = newRoot;
      list._tail = newTail;
      list.__hash = undefined;
      list.__altered = true;
      return list;
    }
    return makeList(list._origin, list._capacity, list._level, newRoot, newTail);
  }

  function updateVNode(node, ownerID, level, index, value, didAlter) {
    var idx = (index >>> level) & MASK;
    var nodeHas = node && idx < node.array.length;
    if (!nodeHas && value === undefined) {
      return node;
    }

    var newNode;

    if (level > 0) {
      var lowerNode = node && node.array[idx];
      var newLowerNode = updateVNode(lowerNode, ownerID, level - SHIFT, index, value, didAlter);
      if (newLowerNode === lowerNode) {
        return node;
      }
      newNode = editableVNode(node, ownerID);
      newNode.array[idx] = newLowerNode;
      return newNode;
    }

    if (nodeHas && node.array[idx] === value) {
      return node;
    }

    SetRef(didAlter);

    newNode = editableVNode(node, ownerID);
    if (value === undefined && idx === newNode.array.length - 1) {
      newNode.array.pop();
    } else {
      newNode.array[idx] = value;
    }
    return newNode;
  }

  function editableVNode(node, ownerID) {
    if (ownerID && node && ownerID === node.ownerID) {
      return node;
    }
    return new VNode(node ? node.array.slice() : [], ownerID);
  }

  function listNodeFor(list, rawIndex) {
    if (rawIndex >= getTailOffset(list._capacity)) {
      return list._tail;
    }
    if (rawIndex < 1 << (list._level + SHIFT)) {
      var node = list._root;
      var level = list._level;
      while (node && level > 0) {
        node = node.array[(rawIndex >>> level) & MASK];
        level -= SHIFT;
      }
      return node;
    }
  }

  function setListBounds(list, begin, end) {
    // Sanitize begin & end using this shorthand for ToInt32(argument)
    // http://www.ecma-international.org/ecma-262/6.0/#sec-toint32
    if (begin !== undefined) {
      begin = begin | 0;
    }
    if (end !== undefined) {
      end = end | 0;
    }
    var owner = list.__ownerID || new OwnerID();
    var oldOrigin = list._origin;
    var oldCapacity = list._capacity;
    var newOrigin = oldOrigin + begin;
    var newCapacity = end === undefined ? oldCapacity : end < 0 ? oldCapacity + end : oldOrigin + end;
    if (newOrigin === oldOrigin && newCapacity === oldCapacity) {
      return list;
    }

    // If it's going to end after it starts, it's empty.
    if (newOrigin >= newCapacity) {
      return list.clear();
    }

    var newLevel = list._level;
    var newRoot = list._root;

    // New origin might need creating a higher root.
    var offsetShift = 0;
    while (newOrigin + offsetShift < 0) {
      newRoot = new VNode(newRoot && newRoot.array.length ? [undefined, newRoot] : [], owner);
      newLevel += SHIFT;
      offsetShift += 1 << newLevel;
    }
    if (offsetShift) {
      newOrigin += offsetShift;
      oldOrigin += offsetShift;
      newCapacity += offsetShift;
      oldCapacity += offsetShift;
    }

    var oldTailOffset = getTailOffset(oldCapacity);
    var newTailOffset = getTailOffset(newCapacity);

    // New size might need creating a higher root.
    while (newTailOffset >= 1 << (newLevel + SHIFT)) {
      newRoot = new VNode(newRoot && newRoot.array.length ? [newRoot] : [], owner);
      newLevel += SHIFT;
    }

    // Locate or create the new tail.
    var oldTail = list._tail;
    var newTail = newTailOffset < oldTailOffset ?
      listNodeFor(list, newCapacity - 1) :
      newTailOffset > oldTailOffset ? new VNode([], owner) : oldTail;

    // Merge Tail into tree.
    if (oldTail && newTailOffset > oldTailOffset && newOrigin < oldCapacity && oldTail.array.length) {
      newRoot = editableVNode(newRoot, owner);
      var node = newRoot;
      for (var level = newLevel; level > SHIFT; level -= SHIFT) {
        var idx = (oldTailOffset >>> level) & MASK;
        node = node.array[idx] = editableVNode(node.array[idx], owner);
      }
      node.array[(oldTailOffset >>> SHIFT) & MASK] = oldTail;
    }

    // If the size has been reduced, there's a chance the tail needs to be trimmed.
    if (newCapacity < oldCapacity) {
      newTail = newTail && newTail.removeAfter(owner, 0, newCapacity);
    }

    // If the new origin is within the tail, then we do not need a root.
    if (newOrigin >= newTailOffset) {
      newOrigin -= newTailOffset;
      newCapacity -= newTailOffset;
      newLevel = SHIFT;
      newRoot = null;
      newTail = newTail && newTail.removeBefore(owner, 0, newOrigin);

    // Otherwise, if the root has been trimmed, garbage collect.
    } else if (newOrigin > oldOrigin || newTailOffset < oldTailOffset) {
      offsetShift = 0;

      // Identify the new top root node of the subtree of the old root.
      while (newRoot) {
        var beginIndex = (newOrigin >>> newLevel) & MASK;
        if (beginIndex !== (newTailOffset >>> newLevel) & MASK) {
          break;
        }
        if (beginIndex) {
          offsetShift += (1 << newLevel) * beginIndex;
        }
        newLevel -= SHIFT;
        newRoot = newRoot.array[beginIndex];
      }

      // Trim the new sides of the new root.
      if (newRoot && newOrigin > oldOrigin) {
        newRoot = newRoot.removeBefore(owner, newLevel, newOrigin - offsetShift);
      }
      if (newRoot && newTailOffset < oldTailOffset) {
        newRoot = newRoot.removeAfter(owner, newLevel, newTailOffset - offsetShift);
      }
      if (offsetShift) {
        newOrigin -= offsetShift;
        newCapacity -= offsetShift;
      }
    }

    if (list.__ownerID) {
      list.size = newCapacity - newOrigin;
      list._origin = newOrigin;
      list._capacity = newCapacity;
      list._level = newLevel;
      list._root = newRoot;
      list._tail = newTail;
      list.__hash = undefined;
      list.__altered = true;
      return list;
    }
    return makeList(newOrigin, newCapacity, newLevel, newRoot, newTail);
  }

  function mergeIntoListWith(list, merger, iterables) {
    var iters = [];
    var maxSize = 0;
    for (var ii = 0; ii < iterables.length; ii++) {
      var value = iterables[ii];
      var iter = IndexedIterable(value);
      if (iter.size > maxSize) {
        maxSize = iter.size;
      }
      if (!isIterable(value)) {
        iter = iter.map(function(v ) {return fromJS(v)});
      }
      iters.push(iter);
    }
    if (maxSize > list.size) {
      list = list.setSize(maxSize);
    }
    return mergeIntoCollectionWith(list, merger, iters);
  }

  function getTailOffset(size) {
    return size < SIZE ? 0 : (((size - 1) >>> SHIFT) << SHIFT);
  }

  createClass(OrderedMap, Map);

    // @pragma Construction

    function OrderedMap(value) {
      return value === null || value === undefined ? emptyOrderedMap() :
        isOrderedMap(value) ? value :
        emptyOrderedMap().withMutations(function(map ) {
          var iter = KeyedIterable(value);
          assertNotInfinite(iter.size);
          iter.forEach(function(v, k)  {return map.set(k, v)});
        });
    }

    OrderedMap.of = function(/*...values*/) {
      return this(arguments);
    };

    OrderedMap.prototype.toString = function() {
      return this.__toString('OrderedMap {', '}');
    };

    // @pragma Access

    OrderedMap.prototype.get = function(k, notSetValue) {
      var index = this._map.get(k);
      return index !== undefined ? this._list.get(index)[1] : notSetValue;
    };

    // @pragma Modification

    OrderedMap.prototype.clear = function() {
      if (this.size === 0) {
        return this;
      }
      if (this.__ownerID) {
        this.size = 0;
        this._map.clear();
        this._list.clear();
        return this;
      }
      return emptyOrderedMap();
    };

    OrderedMap.prototype.set = function(k, v) {
      return updateOrderedMap(this, k, v);
    };

    OrderedMap.prototype.remove = function(k) {
      return updateOrderedMap(this, k, NOT_SET);
    };

    OrderedMap.prototype.wasAltered = function() {
      return this._map.wasAltered() || this._list.wasAltered();
    };

    OrderedMap.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      return this._list.__iterate(
        function(entry ) {return entry && fn(entry[1], entry[0], this$0)},
        reverse
      );
    };

    OrderedMap.prototype.__iterator = function(type, reverse) {
      return this._list.fromEntrySeq().__iterator(type, reverse);
    };

    OrderedMap.prototype.__ensureOwner = function(ownerID) {
      if (ownerID === this.__ownerID) {
        return this;
      }
      var newMap = this._map.__ensureOwner(ownerID);
      var newList = this._list.__ensureOwner(ownerID);
      if (!ownerID) {
        this.__ownerID = ownerID;
        this._map = newMap;
        this._list = newList;
        return this;
      }
      return makeOrderedMap(newMap, newList, ownerID, this.__hash);
    };


  function isOrderedMap(maybeOrderedMap) {
    return isMap(maybeOrderedMap) && isOrdered(maybeOrderedMap);
  }

  OrderedMap.isOrderedMap = isOrderedMap;

  OrderedMap.prototype[IS_ORDERED_SENTINEL] = true;
  OrderedMap.prototype[DELETE] = OrderedMap.prototype.remove;



  function makeOrderedMap(map, list, ownerID, hash) {
    var omap = Object.create(OrderedMap.prototype);
    omap.size = map ? map.size : 0;
    omap._map = map;
    omap._list = list;
    omap.__ownerID = ownerID;
    omap.__hash = hash;
    return omap;
  }

  var EMPTY_ORDERED_MAP;
  function emptyOrderedMap() {
    return EMPTY_ORDERED_MAP || (EMPTY_ORDERED_MAP = makeOrderedMap(emptyMap(), emptyList()));
  }

  function updateOrderedMap(omap, k, v) {
    var map = omap._map;
    var list = omap._list;
    var i = map.get(k);
    var has = i !== undefined;
    var newMap;
    var newList;
    if (v === NOT_SET) { // removed
      if (!has) {
        return omap;
      }
      if (list.size >= SIZE && list.size >= map.size * 2) {
        newList = list.filter(function(entry, idx)  {return entry !== undefined && i !== idx});
        newMap = newList.toKeyedSeq().map(function(entry ) {return entry[0]}).flip().toMap();
        if (omap.__ownerID) {
          newMap.__ownerID = newList.__ownerID = omap.__ownerID;
        }
      } else {
        newMap = map.remove(k);
        newList = i === list.size - 1 ? list.pop() : list.set(i, undefined);
      }
    } else {
      if (has) {
        if (v === list.get(i)[1]) {
          return omap;
        }
        newMap = map;
        newList = list.set(i, [k, v]);
      } else {
        newMap = map.set(k, list.size);
        newList = list.set(list.size, [k, v]);
      }
    }
    if (omap.__ownerID) {
      omap.size = newMap.size;
      omap._map = newMap;
      omap._list = newList;
      omap.__hash = undefined;
      return omap;
    }
    return makeOrderedMap(newMap, newList);
  }

  createClass(ToKeyedSequence, KeyedSeq);
    function ToKeyedSequence(indexed, useKeys) {
      this._iter = indexed;
      this._useKeys = useKeys;
      this.size = indexed.size;
    }

    ToKeyedSequence.prototype.get = function(key, notSetValue) {
      return this._iter.get(key, notSetValue);
    };

    ToKeyedSequence.prototype.has = function(key) {
      return this._iter.has(key);
    };

    ToKeyedSequence.prototype.valueSeq = function() {
      return this._iter.valueSeq();
    };

    ToKeyedSequence.prototype.reverse = function() {var this$0 = this;
      var reversedSequence = reverseFactory(this, true);
      if (!this._useKeys) {
        reversedSequence.valueSeq = function()  {return this$0._iter.toSeq().reverse()};
      }
      return reversedSequence;
    };

    ToKeyedSequence.prototype.map = function(mapper, context) {var this$0 = this;
      var mappedSequence = mapFactory(this, mapper, context);
      if (!this._useKeys) {
        mappedSequence.valueSeq = function()  {return this$0._iter.toSeq().map(mapper, context)};
      }
      return mappedSequence;
    };

    ToKeyedSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      var ii;
      return this._iter.__iterate(
        this._useKeys ?
          function(v, k)  {return fn(v, k, this$0)} :
          ((ii = reverse ? resolveSize(this) : 0),
            function(v ) {return fn(v, reverse ? --ii : ii++, this$0)}),
        reverse
      );
    };

    ToKeyedSequence.prototype.__iterator = function(type, reverse) {
      if (this._useKeys) {
        return this._iter.__iterator(type, reverse);
      }
      var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
      var ii = reverse ? resolveSize(this) : 0;
      return new Iterator(function()  {
        var step = iterator.next();
        return step.done ? step :
          iteratorValue(type, reverse ? --ii : ii++, step.value, step);
      });
    };

  ToKeyedSequence.prototype[IS_ORDERED_SENTINEL] = true;


  createClass(ToIndexedSequence, IndexedSeq);
    function ToIndexedSequence(iter) {
      this._iter = iter;
      this.size = iter.size;
    }

    ToIndexedSequence.prototype.includes = function(value) {
      return this._iter.includes(value);
    };

    ToIndexedSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      var iterations = 0;
      return this._iter.__iterate(function(v ) {return fn(v, iterations++, this$0)}, reverse);
    };

    ToIndexedSequence.prototype.__iterator = function(type, reverse) {
      var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
      var iterations = 0;
      return new Iterator(function()  {
        var step = iterator.next();
        return step.done ? step :
          iteratorValue(type, iterations++, step.value, step)
      });
    };



  createClass(ToSetSequence, SetSeq);
    function ToSetSequence(iter) {
      this._iter = iter;
      this.size = iter.size;
    }

    ToSetSequence.prototype.has = function(key) {
      return this._iter.includes(key);
    };

    ToSetSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      return this._iter.__iterate(function(v ) {return fn(v, v, this$0)}, reverse);
    };

    ToSetSequence.prototype.__iterator = function(type, reverse) {
      var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
      return new Iterator(function()  {
        var step = iterator.next();
        return step.done ? step :
          iteratorValue(type, step.value, step.value, step);
      });
    };



  createClass(FromEntriesSequence, KeyedSeq);
    function FromEntriesSequence(entries) {
      this._iter = entries;
      this.size = entries.size;
    }

    FromEntriesSequence.prototype.entrySeq = function() {
      return this._iter.toSeq();
    };

    FromEntriesSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      return this._iter.__iterate(function(entry ) {
        // Check if entry exists first so array access doesn't throw for holes
        // in the parent iteration.
        if (entry) {
          validateEntry(entry);
          var indexedIterable = isIterable(entry);
          return fn(
            indexedIterable ? entry.get(1) : entry[1],
            indexedIterable ? entry.get(0) : entry[0],
            this$0
          );
        }
      }, reverse);
    };

    FromEntriesSequence.prototype.__iterator = function(type, reverse) {
      var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
      return new Iterator(function()  {
        while (true) {
          var step = iterator.next();
          if (step.done) {
            return step;
          }
          var entry = step.value;
          // Check if entry exists first so array access doesn't throw for holes
          // in the parent iteration.
          if (entry) {
            validateEntry(entry);
            var indexedIterable = isIterable(entry);
            return iteratorValue(
              type,
              indexedIterable ? entry.get(0) : entry[0],
              indexedIterable ? entry.get(1) : entry[1],
              step
            );
          }
        }
      });
    };


  ToIndexedSequence.prototype.cacheResult =
  ToKeyedSequence.prototype.cacheResult =
  ToSetSequence.prototype.cacheResult =
  FromEntriesSequence.prototype.cacheResult =
    cacheResultThrough;


  function flipFactory(iterable) {
    var flipSequence = makeSequence(iterable);
    flipSequence._iter = iterable;
    flipSequence.size = iterable.size;
    flipSequence.flip = function()  {return iterable};
    flipSequence.reverse = function () {
      var reversedSequence = iterable.reverse.apply(this); // super.reverse()
      reversedSequence.flip = function()  {return iterable.reverse()};
      return reversedSequence;
    };
    flipSequence.has = function(key ) {return iterable.includes(key)};
    flipSequence.includes = function(key ) {return iterable.has(key)};
    flipSequence.cacheResult = cacheResultThrough;
    flipSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
      return iterable.__iterate(function(v, k)  {return fn(k, v, this$0) !== false}, reverse);
    }
    flipSequence.__iteratorUncached = function(type, reverse) {
      if (type === ITERATE_ENTRIES) {
        var iterator = iterable.__iterator(type, reverse);
        return new Iterator(function()  {
          var step = iterator.next();
          if (!step.done) {
            var k = step.value[0];
            step.value[0] = step.value[1];
            step.value[1] = k;
          }
          return step;
        });
      }
      return iterable.__iterator(
        type === ITERATE_VALUES ? ITERATE_KEYS : ITERATE_VALUES,
        reverse
      );
    }
    return flipSequence;
  }


  function mapFactory(iterable, mapper, context) {
    var mappedSequence = makeSequence(iterable);
    mappedSequence.size = iterable.size;
    mappedSequence.has = function(key ) {return iterable.has(key)};
    mappedSequence.get = function(key, notSetValue)  {
      var v = iterable.get(key, NOT_SET);
      return v === NOT_SET ?
        notSetValue :
        mapper.call(context, v, key, iterable);
    };
    mappedSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
      return iterable.__iterate(
        function(v, k, c)  {return fn(mapper.call(context, v, k, c), k, this$0) !== false},
        reverse
      );
    }
    mappedSequence.__iteratorUncached = function (type, reverse) {
      var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
      return new Iterator(function()  {
        var step = iterator.next();
        if (step.done) {
          return step;
        }
        var entry = step.value;
        var key = entry[0];
        return iteratorValue(
          type,
          key,
          mapper.call(context, entry[1], key, iterable),
          step
        );
      });
    }
    return mappedSequence;
  }


  function reverseFactory(iterable, useKeys) {
    var reversedSequence = makeSequence(iterable);
    reversedSequence._iter = iterable;
    reversedSequence.size = iterable.size;
    reversedSequence.reverse = function()  {return iterable};
    if (iterable.flip) {
      reversedSequence.flip = function () {
        var flipSequence = flipFactory(iterable);
        flipSequence.reverse = function()  {return iterable.flip()};
        return flipSequence;
      };
    }
    reversedSequence.get = function(key, notSetValue) 
      {return iterable.get(useKeys ? key : -1 - key, notSetValue)};
    reversedSequence.has = function(key )
      {return iterable.has(useKeys ? key : -1 - key)};
    reversedSequence.includes = function(value ) {return iterable.includes(value)};
    reversedSequence.cacheResult = cacheResultThrough;
    reversedSequence.__iterate = function (fn, reverse) {var this$0 = this;
      return iterable.__iterate(function(v, k)  {return fn(v, k, this$0)}, !reverse);
    };
    reversedSequence.__iterator =
      function(type, reverse)  {return iterable.__iterator(type, !reverse)};
    return reversedSequence;
  }


  function filterFactory(iterable, predicate, context, useKeys) {
    var filterSequence = makeSequence(iterable);
    if (useKeys) {
      filterSequence.has = function(key ) {
        var v = iterable.get(key, NOT_SET);
        return v !== NOT_SET && !!predicate.call(context, v, key, iterable);
      };
      filterSequence.get = function(key, notSetValue)  {
        var v = iterable.get(key, NOT_SET);
        return v !== NOT_SET && predicate.call(context, v, key, iterable) ?
          v : notSetValue;
      };
    }
    filterSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
      var iterations = 0;
      iterable.__iterate(function(v, k, c)  {
        if (predicate.call(context, v, k, c)) {
          iterations++;
          return fn(v, useKeys ? k : iterations - 1, this$0);
        }
      }, reverse);
      return iterations;
    };
    filterSequence.__iteratorUncached = function (type, reverse) {
      var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
      var iterations = 0;
      return new Iterator(function()  {
        while (true) {
          var step = iterator.next();
          if (step.done) {
            return step;
          }
          var entry = step.value;
          var key = entry[0];
          var value = entry[1];
          if (predicate.call(context, value, key, iterable)) {
            return iteratorValue(type, useKeys ? key : iterations++, value, step);
          }
        }
      });
    }
    return filterSequence;
  }


  function countByFactory(iterable, grouper, context) {
    var groups = Map().asMutable();
    iterable.__iterate(function(v, k)  {
      groups.update(
        grouper.call(context, v, k, iterable),
        0,
        function(a ) {return a + 1}
      );
    });
    return groups.asImmutable();
  }


  function groupByFactory(iterable, grouper, context) {
    var isKeyedIter = isKeyed(iterable);
    var groups = (isOrdered(iterable) ? OrderedMap() : Map()).asMutable();
    iterable.__iterate(function(v, k)  {
      groups.update(
        grouper.call(context, v, k, iterable),
        function(a ) {return (a = a || [], a.push(isKeyedIter ? [k, v] : v), a)}
      );
    });
    var coerce = iterableClass(iterable);
    return groups.map(function(arr ) {return reify(iterable, coerce(arr))});
  }


  function sliceFactory(iterable, begin, end, useKeys) {
    var originalSize = iterable.size;

    // Sanitize begin & end using this shorthand for ToInt32(argument)
    // http://www.ecma-international.org/ecma-262/6.0/#sec-toint32
    if (begin !== undefined) {
      begin = begin | 0;
    }
    if (end !== undefined) {
      if (end === Infinity) {
        end = originalSize;
      } else {
        end = end | 0;
      }
    }

    if (wholeSlice(begin, end, originalSize)) {
      return iterable;
    }

    var resolvedBegin = resolveBegin(begin, originalSize);
    var resolvedEnd = resolveEnd(end, originalSize);

    // begin or end will be NaN if they were provided as negative numbers and
    // this iterable's size is unknown. In that case, cache first so there is
    // a known size and these do not resolve to NaN.
    if (resolvedBegin !== resolvedBegin || resolvedEnd !== resolvedEnd) {
      return sliceFactory(iterable.toSeq().cacheResult(), begin, end, useKeys);
    }

    // Note: resolvedEnd is undefined when the original sequence's length is
    // unknown and this slice did not supply an end and should contain all
    // elements after resolvedBegin.
    // In that case, resolvedSize will be NaN and sliceSize will remain undefined.
    var resolvedSize = resolvedEnd - resolvedBegin;
    var sliceSize;
    if (resolvedSize === resolvedSize) {
      sliceSize = resolvedSize < 0 ? 0 : resolvedSize;
    }

    var sliceSeq = makeSequence(iterable);

    // If iterable.size is undefined, the size of the realized sliceSeq is
    // unknown at this point unless the number of items to slice is 0
    sliceSeq.size = sliceSize === 0 ? sliceSize : iterable.size && sliceSize || undefined;

    if (!useKeys && isSeq(iterable) && sliceSize >= 0) {
      sliceSeq.get = function (index, notSetValue) {
        index = wrapIndex(this, index);
        return index >= 0 && index < sliceSize ?
          iterable.get(index + resolvedBegin, notSetValue) :
          notSetValue;
      }
    }

    sliceSeq.__iterateUncached = function(fn, reverse) {var this$0 = this;
      if (sliceSize === 0) {
        return 0;
      }
      if (reverse) {
        return this.cacheResult().__iterate(fn, reverse);
      }
      var skipped = 0;
      var isSkipping = true;
      var iterations = 0;
      iterable.__iterate(function(v, k)  {
        if (!(isSkipping && (isSkipping = skipped++ < resolvedBegin))) {
          iterations++;
          return fn(v, useKeys ? k : iterations - 1, this$0) !== false &&
                 iterations !== sliceSize;
        }
      });
      return iterations;
    };

    sliceSeq.__iteratorUncached = function(type, reverse) {
      if (sliceSize !== 0 && reverse) {
        return this.cacheResult().__iterator(type, reverse);
      }
      // Don't bother instantiating parent iterator if taking 0.
      var iterator = sliceSize !== 0 && iterable.__iterator(type, reverse);
      var skipped = 0;
      var iterations = 0;
      return new Iterator(function()  {
        while (skipped++ < resolvedBegin) {
          iterator.next();
        }
        if (++iterations > sliceSize) {
          return iteratorDone();
        }
        var step = iterator.next();
        if (useKeys || type === ITERATE_VALUES) {
          return step;
        } else if (type === ITERATE_KEYS) {
          return iteratorValue(type, iterations - 1, undefined, step);
        } else {
          return iteratorValue(type, iterations - 1, step.value[1], step);
        }
      });
    }

    return sliceSeq;
  }


  function takeWhileFactory(iterable, predicate, context) {
    var takeSequence = makeSequence(iterable);
    takeSequence.__iterateUncached = function(fn, reverse) {var this$0 = this;
      if (reverse) {
        return this.cacheResult().__iterate(fn, reverse);
      }
      var iterations = 0;
      iterable.__iterate(function(v, k, c) 
        {return predicate.call(context, v, k, c) && ++iterations && fn(v, k, this$0)}
      );
      return iterations;
    };
    takeSequence.__iteratorUncached = function(type, reverse) {var this$0 = this;
      if (reverse) {
        return this.cacheResult().__iterator(type, reverse);
      }
      var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
      var iterating = true;
      return new Iterator(function()  {
        if (!iterating) {
          return iteratorDone();
        }
        var step = iterator.next();
        if (step.done) {
          return step;
        }
        var entry = step.value;
        var k = entry[0];
        var v = entry[1];
        if (!predicate.call(context, v, k, this$0)) {
          iterating = false;
          return iteratorDone();
        }
        return type === ITERATE_ENTRIES ? step :
          iteratorValue(type, k, v, step);
      });
    };
    return takeSequence;
  }


  function skipWhileFactory(iterable, predicate, context, useKeys) {
    var skipSequence = makeSequence(iterable);
    skipSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
      if (reverse) {
        return this.cacheResult().__iterate(fn, reverse);
      }
      var isSkipping = true;
      var iterations = 0;
      iterable.__iterate(function(v, k, c)  {
        if (!(isSkipping && (isSkipping = predicate.call(context, v, k, c)))) {
          iterations++;
          return fn(v, useKeys ? k : iterations - 1, this$0);
        }
      });
      return iterations;
    };
    skipSequence.__iteratorUncached = function(type, reverse) {var this$0 = this;
      if (reverse) {
        return this.cacheResult().__iterator(type, reverse);
      }
      var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
      var skipping = true;
      var iterations = 0;
      return new Iterator(function()  {
        var step, k, v;
        do {
          step = iterator.next();
          if (step.done) {
            if (useKeys || type === ITERATE_VALUES) {
              return step;
            } else if (type === ITERATE_KEYS) {
              return iteratorValue(type, iterations++, undefined, step);
            } else {
              return iteratorValue(type, iterations++, step.value[1], step);
            }
          }
          var entry = step.value;
          k = entry[0];
          v = entry[1];
          skipping && (skipping = predicate.call(context, v, k, this$0));
        } while (skipping);
        return type === ITERATE_ENTRIES ? step :
          iteratorValue(type, k, v, step);
      });
    };
    return skipSequence;
  }


  function concatFactory(iterable, values) {
    var isKeyedIterable = isKeyed(iterable);
    var iters = [iterable].concat(values).map(function(v ) {
      if (!isIterable(v)) {
        v = isKeyedIterable ?
          keyedSeqFromValue(v) :
          indexedSeqFromValue(Array.isArray(v) ? v : [v]);
      } else if (isKeyedIterable) {
        v = KeyedIterable(v);
      }
      return v;
    }).filter(function(v ) {return v.size !== 0});

    if (iters.length === 0) {
      return iterable;
    }

    if (iters.length === 1) {
      var singleton = iters[0];
      if (singleton === iterable ||
          isKeyedIterable && isKeyed(singleton) ||
          isIndexed(iterable) && isIndexed(singleton)) {
        return singleton;
      }
    }

    var concatSeq = new ArraySeq(iters);
    if (isKeyedIterable) {
      concatSeq = concatSeq.toKeyedSeq();
    } else if (!isIndexed(iterable)) {
      concatSeq = concatSeq.toSetSeq();
    }
    concatSeq = concatSeq.flatten(true);
    concatSeq.size = iters.reduce(
      function(sum, seq)  {
        if (sum !== undefined) {
          var size = seq.size;
          if (size !== undefined) {
            return sum + size;
          }
        }
      },
      0
    );
    return concatSeq;
  }


  function flattenFactory(iterable, depth, useKeys) {
    var flatSequence = makeSequence(iterable);
    flatSequence.__iterateUncached = function(fn, reverse) {
      var iterations = 0;
      var stopped = false;
      function flatDeep(iter, currentDepth) {var this$0 = this;
        iter.__iterate(function(v, k)  {
          if ((!depth || currentDepth < depth) && isIterable(v)) {
            flatDeep(v, currentDepth + 1);
          } else if (fn(v, useKeys ? k : iterations++, this$0) === false) {
            stopped = true;
          }
          return !stopped;
        }, reverse);
      }
      flatDeep(iterable, 0);
      return iterations;
    }
    flatSequence.__iteratorUncached = function(type, reverse) {
      var iterator = iterable.__iterator(type, reverse);
      var stack = [];
      var iterations = 0;
      return new Iterator(function()  {
        while (iterator) {
          var step = iterator.next();
          if (step.done !== false) {
            iterator = stack.pop();
            continue;
          }
          var v = step.value;
          if (type === ITERATE_ENTRIES) {
            v = v[1];
          }
          if ((!depth || stack.length < depth) && isIterable(v)) {
            stack.push(iterator);
            iterator = v.__iterator(type, reverse);
          } else {
            return useKeys ? step : iteratorValue(type, iterations++, v, step);
          }
        }
        return iteratorDone();
      });
    }
    return flatSequence;
  }


  function flatMapFactory(iterable, mapper, context) {
    var coerce = iterableClass(iterable);
    return iterable.toSeq().map(
      function(v, k)  {return coerce(mapper.call(context, v, k, iterable))}
    ).flatten(true);
  }


  function interposeFactory(iterable, separator) {
    var interposedSequence = makeSequence(iterable);
    interposedSequence.size = iterable.size && iterable.size * 2 -1;
    interposedSequence.__iterateUncached = function(fn, reverse) {var this$0 = this;
      var iterations = 0;
      iterable.__iterate(function(v, k) 
        {return (!iterations || fn(separator, iterations++, this$0) !== false) &&
        fn(v, iterations++, this$0) !== false},
        reverse
      );
      return iterations;
    };
    interposedSequence.__iteratorUncached = function(type, reverse) {
      var iterator = iterable.__iterator(ITERATE_VALUES, reverse);
      var iterations = 0;
      var step;
      return new Iterator(function()  {
        if (!step || iterations % 2) {
          step = iterator.next();
          if (step.done) {
            return step;
          }
        }
        return iterations % 2 ?
          iteratorValue(type, iterations++, separator) :
          iteratorValue(type, iterations++, step.value, step);
      });
    };
    return interposedSequence;
  }


  function sortFactory(iterable, comparator, mapper) {
    if (!comparator) {
      comparator = defaultComparator;
    }
    var isKeyedIterable = isKeyed(iterable);
    var index = 0;
    var entries = iterable.toSeq().map(
      function(v, k)  {return [k, v, index++, mapper ? mapper(v, k, iterable) : v]}
    ).toArray();
    entries.sort(function(a, b)  {return comparator(a[3], b[3]) || a[2] - b[2]}).forEach(
      isKeyedIterable ?
      function(v, i)  { entries[i].length = 2; } :
      function(v, i)  { entries[i] = v[1]; }
    );
    return isKeyedIterable ? KeyedSeq(entries) :
      isIndexed(iterable) ? IndexedSeq(entries) :
      SetSeq(entries);
  }


  function maxFactory(iterable, comparator, mapper) {
    if (!comparator) {
      comparator = defaultComparator;
    }
    if (mapper) {
      var entry = iterable.toSeq()
        .map(function(v, k)  {return [v, mapper(v, k, iterable)]})
        .reduce(function(a, b)  {return maxCompare(comparator, a[1], b[1]) ? b : a});
      return entry && entry[0];
    } else {
      return iterable.reduce(function(a, b)  {return maxCompare(comparator, a, b) ? b : a});
    }
  }

  function maxCompare(comparator, a, b) {
    var comp = comparator(b, a);
    // b is considered the new max if the comparator declares them equal, but
    // they are not equal and b is in fact a nullish value.
    return (comp === 0 && b !== a && (b === undefined || b === null || b !== b)) || comp > 0;
  }


  function zipWithFactory(keyIter, zipper, iters) {
    var zipSequence = makeSequence(keyIter);
    zipSequence.size = new ArraySeq(iters).map(function(i ) {return i.size}).min();
    // Note: this a generic base implementation of __iterate in terms of
    // __iterator which may be more generically useful in the future.
    zipSequence.__iterate = function(fn, reverse) {
      /* generic:
      var iterator = this.__iterator(ITERATE_ENTRIES, reverse);
      var step;
      var iterations = 0;
      while (!(step = iterator.next()).done) {
        iterations++;
        if (fn(step.value[1], step.value[0], this) === false) {
          break;
        }
      }
      return iterations;
      */
      // indexed:
      var iterator = this.__iterator(ITERATE_VALUES, reverse);
      var step;
      var iterations = 0;
      while (!(step = iterator.next()).done) {
        if (fn(step.value, iterations++, this) === false) {
          break;
        }
      }
      return iterations;
    };
    zipSequence.__iteratorUncached = function(type, reverse) {
      var iterators = iters.map(function(i )
        {return (i = Iterable(i), getIterator(reverse ? i.reverse() : i))}
      );
      var iterations = 0;
      var isDone = false;
      return new Iterator(function()  {
        var steps;
        if (!isDone) {
          steps = iterators.map(function(i ) {return i.next()});
          isDone = steps.some(function(s ) {return s.done});
        }
        if (isDone) {
          return iteratorDone();
        }
        return iteratorValue(
          type,
          iterations++,
          zipper.apply(null, steps.map(function(s ) {return s.value}))
        );
      });
    };
    return zipSequence
  }


  // #pragma Helper Functions

  function reify(iter, seq) {
    return isSeq(iter) ? seq : iter.constructor(seq);
  }

  function validateEntry(entry) {
    if (entry !== Object(entry)) {
      throw new TypeError('Expected [K, V] tuple: ' + entry);
    }
  }

  function resolveSize(iter) {
    assertNotInfinite(iter.size);
    return ensureSize(iter);
  }

  function iterableClass(iterable) {
    return isKeyed(iterable) ? KeyedIterable :
      isIndexed(iterable) ? IndexedIterable :
      SetIterable;
  }

  function makeSequence(iterable) {
    return Object.create(
      (
        isKeyed(iterable) ? KeyedSeq :
        isIndexed(iterable) ? IndexedSeq :
        SetSeq
      ).prototype
    );
  }

  function cacheResultThrough() {
    if (this._iter.cacheResult) {
      this._iter.cacheResult();
      this.size = this._iter.size;
      return this;
    } else {
      return Seq.prototype.cacheResult.call(this);
    }
  }

  function defaultComparator(a, b) {
    return a > b ? 1 : a < b ? -1 : 0;
  }

  function forceIterator(keyPath) {
    var iter = getIterator(keyPath);
    if (!iter) {
      // Array might not be iterable in this environment, so we need a fallback
      // to our wrapped type.
      if (!isArrayLike(keyPath)) {
        throw new TypeError('Expected iterable or array-like: ' + keyPath);
      }
      iter = getIterator(Iterable(keyPath));
    }
    return iter;
  }

  createClass(Record, KeyedCollection);

    function Record(defaultValues, name) {
      var hasInitialized;

      var RecordType = function Record(values) {
        if (values instanceof RecordType) {
          return values;
        }
        if (!(this instanceof RecordType)) {
          return new RecordType(values);
        }
        if (!hasInitialized) {
          hasInitialized = true;
          var keys = Object.keys(defaultValues);
          setProps(RecordTypePrototype, keys);
          RecordTypePrototype.size = keys.length;
          RecordTypePrototype._name = name;
          RecordTypePrototype._keys = keys;
          RecordTypePrototype._defaultValues = defaultValues;
        }
        this._map = Map(values);
      };

      var RecordTypePrototype = RecordType.prototype = Object.create(RecordPrototype);
      RecordTypePrototype.constructor = RecordType;

      return RecordType;
    }

    Record.prototype.toString = function() {
      return this.__toString(recordName(this) + ' {', '}');
    };

    // @pragma Access

    Record.prototype.has = function(k) {
      return this._defaultValues.hasOwnProperty(k);
    };

    Record.prototype.get = function(k, notSetValue) {
      if (!this.has(k)) {
        return notSetValue;
      }
      var defaultVal = this._defaultValues[k];
      return this._map ? this._map.get(k, defaultVal) : defaultVal;
    };

    // @pragma Modification

    Record.prototype.clear = function() {
      if (this.__ownerID) {
        this._map && this._map.clear();
        return this;
      }
      var RecordType = this.constructor;
      return RecordType._empty || (RecordType._empty = makeRecord(this, emptyMap()));
    };

    Record.prototype.set = function(k, v) {
      if (!this.has(k)) {
        throw new Error('Cannot set unknown key "' + k + '" on ' + recordName(this));
      }
      if (this._map && !this._map.has(k)) {
        var defaultVal = this._defaultValues[k];
        if (v === defaultVal) {
          return this;
        }
      }
      var newMap = this._map && this._map.set(k, v);
      if (this.__ownerID || newMap === this._map) {
        return this;
      }
      return makeRecord(this, newMap);
    };

    Record.prototype.remove = function(k) {
      if (!this.has(k)) {
        return this;
      }
      var newMap = this._map && this._map.remove(k);
      if (this.__ownerID || newMap === this._map) {
        return this;
      }
      return makeRecord(this, newMap);
    };

    Record.prototype.wasAltered = function() {
      return this._map.wasAltered();
    };

    Record.prototype.__iterator = function(type, reverse) {var this$0 = this;
      return KeyedIterable(this._defaultValues).map(function(_, k)  {return this$0.get(k)}).__iterator(type, reverse);
    };

    Record.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      return KeyedIterable(this._defaultValues).map(function(_, k)  {return this$0.get(k)}).__iterate(fn, reverse);
    };

    Record.prototype.__ensureOwner = function(ownerID) {
      if (ownerID === this.__ownerID) {
        return this;
      }
      var newMap = this._map && this._map.__ensureOwner(ownerID);
      if (!ownerID) {
        this.__ownerID = ownerID;
        this._map = newMap;
        return this;
      }
      return makeRecord(this, newMap, ownerID);
    };


  var RecordPrototype = Record.prototype;
  RecordPrototype[DELETE] = RecordPrototype.remove;
  RecordPrototype.deleteIn =
  RecordPrototype.removeIn = MapPrototype.removeIn;
  RecordPrototype.merge = MapPrototype.merge;
  RecordPrototype.mergeWith = MapPrototype.mergeWith;
  RecordPrototype.mergeIn = MapPrototype.mergeIn;
  RecordPrototype.mergeDeep = MapPrototype.mergeDeep;
  RecordPrototype.mergeDeepWith = MapPrototype.mergeDeepWith;
  RecordPrototype.mergeDeepIn = MapPrototype.mergeDeepIn;
  RecordPrototype.setIn = MapPrototype.setIn;
  RecordPrototype.update = MapPrototype.update;
  RecordPrototype.updateIn = MapPrototype.updateIn;
  RecordPrototype.withMutations = MapPrototype.withMutations;
  RecordPrototype.asMutable = MapPrototype.asMutable;
  RecordPrototype.asImmutable = MapPrototype.asImmutable;


  function makeRecord(likeRecord, map, ownerID) {
    var record = Object.create(Object.getPrototypeOf(likeRecord));
    record._map = map;
    record.__ownerID = ownerID;
    return record;
  }

  function recordName(record) {
    return record._name || record.constructor.name || 'Record';
  }

  function setProps(prototype, names) {
    try {
      names.forEach(setProp.bind(undefined, prototype));
    } catch (error) {
      // Object.defineProperty failed. Probably IE8.
    }
  }

  function setProp(prototype, name) {
    Object.defineProperty(prototype, name, {
      get: function() {
        return this.get(name);
      },
      set: function(value) {
        invariant(this.__ownerID, 'Cannot set on an immutable record.');
        this.set(name, value);
      }
    });
  }

  createClass(Set, SetCollection);

    // @pragma Construction

    function Set(value) {
      return value === null || value === undefined ? emptySet() :
        isSet(value) && !isOrdered(value) ? value :
        emptySet().withMutations(function(set ) {
          var iter = SetIterable(value);
          assertNotInfinite(iter.size);
          iter.forEach(function(v ) {return set.add(v)});
        });
    }

    Set.of = function(/*...values*/) {
      return this(arguments);
    };

    Set.fromKeys = function(value) {
      return this(KeyedIterable(value).keySeq());
    };

    Set.prototype.toString = function() {
      return this.__toString('Set {', '}');
    };

    // @pragma Access

    Set.prototype.has = function(value) {
      return this._map.has(value);
    };

    // @pragma Modification

    Set.prototype.add = function(value) {
      return updateSet(this, this._map.set(value, true));
    };

    Set.prototype.remove = function(value) {
      return updateSet(this, this._map.remove(value));
    };

    Set.prototype.clear = function() {
      return updateSet(this, this._map.clear());
    };

    // @pragma Composition

    Set.prototype.union = function() {var iters = SLICE$0.call(arguments, 0);
      iters = iters.filter(function(x ) {return x.size !== 0});
      if (iters.length === 0) {
        return this;
      }
      if (this.size === 0 && !this.__ownerID && iters.length === 1) {
        return this.constructor(iters[0]);
      }
      return this.withMutations(function(set ) {
        for (var ii = 0; ii < iters.length; ii++) {
          SetIterable(iters[ii]).forEach(function(value ) {return set.add(value)});
        }
      });
    };

    Set.prototype.intersect = function() {var iters = SLICE$0.call(arguments, 0);
      if (iters.length === 0) {
        return this;
      }
      iters = iters.map(function(iter ) {return SetIterable(iter)});
      var originalSet = this;
      return this.withMutations(function(set ) {
        originalSet.forEach(function(value ) {
          if (!iters.every(function(iter ) {return iter.includes(value)})) {
            set.remove(value);
          }
        });
      });
    };

    Set.prototype.subtract = function() {var iters = SLICE$0.call(arguments, 0);
      if (iters.length === 0) {
        return this;
      }
      iters = iters.map(function(iter ) {return SetIterable(iter)});
      var originalSet = this;
      return this.withMutations(function(set ) {
        originalSet.forEach(function(value ) {
          if (iters.some(function(iter ) {return iter.includes(value)})) {
            set.remove(value);
          }
        });
      });
    };

    Set.prototype.merge = function() {
      return this.union.apply(this, arguments);
    };

    Set.prototype.mergeWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
      return this.union.apply(this, iters);
    };

    Set.prototype.sort = function(comparator) {
      // Late binding
      return OrderedSet(sortFactory(this, comparator));
    };

    Set.prototype.sortBy = function(mapper, comparator) {
      // Late binding
      return OrderedSet(sortFactory(this, comparator, mapper));
    };

    Set.prototype.wasAltered = function() {
      return this._map.wasAltered();
    };

    Set.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      return this._map.__iterate(function(_, k)  {return fn(k, k, this$0)}, reverse);
    };

    Set.prototype.__iterator = function(type, reverse) {
      return this._map.map(function(_, k)  {return k}).__iterator(type, reverse);
    };

    Set.prototype.__ensureOwner = function(ownerID) {
      if (ownerID === this.__ownerID) {
        return this;
      }
      var newMap = this._map.__ensureOwner(ownerID);
      if (!ownerID) {
        this.__ownerID = ownerID;
        this._map = newMap;
        return this;
      }
      return this.__make(newMap, ownerID);
    };


  function isSet(maybeSet) {
    return !!(maybeSet && maybeSet[IS_SET_SENTINEL]);
  }

  Set.isSet = isSet;

  var IS_SET_SENTINEL = '@@__IMMUTABLE_SET__@@';

  var SetPrototype = Set.prototype;
  SetPrototype[IS_SET_SENTINEL] = true;
  SetPrototype[DELETE] = SetPrototype.remove;
  SetPrototype.mergeDeep = SetPrototype.merge;
  SetPrototype.mergeDeepWith = SetPrototype.mergeWith;
  SetPrototype.withMutations = MapPrototype.withMutations;
  SetPrototype.asMutable = MapPrototype.asMutable;
  SetPrototype.asImmutable = MapPrototype.asImmutable;

  SetPrototype.__empty = emptySet;
  SetPrototype.__make = makeSet;

  function updateSet(set, newMap) {
    if (set.__ownerID) {
      set.size = newMap.size;
      set._map = newMap;
      return set;
    }
    return newMap === set._map ? set :
      newMap.size === 0 ? set.__empty() :
      set.__make(newMap);
  }

  function makeSet(map, ownerID) {
    var set = Object.create(SetPrototype);
    set.size = map ? map.size : 0;
    set._map = map;
    set.__ownerID = ownerID;
    return set;
  }

  var EMPTY_SET;
  function emptySet() {
    return EMPTY_SET || (EMPTY_SET = makeSet(emptyMap()));
  }

  createClass(OrderedSet, Set);

    // @pragma Construction

    function OrderedSet(value) {
      return value === null || value === undefined ? emptyOrderedSet() :
        isOrderedSet(value) ? value :
        emptyOrderedSet().withMutations(function(set ) {
          var iter = SetIterable(value);
          assertNotInfinite(iter.size);
          iter.forEach(function(v ) {return set.add(v)});
        });
    }

    OrderedSet.of = function(/*...values*/) {
      return this(arguments);
    };

    OrderedSet.fromKeys = function(value) {
      return this(KeyedIterable(value).keySeq());
    };

    OrderedSet.prototype.toString = function() {
      return this.__toString('OrderedSet {', '}');
    };


  function isOrderedSet(maybeOrderedSet) {
    return isSet(maybeOrderedSet) && isOrdered(maybeOrderedSet);
  }

  OrderedSet.isOrderedSet = isOrderedSet;

  var OrderedSetPrototype = OrderedSet.prototype;
  OrderedSetPrototype[IS_ORDERED_SENTINEL] = true;

  OrderedSetPrototype.__empty = emptyOrderedSet;
  OrderedSetPrototype.__make = makeOrderedSet;

  function makeOrderedSet(map, ownerID) {
    var set = Object.create(OrderedSetPrototype);
    set.size = map ? map.size : 0;
    set._map = map;
    set.__ownerID = ownerID;
    return set;
  }

  var EMPTY_ORDERED_SET;
  function emptyOrderedSet() {
    return EMPTY_ORDERED_SET || (EMPTY_ORDERED_SET = makeOrderedSet(emptyOrderedMap()));
  }

  createClass(Stack, IndexedCollection);

    // @pragma Construction

    function Stack(value) {
      return value === null || value === undefined ? emptyStack() :
        isStack(value) ? value :
        emptyStack().unshiftAll(value);
    }

    Stack.of = function(/*...values*/) {
      return this(arguments);
    };

    Stack.prototype.toString = function() {
      return this.__toString('Stack [', ']');
    };

    // @pragma Access

    Stack.prototype.get = function(index, notSetValue) {
      var head = this._head;
      index = wrapIndex(this, index);
      while (head && index--) {
        head = head.next;
      }
      return head ? head.value : notSetValue;
    };

    Stack.prototype.peek = function() {
      return this._head && this._head.value;
    };

    // @pragma Modification

    Stack.prototype.push = function(/*...values*/) {
      if (arguments.length === 0) {
        return this;
      }
      var newSize = this.size + arguments.length;
      var head = this._head;
      for (var ii = arguments.length - 1; ii >= 0; ii--) {
        head = {
          value: arguments[ii],
          next: head
        };
      }
      if (this.__ownerID) {
        this.size = newSize;
        this._head = head;
        this.__hash = undefined;
        this.__altered = true;
        return this;
      }
      return makeStack(newSize, head);
    };

    Stack.prototype.pushAll = function(iter) {
      iter = IndexedIterable(iter);
      if (iter.size === 0) {
        return this;
      }
      assertNotInfinite(iter.size);
      var newSize = this.size;
      var head = this._head;
      iter.reverse().forEach(function(value ) {
        newSize++;
        head = {
          value: value,
          next: head
        };
      });
      if (this.__ownerID) {
        this.size = newSize;
        this._head = head;
        this.__hash = undefined;
        this.__altered = true;
        return this;
      }
      return makeStack(newSize, head);
    };

    Stack.prototype.pop = function() {
      return this.slice(1);
    };

    Stack.prototype.unshift = function(/*...values*/) {
      return this.push.apply(this, arguments);
    };

    Stack.prototype.unshiftAll = function(iter) {
      return this.pushAll(iter);
    };

    Stack.prototype.shift = function() {
      return this.pop.apply(this, arguments);
    };

    Stack.prototype.clear = function() {
      if (this.size === 0) {
        return this;
      }
      if (this.__ownerID) {
        this.size = 0;
        this._head = undefined;
        this.__hash = undefined;
        this.__altered = true;
        return this;
      }
      return emptyStack();
    };

    Stack.prototype.slice = function(begin, end) {
      if (wholeSlice(begin, end, this.size)) {
        return this;
      }
      var resolvedBegin = resolveBegin(begin, this.size);
      var resolvedEnd = resolveEnd(end, this.size);
      if (resolvedEnd !== this.size) {
        // super.slice(begin, end);
        return IndexedCollection.prototype.slice.call(this, begin, end);
      }
      var newSize = this.size - resolvedBegin;
      var head = this._head;
      while (resolvedBegin--) {
        head = head.next;
      }
      if (this.__ownerID) {
        this.size = newSize;
        this._head = head;
        this.__hash = undefined;
        this.__altered = true;
        return this;
      }
      return makeStack(newSize, head);
    };

    // @pragma Mutability

    Stack.prototype.__ensureOwner = function(ownerID) {
      if (ownerID === this.__ownerID) {
        return this;
      }
      if (!ownerID) {
        this.__ownerID = ownerID;
        this.__altered = false;
        return this;
      }
      return makeStack(this.size, this._head, ownerID, this.__hash);
    };

    // @pragma Iteration

    Stack.prototype.__iterate = function(fn, reverse) {
      if (reverse) {
        return this.reverse().__iterate(fn);
      }
      var iterations = 0;
      var node = this._head;
      while (node) {
        if (fn(node.value, iterations++, this) === false) {
          break;
        }
        node = node.next;
      }
      return iterations;
    };

    Stack.prototype.__iterator = function(type, reverse) {
      if (reverse) {
        return this.reverse().__iterator(type);
      }
      var iterations = 0;
      var node = this._head;
      return new Iterator(function()  {
        if (node) {
          var value = node.value;
          node = node.next;
          return iteratorValue(type, iterations++, value);
        }
        return iteratorDone();
      });
    };


  function isStack(maybeStack) {
    return !!(maybeStack && maybeStack[IS_STACK_SENTINEL]);
  }

  Stack.isStack = isStack;

  var IS_STACK_SENTINEL = '@@__IMMUTABLE_STACK__@@';

  var StackPrototype = Stack.prototype;
  StackPrototype[IS_STACK_SENTINEL] = true;
  StackPrototype.withMutations = MapPrototype.withMutations;
  StackPrototype.asMutable = MapPrototype.asMutable;
  StackPrototype.asImmutable = MapPrototype.asImmutable;
  StackPrototype.wasAltered = MapPrototype.wasAltered;


  function makeStack(size, head, ownerID, hash) {
    var map = Object.create(StackPrototype);
    map.size = size;
    map._head = head;
    map.__ownerID = ownerID;
    map.__hash = hash;
    map.__altered = false;
    return map;
  }

  var EMPTY_STACK;
  function emptyStack() {
    return EMPTY_STACK || (EMPTY_STACK = makeStack(0));
  }

  /**
   * Contributes additional methods to a constructor
   */
  function mixin(ctor, methods) {
    var keyCopier = function(key ) { ctor.prototype[key] = methods[key]; };
    Object.keys(methods).forEach(keyCopier);
    Object.getOwnPropertySymbols &&
      Object.getOwnPropertySymbols(methods).forEach(keyCopier);
    return ctor;
  }

  Iterable.Iterator = Iterator;

  mixin(Iterable, {

    // ### Conversion to other types

    toArray: function() {
      assertNotInfinite(this.size);
      var array = new Array(this.size || 0);
      this.valueSeq().__iterate(function(v, i)  { array[i] = v; });
      return array;
    },

    toIndexedSeq: function() {
      return new ToIndexedSequence(this);
    },

    toJS: function() {
      return this.toSeq().map(
        function(value ) {return value && typeof value.toJS === 'function' ? value.toJS() : value}
      ).__toJS();
    },

    toJSON: function() {
      return this.toSeq().map(
        function(value ) {return value && typeof value.toJSON === 'function' ? value.toJSON() : value}
      ).__toJS();
    },

    toKeyedSeq: function() {
      return new ToKeyedSequence(this, true);
    },

    toMap: function() {
      // Use Late Binding here to solve the circular dependency.
      return Map(this.toKeyedSeq());
    },

    toObject: function() {
      assertNotInfinite(this.size);
      var object = {};
      this.__iterate(function(v, k)  { object[k] = v; });
      return object;
    },

    toOrderedMap: function() {
      // Use Late Binding here to solve the circular dependency.
      return OrderedMap(this.toKeyedSeq());
    },

    toOrderedSet: function() {
      // Use Late Binding here to solve the circular dependency.
      return OrderedSet(isKeyed(this) ? this.valueSeq() : this);
    },

    toSet: function() {
      // Use Late Binding here to solve the circular dependency.
      return Set(isKeyed(this) ? this.valueSeq() : this);
    },

    toSetSeq: function() {
      return new ToSetSequence(this);
    },

    toSeq: function() {
      return isIndexed(this) ? this.toIndexedSeq() :
        isKeyed(this) ? this.toKeyedSeq() :
        this.toSetSeq();
    },

    toStack: function() {
      // Use Late Binding here to solve the circular dependency.
      return Stack(isKeyed(this) ? this.valueSeq() : this);
    },

    toList: function() {
      // Use Late Binding here to solve the circular dependency.
      return List(isKeyed(this) ? this.valueSeq() : this);
    },


    // ### Common JavaScript methods and properties

    toString: function() {
      return '[Iterable]';
    },

    __toString: function(head, tail) {
      if (this.size === 0) {
        return head + tail;
      }
      return head + ' ' + this.toSeq().map(this.__toStringMapper).join(', ') + ' ' + tail;
    },


    // ### ES6 Collection methods (ES6 Array and Map)

    concat: function() {var values = SLICE$0.call(arguments, 0);
      return reify(this, concatFactory(this, values));
    },

    includes: function(searchValue) {
      return this.some(function(value ) {return is(value, searchValue)});
    },

    entries: function() {
      return this.__iterator(ITERATE_ENTRIES);
    },

    every: function(predicate, context) {
      assertNotInfinite(this.size);
      var returnValue = true;
      this.__iterate(function(v, k, c)  {
        if (!predicate.call(context, v, k, c)) {
          returnValue = false;
          return false;
        }
      });
      return returnValue;
    },

    filter: function(predicate, context) {
      return reify(this, filterFactory(this, predicate, context, true));
    },

    find: function(predicate, context, notSetValue) {
      var entry = this.findEntry(predicate, context);
      return entry ? entry[1] : notSetValue;
    },

    forEach: function(sideEffect, context) {
      assertNotInfinite(this.size);
      return this.__iterate(context ? sideEffect.bind(context) : sideEffect);
    },

    join: function(separator) {
      assertNotInfinite(this.size);
      separator = separator !== undefined ? '' + separator : ',';
      var joined = '';
      var isFirst = true;
      this.__iterate(function(v ) {
        isFirst ? (isFirst = false) : (joined += separator);
        joined += v !== null && v !== undefined ? v.toString() : '';
      });
      return joined;
    },

    keys: function() {
      return this.__iterator(ITERATE_KEYS);
    },

    map: function(mapper, context) {
      return reify(this, mapFactory(this, mapper, context));
    },

    reduce: function(reducer, initialReduction, context) {
      assertNotInfinite(this.size);
      var reduction;
      var useFirst;
      if (arguments.length < 2) {
        useFirst = true;
      } else {
        reduction = initialReduction;
      }
      this.__iterate(function(v, k, c)  {
        if (useFirst) {
          useFirst = false;
          reduction = v;
        } else {
          reduction = reducer.call(context, reduction, v, k, c);
        }
      });
      return reduction;
    },

    reduceRight: function(reducer, initialReduction, context) {
      var reversed = this.toKeyedSeq().reverse();
      return reversed.reduce.apply(reversed, arguments);
    },

    reverse: function() {
      return reify(this, reverseFactory(this, true));
    },

    slice: function(begin, end) {
      return reify(this, sliceFactory(this, begin, end, true));
    },

    some: function(predicate, context) {
      return !this.every(not(predicate), context);
    },

    sort: function(comparator) {
      return reify(this, sortFactory(this, comparator));
    },

    values: function() {
      return this.__iterator(ITERATE_VALUES);
    },


    // ### More sequential methods

    butLast: function() {
      return this.slice(0, -1);
    },

    isEmpty: function() {
      return this.size !== undefined ? this.size === 0 : !this.some(function()  {return true});
    },

    count: function(predicate, context) {
      return ensureSize(
        predicate ? this.toSeq().filter(predicate, context) : this
      );
    },

    countBy: function(grouper, context) {
      return countByFactory(this, grouper, context);
    },

    equals: function(other) {
      return deepEqual(this, other);
    },

    entrySeq: function() {
      var iterable = this;
      if (iterable._cache) {
        // We cache as an entries array, so we can just return the cache!
        return new ArraySeq(iterable._cache);
      }
      var entriesSequence = iterable.toSeq().map(entryMapper).toIndexedSeq();
      entriesSequence.fromEntrySeq = function()  {return iterable.toSeq()};
      return entriesSequence;
    },

    filterNot: function(predicate, context) {
      return this.filter(not(predicate), context);
    },

    findEntry: function(predicate, context, notSetValue) {
      var found = notSetValue;
      this.__iterate(function(v, k, c)  {
        if (predicate.call(context, v, k, c)) {
          found = [k, v];
          return false;
        }
      });
      return found;
    },

    findKey: function(predicate, context) {
      var entry = this.findEntry(predicate, context);
      return entry && entry[0];
    },

    findLast: function(predicate, context, notSetValue) {
      return this.toKeyedSeq().reverse().find(predicate, context, notSetValue);
    },

    findLastEntry: function(predicate, context, notSetValue) {
      return this.toKeyedSeq().reverse().findEntry(predicate, context, notSetValue);
    },

    findLastKey: function(predicate, context) {
      return this.toKeyedSeq().reverse().findKey(predicate, context);
    },

    first: function() {
      return this.find(returnTrue);
    },

    flatMap: function(mapper, context) {
      return reify(this, flatMapFactory(this, mapper, context));
    },

    flatten: function(depth) {
      return reify(this, flattenFactory(this, depth, true));
    },

    fromEntrySeq: function() {
      return new FromEntriesSequence(this);
    },

    get: function(searchKey, notSetValue) {
      return this.find(function(_, key)  {return is(key, searchKey)}, undefined, notSetValue);
    },

    getIn: function(searchKeyPath, notSetValue) {
      var nested = this;
      // Note: in an ES6 environment, we would prefer:
      // for (var key of searchKeyPath) {
      var iter = forceIterator(searchKeyPath);
      var step;
      while (!(step = iter.next()).done) {
        var key = step.value;
        nested = nested && nested.get ? nested.get(key, NOT_SET) : NOT_SET;
        if (nested === NOT_SET) {
          return notSetValue;
        }
      }
      return nested;
    },

    groupBy: function(grouper, context) {
      return groupByFactory(this, grouper, context);
    },

    has: function(searchKey) {
      return this.get(searchKey, NOT_SET) !== NOT_SET;
    },

    hasIn: function(searchKeyPath) {
      return this.getIn(searchKeyPath, NOT_SET) !== NOT_SET;
    },

    isSubset: function(iter) {
      iter = typeof iter.includes === 'function' ? iter : Iterable(iter);
      return this.every(function(value ) {return iter.includes(value)});
    },

    isSuperset: function(iter) {
      iter = typeof iter.isSubset === 'function' ? iter : Iterable(iter);
      return iter.isSubset(this);
    },

    keyOf: function(searchValue) {
      return this.findKey(function(value ) {return is(value, searchValue)});
    },

    keySeq: function() {
      return this.toSeq().map(keyMapper).toIndexedSeq();
    },

    last: function() {
      return this.toSeq().reverse().first();
    },

    lastKeyOf: function(searchValue) {
      return this.toKeyedSeq().reverse().keyOf(searchValue);
    },

    max: function(comparator) {
      return maxFactory(this, comparator);
    },

    maxBy: function(mapper, comparator) {
      return maxFactory(this, comparator, mapper);
    },

    min: function(comparator) {
      return maxFactory(this, comparator ? neg(comparator) : defaultNegComparator);
    },

    minBy: function(mapper, comparator) {
      return maxFactory(this, comparator ? neg(comparator) : defaultNegComparator, mapper);
    },

    rest: function() {
      return this.slice(1);
    },

    skip: function(amount) {
      return this.slice(Math.max(0, amount));
    },

    skipLast: function(amount) {
      return reify(this, this.toSeq().reverse().skip(amount).reverse());
    },

    skipWhile: function(predicate, context) {
      return reify(this, skipWhileFactory(this, predicate, context, true));
    },

    skipUntil: function(predicate, context) {
      return this.skipWhile(not(predicate), context);
    },

    sortBy: function(mapper, comparator) {
      return reify(this, sortFactory(this, comparator, mapper));
    },

    take: function(amount) {
      return this.slice(0, Math.max(0, amount));
    },

    takeLast: function(amount) {
      return reify(this, this.toSeq().reverse().take(amount).reverse());
    },

    takeWhile: function(predicate, context) {
      return reify(this, takeWhileFactory(this, predicate, context));
    },

    takeUntil: function(predicate, context) {
      return this.takeWhile(not(predicate), context);
    },

    valueSeq: function() {
      return this.toIndexedSeq();
    },


    // ### Hashable Object

    hashCode: function() {
      return this.__hash || (this.__hash = hashIterable(this));
    }


    // ### Internal

    // abstract __iterate(fn, reverse)

    // abstract __iterator(type, reverse)
  });

  // var IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
  // var IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
  // var IS_INDEXED_SENTINEL = '@@__IMMUTABLE_INDEXED__@@';
  // var IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';

  var IterablePrototype = Iterable.prototype;
  IterablePrototype[IS_ITERABLE_SENTINEL] = true;
  IterablePrototype[ITERATOR_SYMBOL] = IterablePrototype.values;
  IterablePrototype.__toJS = IterablePrototype.toArray;
  IterablePrototype.__toStringMapper = quoteString;
  IterablePrototype.inspect =
  IterablePrototype.toSource = function() { return this.toString(); };
  IterablePrototype.chain = IterablePrototype.flatMap;
  IterablePrototype.contains = IterablePrototype.includes;

  mixin(KeyedIterable, {

    // ### More sequential methods

    flip: function() {
      return reify(this, flipFactory(this));
    },

    mapEntries: function(mapper, context) {var this$0 = this;
      var iterations = 0;
      return reify(this,
        this.toSeq().map(
          function(v, k)  {return mapper.call(context, [k, v], iterations++, this$0)}
        ).fromEntrySeq()
      );
    },

    mapKeys: function(mapper, context) {var this$0 = this;
      return reify(this,
        this.toSeq().flip().map(
          function(k, v)  {return mapper.call(context, k, v, this$0)}
        ).flip()
      );
    }

  });

  var KeyedIterablePrototype = KeyedIterable.prototype;
  KeyedIterablePrototype[IS_KEYED_SENTINEL] = true;
  KeyedIterablePrototype[ITERATOR_SYMBOL] = IterablePrototype.entries;
  KeyedIterablePrototype.__toJS = IterablePrototype.toObject;
  KeyedIterablePrototype.__toStringMapper = function(v, k)  {return JSON.stringify(k) + ': ' + quoteString(v)};



  mixin(IndexedIterable, {

    // ### Conversion to other types

    toKeyedSeq: function() {
      return new ToKeyedSequence(this, false);
    },


    // ### ES6 Collection methods (ES6 Array and Map)

    filter: function(predicate, context) {
      return reify(this, filterFactory(this, predicate, context, false));
    },

    findIndex: function(predicate, context) {
      var entry = this.findEntry(predicate, context);
      return entry ? entry[0] : -1;
    },

    indexOf: function(searchValue) {
      var key = this.keyOf(searchValue);
      return key === undefined ? -1 : key;
    },

    lastIndexOf: function(searchValue) {
      var key = this.lastKeyOf(searchValue);
      return key === undefined ? -1 : key;
    },

    reverse: function() {
      return reify(this, reverseFactory(this, false));
    },

    slice: function(begin, end) {
      return reify(this, sliceFactory(this, begin, end, false));
    },

    splice: function(index, removeNum /*, ...values*/) {
      var numArgs = arguments.length;
      removeNum = Math.max(removeNum | 0, 0);
      if (numArgs === 0 || (numArgs === 2 && !removeNum)) {
        return this;
      }
      // If index is negative, it should resolve relative to the size of the
      // collection. However size may be expensive to compute if not cached, so
      // only call count() if the number is in fact negative.
      index = resolveBegin(index, index < 0 ? this.count() : this.size);
      var spliced = this.slice(0, index);
      return reify(
        this,
        numArgs === 1 ?
          spliced :
          spliced.concat(arrCopy(arguments, 2), this.slice(index + removeNum))
      );
    },


    // ### More collection methods

    findLastIndex: function(predicate, context) {
      var entry = this.findLastEntry(predicate, context);
      return entry ? entry[0] : -1;
    },

    first: function() {
      return this.get(0);
    },

    flatten: function(depth) {
      return reify(this, flattenFactory(this, depth, false));
    },

    get: function(index, notSetValue) {
      index = wrapIndex(this, index);
      return (index < 0 || (this.size === Infinity ||
          (this.size !== undefined && index > this.size))) ?
        notSetValue :
        this.find(function(_, key)  {return key === index}, undefined, notSetValue);
    },

    has: function(index) {
      index = wrapIndex(this, index);
      return index >= 0 && (this.size !== undefined ?
        this.size === Infinity || index < this.size :
        this.indexOf(index) !== -1
      );
    },

    interpose: function(separator) {
      return reify(this, interposeFactory(this, separator));
    },

    interleave: function(/*...iterables*/) {
      var iterables = [this].concat(arrCopy(arguments));
      var zipped = zipWithFactory(this.toSeq(), IndexedSeq.of, iterables);
      var interleaved = zipped.flatten(true);
      if (zipped.size) {
        interleaved.size = zipped.size * iterables.length;
      }
      return reify(this, interleaved);
    },

    keySeq: function() {
      return Range(0, this.size);
    },

    last: function() {
      return this.get(-1);
    },

    skipWhile: function(predicate, context) {
      return reify(this, skipWhileFactory(this, predicate, context, false));
    },

    zip: function(/*, ...iterables */) {
      var iterables = [this].concat(arrCopy(arguments));
      return reify(this, zipWithFactory(this, defaultZipper, iterables));
    },

    zipWith: function(zipper/*, ...iterables */) {
      var iterables = arrCopy(arguments);
      iterables[0] = this;
      return reify(this, zipWithFactory(this, zipper, iterables));
    }

  });

  IndexedIterable.prototype[IS_INDEXED_SENTINEL] = true;
  IndexedIterable.prototype[IS_ORDERED_SENTINEL] = true;



  mixin(SetIterable, {

    // ### ES6 Collection methods (ES6 Array and Map)

    get: function(value, notSetValue) {
      return this.has(value) ? value : notSetValue;
    },

    includes: function(value) {
      return this.has(value);
    },


    // ### More sequential methods

    keySeq: function() {
      return this.valueSeq();
    }

  });

  SetIterable.prototype.has = IterablePrototype.includes;
  SetIterable.prototype.contains = SetIterable.prototype.includes;


  // Mixin subclasses

  mixin(KeyedSeq, KeyedIterable.prototype);
  mixin(IndexedSeq, IndexedIterable.prototype);
  mixin(SetSeq, SetIterable.prototype);

  mixin(KeyedCollection, KeyedIterable.prototype);
  mixin(IndexedCollection, IndexedIterable.prototype);
  mixin(SetCollection, SetIterable.prototype);


  // #pragma Helper functions

  function keyMapper(v, k) {
    return k;
  }

  function entryMapper(v, k) {
    return [k, v];
  }

  function not(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    }
  }

  function neg(predicate) {
    return function() {
      return -predicate.apply(this, arguments);
    }
  }

  function quoteString(value) {
    return typeof value === 'string' ? JSON.stringify(value) : String(value);
  }

  function defaultZipper() {
    return arrCopy(arguments);
  }

  function defaultNegComparator(a, b) {
    return a < b ? 1 : a > b ? -1 : 0;
  }

  function hashIterable(iterable) {
    if (iterable.size === Infinity) {
      return 0;
    }
    var ordered = isOrdered(iterable);
    var keyed = isKeyed(iterable);
    var h = ordered ? 1 : 0;
    var size = iterable.__iterate(
      keyed ?
        ordered ?
          function(v, k)  { h = 31 * h + hashMerge(hash(v), hash(k)) | 0; } :
          function(v, k)  { h = h + hashMerge(hash(v), hash(k)) | 0; } :
        ordered ?
          function(v ) { h = 31 * h + hash(v) | 0; } :
          function(v ) { h = h + hash(v) | 0; }
    );
    return murmurHashOfSize(size, h);
  }

  function murmurHashOfSize(size, h) {
    h = imul(h, 0xCC9E2D51);
    h = imul(h << 15 | h >>> -15, 0x1B873593);
    h = imul(h << 13 | h >>> -13, 5);
    h = (h + 0xE6546B64 | 0) ^ size;
    h = imul(h ^ h >>> 16, 0x85EBCA6B);
    h = imul(h ^ h >>> 13, 0xC2B2AE35);
    h = smi(h ^ h >>> 16);
    return h;
  }

  function hashMerge(a, b) {
    return a ^ b + 0x9E3779B9 + (a << 6) + (a >> 2) | 0; // int
  }

  var Immutable = {

    Iterable: Iterable,

    Seq: Seq,
    Collection: Collection,
    Map: Map,
    OrderedMap: OrderedMap,
    List: List,
    Stack: Stack,
    Set: Set,
    OrderedSet: OrderedSet,

    Record: Record,
    Range: Range,
    Repeat: Repeat,

    is: is,
    fromJS: fromJS

  };

  return Immutable;

}));
},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = activeItem;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// TODO: Split this out as a separate react component and add as a dependency

function activeItem(WrappedComponent) {
  return function (_React$Component) {
    _inherits(ActiveItem, _React$Component);

    function ActiveItem(props) {
      _classCallCheck(this, ActiveItem);

      var _this = _possibleConstructorReturn(this, (ActiveItem.__proto__ || Object.getPrototypeOf(ActiveItem)).call(this, props));

      _this.state = { items: _this.props.items };
      _this._bindInit();
      return _this;
    }

    _createClass(ActiveItem, [{
      key: '_bindInit',
      value: function _bindInit() {
        this.getActiveItem = this.getActiveItem.bind(this);
        this.setActiveItem = this.setActiveItem.bind(this);
        this.getActiveItemIndex = this.getActiveItemIndex.bind(this);
        this._hasFocus = this._hasFocus.bind(this);
        this._updateFocus = this._updateFocus.bind(this);
        this._immutableAssets = this._immutableAssets.bind(this);
        this._unFocused = this._unFocused.bind(this);
        this._handlers = this._handlers.bind(this);
      }
    }, {
      key: 'setActiveItem',
      value: function setActiveItem(i, e) {
        if (typeof e != 'undefined') {
          e.preventDefault();
        }
        this.setState({ items: this._updateFocus(this._unFocused(), i, true).toJS() });
      }
    }, {
      key: 'getActiveItem',
      value: function getActiveItem() {
        return this.state.items.find(this._hasFocus);
      }
    }, {
      key: 'getActiveItemIndex',
      value: function getActiveItemIndex() {
        return this.state.items.findIndex(this._hasFocus);
      }

      // "private"

    }, {
      key: '_hasFocus',
      value: function _hasFocus(item) {
        return item.focus == true;
      }
    }, {
      key: '_unFocused',
      value: function _unFocused() {
        return this._updateFocus(this._immutableAssets(), this.getActiveItemIndex(), false);
      }
    }, {
      key: '_updateFocus',
      value: function _updateFocus(list, i, status) {
        return list.update(i, function (item) {
          return item.set('focus', status);
        });
      }
    }, {
      key: '_immutableAssets',
      value: function _immutableAssets() {
        return new _immutable2.default.fromJS(this.state.items);
      }
    }, {
      key: '_handlers',
      value: function _handlers() {
        return {
          setActiveItem: this.setActiveItem.bind(this),
          getActiveItem: this.getActiveItem.bind(this),
          getActiveItemIndex: this.getActiveItemIndex.bind(this)
        };
      }
    }, {
      key: 'render',
      value: function render() {
        return _react2.default.createElement(WrappedComponent, _extends({}, this.props, this.state, this._handlers()));
      }
    }]);

    return ActiveItem;
  }(_react2.default.Component);
}
},{"immutable":1,"react":undefined}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _citeCitationRender = require('./cite-citation-render');

var _citeCitationRender2 = _interopRequireDefault(_citeCitationRender);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CitationChicago = function (_React$Component) {
  _inherits(CitationChicago, _React$Component);

  function CitationChicago(props) {
    _classCallCheck(this, CitationChicago);

    return _possibleConstructorReturn(this, (CitationChicago.__proto__ || Object.getPrototypeOf(CitationChicago)).call(this, props));
  }

  _createClass(CitationChicago, [{
    key: 'mappings',
    value: function mappings() {
      var map = [{ creator: { prefix: '', suffix: '.' } }, { creation_date: { prefix: ' ', suffix: '. ' } }, { title: { prefix: '"', suffix: '." ' } }, { contributing_organization: { prefix: ' ', suffix: ', ' } }, { current_date: { prefix: 'Accessed ', suffix: '. ', formatters: [this.format_date] } }, { url: { prefix: '', suffix: '' } }];
      return map;
    }
  }, {
    key: 'format_date',
    value: function format_date(timestamp) {
      var date = new Date(timestamp);
      var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      var month = months[date.getMonth()];
      var year = date.getFullYear();
      var day = date.getDate();
      return month + ' ' + day + ', ' + year;
    }
  }, {
    key: 'render',
    value: function render() {
      return this.props.render_citation({ mappings: this.mappings() });
    }
  }]);

  return CitationChicago;
}(_react2.default.Component);

var propTypes = {
  creator: _react2.default.PropTypes.string,
  creation_date: _react2.default.PropTypes.string,
  title: _react2.default.PropTypes.string,
  contributing_organization: _react2.default.PropTypes.string,
  url: _react2.default.PropTypes.string,
  mapping: _react2.default.PropTypes.object
};

CitationChicago.propTypes = propTypes;

exports.default = (0, _citeCitationRender2.default)(CitationChicago);

},{"./cite-citation-render":6,"react":undefined}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _citeCitationRender = require('./cite-citation-render');

var _citeCitationRender2 = _interopRequireDefault(_citeCitationRender);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CitationCoins = function (_React$Component) {
  _inherits(CitationCoins, _React$Component);

  function CitationCoins(props) {
    _classCallCheck(this, CitationCoins);

    var _this = _possibleConstructorReturn(this, (CitationCoins.__proto__ || Object.getPrototypeOf(CitationCoins)).call(this, props));

    _this.mappings = _this.mappings.bind(_this);
    return _this;
  }

  _createClass(CitationCoins, [{
    key: 'mulitvalue_field',
    value: function mulitvalue_field(values) {
      values.join(',');
    }
  }, {
    key: 'mappings',
    value: function mappings() {
      var defaultMapping = [{ creator: { prefix: '&amp;rft.creator', suffix: '', formatters: [encodeURIComponent] } }, { creation_date: { prefix: ' ', suffix: '.', formatters: [encodeURIComponent] } }, { title: { prefix: '&amp;rft.title=', suffix: '', formatters: [encodeURIComponent] } }, { description: { prefix: '&amp;rft.description=', suffix: '', formatters: [encodeURIComponent] } }, { subject: { prefix: '&amp;rft.subject=', suffix: '', formatters: [this.mulitvalue_field, encodeURIComponent] } }, { description: { prefix: '&amp;rft.description=', suffix: '', formatters: [encodeURIComponent] } }, { contributing_organization: { prefix: 'publisher', suffix: '', formatters: [encodeURIComponent] } }, { type: { prefix: '&amp;rft.type=', suffix: '', formatters: [encodeURIComponent] } }, { format: { prefix: '&amp;rft.format=', suffix: '', formatters: [encodeURIComponent] } }, { rights: { prefix: '&amp;rft.rights=', suffix: '', formatters: [encodeURIComponent] } }, { url: { prefix: '&amp;rft.identifier=', suffix: '', formatters: [encodeURIComponent] } }];
      return this.props.override_mappings(defaultMapping);
    }
  }, {
    key: 'render',
    value: function render() {
      var title = "ctx_ver=Z39.88-2004&amp;rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Adc";
      return this.props.render_citation({ prefix: '<span className="Z3988" title=' + title, suffix: '</span>', mappings: this.mappings(), render_html: true });
    }
  }]);

  return CitationCoins;
}(_react2.default.Component);

var propTypes = {
  creator: _react2.default.PropTypes.string,
  creation_date: _react2.default.PropTypes.string,
  title: _react2.default.PropTypes.string,
  description: _react2.default.PropTypes.string,
  contributing_organization: _react2.default.PropTypes.string,
  type: _react2.default.PropTypes.string,
  format: _react2.default.PropTypes.string,
  rights: _react2.default.PropTypes.string,
  url: _react2.default.PropTypes.string,
  mapping: _react2.default.PropTypes.object
};

CitationCoins.defaultProps = {
  mappings: [{}]
};

CitationCoins.propTypes = propTypes;

exports.default = (0, _citeCitationRender2.default)(CitationCoins);

},{"./cite-citation-render":6,"react":undefined}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _citeCitationRender = require('./cite-citation-render');

var _citeCitationRender2 = _interopRequireDefault(_citeCitationRender);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CitationMla = function (_React$Component) {
  _inherits(CitationMla, _React$Component);

  function CitationMla(props) {
    _classCallCheck(this, CitationMla);

    return _possibleConstructorReturn(this, (CitationMla.__proto__ || Object.getPrototypeOf(CitationMla)).call(this, props));
  }

  _createClass(CitationMla, [{
    key: 'italicize',
    value: function italicize(text) {
      return '<i>' + text + '</i>';
    }
  }, {
    key: 'removeProtocols',
    value: function removeProtocols(url) {
      return url.replace(/http:\/\/|https:\/\//i, '');
    }
  }, {
    key: 'format_date',
    value: function format_date(timestamp) {
      var date = new Date(timestamp);
      var months = ['Jan', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
      var month = months[date.getMonth()];
      var year = date.getFullYear();
      var day = date.getDate();
      return day + ' ' + month + ' ' + year;
    }
  }, {
    key: 'mappings',
    value: function mappings() {
      var map = [{ creator: { prefix: '', suffix: '.' } }, { title: { prefix: ' ', suffix: '.', formatters: [this.italicize] } }, { creation_date: { prefix: ' ', suffix: '.' } }, { contributing_organization: { prefix: ' ', suffix: ', ' } }, { url: { prefix: '', suffix: '', formatters: [this.removeProtocols] } }, { current_date: { prefix: ' Accessed ', suffix: '.', formatters: [this.format_date] } }];
      return map;
    }
  }, {
    key: 'render',
    value: function render() {
      return this.props.render_citation({ mappings: this.mappings(), render_html: true });
    }
  }]);

  return CitationMla;
}(_react2.default.Component);

var propTypes = {
  creator: _react2.default.PropTypes.string,
  creation_date: _react2.default.PropTypes.string,
  title: _react2.default.PropTypes.object,
  contributing_organization: _react2.default.PropTypes.string,
  url: _react2.default.PropTypes.string,
  mapping: _react2.default.PropTypes.object
};

CitationMla.propTypes = propTypes;

exports.default = (0, _citeCitationRender2.default)(CitationMla);

},{"./cite-citation-render":6,"react":undefined}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = citationRender;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function citationRender(CitationFormat) {
  return function (_React$Component) {
    _inherits(Citation, _React$Component);

    function Citation(props) {
      _classCallCheck(this, Citation);

      var _this = _possibleConstructorReturn(this, (Citation.__proto__ || Object.getPrototypeOf(Citation)).call(this, props));

      _this.render_citation = _this.render_citation.bind(_this);
      _this._format = _this._format.bind(_this);
      _this.override_mappings = _this.override_mappings.bind(_this);
      _this._override_mapping = _this._override_mapping.bind(_this);
      _this._values = _this._values.bind(_this);
      return _this;
    }

    _createClass(Citation, [{
      key: 'override_mappings',
      value: function override_mappings(mappings) {
        var _this2 = this;

        return mappings.map(function (mapping) {
          return _this2._override_mapping(mapping)[0];
        });
        return mapped;
      }
    }, {
      key: 'render_citation',
      value: function render_citation(_ref) {
        var _ref$mappings = _ref.mappings,
            mappings = _ref$mappings === undefined ? [] : _ref$mappings,
            _ref$render_html = _ref.render_html,
            render_html = _ref$render_html === undefined ? false : _ref$render_html,
            _ref$prefix = _ref.prefix,
            prefix = _ref$prefix === undefined ? '' : _ref$prefix,
            _ref$suffix = _ref.suffix,
            suffix = _ref$suffix === undefined ? '' : _ref$suffix;

        if (render_html) {
          return _react2.default.createElement(
            'span',
            null,
            _react2.default.createElement('div', { dangerouslySetInnerHTML: { __html: prefix + this._values(mappings) + suffix } })
          );
        } else {
          return _react2.default.createElement(
            'span',
            null,
            prefix,
            this._values(mappings),
            prefix
          );
        }
      }
    }, {
      key: '_values',
      value: function _values(mappings) {
        var affix = this._affix;
        var format = this._format;
        var props = this.props;
        var values = [];
        mappings.map(function (field, i) {
          var field_name = Object.keys(field)[0];
          var val = props.field_values[field_name];
          if (val) {
            var config = field[field_name];
            var formatted = format(val, config.formatters);
            values.push(affix(formatted, config.prefix, config.suffix));
          }
        });
        return values.join('');
      }
    }, {
      key: '_affix',
      value: function _affix(value, prefix, suffix) {
        return value ? prefix + value + suffix : '';
      }
    }, {
      key: '_format',
      value: function _format(value) {
        var formatters = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [function (value) {
          return value;
        }];

        return formatters.map(function (formatter) {
          return formatter(value);
        }, value);
      }
    }, {
      key: '_override_mapping',
      value: function _override_mapping(mapping) {
        return this.props.mappings.map(function (mapping_override) {
          if (mapping[Object.keys(mapping_override)[0]]) {
            return mapping_override;
          } else {
            return mapping;
          }
        });
      }
    }, {
      key: 'render',
      value: function render() {
        return _react2.default.createElement(CitationFormat, _extends({}, this.props, {
          override_mappings: this.override_mappings,
          render_citation: this.render_citation }));
      }
    }]);

    return Citation;
  }(_react2.default.Component);
}

},{"react":undefined}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _citeCitationRender = require('./cite-citation-render');

var _citeCitationRender2 = _interopRequireDefault(_citeCitationRender);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CitationWikipedia = function (_React$Component) {
  _inherits(CitationWikipedia, _React$Component);

  function CitationWikipedia(props) {
    _classCallCheck(this, CitationWikipedia);

    return _possibleConstructorReturn(this, (CitationWikipedia.__proto__ || Object.getPrototypeOf(CitationWikipedia)).call(this, props));
  }

  _createClass(CitationWikipedia, [{
    key: 'removeProtocols',
    value: function removeProtocols(url) {
      return url.replace(/http:\/\/|https:\/\//i, '');
    }
  }, {
    key: 'mappings',
    value: function mappings() {
      var map = [{ ref_name: { prefix: '<ref name=', suffix: '> {{' } }, { url: { prefix: 'cite web | url=', suffix: '' } }, { type: { prefix: ' | title= (', suffix: ') ' } }, { title: { prefix: '', suffix: ',' } }, { creation_date: { prefix: '(', suffix: ')' } }, { creator: { prefix: ' | author=', suffix: '' } }, { current_date: { prefix: ' | accessdate=', suffix: '' } }, { contributing_organization: { prefix: ' | publisher=', suffix: '}} </ref>' } }];
      return map;
    }
  }, {
    key: 'render',
    value: function render() {
      return this.props.render_citation({ mappings: this.mappings() });
    }
  }]);

  return CitationWikipedia;
}(_react2.default.Component);

var propTypes = {
  ref_name: _react2.default.PropTypes.string,
  creator: _react2.default.PropTypes.string,
  creation_date: _react2.default.PropTypes.string,
  title: _react2.default.PropTypes.string,
  contributing_organization: _react2.default.PropTypes.string,
  url: _react2.default.PropTypes.string,
  mapping: _react2.default.PropTypes.object
};

CitationWikipedia.propTypes = propTypes;

exports.default = (0, _citeCitationRender2.default)(CitationWikipedia);

},{"./cite-citation-render":6,"react":undefined}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _citeCitationCoins = require('./cite-citation-coins');

var _citeCitationCoins2 = _interopRequireDefault(_citeCitationCoins);

var _citeCitationChicago = require('./cite-citation-chicago');

var _citeCitationChicago2 = _interopRequireDefault(_citeCitationChicago);

var _citeCitationMla = require('./cite-citation-mla');

var _citeCitationMla2 = _interopRequireDefault(_citeCitationMla);

var _citeCitationWikipedia = require('./cite-citation-wikipedia');

var _citeCitationWikipedia2 = _interopRequireDefault(_citeCitationWikipedia);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Citation = function (_React$Component) {
  _inherits(Citation, _React$Component);

  function Citation(props) {
    _classCallCheck(this, Citation);

    var _this = _possibleConstructorReturn(this, (Citation.__proto__ || Object.getPrototypeOf(Citation)).call(this, props));

    _this._citationType = _this._citationType.bind(_this);
    return _this;
  }

  _createClass(Citation, [{
    key: '_citationType',
    value: function _citationType() {
      var item = this.props.getActiveItem();
      switch (item.type) {
        case 'chicago':
          return _react2.default.createElement(_citeCitationChicago2.default, _extends({ className: 'chicago' }, fields));
        case 'mla':
          return _react2.default.createElement(_citeCitationMla2.default, _extends({ className: 'mla' }, fields));
        case 'wiki':
          return _react2.default.createElement(_citeCitationWikipedia2.default, _extends({ className: 'wiki' }, fields));
        default:
          return _react2.default.createElement(
            'div',
            null,
            'No Viewer Avaialable for type: ',
            item.type
          );
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var fields = this.props.fields;
      return _react2.default.createElement(
        'div',
        { className: 'citation' },
        this._citationType()
      );
    }
  }]);

  return Citation;
}(_react2.default.Component);

exports.default = Citation;


var propTypes = {
  fields: _react2.default.PropTypes.array,
  mapping: _react2.default.PropTypes.object
};

_citeCitationChicago2.default.propTypes = propTypes;

},{"./cite-citation-chicago":3,"./cite-citation-coins":4,"./cite-citation-mla":5,"./cite-citation-wikipedia":7,"react":undefined}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DetailsFieldValue = function (_React$Component) {
  _inherits(DetailsFieldValue, _React$Component);

  function DetailsFieldValue(props) {
    _classCallCheck(this, DetailsFieldValue);

    var _this = _possibleConstructorReturn(this, (DetailsFieldValue.__proto__ || Object.getPrototypeOf(DetailsFieldValue)).call(this, props));

    _this._field = _this._field.bind(_this);
    _this._link = _this._link.bind(_this);
    _this._danger = _this._danger.bind(_this);
    _this._delimiter = _this._delimiter.bind(_this);
    _this._text = _this._text.bind(_this);
    return _this;
  }

  _createClass(DetailsFieldValue, [{
    key: '_createMarkup',
    value: function _createMarkup(value) {
      return { __html: value };
    }
  }, {
    key: '_link',
    value: function _link() {
      return '<a href="' + this.props.url + '">' + this.props.text + '</a>';
    }
  }, {
    key: '_field',
    value: function _field() {
      if (this.props.url) {
        return this._danger(this._link());
      } else {
        return this._danger(this.props.text);
      }
    }
  }, {
    key: '_danger',
    value: function _danger(html) {
      return _react2.default.createElement('div', { dangerouslySetInnerHTML: this._createMarkup(html) });
    }
  }, {
    key: '_text',
    value: function _text() {
      return this.props.text == 'undefined' ? this._danger(this.props.text) : '';
    }
  }, {
    key: '_delimiter',
    value: function _delimiter() {
      return this.props.delimiter == 'undefined' ? this._danger(this.props.delimiter) : '';
    }
  }, {
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'span',
        null,
        this._field(),
        this._delimiter()
      );
    }
  }]);

  return DetailsFieldValue;
}(_react2.default.Component);

exports.default = DetailsFieldValue;


var propTypes = {
  text: _react2.default.PropTypes.string.isRequired,
  delimiter: _react2.default.PropTypes.string,
  url: _react2.default.PropTypes.string
};

DetailsFieldValue.propTypes = propTypes;

},{"react":undefined}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _citeDetailsFieldValue = require('./cite-details-field-value');

var _citeDetailsFieldValue2 = _interopRequireDefault(_citeDetailsFieldValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DetailsField = function (_React$Component) {
  _inherits(DetailsField, _React$Component);

  function DetailsField(props) {
    _classCallCheck(this, DetailsField);

    return _possibleConstructorReturn(this, (DetailsField.__proto__ || Object.getPrototypeOf(DetailsField)).call(this, props));
  }

  _createClass(DetailsField, [{
    key: 'render',
    value: function render() {
      var _props = this.props,
          field_values = _props.field_values,
          label = _props.label,
          delimiter = _props.delimiter;

      var field_class = 'detail-field-' + label.replace(/\s/g, '').toLowerCase();
      return _react2.default.createElement(
        'span',
        { className: field_class },
        _react2.default.createElement(
          'dt',
          { className: 'field-label' },
          _react2.default.createElement(
            'label',
            { className: 'label label-default' },
            label,
            ':'
          )
        ),
        _react2.default.createElement(
          'dd',
          { className: 'field-definition' },
          field_values.map(function (field_value, i) {
            delimiter = i < field_values.length - 1 ? delimiter : '';
            return _react2.default.createElement(_citeDetailsFieldValue2.default, { key: i, url: field_value.url, text: field_value.text, delimiter: delimiter });
          })
        )
      );
    }
  }]);

  return DetailsField;
}(_react2.default.Component);

exports.default = DetailsField;


var propTypes = {
  label: _react2.default.PropTypes.string.isRequired,
  delimiter: _react2.default.PropTypes.string,
  url: _react2.default.PropTypes.string,
  field_values: _react2.default.PropTypes.array.isRequired
};

DetailsField.propTypes = propTypes;

},{"./cite-details-field-value":9,"react":undefined}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _citeDetailsField = require('./cite-details-field');

var _citeDetailsField2 = _interopRequireDefault(_citeDetailsField);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Details = function (_React$Component) {
  _inherits(Details, _React$Component);

  function Details(props) {
    _classCallCheck(this, Details);

    return _possibleConstructorReturn(this, (Details.__proto__ || Object.getPrototypeOf(Details)).call(this, props));
  }

  _createClass(Details, [{
    key: 'render',
    value: function render() {
      var fields = this.props.fields;

      return _react2.default.createElement(
        'dl',
        { className: 'row details' },
        fields.map(function (field, i) {
          return _react2.default.createElement(_citeDetailsField2.default, _extends({ key: i }, field));
        })
      );
    }
  }]);

  return Details;
}(_react2.default.Component);

exports.default = Details;


var propTypes = {
  fields: _react2.default.PropTypes.array.isRequired
};

Details.propTypes = propTypes;

},{"./cite-details-field":10,"react":undefined}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CiteDownloadSource = function (_React$Component) {
  _inherits(CiteDownloadSource, _React$Component);

  function CiteDownloadSource(props) {
    _classCallCheck(this, CiteDownloadSource);

    return _possibleConstructorReturn(this, (CiteDownloadSource.__proto__ || Object.getPrototypeOf(CiteDownloadSource)).call(this, props));
  }

  _createClass(CiteDownloadSource, [{
    key: "render",
    value: function render() {
      var _props = this.props,
          label = _props.label,
          src = _props.src;

      return _react2.default.createElement(
        "div",
        null,
        _react2.default.createElement(
          "a",
          { href: src },
          _react2.default.createElement("span", { className: "glyphicon glyphicon-download-alt" }),
          " ",
          label
        )
      );
    }
  }]);

  return CiteDownloadSource;
}(_react2.default.Component);

exports.default = CiteDownloadSource;


var propTypes = {
  src: _react2.default.PropTypes.string.isRequired,
  label: _react2.default.PropTypes.string.isRequired
};

CiteDownloadSource.propTypes = propTypes;

},{"react":undefined}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _citeThumbnail = require('./cite-thumbnail');

var _citeThumbnail2 = _interopRequireDefault(_citeThumbnail);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Download = function (_React$Component) {
  _inherits(Download, _React$Component);

  function Download(props) {
    _classCallCheck(this, Download);

    return _possibleConstructorReturn(this, (Download.__proto__ || Object.getPrototypeOf(Download)).call(this, props));
  }

  _createClass(Download, [{
    key: 'render',
    value: function render() {
      var _props = this.props,
          fields = _props.fields,
          label = _props.label;

      return _react2.default.createElement(
        'div',
        { className: 'row' },
        fields.map(function (field, i) {
          return _react2.default.createElement(_citeThumbnail2.default, _extends({ key: i }, field));
        })
      );
    }
  }]);

  return Download;
}(_react2.default.Component);

exports.default = Download;


var propTypes = {
  fields: _react2.default.PropTypes.array.isRequired
};

Download.propTypes = propTypes;

},{"./cite-thumbnail":16,"react":undefined}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CiteNavigationItem = function (_React$Component) {
  _inherits(CiteNavigationItem, _React$Component);

  function CiteNavigationItem(props) {
    _classCallCheck(this, CiteNavigationItem);

    return _possibleConstructorReturn(this, (CiteNavigationItem.__proto__ || Object.getPrototypeOf(CiteNavigationItem)).call(this, props));
  }

  _createClass(CiteNavigationItem, [{
    key: "render",
    value: function render() {
      var _props = this.props,
          active = _props.active,
          setActiveItem = _props.setActiveItem,
          label = _props.label;

      return _react2.default.createElement(
        "li",
        { role: "presentation", className: active },
        _react2.default.createElement(
          "a",
          { onClick: setActiveItem, href: "#" },
          label
        )
      );
    }
  }]);

  return CiteNavigationItem;
}(_react2.default.Component);

exports.default = CiteNavigationItem;


var propTypes = {
  label: _react2.default.PropTypes.string.isRequired,
  setActiveItem: _react2.default.PropTypes.func.isRequired,
  class_name: _react2.default.PropTypes.string
};

CiteNavigationItem.propTypes = propTypes;

},{"react":undefined}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _citeNavigationItem = require('./cite-navigation-item');

var _citeNavigationItem2 = _interopRequireDefault(_citeNavigationItem);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CiteNavigation = function (_React$Component) {
  _inherits(CiteNavigation, _React$Component);

  function CiteNavigation(props) {
    _classCallCheck(this, CiteNavigation);

    var _this = _possibleConstructorReturn(this, (CiteNavigation.__proto__ || Object.getPrototypeOf(CiteNavigation)).call(this, props));

    _this.active_class = _this.active_class.bind(_this);
    _this.active_index = _this.active_index.bind(_this);
    return _this;
  }

  _createClass(CiteNavigation, [{
    key: 'active_index',
    value: function active_index() {
      return this.props.getActiveItemIndex();
    }
  }, {
    key: 'active_class',
    value: function active_class(i) {
      return this.active_index() == i ? 'active' : '';
    }
  }, {
    key: 'render',
    value: function render() {
      var _props = this.props,
          items = _props.items,
          class_name = _props.class_name,
          setActiveItem = _props.setActiveItem,
          getActiveItem = _props.getActiveItem;

      var active_class = this.active_class;
      var style = {};
      if (!this.props.navigation) {
        style['display'] = 'none';
      }
      return _react2.default.createElement(
        'ul',
        { className: 'citation-navigation ' + class_name, style: style },
        items.map(function (item, i) {
          return _react2.default.createElement(_citeNavigationItem2.default, { label: item.label,
            key: i,
            active: active_class(i),
            setActiveItem: setActiveItem.bind(this, i) });
        })
      );
    }
  }]);

  return CiteNavigation;
}(_react2.default.Component);

exports.default = CiteNavigation;


var propTypes = {
  items: _react2.default.PropTypes.array.isRequired,
  setActiveItem: _react2.default.PropTypes.func.isRequired,
  getActiveItemIndex: _react2.default.PropTypes.func.isRequired,
  class_name: _react2.default.PropTypes.string
};

CiteNavigation.defaultProps = {
  class_name: 'nav nav-pills'
};

CiteNavigation.propTypes = propTypes;

},{"./cite-navigation-item":14,"react":undefined}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _citeDownloadSource = require('./cite-download-source');

var _citeDownloadSource2 = _interopRequireDefault(_citeDownloadSource);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CiteThumbnail = function (_React$Component) {
  _inherits(CiteThumbnail, _React$Component);

  function CiteThumbnail(props) {
    _classCallCheck(this, CiteThumbnail);

    return _possibleConstructorReturn(this, (CiteThumbnail.__proto__ || Object.getPrototypeOf(CiteThumbnail)).call(this, props));
  }

  _createClass(CiteThumbnail, [{
    key: 'render',
    value: function render() {
      var _props = this.props,
          thumbnail = _props.thumbnail,
          sources = _props.sources;

      return _react2.default.createElement(
        'div',
        { className: 'col-md-2 download-source' },
        _react2.default.createElement('img', { className: 'thumbnail', src: thumbnail }),
        sources.map(function (source, i) {
          return _react2.default.createElement(_citeDownloadSource2.default, _extends({ key: i }, source));
        })
      );
    }
  }]);

  return CiteThumbnail;
}(_react2.default.Component);

var propTypes = {
  thumbnail: _react2.default.PropTypes.string.isRequired,
  sources: _react2.default.PropTypes.array.isRequired
};

CiteThumbnail.propTypes = propTypes;

exports.default = CiteThumbnail;

},{"./cite-download-source":12,"react":undefined}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Transcript = function Transcript(props) {
  return _react2.default.createElement(
    "div",
    { className: "transcript" },
    props.transcript
  );
};

var propTypes = {
  transcript: _react2.default.PropTypes.string.isRequired
};

Transcript.propTypes = propTypes;

exports.default = Transcript;

},{"react":undefined}],"react-citation":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactActiveItem = require('react-active-item');

var _reactActiveItem2 = _interopRequireDefault(_reactActiveItem);

var _citeNavigation = require('./cite-navigation');

var _citeNavigation2 = _interopRequireDefault(_citeNavigation);

var _citeDetails = require('./cite-details');

var _citeDetails2 = _interopRequireDefault(_citeDetails);

var _citeCitation = require('./cite-citation');

var _citeCitation2 = _interopRequireDefault(_citeCitation);

var _citeDownload = require('./cite-download');

var _citeDownload2 = _interopRequireDefault(_citeDownload);

var _citeTranscript = require('./cite-transcript');

var _citeTranscript2 = _interopRequireDefault(_citeTranscript);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ReactCitation = function (_React$Component) {
  _inherits(ReactCitation, _React$Component);

  function ReactCitation(props) {
    _classCallCheck(this, ReactCitation);

    var _this = _possibleConstructorReturn(this, (ReactCitation.__proto__ || Object.getPrototypeOf(ReactCitation)).call(this, props));

    _this._viewer = _this._viewer.bind(_this);
    return _this;
  }

  _createClass(ReactCitation, [{
    key: '_viewer',
    value: function _viewer() {
      var item = this.props.getActiveItem();
      switch (item.type) {
        case 'details':
          return _react2.default.createElement(_citeDetails2.default, { fields: item.fields });
        case 'citation':
          return _react2.default.createElement(_citeCitation2.default, { fields: item.fields, citationType: this.props.citationType });
        case 'download':
          return _react2.default.createElement(_citeDownload2.default, { fields: item.fields });
        case 'transcript':
          return _react2.default.createElement(_citeTranscript2.default, { transcript: item.transcript });
        default:
          return _react2.default.createElement(
            'div',
            null,
            'No Viewer Avaialable for type: ',
            item.type
          );
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var type = this.props.getActiveItem().type;
      return _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement(_citeNavigation2.default, this.props),
        _react2.default.createElement(
          'div',
          { className: 'cite-' + type },
          this._viewer()
        )
      );
    }
  }]);

  return ReactCitation;
}(_react2.default.Component);

var propTypes = {
  items: _react2.default.PropTypes.array.isRequired,
  getActiveItem: _react2.default.PropTypes.func.isRequired
};

ReactCitation.propTypes = propTypes;

exports.default = (0, _reactActiveItem2.default)(ReactCitation);

},{"./cite-citation":8,"./cite-details":11,"./cite-download":13,"./cite-navigation":15,"./cite-transcript":17,"react":undefined,"react-active-item":2}]},{},[])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW1tdXRhYmxlL2Rpc3QvaW1tdXRhYmxlLmpzIiwibm9kZV9tb2R1bGVzL3JlYWN0LWFjdGl2ZS1pdGVtL2xpYi9yZWFjdC1hY3RpdmUtaXRlbS5qcyIsInNyYy9jaXRlLWNpdGF0aW9uLWNoaWNhZ28uanMiLCJzcmMvY2l0ZS1jaXRhdGlvbi1jb2lucy5qcyIsInNyYy9jaXRlLWNpdGF0aW9uLW1sYS5qcyIsInNyYy9jaXRlLWNpdGF0aW9uLXJlbmRlci5qcyIsInNyYy9jaXRlLWNpdGF0aW9uLXdpa2lwZWRpYS5qcyIsInNyYy9jaXRlLWNpdGF0aW9uLmpzIiwic3JjL2NpdGUtZGV0YWlscy1maWVsZC12YWx1ZS5qcyIsInNyYy9jaXRlLWRldGFpbHMtZmllbGQuanMiLCJzcmMvY2l0ZS1kZXRhaWxzLmpzIiwic3JjL2NpdGUtZG93bmxvYWQtc291cmNlLmpzIiwic3JjL2NpdGUtZG93bmxvYWQuanMiLCJzcmMvY2l0ZS1uYXZpZ2F0aW9uLWl0ZW0uanMiLCJzcmMvY2l0ZS1uYXZpZ2F0aW9uLmpzIiwic3JjL2NpdGUtdGh1bWJuYWlsLmpzIiwic3JjL2NpdGUtdHJhbnNjcmlwdC5qcyIsInNyYy9yZWFjdC1jaXRhdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbDNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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RTtBQUFBO0FBQUEsWUFBSyxxQkFBbUIsSUFBeEI7QUFDRyxlQUFLLE9BQUw7QUFESDtBQUZGLE9BREY7QUFRRDs7OztFQWpDeUIsZ0JBQU0sUzs7QUFvQ2xDLElBQU0sWUFBWTtBQUNoQixTQUFPLGdCQUFNLFNBQU4sQ0FBZ0IsS0FBaEIsQ0FBc0IsVUFEYjtBQUVoQixpQkFBZSxnQkFBTSxTQUFOLENBQWdCLElBQWhCLENBQXFCO0FBRnBCLENBQWxCOztBQUtBLGNBQWMsU0FBZCxHQUEwQixTQUExQjs7a0JBRWUsK0JBQVcsYUFBWCxDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogIENvcHlyaWdodCAoYykgMjAxNC0yMDE1LCBGYWNlYm9vaywgSW5jLlxuICogIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICovXG5cbihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpIDpcbiAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKGZhY3RvcnkpIDpcbiAgKGdsb2JhbC5JbW11dGFibGUgPSBmYWN0b3J5KCkpO1xufSh0aGlzLCBmdW5jdGlvbiAoKSB7ICd1c2Ugc3RyaWN0Jzt2YXIgU0xJQ0UkMCA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblxuICBmdW5jdGlvbiBjcmVhdGVDbGFzcyhjdG9yLCBzdXBlckNsYXNzKSB7XG4gICAgaWYgKHN1cGVyQ2xhc3MpIHtcbiAgICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzLnByb3RvdHlwZSk7XG4gICAgfVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvcjtcbiAgfVxuXG4gIGZ1bmN0aW9uIEl0ZXJhYmxlKHZhbHVlKSB7XG4gICAgICByZXR1cm4gaXNJdGVyYWJsZSh2YWx1ZSkgPyB2YWx1ZSA6IFNlcSh2YWx1ZSk7XG4gICAgfVxuXG5cbiAgY3JlYXRlQ2xhc3MoS2V5ZWRJdGVyYWJsZSwgSXRlcmFibGUpO1xuICAgIGZ1bmN0aW9uIEtleWVkSXRlcmFibGUodmFsdWUpIHtcbiAgICAgIHJldHVybiBpc0tleWVkKHZhbHVlKSA/IHZhbHVlIDogS2V5ZWRTZXEodmFsdWUpO1xuICAgIH1cblxuXG4gIGNyZWF0ZUNsYXNzKEluZGV4ZWRJdGVyYWJsZSwgSXRlcmFibGUpO1xuICAgIGZ1bmN0aW9uIEluZGV4ZWRJdGVyYWJsZSh2YWx1ZSkge1xuICAgICAgcmV0dXJuIGlzSW5kZXhlZCh2YWx1ZSkgPyB2YWx1ZSA6IEluZGV4ZWRTZXEodmFsdWUpO1xuICAgIH1cblxuXG4gIGNyZWF0ZUNsYXNzKFNldEl0ZXJhYmxlLCBJdGVyYWJsZSk7XG4gICAgZnVuY3Rpb24gU2V0SXRlcmFibGUodmFsdWUpIHtcbiAgICAgIHJldHVybiBpc0l0ZXJhYmxlKHZhbHVlKSAmJiAhaXNBc3NvY2lhdGl2ZSh2YWx1ZSkgPyB2YWx1ZSA6IFNldFNlcSh2YWx1ZSk7XG4gICAgfVxuXG5cblxuICBmdW5jdGlvbiBpc0l0ZXJhYmxlKG1heWJlSXRlcmFibGUpIHtcbiAgICByZXR1cm4gISEobWF5YmVJdGVyYWJsZSAmJiBtYXliZUl0ZXJhYmxlW0lTX0lURVJBQkxFX1NFTlRJTkVMXSk7XG4gIH1cblxuICBmdW5jdGlvbiBpc0tleWVkKG1heWJlS2V5ZWQpIHtcbiAgICByZXR1cm4gISEobWF5YmVLZXllZCAmJiBtYXliZUtleWVkW0lTX0tFWUVEX1NFTlRJTkVMXSk7XG4gIH1cblxuICBmdW5jdGlvbiBpc0luZGV4ZWQobWF5YmVJbmRleGVkKSB7XG4gICAgcmV0dXJuICEhKG1heWJlSW5kZXhlZCAmJiBtYXliZUluZGV4ZWRbSVNfSU5ERVhFRF9TRU5USU5FTF0pO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNBc3NvY2lhdGl2ZShtYXliZUFzc29jaWF0aXZlKSB7XG4gICAgcmV0dXJuIGlzS2V5ZWQobWF5YmVBc3NvY2lhdGl2ZSkgfHwgaXNJbmRleGVkKG1heWJlQXNzb2NpYXRpdmUpO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNPcmRlcmVkKG1heWJlT3JkZXJlZCkge1xuICAgIHJldHVybiAhIShtYXliZU9yZGVyZWQgJiYgbWF5YmVPcmRlcmVkW0lTX09SREVSRURfU0VOVElORUxdKTtcbiAgfVxuXG4gIEl0ZXJhYmxlLmlzSXRlcmFibGUgPSBpc0l0ZXJhYmxlO1xuICBJdGVyYWJsZS5pc0tleWVkID0gaXNLZXllZDtcbiAgSXRlcmFibGUuaXNJbmRleGVkID0gaXNJbmRleGVkO1xuICBJdGVyYWJsZS5pc0Fzc29jaWF0aXZlID0gaXNBc3NvY2lhdGl2ZTtcbiAgSXRlcmFibGUuaXNPcmRlcmVkID0gaXNPcmRlcmVkO1xuXG4gIEl0ZXJhYmxlLktleWVkID0gS2V5ZWRJdGVyYWJsZTtcbiAgSXRlcmFibGUuSW5kZXhlZCA9IEluZGV4ZWRJdGVyYWJsZTtcbiAgSXRlcmFibGUuU2V0ID0gU2V0SXRlcmFibGU7XG5cblxuICB2YXIgSVNfSVRFUkFCTEVfU0VOVElORUwgPSAnQEBfX0lNTVVUQUJMRV9JVEVSQUJMRV9fQEAnO1xuICB2YXIgSVNfS0VZRURfU0VOVElORUwgPSAnQEBfX0lNTVVUQUJMRV9LRVlFRF9fQEAnO1xuICB2YXIgSVNfSU5ERVhFRF9TRU5USU5FTCA9ICdAQF9fSU1NVVRBQkxFX0lOREVYRURfX0BAJztcbiAgdmFyIElTX09SREVSRURfU0VOVElORUwgPSAnQEBfX0lNTVVUQUJMRV9PUkRFUkVEX19AQCc7XG5cbiAgLy8gVXNlZCBmb3Igc2V0dGluZyBwcm90b3R5cGUgbWV0aG9kcyB0aGF0IElFOCBjaG9rZXMgb24uXG4gIHZhciBERUxFVEUgPSAnZGVsZXRlJztcblxuICAvLyBDb25zdGFudHMgZGVzY3JpYmluZyB0aGUgc2l6ZSBvZiB0cmllIG5vZGVzLlxuICB2YXIgU0hJRlQgPSA1OyAvLyBSZXN1bHRlZCBpbiBiZXN0IHBlcmZvcm1hbmNlIGFmdGVyIF9fX19fXz9cbiAgdmFyIFNJWkUgPSAxIDw8IFNISUZUO1xuICB2YXIgTUFTSyA9IFNJWkUgLSAxO1xuXG4gIC8vIEEgY29uc2lzdGVudCBzaGFyZWQgdmFsdWUgcmVwcmVzZW50aW5nIFwibm90IHNldFwiIHdoaWNoIGVxdWFscyBub3RoaW5nIG90aGVyXG4gIC8vIHRoYW4gaXRzZWxmLCBhbmQgbm90aGluZyB0aGF0IGNvdWxkIGJlIHByb3ZpZGVkIGV4dGVybmFsbHkuXG4gIHZhciBOT1RfU0VUID0ge307XG5cbiAgLy8gQm9vbGVhbiByZWZlcmVuY2VzLCBSb3VnaCBlcXVpdmFsZW50IG9mIGBib29sICZgLlxuICB2YXIgQ0hBTkdFX0xFTkdUSCA9IHsgdmFsdWU6IGZhbHNlIH07XG4gIHZhciBESURfQUxURVIgPSB7IHZhbHVlOiBmYWxzZSB9O1xuXG4gIGZ1bmN0aW9uIE1ha2VSZWYocmVmKSB7XG4gICAgcmVmLnZhbHVlID0gZmFsc2U7XG4gICAgcmV0dXJuIHJlZjtcbiAgfVxuXG4gIGZ1bmN0aW9uIFNldFJlZihyZWYpIHtcbiAgICByZWYgJiYgKHJlZi52YWx1ZSA9IHRydWUpO1xuICB9XG5cbiAgLy8gQSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGEgdmFsdWUgcmVwcmVzZW50aW5nIGFuIFwib3duZXJcIiBmb3IgdHJhbnNpZW50IHdyaXRlc1xuICAvLyB0byB0cmllcy4gVGhlIHJldHVybiB2YWx1ZSB3aWxsIG9ubHkgZXZlciBlcXVhbCBpdHNlbGYsIGFuZCB3aWxsIG5vdCBlcXVhbFxuICAvLyB0aGUgcmV0dXJuIG9mIGFueSBzdWJzZXF1ZW50IGNhbGwgb2YgdGhpcyBmdW5jdGlvbi5cbiAgZnVuY3Rpb24gT3duZXJJRCgpIHt9XG5cbiAgLy8gaHR0cDovL2pzcGVyZi5jb20vY29weS1hcnJheS1pbmxpbmVcbiAgZnVuY3Rpb24gYXJyQ29weShhcnIsIG9mZnNldCkge1xuICAgIG9mZnNldCA9IG9mZnNldCB8fCAwO1xuICAgIHZhciBsZW4gPSBNYXRoLm1heCgwLCBhcnIubGVuZ3RoIC0gb2Zmc2V0KTtcbiAgICB2YXIgbmV3QXJyID0gbmV3IEFycmF5KGxlbik7XG4gICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IGxlbjsgaWkrKykge1xuICAgICAgbmV3QXJyW2lpXSA9IGFycltpaSArIG9mZnNldF07XG4gICAgfVxuICAgIHJldHVybiBuZXdBcnI7XG4gIH1cblxuICBmdW5jdGlvbiBlbnN1cmVTaXplKGl0ZXIpIHtcbiAgICBpZiAoaXRlci5zaXplID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGl0ZXIuc2l6ZSA9IGl0ZXIuX19pdGVyYXRlKHJldHVyblRydWUpO1xuICAgIH1cbiAgICByZXR1cm4gaXRlci5zaXplO1xuICB9XG5cbiAgZnVuY3Rpb24gd3JhcEluZGV4KGl0ZXIsIGluZGV4KSB7XG4gICAgLy8gVGhpcyBpbXBsZW1lbnRzIFwiaXMgYXJyYXkgaW5kZXhcIiB3aGljaCB0aGUgRUNNQVN0cmluZyBzcGVjIGRlZmluZXMgYXM6XG4gICAgLy9cbiAgICAvLyAgICAgQSBTdHJpbmcgcHJvcGVydHkgbmFtZSBQIGlzIGFuIGFycmF5IGluZGV4IGlmIGFuZCBvbmx5IGlmXG4gICAgLy8gICAgIFRvU3RyaW5nKFRvVWludDMyKFApKSBpcyBlcXVhbCB0byBQIGFuZCBUb1VpbnQzMihQKSBpcyBub3QgZXF1YWxcbiAgICAvLyAgICAgdG8gMl4zMuKIkjEuXG4gICAgLy9cbiAgICAvLyBodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtYXJyYXktZXhvdGljLW9iamVjdHNcbiAgICBpZiAodHlwZW9mIGluZGV4ICE9PSAnbnVtYmVyJykge1xuICAgICAgdmFyIHVpbnQzMkluZGV4ID0gaW5kZXggPj4+IDA7IC8vIE4gPj4+IDAgaXMgc2hvcnRoYW5kIGZvciBUb1VpbnQzMlxuICAgICAgaWYgKCcnICsgdWludDMySW5kZXggIT09IGluZGV4IHx8IHVpbnQzMkluZGV4ID09PSA0Mjk0OTY3Mjk1KSB7XG4gICAgICAgIHJldHVybiBOYU47XG4gICAgICB9XG4gICAgICBpbmRleCA9IHVpbnQzMkluZGV4O1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXggPCAwID8gZW5zdXJlU2l6ZShpdGVyKSArIGluZGV4IDogaW5kZXg7XG4gIH1cblxuICBmdW5jdGlvbiByZXR1cm5UcnVlKCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gd2hvbGVTbGljZShiZWdpbiwgZW5kLCBzaXplKSB7XG4gICAgcmV0dXJuIChiZWdpbiA9PT0gMCB8fCAoc2l6ZSAhPT0gdW5kZWZpbmVkICYmIGJlZ2luIDw9IC1zaXplKSkgJiZcbiAgICAgIChlbmQgPT09IHVuZGVmaW5lZCB8fCAoc2l6ZSAhPT0gdW5kZWZpbmVkICYmIGVuZCA+PSBzaXplKSk7XG4gIH1cblxuICBmdW5jdGlvbiByZXNvbHZlQmVnaW4oYmVnaW4sIHNpemUpIHtcbiAgICByZXR1cm4gcmVzb2x2ZUluZGV4KGJlZ2luLCBzaXplLCAwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlc29sdmVFbmQoZW5kLCBzaXplKSB7XG4gICAgcmV0dXJuIHJlc29sdmVJbmRleChlbmQsIHNpemUsIHNpemUpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzb2x2ZUluZGV4KGluZGV4LCBzaXplLCBkZWZhdWx0SW5kZXgpIHtcbiAgICByZXR1cm4gaW5kZXggPT09IHVuZGVmaW5lZCA/XG4gICAgICBkZWZhdWx0SW5kZXggOlxuICAgICAgaW5kZXggPCAwID9cbiAgICAgICAgTWF0aC5tYXgoMCwgc2l6ZSArIGluZGV4KSA6XG4gICAgICAgIHNpemUgPT09IHVuZGVmaW5lZCA/XG4gICAgICAgICAgaW5kZXggOlxuICAgICAgICAgIE1hdGgubWluKHNpemUsIGluZGV4KTtcbiAgfVxuXG4gIC8qIGdsb2JhbCBTeW1ib2wgKi9cblxuICB2YXIgSVRFUkFURV9LRVlTID0gMDtcbiAgdmFyIElURVJBVEVfVkFMVUVTID0gMTtcbiAgdmFyIElURVJBVEVfRU5UUklFUyA9IDI7XG5cbiAgdmFyIFJFQUxfSVRFUkFUT1JfU1lNQk9MID0gdHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiBTeW1ib2wuaXRlcmF0b3I7XG4gIHZhciBGQVVYX0lURVJBVE9SX1NZTUJPTCA9ICdAQGl0ZXJhdG9yJztcblxuICB2YXIgSVRFUkFUT1JfU1lNQk9MID0gUkVBTF9JVEVSQVRPUl9TWU1CT0wgfHwgRkFVWF9JVEVSQVRPUl9TWU1CT0w7XG5cblxuICBmdW5jdGlvbiBJdGVyYXRvcihuZXh0KSB7XG4gICAgICB0aGlzLm5leHQgPSBuZXh0O1xuICAgIH1cblxuICAgIEl0ZXJhdG9yLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICdbSXRlcmF0b3JdJztcbiAgICB9O1xuXG5cbiAgSXRlcmF0b3IuS0VZUyA9IElURVJBVEVfS0VZUztcbiAgSXRlcmF0b3IuVkFMVUVTID0gSVRFUkFURV9WQUxVRVM7XG4gIEl0ZXJhdG9yLkVOVFJJRVMgPSBJVEVSQVRFX0VOVFJJRVM7XG5cbiAgSXRlcmF0b3IucHJvdG90eXBlLmluc3BlY3QgPVxuICBJdGVyYXRvci5wcm90b3R5cGUudG9Tb3VyY2UgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLnRvU3RyaW5nKCk7IH1cbiAgSXRlcmF0b3IucHJvdG90eXBlW0lURVJBVE9SX1NZTUJPTF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cblxuICBmdW5jdGlvbiBpdGVyYXRvclZhbHVlKHR5cGUsIGssIHYsIGl0ZXJhdG9yUmVzdWx0KSB7XG4gICAgdmFyIHZhbHVlID0gdHlwZSA9PT0gMCA/IGsgOiB0eXBlID09PSAxID8gdiA6IFtrLCB2XTtcbiAgICBpdGVyYXRvclJlc3VsdCA/IChpdGVyYXRvclJlc3VsdC52YWx1ZSA9IHZhbHVlKSA6IChpdGVyYXRvclJlc3VsdCA9IHtcbiAgICAgIHZhbHVlOiB2YWx1ZSwgZG9uZTogZmFsc2VcbiAgICB9KTtcbiAgICByZXR1cm4gaXRlcmF0b3JSZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBpdGVyYXRvckRvbmUoKSB7XG4gICAgcmV0dXJuIHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9O1xuICB9XG5cbiAgZnVuY3Rpb24gaGFzSXRlcmF0b3IobWF5YmVJdGVyYWJsZSkge1xuICAgIHJldHVybiAhIWdldEl0ZXJhdG9yRm4obWF5YmVJdGVyYWJsZSk7XG4gIH1cblxuICBmdW5jdGlvbiBpc0l0ZXJhdG9yKG1heWJlSXRlcmF0b3IpIHtcbiAgICByZXR1cm4gbWF5YmVJdGVyYXRvciAmJiB0eXBlb2YgbWF5YmVJdGVyYXRvci5uZXh0ID09PSAnZnVuY3Rpb24nO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0SXRlcmF0b3IoaXRlcmFibGUpIHtcbiAgICB2YXIgaXRlcmF0b3JGbiA9IGdldEl0ZXJhdG9yRm4oaXRlcmFibGUpO1xuICAgIHJldHVybiBpdGVyYXRvckZuICYmIGl0ZXJhdG9yRm4uY2FsbChpdGVyYWJsZSk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRJdGVyYXRvckZuKGl0ZXJhYmxlKSB7XG4gICAgdmFyIGl0ZXJhdG9yRm4gPSBpdGVyYWJsZSAmJiAoXG4gICAgICAoUkVBTF9JVEVSQVRPUl9TWU1CT0wgJiYgaXRlcmFibGVbUkVBTF9JVEVSQVRPUl9TWU1CT0xdKSB8fFxuICAgICAgaXRlcmFibGVbRkFVWF9JVEVSQVRPUl9TWU1CT0xdXG4gICAgKTtcbiAgICBpZiAodHlwZW9mIGl0ZXJhdG9yRm4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBpdGVyYXRvckZuO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGlzQXJyYXlMaWtlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZS5sZW5ndGggPT09ICdudW1iZXInO1xuICB9XG5cbiAgY3JlYXRlQ2xhc3MoU2VxLCBJdGVyYWJsZSk7XG4gICAgZnVuY3Rpb24gU2VxKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCA/IGVtcHR5U2VxdWVuY2UoKSA6XG4gICAgICAgIGlzSXRlcmFibGUodmFsdWUpID8gdmFsdWUudG9TZXEoKSA6IHNlcUZyb21WYWx1ZSh2YWx1ZSk7XG4gICAgfVxuXG4gICAgU2VxLm9mID0gZnVuY3Rpb24oLyouLi52YWx1ZXMqLykge1xuICAgICAgcmV0dXJuIFNlcShhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBTZXEucHJvdG90eXBlLnRvU2VxID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgU2VxLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX190b1N0cmluZygnU2VxIHsnLCAnfScpO1xuICAgIH07XG5cbiAgICBTZXEucHJvdG90eXBlLmNhY2hlUmVzdWx0ID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXRoaXMuX2NhY2hlICYmIHRoaXMuX19pdGVyYXRlVW5jYWNoZWQpIHtcbiAgICAgICAgdGhpcy5fY2FjaGUgPSB0aGlzLmVudHJ5U2VxKCkudG9BcnJheSgpO1xuICAgICAgICB0aGlzLnNpemUgPSB0aGlzLl9jYWNoZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLy8gYWJzdHJhY3QgX19pdGVyYXRlVW5jYWNoZWQoZm4sIHJldmVyc2UpXG5cbiAgICBTZXEucHJvdG90eXBlLl9faXRlcmF0ZSA9IGZ1bmN0aW9uKGZuLCByZXZlcnNlKSB7XG4gICAgICByZXR1cm4gc2VxSXRlcmF0ZSh0aGlzLCBmbiwgcmV2ZXJzZSwgdHJ1ZSk7XG4gICAgfTtcblxuICAgIC8vIGFic3RyYWN0IF9faXRlcmF0b3JVbmNhY2hlZCh0eXBlLCByZXZlcnNlKVxuXG4gICAgU2VxLnByb3RvdHlwZS5fX2l0ZXJhdG9yID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge1xuICAgICAgcmV0dXJuIHNlcUl0ZXJhdG9yKHRoaXMsIHR5cGUsIHJldmVyc2UsIHRydWUpO1xuICAgIH07XG5cblxuXG4gIGNyZWF0ZUNsYXNzKEtleWVkU2VxLCBTZXEpO1xuICAgIGZ1bmN0aW9uIEtleWVkU2VxKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCA/XG4gICAgICAgIGVtcHR5U2VxdWVuY2UoKS50b0tleWVkU2VxKCkgOlxuICAgICAgICBpc0l0ZXJhYmxlKHZhbHVlKSA/XG4gICAgICAgICAgKGlzS2V5ZWQodmFsdWUpID8gdmFsdWUudG9TZXEoKSA6IHZhbHVlLmZyb21FbnRyeVNlcSgpKSA6XG4gICAgICAgICAga2V5ZWRTZXFGcm9tVmFsdWUodmFsdWUpO1xuICAgIH1cblxuICAgIEtleWVkU2VxLnByb3RvdHlwZS50b0tleWVkU2VxID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG5cblxuICBjcmVhdGVDbGFzcyhJbmRleGVkU2VxLCBTZXEpO1xuICAgIGZ1bmN0aW9uIEluZGV4ZWRTZXEodmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gZW1wdHlTZXF1ZW5jZSgpIDpcbiAgICAgICAgIWlzSXRlcmFibGUodmFsdWUpID8gaW5kZXhlZFNlcUZyb21WYWx1ZSh2YWx1ZSkgOlxuICAgICAgICBpc0tleWVkKHZhbHVlKSA/IHZhbHVlLmVudHJ5U2VxKCkgOiB2YWx1ZS50b0luZGV4ZWRTZXEoKTtcbiAgICB9XG5cbiAgICBJbmRleGVkU2VxLm9mID0gZnVuY3Rpb24oLyouLi52YWx1ZXMqLykge1xuICAgICAgcmV0dXJuIEluZGV4ZWRTZXEoYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gICAgSW5kZXhlZFNlcS5wcm90b3R5cGUudG9JbmRleGVkU2VxID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgSW5kZXhlZFNlcS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fdG9TdHJpbmcoJ1NlcSBbJywgJ10nKTtcbiAgICB9O1xuXG4gICAgSW5kZXhlZFNlcS5wcm90b3R5cGUuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHtcbiAgICAgIHJldHVybiBzZXFJdGVyYXRlKHRoaXMsIGZuLCByZXZlcnNlLCBmYWxzZSk7XG4gICAgfTtcblxuICAgIEluZGV4ZWRTZXEucHJvdG90eXBlLl9faXRlcmF0b3IgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICByZXR1cm4gc2VxSXRlcmF0b3IodGhpcywgdHlwZSwgcmV2ZXJzZSwgZmFsc2UpO1xuICAgIH07XG5cblxuXG4gIGNyZWF0ZUNsYXNzKFNldFNlcSwgU2VxKTtcbiAgICBmdW5jdGlvbiBTZXRTZXEodmFsdWUpIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQgPyBlbXB0eVNlcXVlbmNlKCkgOlxuICAgICAgICAhaXNJdGVyYWJsZSh2YWx1ZSkgPyBpbmRleGVkU2VxRnJvbVZhbHVlKHZhbHVlKSA6XG4gICAgICAgIGlzS2V5ZWQodmFsdWUpID8gdmFsdWUuZW50cnlTZXEoKSA6IHZhbHVlXG4gICAgICApLnRvU2V0U2VxKCk7XG4gICAgfVxuXG4gICAgU2V0U2VxLm9mID0gZnVuY3Rpb24oLyouLi52YWx1ZXMqLykge1xuICAgICAgcmV0dXJuIFNldFNlcShhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBTZXRTZXEucHJvdG90eXBlLnRvU2V0U2VxID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG5cblxuICBTZXEuaXNTZXEgPSBpc1NlcTtcbiAgU2VxLktleWVkID0gS2V5ZWRTZXE7XG4gIFNlcS5TZXQgPSBTZXRTZXE7XG4gIFNlcS5JbmRleGVkID0gSW5kZXhlZFNlcTtcblxuICB2YXIgSVNfU0VRX1NFTlRJTkVMID0gJ0BAX19JTU1VVEFCTEVfU0VRX19AQCc7XG5cbiAgU2VxLnByb3RvdHlwZVtJU19TRVFfU0VOVElORUxdID0gdHJ1ZTtcblxuXG5cbiAgY3JlYXRlQ2xhc3MoQXJyYXlTZXEsIEluZGV4ZWRTZXEpO1xuICAgIGZ1bmN0aW9uIEFycmF5U2VxKGFycmF5KSB7XG4gICAgICB0aGlzLl9hcnJheSA9IGFycmF5O1xuICAgICAgdGhpcy5zaXplID0gYXJyYXkubGVuZ3RoO1xuICAgIH1cblxuICAgIEFycmF5U2VxLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihpbmRleCwgbm90U2V0VmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmhhcyhpbmRleCkgPyB0aGlzLl9hcnJheVt3cmFwSW5kZXgodGhpcywgaW5kZXgpXSA6IG5vdFNldFZhbHVlO1xuICAgIH07XG5cbiAgICBBcnJheVNlcS5wcm90b3R5cGUuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHtcbiAgICAgIHZhciBhcnJheSA9IHRoaXMuX2FycmF5O1xuICAgICAgdmFyIG1heEluZGV4ID0gYXJyYXkubGVuZ3RoIC0gMTtcbiAgICAgIGZvciAodmFyIGlpID0gMDsgaWkgPD0gbWF4SW5kZXg7IGlpKyspIHtcbiAgICAgICAgaWYgKGZuKGFycmF5W3JldmVyc2UgPyBtYXhJbmRleCAtIGlpIDogaWldLCBpaSwgdGhpcykgPT09IGZhbHNlKSB7XG4gICAgICAgICAgcmV0dXJuIGlpICsgMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGlpO1xuICAgIH07XG5cbiAgICBBcnJheVNlcS5wcm90b3R5cGUuX19pdGVyYXRvciA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIHZhciBhcnJheSA9IHRoaXMuX2FycmF5O1xuICAgICAgdmFyIG1heEluZGV4ID0gYXJyYXkubGVuZ3RoIC0gMTtcbiAgICAgIHZhciBpaSA9IDA7XG4gICAgICByZXR1cm4gbmV3IEl0ZXJhdG9yKGZ1bmN0aW9uKCkgXG4gICAgICAgIHtyZXR1cm4gaWkgPiBtYXhJbmRleCA/XG4gICAgICAgICAgaXRlcmF0b3JEb25lKCkgOlxuICAgICAgICAgIGl0ZXJhdG9yVmFsdWUodHlwZSwgaWksIGFycmF5W3JldmVyc2UgPyBtYXhJbmRleCAtIGlpKysgOiBpaSsrXSl9XG4gICAgICApO1xuICAgIH07XG5cblxuXG4gIGNyZWF0ZUNsYXNzKE9iamVjdFNlcSwgS2V5ZWRTZXEpO1xuICAgIGZ1bmN0aW9uIE9iamVjdFNlcShvYmplY3QpIHtcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMob2JqZWN0KTtcbiAgICAgIHRoaXMuX29iamVjdCA9IG9iamVjdDtcbiAgICAgIHRoaXMuX2tleXMgPSBrZXlzO1xuICAgICAgdGhpcy5zaXplID0ga2V5cy5sZW5ndGg7XG4gICAgfVxuXG4gICAgT2JqZWN0U2VxLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihrZXksIG5vdFNldFZhbHVlKSB7XG4gICAgICBpZiAobm90U2V0VmFsdWUgIT09IHVuZGVmaW5lZCAmJiAhdGhpcy5oYXMoa2V5KSkge1xuICAgICAgICByZXR1cm4gbm90U2V0VmFsdWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fb2JqZWN0W2tleV07XG4gICAgfTtcblxuICAgIE9iamVjdFNlcS5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gdGhpcy5fb2JqZWN0Lmhhc093blByb3BlcnR5KGtleSk7XG4gICAgfTtcblxuICAgIE9iamVjdFNlcS5wcm90b3R5cGUuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHtcbiAgICAgIHZhciBvYmplY3QgPSB0aGlzLl9vYmplY3Q7XG4gICAgICB2YXIga2V5cyA9IHRoaXMuX2tleXM7XG4gICAgICB2YXIgbWF4SW5kZXggPSBrZXlzLmxlbmd0aCAtIDE7XG4gICAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDw9IG1heEluZGV4OyBpaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlzW3JldmVyc2UgPyBtYXhJbmRleCAtIGlpIDogaWldO1xuICAgICAgICBpZiAoZm4ob2JqZWN0W2tleV0sIGtleSwgdGhpcykgPT09IGZhbHNlKSB7XG4gICAgICAgICAgcmV0dXJuIGlpICsgMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGlpO1xuICAgIH07XG5cbiAgICBPYmplY3RTZXEucHJvdG90eXBlLl9faXRlcmF0b3IgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICB2YXIgb2JqZWN0ID0gdGhpcy5fb2JqZWN0O1xuICAgICAgdmFyIGtleXMgPSB0aGlzLl9rZXlzO1xuICAgICAgdmFyIG1heEluZGV4ID0ga2V5cy5sZW5ndGggLSAxO1xuICAgICAgdmFyIGlpID0gMDtcbiAgICAgIHJldHVybiBuZXcgSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICB2YXIga2V5ID0ga2V5c1tyZXZlcnNlID8gbWF4SW5kZXggLSBpaSA6IGlpXTtcbiAgICAgICAgcmV0dXJuIGlpKysgPiBtYXhJbmRleCA/XG4gICAgICAgICAgaXRlcmF0b3JEb25lKCkgOlxuICAgICAgICAgIGl0ZXJhdG9yVmFsdWUodHlwZSwga2V5LCBvYmplY3Rba2V5XSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gIE9iamVjdFNlcS5wcm90b3R5cGVbSVNfT1JERVJFRF9TRU5USU5FTF0gPSB0cnVlO1xuXG5cbiAgY3JlYXRlQ2xhc3MoSXRlcmFibGVTZXEsIEluZGV4ZWRTZXEpO1xuICAgIGZ1bmN0aW9uIEl0ZXJhYmxlU2VxKGl0ZXJhYmxlKSB7XG4gICAgICB0aGlzLl9pdGVyYWJsZSA9IGl0ZXJhYmxlO1xuICAgICAgdGhpcy5zaXplID0gaXRlcmFibGUubGVuZ3RoIHx8IGl0ZXJhYmxlLnNpemU7XG4gICAgfVxuXG4gICAgSXRlcmFibGVTZXEucHJvdG90eXBlLl9faXRlcmF0ZVVuY2FjaGVkID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHtcbiAgICAgIGlmIChyZXZlcnNlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlUmVzdWx0KCkuX19pdGVyYXRlKGZuLCByZXZlcnNlKTtcbiAgICAgIH1cbiAgICAgIHZhciBpdGVyYWJsZSA9IHRoaXMuX2l0ZXJhYmxlO1xuICAgICAgdmFyIGl0ZXJhdG9yID0gZ2V0SXRlcmF0b3IoaXRlcmFibGUpO1xuICAgICAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICAgICAgaWYgKGlzSXRlcmF0b3IoaXRlcmF0b3IpKSB7XG4gICAgICAgIHZhciBzdGVwO1xuICAgICAgICB3aGlsZSAoIShzdGVwID0gaXRlcmF0b3IubmV4dCgpKS5kb25lKSB7XG4gICAgICAgICAgaWYgKGZuKHN0ZXAudmFsdWUsIGl0ZXJhdGlvbnMrKywgdGhpcykgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBpdGVyYXRpb25zO1xuICAgIH07XG5cbiAgICBJdGVyYWJsZVNlcS5wcm90b3R5cGUuX19pdGVyYXRvclVuY2FjaGVkID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge1xuICAgICAgaWYgKHJldmVyc2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVSZXN1bHQoKS5fX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpO1xuICAgICAgfVxuICAgICAgdmFyIGl0ZXJhYmxlID0gdGhpcy5faXRlcmFibGU7XG4gICAgICB2YXIgaXRlcmF0b3IgPSBnZXRJdGVyYXRvcihpdGVyYWJsZSk7XG4gICAgICBpZiAoIWlzSXRlcmF0b3IoaXRlcmF0b3IpKSB7XG4gICAgICAgIHJldHVybiBuZXcgSXRlcmF0b3IoaXRlcmF0b3JEb25lKTtcbiAgICAgIH1cbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHJldHVybiBuZXcgSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICB2YXIgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgcmV0dXJuIHN0ZXAuZG9uZSA/IHN0ZXAgOiBpdGVyYXRvclZhbHVlKHR5cGUsIGl0ZXJhdGlvbnMrKywgc3RlcC52YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG5cblxuICBjcmVhdGVDbGFzcyhJdGVyYXRvclNlcSwgSW5kZXhlZFNlcSk7XG4gICAgZnVuY3Rpb24gSXRlcmF0b3JTZXEoaXRlcmF0b3IpIHtcbiAgICAgIHRoaXMuX2l0ZXJhdG9yID0gaXRlcmF0b3I7XG4gICAgICB0aGlzLl9pdGVyYXRvckNhY2hlID0gW107XG4gICAgfVxuXG4gICAgSXRlcmF0b3JTZXEucHJvdG90eXBlLl9faXRlcmF0ZVVuY2FjaGVkID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHtcbiAgICAgIGlmIChyZXZlcnNlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlUmVzdWx0KCkuX19pdGVyYXRlKGZuLCByZXZlcnNlKTtcbiAgICAgIH1cbiAgICAgIHZhciBpdGVyYXRvciA9IHRoaXMuX2l0ZXJhdG9yO1xuICAgICAgdmFyIGNhY2hlID0gdGhpcy5faXRlcmF0b3JDYWNoZTtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHdoaWxlIChpdGVyYXRpb25zIDwgY2FjaGUubGVuZ3RoKSB7XG4gICAgICAgIGlmIChmbihjYWNoZVtpdGVyYXRpb25zXSwgaXRlcmF0aW9ucysrLCB0aGlzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICByZXR1cm4gaXRlcmF0aW9ucztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdmFyIHN0ZXA7XG4gICAgICB3aGlsZSAoIShzdGVwID0gaXRlcmF0b3IubmV4dCgpKS5kb25lKSB7XG4gICAgICAgIHZhciB2YWwgPSBzdGVwLnZhbHVlO1xuICAgICAgICBjYWNoZVtpdGVyYXRpb25zXSA9IHZhbDtcbiAgICAgICAgaWYgKGZuKHZhbCwgaXRlcmF0aW9ucysrLCB0aGlzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGl0ZXJhdGlvbnM7XG4gICAgfTtcblxuICAgIEl0ZXJhdG9yU2VxLnByb3RvdHlwZS5fX2l0ZXJhdG9yVW5jYWNoZWQgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICBpZiAocmV2ZXJzZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWNoZVJlc3VsdCgpLl9faXRlcmF0b3IodHlwZSwgcmV2ZXJzZSk7XG4gICAgICB9XG4gICAgICB2YXIgaXRlcmF0b3IgPSB0aGlzLl9pdGVyYXRvcjtcbiAgICAgIHZhciBjYWNoZSA9IHRoaXMuX2l0ZXJhdG9yQ2FjaGU7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICByZXR1cm4gbmV3IEl0ZXJhdG9yKGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgaWYgKGl0ZXJhdGlvbnMgPj0gY2FjaGUubGVuZ3RoKSB7XG4gICAgICAgICAgdmFyIHN0ZXAgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgICAgICAgaWYgKHN0ZXAuZG9uZSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0ZXA7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNhY2hlW2l0ZXJhdGlvbnNdID0gc3RlcC52YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaXRlcmF0b3JWYWx1ZSh0eXBlLCBpdGVyYXRpb25zLCBjYWNoZVtpdGVyYXRpb25zKytdKTtcbiAgICAgIH0pO1xuICAgIH07XG5cblxuXG5cbiAgLy8gIyBwcmFnbWEgSGVscGVyIGZ1bmN0aW9uc1xuXG4gIGZ1bmN0aW9uIGlzU2VxKG1heWJlU2VxKSB7XG4gICAgcmV0dXJuICEhKG1heWJlU2VxICYmIG1heWJlU2VxW0lTX1NFUV9TRU5USU5FTF0pO1xuICB9XG5cbiAgdmFyIEVNUFRZX1NFUTtcblxuICBmdW5jdGlvbiBlbXB0eVNlcXVlbmNlKCkge1xuICAgIHJldHVybiBFTVBUWV9TRVEgfHwgKEVNUFRZX1NFUSA9IG5ldyBBcnJheVNlcShbXSkpO1xuICB9XG5cbiAgZnVuY3Rpb24ga2V5ZWRTZXFGcm9tVmFsdWUodmFsdWUpIHtcbiAgICB2YXIgc2VxID1cbiAgICAgIEFycmF5LmlzQXJyYXkodmFsdWUpID8gbmV3IEFycmF5U2VxKHZhbHVlKS5mcm9tRW50cnlTZXEoKSA6XG4gICAgICBpc0l0ZXJhdG9yKHZhbHVlKSA/IG5ldyBJdGVyYXRvclNlcSh2YWx1ZSkuZnJvbUVudHJ5U2VxKCkgOlxuICAgICAgaGFzSXRlcmF0b3IodmFsdWUpID8gbmV3IEl0ZXJhYmxlU2VxKHZhbHVlKS5mcm9tRW50cnlTZXEoKSA6XG4gICAgICB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnID8gbmV3IE9iamVjdFNlcSh2YWx1ZSkgOlxuICAgICAgdW5kZWZpbmVkO1xuICAgIGlmICghc2VxKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAnRXhwZWN0ZWQgQXJyYXkgb3IgaXRlcmFibGUgb2JqZWN0IG9mIFtrLCB2XSBlbnRyaWVzLCAnK1xuICAgICAgICAnb3Iga2V5ZWQgb2JqZWN0OiAnICsgdmFsdWVcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBzZXE7XG4gIH1cblxuICBmdW5jdGlvbiBpbmRleGVkU2VxRnJvbVZhbHVlKHZhbHVlKSB7XG4gICAgdmFyIHNlcSA9IG1heWJlSW5kZXhlZFNlcUZyb21WYWx1ZSh2YWx1ZSk7XG4gICAgaWYgKCFzZXEpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICdFeHBlY3RlZCBBcnJheSBvciBpdGVyYWJsZSBvYmplY3Qgb2YgdmFsdWVzOiAnICsgdmFsdWVcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBzZXE7XG4gIH1cblxuICBmdW5jdGlvbiBzZXFGcm9tVmFsdWUodmFsdWUpIHtcbiAgICB2YXIgc2VxID0gbWF5YmVJbmRleGVkU2VxRnJvbVZhbHVlKHZhbHVlKSB8fFxuICAgICAgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgbmV3IE9iamVjdFNlcSh2YWx1ZSkpO1xuICAgIGlmICghc2VxKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAnRXhwZWN0ZWQgQXJyYXkgb3IgaXRlcmFibGUgb2JqZWN0IG9mIHZhbHVlcywgb3Iga2V5ZWQgb2JqZWN0OiAnICsgdmFsdWVcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBzZXE7XG4gIH1cblxuICBmdW5jdGlvbiBtYXliZUluZGV4ZWRTZXFGcm9tVmFsdWUodmFsdWUpIHtcbiAgICByZXR1cm4gKFxuICAgICAgaXNBcnJheUxpa2UodmFsdWUpID8gbmV3IEFycmF5U2VxKHZhbHVlKSA6XG4gICAgICBpc0l0ZXJhdG9yKHZhbHVlKSA/IG5ldyBJdGVyYXRvclNlcSh2YWx1ZSkgOlxuICAgICAgaGFzSXRlcmF0b3IodmFsdWUpID8gbmV3IEl0ZXJhYmxlU2VxKHZhbHVlKSA6XG4gICAgICB1bmRlZmluZWRcbiAgICApO1xuICB9XG5cbiAgZnVuY3Rpb24gc2VxSXRlcmF0ZShzZXEsIGZuLCByZXZlcnNlLCB1c2VLZXlzKSB7XG4gICAgdmFyIGNhY2hlID0gc2VxLl9jYWNoZTtcbiAgICBpZiAoY2FjaGUpIHtcbiAgICAgIHZhciBtYXhJbmRleCA9IGNhY2hlLmxlbmd0aCAtIDE7XG4gICAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDw9IG1heEluZGV4OyBpaSsrKSB7XG4gICAgICAgIHZhciBlbnRyeSA9IGNhY2hlW3JldmVyc2UgPyBtYXhJbmRleCAtIGlpIDogaWldO1xuICAgICAgICBpZiAoZm4oZW50cnlbMV0sIHVzZUtleXMgPyBlbnRyeVswXSA6IGlpLCBzZXEpID09PSBmYWxzZSkge1xuICAgICAgICAgIHJldHVybiBpaSArIDE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBpaTtcbiAgICB9XG4gICAgcmV0dXJuIHNlcS5fX2l0ZXJhdGVVbmNhY2hlZChmbiwgcmV2ZXJzZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzZXFJdGVyYXRvcihzZXEsIHR5cGUsIHJldmVyc2UsIHVzZUtleXMpIHtcbiAgICB2YXIgY2FjaGUgPSBzZXEuX2NhY2hlO1xuICAgIGlmIChjYWNoZSkge1xuICAgICAgdmFyIG1heEluZGV4ID0gY2FjaGUubGVuZ3RoIC0gMTtcbiAgICAgIHZhciBpaSA9IDA7XG4gICAgICByZXR1cm4gbmV3IEl0ZXJhdG9yKGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gY2FjaGVbcmV2ZXJzZSA/IG1heEluZGV4IC0gaWkgOiBpaV07XG4gICAgICAgIHJldHVybiBpaSsrID4gbWF4SW5kZXggP1xuICAgICAgICAgIGl0ZXJhdG9yRG9uZSgpIDpcbiAgICAgICAgICBpdGVyYXRvclZhbHVlKHR5cGUsIHVzZUtleXMgPyBlbnRyeVswXSA6IGlpIC0gMSwgZW50cnlbMV0pO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBzZXEuX19pdGVyYXRvclVuY2FjaGVkKHR5cGUsIHJldmVyc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gZnJvbUpTKGpzb24sIGNvbnZlcnRlcikge1xuICAgIHJldHVybiBjb252ZXJ0ZXIgP1xuICAgICAgZnJvbUpTV2l0aChjb252ZXJ0ZXIsIGpzb24sICcnLCB7Jyc6IGpzb259KSA6XG4gICAgICBmcm9tSlNEZWZhdWx0KGpzb24pO1xuICB9XG5cbiAgZnVuY3Rpb24gZnJvbUpTV2l0aChjb252ZXJ0ZXIsIGpzb24sIGtleSwgcGFyZW50SlNPTikge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGpzb24pKSB7XG4gICAgICByZXR1cm4gY29udmVydGVyLmNhbGwocGFyZW50SlNPTiwga2V5LCBJbmRleGVkU2VxKGpzb24pLm1hcChmdW5jdGlvbih2LCBrKSAge3JldHVybiBmcm9tSlNXaXRoKGNvbnZlcnRlciwgdiwgaywganNvbil9KSk7XG4gICAgfVxuICAgIGlmIChpc1BsYWluT2JqKGpzb24pKSB7XG4gICAgICByZXR1cm4gY29udmVydGVyLmNhbGwocGFyZW50SlNPTiwga2V5LCBLZXllZFNlcShqc29uKS5tYXAoZnVuY3Rpb24odiwgaykgIHtyZXR1cm4gZnJvbUpTV2l0aChjb252ZXJ0ZXIsIHYsIGssIGpzb24pfSkpO1xuICAgIH1cbiAgICByZXR1cm4ganNvbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZyb21KU0RlZmF1bHQoanNvbikge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGpzb24pKSB7XG4gICAgICByZXR1cm4gSW5kZXhlZFNlcShqc29uKS5tYXAoZnJvbUpTRGVmYXVsdCkudG9MaXN0KCk7XG4gICAgfVxuICAgIGlmIChpc1BsYWluT2JqKGpzb24pKSB7XG4gICAgICByZXR1cm4gS2V5ZWRTZXEoanNvbikubWFwKGZyb21KU0RlZmF1bHQpLnRvTWFwKCk7XG4gICAgfVxuICAgIHJldHVybiBqc29uO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNQbGFpbk9iaih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSAmJiAodmFsdWUuY29uc3RydWN0b3IgPT09IE9iamVjdCB8fCB2YWx1ZS5jb25zdHJ1Y3RvciA9PT0gdW5kZWZpbmVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBleHRlbnNpb24gb2YgdGhlIFwic2FtZS12YWx1ZVwiIGFsZ29yaXRobSBhcyBbZGVzY3JpYmVkIGZvciB1c2UgYnkgRVM2IE1hcFxuICAgKiBhbmQgU2V0XShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9NYXAjS2V5X2VxdWFsaXR5KVxuICAgKlxuICAgKiBOYU4gaXMgY29uc2lkZXJlZCB0aGUgc2FtZSBhcyBOYU4sIGhvd2V2ZXIgLTAgYW5kIDAgYXJlIGNvbnNpZGVyZWQgdGhlIHNhbWVcbiAgICogdmFsdWUsIHdoaWNoIGlzIGRpZmZlcmVudCBmcm9tIHRoZSBhbGdvcml0aG0gZGVzY3JpYmVkIGJ5XG4gICAqIFtgT2JqZWN0LmlzYF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvT2JqZWN0L2lzKS5cbiAgICpcbiAgICogVGhpcyBpcyBleHRlbmRlZCBmdXJ0aGVyIHRvIGFsbG93IE9iamVjdHMgdG8gZGVzY3JpYmUgdGhlIHZhbHVlcyB0aGV5XG4gICAqIHJlcHJlc2VudCwgYnkgd2F5IG9mIGB2YWx1ZU9mYCBvciBgZXF1YWxzYCAoYW5kIGBoYXNoQ29kZWApLlxuICAgKlxuICAgKiBOb3RlOiBiZWNhdXNlIG9mIHRoaXMgZXh0ZW5zaW9uLCB0aGUga2V5IGVxdWFsaXR5IG9mIEltbXV0YWJsZS5NYXAgYW5kIHRoZVxuICAgKiB2YWx1ZSBlcXVhbGl0eSBvZiBJbW11dGFibGUuU2V0IHdpbGwgZGlmZmVyIGZyb20gRVM2IE1hcCBhbmQgU2V0LlxuICAgKlxuICAgKiAjIyMgRGVmaW5pbmcgY3VzdG9tIHZhbHVlc1xuICAgKlxuICAgKiBUaGUgZWFzaWVzdCB3YXkgdG8gZGVzY3JpYmUgdGhlIHZhbHVlIGFuIG9iamVjdCByZXByZXNlbnRzIGlzIGJ5IGltcGxlbWVudGluZ1xuICAgKiBgdmFsdWVPZmAuIEZvciBleGFtcGxlLCBgRGF0ZWAgcmVwcmVzZW50cyBhIHZhbHVlIGJ5IHJldHVybmluZyBhIHVuaXhcbiAgICogdGltZXN0YW1wIGZvciBgdmFsdWVPZmA6XG4gICAqXG4gICAqICAgICB2YXIgZGF0ZTEgPSBuZXcgRGF0ZSgxMjM0NTY3ODkwMDAwKTsgLy8gRnJpIEZlYiAxMyAyMDA5IC4uLlxuICAgKiAgICAgdmFyIGRhdGUyID0gbmV3IERhdGUoMTIzNDU2Nzg5MDAwMCk7XG4gICAqICAgICBkYXRlMS52YWx1ZU9mKCk7IC8vIDEyMzQ1Njc4OTAwMDBcbiAgICogICAgIGFzc2VydCggZGF0ZTEgIT09IGRhdGUyICk7XG4gICAqICAgICBhc3NlcnQoIEltbXV0YWJsZS5pcyggZGF0ZTEsIGRhdGUyICkgKTtcbiAgICpcbiAgICogTm90ZTogb3ZlcnJpZGluZyBgdmFsdWVPZmAgbWF5IGhhdmUgb3RoZXIgaW1wbGljYXRpb25zIGlmIHlvdSB1c2UgdGhpcyBvYmplY3RcbiAgICogd2hlcmUgSmF2YVNjcmlwdCBleHBlY3RzIGEgcHJpbWl0aXZlLCBzdWNoIGFzIGltcGxpY2l0IHN0cmluZyBjb2VyY2lvbi5cbiAgICpcbiAgICogRm9yIG1vcmUgY29tcGxleCB0eXBlcywgZXNwZWNpYWxseSBjb2xsZWN0aW9ucywgaW1wbGVtZW50aW5nIGB2YWx1ZU9mYCBtYXlcbiAgICogbm90IGJlIHBlcmZvcm1hbnQuIEFuIGFsdGVybmF0aXZlIGlzIHRvIGltcGxlbWVudCBgZXF1YWxzYCBhbmQgYGhhc2hDb2RlYC5cbiAgICpcbiAgICogYGVxdWFsc2AgdGFrZXMgYW5vdGhlciBvYmplY3QsIHByZXN1bWFibHkgb2Ygc2ltaWxhciB0eXBlLCBhbmQgcmV0dXJucyB0cnVlXG4gICAqIGlmIHRoZSBpdCBpcyBlcXVhbC4gRXF1YWxpdHkgaXMgc3ltbWV0cmljYWwsIHNvIHRoZSBzYW1lIHJlc3VsdCBzaG91bGQgYmVcbiAgICogcmV0dXJuZWQgaWYgdGhpcyBhbmQgdGhlIGFyZ3VtZW50IGFyZSBmbGlwcGVkLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0KCBhLmVxdWFscyhiKSA9PT0gYi5lcXVhbHMoYSkgKTtcbiAgICpcbiAgICogYGhhc2hDb2RlYCByZXR1cm5zIGEgMzJiaXQgaW50ZWdlciBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSBvYmplY3Qgd2hpY2ggd2lsbFxuICAgKiBiZSB1c2VkIHRvIGRldGVybWluZSBob3cgdG8gc3RvcmUgdGhlIHZhbHVlIG9iamVjdCBpbiBhIE1hcCBvciBTZXQuIFlvdSBtdXN0XG4gICAqIHByb3ZpZGUgYm90aCBvciBuZWl0aGVyIG1ldGhvZHMsIG9uZSBtdXN0IG5vdCBleGlzdCB3aXRob3V0IHRoZSBvdGhlci5cbiAgICpcbiAgICogQWxzbywgYW4gaW1wb3J0YW50IHJlbGF0aW9uc2hpcCBiZXR3ZWVuIHRoZXNlIG1ldGhvZHMgbXVzdCBiZSB1cGhlbGQ6IGlmIHR3b1xuICAgKiB2YWx1ZXMgYXJlIGVxdWFsLCB0aGV5ICptdXN0KiByZXR1cm4gdGhlIHNhbWUgaGFzaENvZGUuIElmIHRoZSB2YWx1ZXMgYXJlIG5vdFxuICAgKiBlcXVhbCwgdGhleSBtaWdodCBoYXZlIHRoZSBzYW1lIGhhc2hDb2RlOyB0aGlzIGlzIGNhbGxlZCBhIGhhc2ggY29sbGlzaW9uLFxuICAgKiBhbmQgd2hpbGUgdW5kZXNpcmFibGUgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsIGl0IGlzIGFjY2VwdGFibGUuXG4gICAqXG4gICAqICAgICBpZiAoYS5lcXVhbHMoYikpIHtcbiAgICogICAgICAgYXNzZXJ0KCBhLmhhc2hDb2RlKCkgPT09IGIuaGFzaENvZGUoKSApO1xuICAgKiAgICAgfVxuICAgKlxuICAgKiBBbGwgSW1tdXRhYmxlIGNvbGxlY3Rpb25zIGltcGxlbWVudCBgZXF1YWxzYCBhbmQgYGhhc2hDb2RlYC5cbiAgICpcbiAgICovXG4gIGZ1bmN0aW9uIGlzKHZhbHVlQSwgdmFsdWVCKSB7XG4gICAgaWYgKHZhbHVlQSA9PT0gdmFsdWVCIHx8ICh2YWx1ZUEgIT09IHZhbHVlQSAmJiB2YWx1ZUIgIT09IHZhbHVlQikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoIXZhbHVlQSB8fCAhdmFsdWVCKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdmFsdWVBLnZhbHVlT2YgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgICAgdHlwZW9mIHZhbHVlQi52YWx1ZU9mID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YWx1ZUEgPSB2YWx1ZUEudmFsdWVPZigpO1xuICAgICAgdmFsdWVCID0gdmFsdWVCLnZhbHVlT2YoKTtcbiAgICAgIGlmICh2YWx1ZUEgPT09IHZhbHVlQiB8fCAodmFsdWVBICE9PSB2YWx1ZUEgJiYgdmFsdWVCICE9PSB2YWx1ZUIpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKCF2YWx1ZUEgfHwgIXZhbHVlQikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdmFsdWVBLmVxdWFscyA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgICB0eXBlb2YgdmFsdWVCLmVxdWFscyA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgICB2YWx1ZUEuZXF1YWxzKHZhbHVlQikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBkZWVwRXF1YWwoYSwgYikge1xuICAgIGlmIChhID09PSBiKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAhaXNJdGVyYWJsZShiKSB8fFxuICAgICAgYS5zaXplICE9PSB1bmRlZmluZWQgJiYgYi5zaXplICE9PSB1bmRlZmluZWQgJiYgYS5zaXplICE9PSBiLnNpemUgfHxcbiAgICAgIGEuX19oYXNoICE9PSB1bmRlZmluZWQgJiYgYi5fX2hhc2ggIT09IHVuZGVmaW5lZCAmJiBhLl9faGFzaCAhPT0gYi5fX2hhc2ggfHxcbiAgICAgIGlzS2V5ZWQoYSkgIT09IGlzS2V5ZWQoYikgfHxcbiAgICAgIGlzSW5kZXhlZChhKSAhPT0gaXNJbmRleGVkKGIpIHx8XG4gICAgICBpc09yZGVyZWQoYSkgIT09IGlzT3JkZXJlZChiKVxuICAgICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChhLnNpemUgPT09IDAgJiYgYi5zaXplID09PSAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICB2YXIgbm90QXNzb2NpYXRpdmUgPSAhaXNBc3NvY2lhdGl2ZShhKTtcblxuICAgIGlmIChpc09yZGVyZWQoYSkpIHtcbiAgICAgIHZhciBlbnRyaWVzID0gYS5lbnRyaWVzKCk7XG4gICAgICByZXR1cm4gYi5ldmVyeShmdW5jdGlvbih2LCBrKSAge1xuICAgICAgICB2YXIgZW50cnkgPSBlbnRyaWVzLm5leHQoKS52YWx1ZTtcbiAgICAgICAgcmV0dXJuIGVudHJ5ICYmIGlzKGVudHJ5WzFdLCB2KSAmJiAobm90QXNzb2NpYXRpdmUgfHwgaXMoZW50cnlbMF0sIGspKTtcbiAgICAgIH0pICYmIGVudHJpZXMubmV4dCgpLmRvbmU7XG4gICAgfVxuXG4gICAgdmFyIGZsaXBwZWQgPSBmYWxzZTtcblxuICAgIGlmIChhLnNpemUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKGIuc2l6ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYS5jYWNoZVJlc3VsdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGEuY2FjaGVSZXN1bHQoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmxpcHBlZCA9IHRydWU7XG4gICAgICAgIHZhciBfID0gYTtcbiAgICAgICAgYSA9IGI7XG4gICAgICAgIGIgPSBfO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBhbGxFcXVhbCA9IHRydWU7XG4gICAgdmFyIGJTaXplID0gYi5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaykgIHtcbiAgICAgIGlmIChub3RBc3NvY2lhdGl2ZSA/ICFhLmhhcyh2KSA6XG4gICAgICAgICAgZmxpcHBlZCA/ICFpcyh2LCBhLmdldChrLCBOT1RfU0VUKSkgOiAhaXMoYS5nZXQoaywgTk9UX1NFVCksIHYpKSB7XG4gICAgICAgIGFsbEVxdWFsID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBhbGxFcXVhbCAmJiBhLnNpemUgPT09IGJTaXplO1xuICB9XG5cbiAgY3JlYXRlQ2xhc3MoUmVwZWF0LCBJbmRleGVkU2VxKTtcblxuICAgIGZ1bmN0aW9uIFJlcGVhdCh2YWx1ZSwgdGltZXMpIHtcbiAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBSZXBlYXQpKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwZWF0KHZhbHVlLCB0aW1lcyk7XG4gICAgICB9XG4gICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgdGhpcy5zaXplID0gdGltZXMgPT09IHVuZGVmaW5lZCA/IEluZmluaXR5IDogTWF0aC5tYXgoMCwgdGltZXMpO1xuICAgICAgaWYgKHRoaXMuc2l6ZSA9PT0gMCkge1xuICAgICAgICBpZiAoRU1QVFlfUkVQRUFUKSB7XG4gICAgICAgICAgcmV0dXJuIEVNUFRZX1JFUEVBVDtcbiAgICAgICAgfVxuICAgICAgICBFTVBUWV9SRVBFQVQgPSB0aGlzO1xuICAgICAgfVxuICAgIH1cblxuICAgIFJlcGVhdC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLnNpemUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuICdSZXBlYXQgW10nO1xuICAgICAgfVxuICAgICAgcmV0dXJuICdSZXBlYXQgWyAnICsgdGhpcy5fdmFsdWUgKyAnICcgKyB0aGlzLnNpemUgKyAnIHRpbWVzIF0nO1xuICAgIH07XG5cbiAgICBSZXBlYXQucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGluZGV4LCBub3RTZXRWYWx1ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuaGFzKGluZGV4KSA/IHRoaXMuX3ZhbHVlIDogbm90U2V0VmFsdWU7XG4gICAgfTtcblxuICAgIFJlcGVhdC5wcm90b3R5cGUuaW5jbHVkZXMgPSBmdW5jdGlvbihzZWFyY2hWYWx1ZSkge1xuICAgICAgcmV0dXJuIGlzKHRoaXMuX3ZhbHVlLCBzZWFyY2hWYWx1ZSk7XG4gICAgfTtcblxuICAgIFJlcGVhdC5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbihiZWdpbiwgZW5kKSB7XG4gICAgICB2YXIgc2l6ZSA9IHRoaXMuc2l6ZTtcbiAgICAgIHJldHVybiB3aG9sZVNsaWNlKGJlZ2luLCBlbmQsIHNpemUpID8gdGhpcyA6XG4gICAgICAgIG5ldyBSZXBlYXQodGhpcy5fdmFsdWUsIHJlc29sdmVFbmQoZW5kLCBzaXplKSAtIHJlc29sdmVCZWdpbihiZWdpbiwgc2l6ZSkpO1xuICAgIH07XG5cbiAgICBSZXBlYXQucHJvdG90eXBlLnJldmVyc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBSZXBlYXQucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbihzZWFyY2hWYWx1ZSkge1xuICAgICAgaWYgKGlzKHRoaXMuX3ZhbHVlLCBzZWFyY2hWYWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gLTE7XG4gICAgfTtcblxuICAgIFJlcGVhdC5wcm90b3R5cGUubGFzdEluZGV4T2YgPSBmdW5jdGlvbihzZWFyY2hWYWx1ZSkge1xuICAgICAgaWYgKGlzKHRoaXMuX3ZhbHVlLCBzZWFyY2hWYWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2l6ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAtMTtcbiAgICB9O1xuXG4gICAgUmVwZWF0LnByb3RvdHlwZS5fX2l0ZXJhdGUgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge1xuICAgICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IHRoaXMuc2l6ZTsgaWkrKykge1xuICAgICAgICBpZiAoZm4odGhpcy5fdmFsdWUsIGlpLCB0aGlzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICByZXR1cm4gaWkgKyAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gaWk7XG4gICAgfTtcblxuICAgIFJlcGVhdC5wcm90b3R5cGUuX19pdGVyYXRvciA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIHZhciBpaSA9IDA7XG4gICAgICByZXR1cm4gbmV3IEl0ZXJhdG9yKGZ1bmN0aW9uKCkgXG4gICAgICAgIHtyZXR1cm4gaWkgPCB0aGlzJDAuc2l6ZSA/IGl0ZXJhdG9yVmFsdWUodHlwZSwgaWkrKywgdGhpcyQwLl92YWx1ZSkgOiBpdGVyYXRvckRvbmUoKX1cbiAgICAgICk7XG4gICAgfTtcblxuICAgIFJlcGVhdC5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24ob3RoZXIpIHtcbiAgICAgIHJldHVybiBvdGhlciBpbnN0YW5jZW9mIFJlcGVhdCA/XG4gICAgICAgIGlzKHRoaXMuX3ZhbHVlLCBvdGhlci5fdmFsdWUpIDpcbiAgICAgICAgZGVlcEVxdWFsKG90aGVyKTtcbiAgICB9O1xuXG5cbiAgdmFyIEVNUFRZX1JFUEVBVDtcblxuICBmdW5jdGlvbiBpbnZhcmlhbnQoY29uZGl0aW9uLCBlcnJvcikge1xuICAgIGlmICghY29uZGl0aW9uKSB0aHJvdyBuZXcgRXJyb3IoZXJyb3IpO1xuICB9XG5cbiAgY3JlYXRlQ2xhc3MoUmFuZ2UsIEluZGV4ZWRTZXEpO1xuXG4gICAgZnVuY3Rpb24gUmFuZ2Uoc3RhcnQsIGVuZCwgc3RlcCkge1xuICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFJhbmdlKSkge1xuICAgICAgICByZXR1cm4gbmV3IFJhbmdlKHN0YXJ0LCBlbmQsIHN0ZXApO1xuICAgICAgfVxuICAgICAgaW52YXJpYW50KHN0ZXAgIT09IDAsICdDYW5ub3Qgc3RlcCBhIFJhbmdlIGJ5IDAnKTtcbiAgICAgIHN0YXJ0ID0gc3RhcnQgfHwgMDtcbiAgICAgIGlmIChlbmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBlbmQgPSBJbmZpbml0eTtcbiAgICAgIH1cbiAgICAgIHN0ZXAgPSBzdGVwID09PSB1bmRlZmluZWQgPyAxIDogTWF0aC5hYnMoc3RlcCk7XG4gICAgICBpZiAoZW5kIDwgc3RhcnQpIHtcbiAgICAgICAgc3RlcCA9IC1zdGVwO1xuICAgICAgfVxuICAgICAgdGhpcy5fc3RhcnQgPSBzdGFydDtcbiAgICAgIHRoaXMuX2VuZCA9IGVuZDtcbiAgICAgIHRoaXMuX3N0ZXAgPSBzdGVwO1xuICAgICAgdGhpcy5zaXplID0gTWF0aC5tYXgoMCwgTWF0aC5jZWlsKChlbmQgLSBzdGFydCkgLyBzdGVwIC0gMSkgKyAxKTtcbiAgICAgIGlmICh0aGlzLnNpemUgPT09IDApIHtcbiAgICAgICAgaWYgKEVNUFRZX1JBTkdFKSB7XG4gICAgICAgICAgcmV0dXJuIEVNUFRZX1JBTkdFO1xuICAgICAgICB9XG4gICAgICAgIEVNUFRZX1JBTkdFID0gdGhpcztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBSYW5nZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLnNpemUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuICdSYW5nZSBbXSc7XG4gICAgICB9XG4gICAgICByZXR1cm4gJ1JhbmdlIFsgJyArXG4gICAgICAgIHRoaXMuX3N0YXJ0ICsgJy4uLicgKyB0aGlzLl9lbmQgK1xuICAgICAgICAodGhpcy5fc3RlcCAhPT0gMSA/ICcgYnkgJyArIHRoaXMuX3N0ZXAgOiAnJykgK1xuICAgICAgJyBdJztcbiAgICB9O1xuXG4gICAgUmFuZ2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGluZGV4LCBub3RTZXRWYWx1ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuaGFzKGluZGV4KSA/XG4gICAgICAgIHRoaXMuX3N0YXJ0ICsgd3JhcEluZGV4KHRoaXMsIGluZGV4KSAqIHRoaXMuX3N0ZXAgOlxuICAgICAgICBub3RTZXRWYWx1ZTtcbiAgICB9O1xuXG4gICAgUmFuZ2UucHJvdG90eXBlLmluY2x1ZGVzID0gZnVuY3Rpb24oc2VhcmNoVmFsdWUpIHtcbiAgICAgIHZhciBwb3NzaWJsZUluZGV4ID0gKHNlYXJjaFZhbHVlIC0gdGhpcy5fc3RhcnQpIC8gdGhpcy5fc3RlcDtcbiAgICAgIHJldHVybiBwb3NzaWJsZUluZGV4ID49IDAgJiZcbiAgICAgICAgcG9zc2libGVJbmRleCA8IHRoaXMuc2l6ZSAmJlxuICAgICAgICBwb3NzaWJsZUluZGV4ID09PSBNYXRoLmZsb29yKHBvc3NpYmxlSW5kZXgpO1xuICAgIH07XG5cbiAgICBSYW5nZS5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbihiZWdpbiwgZW5kKSB7XG4gICAgICBpZiAod2hvbGVTbGljZShiZWdpbiwgZW5kLCB0aGlzLnNpemUpKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgYmVnaW4gPSByZXNvbHZlQmVnaW4oYmVnaW4sIHRoaXMuc2l6ZSk7XG4gICAgICBlbmQgPSByZXNvbHZlRW5kKGVuZCwgdGhpcy5zaXplKTtcbiAgICAgIGlmIChlbmQgPD0gYmVnaW4pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSYW5nZSgwLCAwKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUmFuZ2UodGhpcy5nZXQoYmVnaW4sIHRoaXMuX2VuZCksIHRoaXMuZ2V0KGVuZCwgdGhpcy5fZW5kKSwgdGhpcy5fc3RlcCk7XG4gICAgfTtcblxuICAgIFJhbmdlLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24oc2VhcmNoVmFsdWUpIHtcbiAgICAgIHZhciBvZmZzZXRWYWx1ZSA9IHNlYXJjaFZhbHVlIC0gdGhpcy5fc3RhcnQ7XG4gICAgICBpZiAob2Zmc2V0VmFsdWUgJSB0aGlzLl9zdGVwID09PSAwKSB7XG4gICAgICAgIHZhciBpbmRleCA9IG9mZnNldFZhbHVlIC8gdGhpcy5fc3RlcDtcbiAgICAgICAgaWYgKGluZGV4ID49IDAgJiYgaW5kZXggPCB0aGlzLnNpemUpIHtcbiAgICAgICAgICByZXR1cm4gaW5kZXhcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH07XG5cbiAgICBSYW5nZS5wcm90b3R5cGUubGFzdEluZGV4T2YgPSBmdW5jdGlvbihzZWFyY2hWYWx1ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuaW5kZXhPZihzZWFyY2hWYWx1ZSk7XG4gICAgfTtcblxuICAgIFJhbmdlLnByb3RvdHlwZS5fX2l0ZXJhdGUgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge1xuICAgICAgdmFyIG1heEluZGV4ID0gdGhpcy5zaXplIC0gMTtcbiAgICAgIHZhciBzdGVwID0gdGhpcy5fc3RlcDtcbiAgICAgIHZhciB2YWx1ZSA9IHJldmVyc2UgPyB0aGlzLl9zdGFydCArIG1heEluZGV4ICogc3RlcCA6IHRoaXMuX3N0YXJ0O1xuICAgICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8PSBtYXhJbmRleDsgaWkrKykge1xuICAgICAgICBpZiAoZm4odmFsdWUsIGlpLCB0aGlzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICByZXR1cm4gaWkgKyAxO1xuICAgICAgICB9XG4gICAgICAgIHZhbHVlICs9IHJldmVyc2UgPyAtc3RlcCA6IHN0ZXA7XG4gICAgICB9XG4gICAgICByZXR1cm4gaWk7XG4gICAgfTtcblxuICAgIFJhbmdlLnByb3RvdHlwZS5fX2l0ZXJhdG9yID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge1xuICAgICAgdmFyIG1heEluZGV4ID0gdGhpcy5zaXplIC0gMTtcbiAgICAgIHZhciBzdGVwID0gdGhpcy5fc3RlcDtcbiAgICAgIHZhciB2YWx1ZSA9IHJldmVyc2UgPyB0aGlzLl9zdGFydCArIG1heEluZGV4ICogc3RlcCA6IHRoaXMuX3N0YXJ0O1xuICAgICAgdmFyIGlpID0gMDtcbiAgICAgIHJldHVybiBuZXcgSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICB2YXIgdiA9IHZhbHVlO1xuICAgICAgICB2YWx1ZSArPSByZXZlcnNlID8gLXN0ZXAgOiBzdGVwO1xuICAgICAgICByZXR1cm4gaWkgPiBtYXhJbmRleCA/IGl0ZXJhdG9yRG9uZSgpIDogaXRlcmF0b3JWYWx1ZSh0eXBlLCBpaSsrLCB2KTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBSYW5nZS5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24ob3RoZXIpIHtcbiAgICAgIHJldHVybiBvdGhlciBpbnN0YW5jZW9mIFJhbmdlID9cbiAgICAgICAgdGhpcy5fc3RhcnQgPT09IG90aGVyLl9zdGFydCAmJlxuICAgICAgICB0aGlzLl9lbmQgPT09IG90aGVyLl9lbmQgJiZcbiAgICAgICAgdGhpcy5fc3RlcCA9PT0gb3RoZXIuX3N0ZXAgOlxuICAgICAgICBkZWVwRXF1YWwodGhpcywgb3RoZXIpO1xuICAgIH07XG5cblxuICB2YXIgRU1QVFlfUkFOR0U7XG5cbiAgY3JlYXRlQ2xhc3MoQ29sbGVjdGlvbiwgSXRlcmFibGUpO1xuICAgIGZ1bmN0aW9uIENvbGxlY3Rpb24oKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoJ0Fic3RyYWN0Jyk7XG4gICAgfVxuXG5cbiAgY3JlYXRlQ2xhc3MoS2V5ZWRDb2xsZWN0aW9uLCBDb2xsZWN0aW9uKTtmdW5jdGlvbiBLZXllZENvbGxlY3Rpb24oKSB7fVxuXG4gIGNyZWF0ZUNsYXNzKEluZGV4ZWRDb2xsZWN0aW9uLCBDb2xsZWN0aW9uKTtmdW5jdGlvbiBJbmRleGVkQ29sbGVjdGlvbigpIHt9XG5cbiAgY3JlYXRlQ2xhc3MoU2V0Q29sbGVjdGlvbiwgQ29sbGVjdGlvbik7ZnVuY3Rpb24gU2V0Q29sbGVjdGlvbigpIHt9XG5cblxuICBDb2xsZWN0aW9uLktleWVkID0gS2V5ZWRDb2xsZWN0aW9uO1xuICBDb2xsZWN0aW9uLkluZGV4ZWQgPSBJbmRleGVkQ29sbGVjdGlvbjtcbiAgQ29sbGVjdGlvbi5TZXQgPSBTZXRDb2xsZWN0aW9uO1xuXG4gIHZhciBpbXVsID1cbiAgICB0eXBlb2YgTWF0aC5pbXVsID09PSAnZnVuY3Rpb24nICYmIE1hdGguaW11bCgweGZmZmZmZmZmLCAyKSA9PT0gLTIgP1xuICAgIE1hdGguaW11bCA6XG4gICAgZnVuY3Rpb24gaW11bChhLCBiKSB7XG4gICAgICBhID0gYSB8IDA7IC8vIGludFxuICAgICAgYiA9IGIgfCAwOyAvLyBpbnRcbiAgICAgIHZhciBjID0gYSAmIDB4ZmZmZjtcbiAgICAgIHZhciBkID0gYiAmIDB4ZmZmZjtcbiAgICAgIC8vIFNoaWZ0IGJ5IDAgZml4ZXMgdGhlIHNpZ24gb24gdGhlIGhpZ2ggcGFydC5cbiAgICAgIHJldHVybiAoYyAqIGQpICsgKCgoKGEgPj4+IDE2KSAqIGQgKyBjICogKGIgPj4+IDE2KSkgPDwgMTYpID4+PiAwKSB8IDA7IC8vIGludFxuICAgIH07XG5cbiAgLy8gdjggaGFzIGFuIG9wdGltaXphdGlvbiBmb3Igc3RvcmluZyAzMS1iaXQgc2lnbmVkIG51bWJlcnMuXG4gIC8vIFZhbHVlcyB3aGljaCBoYXZlIGVpdGhlciAwMCBvciAxMSBhcyB0aGUgaGlnaCBvcmRlciBiaXRzIHF1YWxpZnkuXG4gIC8vIFRoaXMgZnVuY3Rpb24gZHJvcHMgdGhlIGhpZ2hlc3Qgb3JkZXIgYml0IGluIGEgc2lnbmVkIG51bWJlciwgbWFpbnRhaW5pbmdcbiAgLy8gdGhlIHNpZ24gYml0LlxuICBmdW5jdGlvbiBzbWkoaTMyKSB7XG4gICAgcmV0dXJuICgoaTMyID4+PiAxKSAmIDB4NDAwMDAwMDApIHwgKGkzMiAmIDB4QkZGRkZGRkYpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFzaChvKSB7XG4gICAgaWYgKG8gPT09IGZhbHNlIHx8IG8gPT09IG51bGwgfHwgbyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBvLnZhbHVlT2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIG8gPSBvLnZhbHVlT2YoKTtcbiAgICAgIGlmIChvID09PSBmYWxzZSB8fCBvID09PSBudWxsIHx8IG8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG8gPT09IHRydWUpIHtcbiAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICB2YXIgdHlwZSA9IHR5cGVvZiBvO1xuICAgIGlmICh0eXBlID09PSAnbnVtYmVyJykge1xuICAgICAgaWYgKG8gIT09IG8gfHwgbyA9PT0gSW5maW5pdHkpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9XG4gICAgICB2YXIgaCA9IG8gfCAwO1xuICAgICAgaWYgKGggIT09IG8pIHtcbiAgICAgICAgaCBePSBvICogMHhGRkZGRkZGRjtcbiAgICAgIH1cbiAgICAgIHdoaWxlIChvID4gMHhGRkZGRkZGRikge1xuICAgICAgICBvIC89IDB4RkZGRkZGRkY7XG4gICAgICAgIGggXj0gbztcbiAgICAgIH1cbiAgICAgIHJldHVybiBzbWkoaCk7XG4gICAgfVxuICAgIGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIG8ubGVuZ3RoID4gU1RSSU5HX0hBU0hfQ0FDSEVfTUlOX1NUUkxFTiA/IGNhY2hlZEhhc2hTdHJpbmcobykgOiBoYXNoU3RyaW5nKG8pO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG8uaGFzaENvZGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBvLmhhc2hDb2RlKCk7XG4gICAgfVxuICAgIGlmICh0eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIGhhc2hKU09iaihvKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBvLnRvU3RyaW5nID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gaGFzaFN0cmluZyhvLnRvU3RyaW5nKCkpO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZhbHVlIHR5cGUgJyArIHR5cGUgKyAnIGNhbm5vdCBiZSBoYXNoZWQuJyk7XG4gIH1cblxuICBmdW5jdGlvbiBjYWNoZWRIYXNoU3RyaW5nKHN0cmluZykge1xuICAgIHZhciBoYXNoID0gc3RyaW5nSGFzaENhY2hlW3N0cmluZ107XG4gICAgaWYgKGhhc2ggPT09IHVuZGVmaW5lZCkge1xuICAgICAgaGFzaCA9IGhhc2hTdHJpbmcoc3RyaW5nKTtcbiAgICAgIGlmIChTVFJJTkdfSEFTSF9DQUNIRV9TSVpFID09PSBTVFJJTkdfSEFTSF9DQUNIRV9NQVhfU0laRSkge1xuICAgICAgICBTVFJJTkdfSEFTSF9DQUNIRV9TSVpFID0gMDtcbiAgICAgICAgc3RyaW5nSGFzaENhY2hlID0ge307XG4gICAgICB9XG4gICAgICBTVFJJTkdfSEFTSF9DQUNIRV9TSVpFKys7XG4gICAgICBzdHJpbmdIYXNoQ2FjaGVbc3RyaW5nXSA9IGhhc2g7XG4gICAgfVxuICAgIHJldHVybiBoYXNoO1xuICB9XG5cbiAgLy8gaHR0cDovL2pzcGVyZi5jb20vaGFzaGluZy1zdHJpbmdzXG4gIGZ1bmN0aW9uIGhhc2hTdHJpbmcoc3RyaW5nKSB7XG4gICAgLy8gVGhpcyBpcyB0aGUgaGFzaCBmcm9tIEpWTVxuICAgIC8vIFRoZSBoYXNoIGNvZGUgZm9yIGEgc3RyaW5nIGlzIGNvbXB1dGVkIGFzXG4gICAgLy8gc1swXSAqIDMxIF4gKG4gLSAxKSArIHNbMV0gKiAzMSBeIChuIC0gMikgKyAuLi4gKyBzW24gLSAxXSxcbiAgICAvLyB3aGVyZSBzW2ldIGlzIHRoZSBpdGggY2hhcmFjdGVyIG9mIHRoZSBzdHJpbmcgYW5kIG4gaXMgdGhlIGxlbmd0aCBvZlxuICAgIC8vIHRoZSBzdHJpbmcuIFdlIFwibW9kXCIgdGhlIHJlc3VsdCB0byBtYWtlIGl0IGJldHdlZW4gMCAoaW5jbHVzaXZlKSBhbmQgMl4zMVxuICAgIC8vIChleGNsdXNpdmUpIGJ5IGRyb3BwaW5nIGhpZ2ggYml0cy5cbiAgICB2YXIgaGFzaCA9IDA7XG4gICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IHN0cmluZy5sZW5ndGg7IGlpKyspIHtcbiAgICAgIGhhc2ggPSAzMSAqIGhhc2ggKyBzdHJpbmcuY2hhckNvZGVBdChpaSkgfCAwO1xuICAgIH1cbiAgICByZXR1cm4gc21pKGhhc2gpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFzaEpTT2JqKG9iaikge1xuICAgIHZhciBoYXNoO1xuICAgIGlmICh1c2luZ1dlYWtNYXApIHtcbiAgICAgIGhhc2ggPSB3ZWFrTWFwLmdldChvYmopO1xuICAgICAgaWYgKGhhc2ggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gaGFzaDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBoYXNoID0gb2JqW1VJRF9IQVNIX0tFWV07XG4gICAgaWYgKGhhc2ggIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGhhc2g7XG4gICAgfVxuXG4gICAgaWYgKCFjYW5EZWZpbmVQcm9wZXJ0eSkge1xuICAgICAgaGFzaCA9IG9iai5wcm9wZXJ0eUlzRW51bWVyYWJsZSAmJiBvYmoucHJvcGVydHlJc0VudW1lcmFibGVbVUlEX0hBU0hfS0VZXTtcbiAgICAgIGlmIChoYXNoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGhhc2g7XG4gICAgICB9XG5cbiAgICAgIGhhc2ggPSBnZXRJRU5vZGVIYXNoKG9iaik7XG4gICAgICBpZiAoaGFzaCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBoYXNoO1xuICAgICAgfVxuICAgIH1cblxuICAgIGhhc2ggPSArK29iakhhc2hVSUQ7XG4gICAgaWYgKG9iakhhc2hVSUQgJiAweDQwMDAwMDAwKSB7XG4gICAgICBvYmpIYXNoVUlEID0gMDtcbiAgICB9XG5cbiAgICBpZiAodXNpbmdXZWFrTWFwKSB7XG4gICAgICB3ZWFrTWFwLnNldChvYmosIGhhc2gpO1xuICAgIH0gZWxzZSBpZiAoaXNFeHRlbnNpYmxlICE9PSB1bmRlZmluZWQgJiYgaXNFeHRlbnNpYmxlKG9iaikgPT09IGZhbHNlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vbi1leHRlbnNpYmxlIG9iamVjdHMgYXJlIG5vdCBhbGxvd2VkIGFzIGtleXMuJyk7XG4gICAgfSBlbHNlIGlmIChjYW5EZWZpbmVQcm9wZXJ0eSkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgVUlEX0hBU0hfS0VZLCB7XG4gICAgICAgICdlbnVtZXJhYmxlJzogZmFsc2UsXG4gICAgICAgICdjb25maWd1cmFibGUnOiBmYWxzZSxcbiAgICAgICAgJ3dyaXRhYmxlJzogZmFsc2UsXG4gICAgICAgICd2YWx1ZSc6IGhhc2hcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAob2JqLnByb3BlcnR5SXNFbnVtZXJhYmxlICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgICAgIG9iai5wcm9wZXJ0eUlzRW51bWVyYWJsZSA9PT0gb2JqLmNvbnN0cnVjdG9yLnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZSkge1xuICAgICAgLy8gU2luY2Ugd2UgY2FuJ3QgZGVmaW5lIGEgbm9uLWVudW1lcmFibGUgcHJvcGVydHkgb24gdGhlIG9iamVjdFxuICAgICAgLy8gd2UnbGwgaGlqYWNrIG9uZSBvZiB0aGUgbGVzcy11c2VkIG5vbi1lbnVtZXJhYmxlIHByb3BlcnRpZXMgdG9cbiAgICAgIC8vIHNhdmUgb3VyIGhhc2ggb24gaXQuIFNpbmNlIHRoaXMgaXMgYSBmdW5jdGlvbiBpdCB3aWxsIG5vdCBzaG93IHVwIGluXG4gICAgICAvLyBgSlNPTi5zdHJpbmdpZnlgIHdoaWNoIGlzIHdoYXQgd2Ugd2FudC5cbiAgICAgIG9iai5wcm9wZXJ0eUlzRW51bWVyYWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgICBvYmoucHJvcGVydHlJc0VudW1lcmFibGVbVUlEX0hBU0hfS0VZXSA9IGhhc2g7XG4gICAgfSBlbHNlIGlmIChvYmoubm9kZVR5cGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gQXQgdGhpcyBwb2ludCB3ZSBjb3VsZG4ndCBnZXQgdGhlIElFIGB1bmlxdWVJRGAgdG8gdXNlIGFzIGEgaGFzaFxuICAgICAgLy8gYW5kIHdlIGNvdWxkbid0IHVzZSBhIG5vbi1lbnVtZXJhYmxlIHByb3BlcnR5IHRvIGV4cGxvaXQgdGhlXG4gICAgICAvLyBkb250RW51bSBidWcgc28gd2Ugc2ltcGx5IGFkZCB0aGUgYFVJRF9IQVNIX0tFWWAgb24gdGhlIG5vZGVcbiAgICAgIC8vIGl0c2VsZi5cbiAgICAgIG9ialtVSURfSEFTSF9LRVldID0gaGFzaDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gc2V0IGEgbm9uLWVudW1lcmFibGUgcHJvcGVydHkgb24gb2JqZWN0LicpO1xuICAgIH1cblxuICAgIHJldHVybiBoYXNoO1xuICB9XG5cbiAgLy8gR2V0IHJlZmVyZW5jZXMgdG8gRVM1IG9iamVjdCBtZXRob2RzLlxuICB2YXIgaXNFeHRlbnNpYmxlID0gT2JqZWN0LmlzRXh0ZW5zaWJsZTtcblxuICAvLyBUcnVlIGlmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSB3b3JrcyBhcyBleHBlY3RlZC4gSUU4IGZhaWxzIHRoaXMgdGVzdC5cbiAgdmFyIGNhbkRlZmluZVByb3BlcnR5ID0gKGZ1bmN0aW9uKCkge1xuICAgIHRyeSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoe30sICdAJywge30pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSgpKTtcblxuICAvLyBJRSBoYXMgYSBgdW5pcXVlSURgIHByb3BlcnR5IG9uIERPTSBub2Rlcy4gV2UgY2FuIGNvbnN0cnVjdCB0aGUgaGFzaCBmcm9tIGl0XG4gIC8vIGFuZCBhdm9pZCBtZW1vcnkgbGVha3MgZnJvbSB0aGUgSUUgY2xvbmVOb2RlIGJ1Zy5cbiAgZnVuY3Rpb24gZ2V0SUVOb2RlSGFzaChub2RlKSB7XG4gICAgaWYgKG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA+IDApIHtcbiAgICAgIHN3aXRjaCAobm9kZS5ub2RlVHlwZSkge1xuICAgICAgICBjYXNlIDE6IC8vIEVsZW1lbnRcbiAgICAgICAgICByZXR1cm4gbm9kZS51bmlxdWVJRDtcbiAgICAgICAgY2FzZSA5OiAvLyBEb2N1bWVudFxuICAgICAgICAgIHJldHVybiBub2RlLmRvY3VtZW50RWxlbWVudCAmJiBub2RlLmRvY3VtZW50RWxlbWVudC51bmlxdWVJRDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBJZiBwb3NzaWJsZSwgdXNlIGEgV2Vha01hcC5cbiAgdmFyIHVzaW5nV2Vha01hcCA9IHR5cGVvZiBXZWFrTWFwID09PSAnZnVuY3Rpb24nO1xuICB2YXIgd2Vha01hcDtcbiAgaWYgKHVzaW5nV2Vha01hcCkge1xuICAgIHdlYWtNYXAgPSBuZXcgV2Vha01hcCgpO1xuICB9XG5cbiAgdmFyIG9iakhhc2hVSUQgPSAwO1xuXG4gIHZhciBVSURfSEFTSF9LRVkgPSAnX19pbW11dGFibGVoYXNoX18nO1xuICBpZiAodHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIFVJRF9IQVNIX0tFWSA9IFN5bWJvbChVSURfSEFTSF9LRVkpO1xuICB9XG5cbiAgdmFyIFNUUklOR19IQVNIX0NBQ0hFX01JTl9TVFJMRU4gPSAxNjtcbiAgdmFyIFNUUklOR19IQVNIX0NBQ0hFX01BWF9TSVpFID0gMjU1O1xuICB2YXIgU1RSSU5HX0hBU0hfQ0FDSEVfU0laRSA9IDA7XG4gIHZhciBzdHJpbmdIYXNoQ2FjaGUgPSB7fTtcblxuICBmdW5jdGlvbiBhc3NlcnROb3RJbmZpbml0ZShzaXplKSB7XG4gICAgaW52YXJpYW50KFxuICAgICAgc2l6ZSAhPT0gSW5maW5pdHksXG4gICAgICAnQ2Fubm90IHBlcmZvcm0gdGhpcyBhY3Rpb24gd2l0aCBhbiBpbmZpbml0ZSBzaXplLidcbiAgICApO1xuICB9XG5cbiAgY3JlYXRlQ2xhc3MoTWFwLCBLZXllZENvbGxlY3Rpb24pO1xuXG4gICAgLy8gQHByYWdtYSBDb25zdHJ1Y3Rpb25cblxuICAgIGZ1bmN0aW9uIE1hcCh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQgPyBlbXB0eU1hcCgpIDpcbiAgICAgICAgaXNNYXAodmFsdWUpICYmICFpc09yZGVyZWQodmFsdWUpID8gdmFsdWUgOlxuICAgICAgICBlbXB0eU1hcCgpLndpdGhNdXRhdGlvbnMoZnVuY3Rpb24obWFwICkge1xuICAgICAgICAgIHZhciBpdGVyID0gS2V5ZWRJdGVyYWJsZSh2YWx1ZSk7XG4gICAgICAgICAgYXNzZXJ0Tm90SW5maW5pdGUoaXRlci5zaXplKTtcbiAgICAgICAgICBpdGVyLmZvckVhY2goZnVuY3Rpb24odiwgaykgIHtyZXR1cm4gbWFwLnNldChrLCB2KX0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBNYXAub2YgPSBmdW5jdGlvbigpIHt2YXIga2V5VmFsdWVzID0gU0xJQ0UkMC5jYWxsKGFyZ3VtZW50cywgMCk7XG4gICAgICByZXR1cm4gZW1wdHlNYXAoKS53aXRoTXV0YXRpb25zKGZ1bmN0aW9uKG1hcCApIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlWYWx1ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgICBpZiAoaSArIDEgPj0ga2V5VmFsdWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIHZhbHVlIGZvciBrZXk6ICcgKyBrZXlWYWx1ZXNbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBtYXAuc2V0KGtleVZhbHVlc1tpXSwga2V5VmFsdWVzW2kgKyAxXSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBNYXAucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX3RvU3RyaW5nKCdNYXAgeycsICd9Jyk7XG4gICAgfTtcblxuICAgIC8vIEBwcmFnbWEgQWNjZXNzXG5cbiAgICBNYXAucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGssIG5vdFNldFZhbHVlKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcm9vdCA/XG4gICAgICAgIHRoaXMuX3Jvb3QuZ2V0KDAsIHVuZGVmaW5lZCwgaywgbm90U2V0VmFsdWUpIDpcbiAgICAgICAgbm90U2V0VmFsdWU7XG4gICAgfTtcblxuICAgIC8vIEBwcmFnbWEgTW9kaWZpY2F0aW9uXG5cbiAgICBNYXAucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKGssIHYpIHtcbiAgICAgIHJldHVybiB1cGRhdGVNYXAodGhpcywgaywgdik7XG4gICAgfTtcblxuICAgIE1hcC5wcm90b3R5cGUuc2V0SW4gPSBmdW5jdGlvbihrZXlQYXRoLCB2KSB7XG4gICAgICByZXR1cm4gdGhpcy51cGRhdGVJbihrZXlQYXRoLCBOT1RfU0VULCBmdW5jdGlvbigpICB7cmV0dXJuIHZ9KTtcbiAgICB9O1xuXG4gICAgTWFwLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihrKSB7XG4gICAgICByZXR1cm4gdXBkYXRlTWFwKHRoaXMsIGssIE5PVF9TRVQpO1xuICAgIH07XG5cbiAgICBNYXAucHJvdG90eXBlLmRlbGV0ZUluID0gZnVuY3Rpb24oa2V5UGF0aCkge1xuICAgICAgcmV0dXJuIHRoaXMudXBkYXRlSW4oa2V5UGF0aCwgZnVuY3Rpb24oKSAge3JldHVybiBOT1RfU0VUfSk7XG4gICAgfTtcblxuICAgIE1hcC5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oaywgbm90U2V0VmFsdWUsIHVwZGF0ZXIpIHtcbiAgICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID09PSAxID9cbiAgICAgICAgayh0aGlzKSA6XG4gICAgICAgIHRoaXMudXBkYXRlSW4oW2tdLCBub3RTZXRWYWx1ZSwgdXBkYXRlcik7XG4gICAgfTtcblxuICAgIE1hcC5wcm90b3R5cGUudXBkYXRlSW4gPSBmdW5jdGlvbihrZXlQYXRoLCBub3RTZXRWYWx1ZSwgdXBkYXRlcikge1xuICAgICAgaWYgKCF1cGRhdGVyKSB7XG4gICAgICAgIHVwZGF0ZXIgPSBub3RTZXRWYWx1ZTtcbiAgICAgICAgbm90U2V0VmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgICB2YXIgdXBkYXRlZFZhbHVlID0gdXBkYXRlSW5EZWVwTWFwKFxuICAgICAgICB0aGlzLFxuICAgICAgICBmb3JjZUl0ZXJhdG9yKGtleVBhdGgpLFxuICAgICAgICBub3RTZXRWYWx1ZSxcbiAgICAgICAgdXBkYXRlclxuICAgICAgKTtcbiAgICAgIHJldHVybiB1cGRhdGVkVmFsdWUgPT09IE5PVF9TRVQgPyB1bmRlZmluZWQgOiB1cGRhdGVkVmFsdWU7XG4gICAgfTtcblxuICAgIE1hcC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLnNpemUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fX293bmVySUQpIHtcbiAgICAgICAgdGhpcy5zaXplID0gMDtcbiAgICAgICAgdGhpcy5fcm9vdCA9IG51bGw7XG4gICAgICAgIHRoaXMuX19oYXNoID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl9fYWx0ZXJlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVtcHR5TWFwKCk7XG4gICAgfTtcblxuICAgIC8vIEBwcmFnbWEgQ29tcG9zaXRpb25cblxuICAgIE1hcC5wcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbigvKi4uLml0ZXJzKi8pIHtcbiAgICAgIHJldHVybiBtZXJnZUludG9NYXBXaXRoKHRoaXMsIHVuZGVmaW5lZCwgYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gICAgTWFwLnByb3RvdHlwZS5tZXJnZVdpdGggPSBmdW5jdGlvbihtZXJnZXIpIHt2YXIgaXRlcnMgPSBTTElDRSQwLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgIHJldHVybiBtZXJnZUludG9NYXBXaXRoKHRoaXMsIG1lcmdlciwgaXRlcnMpO1xuICAgIH07XG5cbiAgICBNYXAucHJvdG90eXBlLm1lcmdlSW4gPSBmdW5jdGlvbihrZXlQYXRoKSB7dmFyIGl0ZXJzID0gU0xJQ0UkMC5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICByZXR1cm4gdGhpcy51cGRhdGVJbihcbiAgICAgICAga2V5UGF0aCxcbiAgICAgICAgZW1wdHlNYXAoKSxcbiAgICAgICAgZnVuY3Rpb24obSApIHtyZXR1cm4gdHlwZW9mIG0ubWVyZ2UgPT09ICdmdW5jdGlvbicgP1xuICAgICAgICAgIG0ubWVyZ2UuYXBwbHkobSwgaXRlcnMpIDpcbiAgICAgICAgICBpdGVyc1tpdGVycy5sZW5ndGggLSAxXX1cbiAgICAgICk7XG4gICAgfTtcblxuICAgIE1hcC5wcm90b3R5cGUubWVyZ2VEZWVwID0gZnVuY3Rpb24oLyouLi5pdGVycyovKSB7XG4gICAgICByZXR1cm4gbWVyZ2VJbnRvTWFwV2l0aCh0aGlzLCBkZWVwTWVyZ2VyLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBNYXAucHJvdG90eXBlLm1lcmdlRGVlcFdpdGggPSBmdW5jdGlvbihtZXJnZXIpIHt2YXIgaXRlcnMgPSBTTElDRSQwLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgIHJldHVybiBtZXJnZUludG9NYXBXaXRoKHRoaXMsIGRlZXBNZXJnZXJXaXRoKG1lcmdlciksIGl0ZXJzKTtcbiAgICB9O1xuXG4gICAgTWFwLnByb3RvdHlwZS5tZXJnZURlZXBJbiA9IGZ1bmN0aW9uKGtleVBhdGgpIHt2YXIgaXRlcnMgPSBTTElDRSQwLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgIHJldHVybiB0aGlzLnVwZGF0ZUluKFxuICAgICAgICBrZXlQYXRoLFxuICAgICAgICBlbXB0eU1hcCgpLFxuICAgICAgICBmdW5jdGlvbihtICkge3JldHVybiB0eXBlb2YgbS5tZXJnZURlZXAgPT09ICdmdW5jdGlvbicgP1xuICAgICAgICAgIG0ubWVyZ2VEZWVwLmFwcGx5KG0sIGl0ZXJzKSA6XG4gICAgICAgICAgaXRlcnNbaXRlcnMubGVuZ3RoIC0gMV19XG4gICAgICApO1xuICAgIH07XG5cbiAgICBNYXAucHJvdG90eXBlLnNvcnQgPSBmdW5jdGlvbihjb21wYXJhdG9yKSB7XG4gICAgICAvLyBMYXRlIGJpbmRpbmdcbiAgICAgIHJldHVybiBPcmRlcmVkTWFwKHNvcnRGYWN0b3J5KHRoaXMsIGNvbXBhcmF0b3IpKTtcbiAgICB9O1xuXG4gICAgTWFwLnByb3RvdHlwZS5zb3J0QnkgPSBmdW5jdGlvbihtYXBwZXIsIGNvbXBhcmF0b3IpIHtcbiAgICAgIC8vIExhdGUgYmluZGluZ1xuICAgICAgcmV0dXJuIE9yZGVyZWRNYXAoc29ydEZhY3RvcnkodGhpcywgY29tcGFyYXRvciwgbWFwcGVyKSk7XG4gICAgfTtcblxuICAgIC8vIEBwcmFnbWEgTXV0YWJpbGl0eVxuXG4gICAgTWFwLnByb3RvdHlwZS53aXRoTXV0YXRpb25zID0gZnVuY3Rpb24oZm4pIHtcbiAgICAgIHZhciBtdXRhYmxlID0gdGhpcy5hc011dGFibGUoKTtcbiAgICAgIGZuKG11dGFibGUpO1xuICAgICAgcmV0dXJuIG11dGFibGUud2FzQWx0ZXJlZCgpID8gbXV0YWJsZS5fX2Vuc3VyZU93bmVyKHRoaXMuX19vd25lcklEKSA6IHRoaXM7XG4gICAgfTtcblxuICAgIE1hcC5wcm90b3R5cGUuYXNNdXRhYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX293bmVySUQgPyB0aGlzIDogdGhpcy5fX2Vuc3VyZU93bmVyKG5ldyBPd25lcklEKCkpO1xuICAgIH07XG5cbiAgICBNYXAucHJvdG90eXBlLmFzSW1tdXRhYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2Vuc3VyZU93bmVyKCk7XG4gICAgfTtcblxuICAgIE1hcC5wcm90b3R5cGUud2FzQWx0ZXJlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX19hbHRlcmVkO1xuICAgIH07XG5cbiAgICBNYXAucHJvdG90eXBlLl9faXRlcmF0b3IgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICByZXR1cm4gbmV3IE1hcEl0ZXJhdG9yKHRoaXMsIHR5cGUsIHJldmVyc2UpO1xuICAgIH07XG5cbiAgICBNYXAucHJvdG90eXBlLl9faXRlcmF0ZSA9IGZ1bmN0aW9uKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICB0aGlzLl9yb290ICYmIHRoaXMuX3Jvb3QuaXRlcmF0ZShmdW5jdGlvbihlbnRyeSApIHtcbiAgICAgICAgaXRlcmF0aW9ucysrO1xuICAgICAgICByZXR1cm4gZm4oZW50cnlbMV0sIGVudHJ5WzBdLCB0aGlzJDApO1xuICAgICAgfSwgcmV2ZXJzZSk7XG4gICAgICByZXR1cm4gaXRlcmF0aW9ucztcbiAgICB9O1xuXG4gICAgTWFwLnByb3RvdHlwZS5fX2Vuc3VyZU93bmVyID0gZnVuY3Rpb24ob3duZXJJRCkge1xuICAgICAgaWYgKG93bmVySUQgPT09IHRoaXMuX19vd25lcklEKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgaWYgKCFvd25lcklEKSB7XG4gICAgICAgIHRoaXMuX19vd25lcklEID0gb3duZXJJRDtcbiAgICAgICAgdGhpcy5fX2FsdGVyZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gbWFrZU1hcCh0aGlzLnNpemUsIHRoaXMuX3Jvb3QsIG93bmVySUQsIHRoaXMuX19oYXNoKTtcbiAgICB9O1xuXG5cbiAgZnVuY3Rpb24gaXNNYXAobWF5YmVNYXApIHtcbiAgICByZXR1cm4gISEobWF5YmVNYXAgJiYgbWF5YmVNYXBbSVNfTUFQX1NFTlRJTkVMXSk7XG4gIH1cblxuICBNYXAuaXNNYXAgPSBpc01hcDtcblxuICB2YXIgSVNfTUFQX1NFTlRJTkVMID0gJ0BAX19JTU1VVEFCTEVfTUFQX19AQCc7XG5cbiAgdmFyIE1hcFByb3RvdHlwZSA9IE1hcC5wcm90b3R5cGU7XG4gIE1hcFByb3RvdHlwZVtJU19NQVBfU0VOVElORUxdID0gdHJ1ZTtcbiAgTWFwUHJvdG90eXBlW0RFTEVURV0gPSBNYXBQcm90b3R5cGUucmVtb3ZlO1xuICBNYXBQcm90b3R5cGUucmVtb3ZlSW4gPSBNYXBQcm90b3R5cGUuZGVsZXRlSW47XG5cblxuICAvLyAjcHJhZ21hIFRyaWUgTm9kZXNcblxuXG5cbiAgICBmdW5jdGlvbiBBcnJheU1hcE5vZGUob3duZXJJRCwgZW50cmllcykge1xuICAgICAgdGhpcy5vd25lcklEID0gb3duZXJJRDtcbiAgICAgIHRoaXMuZW50cmllcyA9IGVudHJpZXM7XG4gICAgfVxuXG4gICAgQXJyYXlNYXBOb2RlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihzaGlmdCwga2V5SGFzaCwga2V5LCBub3RTZXRWYWx1ZSkge1xuICAgICAgdmFyIGVudHJpZXMgPSB0aGlzLmVudHJpZXM7XG4gICAgICBmb3IgKHZhciBpaSA9IDAsIGxlbiA9IGVudHJpZXMubGVuZ3RoOyBpaSA8IGxlbjsgaWkrKykge1xuICAgICAgICBpZiAoaXMoa2V5LCBlbnRyaWVzW2lpXVswXSkpIHtcbiAgICAgICAgICByZXR1cm4gZW50cmllc1tpaV1bMV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBub3RTZXRWYWx1ZTtcbiAgICB9O1xuXG4gICAgQXJyYXlNYXBOb2RlLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihvd25lcklELCBzaGlmdCwga2V5SGFzaCwga2V5LCB2YWx1ZSwgZGlkQ2hhbmdlU2l6ZSwgZGlkQWx0ZXIpIHtcbiAgICAgIHZhciByZW1vdmVkID0gdmFsdWUgPT09IE5PVF9TRVQ7XG5cbiAgICAgIHZhciBlbnRyaWVzID0gdGhpcy5lbnRyaWVzO1xuICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICBmb3IgKHZhciBsZW4gPSBlbnRyaWVzLmxlbmd0aDsgaWR4IDwgbGVuOyBpZHgrKykge1xuICAgICAgICBpZiAoaXMoa2V5LCBlbnRyaWVzW2lkeF1bMF0pKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhciBleGlzdHMgPSBpZHggPCBsZW47XG5cbiAgICAgIGlmIChleGlzdHMgPyBlbnRyaWVzW2lkeF1bMV0gPT09IHZhbHVlIDogcmVtb3ZlZCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgU2V0UmVmKGRpZEFsdGVyKTtcbiAgICAgIChyZW1vdmVkIHx8ICFleGlzdHMpICYmIFNldFJlZihkaWRDaGFuZ2VTaXplKTtcblxuICAgICAgaWYgKHJlbW92ZWQgJiYgZW50cmllcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuOyAvLyB1bmRlZmluZWRcbiAgICAgIH1cblxuICAgICAgaWYgKCFleGlzdHMgJiYgIXJlbW92ZWQgJiYgZW50cmllcy5sZW5ndGggPj0gTUFYX0FSUkFZX01BUF9TSVpFKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVOb2Rlcyhvd25lcklELCBlbnRyaWVzLCBrZXksIHZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgdmFyIGlzRWRpdGFibGUgPSBvd25lcklEICYmIG93bmVySUQgPT09IHRoaXMub3duZXJJRDtcbiAgICAgIHZhciBuZXdFbnRyaWVzID0gaXNFZGl0YWJsZSA/IGVudHJpZXMgOiBhcnJDb3B5KGVudHJpZXMpO1xuXG4gICAgICBpZiAoZXhpc3RzKSB7XG4gICAgICAgIGlmIChyZW1vdmVkKSB7XG4gICAgICAgICAgaWR4ID09PSBsZW4gLSAxID8gbmV3RW50cmllcy5wb3AoKSA6IChuZXdFbnRyaWVzW2lkeF0gPSBuZXdFbnRyaWVzLnBvcCgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXdFbnRyaWVzW2lkeF0gPSBba2V5LCB2YWx1ZV07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld0VudHJpZXMucHVzaChba2V5LCB2YWx1ZV0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNFZGl0YWJsZSkge1xuICAgICAgICB0aGlzLmVudHJpZXMgPSBuZXdFbnRyaWVzO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBBcnJheU1hcE5vZGUob3duZXJJRCwgbmV3RW50cmllcyk7XG4gICAgfTtcblxuXG5cblxuICAgIGZ1bmN0aW9uIEJpdG1hcEluZGV4ZWROb2RlKG93bmVySUQsIGJpdG1hcCwgbm9kZXMpIHtcbiAgICAgIHRoaXMub3duZXJJRCA9IG93bmVySUQ7XG4gICAgICB0aGlzLmJpdG1hcCA9IGJpdG1hcDtcbiAgICAgIHRoaXMubm9kZXMgPSBub2RlcztcbiAgICB9XG5cbiAgICBCaXRtYXBJbmRleGVkTm9kZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oc2hpZnQsIGtleUhhc2gsIGtleSwgbm90U2V0VmFsdWUpIHtcbiAgICAgIGlmIChrZXlIYXNoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAga2V5SGFzaCA9IGhhc2goa2V5KTtcbiAgICAgIH1cbiAgICAgIHZhciBiaXQgPSAoMSA8PCAoKHNoaWZ0ID09PSAwID8ga2V5SGFzaCA6IGtleUhhc2ggPj4+IHNoaWZ0KSAmIE1BU0spKTtcbiAgICAgIHZhciBiaXRtYXAgPSB0aGlzLmJpdG1hcDtcbiAgICAgIHJldHVybiAoYml0bWFwICYgYml0KSA9PT0gMCA/IG5vdFNldFZhbHVlIDpcbiAgICAgICAgdGhpcy5ub2Rlc1twb3BDb3VudChiaXRtYXAgJiAoYml0IC0gMSkpXS5nZXQoc2hpZnQgKyBTSElGVCwga2V5SGFzaCwga2V5LCBub3RTZXRWYWx1ZSk7XG4gICAgfTtcblxuICAgIEJpdG1hcEluZGV4ZWROb2RlLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihvd25lcklELCBzaGlmdCwga2V5SGFzaCwga2V5LCB2YWx1ZSwgZGlkQ2hhbmdlU2l6ZSwgZGlkQWx0ZXIpIHtcbiAgICAgIGlmIChrZXlIYXNoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAga2V5SGFzaCA9IGhhc2goa2V5KTtcbiAgICAgIH1cbiAgICAgIHZhciBrZXlIYXNoRnJhZyA9IChzaGlmdCA9PT0gMCA/IGtleUhhc2ggOiBrZXlIYXNoID4+PiBzaGlmdCkgJiBNQVNLO1xuICAgICAgdmFyIGJpdCA9IDEgPDwga2V5SGFzaEZyYWc7XG4gICAgICB2YXIgYml0bWFwID0gdGhpcy5iaXRtYXA7XG4gICAgICB2YXIgZXhpc3RzID0gKGJpdG1hcCAmIGJpdCkgIT09IDA7XG5cbiAgICAgIGlmICghZXhpc3RzICYmIHZhbHVlID09PSBOT1RfU0VUKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICB2YXIgaWR4ID0gcG9wQ291bnQoYml0bWFwICYgKGJpdCAtIDEpKTtcbiAgICAgIHZhciBub2RlcyA9IHRoaXMubm9kZXM7XG4gICAgICB2YXIgbm9kZSA9IGV4aXN0cyA/IG5vZGVzW2lkeF0gOiB1bmRlZmluZWQ7XG4gICAgICB2YXIgbmV3Tm9kZSA9IHVwZGF0ZU5vZGUobm9kZSwgb3duZXJJRCwgc2hpZnQgKyBTSElGVCwga2V5SGFzaCwga2V5LCB2YWx1ZSwgZGlkQ2hhbmdlU2l6ZSwgZGlkQWx0ZXIpO1xuXG4gICAgICBpZiAobmV3Tm9kZSA9PT0gbm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgaWYgKCFleGlzdHMgJiYgbmV3Tm9kZSAmJiBub2Rlcy5sZW5ndGggPj0gTUFYX0JJVE1BUF9JTkRFWEVEX1NJWkUpIHtcbiAgICAgICAgcmV0dXJuIGV4cGFuZE5vZGVzKG93bmVySUQsIG5vZGVzLCBiaXRtYXAsIGtleUhhc2hGcmFnLCBuZXdOb2RlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGV4aXN0cyAmJiAhbmV3Tm9kZSAmJiBub2Rlcy5sZW5ndGggPT09IDIgJiYgaXNMZWFmTm9kZShub2Rlc1tpZHggXiAxXSkpIHtcbiAgICAgICAgcmV0dXJuIG5vZGVzW2lkeCBeIDFdO1xuICAgICAgfVxuXG4gICAgICBpZiAoZXhpc3RzICYmIG5ld05vZGUgJiYgbm9kZXMubGVuZ3RoID09PSAxICYmIGlzTGVhZk5vZGUobmV3Tm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIG5ld05vZGU7XG4gICAgICB9XG5cbiAgICAgIHZhciBpc0VkaXRhYmxlID0gb3duZXJJRCAmJiBvd25lcklEID09PSB0aGlzLm93bmVySUQ7XG4gICAgICB2YXIgbmV3Qml0bWFwID0gZXhpc3RzID8gbmV3Tm9kZSA/IGJpdG1hcCA6IGJpdG1hcCBeIGJpdCA6IGJpdG1hcCB8IGJpdDtcbiAgICAgIHZhciBuZXdOb2RlcyA9IGV4aXN0cyA/IG5ld05vZGUgP1xuICAgICAgICBzZXRJbihub2RlcywgaWR4LCBuZXdOb2RlLCBpc0VkaXRhYmxlKSA6XG4gICAgICAgIHNwbGljZU91dChub2RlcywgaWR4LCBpc0VkaXRhYmxlKSA6XG4gICAgICAgIHNwbGljZUluKG5vZGVzLCBpZHgsIG5ld05vZGUsIGlzRWRpdGFibGUpO1xuXG4gICAgICBpZiAoaXNFZGl0YWJsZSkge1xuICAgICAgICB0aGlzLmJpdG1hcCA9IG5ld0JpdG1hcDtcbiAgICAgICAgdGhpcy5ub2RlcyA9IG5ld05vZGVzO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBCaXRtYXBJbmRleGVkTm9kZShvd25lcklELCBuZXdCaXRtYXAsIG5ld05vZGVzKTtcbiAgICB9O1xuXG5cblxuXG4gICAgZnVuY3Rpb24gSGFzaEFycmF5TWFwTm9kZShvd25lcklELCBjb3VudCwgbm9kZXMpIHtcbiAgICAgIHRoaXMub3duZXJJRCA9IG93bmVySUQ7XG4gICAgICB0aGlzLmNvdW50ID0gY291bnQ7XG4gICAgICB0aGlzLm5vZGVzID0gbm9kZXM7XG4gICAgfVxuXG4gICAgSGFzaEFycmF5TWFwTm9kZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oc2hpZnQsIGtleUhhc2gsIGtleSwgbm90U2V0VmFsdWUpIHtcbiAgICAgIGlmIChrZXlIYXNoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAga2V5SGFzaCA9IGhhc2goa2V5KTtcbiAgICAgIH1cbiAgICAgIHZhciBpZHggPSAoc2hpZnQgPT09IDAgPyBrZXlIYXNoIDoga2V5SGFzaCA+Pj4gc2hpZnQpICYgTUFTSztcbiAgICAgIHZhciBub2RlID0gdGhpcy5ub2Rlc1tpZHhdO1xuICAgICAgcmV0dXJuIG5vZGUgPyBub2RlLmdldChzaGlmdCArIFNISUZULCBrZXlIYXNoLCBrZXksIG5vdFNldFZhbHVlKSA6IG5vdFNldFZhbHVlO1xuICAgIH07XG5cbiAgICBIYXNoQXJyYXlNYXBOb2RlLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihvd25lcklELCBzaGlmdCwga2V5SGFzaCwga2V5LCB2YWx1ZSwgZGlkQ2hhbmdlU2l6ZSwgZGlkQWx0ZXIpIHtcbiAgICAgIGlmIChrZXlIYXNoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAga2V5SGFzaCA9IGhhc2goa2V5KTtcbiAgICAgIH1cbiAgICAgIHZhciBpZHggPSAoc2hpZnQgPT09IDAgPyBrZXlIYXNoIDoga2V5SGFzaCA+Pj4gc2hpZnQpICYgTUFTSztcbiAgICAgIHZhciByZW1vdmVkID0gdmFsdWUgPT09IE5PVF9TRVQ7XG4gICAgICB2YXIgbm9kZXMgPSB0aGlzLm5vZGVzO1xuICAgICAgdmFyIG5vZGUgPSBub2Rlc1tpZHhdO1xuXG4gICAgICBpZiAocmVtb3ZlZCAmJiAhbm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgdmFyIG5ld05vZGUgPSB1cGRhdGVOb2RlKG5vZGUsIG93bmVySUQsIHNoaWZ0ICsgU0hJRlQsIGtleUhhc2gsIGtleSwgdmFsdWUsIGRpZENoYW5nZVNpemUsIGRpZEFsdGVyKTtcbiAgICAgIGlmIChuZXdOb2RlID09PSBub2RlKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICB2YXIgbmV3Q291bnQgPSB0aGlzLmNvdW50O1xuICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgIG5ld0NvdW50Kys7XG4gICAgICB9IGVsc2UgaWYgKCFuZXdOb2RlKSB7XG4gICAgICAgIG5ld0NvdW50LS07XG4gICAgICAgIGlmIChuZXdDb3VudCA8IE1JTl9IQVNIX0FSUkFZX01BUF9TSVpFKSB7XG4gICAgICAgICAgcmV0dXJuIHBhY2tOb2Rlcyhvd25lcklELCBub2RlcywgbmV3Q291bnQsIGlkeCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIGlzRWRpdGFibGUgPSBvd25lcklEICYmIG93bmVySUQgPT09IHRoaXMub3duZXJJRDtcbiAgICAgIHZhciBuZXdOb2RlcyA9IHNldEluKG5vZGVzLCBpZHgsIG5ld05vZGUsIGlzRWRpdGFibGUpO1xuXG4gICAgICBpZiAoaXNFZGl0YWJsZSkge1xuICAgICAgICB0aGlzLmNvdW50ID0gbmV3Q291bnQ7XG4gICAgICAgIHRoaXMubm9kZXMgPSBuZXdOb2RlcztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgSGFzaEFycmF5TWFwTm9kZShvd25lcklELCBuZXdDb3VudCwgbmV3Tm9kZXMpO1xuICAgIH07XG5cblxuXG5cbiAgICBmdW5jdGlvbiBIYXNoQ29sbGlzaW9uTm9kZShvd25lcklELCBrZXlIYXNoLCBlbnRyaWVzKSB7XG4gICAgICB0aGlzLm93bmVySUQgPSBvd25lcklEO1xuICAgICAgdGhpcy5rZXlIYXNoID0ga2V5SGFzaDtcbiAgICAgIHRoaXMuZW50cmllcyA9IGVudHJpZXM7XG4gICAgfVxuXG4gICAgSGFzaENvbGxpc2lvbk5vZGUucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKHNoaWZ0LCBrZXlIYXNoLCBrZXksIG5vdFNldFZhbHVlKSB7XG4gICAgICB2YXIgZW50cmllcyA9IHRoaXMuZW50cmllcztcbiAgICAgIGZvciAodmFyIGlpID0gMCwgbGVuID0gZW50cmllcy5sZW5ndGg7IGlpIDwgbGVuOyBpaSsrKSB7XG4gICAgICAgIGlmIChpcyhrZXksIGVudHJpZXNbaWldWzBdKSkge1xuICAgICAgICAgIHJldHVybiBlbnRyaWVzW2lpXVsxXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG5vdFNldFZhbHVlO1xuICAgIH07XG5cbiAgICBIYXNoQ29sbGlzaW9uTm9kZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24ob3duZXJJRCwgc2hpZnQsIGtleUhhc2gsIGtleSwgdmFsdWUsIGRpZENoYW5nZVNpemUsIGRpZEFsdGVyKSB7XG4gICAgICBpZiAoa2V5SGFzaCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGtleUhhc2ggPSBoYXNoKGtleSk7XG4gICAgICB9XG5cbiAgICAgIHZhciByZW1vdmVkID0gdmFsdWUgPT09IE5PVF9TRVQ7XG5cbiAgICAgIGlmIChrZXlIYXNoICE9PSB0aGlzLmtleUhhc2gpIHtcbiAgICAgICAgaWYgKHJlbW92ZWQpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBTZXRSZWYoZGlkQWx0ZXIpO1xuICAgICAgICBTZXRSZWYoZGlkQ2hhbmdlU2l6ZSk7XG4gICAgICAgIHJldHVybiBtZXJnZUludG9Ob2RlKHRoaXMsIG93bmVySUQsIHNoaWZ0LCBrZXlIYXNoLCBba2V5LCB2YWx1ZV0pO1xuICAgICAgfVxuXG4gICAgICB2YXIgZW50cmllcyA9IHRoaXMuZW50cmllcztcbiAgICAgIHZhciBpZHggPSAwO1xuICAgICAgZm9yICh2YXIgbGVuID0gZW50cmllcy5sZW5ndGg7IGlkeCA8IGxlbjsgaWR4KyspIHtcbiAgICAgICAgaWYgKGlzKGtleSwgZW50cmllc1tpZHhdWzBdKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YXIgZXhpc3RzID0gaWR4IDwgbGVuO1xuXG4gICAgICBpZiAoZXhpc3RzID8gZW50cmllc1tpZHhdWzFdID09PSB2YWx1ZSA6IHJlbW92ZWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIFNldFJlZihkaWRBbHRlcik7XG4gICAgICAocmVtb3ZlZCB8fCAhZXhpc3RzKSAmJiBTZXRSZWYoZGlkQ2hhbmdlU2l6ZSk7XG5cbiAgICAgIGlmIChyZW1vdmVkICYmIGxlbiA9PT0gMikge1xuICAgICAgICByZXR1cm4gbmV3IFZhbHVlTm9kZShvd25lcklELCB0aGlzLmtleUhhc2gsIGVudHJpZXNbaWR4IF4gMV0pO1xuICAgICAgfVxuXG4gICAgICB2YXIgaXNFZGl0YWJsZSA9IG93bmVySUQgJiYgb3duZXJJRCA9PT0gdGhpcy5vd25lcklEO1xuICAgICAgdmFyIG5ld0VudHJpZXMgPSBpc0VkaXRhYmxlID8gZW50cmllcyA6IGFyckNvcHkoZW50cmllcyk7XG5cbiAgICAgIGlmIChleGlzdHMpIHtcbiAgICAgICAgaWYgKHJlbW92ZWQpIHtcbiAgICAgICAgICBpZHggPT09IGxlbiAtIDEgPyBuZXdFbnRyaWVzLnBvcCgpIDogKG5ld0VudHJpZXNbaWR4XSA9IG5ld0VudHJpZXMucG9wKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ld0VudHJpZXNbaWR4XSA9IFtrZXksIHZhbHVlXTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3RW50cmllcy5wdXNoKFtrZXksIHZhbHVlXSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChpc0VkaXRhYmxlKSB7XG4gICAgICAgIHRoaXMuZW50cmllcyA9IG5ld0VudHJpZXM7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IEhhc2hDb2xsaXNpb25Ob2RlKG93bmVySUQsIHRoaXMua2V5SGFzaCwgbmV3RW50cmllcyk7XG4gICAgfTtcblxuXG5cblxuICAgIGZ1bmN0aW9uIFZhbHVlTm9kZShvd25lcklELCBrZXlIYXNoLCBlbnRyeSkge1xuICAgICAgdGhpcy5vd25lcklEID0gb3duZXJJRDtcbiAgICAgIHRoaXMua2V5SGFzaCA9IGtleUhhc2g7XG4gICAgICB0aGlzLmVudHJ5ID0gZW50cnk7XG4gICAgfVxuXG4gICAgVmFsdWVOb2RlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihzaGlmdCwga2V5SGFzaCwga2V5LCBub3RTZXRWYWx1ZSkge1xuICAgICAgcmV0dXJuIGlzKGtleSwgdGhpcy5lbnRyeVswXSkgPyB0aGlzLmVudHJ5WzFdIDogbm90U2V0VmFsdWU7XG4gICAgfTtcblxuICAgIFZhbHVlTm9kZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24ob3duZXJJRCwgc2hpZnQsIGtleUhhc2gsIGtleSwgdmFsdWUsIGRpZENoYW5nZVNpemUsIGRpZEFsdGVyKSB7XG4gICAgICB2YXIgcmVtb3ZlZCA9IHZhbHVlID09PSBOT1RfU0VUO1xuICAgICAgdmFyIGtleU1hdGNoID0gaXMoa2V5LCB0aGlzLmVudHJ5WzBdKTtcbiAgICAgIGlmIChrZXlNYXRjaCA/IHZhbHVlID09PSB0aGlzLmVudHJ5WzFdIDogcmVtb3ZlZCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgU2V0UmVmKGRpZEFsdGVyKTtcblxuICAgICAgaWYgKHJlbW92ZWQpIHtcbiAgICAgICAgU2V0UmVmKGRpZENoYW5nZVNpemUpO1xuICAgICAgICByZXR1cm47IC8vIHVuZGVmaW5lZFxuICAgICAgfVxuXG4gICAgICBpZiAoa2V5TWF0Y2gpIHtcbiAgICAgICAgaWYgKG93bmVySUQgJiYgb3duZXJJRCA9PT0gdGhpcy5vd25lcklEKSB7XG4gICAgICAgICAgdGhpcy5lbnRyeVsxXSA9IHZhbHVlO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgVmFsdWVOb2RlKG93bmVySUQsIHRoaXMua2V5SGFzaCwgW2tleSwgdmFsdWVdKTtcbiAgICAgIH1cblxuICAgICAgU2V0UmVmKGRpZENoYW5nZVNpemUpO1xuICAgICAgcmV0dXJuIG1lcmdlSW50b05vZGUodGhpcywgb3duZXJJRCwgc2hpZnQsIGhhc2goa2V5KSwgW2tleSwgdmFsdWVdKTtcbiAgICB9O1xuXG5cblxuICAvLyAjcHJhZ21hIEl0ZXJhdG9yc1xuXG4gIEFycmF5TWFwTm9kZS5wcm90b3R5cGUuaXRlcmF0ZSA9XG4gIEhhc2hDb2xsaXNpb25Ob2RlLnByb3RvdHlwZS5pdGVyYXRlID0gZnVuY3Rpb24gKGZuLCByZXZlcnNlKSB7XG4gICAgdmFyIGVudHJpZXMgPSB0aGlzLmVudHJpZXM7XG4gICAgZm9yICh2YXIgaWkgPSAwLCBtYXhJbmRleCA9IGVudHJpZXMubGVuZ3RoIC0gMTsgaWkgPD0gbWF4SW5kZXg7IGlpKyspIHtcbiAgICAgIGlmIChmbihlbnRyaWVzW3JldmVyc2UgPyBtYXhJbmRleCAtIGlpIDogaWldKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIEJpdG1hcEluZGV4ZWROb2RlLnByb3RvdHlwZS5pdGVyYXRlID1cbiAgSGFzaEFycmF5TWFwTm9kZS5wcm90b3R5cGUuaXRlcmF0ZSA9IGZ1bmN0aW9uIChmbiwgcmV2ZXJzZSkge1xuICAgIHZhciBub2RlcyA9IHRoaXMubm9kZXM7XG4gICAgZm9yICh2YXIgaWkgPSAwLCBtYXhJbmRleCA9IG5vZGVzLmxlbmd0aCAtIDE7IGlpIDw9IG1heEluZGV4OyBpaSsrKSB7XG4gICAgICB2YXIgbm9kZSA9IG5vZGVzW3JldmVyc2UgPyBtYXhJbmRleCAtIGlpIDogaWldO1xuICAgICAgaWYgKG5vZGUgJiYgbm9kZS5pdGVyYXRlKGZuLCByZXZlcnNlKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIFZhbHVlTm9kZS5wcm90b3R5cGUuaXRlcmF0ZSA9IGZ1bmN0aW9uIChmbiwgcmV2ZXJzZSkge1xuICAgIHJldHVybiBmbih0aGlzLmVudHJ5KTtcbiAgfVxuXG4gIGNyZWF0ZUNsYXNzKE1hcEl0ZXJhdG9yLCBJdGVyYXRvcik7XG5cbiAgICBmdW5jdGlvbiBNYXBJdGVyYXRvcihtYXAsIHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIHRoaXMuX3R5cGUgPSB0eXBlO1xuICAgICAgdGhpcy5fcmV2ZXJzZSA9IHJldmVyc2U7XG4gICAgICB0aGlzLl9zdGFjayA9IG1hcC5fcm9vdCAmJiBtYXBJdGVyYXRvckZyYW1lKG1hcC5fcm9vdCk7XG4gICAgfVxuXG4gICAgTWFwSXRlcmF0b3IucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0eXBlID0gdGhpcy5fdHlwZTtcbiAgICAgIHZhciBzdGFjayA9IHRoaXMuX3N0YWNrO1xuICAgICAgd2hpbGUgKHN0YWNrKSB7XG4gICAgICAgIHZhciBub2RlID0gc3RhY2subm9kZTtcbiAgICAgICAgdmFyIGluZGV4ID0gc3RhY2suaW5kZXgrKztcbiAgICAgICAgdmFyIG1heEluZGV4O1xuICAgICAgICBpZiAobm9kZS5lbnRyeSkge1xuICAgICAgICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG1hcEl0ZXJhdG9yVmFsdWUodHlwZSwgbm9kZS5lbnRyeSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG5vZGUuZW50cmllcykge1xuICAgICAgICAgIG1heEluZGV4ID0gbm9kZS5lbnRyaWVzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgaWYgKGluZGV4IDw9IG1heEluZGV4KSB7XG4gICAgICAgICAgICByZXR1cm4gbWFwSXRlcmF0b3JWYWx1ZSh0eXBlLCBub2RlLmVudHJpZXNbdGhpcy5fcmV2ZXJzZSA/IG1heEluZGV4IC0gaW5kZXggOiBpbmRleF0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtYXhJbmRleCA9IG5vZGUubm9kZXMubGVuZ3RoIC0gMTtcbiAgICAgICAgICBpZiAoaW5kZXggPD0gbWF4SW5kZXgpIHtcbiAgICAgICAgICAgIHZhciBzdWJOb2RlID0gbm9kZS5ub2Rlc1t0aGlzLl9yZXZlcnNlID8gbWF4SW5kZXggLSBpbmRleCA6IGluZGV4XTtcbiAgICAgICAgICAgIGlmIChzdWJOb2RlKSB7XG4gICAgICAgICAgICAgIGlmIChzdWJOb2RlLmVudHJ5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcEl0ZXJhdG9yVmFsdWUodHlwZSwgc3ViTm9kZS5lbnRyeSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc3RhY2sgPSB0aGlzLl9zdGFjayA9IG1hcEl0ZXJhdG9yRnJhbWUoc3ViTm9kZSwgc3RhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN0YWNrID0gdGhpcy5fc3RhY2sgPSB0aGlzLl9zdGFjay5fX3ByZXY7XG4gICAgICB9XG4gICAgICByZXR1cm4gaXRlcmF0b3JEb25lKCk7XG4gICAgfTtcblxuXG4gIGZ1bmN0aW9uIG1hcEl0ZXJhdG9yVmFsdWUodHlwZSwgZW50cnkpIHtcbiAgICByZXR1cm4gaXRlcmF0b3JWYWx1ZSh0eXBlLCBlbnRyeVswXSwgZW50cnlbMV0pO1xuICB9XG5cbiAgZnVuY3Rpb24gbWFwSXRlcmF0b3JGcmFtZShub2RlLCBwcmV2KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5vZGU6IG5vZGUsXG4gICAgICBpbmRleDogMCxcbiAgICAgIF9fcHJldjogcHJldlxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBtYWtlTWFwKHNpemUsIHJvb3QsIG93bmVySUQsIGhhc2gpIHtcbiAgICB2YXIgbWFwID0gT2JqZWN0LmNyZWF0ZShNYXBQcm90b3R5cGUpO1xuICAgIG1hcC5zaXplID0gc2l6ZTtcbiAgICBtYXAuX3Jvb3QgPSByb290O1xuICAgIG1hcC5fX293bmVySUQgPSBvd25lcklEO1xuICAgIG1hcC5fX2hhc2ggPSBoYXNoO1xuICAgIG1hcC5fX2FsdGVyZWQgPSBmYWxzZTtcbiAgICByZXR1cm4gbWFwO1xuICB9XG5cbiAgdmFyIEVNUFRZX01BUDtcbiAgZnVuY3Rpb24gZW1wdHlNYXAoKSB7XG4gICAgcmV0dXJuIEVNUFRZX01BUCB8fCAoRU1QVFlfTUFQID0gbWFrZU1hcCgwKSk7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVNYXAobWFwLCBrLCB2KSB7XG4gICAgdmFyIG5ld1Jvb3Q7XG4gICAgdmFyIG5ld1NpemU7XG4gICAgaWYgKCFtYXAuX3Jvb3QpIHtcbiAgICAgIGlmICh2ID09PSBOT1RfU0VUKSB7XG4gICAgICAgIHJldHVybiBtYXA7XG4gICAgICB9XG4gICAgICBuZXdTaXplID0gMTtcbiAgICAgIG5ld1Jvb3QgPSBuZXcgQXJyYXlNYXBOb2RlKG1hcC5fX293bmVySUQsIFtbaywgdl1dKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGRpZENoYW5nZVNpemUgPSBNYWtlUmVmKENIQU5HRV9MRU5HVEgpO1xuICAgICAgdmFyIGRpZEFsdGVyID0gTWFrZVJlZihESURfQUxURVIpO1xuICAgICAgbmV3Um9vdCA9IHVwZGF0ZU5vZGUobWFwLl9yb290LCBtYXAuX19vd25lcklELCAwLCB1bmRlZmluZWQsIGssIHYsIGRpZENoYW5nZVNpemUsIGRpZEFsdGVyKTtcbiAgICAgIGlmICghZGlkQWx0ZXIudmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG1hcDtcbiAgICAgIH1cbiAgICAgIG5ld1NpemUgPSBtYXAuc2l6ZSArIChkaWRDaGFuZ2VTaXplLnZhbHVlID8gdiA9PT0gTk9UX1NFVCA/IC0xIDogMSA6IDApO1xuICAgIH1cbiAgICBpZiAobWFwLl9fb3duZXJJRCkge1xuICAgICAgbWFwLnNpemUgPSBuZXdTaXplO1xuICAgICAgbWFwLl9yb290ID0gbmV3Um9vdDtcbiAgICAgIG1hcC5fX2hhc2ggPSB1bmRlZmluZWQ7XG4gICAgICBtYXAuX19hbHRlcmVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBtYXA7XG4gICAgfVxuICAgIHJldHVybiBuZXdSb290ID8gbWFrZU1hcChuZXdTaXplLCBuZXdSb290KSA6IGVtcHR5TWFwKCk7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVOb2RlKG5vZGUsIG93bmVySUQsIHNoaWZ0LCBrZXlIYXNoLCBrZXksIHZhbHVlLCBkaWRDaGFuZ2VTaXplLCBkaWRBbHRlcikge1xuICAgIGlmICghbm9kZSkge1xuICAgICAgaWYgKHZhbHVlID09PSBOT1RfU0VUKSB7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgICAgfVxuICAgICAgU2V0UmVmKGRpZEFsdGVyKTtcbiAgICAgIFNldFJlZihkaWRDaGFuZ2VTaXplKTtcbiAgICAgIHJldHVybiBuZXcgVmFsdWVOb2RlKG93bmVySUQsIGtleUhhc2gsIFtrZXksIHZhbHVlXSk7XG4gICAgfVxuICAgIHJldHVybiBub2RlLnVwZGF0ZShvd25lcklELCBzaGlmdCwga2V5SGFzaCwga2V5LCB2YWx1ZSwgZGlkQ2hhbmdlU2l6ZSwgZGlkQWx0ZXIpO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNMZWFmTm9kZShub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUuY29uc3RydWN0b3IgPT09IFZhbHVlTm9kZSB8fCBub2RlLmNvbnN0cnVjdG9yID09PSBIYXNoQ29sbGlzaW9uTm9kZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1lcmdlSW50b05vZGUobm9kZSwgb3duZXJJRCwgc2hpZnQsIGtleUhhc2gsIGVudHJ5KSB7XG4gICAgaWYgKG5vZGUua2V5SGFzaCA9PT0ga2V5SGFzaCkge1xuICAgICAgcmV0dXJuIG5ldyBIYXNoQ29sbGlzaW9uTm9kZShvd25lcklELCBrZXlIYXNoLCBbbm9kZS5lbnRyeSwgZW50cnldKTtcbiAgICB9XG5cbiAgICB2YXIgaWR4MSA9IChzaGlmdCA9PT0gMCA/IG5vZGUua2V5SGFzaCA6IG5vZGUua2V5SGFzaCA+Pj4gc2hpZnQpICYgTUFTSztcbiAgICB2YXIgaWR4MiA9IChzaGlmdCA9PT0gMCA/IGtleUhhc2ggOiBrZXlIYXNoID4+PiBzaGlmdCkgJiBNQVNLO1xuXG4gICAgdmFyIG5ld05vZGU7XG4gICAgdmFyIG5vZGVzID0gaWR4MSA9PT0gaWR4MiA/XG4gICAgICBbbWVyZ2VJbnRvTm9kZShub2RlLCBvd25lcklELCBzaGlmdCArIFNISUZULCBrZXlIYXNoLCBlbnRyeSldIDpcbiAgICAgICgobmV3Tm9kZSA9IG5ldyBWYWx1ZU5vZGUob3duZXJJRCwga2V5SGFzaCwgZW50cnkpKSwgaWR4MSA8IGlkeDIgPyBbbm9kZSwgbmV3Tm9kZV0gOiBbbmV3Tm9kZSwgbm9kZV0pO1xuXG4gICAgcmV0dXJuIG5ldyBCaXRtYXBJbmRleGVkTm9kZShvd25lcklELCAoMSA8PCBpZHgxKSB8ICgxIDw8IGlkeDIpLCBub2Rlcyk7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVOb2Rlcyhvd25lcklELCBlbnRyaWVzLCBrZXksIHZhbHVlKSB7XG4gICAgaWYgKCFvd25lcklEKSB7XG4gICAgICBvd25lcklEID0gbmV3IE93bmVySUQoKTtcbiAgICB9XG4gICAgdmFyIG5vZGUgPSBuZXcgVmFsdWVOb2RlKG93bmVySUQsIGhhc2goa2V5KSwgW2tleSwgdmFsdWVdKTtcbiAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgZW50cmllcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgIHZhciBlbnRyeSA9IGVudHJpZXNbaWldO1xuICAgICAgbm9kZSA9IG5vZGUudXBkYXRlKG93bmVySUQsIDAsIHVuZGVmaW5lZCwgZW50cnlbMF0sIGVudHJ5WzFdKTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cblxuICBmdW5jdGlvbiBwYWNrTm9kZXMob3duZXJJRCwgbm9kZXMsIGNvdW50LCBleGNsdWRpbmcpIHtcbiAgICB2YXIgYml0bWFwID0gMDtcbiAgICB2YXIgcGFja2VkSUkgPSAwO1xuICAgIHZhciBwYWNrZWROb2RlcyA9IG5ldyBBcnJheShjb3VudCk7XG4gICAgZm9yICh2YXIgaWkgPSAwLCBiaXQgPSAxLCBsZW4gPSBub2Rlcy5sZW5ndGg7IGlpIDwgbGVuOyBpaSsrLCBiaXQgPDw9IDEpIHtcbiAgICAgIHZhciBub2RlID0gbm9kZXNbaWldO1xuICAgICAgaWYgKG5vZGUgIT09IHVuZGVmaW5lZCAmJiBpaSAhPT0gZXhjbHVkaW5nKSB7XG4gICAgICAgIGJpdG1hcCB8PSBiaXQ7XG4gICAgICAgIHBhY2tlZE5vZGVzW3BhY2tlZElJKytdID0gbm9kZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5ldyBCaXRtYXBJbmRleGVkTm9kZShvd25lcklELCBiaXRtYXAsIHBhY2tlZE5vZGVzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGV4cGFuZE5vZGVzKG93bmVySUQsIG5vZGVzLCBiaXRtYXAsIGluY2x1ZGluZywgbm9kZSkge1xuICAgIHZhciBjb3VudCA9IDA7XG4gICAgdmFyIGV4cGFuZGVkTm9kZXMgPSBuZXcgQXJyYXkoU0laRSk7XG4gICAgZm9yICh2YXIgaWkgPSAwOyBiaXRtYXAgIT09IDA7IGlpKyssIGJpdG1hcCA+Pj49IDEpIHtcbiAgICAgIGV4cGFuZGVkTm9kZXNbaWldID0gYml0bWFwICYgMSA/IG5vZGVzW2NvdW50KytdIDogdW5kZWZpbmVkO1xuICAgIH1cbiAgICBleHBhbmRlZE5vZGVzW2luY2x1ZGluZ10gPSBub2RlO1xuICAgIHJldHVybiBuZXcgSGFzaEFycmF5TWFwTm9kZShvd25lcklELCBjb3VudCArIDEsIGV4cGFuZGVkTm9kZXMpO1xuICB9XG5cbiAgZnVuY3Rpb24gbWVyZ2VJbnRvTWFwV2l0aChtYXAsIG1lcmdlciwgaXRlcmFibGVzKSB7XG4gICAgdmFyIGl0ZXJzID0gW107XG4gICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IGl0ZXJhYmxlcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgIHZhciB2YWx1ZSA9IGl0ZXJhYmxlc1tpaV07XG4gICAgICB2YXIgaXRlciA9IEtleWVkSXRlcmFibGUodmFsdWUpO1xuICAgICAgaWYgKCFpc0l0ZXJhYmxlKHZhbHVlKSkge1xuICAgICAgICBpdGVyID0gaXRlci5tYXAoZnVuY3Rpb24odiApIHtyZXR1cm4gZnJvbUpTKHYpfSk7XG4gICAgICB9XG4gICAgICBpdGVycy5wdXNoKGl0ZXIpO1xuICAgIH1cbiAgICByZXR1cm4gbWVyZ2VJbnRvQ29sbGVjdGlvbldpdGgobWFwLCBtZXJnZXIsIGl0ZXJzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZXBNZXJnZXIoZXhpc3RpbmcsIHZhbHVlLCBrZXkpIHtcbiAgICByZXR1cm4gZXhpc3RpbmcgJiYgZXhpc3RpbmcubWVyZ2VEZWVwICYmIGlzSXRlcmFibGUodmFsdWUpID9cbiAgICAgIGV4aXN0aW5nLm1lcmdlRGVlcCh2YWx1ZSkgOlxuICAgICAgaXMoZXhpc3RpbmcsIHZhbHVlKSA/IGV4aXN0aW5nIDogdmFsdWU7XG4gIH1cblxuICBmdW5jdGlvbiBkZWVwTWVyZ2VyV2l0aChtZXJnZXIpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXhpc3RpbmcsIHZhbHVlLCBrZXkpICB7XG4gICAgICBpZiAoZXhpc3RpbmcgJiYgZXhpc3RpbmcubWVyZ2VEZWVwV2l0aCAmJiBpc0l0ZXJhYmxlKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gZXhpc3RpbmcubWVyZ2VEZWVwV2l0aChtZXJnZXIsIHZhbHVlKTtcbiAgICAgIH1cbiAgICAgIHZhciBuZXh0VmFsdWUgPSBtZXJnZXIoZXhpc3RpbmcsIHZhbHVlLCBrZXkpO1xuICAgICAgcmV0dXJuIGlzKGV4aXN0aW5nLCBuZXh0VmFsdWUpID8gZXhpc3RpbmcgOiBuZXh0VmFsdWU7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1lcmdlSW50b0NvbGxlY3Rpb25XaXRoKGNvbGxlY3Rpb24sIG1lcmdlciwgaXRlcnMpIHtcbiAgICBpdGVycyA9IGl0ZXJzLmZpbHRlcihmdW5jdGlvbih4ICkge3JldHVybiB4LnNpemUgIT09IDB9KTtcbiAgICBpZiAoaXRlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgICB9XG4gICAgaWYgKGNvbGxlY3Rpb24uc2l6ZSA9PT0gMCAmJiAhY29sbGVjdGlvbi5fX293bmVySUQgJiYgaXRlcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICByZXR1cm4gY29sbGVjdGlvbi5jb25zdHJ1Y3RvcihpdGVyc1swXSk7XG4gICAgfVxuICAgIHJldHVybiBjb2xsZWN0aW9uLndpdGhNdXRhdGlvbnMoZnVuY3Rpb24oY29sbGVjdGlvbiApIHtcbiAgICAgIHZhciBtZXJnZUludG9NYXAgPSBtZXJnZXIgP1xuICAgICAgICBmdW5jdGlvbih2YWx1ZSwga2V5KSAge1xuICAgICAgICAgIGNvbGxlY3Rpb24udXBkYXRlKGtleSwgTk9UX1NFVCwgZnVuY3Rpb24oZXhpc3RpbmcgKVxuICAgICAgICAgICAge3JldHVybiBleGlzdGluZyA9PT0gTk9UX1NFVCA/IHZhbHVlIDogbWVyZ2VyKGV4aXN0aW5nLCB2YWx1ZSwga2V5KX1cbiAgICAgICAgICApO1xuICAgICAgICB9IDpcbiAgICAgICAgZnVuY3Rpb24odmFsdWUsIGtleSkgIHtcbiAgICAgICAgICBjb2xsZWN0aW9uLnNldChrZXksIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IGl0ZXJzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICBpdGVyc1tpaV0uZm9yRWFjaChtZXJnZUludG9NYXApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlSW5EZWVwTWFwKGV4aXN0aW5nLCBrZXlQYXRoSXRlciwgbm90U2V0VmFsdWUsIHVwZGF0ZXIpIHtcbiAgICB2YXIgaXNOb3RTZXQgPSBleGlzdGluZyA9PT0gTk9UX1NFVDtcbiAgICB2YXIgc3RlcCA9IGtleVBhdGhJdGVyLm5leHQoKTtcbiAgICBpZiAoc3RlcC5kb25lKSB7XG4gICAgICB2YXIgZXhpc3RpbmdWYWx1ZSA9IGlzTm90U2V0ID8gbm90U2V0VmFsdWUgOiBleGlzdGluZztcbiAgICAgIHZhciBuZXdWYWx1ZSA9IHVwZGF0ZXIoZXhpc3RpbmdWYWx1ZSk7XG4gICAgICByZXR1cm4gbmV3VmFsdWUgPT09IGV4aXN0aW5nVmFsdWUgPyBleGlzdGluZyA6IG5ld1ZhbHVlO1xuICAgIH1cbiAgICBpbnZhcmlhbnQoXG4gICAgICBpc05vdFNldCB8fCAoZXhpc3RpbmcgJiYgZXhpc3Rpbmcuc2V0KSxcbiAgICAgICdpbnZhbGlkIGtleVBhdGgnXG4gICAgKTtcbiAgICB2YXIga2V5ID0gc3RlcC52YWx1ZTtcbiAgICB2YXIgbmV4dEV4aXN0aW5nID0gaXNOb3RTZXQgPyBOT1RfU0VUIDogZXhpc3RpbmcuZ2V0KGtleSwgTk9UX1NFVCk7XG4gICAgdmFyIG5leHRVcGRhdGVkID0gdXBkYXRlSW5EZWVwTWFwKFxuICAgICAgbmV4dEV4aXN0aW5nLFxuICAgICAga2V5UGF0aEl0ZXIsXG4gICAgICBub3RTZXRWYWx1ZSxcbiAgICAgIHVwZGF0ZXJcbiAgICApO1xuICAgIHJldHVybiBuZXh0VXBkYXRlZCA9PT0gbmV4dEV4aXN0aW5nID8gZXhpc3RpbmcgOlxuICAgICAgbmV4dFVwZGF0ZWQgPT09IE5PVF9TRVQgPyBleGlzdGluZy5yZW1vdmUoa2V5KSA6XG4gICAgICAoaXNOb3RTZXQgPyBlbXB0eU1hcCgpIDogZXhpc3RpbmcpLnNldChrZXksIG5leHRVcGRhdGVkKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBvcENvdW50KHgpIHtcbiAgICB4ID0geCAtICgoeCA+PiAxKSAmIDB4NTU1NTU1NTUpO1xuICAgIHggPSAoeCAmIDB4MzMzMzMzMzMpICsgKCh4ID4+IDIpICYgMHgzMzMzMzMzMyk7XG4gICAgeCA9ICh4ICsgKHggPj4gNCkpICYgMHgwZjBmMGYwZjtcbiAgICB4ID0geCArICh4ID4+IDgpO1xuICAgIHggPSB4ICsgKHggPj4gMTYpO1xuICAgIHJldHVybiB4ICYgMHg3ZjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldEluKGFycmF5LCBpZHgsIHZhbCwgY2FuRWRpdCkge1xuICAgIHZhciBuZXdBcnJheSA9IGNhbkVkaXQgPyBhcnJheSA6IGFyckNvcHkoYXJyYXkpO1xuICAgIG5ld0FycmF5W2lkeF0gPSB2YWw7XG4gICAgcmV0dXJuIG5ld0FycmF5O1xuICB9XG5cbiAgZnVuY3Rpb24gc3BsaWNlSW4oYXJyYXksIGlkeCwgdmFsLCBjYW5FZGl0KSB7XG4gICAgdmFyIG5ld0xlbiA9IGFycmF5Lmxlbmd0aCArIDE7XG4gICAgaWYgKGNhbkVkaXQgJiYgaWR4ICsgMSA9PT0gbmV3TGVuKSB7XG4gICAgICBhcnJheVtpZHhdID0gdmFsO1xuICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cbiAgICB2YXIgbmV3QXJyYXkgPSBuZXcgQXJyYXkobmV3TGVuKTtcbiAgICB2YXIgYWZ0ZXIgPSAwO1xuICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCBuZXdMZW47IGlpKyspIHtcbiAgICAgIGlmIChpaSA9PT0gaWR4KSB7XG4gICAgICAgIG5ld0FycmF5W2lpXSA9IHZhbDtcbiAgICAgICAgYWZ0ZXIgPSAtMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld0FycmF5W2lpXSA9IGFycmF5W2lpICsgYWZ0ZXJdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3QXJyYXk7XG4gIH1cblxuICBmdW5jdGlvbiBzcGxpY2VPdXQoYXJyYXksIGlkeCwgY2FuRWRpdCkge1xuICAgIHZhciBuZXdMZW4gPSBhcnJheS5sZW5ndGggLSAxO1xuICAgIGlmIChjYW5FZGl0ICYmIGlkeCA9PT0gbmV3TGVuKSB7XG4gICAgICBhcnJheS5wb3AoKTtcbiAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG4gICAgdmFyIG5ld0FycmF5ID0gbmV3IEFycmF5KG5ld0xlbik7XG4gICAgdmFyIGFmdGVyID0gMDtcbiAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgbmV3TGVuOyBpaSsrKSB7XG4gICAgICBpZiAoaWkgPT09IGlkeCkge1xuICAgICAgICBhZnRlciA9IDE7XG4gICAgICB9XG4gICAgICBuZXdBcnJheVtpaV0gPSBhcnJheVtpaSArIGFmdGVyXTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld0FycmF5O1xuICB9XG5cbiAgdmFyIE1BWF9BUlJBWV9NQVBfU0laRSA9IFNJWkUgLyA0O1xuICB2YXIgTUFYX0JJVE1BUF9JTkRFWEVEX1NJWkUgPSBTSVpFIC8gMjtcbiAgdmFyIE1JTl9IQVNIX0FSUkFZX01BUF9TSVpFID0gU0laRSAvIDQ7XG5cbiAgY3JlYXRlQ2xhc3MoTGlzdCwgSW5kZXhlZENvbGxlY3Rpb24pO1xuXG4gICAgLy8gQHByYWdtYSBDb25zdHJ1Y3Rpb25cblxuICAgIGZ1bmN0aW9uIExpc3QodmFsdWUpIHtcbiAgICAgIHZhciBlbXB0eSA9IGVtcHR5TGlzdCgpO1xuICAgICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGVtcHR5O1xuICAgICAgfVxuICAgICAgaWYgKGlzTGlzdCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuICAgICAgdmFyIGl0ZXIgPSBJbmRleGVkSXRlcmFibGUodmFsdWUpO1xuICAgICAgdmFyIHNpemUgPSBpdGVyLnNpemU7XG4gICAgICBpZiAoc2l6ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZW1wdHk7XG4gICAgICB9XG4gICAgICBhc3NlcnROb3RJbmZpbml0ZShzaXplKTtcbiAgICAgIGlmIChzaXplID4gMCAmJiBzaXplIDwgU0laRSkge1xuICAgICAgICByZXR1cm4gbWFrZUxpc3QoMCwgc2l6ZSwgU0hJRlQsIG51bGwsIG5ldyBWTm9kZShpdGVyLnRvQXJyYXkoKSkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVtcHR5LndpdGhNdXRhdGlvbnMoZnVuY3Rpb24obGlzdCApIHtcbiAgICAgICAgbGlzdC5zZXRTaXplKHNpemUpO1xuICAgICAgICBpdGVyLmZvckVhY2goZnVuY3Rpb24odiwgaSkgIHtyZXR1cm4gbGlzdC5zZXQoaSwgdil9KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIExpc3Qub2YgPSBmdW5jdGlvbigvKi4uLnZhbHVlcyovKSB7XG4gICAgICByZXR1cm4gdGhpcyhhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBMaXN0LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX190b1N0cmluZygnTGlzdCBbJywgJ10nKTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBBY2Nlc3NcblxuICAgIExpc3QucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGluZGV4LCBub3RTZXRWYWx1ZSkge1xuICAgICAgaW5kZXggPSB3cmFwSW5kZXgodGhpcywgaW5kZXgpO1xuICAgICAgaWYgKGluZGV4ID49IDAgJiYgaW5kZXggPCB0aGlzLnNpemUpIHtcbiAgICAgICAgaW5kZXggKz0gdGhpcy5fb3JpZ2luO1xuICAgICAgICB2YXIgbm9kZSA9IGxpc3ROb2RlRm9yKHRoaXMsIGluZGV4KTtcbiAgICAgICAgcmV0dXJuIG5vZGUgJiYgbm9kZS5hcnJheVtpbmRleCAmIE1BU0tdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5vdFNldFZhbHVlO1xuICAgIH07XG5cbiAgICAvLyBAcHJhZ21hIE1vZGlmaWNhdGlvblxuXG4gICAgTGlzdC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24oaW5kZXgsIHZhbHVlKSB7XG4gICAgICByZXR1cm4gdXBkYXRlTGlzdCh0aGlzLCBpbmRleCwgdmFsdWUpO1xuICAgIH07XG5cbiAgICBMaXN0LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihpbmRleCkge1xuICAgICAgcmV0dXJuICF0aGlzLmhhcyhpbmRleCkgPyB0aGlzIDpcbiAgICAgICAgaW5kZXggPT09IDAgPyB0aGlzLnNoaWZ0KCkgOlxuICAgICAgICBpbmRleCA9PT0gdGhpcy5zaXplIC0gMSA/IHRoaXMucG9wKCkgOlxuICAgICAgICB0aGlzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfTtcblxuICAgIExpc3QucHJvdG90eXBlLmluc2VydCA9IGZ1bmN0aW9uKGluZGV4LCB2YWx1ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuc3BsaWNlKGluZGV4LCAwLCB2YWx1ZSk7XG4gICAgfTtcblxuICAgIExpc3QucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5zaXplID09PSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX19vd25lcklEKSB7XG4gICAgICAgIHRoaXMuc2l6ZSA9IHRoaXMuX29yaWdpbiA9IHRoaXMuX2NhcGFjaXR5ID0gMDtcbiAgICAgICAgdGhpcy5fbGV2ZWwgPSBTSElGVDtcbiAgICAgICAgdGhpcy5fcm9vdCA9IHRoaXMuX3RhaWwgPSBudWxsO1xuICAgICAgICB0aGlzLl9faGFzaCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5fX2FsdGVyZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbXB0eUxpc3QoKTtcbiAgICB9O1xuXG4gICAgTGlzdC5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uKC8qLi4udmFsdWVzKi8pIHtcbiAgICAgIHZhciB2YWx1ZXMgPSBhcmd1bWVudHM7XG4gICAgICB2YXIgb2xkU2l6ZSA9IHRoaXMuc2l6ZTtcbiAgICAgIHJldHVybiB0aGlzLndpdGhNdXRhdGlvbnMoZnVuY3Rpb24obGlzdCApIHtcbiAgICAgICAgc2V0TGlzdEJvdW5kcyhsaXN0LCAwLCBvbGRTaXplICsgdmFsdWVzLmxlbmd0aCk7XG4gICAgICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCB2YWx1ZXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgbGlzdC5zZXQob2xkU2l6ZSArIGlpLCB2YWx1ZXNbaWldKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIExpc3QucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHNldExpc3RCb3VuZHModGhpcywgMCwgLTEpO1xuICAgIH07XG5cbiAgICBMaXN0LnByb3RvdHlwZS51bnNoaWZ0ID0gZnVuY3Rpb24oLyouLi52YWx1ZXMqLykge1xuICAgICAgdmFyIHZhbHVlcyA9IGFyZ3VtZW50cztcbiAgICAgIHJldHVybiB0aGlzLndpdGhNdXRhdGlvbnMoZnVuY3Rpb24obGlzdCApIHtcbiAgICAgICAgc2V0TGlzdEJvdW5kcyhsaXN0LCAtdmFsdWVzLmxlbmd0aCk7XG4gICAgICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCB2YWx1ZXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgbGlzdC5zZXQoaWksIHZhbHVlc1tpaV0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgTGlzdC5wcm90b3R5cGUuc2hpZnQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBzZXRMaXN0Qm91bmRzKHRoaXMsIDEpO1xuICAgIH07XG5cbiAgICAvLyBAcHJhZ21hIENvbXBvc2l0aW9uXG5cbiAgICBMaXN0LnByb3RvdHlwZS5tZXJnZSA9IGZ1bmN0aW9uKC8qLi4uaXRlcnMqLykge1xuICAgICAgcmV0dXJuIG1lcmdlSW50b0xpc3RXaXRoKHRoaXMsIHVuZGVmaW5lZCwgYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gICAgTGlzdC5wcm90b3R5cGUubWVyZ2VXaXRoID0gZnVuY3Rpb24obWVyZ2VyKSB7dmFyIGl0ZXJzID0gU0xJQ0UkMC5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICByZXR1cm4gbWVyZ2VJbnRvTGlzdFdpdGgodGhpcywgbWVyZ2VyLCBpdGVycyk7XG4gICAgfTtcblxuICAgIExpc3QucHJvdG90eXBlLm1lcmdlRGVlcCA9IGZ1bmN0aW9uKC8qLi4uaXRlcnMqLykge1xuICAgICAgcmV0dXJuIG1lcmdlSW50b0xpc3RXaXRoKHRoaXMsIGRlZXBNZXJnZXIsIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAgIExpc3QucHJvdG90eXBlLm1lcmdlRGVlcFdpdGggPSBmdW5jdGlvbihtZXJnZXIpIHt2YXIgaXRlcnMgPSBTTElDRSQwLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgIHJldHVybiBtZXJnZUludG9MaXN0V2l0aCh0aGlzLCBkZWVwTWVyZ2VyV2l0aChtZXJnZXIpLCBpdGVycyk7XG4gICAgfTtcblxuICAgIExpc3QucHJvdG90eXBlLnNldFNpemUgPSBmdW5jdGlvbihzaXplKSB7XG4gICAgICByZXR1cm4gc2V0TGlzdEJvdW5kcyh0aGlzLCAwLCBzaXplKTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBJdGVyYXRpb25cblxuICAgIExpc3QucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24oYmVnaW4sIGVuZCkge1xuICAgICAgdmFyIHNpemUgPSB0aGlzLnNpemU7XG4gICAgICBpZiAod2hvbGVTbGljZShiZWdpbiwgZW5kLCBzaXplKSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHJldHVybiBzZXRMaXN0Qm91bmRzKFxuICAgICAgICB0aGlzLFxuICAgICAgICByZXNvbHZlQmVnaW4oYmVnaW4sIHNpemUpLFxuICAgICAgICByZXNvbHZlRW5kKGVuZCwgc2l6ZSlcbiAgICAgICk7XG4gICAgfTtcblxuICAgIExpc3QucHJvdG90eXBlLl9faXRlcmF0b3IgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICB2YXIgaW5kZXggPSAwO1xuICAgICAgdmFyIHZhbHVlcyA9IGl0ZXJhdGVMaXN0KHRoaXMsIHJldmVyc2UpO1xuICAgICAgcmV0dXJuIG5ldyBJdGVyYXRvcihmdW5jdGlvbigpICB7XG4gICAgICAgIHZhciB2YWx1ZSA9IHZhbHVlcygpO1xuICAgICAgICByZXR1cm4gdmFsdWUgPT09IERPTkUgP1xuICAgICAgICAgIGl0ZXJhdG9yRG9uZSgpIDpcbiAgICAgICAgICBpdGVyYXRvclZhbHVlKHR5cGUsIGluZGV4KyssIHZhbHVlKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBMaXN0LnByb3RvdHlwZS5fX2l0ZXJhdGUgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge1xuICAgICAgdmFyIGluZGV4ID0gMDtcbiAgICAgIHZhciB2YWx1ZXMgPSBpdGVyYXRlTGlzdCh0aGlzLCByZXZlcnNlKTtcbiAgICAgIHZhciB2YWx1ZTtcbiAgICAgIHdoaWxlICgodmFsdWUgPSB2YWx1ZXMoKSkgIT09IERPTkUpIHtcbiAgICAgICAgaWYgKGZuKHZhbHVlLCBpbmRleCsrLCB0aGlzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH07XG5cbiAgICBMaXN0LnByb3RvdHlwZS5fX2Vuc3VyZU93bmVyID0gZnVuY3Rpb24ob3duZXJJRCkge1xuICAgICAgaWYgKG93bmVySUQgPT09IHRoaXMuX19vd25lcklEKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgaWYgKCFvd25lcklEKSB7XG4gICAgICAgIHRoaXMuX19vd25lcklEID0gb3duZXJJRDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gbWFrZUxpc3QodGhpcy5fb3JpZ2luLCB0aGlzLl9jYXBhY2l0eSwgdGhpcy5fbGV2ZWwsIHRoaXMuX3Jvb3QsIHRoaXMuX3RhaWwsIG93bmVySUQsIHRoaXMuX19oYXNoKTtcbiAgICB9O1xuXG5cbiAgZnVuY3Rpb24gaXNMaXN0KG1heWJlTGlzdCkge1xuICAgIHJldHVybiAhIShtYXliZUxpc3QgJiYgbWF5YmVMaXN0W0lTX0xJU1RfU0VOVElORUxdKTtcbiAgfVxuXG4gIExpc3QuaXNMaXN0ID0gaXNMaXN0O1xuXG4gIHZhciBJU19MSVNUX1NFTlRJTkVMID0gJ0BAX19JTU1VVEFCTEVfTElTVF9fQEAnO1xuXG4gIHZhciBMaXN0UHJvdG90eXBlID0gTGlzdC5wcm90b3R5cGU7XG4gIExpc3RQcm90b3R5cGVbSVNfTElTVF9TRU5USU5FTF0gPSB0cnVlO1xuICBMaXN0UHJvdG90eXBlW0RFTEVURV0gPSBMaXN0UHJvdG90eXBlLnJlbW92ZTtcbiAgTGlzdFByb3RvdHlwZS5zZXRJbiA9IE1hcFByb3RvdHlwZS5zZXRJbjtcbiAgTGlzdFByb3RvdHlwZS5kZWxldGVJbiA9XG4gIExpc3RQcm90b3R5cGUucmVtb3ZlSW4gPSBNYXBQcm90b3R5cGUucmVtb3ZlSW47XG4gIExpc3RQcm90b3R5cGUudXBkYXRlID0gTWFwUHJvdG90eXBlLnVwZGF0ZTtcbiAgTGlzdFByb3RvdHlwZS51cGRhdGVJbiA9IE1hcFByb3RvdHlwZS51cGRhdGVJbjtcbiAgTGlzdFByb3RvdHlwZS5tZXJnZUluID0gTWFwUHJvdG90eXBlLm1lcmdlSW47XG4gIExpc3RQcm90b3R5cGUubWVyZ2VEZWVwSW4gPSBNYXBQcm90b3R5cGUubWVyZ2VEZWVwSW47XG4gIExpc3RQcm90b3R5cGUud2l0aE11dGF0aW9ucyA9IE1hcFByb3RvdHlwZS53aXRoTXV0YXRpb25zO1xuICBMaXN0UHJvdG90eXBlLmFzTXV0YWJsZSA9IE1hcFByb3RvdHlwZS5hc011dGFibGU7XG4gIExpc3RQcm90b3R5cGUuYXNJbW11dGFibGUgPSBNYXBQcm90b3R5cGUuYXNJbW11dGFibGU7XG4gIExpc3RQcm90b3R5cGUud2FzQWx0ZXJlZCA9IE1hcFByb3RvdHlwZS53YXNBbHRlcmVkO1xuXG5cblxuICAgIGZ1bmN0aW9uIFZOb2RlKGFycmF5LCBvd25lcklEKSB7XG4gICAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG4gICAgICB0aGlzLm93bmVySUQgPSBvd25lcklEO1xuICAgIH1cblxuICAgIC8vIFRPRE86IHNlZW1zIGxpa2UgdGhlc2UgbWV0aG9kcyBhcmUgdmVyeSBzaW1pbGFyXG5cbiAgICBWTm9kZS5wcm90b3R5cGUucmVtb3ZlQmVmb3JlID0gZnVuY3Rpb24ob3duZXJJRCwgbGV2ZWwsIGluZGV4KSB7XG4gICAgICBpZiAoaW5kZXggPT09IGxldmVsID8gMSA8PCBsZXZlbCA6IDAgfHwgdGhpcy5hcnJheS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICB2YXIgb3JpZ2luSW5kZXggPSAoaW5kZXggPj4+IGxldmVsKSAmIE1BU0s7XG4gICAgICBpZiAob3JpZ2luSW5kZXggPj0gdGhpcy5hcnJheS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWTm9kZShbXSwgb3duZXJJRCk7XG4gICAgICB9XG4gICAgICB2YXIgcmVtb3ZpbmdGaXJzdCA9IG9yaWdpbkluZGV4ID09PSAwO1xuICAgICAgdmFyIG5ld0NoaWxkO1xuICAgICAgaWYgKGxldmVsID4gMCkge1xuICAgICAgICB2YXIgb2xkQ2hpbGQgPSB0aGlzLmFycmF5W29yaWdpbkluZGV4XTtcbiAgICAgICAgbmV3Q2hpbGQgPSBvbGRDaGlsZCAmJiBvbGRDaGlsZC5yZW1vdmVCZWZvcmUob3duZXJJRCwgbGV2ZWwgLSBTSElGVCwgaW5kZXgpO1xuICAgICAgICBpZiAobmV3Q2hpbGQgPT09IG9sZENoaWxkICYmIHJlbW92aW5nRmlyc3QpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHJlbW92aW5nRmlyc3QgJiYgIW5ld0NoaWxkKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgdmFyIGVkaXRhYmxlID0gZWRpdGFibGVWTm9kZSh0aGlzLCBvd25lcklEKTtcbiAgICAgIGlmICghcmVtb3ZpbmdGaXJzdCkge1xuICAgICAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgb3JpZ2luSW5kZXg7IGlpKyspIHtcbiAgICAgICAgICBlZGl0YWJsZS5hcnJheVtpaV0gPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChuZXdDaGlsZCkge1xuICAgICAgICBlZGl0YWJsZS5hcnJheVtvcmlnaW5JbmRleF0gPSBuZXdDaGlsZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlZGl0YWJsZTtcbiAgICB9O1xuXG4gICAgVk5vZGUucHJvdG90eXBlLnJlbW92ZUFmdGVyID0gZnVuY3Rpb24ob3duZXJJRCwgbGV2ZWwsIGluZGV4KSB7XG4gICAgICBpZiAoaW5kZXggPT09IChsZXZlbCA/IDEgPDwgbGV2ZWwgOiAwKSB8fCB0aGlzLmFycmF5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHZhciBzaXplSW5kZXggPSAoKGluZGV4IC0gMSkgPj4+IGxldmVsKSAmIE1BU0s7XG4gICAgICBpZiAoc2l6ZUluZGV4ID49IHRoaXMuYXJyYXkubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICB2YXIgbmV3Q2hpbGQ7XG4gICAgICBpZiAobGV2ZWwgPiAwKSB7XG4gICAgICAgIHZhciBvbGRDaGlsZCA9IHRoaXMuYXJyYXlbc2l6ZUluZGV4XTtcbiAgICAgICAgbmV3Q2hpbGQgPSBvbGRDaGlsZCAmJiBvbGRDaGlsZC5yZW1vdmVBZnRlcihvd25lcklELCBsZXZlbCAtIFNISUZULCBpbmRleCk7XG4gICAgICAgIGlmIChuZXdDaGlsZCA9PT0gb2xkQ2hpbGQgJiYgc2l6ZUluZGV4ID09PSB0aGlzLmFycmF5Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgZWRpdGFibGUgPSBlZGl0YWJsZVZOb2RlKHRoaXMsIG93bmVySUQpO1xuICAgICAgZWRpdGFibGUuYXJyYXkuc3BsaWNlKHNpemVJbmRleCArIDEpO1xuICAgICAgaWYgKG5ld0NoaWxkKSB7XG4gICAgICAgIGVkaXRhYmxlLmFycmF5W3NpemVJbmRleF0gPSBuZXdDaGlsZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlZGl0YWJsZTtcbiAgICB9O1xuXG5cblxuICB2YXIgRE9ORSA9IHt9O1xuXG4gIGZ1bmN0aW9uIGl0ZXJhdGVMaXN0KGxpc3QsIHJldmVyc2UpIHtcbiAgICB2YXIgbGVmdCA9IGxpc3QuX29yaWdpbjtcbiAgICB2YXIgcmlnaHQgPSBsaXN0Ll9jYXBhY2l0eTtcbiAgICB2YXIgdGFpbFBvcyA9IGdldFRhaWxPZmZzZXQocmlnaHQpO1xuICAgIHZhciB0YWlsID0gbGlzdC5fdGFpbDtcblxuICAgIHJldHVybiBpdGVyYXRlTm9kZU9yTGVhZihsaXN0Ll9yb290LCBsaXN0Ll9sZXZlbCwgMCk7XG5cbiAgICBmdW5jdGlvbiBpdGVyYXRlTm9kZU9yTGVhZihub2RlLCBsZXZlbCwgb2Zmc2V0KSB7XG4gICAgICByZXR1cm4gbGV2ZWwgPT09IDAgP1xuICAgICAgICBpdGVyYXRlTGVhZihub2RlLCBvZmZzZXQpIDpcbiAgICAgICAgaXRlcmF0ZU5vZGUobm9kZSwgbGV2ZWwsIG9mZnNldCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXRlcmF0ZUxlYWYobm9kZSwgb2Zmc2V0KSB7XG4gICAgICB2YXIgYXJyYXkgPSBvZmZzZXQgPT09IHRhaWxQb3MgPyB0YWlsICYmIHRhaWwuYXJyYXkgOiBub2RlICYmIG5vZGUuYXJyYXk7XG4gICAgICB2YXIgZnJvbSA9IG9mZnNldCA+IGxlZnQgPyAwIDogbGVmdCAtIG9mZnNldDtcbiAgICAgIHZhciB0byA9IHJpZ2h0IC0gb2Zmc2V0O1xuICAgICAgaWYgKHRvID4gU0laRSkge1xuICAgICAgICB0byA9IFNJWkU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSAge1xuICAgICAgICBpZiAoZnJvbSA9PT0gdG8pIHtcbiAgICAgICAgICByZXR1cm4gRE9ORTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaWR4ID0gcmV2ZXJzZSA/IC0tdG8gOiBmcm9tKys7XG4gICAgICAgIHJldHVybiBhcnJheSAmJiBhcnJheVtpZHhdO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpdGVyYXRlTm9kZShub2RlLCBsZXZlbCwgb2Zmc2V0KSB7XG4gICAgICB2YXIgdmFsdWVzO1xuICAgICAgdmFyIGFycmF5ID0gbm9kZSAmJiBub2RlLmFycmF5O1xuICAgICAgdmFyIGZyb20gPSBvZmZzZXQgPiBsZWZ0ID8gMCA6IChsZWZ0IC0gb2Zmc2V0KSA+PiBsZXZlbDtcbiAgICAgIHZhciB0byA9ICgocmlnaHQgLSBvZmZzZXQpID4+IGxldmVsKSArIDE7XG4gICAgICBpZiAodG8gPiBTSVpFKSB7XG4gICAgICAgIHRvID0gU0laRTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmdW5jdGlvbigpICB7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICBpZiAodmFsdWVzKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB2YWx1ZXMoKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gRE9ORSkge1xuICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWx1ZXMgPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZnJvbSA9PT0gdG8pIHtcbiAgICAgICAgICAgIHJldHVybiBET05FO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgaWR4ID0gcmV2ZXJzZSA/IC0tdG8gOiBmcm9tKys7XG4gICAgICAgICAgdmFsdWVzID0gaXRlcmF0ZU5vZGVPckxlYWYoXG4gICAgICAgICAgICBhcnJheSAmJiBhcnJheVtpZHhdLCBsZXZlbCAtIFNISUZULCBvZmZzZXQgKyAoaWR4IDw8IGxldmVsKVxuICAgICAgICAgICk7XG4gICAgICAgIH0gd2hpbGUgKHRydWUpO1xuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBtYWtlTGlzdChvcmlnaW4sIGNhcGFjaXR5LCBsZXZlbCwgcm9vdCwgdGFpbCwgb3duZXJJRCwgaGFzaCkge1xuICAgIHZhciBsaXN0ID0gT2JqZWN0LmNyZWF0ZShMaXN0UHJvdG90eXBlKTtcbiAgICBsaXN0LnNpemUgPSBjYXBhY2l0eSAtIG9yaWdpbjtcbiAgICBsaXN0Ll9vcmlnaW4gPSBvcmlnaW47XG4gICAgbGlzdC5fY2FwYWNpdHkgPSBjYXBhY2l0eTtcbiAgICBsaXN0Ll9sZXZlbCA9IGxldmVsO1xuICAgIGxpc3QuX3Jvb3QgPSByb290O1xuICAgIGxpc3QuX3RhaWwgPSB0YWlsO1xuICAgIGxpc3QuX19vd25lcklEID0gb3duZXJJRDtcbiAgICBsaXN0Ll9faGFzaCA9IGhhc2g7XG4gICAgbGlzdC5fX2FsdGVyZWQgPSBmYWxzZTtcbiAgICByZXR1cm4gbGlzdDtcbiAgfVxuXG4gIHZhciBFTVBUWV9MSVNUO1xuICBmdW5jdGlvbiBlbXB0eUxpc3QoKSB7XG4gICAgcmV0dXJuIEVNUFRZX0xJU1QgfHwgKEVNUFRZX0xJU1QgPSBtYWtlTGlzdCgwLCAwLCBTSElGVCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlTGlzdChsaXN0LCBpbmRleCwgdmFsdWUpIHtcbiAgICBpbmRleCA9IHdyYXBJbmRleChsaXN0LCBpbmRleCk7XG5cbiAgICBpZiAoaW5kZXggIT09IGluZGV4KSB7XG4gICAgICByZXR1cm4gbGlzdDtcbiAgICB9XG5cbiAgICBpZiAoaW5kZXggPj0gbGlzdC5zaXplIHx8IGluZGV4IDwgMCkge1xuICAgICAgcmV0dXJuIGxpc3Qud2l0aE11dGF0aW9ucyhmdW5jdGlvbihsaXN0ICkge1xuICAgICAgICBpbmRleCA8IDAgP1xuICAgICAgICAgIHNldExpc3RCb3VuZHMobGlzdCwgaW5kZXgpLnNldCgwLCB2YWx1ZSkgOlxuICAgICAgICAgIHNldExpc3RCb3VuZHMobGlzdCwgMCwgaW5kZXggKyAxKS5zZXQoaW5kZXgsIHZhbHVlKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaW5kZXggKz0gbGlzdC5fb3JpZ2luO1xuXG4gICAgdmFyIG5ld1RhaWwgPSBsaXN0Ll90YWlsO1xuICAgIHZhciBuZXdSb290ID0gbGlzdC5fcm9vdDtcbiAgICB2YXIgZGlkQWx0ZXIgPSBNYWtlUmVmKERJRF9BTFRFUik7XG4gICAgaWYgKGluZGV4ID49IGdldFRhaWxPZmZzZXQobGlzdC5fY2FwYWNpdHkpKSB7XG4gICAgICBuZXdUYWlsID0gdXBkYXRlVk5vZGUobmV3VGFpbCwgbGlzdC5fX293bmVySUQsIDAsIGluZGV4LCB2YWx1ZSwgZGlkQWx0ZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdSb290ID0gdXBkYXRlVk5vZGUobmV3Um9vdCwgbGlzdC5fX293bmVySUQsIGxpc3QuX2xldmVsLCBpbmRleCwgdmFsdWUsIGRpZEFsdGVyKTtcbiAgICB9XG5cbiAgICBpZiAoIWRpZEFsdGVyLnZhbHVlKSB7XG4gICAgICByZXR1cm4gbGlzdDtcbiAgICB9XG5cbiAgICBpZiAobGlzdC5fX293bmVySUQpIHtcbiAgICAgIGxpc3QuX3Jvb3QgPSBuZXdSb290O1xuICAgICAgbGlzdC5fdGFpbCA9IG5ld1RhaWw7XG4gICAgICBsaXN0Ll9faGFzaCA9IHVuZGVmaW5lZDtcbiAgICAgIGxpc3QuX19hbHRlcmVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBsaXN0O1xuICAgIH1cbiAgICByZXR1cm4gbWFrZUxpc3QobGlzdC5fb3JpZ2luLCBsaXN0Ll9jYXBhY2l0eSwgbGlzdC5fbGV2ZWwsIG5ld1Jvb3QsIG5ld1RhaWwpO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlVk5vZGUobm9kZSwgb3duZXJJRCwgbGV2ZWwsIGluZGV4LCB2YWx1ZSwgZGlkQWx0ZXIpIHtcbiAgICB2YXIgaWR4ID0gKGluZGV4ID4+PiBsZXZlbCkgJiBNQVNLO1xuICAgIHZhciBub2RlSGFzID0gbm9kZSAmJiBpZHggPCBub2RlLmFycmF5Lmxlbmd0aDtcbiAgICBpZiAoIW5vZGVIYXMgJiYgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgdmFyIG5ld05vZGU7XG5cbiAgICBpZiAobGV2ZWwgPiAwKSB7XG4gICAgICB2YXIgbG93ZXJOb2RlID0gbm9kZSAmJiBub2RlLmFycmF5W2lkeF07XG4gICAgICB2YXIgbmV3TG93ZXJOb2RlID0gdXBkYXRlVk5vZGUobG93ZXJOb2RlLCBvd25lcklELCBsZXZlbCAtIFNISUZULCBpbmRleCwgdmFsdWUsIGRpZEFsdGVyKTtcbiAgICAgIGlmIChuZXdMb3dlck5vZGUgPT09IGxvd2VyTm9kZSkge1xuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgIH1cbiAgICAgIG5ld05vZGUgPSBlZGl0YWJsZVZOb2RlKG5vZGUsIG93bmVySUQpO1xuICAgICAgbmV3Tm9kZS5hcnJheVtpZHhdID0gbmV3TG93ZXJOb2RlO1xuICAgICAgcmV0dXJuIG5ld05vZGU7XG4gICAgfVxuXG4gICAgaWYgKG5vZGVIYXMgJiYgbm9kZS5hcnJheVtpZHhdID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgU2V0UmVmKGRpZEFsdGVyKTtcblxuICAgIG5ld05vZGUgPSBlZGl0YWJsZVZOb2RlKG5vZGUsIG93bmVySUQpO1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkICYmIGlkeCA9PT0gbmV3Tm9kZS5hcnJheS5sZW5ndGggLSAxKSB7XG4gICAgICBuZXdOb2RlLmFycmF5LnBvcCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdOb2RlLmFycmF5W2lkeF0gPSB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld05vZGU7XG4gIH1cblxuICBmdW5jdGlvbiBlZGl0YWJsZVZOb2RlKG5vZGUsIG93bmVySUQpIHtcbiAgICBpZiAob3duZXJJRCAmJiBub2RlICYmIG93bmVySUQgPT09IG5vZGUub3duZXJJRCkge1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuICAgIHJldHVybiBuZXcgVk5vZGUobm9kZSA/IG5vZGUuYXJyYXkuc2xpY2UoKSA6IFtdLCBvd25lcklEKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxpc3ROb2RlRm9yKGxpc3QsIHJhd0luZGV4KSB7XG4gICAgaWYgKHJhd0luZGV4ID49IGdldFRhaWxPZmZzZXQobGlzdC5fY2FwYWNpdHkpKSB7XG4gICAgICByZXR1cm4gbGlzdC5fdGFpbDtcbiAgICB9XG4gICAgaWYgKHJhd0luZGV4IDwgMSA8PCAobGlzdC5fbGV2ZWwgKyBTSElGVCkpIHtcbiAgICAgIHZhciBub2RlID0gbGlzdC5fcm9vdDtcbiAgICAgIHZhciBsZXZlbCA9IGxpc3QuX2xldmVsO1xuICAgICAgd2hpbGUgKG5vZGUgJiYgbGV2ZWwgPiAwKSB7XG4gICAgICAgIG5vZGUgPSBub2RlLmFycmF5WyhyYXdJbmRleCA+Pj4gbGV2ZWwpICYgTUFTS107XG4gICAgICAgIGxldmVsIC09IFNISUZUO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0TGlzdEJvdW5kcyhsaXN0LCBiZWdpbiwgZW5kKSB7XG4gICAgLy8gU2FuaXRpemUgYmVnaW4gJiBlbmQgdXNpbmcgdGhpcyBzaG9ydGhhbmQgZm9yIFRvSW50MzIoYXJndW1lbnQpXG4gICAgLy8gaHR0cDovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLXRvaW50MzJcbiAgICBpZiAoYmVnaW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgYmVnaW4gPSBiZWdpbiB8IDA7XG4gICAgfVxuICAgIGlmIChlbmQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgZW5kID0gZW5kIHwgMDtcbiAgICB9XG4gICAgdmFyIG93bmVyID0gbGlzdC5fX293bmVySUQgfHwgbmV3IE93bmVySUQoKTtcbiAgICB2YXIgb2xkT3JpZ2luID0gbGlzdC5fb3JpZ2luO1xuICAgIHZhciBvbGRDYXBhY2l0eSA9IGxpc3QuX2NhcGFjaXR5O1xuICAgIHZhciBuZXdPcmlnaW4gPSBvbGRPcmlnaW4gKyBiZWdpbjtcbiAgICB2YXIgbmV3Q2FwYWNpdHkgPSBlbmQgPT09IHVuZGVmaW5lZCA/IG9sZENhcGFjaXR5IDogZW5kIDwgMCA/IG9sZENhcGFjaXR5ICsgZW5kIDogb2xkT3JpZ2luICsgZW5kO1xuICAgIGlmIChuZXdPcmlnaW4gPT09IG9sZE9yaWdpbiAmJiBuZXdDYXBhY2l0eSA9PT0gb2xkQ2FwYWNpdHkpIHtcbiAgICAgIHJldHVybiBsaXN0O1xuICAgIH1cblxuICAgIC8vIElmIGl0J3MgZ29pbmcgdG8gZW5kIGFmdGVyIGl0IHN0YXJ0cywgaXQncyBlbXB0eS5cbiAgICBpZiAobmV3T3JpZ2luID49IG5ld0NhcGFjaXR5KSB7XG4gICAgICByZXR1cm4gbGlzdC5jbGVhcigpO1xuICAgIH1cblxuICAgIHZhciBuZXdMZXZlbCA9IGxpc3QuX2xldmVsO1xuICAgIHZhciBuZXdSb290ID0gbGlzdC5fcm9vdDtcblxuICAgIC8vIE5ldyBvcmlnaW4gbWlnaHQgbmVlZCBjcmVhdGluZyBhIGhpZ2hlciByb290LlxuICAgIHZhciBvZmZzZXRTaGlmdCA9IDA7XG4gICAgd2hpbGUgKG5ld09yaWdpbiArIG9mZnNldFNoaWZ0IDwgMCkge1xuICAgICAgbmV3Um9vdCA9IG5ldyBWTm9kZShuZXdSb290ICYmIG5ld1Jvb3QuYXJyYXkubGVuZ3RoID8gW3VuZGVmaW5lZCwgbmV3Um9vdF0gOiBbXSwgb3duZXIpO1xuICAgICAgbmV3TGV2ZWwgKz0gU0hJRlQ7XG4gICAgICBvZmZzZXRTaGlmdCArPSAxIDw8IG5ld0xldmVsO1xuICAgIH1cbiAgICBpZiAob2Zmc2V0U2hpZnQpIHtcbiAgICAgIG5ld09yaWdpbiArPSBvZmZzZXRTaGlmdDtcbiAgICAgIG9sZE9yaWdpbiArPSBvZmZzZXRTaGlmdDtcbiAgICAgIG5ld0NhcGFjaXR5ICs9IG9mZnNldFNoaWZ0O1xuICAgICAgb2xkQ2FwYWNpdHkgKz0gb2Zmc2V0U2hpZnQ7XG4gICAgfVxuXG4gICAgdmFyIG9sZFRhaWxPZmZzZXQgPSBnZXRUYWlsT2Zmc2V0KG9sZENhcGFjaXR5KTtcbiAgICB2YXIgbmV3VGFpbE9mZnNldCA9IGdldFRhaWxPZmZzZXQobmV3Q2FwYWNpdHkpO1xuXG4gICAgLy8gTmV3IHNpemUgbWlnaHQgbmVlZCBjcmVhdGluZyBhIGhpZ2hlciByb290LlxuICAgIHdoaWxlIChuZXdUYWlsT2Zmc2V0ID49IDEgPDwgKG5ld0xldmVsICsgU0hJRlQpKSB7XG4gICAgICBuZXdSb290ID0gbmV3IFZOb2RlKG5ld1Jvb3QgJiYgbmV3Um9vdC5hcnJheS5sZW5ndGggPyBbbmV3Um9vdF0gOiBbXSwgb3duZXIpO1xuICAgICAgbmV3TGV2ZWwgKz0gU0hJRlQ7XG4gICAgfVxuXG4gICAgLy8gTG9jYXRlIG9yIGNyZWF0ZSB0aGUgbmV3IHRhaWwuXG4gICAgdmFyIG9sZFRhaWwgPSBsaXN0Ll90YWlsO1xuICAgIHZhciBuZXdUYWlsID0gbmV3VGFpbE9mZnNldCA8IG9sZFRhaWxPZmZzZXQgP1xuICAgICAgbGlzdE5vZGVGb3IobGlzdCwgbmV3Q2FwYWNpdHkgLSAxKSA6XG4gICAgICBuZXdUYWlsT2Zmc2V0ID4gb2xkVGFpbE9mZnNldCA/IG5ldyBWTm9kZShbXSwgb3duZXIpIDogb2xkVGFpbDtcblxuICAgIC8vIE1lcmdlIFRhaWwgaW50byB0cmVlLlxuICAgIGlmIChvbGRUYWlsICYmIG5ld1RhaWxPZmZzZXQgPiBvbGRUYWlsT2Zmc2V0ICYmIG5ld09yaWdpbiA8IG9sZENhcGFjaXR5ICYmIG9sZFRhaWwuYXJyYXkubGVuZ3RoKSB7XG4gICAgICBuZXdSb290ID0gZWRpdGFibGVWTm9kZShuZXdSb290LCBvd25lcik7XG4gICAgICB2YXIgbm9kZSA9IG5ld1Jvb3Q7XG4gICAgICBmb3IgKHZhciBsZXZlbCA9IG5ld0xldmVsOyBsZXZlbCA+IFNISUZUOyBsZXZlbCAtPSBTSElGVCkge1xuICAgICAgICB2YXIgaWR4ID0gKG9sZFRhaWxPZmZzZXQgPj4+IGxldmVsKSAmIE1BU0s7XG4gICAgICAgIG5vZGUgPSBub2RlLmFycmF5W2lkeF0gPSBlZGl0YWJsZVZOb2RlKG5vZGUuYXJyYXlbaWR4XSwgb3duZXIpO1xuICAgICAgfVxuICAgICAgbm9kZS5hcnJheVsob2xkVGFpbE9mZnNldCA+Pj4gU0hJRlQpICYgTUFTS10gPSBvbGRUYWlsO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBzaXplIGhhcyBiZWVuIHJlZHVjZWQsIHRoZXJlJ3MgYSBjaGFuY2UgdGhlIHRhaWwgbmVlZHMgdG8gYmUgdHJpbW1lZC5cbiAgICBpZiAobmV3Q2FwYWNpdHkgPCBvbGRDYXBhY2l0eSkge1xuICAgICAgbmV3VGFpbCA9IG5ld1RhaWwgJiYgbmV3VGFpbC5yZW1vdmVBZnRlcihvd25lciwgMCwgbmV3Q2FwYWNpdHkpO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBuZXcgb3JpZ2luIGlzIHdpdGhpbiB0aGUgdGFpbCwgdGhlbiB3ZSBkbyBub3QgbmVlZCBhIHJvb3QuXG4gICAgaWYgKG5ld09yaWdpbiA+PSBuZXdUYWlsT2Zmc2V0KSB7XG4gICAgICBuZXdPcmlnaW4gLT0gbmV3VGFpbE9mZnNldDtcbiAgICAgIG5ld0NhcGFjaXR5IC09IG5ld1RhaWxPZmZzZXQ7XG4gICAgICBuZXdMZXZlbCA9IFNISUZUO1xuICAgICAgbmV3Um9vdCA9IG51bGw7XG4gICAgICBuZXdUYWlsID0gbmV3VGFpbCAmJiBuZXdUYWlsLnJlbW92ZUJlZm9yZShvd25lciwgMCwgbmV3T3JpZ2luKTtcblxuICAgIC8vIE90aGVyd2lzZSwgaWYgdGhlIHJvb3QgaGFzIGJlZW4gdHJpbW1lZCwgZ2FyYmFnZSBjb2xsZWN0LlxuICAgIH0gZWxzZSBpZiAobmV3T3JpZ2luID4gb2xkT3JpZ2luIHx8IG5ld1RhaWxPZmZzZXQgPCBvbGRUYWlsT2Zmc2V0KSB7XG4gICAgICBvZmZzZXRTaGlmdCA9IDA7XG5cbiAgICAgIC8vIElkZW50aWZ5IHRoZSBuZXcgdG9wIHJvb3Qgbm9kZSBvZiB0aGUgc3VidHJlZSBvZiB0aGUgb2xkIHJvb3QuXG4gICAgICB3aGlsZSAobmV3Um9vdCkge1xuICAgICAgICB2YXIgYmVnaW5JbmRleCA9IChuZXdPcmlnaW4gPj4+IG5ld0xldmVsKSAmIE1BU0s7XG4gICAgICAgIGlmIChiZWdpbkluZGV4ICE9PSAobmV3VGFpbE9mZnNldCA+Pj4gbmV3TGV2ZWwpICYgTUFTSykge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChiZWdpbkluZGV4KSB7XG4gICAgICAgICAgb2Zmc2V0U2hpZnQgKz0gKDEgPDwgbmV3TGV2ZWwpICogYmVnaW5JbmRleDtcbiAgICAgICAgfVxuICAgICAgICBuZXdMZXZlbCAtPSBTSElGVDtcbiAgICAgICAgbmV3Um9vdCA9IG5ld1Jvb3QuYXJyYXlbYmVnaW5JbmRleF07XG4gICAgICB9XG5cbiAgICAgIC8vIFRyaW0gdGhlIG5ldyBzaWRlcyBvZiB0aGUgbmV3IHJvb3QuXG4gICAgICBpZiAobmV3Um9vdCAmJiBuZXdPcmlnaW4gPiBvbGRPcmlnaW4pIHtcbiAgICAgICAgbmV3Um9vdCA9IG5ld1Jvb3QucmVtb3ZlQmVmb3JlKG93bmVyLCBuZXdMZXZlbCwgbmV3T3JpZ2luIC0gb2Zmc2V0U2hpZnQpO1xuICAgICAgfVxuICAgICAgaWYgKG5ld1Jvb3QgJiYgbmV3VGFpbE9mZnNldCA8IG9sZFRhaWxPZmZzZXQpIHtcbiAgICAgICAgbmV3Um9vdCA9IG5ld1Jvb3QucmVtb3ZlQWZ0ZXIob3duZXIsIG5ld0xldmVsLCBuZXdUYWlsT2Zmc2V0IC0gb2Zmc2V0U2hpZnQpO1xuICAgICAgfVxuICAgICAgaWYgKG9mZnNldFNoaWZ0KSB7XG4gICAgICAgIG5ld09yaWdpbiAtPSBvZmZzZXRTaGlmdDtcbiAgICAgICAgbmV3Q2FwYWNpdHkgLT0gb2Zmc2V0U2hpZnQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGxpc3QuX19vd25lcklEKSB7XG4gICAgICBsaXN0LnNpemUgPSBuZXdDYXBhY2l0eSAtIG5ld09yaWdpbjtcbiAgICAgIGxpc3QuX29yaWdpbiA9IG5ld09yaWdpbjtcbiAgICAgIGxpc3QuX2NhcGFjaXR5ID0gbmV3Q2FwYWNpdHk7XG4gICAgICBsaXN0Ll9sZXZlbCA9IG5ld0xldmVsO1xuICAgICAgbGlzdC5fcm9vdCA9IG5ld1Jvb3Q7XG4gICAgICBsaXN0Ll90YWlsID0gbmV3VGFpbDtcbiAgICAgIGxpc3QuX19oYXNoID0gdW5kZWZpbmVkO1xuICAgICAgbGlzdC5fX2FsdGVyZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgfVxuICAgIHJldHVybiBtYWtlTGlzdChuZXdPcmlnaW4sIG5ld0NhcGFjaXR5LCBuZXdMZXZlbCwgbmV3Um9vdCwgbmV3VGFpbCk7XG4gIH1cblxuICBmdW5jdGlvbiBtZXJnZUludG9MaXN0V2l0aChsaXN0LCBtZXJnZXIsIGl0ZXJhYmxlcykge1xuICAgIHZhciBpdGVycyA9IFtdO1xuICAgIHZhciBtYXhTaXplID0gMDtcbiAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgaXRlcmFibGVzLmxlbmd0aDsgaWkrKykge1xuICAgICAgdmFyIHZhbHVlID0gaXRlcmFibGVzW2lpXTtcbiAgICAgIHZhciBpdGVyID0gSW5kZXhlZEl0ZXJhYmxlKHZhbHVlKTtcbiAgICAgIGlmIChpdGVyLnNpemUgPiBtYXhTaXplKSB7XG4gICAgICAgIG1heFNpemUgPSBpdGVyLnNpemU7XG4gICAgICB9XG4gICAgICBpZiAoIWlzSXRlcmFibGUodmFsdWUpKSB7XG4gICAgICAgIGl0ZXIgPSBpdGVyLm1hcChmdW5jdGlvbih2ICkge3JldHVybiBmcm9tSlModil9KTtcbiAgICAgIH1cbiAgICAgIGl0ZXJzLnB1c2goaXRlcik7XG4gICAgfVxuICAgIGlmIChtYXhTaXplID4gbGlzdC5zaXplKSB7XG4gICAgICBsaXN0ID0gbGlzdC5zZXRTaXplKG1heFNpemUpO1xuICAgIH1cbiAgICByZXR1cm4gbWVyZ2VJbnRvQ29sbGVjdGlvbldpdGgobGlzdCwgbWVyZ2VyLCBpdGVycyk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRUYWlsT2Zmc2V0KHNpemUpIHtcbiAgICByZXR1cm4gc2l6ZSA8IFNJWkUgPyAwIDogKCgoc2l6ZSAtIDEpID4+PiBTSElGVCkgPDwgU0hJRlQpO1xuICB9XG5cbiAgY3JlYXRlQ2xhc3MoT3JkZXJlZE1hcCwgTWFwKTtcblxuICAgIC8vIEBwcmFnbWEgQ29uc3RydWN0aW9uXG5cbiAgICBmdW5jdGlvbiBPcmRlcmVkTWFwKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCA/IGVtcHR5T3JkZXJlZE1hcCgpIDpcbiAgICAgICAgaXNPcmRlcmVkTWFwKHZhbHVlKSA/IHZhbHVlIDpcbiAgICAgICAgZW1wdHlPcmRlcmVkTWFwKCkud2l0aE11dGF0aW9ucyhmdW5jdGlvbihtYXAgKSB7XG4gICAgICAgICAgdmFyIGl0ZXIgPSBLZXllZEl0ZXJhYmxlKHZhbHVlKTtcbiAgICAgICAgICBhc3NlcnROb3RJbmZpbml0ZShpdGVyLnNpemUpO1xuICAgICAgICAgIGl0ZXIuZm9yRWFjaChmdW5jdGlvbih2LCBrKSAge3JldHVybiBtYXAuc2V0KGssIHYpfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIE9yZGVyZWRNYXAub2YgPSBmdW5jdGlvbigvKi4uLnZhbHVlcyovKSB7XG4gICAgICByZXR1cm4gdGhpcyhhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBPcmRlcmVkTWFwLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX190b1N0cmluZygnT3JkZXJlZE1hcCB7JywgJ30nKTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBBY2Nlc3NcblxuICAgIE9yZGVyZWRNYXAucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGssIG5vdFNldFZhbHVlKSB7XG4gICAgICB2YXIgaW5kZXggPSB0aGlzLl9tYXAuZ2V0KGspO1xuICAgICAgcmV0dXJuIGluZGV4ICE9PSB1bmRlZmluZWQgPyB0aGlzLl9saXN0LmdldChpbmRleClbMV0gOiBub3RTZXRWYWx1ZTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBNb2RpZmljYXRpb25cblxuICAgIE9yZGVyZWRNYXAucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5zaXplID09PSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX19vd25lcklEKSB7XG4gICAgICAgIHRoaXMuc2l6ZSA9IDA7XG4gICAgICAgIHRoaXMuX21hcC5jbGVhcigpO1xuICAgICAgICB0aGlzLl9saXN0LmNsZWFyKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVtcHR5T3JkZXJlZE1hcCgpO1xuICAgIH07XG5cbiAgICBPcmRlcmVkTWFwLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihrLCB2KSB7XG4gICAgICByZXR1cm4gdXBkYXRlT3JkZXJlZE1hcCh0aGlzLCBrLCB2KTtcbiAgICB9O1xuXG4gICAgT3JkZXJlZE1hcC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oaykge1xuICAgICAgcmV0dXJuIHVwZGF0ZU9yZGVyZWRNYXAodGhpcywgaywgTk9UX1NFVCk7XG4gICAgfTtcblxuICAgIE9yZGVyZWRNYXAucHJvdG90eXBlLndhc0FsdGVyZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9tYXAud2FzQWx0ZXJlZCgpIHx8IHRoaXMuX2xpc3Qud2FzQWx0ZXJlZCgpO1xuICAgIH07XG5cbiAgICBPcmRlcmVkTWFwLnByb3RvdHlwZS5fX2l0ZXJhdGUgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgcmV0dXJuIHRoaXMuX2xpc3QuX19pdGVyYXRlKFxuICAgICAgICBmdW5jdGlvbihlbnRyeSApIHtyZXR1cm4gZW50cnkgJiYgZm4oZW50cnlbMV0sIGVudHJ5WzBdLCB0aGlzJDApfSxcbiAgICAgICAgcmV2ZXJzZVxuICAgICAgKTtcbiAgICB9O1xuXG4gICAgT3JkZXJlZE1hcC5wcm90b3R5cGUuX19pdGVyYXRvciA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIHJldHVybiB0aGlzLl9saXN0LmZyb21FbnRyeVNlcSgpLl9faXRlcmF0b3IodHlwZSwgcmV2ZXJzZSk7XG4gICAgfTtcblxuICAgIE9yZGVyZWRNYXAucHJvdG90eXBlLl9fZW5zdXJlT3duZXIgPSBmdW5jdGlvbihvd25lcklEKSB7XG4gICAgICBpZiAob3duZXJJRCA9PT0gdGhpcy5fX293bmVySUQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICB2YXIgbmV3TWFwID0gdGhpcy5fbWFwLl9fZW5zdXJlT3duZXIob3duZXJJRCk7XG4gICAgICB2YXIgbmV3TGlzdCA9IHRoaXMuX2xpc3QuX19lbnN1cmVPd25lcihvd25lcklEKTtcbiAgICAgIGlmICghb3duZXJJRCkge1xuICAgICAgICB0aGlzLl9fb3duZXJJRCA9IG93bmVySUQ7XG4gICAgICAgIHRoaXMuX21hcCA9IG5ld01hcDtcbiAgICAgICAgdGhpcy5fbGlzdCA9IG5ld0xpc3Q7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VPcmRlcmVkTWFwKG5ld01hcCwgbmV3TGlzdCwgb3duZXJJRCwgdGhpcy5fX2hhc2gpO1xuICAgIH07XG5cblxuICBmdW5jdGlvbiBpc09yZGVyZWRNYXAobWF5YmVPcmRlcmVkTWFwKSB7XG4gICAgcmV0dXJuIGlzTWFwKG1heWJlT3JkZXJlZE1hcCkgJiYgaXNPcmRlcmVkKG1heWJlT3JkZXJlZE1hcCk7XG4gIH1cblxuICBPcmRlcmVkTWFwLmlzT3JkZXJlZE1hcCA9IGlzT3JkZXJlZE1hcDtcblxuICBPcmRlcmVkTWFwLnByb3RvdHlwZVtJU19PUkRFUkVEX1NFTlRJTkVMXSA9IHRydWU7XG4gIE9yZGVyZWRNYXAucHJvdG90eXBlW0RFTEVURV0gPSBPcmRlcmVkTWFwLnByb3RvdHlwZS5yZW1vdmU7XG5cblxuXG4gIGZ1bmN0aW9uIG1ha2VPcmRlcmVkTWFwKG1hcCwgbGlzdCwgb3duZXJJRCwgaGFzaCkge1xuICAgIHZhciBvbWFwID0gT2JqZWN0LmNyZWF0ZShPcmRlcmVkTWFwLnByb3RvdHlwZSk7XG4gICAgb21hcC5zaXplID0gbWFwID8gbWFwLnNpemUgOiAwO1xuICAgIG9tYXAuX21hcCA9IG1hcDtcbiAgICBvbWFwLl9saXN0ID0gbGlzdDtcbiAgICBvbWFwLl9fb3duZXJJRCA9IG93bmVySUQ7XG4gICAgb21hcC5fX2hhc2ggPSBoYXNoO1xuICAgIHJldHVybiBvbWFwO1xuICB9XG5cbiAgdmFyIEVNUFRZX09SREVSRURfTUFQO1xuICBmdW5jdGlvbiBlbXB0eU9yZGVyZWRNYXAoKSB7XG4gICAgcmV0dXJuIEVNUFRZX09SREVSRURfTUFQIHx8IChFTVBUWV9PUkRFUkVEX01BUCA9IG1ha2VPcmRlcmVkTWFwKGVtcHR5TWFwKCksIGVtcHR5TGlzdCgpKSk7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVPcmRlcmVkTWFwKG9tYXAsIGssIHYpIHtcbiAgICB2YXIgbWFwID0gb21hcC5fbWFwO1xuICAgIHZhciBsaXN0ID0gb21hcC5fbGlzdDtcbiAgICB2YXIgaSA9IG1hcC5nZXQoayk7XG4gICAgdmFyIGhhcyA9IGkgIT09IHVuZGVmaW5lZDtcbiAgICB2YXIgbmV3TWFwO1xuICAgIHZhciBuZXdMaXN0O1xuICAgIGlmICh2ID09PSBOT1RfU0VUKSB7IC8vIHJlbW92ZWRcbiAgICAgIGlmICghaGFzKSB7XG4gICAgICAgIHJldHVybiBvbWFwO1xuICAgICAgfVxuICAgICAgaWYgKGxpc3Quc2l6ZSA+PSBTSVpFICYmIGxpc3Quc2l6ZSA+PSBtYXAuc2l6ZSAqIDIpIHtcbiAgICAgICAgbmV3TGlzdCA9IGxpc3QuZmlsdGVyKGZ1bmN0aW9uKGVudHJ5LCBpZHgpICB7cmV0dXJuIGVudHJ5ICE9PSB1bmRlZmluZWQgJiYgaSAhPT0gaWR4fSk7XG4gICAgICAgIG5ld01hcCA9IG5ld0xpc3QudG9LZXllZFNlcSgpLm1hcChmdW5jdGlvbihlbnRyeSApIHtyZXR1cm4gZW50cnlbMF19KS5mbGlwKCkudG9NYXAoKTtcbiAgICAgICAgaWYgKG9tYXAuX19vd25lcklEKSB7XG4gICAgICAgICAgbmV3TWFwLl9fb3duZXJJRCA9IG5ld0xpc3QuX19vd25lcklEID0gb21hcC5fX293bmVySUQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld01hcCA9IG1hcC5yZW1vdmUoayk7XG4gICAgICAgIG5ld0xpc3QgPSBpID09PSBsaXN0LnNpemUgLSAxID8gbGlzdC5wb3AoKSA6IGxpc3Quc2V0KGksIHVuZGVmaW5lZCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChoYXMpIHtcbiAgICAgICAgaWYgKHYgPT09IGxpc3QuZ2V0KGkpWzFdKSB7XG4gICAgICAgICAgcmV0dXJuIG9tYXA7XG4gICAgICAgIH1cbiAgICAgICAgbmV3TWFwID0gbWFwO1xuICAgICAgICBuZXdMaXN0ID0gbGlzdC5zZXQoaSwgW2ssIHZdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld01hcCA9IG1hcC5zZXQoaywgbGlzdC5zaXplKTtcbiAgICAgICAgbmV3TGlzdCA9IGxpc3Quc2V0KGxpc3Quc2l6ZSwgW2ssIHZdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG9tYXAuX19vd25lcklEKSB7XG4gICAgICBvbWFwLnNpemUgPSBuZXdNYXAuc2l6ZTtcbiAgICAgIG9tYXAuX21hcCA9IG5ld01hcDtcbiAgICAgIG9tYXAuX2xpc3QgPSBuZXdMaXN0O1xuICAgICAgb21hcC5fX2hhc2ggPSB1bmRlZmluZWQ7XG4gICAgICByZXR1cm4gb21hcDtcbiAgICB9XG4gICAgcmV0dXJuIG1ha2VPcmRlcmVkTWFwKG5ld01hcCwgbmV3TGlzdCk7XG4gIH1cblxuICBjcmVhdGVDbGFzcyhUb0tleWVkU2VxdWVuY2UsIEtleWVkU2VxKTtcbiAgICBmdW5jdGlvbiBUb0tleWVkU2VxdWVuY2UoaW5kZXhlZCwgdXNlS2V5cykge1xuICAgICAgdGhpcy5faXRlciA9IGluZGV4ZWQ7XG4gICAgICB0aGlzLl91c2VLZXlzID0gdXNlS2V5cztcbiAgICAgIHRoaXMuc2l6ZSA9IGluZGV4ZWQuc2l6ZTtcbiAgICB9XG5cbiAgICBUb0tleWVkU2VxdWVuY2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGtleSwgbm90U2V0VmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLl9pdGVyLmdldChrZXksIG5vdFNldFZhbHVlKTtcbiAgICB9O1xuXG4gICAgVG9LZXllZFNlcXVlbmNlLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9pdGVyLmhhcyhrZXkpO1xuICAgIH07XG5cbiAgICBUb0tleWVkU2VxdWVuY2UucHJvdG90eXBlLnZhbHVlU2VxID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5faXRlci52YWx1ZVNlcSgpO1xuICAgIH07XG5cbiAgICBUb0tleWVkU2VxdWVuY2UucHJvdG90eXBlLnJldmVyc2UgPSBmdW5jdGlvbigpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIHZhciByZXZlcnNlZFNlcXVlbmNlID0gcmV2ZXJzZUZhY3RvcnkodGhpcywgdHJ1ZSk7XG4gICAgICBpZiAoIXRoaXMuX3VzZUtleXMpIHtcbiAgICAgICAgcmV2ZXJzZWRTZXF1ZW5jZS52YWx1ZVNlcSA9IGZ1bmN0aW9uKCkgIHtyZXR1cm4gdGhpcyQwLl9pdGVyLnRvU2VxKCkucmV2ZXJzZSgpfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXZlcnNlZFNlcXVlbmNlO1xuICAgIH07XG5cbiAgICBUb0tleWVkU2VxdWVuY2UucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uKG1hcHBlciwgY29udGV4dCkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgdmFyIG1hcHBlZFNlcXVlbmNlID0gbWFwRmFjdG9yeSh0aGlzLCBtYXBwZXIsIGNvbnRleHQpO1xuICAgICAgaWYgKCF0aGlzLl91c2VLZXlzKSB7XG4gICAgICAgIG1hcHBlZFNlcXVlbmNlLnZhbHVlU2VxID0gZnVuY3Rpb24oKSAge3JldHVybiB0aGlzJDAuX2l0ZXIudG9TZXEoKS5tYXAobWFwcGVyLCBjb250ZXh0KX07XG4gICAgICB9XG4gICAgICByZXR1cm4gbWFwcGVkU2VxdWVuY2U7XG4gICAgfTtcblxuICAgIFRvS2V5ZWRTZXF1ZW5jZS5wcm90b3R5cGUuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIHZhciBpaTtcbiAgICAgIHJldHVybiB0aGlzLl9pdGVyLl9faXRlcmF0ZShcbiAgICAgICAgdGhpcy5fdXNlS2V5cyA/XG4gICAgICAgICAgZnVuY3Rpb24odiwgaykgIHtyZXR1cm4gZm4odiwgaywgdGhpcyQwKX0gOlxuICAgICAgICAgICgoaWkgPSByZXZlcnNlID8gcmVzb2x2ZVNpemUodGhpcykgOiAwKSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKHYgKSB7cmV0dXJuIGZuKHYsIHJldmVyc2UgPyAtLWlpIDogaWkrKywgdGhpcyQwKX0pLFxuICAgICAgICByZXZlcnNlXG4gICAgICApO1xuICAgIH07XG5cbiAgICBUb0tleWVkU2VxdWVuY2UucHJvdG90eXBlLl9faXRlcmF0b3IgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICBpZiAodGhpcy5fdXNlS2V5cykge1xuICAgICAgICByZXR1cm4gdGhpcy5faXRlci5fX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpO1xuICAgICAgfVxuICAgICAgdmFyIGl0ZXJhdG9yID0gdGhpcy5faXRlci5fX2l0ZXJhdG9yKElURVJBVEVfVkFMVUVTLCByZXZlcnNlKTtcbiAgICAgIHZhciBpaSA9IHJldmVyc2UgPyByZXNvbHZlU2l6ZSh0aGlzKSA6IDA7XG4gICAgICByZXR1cm4gbmV3IEl0ZXJhdG9yKGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgdmFyIHN0ZXAgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgICAgIHJldHVybiBzdGVwLmRvbmUgPyBzdGVwIDpcbiAgICAgICAgICBpdGVyYXRvclZhbHVlKHR5cGUsIHJldmVyc2UgPyAtLWlpIDogaWkrKywgc3RlcC52YWx1ZSwgc3RlcCk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gIFRvS2V5ZWRTZXF1ZW5jZS5wcm90b3R5cGVbSVNfT1JERVJFRF9TRU5USU5FTF0gPSB0cnVlO1xuXG5cbiAgY3JlYXRlQ2xhc3MoVG9JbmRleGVkU2VxdWVuY2UsIEluZGV4ZWRTZXEpO1xuICAgIGZ1bmN0aW9uIFRvSW5kZXhlZFNlcXVlbmNlKGl0ZXIpIHtcbiAgICAgIHRoaXMuX2l0ZXIgPSBpdGVyO1xuICAgICAgdGhpcy5zaXplID0gaXRlci5zaXplO1xuICAgIH1cblxuICAgIFRvSW5kZXhlZFNlcXVlbmNlLnByb3RvdHlwZS5pbmNsdWRlcyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdGhpcy5faXRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfTtcblxuICAgIFRvSW5kZXhlZFNlcXVlbmNlLnByb3RvdHlwZS5fX2l0ZXJhdGUgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICAgICAgcmV0dXJuIHRoaXMuX2l0ZXIuX19pdGVyYXRlKGZ1bmN0aW9uKHYgKSB7cmV0dXJuIGZuKHYsIGl0ZXJhdGlvbnMrKywgdGhpcyQwKX0sIHJldmVyc2UpO1xuICAgIH07XG5cbiAgICBUb0luZGV4ZWRTZXF1ZW5jZS5wcm90b3R5cGUuX19pdGVyYXRvciA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIHZhciBpdGVyYXRvciA9IHRoaXMuX2l0ZXIuX19pdGVyYXRvcihJVEVSQVRFX1ZBTFVFUywgcmV2ZXJzZSk7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICByZXR1cm4gbmV3IEl0ZXJhdG9yKGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgdmFyIHN0ZXAgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgICAgIHJldHVybiBzdGVwLmRvbmUgPyBzdGVwIDpcbiAgICAgICAgICBpdGVyYXRvclZhbHVlKHR5cGUsIGl0ZXJhdGlvbnMrKywgc3RlcC52YWx1ZSwgc3RlcClcbiAgICAgIH0pO1xuICAgIH07XG5cblxuXG4gIGNyZWF0ZUNsYXNzKFRvU2V0U2VxdWVuY2UsIFNldFNlcSk7XG4gICAgZnVuY3Rpb24gVG9TZXRTZXF1ZW5jZShpdGVyKSB7XG4gICAgICB0aGlzLl9pdGVyID0gaXRlcjtcbiAgICAgIHRoaXMuc2l6ZSA9IGl0ZXIuc2l6ZTtcbiAgICB9XG5cbiAgICBUb1NldFNlcXVlbmNlLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9pdGVyLmluY2x1ZGVzKGtleSk7XG4gICAgfTtcblxuICAgIFRvU2V0U2VxdWVuY2UucHJvdG90eXBlLl9faXRlcmF0ZSA9IGZ1bmN0aW9uKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICByZXR1cm4gdGhpcy5faXRlci5fX2l0ZXJhdGUoZnVuY3Rpb24odiApIHtyZXR1cm4gZm4odiwgdiwgdGhpcyQwKX0sIHJldmVyc2UpO1xuICAgIH07XG5cbiAgICBUb1NldFNlcXVlbmNlLnByb3RvdHlwZS5fX2l0ZXJhdG9yID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge1xuICAgICAgdmFyIGl0ZXJhdG9yID0gdGhpcy5faXRlci5fX2l0ZXJhdG9yKElURVJBVEVfVkFMVUVTLCByZXZlcnNlKTtcbiAgICAgIHJldHVybiBuZXcgSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICB2YXIgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgcmV0dXJuIHN0ZXAuZG9uZSA/IHN0ZXAgOlxuICAgICAgICAgIGl0ZXJhdG9yVmFsdWUodHlwZSwgc3RlcC52YWx1ZSwgc3RlcC52YWx1ZSwgc3RlcCk7XG4gICAgICB9KTtcbiAgICB9O1xuXG5cblxuICBjcmVhdGVDbGFzcyhGcm9tRW50cmllc1NlcXVlbmNlLCBLZXllZFNlcSk7XG4gICAgZnVuY3Rpb24gRnJvbUVudHJpZXNTZXF1ZW5jZShlbnRyaWVzKSB7XG4gICAgICB0aGlzLl9pdGVyID0gZW50cmllcztcbiAgICAgIHRoaXMuc2l6ZSA9IGVudHJpZXMuc2l6ZTtcbiAgICB9XG5cbiAgICBGcm9tRW50cmllc1NlcXVlbmNlLnByb3RvdHlwZS5lbnRyeVNlcSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2l0ZXIudG9TZXEoKTtcbiAgICB9O1xuXG4gICAgRnJvbUVudHJpZXNTZXF1ZW5jZS5wcm90b3R5cGUuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIHJldHVybiB0aGlzLl9pdGVyLl9faXRlcmF0ZShmdW5jdGlvbihlbnRyeSApIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgZW50cnkgZXhpc3RzIGZpcnN0IHNvIGFycmF5IGFjY2VzcyBkb2Vzbid0IHRocm93IGZvciBob2xlc1xuICAgICAgICAvLyBpbiB0aGUgcGFyZW50IGl0ZXJhdGlvbi5cbiAgICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgICAgdmFsaWRhdGVFbnRyeShlbnRyeSk7XG4gICAgICAgICAgdmFyIGluZGV4ZWRJdGVyYWJsZSA9IGlzSXRlcmFibGUoZW50cnkpO1xuICAgICAgICAgIHJldHVybiBmbihcbiAgICAgICAgICAgIGluZGV4ZWRJdGVyYWJsZSA/IGVudHJ5LmdldCgxKSA6IGVudHJ5WzFdLFxuICAgICAgICAgICAgaW5kZXhlZEl0ZXJhYmxlID8gZW50cnkuZ2V0KDApIDogZW50cnlbMF0sXG4gICAgICAgICAgICB0aGlzJDBcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9LCByZXZlcnNlKTtcbiAgICB9O1xuXG4gICAgRnJvbUVudHJpZXNTZXF1ZW5jZS5wcm90b3R5cGUuX19pdGVyYXRvciA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIHZhciBpdGVyYXRvciA9IHRoaXMuX2l0ZXIuX19pdGVyYXRvcihJVEVSQVRFX1ZBTFVFUywgcmV2ZXJzZSk7XG4gICAgICByZXR1cm4gbmV3IEl0ZXJhdG9yKGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICB2YXIgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICBpZiAoc3RlcC5kb25lKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RlcDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGVudHJ5ID0gc3RlcC52YWx1ZTtcbiAgICAgICAgICAvLyBDaGVjayBpZiBlbnRyeSBleGlzdHMgZmlyc3Qgc28gYXJyYXkgYWNjZXNzIGRvZXNuJ3QgdGhyb3cgZm9yIGhvbGVzXG4gICAgICAgICAgLy8gaW4gdGhlIHBhcmVudCBpdGVyYXRpb24uXG4gICAgICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgICAgICB2YWxpZGF0ZUVudHJ5KGVudHJ5KTtcbiAgICAgICAgICAgIHZhciBpbmRleGVkSXRlcmFibGUgPSBpc0l0ZXJhYmxlKGVudHJ5KTtcbiAgICAgICAgICAgIHJldHVybiBpdGVyYXRvclZhbHVlKFxuICAgICAgICAgICAgICB0eXBlLFxuICAgICAgICAgICAgICBpbmRleGVkSXRlcmFibGUgPyBlbnRyeS5nZXQoMCkgOiBlbnRyeVswXSxcbiAgICAgICAgICAgICAgaW5kZXhlZEl0ZXJhYmxlID8gZW50cnkuZ2V0KDEpIDogZW50cnlbMV0sXG4gICAgICAgICAgICAgIHN0ZXBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuXG5cbiAgVG9JbmRleGVkU2VxdWVuY2UucHJvdG90eXBlLmNhY2hlUmVzdWx0ID1cbiAgVG9LZXllZFNlcXVlbmNlLnByb3RvdHlwZS5jYWNoZVJlc3VsdCA9XG4gIFRvU2V0U2VxdWVuY2UucHJvdG90eXBlLmNhY2hlUmVzdWx0ID1cbiAgRnJvbUVudHJpZXNTZXF1ZW5jZS5wcm90b3R5cGUuY2FjaGVSZXN1bHQgPVxuICAgIGNhY2hlUmVzdWx0VGhyb3VnaDtcblxuXG4gIGZ1bmN0aW9uIGZsaXBGYWN0b3J5KGl0ZXJhYmxlKSB7XG4gICAgdmFyIGZsaXBTZXF1ZW5jZSA9IG1ha2VTZXF1ZW5jZShpdGVyYWJsZSk7XG4gICAgZmxpcFNlcXVlbmNlLl9pdGVyID0gaXRlcmFibGU7XG4gICAgZmxpcFNlcXVlbmNlLnNpemUgPSBpdGVyYWJsZS5zaXplO1xuICAgIGZsaXBTZXF1ZW5jZS5mbGlwID0gZnVuY3Rpb24oKSAge3JldHVybiBpdGVyYWJsZX07XG4gICAgZmxpcFNlcXVlbmNlLnJldmVyc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgcmV2ZXJzZWRTZXF1ZW5jZSA9IGl0ZXJhYmxlLnJldmVyc2UuYXBwbHkodGhpcyk7IC8vIHN1cGVyLnJldmVyc2UoKVxuICAgICAgcmV2ZXJzZWRTZXF1ZW5jZS5mbGlwID0gZnVuY3Rpb24oKSAge3JldHVybiBpdGVyYWJsZS5yZXZlcnNlKCl9O1xuICAgICAgcmV0dXJuIHJldmVyc2VkU2VxdWVuY2U7XG4gICAgfTtcbiAgICBmbGlwU2VxdWVuY2UuaGFzID0gZnVuY3Rpb24oa2V5ICkge3JldHVybiBpdGVyYWJsZS5pbmNsdWRlcyhrZXkpfTtcbiAgICBmbGlwU2VxdWVuY2UuaW5jbHVkZXMgPSBmdW5jdGlvbihrZXkgKSB7cmV0dXJuIGl0ZXJhYmxlLmhhcyhrZXkpfTtcbiAgICBmbGlwU2VxdWVuY2UuY2FjaGVSZXN1bHQgPSBjYWNoZVJlc3VsdFRocm91Z2g7XG4gICAgZmxpcFNlcXVlbmNlLl9faXRlcmF0ZVVuY2FjaGVkID0gZnVuY3Rpb24gKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICByZXR1cm4gaXRlcmFibGUuX19pdGVyYXRlKGZ1bmN0aW9uKHYsIGspICB7cmV0dXJuIGZuKGssIHYsIHRoaXMkMCkgIT09IGZhbHNlfSwgcmV2ZXJzZSk7XG4gICAgfVxuICAgIGZsaXBTZXF1ZW5jZS5fX2l0ZXJhdG9yVW5jYWNoZWQgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICBpZiAodHlwZSA9PT0gSVRFUkFURV9FTlRSSUVTKSB7XG4gICAgICAgIHZhciBpdGVyYXRvciA9IGl0ZXJhYmxlLl9faXRlcmF0b3IodHlwZSwgcmV2ZXJzZSk7XG4gICAgICAgIHJldHVybiBuZXcgSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICAgIHZhciBzdGVwID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICAgIGlmICghc3RlcC5kb25lKSB7XG4gICAgICAgICAgICB2YXIgayA9IHN0ZXAudmFsdWVbMF07XG4gICAgICAgICAgICBzdGVwLnZhbHVlWzBdID0gc3RlcC52YWx1ZVsxXTtcbiAgICAgICAgICAgIHN0ZXAudmFsdWVbMV0gPSBrO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gc3RlcDtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gaXRlcmFibGUuX19pdGVyYXRvcihcbiAgICAgICAgdHlwZSA9PT0gSVRFUkFURV9WQUxVRVMgPyBJVEVSQVRFX0tFWVMgOiBJVEVSQVRFX1ZBTFVFUyxcbiAgICAgICAgcmV2ZXJzZVxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIGZsaXBTZXF1ZW5jZTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gbWFwRmFjdG9yeShpdGVyYWJsZSwgbWFwcGVyLCBjb250ZXh0KSB7XG4gICAgdmFyIG1hcHBlZFNlcXVlbmNlID0gbWFrZVNlcXVlbmNlKGl0ZXJhYmxlKTtcbiAgICBtYXBwZWRTZXF1ZW5jZS5zaXplID0gaXRlcmFibGUuc2l6ZTtcbiAgICBtYXBwZWRTZXF1ZW5jZS5oYXMgPSBmdW5jdGlvbihrZXkgKSB7cmV0dXJuIGl0ZXJhYmxlLmhhcyhrZXkpfTtcbiAgICBtYXBwZWRTZXF1ZW5jZS5nZXQgPSBmdW5jdGlvbihrZXksIG5vdFNldFZhbHVlKSAge1xuICAgICAgdmFyIHYgPSBpdGVyYWJsZS5nZXQoa2V5LCBOT1RfU0VUKTtcbiAgICAgIHJldHVybiB2ID09PSBOT1RfU0VUID9cbiAgICAgICAgbm90U2V0VmFsdWUgOlxuICAgICAgICBtYXBwZXIuY2FsbChjb250ZXh0LCB2LCBrZXksIGl0ZXJhYmxlKTtcbiAgICB9O1xuICAgIG1hcHBlZFNlcXVlbmNlLl9faXRlcmF0ZVVuY2FjaGVkID0gZnVuY3Rpb24gKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICByZXR1cm4gaXRlcmFibGUuX19pdGVyYXRlKFxuICAgICAgICBmdW5jdGlvbih2LCBrLCBjKSAge3JldHVybiBmbihtYXBwZXIuY2FsbChjb250ZXh0LCB2LCBrLCBjKSwgaywgdGhpcyQwKSAhPT0gZmFsc2V9LFxuICAgICAgICByZXZlcnNlXG4gICAgICApO1xuICAgIH1cbiAgICBtYXBwZWRTZXF1ZW5jZS5fX2l0ZXJhdG9yVW5jYWNoZWQgPSBmdW5jdGlvbiAodHlwZSwgcmV2ZXJzZSkge1xuICAgICAgdmFyIGl0ZXJhdG9yID0gaXRlcmFibGUuX19pdGVyYXRvcihJVEVSQVRFX0VOVFJJRVMsIHJldmVyc2UpO1xuICAgICAgcmV0dXJuIG5ldyBJdGVyYXRvcihmdW5jdGlvbigpICB7XG4gICAgICAgIHZhciBzdGVwID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICBpZiAoc3RlcC5kb25lKSB7XG4gICAgICAgICAgcmV0dXJuIHN0ZXA7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGVudHJ5ID0gc3RlcC52YWx1ZTtcbiAgICAgICAgdmFyIGtleSA9IGVudHJ5WzBdO1xuICAgICAgICByZXR1cm4gaXRlcmF0b3JWYWx1ZShcbiAgICAgICAgICB0eXBlLFxuICAgICAgICAgIGtleSxcbiAgICAgICAgICBtYXBwZXIuY2FsbChjb250ZXh0LCBlbnRyeVsxXSwga2V5LCBpdGVyYWJsZSksXG4gICAgICAgICAgc3RlcFxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBtYXBwZWRTZXF1ZW5jZTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gcmV2ZXJzZUZhY3RvcnkoaXRlcmFibGUsIHVzZUtleXMpIHtcbiAgICB2YXIgcmV2ZXJzZWRTZXF1ZW5jZSA9IG1ha2VTZXF1ZW5jZShpdGVyYWJsZSk7XG4gICAgcmV2ZXJzZWRTZXF1ZW5jZS5faXRlciA9IGl0ZXJhYmxlO1xuICAgIHJldmVyc2VkU2VxdWVuY2Uuc2l6ZSA9IGl0ZXJhYmxlLnNpemU7XG4gICAgcmV2ZXJzZWRTZXF1ZW5jZS5yZXZlcnNlID0gZnVuY3Rpb24oKSAge3JldHVybiBpdGVyYWJsZX07XG4gICAgaWYgKGl0ZXJhYmxlLmZsaXApIHtcbiAgICAgIHJldmVyc2VkU2VxdWVuY2UuZmxpcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGZsaXBTZXF1ZW5jZSA9IGZsaXBGYWN0b3J5KGl0ZXJhYmxlKTtcbiAgICAgICAgZmxpcFNlcXVlbmNlLnJldmVyc2UgPSBmdW5jdGlvbigpICB7cmV0dXJuIGl0ZXJhYmxlLmZsaXAoKX07XG4gICAgICAgIHJldHVybiBmbGlwU2VxdWVuY2U7XG4gICAgICB9O1xuICAgIH1cbiAgICByZXZlcnNlZFNlcXVlbmNlLmdldCA9IGZ1bmN0aW9uKGtleSwgbm90U2V0VmFsdWUpIFxuICAgICAge3JldHVybiBpdGVyYWJsZS5nZXQodXNlS2V5cyA/IGtleSA6IC0xIC0ga2V5LCBub3RTZXRWYWx1ZSl9O1xuICAgIHJldmVyc2VkU2VxdWVuY2UuaGFzID0gZnVuY3Rpb24oa2V5IClcbiAgICAgIHtyZXR1cm4gaXRlcmFibGUuaGFzKHVzZUtleXMgPyBrZXkgOiAtMSAtIGtleSl9O1xuICAgIHJldmVyc2VkU2VxdWVuY2UuaW5jbHVkZXMgPSBmdW5jdGlvbih2YWx1ZSApIHtyZXR1cm4gaXRlcmFibGUuaW5jbHVkZXModmFsdWUpfTtcbiAgICByZXZlcnNlZFNlcXVlbmNlLmNhY2hlUmVzdWx0ID0gY2FjaGVSZXN1bHRUaHJvdWdoO1xuICAgIHJldmVyc2VkU2VxdWVuY2UuX19pdGVyYXRlID0gZnVuY3Rpb24gKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICByZXR1cm4gaXRlcmFibGUuX19pdGVyYXRlKGZ1bmN0aW9uKHYsIGspICB7cmV0dXJuIGZuKHYsIGssIHRoaXMkMCl9LCAhcmV2ZXJzZSk7XG4gICAgfTtcbiAgICByZXZlcnNlZFNlcXVlbmNlLl9faXRlcmF0b3IgPVxuICAgICAgZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkgIHtyZXR1cm4gaXRlcmFibGUuX19pdGVyYXRvcih0eXBlLCAhcmV2ZXJzZSl9O1xuICAgIHJldHVybiByZXZlcnNlZFNlcXVlbmNlO1xuICB9XG5cblxuICBmdW5jdGlvbiBmaWx0ZXJGYWN0b3J5KGl0ZXJhYmxlLCBwcmVkaWNhdGUsIGNvbnRleHQsIHVzZUtleXMpIHtcbiAgICB2YXIgZmlsdGVyU2VxdWVuY2UgPSBtYWtlU2VxdWVuY2UoaXRlcmFibGUpO1xuICAgIGlmICh1c2VLZXlzKSB7XG4gICAgICBmaWx0ZXJTZXF1ZW5jZS5oYXMgPSBmdW5jdGlvbihrZXkgKSB7XG4gICAgICAgIHZhciB2ID0gaXRlcmFibGUuZ2V0KGtleSwgTk9UX1NFVCk7XG4gICAgICAgIHJldHVybiB2ICE9PSBOT1RfU0VUICYmICEhcHJlZGljYXRlLmNhbGwoY29udGV4dCwgdiwga2V5LCBpdGVyYWJsZSk7XG4gICAgICB9O1xuICAgICAgZmlsdGVyU2VxdWVuY2UuZ2V0ID0gZnVuY3Rpb24oa2V5LCBub3RTZXRWYWx1ZSkgIHtcbiAgICAgICAgdmFyIHYgPSBpdGVyYWJsZS5nZXQoa2V5LCBOT1RfU0VUKTtcbiAgICAgICAgcmV0dXJuIHYgIT09IE5PVF9TRVQgJiYgcHJlZGljYXRlLmNhbGwoY29udGV4dCwgdiwga2V5LCBpdGVyYWJsZSkgP1xuICAgICAgICAgIHYgOiBub3RTZXRWYWx1ZTtcbiAgICAgIH07XG4gICAgfVxuICAgIGZpbHRlclNlcXVlbmNlLl9faXRlcmF0ZVVuY2FjaGVkID0gZnVuY3Rpb24gKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICBpdGVyYWJsZS5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaywgYykgIHtcbiAgICAgICAgaWYgKHByZWRpY2F0ZS5jYWxsKGNvbnRleHQsIHYsIGssIGMpKSB7XG4gICAgICAgICAgaXRlcmF0aW9ucysrO1xuICAgICAgICAgIHJldHVybiBmbih2LCB1c2VLZXlzID8gayA6IGl0ZXJhdGlvbnMgLSAxLCB0aGlzJDApO1xuICAgICAgICB9XG4gICAgICB9LCByZXZlcnNlKTtcbiAgICAgIHJldHVybiBpdGVyYXRpb25zO1xuICAgIH07XG4gICAgZmlsdGVyU2VxdWVuY2UuX19pdGVyYXRvclVuY2FjaGVkID0gZnVuY3Rpb24gKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIHZhciBpdGVyYXRvciA9IGl0ZXJhYmxlLl9faXRlcmF0b3IoSVRFUkFURV9FTlRSSUVTLCByZXZlcnNlKTtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHJldHVybiBuZXcgSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgIHZhciBzdGVwID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICAgIGlmIChzdGVwLmRvbmUpIHtcbiAgICAgICAgICAgIHJldHVybiBzdGVwO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgZW50cnkgPSBzdGVwLnZhbHVlO1xuICAgICAgICAgIHZhciBrZXkgPSBlbnRyeVswXTtcbiAgICAgICAgICB2YXIgdmFsdWUgPSBlbnRyeVsxXTtcbiAgICAgICAgICBpZiAocHJlZGljYXRlLmNhbGwoY29udGV4dCwgdmFsdWUsIGtleSwgaXRlcmFibGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlcmF0b3JWYWx1ZSh0eXBlLCB1c2VLZXlzID8ga2V5IDogaXRlcmF0aW9ucysrLCB2YWx1ZSwgc3RlcCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGZpbHRlclNlcXVlbmNlO1xuICB9XG5cblxuICBmdW5jdGlvbiBjb3VudEJ5RmFjdG9yeShpdGVyYWJsZSwgZ3JvdXBlciwgY29udGV4dCkge1xuICAgIHZhciBncm91cHMgPSBNYXAoKS5hc011dGFibGUoKTtcbiAgICBpdGVyYWJsZS5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaykgIHtcbiAgICAgIGdyb3Vwcy51cGRhdGUoXG4gICAgICAgIGdyb3VwZXIuY2FsbChjb250ZXh0LCB2LCBrLCBpdGVyYWJsZSksXG4gICAgICAgIDAsXG4gICAgICAgIGZ1bmN0aW9uKGEgKSB7cmV0dXJuIGEgKyAxfVxuICAgICAgKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZ3JvdXBzLmFzSW1tdXRhYmxlKCk7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIGdyb3VwQnlGYWN0b3J5KGl0ZXJhYmxlLCBncm91cGVyLCBjb250ZXh0KSB7XG4gICAgdmFyIGlzS2V5ZWRJdGVyID0gaXNLZXllZChpdGVyYWJsZSk7XG4gICAgdmFyIGdyb3VwcyA9IChpc09yZGVyZWQoaXRlcmFibGUpID8gT3JkZXJlZE1hcCgpIDogTWFwKCkpLmFzTXV0YWJsZSgpO1xuICAgIGl0ZXJhYmxlLl9faXRlcmF0ZShmdW5jdGlvbih2LCBrKSAge1xuICAgICAgZ3JvdXBzLnVwZGF0ZShcbiAgICAgICAgZ3JvdXBlci5jYWxsKGNvbnRleHQsIHYsIGssIGl0ZXJhYmxlKSxcbiAgICAgICAgZnVuY3Rpb24oYSApIHtyZXR1cm4gKGEgPSBhIHx8IFtdLCBhLnB1c2goaXNLZXllZEl0ZXIgPyBbaywgdl0gOiB2KSwgYSl9XG4gICAgICApO1xuICAgIH0pO1xuICAgIHZhciBjb2VyY2UgPSBpdGVyYWJsZUNsYXNzKGl0ZXJhYmxlKTtcbiAgICByZXR1cm4gZ3JvdXBzLm1hcChmdW5jdGlvbihhcnIgKSB7cmV0dXJuIHJlaWZ5KGl0ZXJhYmxlLCBjb2VyY2UoYXJyKSl9KTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gc2xpY2VGYWN0b3J5KGl0ZXJhYmxlLCBiZWdpbiwgZW5kLCB1c2VLZXlzKSB7XG4gICAgdmFyIG9yaWdpbmFsU2l6ZSA9IGl0ZXJhYmxlLnNpemU7XG5cbiAgICAvLyBTYW5pdGl6ZSBiZWdpbiAmIGVuZCB1c2luZyB0aGlzIHNob3J0aGFuZCBmb3IgVG9JbnQzMihhcmd1bWVudClcbiAgICAvLyBodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtdG9pbnQzMlxuICAgIGlmIChiZWdpbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBiZWdpbiA9IGJlZ2luIHwgMDtcbiAgICB9XG4gICAgaWYgKGVuZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoZW5kID09PSBJbmZpbml0eSkge1xuICAgICAgICBlbmQgPSBvcmlnaW5hbFNpemU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbmQgPSBlbmQgfCAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh3aG9sZVNsaWNlKGJlZ2luLCBlbmQsIG9yaWdpbmFsU2l6ZSkpIHtcbiAgICAgIHJldHVybiBpdGVyYWJsZTtcbiAgICB9XG5cbiAgICB2YXIgcmVzb2x2ZWRCZWdpbiA9IHJlc29sdmVCZWdpbihiZWdpbiwgb3JpZ2luYWxTaXplKTtcbiAgICB2YXIgcmVzb2x2ZWRFbmQgPSByZXNvbHZlRW5kKGVuZCwgb3JpZ2luYWxTaXplKTtcblxuICAgIC8vIGJlZ2luIG9yIGVuZCB3aWxsIGJlIE5hTiBpZiB0aGV5IHdlcmUgcHJvdmlkZWQgYXMgbmVnYXRpdmUgbnVtYmVycyBhbmRcbiAgICAvLyB0aGlzIGl0ZXJhYmxlJ3Mgc2l6ZSBpcyB1bmtub3duLiBJbiB0aGF0IGNhc2UsIGNhY2hlIGZpcnN0IHNvIHRoZXJlIGlzXG4gICAgLy8gYSBrbm93biBzaXplIGFuZCB0aGVzZSBkbyBub3QgcmVzb2x2ZSB0byBOYU4uXG4gICAgaWYgKHJlc29sdmVkQmVnaW4gIT09IHJlc29sdmVkQmVnaW4gfHwgcmVzb2x2ZWRFbmQgIT09IHJlc29sdmVkRW5kKSB7XG4gICAgICByZXR1cm4gc2xpY2VGYWN0b3J5KGl0ZXJhYmxlLnRvU2VxKCkuY2FjaGVSZXN1bHQoKSwgYmVnaW4sIGVuZCwgdXNlS2V5cyk7XG4gICAgfVxuXG4gICAgLy8gTm90ZTogcmVzb2x2ZWRFbmQgaXMgdW5kZWZpbmVkIHdoZW4gdGhlIG9yaWdpbmFsIHNlcXVlbmNlJ3MgbGVuZ3RoIGlzXG4gICAgLy8gdW5rbm93biBhbmQgdGhpcyBzbGljZSBkaWQgbm90IHN1cHBseSBhbiBlbmQgYW5kIHNob3VsZCBjb250YWluIGFsbFxuICAgIC8vIGVsZW1lbnRzIGFmdGVyIHJlc29sdmVkQmVnaW4uXG4gICAgLy8gSW4gdGhhdCBjYXNlLCByZXNvbHZlZFNpemUgd2lsbCBiZSBOYU4gYW5kIHNsaWNlU2l6ZSB3aWxsIHJlbWFpbiB1bmRlZmluZWQuXG4gICAgdmFyIHJlc29sdmVkU2l6ZSA9IHJlc29sdmVkRW5kIC0gcmVzb2x2ZWRCZWdpbjtcbiAgICB2YXIgc2xpY2VTaXplO1xuICAgIGlmIChyZXNvbHZlZFNpemUgPT09IHJlc29sdmVkU2l6ZSkge1xuICAgICAgc2xpY2VTaXplID0gcmVzb2x2ZWRTaXplIDwgMCA/IDAgOiByZXNvbHZlZFNpemU7XG4gICAgfVxuXG4gICAgdmFyIHNsaWNlU2VxID0gbWFrZVNlcXVlbmNlKGl0ZXJhYmxlKTtcblxuICAgIC8vIElmIGl0ZXJhYmxlLnNpemUgaXMgdW5kZWZpbmVkLCB0aGUgc2l6ZSBvZiB0aGUgcmVhbGl6ZWQgc2xpY2VTZXEgaXNcbiAgICAvLyB1bmtub3duIGF0IHRoaXMgcG9pbnQgdW5sZXNzIHRoZSBudW1iZXIgb2YgaXRlbXMgdG8gc2xpY2UgaXMgMFxuICAgIHNsaWNlU2VxLnNpemUgPSBzbGljZVNpemUgPT09IDAgPyBzbGljZVNpemUgOiBpdGVyYWJsZS5zaXplICYmIHNsaWNlU2l6ZSB8fCB1bmRlZmluZWQ7XG5cbiAgICBpZiAoIXVzZUtleXMgJiYgaXNTZXEoaXRlcmFibGUpICYmIHNsaWNlU2l6ZSA+PSAwKSB7XG4gICAgICBzbGljZVNlcS5nZXQgPSBmdW5jdGlvbiAoaW5kZXgsIG5vdFNldFZhbHVlKSB7XG4gICAgICAgIGluZGV4ID0gd3JhcEluZGV4KHRoaXMsIGluZGV4KTtcbiAgICAgICAgcmV0dXJuIGluZGV4ID49IDAgJiYgaW5kZXggPCBzbGljZVNpemUgP1xuICAgICAgICAgIGl0ZXJhYmxlLmdldChpbmRleCArIHJlc29sdmVkQmVnaW4sIG5vdFNldFZhbHVlKSA6XG4gICAgICAgICAgbm90U2V0VmFsdWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2xpY2VTZXEuX19pdGVyYXRlVW5jYWNoZWQgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgaWYgKHNsaWNlU2l6ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH1cbiAgICAgIGlmIChyZXZlcnNlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlUmVzdWx0KCkuX19pdGVyYXRlKGZuLCByZXZlcnNlKTtcbiAgICAgIH1cbiAgICAgIHZhciBza2lwcGVkID0gMDtcbiAgICAgIHZhciBpc1NraXBwaW5nID0gdHJ1ZTtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIGl0ZXJhYmxlLl9faXRlcmF0ZShmdW5jdGlvbih2LCBrKSAge1xuICAgICAgICBpZiAoIShpc1NraXBwaW5nICYmIChpc1NraXBwaW5nID0gc2tpcHBlZCsrIDwgcmVzb2x2ZWRCZWdpbikpKSB7XG4gICAgICAgICAgaXRlcmF0aW9ucysrO1xuICAgICAgICAgIHJldHVybiBmbih2LCB1c2VLZXlzID8gayA6IGl0ZXJhdGlvbnMgLSAxLCB0aGlzJDApICE9PSBmYWxzZSAmJlxuICAgICAgICAgICAgICAgICBpdGVyYXRpb25zICE9PSBzbGljZVNpemU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGl0ZXJhdGlvbnM7XG4gICAgfTtcblxuICAgIHNsaWNlU2VxLl9faXRlcmF0b3JVbmNhY2hlZCA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIGlmIChzbGljZVNpemUgIT09IDAgJiYgcmV2ZXJzZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWNoZVJlc3VsdCgpLl9faXRlcmF0b3IodHlwZSwgcmV2ZXJzZSk7XG4gICAgICB9XG4gICAgICAvLyBEb24ndCBib3RoZXIgaW5zdGFudGlhdGluZyBwYXJlbnQgaXRlcmF0b3IgaWYgdGFraW5nIDAuXG4gICAgICB2YXIgaXRlcmF0b3IgPSBzbGljZVNpemUgIT09IDAgJiYgaXRlcmFibGUuX19pdGVyYXRvcih0eXBlLCByZXZlcnNlKTtcbiAgICAgIHZhciBza2lwcGVkID0gMDtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHJldHVybiBuZXcgSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICB3aGlsZSAoc2tpcHBlZCsrIDwgcmVzb2x2ZWRCZWdpbikge1xuICAgICAgICAgIGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKytpdGVyYXRpb25zID4gc2xpY2VTaXplKSB7XG4gICAgICAgICAgcmV0dXJuIGl0ZXJhdG9yRG9uZSgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzdGVwID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICBpZiAodXNlS2V5cyB8fCB0eXBlID09PSBJVEVSQVRFX1ZBTFVFUykge1xuICAgICAgICAgIHJldHVybiBzdGVwO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09IElURVJBVEVfS0VZUykge1xuICAgICAgICAgIHJldHVybiBpdGVyYXRvclZhbHVlKHR5cGUsIGl0ZXJhdGlvbnMgLSAxLCB1bmRlZmluZWQsIHN0ZXApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBpdGVyYXRvclZhbHVlKHR5cGUsIGl0ZXJhdGlvbnMgLSAxLCBzdGVwLnZhbHVlWzFdLCBzdGVwKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNsaWNlU2VxO1xuICB9XG5cblxuICBmdW5jdGlvbiB0YWtlV2hpbGVGYWN0b3J5KGl0ZXJhYmxlLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICB2YXIgdGFrZVNlcXVlbmNlID0gbWFrZVNlcXVlbmNlKGl0ZXJhYmxlKTtcbiAgICB0YWtlU2VxdWVuY2UuX19pdGVyYXRlVW5jYWNoZWQgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgaWYgKHJldmVyc2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVSZXN1bHQoKS5fX2l0ZXJhdGUoZm4sIHJldmVyc2UpO1xuICAgICAgfVxuICAgICAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICAgICAgaXRlcmFibGUuX19pdGVyYXRlKGZ1bmN0aW9uKHYsIGssIGMpIFxuICAgICAgICB7cmV0dXJuIHByZWRpY2F0ZS5jYWxsKGNvbnRleHQsIHYsIGssIGMpICYmICsraXRlcmF0aW9ucyAmJiBmbih2LCBrLCB0aGlzJDApfVxuICAgICAgKTtcbiAgICAgIHJldHVybiBpdGVyYXRpb25zO1xuICAgIH07XG4gICAgdGFrZVNlcXVlbmNlLl9faXRlcmF0b3JVbmNhY2hlZCA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIGlmIChyZXZlcnNlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlUmVzdWx0KCkuX19pdGVyYXRvcih0eXBlLCByZXZlcnNlKTtcbiAgICAgIH1cbiAgICAgIHZhciBpdGVyYXRvciA9IGl0ZXJhYmxlLl9faXRlcmF0b3IoSVRFUkFURV9FTlRSSUVTLCByZXZlcnNlKTtcbiAgICAgIHZhciBpdGVyYXRpbmcgPSB0cnVlO1xuICAgICAgcmV0dXJuIG5ldyBJdGVyYXRvcihmdW5jdGlvbigpICB7XG4gICAgICAgIGlmICghaXRlcmF0aW5nKSB7XG4gICAgICAgICAgcmV0dXJuIGl0ZXJhdG9yRG9uZSgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzdGVwID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICBpZiAoc3RlcC5kb25lKSB7XG4gICAgICAgICAgcmV0dXJuIHN0ZXA7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGVudHJ5ID0gc3RlcC52YWx1ZTtcbiAgICAgICAgdmFyIGsgPSBlbnRyeVswXTtcbiAgICAgICAgdmFyIHYgPSBlbnRyeVsxXTtcbiAgICAgICAgaWYgKCFwcmVkaWNhdGUuY2FsbChjb250ZXh0LCB2LCBrLCB0aGlzJDApKSB7XG4gICAgICAgICAgaXRlcmF0aW5nID0gZmFsc2U7XG4gICAgICAgICAgcmV0dXJuIGl0ZXJhdG9yRG9uZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0eXBlID09PSBJVEVSQVRFX0VOVFJJRVMgPyBzdGVwIDpcbiAgICAgICAgICBpdGVyYXRvclZhbHVlKHR5cGUsIGssIHYsIHN0ZXApO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gdGFrZVNlcXVlbmNlO1xuICB9XG5cblxuICBmdW5jdGlvbiBza2lwV2hpbGVGYWN0b3J5KGl0ZXJhYmxlLCBwcmVkaWNhdGUsIGNvbnRleHQsIHVzZUtleXMpIHtcbiAgICB2YXIgc2tpcFNlcXVlbmNlID0gbWFrZVNlcXVlbmNlKGl0ZXJhYmxlKTtcbiAgICBza2lwU2VxdWVuY2UuX19pdGVyYXRlVW5jYWNoZWQgPSBmdW5jdGlvbiAoZm4sIHJldmVyc2UpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIGlmIChyZXZlcnNlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlUmVzdWx0KCkuX19pdGVyYXRlKGZuLCByZXZlcnNlKTtcbiAgICAgIH1cbiAgICAgIHZhciBpc1NraXBwaW5nID0gdHJ1ZTtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIGl0ZXJhYmxlLl9faXRlcmF0ZShmdW5jdGlvbih2LCBrLCBjKSAge1xuICAgICAgICBpZiAoIShpc1NraXBwaW5nICYmIChpc1NraXBwaW5nID0gcHJlZGljYXRlLmNhbGwoY29udGV4dCwgdiwgaywgYykpKSkge1xuICAgICAgICAgIGl0ZXJhdGlvbnMrKztcbiAgICAgICAgICByZXR1cm4gZm4odiwgdXNlS2V5cyA/IGsgOiBpdGVyYXRpb25zIC0gMSwgdGhpcyQwKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gaXRlcmF0aW9ucztcbiAgICB9O1xuICAgIHNraXBTZXF1ZW5jZS5fX2l0ZXJhdG9yVW5jYWNoZWQgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICBpZiAocmV2ZXJzZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWNoZVJlc3VsdCgpLl9faXRlcmF0b3IodHlwZSwgcmV2ZXJzZSk7XG4gICAgICB9XG4gICAgICB2YXIgaXRlcmF0b3IgPSBpdGVyYWJsZS5fX2l0ZXJhdG9yKElURVJBVEVfRU5UUklFUywgcmV2ZXJzZSk7XG4gICAgICB2YXIgc2tpcHBpbmcgPSB0cnVlO1xuICAgICAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICAgICAgcmV0dXJuIG5ldyBJdGVyYXRvcihmdW5jdGlvbigpICB7XG4gICAgICAgIHZhciBzdGVwLCBrLCB2O1xuICAgICAgICBkbyB7XG4gICAgICAgICAgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICBpZiAoc3RlcC5kb25lKSB7XG4gICAgICAgICAgICBpZiAodXNlS2V5cyB8fCB0eXBlID09PSBJVEVSQVRFX1ZBTFVFUykge1xuICAgICAgICAgICAgICByZXR1cm4gc3RlcDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gSVRFUkFURV9LRVlTKSB7XG4gICAgICAgICAgICAgIHJldHVybiBpdGVyYXRvclZhbHVlKHR5cGUsIGl0ZXJhdGlvbnMrKywgdW5kZWZpbmVkLCBzdGVwKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBpdGVyYXRvclZhbHVlKHR5cGUsIGl0ZXJhdGlvbnMrKywgc3RlcC52YWx1ZVsxXSwgc3RlcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBlbnRyeSA9IHN0ZXAudmFsdWU7XG4gICAgICAgICAgayA9IGVudHJ5WzBdO1xuICAgICAgICAgIHYgPSBlbnRyeVsxXTtcbiAgICAgICAgICBza2lwcGluZyAmJiAoc2tpcHBpbmcgPSBwcmVkaWNhdGUuY2FsbChjb250ZXh0LCB2LCBrLCB0aGlzJDApKTtcbiAgICAgICAgfSB3aGlsZSAoc2tpcHBpbmcpO1xuICAgICAgICByZXR1cm4gdHlwZSA9PT0gSVRFUkFURV9FTlRSSUVTID8gc3RlcCA6XG4gICAgICAgICAgaXRlcmF0b3JWYWx1ZSh0eXBlLCBrLCB2LCBzdGVwKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIHNraXBTZXF1ZW5jZTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gY29uY2F0RmFjdG9yeShpdGVyYWJsZSwgdmFsdWVzKSB7XG4gICAgdmFyIGlzS2V5ZWRJdGVyYWJsZSA9IGlzS2V5ZWQoaXRlcmFibGUpO1xuICAgIHZhciBpdGVycyA9IFtpdGVyYWJsZV0uY29uY2F0KHZhbHVlcykubWFwKGZ1bmN0aW9uKHYgKSB7XG4gICAgICBpZiAoIWlzSXRlcmFibGUodikpIHtcbiAgICAgICAgdiA9IGlzS2V5ZWRJdGVyYWJsZSA/XG4gICAgICAgICAga2V5ZWRTZXFGcm9tVmFsdWUodikgOlxuICAgICAgICAgIGluZGV4ZWRTZXFGcm9tVmFsdWUoQXJyYXkuaXNBcnJheSh2KSA/IHYgOiBbdl0pO1xuICAgICAgfSBlbHNlIGlmIChpc0tleWVkSXRlcmFibGUpIHtcbiAgICAgICAgdiA9IEtleWVkSXRlcmFibGUodik7XG4gICAgICB9XG4gICAgICByZXR1cm4gdjtcbiAgICB9KS5maWx0ZXIoZnVuY3Rpb24odiApIHtyZXR1cm4gdi5zaXplICE9PSAwfSk7XG5cbiAgICBpZiAoaXRlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gaXRlcmFibGU7XG4gICAgfVxuXG4gICAgaWYgKGl0ZXJzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdmFyIHNpbmdsZXRvbiA9IGl0ZXJzWzBdO1xuICAgICAgaWYgKHNpbmdsZXRvbiA9PT0gaXRlcmFibGUgfHxcbiAgICAgICAgICBpc0tleWVkSXRlcmFibGUgJiYgaXNLZXllZChzaW5nbGV0b24pIHx8XG4gICAgICAgICAgaXNJbmRleGVkKGl0ZXJhYmxlKSAmJiBpc0luZGV4ZWQoc2luZ2xldG9uKSkge1xuICAgICAgICByZXR1cm4gc2luZ2xldG9uO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBjb25jYXRTZXEgPSBuZXcgQXJyYXlTZXEoaXRlcnMpO1xuICAgIGlmIChpc0tleWVkSXRlcmFibGUpIHtcbiAgICAgIGNvbmNhdFNlcSA9IGNvbmNhdFNlcS50b0tleWVkU2VxKCk7XG4gICAgfSBlbHNlIGlmICghaXNJbmRleGVkKGl0ZXJhYmxlKSkge1xuICAgICAgY29uY2F0U2VxID0gY29uY2F0U2VxLnRvU2V0U2VxKCk7XG4gICAgfVxuICAgIGNvbmNhdFNlcSA9IGNvbmNhdFNlcS5mbGF0dGVuKHRydWUpO1xuICAgIGNvbmNhdFNlcS5zaXplID0gaXRlcnMucmVkdWNlKFxuICAgICAgZnVuY3Rpb24oc3VtLCBzZXEpICB7XG4gICAgICAgIGlmIChzdW0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHZhciBzaXplID0gc2VxLnNpemU7XG4gICAgICAgICAgaWYgKHNpemUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHN1bSArIHNpemU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgMFxuICAgICk7XG4gICAgcmV0dXJuIGNvbmNhdFNlcTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gZmxhdHRlbkZhY3RvcnkoaXRlcmFibGUsIGRlcHRoLCB1c2VLZXlzKSB7XG4gICAgdmFyIGZsYXRTZXF1ZW5jZSA9IG1ha2VTZXF1ZW5jZShpdGVyYWJsZSk7XG4gICAgZmxhdFNlcXVlbmNlLl9faXRlcmF0ZVVuY2FjaGVkID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHZhciBzdG9wcGVkID0gZmFsc2U7XG4gICAgICBmdW5jdGlvbiBmbGF0RGVlcChpdGVyLCBjdXJyZW50RGVwdGgpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgICAgaXRlci5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaykgIHtcbiAgICAgICAgICBpZiAoKCFkZXB0aCB8fCBjdXJyZW50RGVwdGggPCBkZXB0aCkgJiYgaXNJdGVyYWJsZSh2KSkge1xuICAgICAgICAgICAgZmxhdERlZXAodiwgY3VycmVudERlcHRoICsgMSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChmbih2LCB1c2VLZXlzID8gayA6IGl0ZXJhdGlvbnMrKywgdGhpcyQwKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHN0b3BwZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gIXN0b3BwZWQ7XG4gICAgICAgIH0sIHJldmVyc2UpO1xuICAgICAgfVxuICAgICAgZmxhdERlZXAoaXRlcmFibGUsIDApO1xuICAgICAgcmV0dXJuIGl0ZXJhdGlvbnM7XG4gICAgfVxuICAgIGZsYXRTZXF1ZW5jZS5fX2l0ZXJhdG9yVW5jYWNoZWQgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICB2YXIgaXRlcmF0b3IgPSBpdGVyYWJsZS5fX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpO1xuICAgICAgdmFyIHN0YWNrID0gW107XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICByZXR1cm4gbmV3IEl0ZXJhdG9yKGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgd2hpbGUgKGl0ZXJhdG9yKSB7XG4gICAgICAgICAgdmFyIHN0ZXAgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgICAgICAgaWYgKHN0ZXAuZG9uZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yID0gc3RhY2sucG9wKCk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHYgPSBzdGVwLnZhbHVlO1xuICAgICAgICAgIGlmICh0eXBlID09PSBJVEVSQVRFX0VOVFJJRVMpIHtcbiAgICAgICAgICAgIHYgPSB2WzFdO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoKCFkZXB0aCB8fCBzdGFjay5sZW5ndGggPCBkZXB0aCkgJiYgaXNJdGVyYWJsZSh2KSkge1xuICAgICAgICAgICAgc3RhY2sucHVzaChpdGVyYXRvcik7XG4gICAgICAgICAgICBpdGVyYXRvciA9IHYuX19pdGVyYXRvcih0eXBlLCByZXZlcnNlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHVzZUtleXMgPyBzdGVwIDogaXRlcmF0b3JWYWx1ZSh0eXBlLCBpdGVyYXRpb25zKyssIHYsIHN0ZXApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaXRlcmF0b3JEb25lKCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGZsYXRTZXF1ZW5jZTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gZmxhdE1hcEZhY3RvcnkoaXRlcmFibGUsIG1hcHBlciwgY29udGV4dCkge1xuICAgIHZhciBjb2VyY2UgPSBpdGVyYWJsZUNsYXNzKGl0ZXJhYmxlKTtcbiAgICByZXR1cm4gaXRlcmFibGUudG9TZXEoKS5tYXAoXG4gICAgICBmdW5jdGlvbih2LCBrKSAge3JldHVybiBjb2VyY2UobWFwcGVyLmNhbGwoY29udGV4dCwgdiwgaywgaXRlcmFibGUpKX1cbiAgICApLmZsYXR0ZW4odHJ1ZSk7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIGludGVycG9zZUZhY3RvcnkoaXRlcmFibGUsIHNlcGFyYXRvcikge1xuICAgIHZhciBpbnRlcnBvc2VkU2VxdWVuY2UgPSBtYWtlU2VxdWVuY2UoaXRlcmFibGUpO1xuICAgIGludGVycG9zZWRTZXF1ZW5jZS5zaXplID0gaXRlcmFibGUuc2l6ZSAmJiBpdGVyYWJsZS5zaXplICogMiAtMTtcbiAgICBpbnRlcnBvc2VkU2VxdWVuY2UuX19pdGVyYXRlVW5jYWNoZWQgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICAgICAgaXRlcmFibGUuX19pdGVyYXRlKGZ1bmN0aW9uKHYsIGspIFxuICAgICAgICB7cmV0dXJuICghaXRlcmF0aW9ucyB8fCBmbihzZXBhcmF0b3IsIGl0ZXJhdGlvbnMrKywgdGhpcyQwKSAhPT0gZmFsc2UpICYmXG4gICAgICAgIGZuKHYsIGl0ZXJhdGlvbnMrKywgdGhpcyQwKSAhPT0gZmFsc2V9LFxuICAgICAgICByZXZlcnNlXG4gICAgICApO1xuICAgICAgcmV0dXJuIGl0ZXJhdGlvbnM7XG4gICAgfTtcbiAgICBpbnRlcnBvc2VkU2VxdWVuY2UuX19pdGVyYXRvclVuY2FjaGVkID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge1xuICAgICAgdmFyIGl0ZXJhdG9yID0gaXRlcmFibGUuX19pdGVyYXRvcihJVEVSQVRFX1ZBTFVFUywgcmV2ZXJzZSk7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICB2YXIgc3RlcDtcbiAgICAgIHJldHVybiBuZXcgSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICBpZiAoIXN0ZXAgfHwgaXRlcmF0aW9ucyAlIDIpIHtcbiAgICAgICAgICBzdGVwID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICAgIGlmIChzdGVwLmRvbmUpIHtcbiAgICAgICAgICAgIHJldHVybiBzdGVwO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaXRlcmF0aW9ucyAlIDIgP1xuICAgICAgICAgIGl0ZXJhdG9yVmFsdWUodHlwZSwgaXRlcmF0aW9ucysrLCBzZXBhcmF0b3IpIDpcbiAgICAgICAgICBpdGVyYXRvclZhbHVlKHR5cGUsIGl0ZXJhdGlvbnMrKywgc3RlcC52YWx1ZSwgc3RlcCk7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBpbnRlcnBvc2VkU2VxdWVuY2U7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIHNvcnRGYWN0b3J5KGl0ZXJhYmxlLCBjb21wYXJhdG9yLCBtYXBwZXIpIHtcbiAgICBpZiAoIWNvbXBhcmF0b3IpIHtcbiAgICAgIGNvbXBhcmF0b3IgPSBkZWZhdWx0Q29tcGFyYXRvcjtcbiAgICB9XG4gICAgdmFyIGlzS2V5ZWRJdGVyYWJsZSA9IGlzS2V5ZWQoaXRlcmFibGUpO1xuICAgIHZhciBpbmRleCA9IDA7XG4gICAgdmFyIGVudHJpZXMgPSBpdGVyYWJsZS50b1NlcSgpLm1hcChcbiAgICAgIGZ1bmN0aW9uKHYsIGspICB7cmV0dXJuIFtrLCB2LCBpbmRleCsrLCBtYXBwZXIgPyBtYXBwZXIodiwgaywgaXRlcmFibGUpIDogdl19XG4gICAgKS50b0FycmF5KCk7XG4gICAgZW50cmllcy5zb3J0KGZ1bmN0aW9uKGEsIGIpICB7cmV0dXJuIGNvbXBhcmF0b3IoYVszXSwgYlszXSkgfHwgYVsyXSAtIGJbMl19KS5mb3JFYWNoKFxuICAgICAgaXNLZXllZEl0ZXJhYmxlID9cbiAgICAgIGZ1bmN0aW9uKHYsIGkpICB7IGVudHJpZXNbaV0ubGVuZ3RoID0gMjsgfSA6XG4gICAgICBmdW5jdGlvbih2LCBpKSAgeyBlbnRyaWVzW2ldID0gdlsxXTsgfVxuICAgICk7XG4gICAgcmV0dXJuIGlzS2V5ZWRJdGVyYWJsZSA/IEtleWVkU2VxKGVudHJpZXMpIDpcbiAgICAgIGlzSW5kZXhlZChpdGVyYWJsZSkgPyBJbmRleGVkU2VxKGVudHJpZXMpIDpcbiAgICAgIFNldFNlcShlbnRyaWVzKTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gbWF4RmFjdG9yeShpdGVyYWJsZSwgY29tcGFyYXRvciwgbWFwcGVyKSB7XG4gICAgaWYgKCFjb21wYXJhdG9yKSB7XG4gICAgICBjb21wYXJhdG9yID0gZGVmYXVsdENvbXBhcmF0b3I7XG4gICAgfVxuICAgIGlmIChtYXBwZXIpIHtcbiAgICAgIHZhciBlbnRyeSA9IGl0ZXJhYmxlLnRvU2VxKClcbiAgICAgICAgLm1hcChmdW5jdGlvbih2LCBrKSAge3JldHVybiBbdiwgbWFwcGVyKHYsIGssIGl0ZXJhYmxlKV19KVxuICAgICAgICAucmVkdWNlKGZ1bmN0aW9uKGEsIGIpICB7cmV0dXJuIG1heENvbXBhcmUoY29tcGFyYXRvciwgYVsxXSwgYlsxXSkgPyBiIDogYX0pO1xuICAgICAgcmV0dXJuIGVudHJ5ICYmIGVudHJ5WzBdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gaXRlcmFibGUucmVkdWNlKGZ1bmN0aW9uKGEsIGIpICB7cmV0dXJuIG1heENvbXBhcmUoY29tcGFyYXRvciwgYSwgYikgPyBiIDogYX0pO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG1heENvbXBhcmUoY29tcGFyYXRvciwgYSwgYikge1xuICAgIHZhciBjb21wID0gY29tcGFyYXRvcihiLCBhKTtcbiAgICAvLyBiIGlzIGNvbnNpZGVyZWQgdGhlIG5ldyBtYXggaWYgdGhlIGNvbXBhcmF0b3IgZGVjbGFyZXMgdGhlbSBlcXVhbCwgYnV0XG4gICAgLy8gdGhleSBhcmUgbm90IGVxdWFsIGFuZCBiIGlzIGluIGZhY3QgYSBudWxsaXNoIHZhbHVlLlxuICAgIHJldHVybiAoY29tcCA9PT0gMCAmJiBiICE9PSBhICYmIChiID09PSB1bmRlZmluZWQgfHwgYiA9PT0gbnVsbCB8fCBiICE9PSBiKSkgfHwgY29tcCA+IDA7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIHppcFdpdGhGYWN0b3J5KGtleUl0ZXIsIHppcHBlciwgaXRlcnMpIHtcbiAgICB2YXIgemlwU2VxdWVuY2UgPSBtYWtlU2VxdWVuY2Uoa2V5SXRlcik7XG4gICAgemlwU2VxdWVuY2Uuc2l6ZSA9IG5ldyBBcnJheVNlcShpdGVycykubWFwKGZ1bmN0aW9uKGkgKSB7cmV0dXJuIGkuc2l6ZX0pLm1pbigpO1xuICAgIC8vIE5vdGU6IHRoaXMgYSBnZW5lcmljIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgX19pdGVyYXRlIGluIHRlcm1zIG9mXG4gICAgLy8gX19pdGVyYXRvciB3aGljaCBtYXkgYmUgbW9yZSBnZW5lcmljYWxseSB1c2VmdWwgaW4gdGhlIGZ1dHVyZS5cbiAgICB6aXBTZXF1ZW5jZS5fX2l0ZXJhdGUgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge1xuICAgICAgLyogZ2VuZXJpYzpcbiAgICAgIHZhciBpdGVyYXRvciA9IHRoaXMuX19pdGVyYXRvcihJVEVSQVRFX0VOVFJJRVMsIHJldmVyc2UpO1xuICAgICAgdmFyIHN0ZXA7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICB3aGlsZSAoIShzdGVwID0gaXRlcmF0b3IubmV4dCgpKS5kb25lKSB7XG4gICAgICAgIGl0ZXJhdGlvbnMrKztcbiAgICAgICAgaWYgKGZuKHN0ZXAudmFsdWVbMV0sIHN0ZXAudmFsdWVbMF0sIHRoaXMpID09PSBmYWxzZSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gaXRlcmF0aW9ucztcbiAgICAgICovXG4gICAgICAvLyBpbmRleGVkOlxuICAgICAgdmFyIGl0ZXJhdG9yID0gdGhpcy5fX2l0ZXJhdG9yKElURVJBVEVfVkFMVUVTLCByZXZlcnNlKTtcbiAgICAgIHZhciBzdGVwO1xuICAgICAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICAgICAgd2hpbGUgKCEoc3RlcCA9IGl0ZXJhdG9yLm5leHQoKSkuZG9uZSkge1xuICAgICAgICBpZiAoZm4oc3RlcC52YWx1ZSwgaXRlcmF0aW9ucysrLCB0aGlzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGl0ZXJhdGlvbnM7XG4gICAgfTtcbiAgICB6aXBTZXF1ZW5jZS5fX2l0ZXJhdG9yVW5jYWNoZWQgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICB2YXIgaXRlcmF0b3JzID0gaXRlcnMubWFwKGZ1bmN0aW9uKGkgKVxuICAgICAgICB7cmV0dXJuIChpID0gSXRlcmFibGUoaSksIGdldEl0ZXJhdG9yKHJldmVyc2UgPyBpLnJldmVyc2UoKSA6IGkpKX1cbiAgICAgICk7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICB2YXIgaXNEb25lID0gZmFsc2U7XG4gICAgICByZXR1cm4gbmV3IEl0ZXJhdG9yKGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgdmFyIHN0ZXBzO1xuICAgICAgICBpZiAoIWlzRG9uZSkge1xuICAgICAgICAgIHN0ZXBzID0gaXRlcmF0b3JzLm1hcChmdW5jdGlvbihpICkge3JldHVybiBpLm5leHQoKX0pO1xuICAgICAgICAgIGlzRG9uZSA9IHN0ZXBzLnNvbWUoZnVuY3Rpb24ocyApIHtyZXR1cm4gcy5kb25lfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzRG9uZSkge1xuICAgICAgICAgIHJldHVybiBpdGVyYXRvckRvbmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaXRlcmF0b3JWYWx1ZShcbiAgICAgICAgICB0eXBlLFxuICAgICAgICAgIGl0ZXJhdGlvbnMrKyxcbiAgICAgICAgICB6aXBwZXIuYXBwbHkobnVsbCwgc3RlcHMubWFwKGZ1bmN0aW9uKHMgKSB7cmV0dXJuIHMudmFsdWV9KSlcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIHppcFNlcXVlbmNlXG4gIH1cblxuXG4gIC8vICNwcmFnbWEgSGVscGVyIEZ1bmN0aW9uc1xuXG4gIGZ1bmN0aW9uIHJlaWZ5KGl0ZXIsIHNlcSkge1xuICAgIHJldHVybiBpc1NlcShpdGVyKSA/IHNlcSA6IGl0ZXIuY29uc3RydWN0b3Ioc2VxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHZhbGlkYXRlRW50cnkoZW50cnkpIHtcbiAgICBpZiAoZW50cnkgIT09IE9iamVjdChlbnRyeSkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFtLLCBWXSB0dXBsZTogJyArIGVudHJ5KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZXNvbHZlU2l6ZShpdGVyKSB7XG4gICAgYXNzZXJ0Tm90SW5maW5pdGUoaXRlci5zaXplKTtcbiAgICByZXR1cm4gZW5zdXJlU2l6ZShpdGVyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGl0ZXJhYmxlQ2xhc3MoaXRlcmFibGUpIHtcbiAgICByZXR1cm4gaXNLZXllZChpdGVyYWJsZSkgPyBLZXllZEl0ZXJhYmxlIDpcbiAgICAgIGlzSW5kZXhlZChpdGVyYWJsZSkgPyBJbmRleGVkSXRlcmFibGUgOlxuICAgICAgU2V0SXRlcmFibGU7XG4gIH1cblxuICBmdW5jdGlvbiBtYWtlU2VxdWVuY2UoaXRlcmFibGUpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShcbiAgICAgIChcbiAgICAgICAgaXNLZXllZChpdGVyYWJsZSkgPyBLZXllZFNlcSA6XG4gICAgICAgIGlzSW5kZXhlZChpdGVyYWJsZSkgPyBJbmRleGVkU2VxIDpcbiAgICAgICAgU2V0U2VxXG4gICAgICApLnByb3RvdHlwZVxuICAgICk7XG4gIH1cblxuICBmdW5jdGlvbiBjYWNoZVJlc3VsdFRocm91Z2goKSB7XG4gICAgaWYgKHRoaXMuX2l0ZXIuY2FjaGVSZXN1bHQpIHtcbiAgICAgIHRoaXMuX2l0ZXIuY2FjaGVSZXN1bHQoKTtcbiAgICAgIHRoaXMuc2l6ZSA9IHRoaXMuX2l0ZXIuc2l6ZTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gU2VxLnByb3RvdHlwZS5jYWNoZVJlc3VsdC5jYWxsKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZmF1bHRDb21wYXJhdG9yKGEsIGIpIHtcbiAgICByZXR1cm4gYSA+IGIgPyAxIDogYSA8IGIgPyAtMSA6IDA7XG4gIH1cblxuICBmdW5jdGlvbiBmb3JjZUl0ZXJhdG9yKGtleVBhdGgpIHtcbiAgICB2YXIgaXRlciA9IGdldEl0ZXJhdG9yKGtleVBhdGgpO1xuICAgIGlmICghaXRlcikge1xuICAgICAgLy8gQXJyYXkgbWlnaHQgbm90IGJlIGl0ZXJhYmxlIGluIHRoaXMgZW52aXJvbm1lbnQsIHNvIHdlIG5lZWQgYSBmYWxsYmFja1xuICAgICAgLy8gdG8gb3VyIHdyYXBwZWQgdHlwZS5cbiAgICAgIGlmICghaXNBcnJheUxpa2Uoa2V5UGF0aCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgaXRlcmFibGUgb3IgYXJyYXktbGlrZTogJyArIGtleVBhdGgpO1xuICAgICAgfVxuICAgICAgaXRlciA9IGdldEl0ZXJhdG9yKEl0ZXJhYmxlKGtleVBhdGgpKTtcbiAgICB9XG4gICAgcmV0dXJuIGl0ZXI7XG4gIH1cblxuICBjcmVhdGVDbGFzcyhSZWNvcmQsIEtleWVkQ29sbGVjdGlvbik7XG5cbiAgICBmdW5jdGlvbiBSZWNvcmQoZGVmYXVsdFZhbHVlcywgbmFtZSkge1xuICAgICAgdmFyIGhhc0luaXRpYWxpemVkO1xuXG4gICAgICB2YXIgUmVjb3JkVHlwZSA9IGZ1bmN0aW9uIFJlY29yZCh2YWx1ZXMpIHtcbiAgICAgICAgaWYgKHZhbHVlcyBpbnN0YW5jZW9mIFJlY29yZFR5cGUpIHtcbiAgICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgICAgICB9XG4gICAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBSZWNvcmRUeXBlKSkge1xuICAgICAgICAgIHJldHVybiBuZXcgUmVjb3JkVHlwZSh2YWx1ZXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaGFzSW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICBoYXNJbml0aWFsaXplZCA9IHRydWU7XG4gICAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhkZWZhdWx0VmFsdWVzKTtcbiAgICAgICAgICBzZXRQcm9wcyhSZWNvcmRUeXBlUHJvdG90eXBlLCBrZXlzKTtcbiAgICAgICAgICBSZWNvcmRUeXBlUHJvdG90eXBlLnNpemUgPSBrZXlzLmxlbmd0aDtcbiAgICAgICAgICBSZWNvcmRUeXBlUHJvdG90eXBlLl9uYW1lID0gbmFtZTtcbiAgICAgICAgICBSZWNvcmRUeXBlUHJvdG90eXBlLl9rZXlzID0ga2V5cztcbiAgICAgICAgICBSZWNvcmRUeXBlUHJvdG90eXBlLl9kZWZhdWx0VmFsdWVzID0gZGVmYXVsdFZhbHVlcztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9tYXAgPSBNYXAodmFsdWVzKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBSZWNvcmRUeXBlUHJvdG90eXBlID0gUmVjb3JkVHlwZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFJlY29yZFByb3RvdHlwZSk7XG4gICAgICBSZWNvcmRUeXBlUHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUmVjb3JkVHlwZTtcblxuICAgICAgcmV0dXJuIFJlY29yZFR5cGU7XG4gICAgfVxuXG4gICAgUmVjb3JkLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX190b1N0cmluZyhyZWNvcmROYW1lKHRoaXMpICsgJyB7JywgJ30nKTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBBY2Nlc3NcblxuICAgIFJlY29yZC5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24oaykge1xuICAgICAgcmV0dXJuIHRoaXMuX2RlZmF1bHRWYWx1ZXMuaGFzT3duUHJvcGVydHkoayk7XG4gICAgfTtcblxuICAgIFJlY29yZC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oaywgbm90U2V0VmFsdWUpIHtcbiAgICAgIGlmICghdGhpcy5oYXMoaykpIHtcbiAgICAgICAgcmV0dXJuIG5vdFNldFZhbHVlO1xuICAgICAgfVxuICAgICAgdmFyIGRlZmF1bHRWYWwgPSB0aGlzLl9kZWZhdWx0VmFsdWVzW2tdO1xuICAgICAgcmV0dXJuIHRoaXMuX21hcCA/IHRoaXMuX21hcC5nZXQoaywgZGVmYXVsdFZhbCkgOiBkZWZhdWx0VmFsO1xuICAgIH07XG5cbiAgICAvLyBAcHJhZ21hIE1vZGlmaWNhdGlvblxuXG4gICAgUmVjb3JkLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuX19vd25lcklEKSB7XG4gICAgICAgIHRoaXMuX21hcCAmJiB0aGlzLl9tYXAuY2xlYXIoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICB2YXIgUmVjb3JkVHlwZSA9IHRoaXMuY29uc3RydWN0b3I7XG4gICAgICByZXR1cm4gUmVjb3JkVHlwZS5fZW1wdHkgfHwgKFJlY29yZFR5cGUuX2VtcHR5ID0gbWFrZVJlY29yZCh0aGlzLCBlbXB0eU1hcCgpKSk7XG4gICAgfTtcblxuICAgIFJlY29yZC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24oaywgdikge1xuICAgICAgaWYgKCF0aGlzLmhhcyhrKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBzZXQgdW5rbm93biBrZXkgXCInICsgayArICdcIiBvbiAnICsgcmVjb3JkTmFtZSh0aGlzKSk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fbWFwICYmICF0aGlzLl9tYXAuaGFzKGspKSB7XG4gICAgICAgIHZhciBkZWZhdWx0VmFsID0gdGhpcy5fZGVmYXVsdFZhbHVlc1trXTtcbiAgICAgICAgaWYgKHYgPT09IGRlZmF1bHRWYWwpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdmFyIG5ld01hcCA9IHRoaXMuX21hcCAmJiB0aGlzLl9tYXAuc2V0KGssIHYpO1xuICAgICAgaWYgKHRoaXMuX19vd25lcklEIHx8IG5ld01hcCA9PT0gdGhpcy5fbWFwKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VSZWNvcmQodGhpcywgbmV3TWFwKTtcbiAgICB9O1xuXG4gICAgUmVjb3JkLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihrKSB7XG4gICAgICBpZiAoIXRoaXMuaGFzKGspKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgdmFyIG5ld01hcCA9IHRoaXMuX21hcCAmJiB0aGlzLl9tYXAucmVtb3ZlKGspO1xuICAgICAgaWYgKHRoaXMuX19vd25lcklEIHx8IG5ld01hcCA9PT0gdGhpcy5fbWFwKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VSZWNvcmQodGhpcywgbmV3TWFwKTtcbiAgICB9O1xuXG4gICAgUmVjb3JkLnByb3RvdHlwZS53YXNBbHRlcmVkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbWFwLndhc0FsdGVyZWQoKTtcbiAgICB9O1xuXG4gICAgUmVjb3JkLnByb3RvdHlwZS5fX2l0ZXJhdG9yID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgcmV0dXJuIEtleWVkSXRlcmFibGUodGhpcy5fZGVmYXVsdFZhbHVlcykubWFwKGZ1bmN0aW9uKF8sIGspICB7cmV0dXJuIHRoaXMkMC5nZXQoayl9KS5fX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpO1xuICAgIH07XG5cbiAgICBSZWNvcmQucHJvdG90eXBlLl9faXRlcmF0ZSA9IGZ1bmN0aW9uKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICByZXR1cm4gS2V5ZWRJdGVyYWJsZSh0aGlzLl9kZWZhdWx0VmFsdWVzKS5tYXAoZnVuY3Rpb24oXywgaykgIHtyZXR1cm4gdGhpcyQwLmdldChrKX0pLl9faXRlcmF0ZShmbiwgcmV2ZXJzZSk7XG4gICAgfTtcblxuICAgIFJlY29yZC5wcm90b3R5cGUuX19lbnN1cmVPd25lciA9IGZ1bmN0aW9uKG93bmVySUQpIHtcbiAgICAgIGlmIChvd25lcklEID09PSB0aGlzLl9fb3duZXJJRCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHZhciBuZXdNYXAgPSB0aGlzLl9tYXAgJiYgdGhpcy5fbWFwLl9fZW5zdXJlT3duZXIob3duZXJJRCk7XG4gICAgICBpZiAoIW93bmVySUQpIHtcbiAgICAgICAgdGhpcy5fX293bmVySUQgPSBvd25lcklEO1xuICAgICAgICB0aGlzLl9tYXAgPSBuZXdNYXA7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VSZWNvcmQodGhpcywgbmV3TWFwLCBvd25lcklEKTtcbiAgICB9O1xuXG5cbiAgdmFyIFJlY29yZFByb3RvdHlwZSA9IFJlY29yZC5wcm90b3R5cGU7XG4gIFJlY29yZFByb3RvdHlwZVtERUxFVEVdID0gUmVjb3JkUHJvdG90eXBlLnJlbW92ZTtcbiAgUmVjb3JkUHJvdG90eXBlLmRlbGV0ZUluID1cbiAgUmVjb3JkUHJvdG90eXBlLnJlbW92ZUluID0gTWFwUHJvdG90eXBlLnJlbW92ZUluO1xuICBSZWNvcmRQcm90b3R5cGUubWVyZ2UgPSBNYXBQcm90b3R5cGUubWVyZ2U7XG4gIFJlY29yZFByb3RvdHlwZS5tZXJnZVdpdGggPSBNYXBQcm90b3R5cGUubWVyZ2VXaXRoO1xuICBSZWNvcmRQcm90b3R5cGUubWVyZ2VJbiA9IE1hcFByb3RvdHlwZS5tZXJnZUluO1xuICBSZWNvcmRQcm90b3R5cGUubWVyZ2VEZWVwID0gTWFwUHJvdG90eXBlLm1lcmdlRGVlcDtcbiAgUmVjb3JkUHJvdG90eXBlLm1lcmdlRGVlcFdpdGggPSBNYXBQcm90b3R5cGUubWVyZ2VEZWVwV2l0aDtcbiAgUmVjb3JkUHJvdG90eXBlLm1lcmdlRGVlcEluID0gTWFwUHJvdG90eXBlLm1lcmdlRGVlcEluO1xuICBSZWNvcmRQcm90b3R5cGUuc2V0SW4gPSBNYXBQcm90b3R5cGUuc2V0SW47XG4gIFJlY29yZFByb3RvdHlwZS51cGRhdGUgPSBNYXBQcm90b3R5cGUudXBkYXRlO1xuICBSZWNvcmRQcm90b3R5cGUudXBkYXRlSW4gPSBNYXBQcm90b3R5cGUudXBkYXRlSW47XG4gIFJlY29yZFByb3RvdHlwZS53aXRoTXV0YXRpb25zID0gTWFwUHJvdG90eXBlLndpdGhNdXRhdGlvbnM7XG4gIFJlY29yZFByb3RvdHlwZS5hc011dGFibGUgPSBNYXBQcm90b3R5cGUuYXNNdXRhYmxlO1xuICBSZWNvcmRQcm90b3R5cGUuYXNJbW11dGFibGUgPSBNYXBQcm90b3R5cGUuYXNJbW11dGFibGU7XG5cblxuICBmdW5jdGlvbiBtYWtlUmVjb3JkKGxpa2VSZWNvcmQsIG1hcCwgb3duZXJJRCkge1xuICAgIHZhciByZWNvcmQgPSBPYmplY3QuY3JlYXRlKE9iamVjdC5nZXRQcm90b3R5cGVPZihsaWtlUmVjb3JkKSk7XG4gICAgcmVjb3JkLl9tYXAgPSBtYXA7XG4gICAgcmVjb3JkLl9fb3duZXJJRCA9IG93bmVySUQ7XG4gICAgcmV0dXJuIHJlY29yZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlY29yZE5hbWUocmVjb3JkKSB7XG4gICAgcmV0dXJuIHJlY29yZC5fbmFtZSB8fCByZWNvcmQuY29uc3RydWN0b3IubmFtZSB8fCAnUmVjb3JkJztcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFByb3BzKHByb3RvdHlwZSwgbmFtZXMpIHtcbiAgICB0cnkge1xuICAgICAgbmFtZXMuZm9yRWFjaChzZXRQcm9wLmJpbmQodW5kZWZpbmVkLCBwcm90b3R5cGUpKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgLy8gT2JqZWN0LmRlZmluZVByb3BlcnR5IGZhaWxlZC4gUHJvYmFibHkgSUU4LlxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFByb3AocHJvdG90eXBlLCBuYW1lKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvdHlwZSwgbmFtZSwge1xuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0KG5hbWUpO1xuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgaW52YXJpYW50KHRoaXMuX19vd25lcklELCAnQ2Fubm90IHNldCBvbiBhbiBpbW11dGFibGUgcmVjb3JkLicpO1xuICAgICAgICB0aGlzLnNldChuYW1lLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBjcmVhdGVDbGFzcyhTZXQsIFNldENvbGxlY3Rpb24pO1xuXG4gICAgLy8gQHByYWdtYSBDb25zdHJ1Y3Rpb25cblxuICAgIGZ1bmN0aW9uIFNldCh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQgPyBlbXB0eVNldCgpIDpcbiAgICAgICAgaXNTZXQodmFsdWUpICYmICFpc09yZGVyZWQodmFsdWUpID8gdmFsdWUgOlxuICAgICAgICBlbXB0eVNldCgpLndpdGhNdXRhdGlvbnMoZnVuY3Rpb24oc2V0ICkge1xuICAgICAgICAgIHZhciBpdGVyID0gU2V0SXRlcmFibGUodmFsdWUpO1xuICAgICAgICAgIGFzc2VydE5vdEluZmluaXRlKGl0ZXIuc2l6ZSk7XG4gICAgICAgICAgaXRlci5mb3JFYWNoKGZ1bmN0aW9uKHYgKSB7cmV0dXJuIHNldC5hZGQodil9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgU2V0Lm9mID0gZnVuY3Rpb24oLyouLi52YWx1ZXMqLykge1xuICAgICAgcmV0dXJuIHRoaXMoYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gICAgU2V0LmZyb21LZXlzID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzKEtleWVkSXRlcmFibGUodmFsdWUpLmtleVNlcSgpKTtcbiAgICB9O1xuXG4gICAgU2V0LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX190b1N0cmluZygnU2V0IHsnLCAnfScpO1xuICAgIH07XG5cbiAgICAvLyBAcHJhZ21hIEFjY2Vzc1xuXG4gICAgU2V0LnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuX21hcC5oYXModmFsdWUpO1xuICAgIH07XG5cbiAgICAvLyBAcHJhZ21hIE1vZGlmaWNhdGlvblxuXG4gICAgU2V0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHVwZGF0ZVNldCh0aGlzLCB0aGlzLl9tYXAuc2V0KHZhbHVlLCB0cnVlKSk7XG4gICAgfTtcblxuICAgIFNldC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB1cGRhdGVTZXQodGhpcywgdGhpcy5fbWFwLnJlbW92ZSh2YWx1ZSkpO1xuICAgIH07XG5cbiAgICBTZXQucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdXBkYXRlU2V0KHRoaXMsIHRoaXMuX21hcC5jbGVhcigpKTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBDb21wb3NpdGlvblxuXG4gICAgU2V0LnByb3RvdHlwZS51bmlvbiA9IGZ1bmN0aW9uKCkge3ZhciBpdGVycyA9IFNMSUNFJDAuY2FsbChhcmd1bWVudHMsIDApO1xuICAgICAgaXRlcnMgPSBpdGVycy5maWx0ZXIoZnVuY3Rpb24oeCApIHtyZXR1cm4geC5zaXplICE9PSAwfSk7XG4gICAgICBpZiAoaXRlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuc2l6ZSA9PT0gMCAmJiAhdGhpcy5fX293bmVySUQgJiYgaXRlcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yKGl0ZXJzWzBdKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLndpdGhNdXRhdGlvbnMoZnVuY3Rpb24oc2V0ICkge1xuICAgICAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgaXRlcnMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgU2V0SXRlcmFibGUoaXRlcnNbaWldKS5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlICkge3JldHVybiBzZXQuYWRkKHZhbHVlKX0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgU2V0LnByb3RvdHlwZS5pbnRlcnNlY3QgPSBmdW5jdGlvbigpIHt2YXIgaXRlcnMgPSBTTElDRSQwLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICAgIGlmIChpdGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICBpdGVycyA9IGl0ZXJzLm1hcChmdW5jdGlvbihpdGVyICkge3JldHVybiBTZXRJdGVyYWJsZShpdGVyKX0pO1xuICAgICAgdmFyIG9yaWdpbmFsU2V0ID0gdGhpcztcbiAgICAgIHJldHVybiB0aGlzLndpdGhNdXRhdGlvbnMoZnVuY3Rpb24oc2V0ICkge1xuICAgICAgICBvcmlnaW5hbFNldC5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlICkge1xuICAgICAgICAgIGlmICghaXRlcnMuZXZlcnkoZnVuY3Rpb24oaXRlciApIHtyZXR1cm4gaXRlci5pbmNsdWRlcyh2YWx1ZSl9KSkge1xuICAgICAgICAgICAgc2V0LnJlbW92ZSh2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBTZXQucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24oKSB7dmFyIGl0ZXJzID0gU0xJQ0UkMC5jYWxsKGFyZ3VtZW50cywgMCk7XG4gICAgICBpZiAoaXRlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgaXRlcnMgPSBpdGVycy5tYXAoZnVuY3Rpb24oaXRlciApIHtyZXR1cm4gU2V0SXRlcmFibGUoaXRlcil9KTtcbiAgICAgIHZhciBvcmlnaW5hbFNldCA9IHRoaXM7XG4gICAgICByZXR1cm4gdGhpcy53aXRoTXV0YXRpb25zKGZ1bmN0aW9uKHNldCApIHtcbiAgICAgICAgb3JpZ2luYWxTZXQuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSApIHtcbiAgICAgICAgICBpZiAoaXRlcnMuc29tZShmdW5jdGlvbihpdGVyICkge3JldHVybiBpdGVyLmluY2x1ZGVzKHZhbHVlKX0pKSB7XG4gICAgICAgICAgICBzZXQucmVtb3ZlKHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIFNldC5wcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnVuaW9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAgIFNldC5wcm90b3R5cGUubWVyZ2VXaXRoID0gZnVuY3Rpb24obWVyZ2VyKSB7dmFyIGl0ZXJzID0gU0xJQ0UkMC5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICByZXR1cm4gdGhpcy51bmlvbi5hcHBseSh0aGlzLCBpdGVycyk7XG4gICAgfTtcblxuICAgIFNldC5wcm90b3R5cGUuc29ydCA9IGZ1bmN0aW9uKGNvbXBhcmF0b3IpIHtcbiAgICAgIC8vIExhdGUgYmluZGluZ1xuICAgICAgcmV0dXJuIE9yZGVyZWRTZXQoc29ydEZhY3RvcnkodGhpcywgY29tcGFyYXRvcikpO1xuICAgIH07XG5cbiAgICBTZXQucHJvdG90eXBlLnNvcnRCeSA9IGZ1bmN0aW9uKG1hcHBlciwgY29tcGFyYXRvcikge1xuICAgICAgLy8gTGF0ZSBiaW5kaW5nXG4gICAgICByZXR1cm4gT3JkZXJlZFNldChzb3J0RmFjdG9yeSh0aGlzLCBjb21wYXJhdG9yLCBtYXBwZXIpKTtcbiAgICB9O1xuXG4gICAgU2V0LnByb3RvdHlwZS53YXNBbHRlcmVkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbWFwLndhc0FsdGVyZWQoKTtcbiAgICB9O1xuXG4gICAgU2V0LnByb3RvdHlwZS5fX2l0ZXJhdGUgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgcmV0dXJuIHRoaXMuX21hcC5fX2l0ZXJhdGUoZnVuY3Rpb24oXywgaykgIHtyZXR1cm4gZm4oaywgaywgdGhpcyQwKX0sIHJldmVyc2UpO1xuICAgIH07XG5cbiAgICBTZXQucHJvdG90eXBlLl9faXRlcmF0b3IgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbWFwLm1hcChmdW5jdGlvbihfLCBrKSAge3JldHVybiBrfSkuX19pdGVyYXRvcih0eXBlLCByZXZlcnNlKTtcbiAgICB9O1xuXG4gICAgU2V0LnByb3RvdHlwZS5fX2Vuc3VyZU93bmVyID0gZnVuY3Rpb24ob3duZXJJRCkge1xuICAgICAgaWYgKG93bmVySUQgPT09IHRoaXMuX19vd25lcklEKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgdmFyIG5ld01hcCA9IHRoaXMuX21hcC5fX2Vuc3VyZU93bmVyKG93bmVySUQpO1xuICAgICAgaWYgKCFvd25lcklEKSB7XG4gICAgICAgIHRoaXMuX19vd25lcklEID0gb3duZXJJRDtcbiAgICAgICAgdGhpcy5fbWFwID0gbmV3TWFwO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9fbWFrZShuZXdNYXAsIG93bmVySUQpO1xuICAgIH07XG5cblxuICBmdW5jdGlvbiBpc1NldChtYXliZVNldCkge1xuICAgIHJldHVybiAhIShtYXliZVNldCAmJiBtYXliZVNldFtJU19TRVRfU0VOVElORUxdKTtcbiAgfVxuXG4gIFNldC5pc1NldCA9IGlzU2V0O1xuXG4gIHZhciBJU19TRVRfU0VOVElORUwgPSAnQEBfX0lNTVVUQUJMRV9TRVRfX0BAJztcblxuICB2YXIgU2V0UHJvdG90eXBlID0gU2V0LnByb3RvdHlwZTtcbiAgU2V0UHJvdG90eXBlW0lTX1NFVF9TRU5USU5FTF0gPSB0cnVlO1xuICBTZXRQcm90b3R5cGVbREVMRVRFXSA9IFNldFByb3RvdHlwZS5yZW1vdmU7XG4gIFNldFByb3RvdHlwZS5tZXJnZURlZXAgPSBTZXRQcm90b3R5cGUubWVyZ2U7XG4gIFNldFByb3RvdHlwZS5tZXJnZURlZXBXaXRoID0gU2V0UHJvdG90eXBlLm1lcmdlV2l0aDtcbiAgU2V0UHJvdG90eXBlLndpdGhNdXRhdGlvbnMgPSBNYXBQcm90b3R5cGUud2l0aE11dGF0aW9ucztcbiAgU2V0UHJvdG90eXBlLmFzTXV0YWJsZSA9IE1hcFByb3RvdHlwZS5hc011dGFibGU7XG4gIFNldFByb3RvdHlwZS5hc0ltbXV0YWJsZSA9IE1hcFByb3RvdHlwZS5hc0ltbXV0YWJsZTtcblxuICBTZXRQcm90b3R5cGUuX19lbXB0eSA9IGVtcHR5U2V0O1xuICBTZXRQcm90b3R5cGUuX19tYWtlID0gbWFrZVNldDtcblxuICBmdW5jdGlvbiB1cGRhdGVTZXQoc2V0LCBuZXdNYXApIHtcbiAgICBpZiAoc2V0Ll9fb3duZXJJRCkge1xuICAgICAgc2V0LnNpemUgPSBuZXdNYXAuc2l6ZTtcbiAgICAgIHNldC5fbWFwID0gbmV3TWFwO1xuICAgICAgcmV0dXJuIHNldDtcbiAgICB9XG4gICAgcmV0dXJuIG5ld01hcCA9PT0gc2V0Ll9tYXAgPyBzZXQgOlxuICAgICAgbmV3TWFwLnNpemUgPT09IDAgPyBzZXQuX19lbXB0eSgpIDpcbiAgICAgIHNldC5fX21ha2UobmV3TWFwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1ha2VTZXQobWFwLCBvd25lcklEKSB7XG4gICAgdmFyIHNldCA9IE9iamVjdC5jcmVhdGUoU2V0UHJvdG90eXBlKTtcbiAgICBzZXQuc2l6ZSA9IG1hcCA/IG1hcC5zaXplIDogMDtcbiAgICBzZXQuX21hcCA9IG1hcDtcbiAgICBzZXQuX19vd25lcklEID0gb3duZXJJRDtcbiAgICByZXR1cm4gc2V0O1xuICB9XG5cbiAgdmFyIEVNUFRZX1NFVDtcbiAgZnVuY3Rpb24gZW1wdHlTZXQoKSB7XG4gICAgcmV0dXJuIEVNUFRZX1NFVCB8fCAoRU1QVFlfU0VUID0gbWFrZVNldChlbXB0eU1hcCgpKSk7XG4gIH1cblxuICBjcmVhdGVDbGFzcyhPcmRlcmVkU2V0LCBTZXQpO1xuXG4gICAgLy8gQHByYWdtYSBDb25zdHJ1Y3Rpb25cblxuICAgIGZ1bmN0aW9uIE9yZGVyZWRTZXQodmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gZW1wdHlPcmRlcmVkU2V0KCkgOlxuICAgICAgICBpc09yZGVyZWRTZXQodmFsdWUpID8gdmFsdWUgOlxuICAgICAgICBlbXB0eU9yZGVyZWRTZXQoKS53aXRoTXV0YXRpb25zKGZ1bmN0aW9uKHNldCApIHtcbiAgICAgICAgICB2YXIgaXRlciA9IFNldEl0ZXJhYmxlKHZhbHVlKTtcbiAgICAgICAgICBhc3NlcnROb3RJbmZpbml0ZShpdGVyLnNpemUpO1xuICAgICAgICAgIGl0ZXIuZm9yRWFjaChmdW5jdGlvbih2ICkge3JldHVybiBzZXQuYWRkKHYpfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIE9yZGVyZWRTZXQub2YgPSBmdW5jdGlvbigvKi4uLnZhbHVlcyovKSB7XG4gICAgICByZXR1cm4gdGhpcyhhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBPcmRlcmVkU2V0LmZyb21LZXlzID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzKEtleWVkSXRlcmFibGUodmFsdWUpLmtleVNlcSgpKTtcbiAgICB9O1xuXG4gICAgT3JkZXJlZFNldC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fdG9TdHJpbmcoJ09yZGVyZWRTZXQgeycsICd9Jyk7XG4gICAgfTtcblxuXG4gIGZ1bmN0aW9uIGlzT3JkZXJlZFNldChtYXliZU9yZGVyZWRTZXQpIHtcbiAgICByZXR1cm4gaXNTZXQobWF5YmVPcmRlcmVkU2V0KSAmJiBpc09yZGVyZWQobWF5YmVPcmRlcmVkU2V0KTtcbiAgfVxuXG4gIE9yZGVyZWRTZXQuaXNPcmRlcmVkU2V0ID0gaXNPcmRlcmVkU2V0O1xuXG4gIHZhciBPcmRlcmVkU2V0UHJvdG90eXBlID0gT3JkZXJlZFNldC5wcm90b3R5cGU7XG4gIE9yZGVyZWRTZXRQcm90b3R5cGVbSVNfT1JERVJFRF9TRU5USU5FTF0gPSB0cnVlO1xuXG4gIE9yZGVyZWRTZXRQcm90b3R5cGUuX19lbXB0eSA9IGVtcHR5T3JkZXJlZFNldDtcbiAgT3JkZXJlZFNldFByb3RvdHlwZS5fX21ha2UgPSBtYWtlT3JkZXJlZFNldDtcblxuICBmdW5jdGlvbiBtYWtlT3JkZXJlZFNldChtYXAsIG93bmVySUQpIHtcbiAgICB2YXIgc2V0ID0gT2JqZWN0LmNyZWF0ZShPcmRlcmVkU2V0UHJvdG90eXBlKTtcbiAgICBzZXQuc2l6ZSA9IG1hcCA/IG1hcC5zaXplIDogMDtcbiAgICBzZXQuX21hcCA9IG1hcDtcbiAgICBzZXQuX19vd25lcklEID0gb3duZXJJRDtcbiAgICByZXR1cm4gc2V0O1xuICB9XG5cbiAgdmFyIEVNUFRZX09SREVSRURfU0VUO1xuICBmdW5jdGlvbiBlbXB0eU9yZGVyZWRTZXQoKSB7XG4gICAgcmV0dXJuIEVNUFRZX09SREVSRURfU0VUIHx8IChFTVBUWV9PUkRFUkVEX1NFVCA9IG1ha2VPcmRlcmVkU2V0KGVtcHR5T3JkZXJlZE1hcCgpKSk7XG4gIH1cblxuICBjcmVhdGVDbGFzcyhTdGFjaywgSW5kZXhlZENvbGxlY3Rpb24pO1xuXG4gICAgLy8gQHByYWdtYSBDb25zdHJ1Y3Rpb25cblxuICAgIGZ1bmN0aW9uIFN0YWNrKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCA/IGVtcHR5U3RhY2soKSA6XG4gICAgICAgIGlzU3RhY2sodmFsdWUpID8gdmFsdWUgOlxuICAgICAgICBlbXB0eVN0YWNrKCkudW5zaGlmdEFsbCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgU3RhY2sub2YgPSBmdW5jdGlvbigvKi4uLnZhbHVlcyovKSB7XG4gICAgICByZXR1cm4gdGhpcyhhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBTdGFjay5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fdG9TdHJpbmcoJ1N0YWNrIFsnLCAnXScpO1xuICAgIH07XG5cbiAgICAvLyBAcHJhZ21hIEFjY2Vzc1xuXG4gICAgU3RhY2sucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGluZGV4LCBub3RTZXRWYWx1ZSkge1xuICAgICAgdmFyIGhlYWQgPSB0aGlzLl9oZWFkO1xuICAgICAgaW5kZXggPSB3cmFwSW5kZXgodGhpcywgaW5kZXgpO1xuICAgICAgd2hpbGUgKGhlYWQgJiYgaW5kZXgtLSkge1xuICAgICAgICBoZWFkID0gaGVhZC5uZXh0O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGhlYWQgPyBoZWFkLnZhbHVlIDogbm90U2V0VmFsdWU7XG4gICAgfTtcblxuICAgIFN0YWNrLnByb3RvdHlwZS5wZWVrID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5faGVhZCAmJiB0aGlzLl9oZWFkLnZhbHVlO1xuICAgIH07XG5cbiAgICAvLyBAcHJhZ21hIE1vZGlmaWNhdGlvblxuXG4gICAgU3RhY2sucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbigvKi4uLnZhbHVlcyovKSB7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHZhciBuZXdTaXplID0gdGhpcy5zaXplICsgYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgIHZhciBoZWFkID0gdGhpcy5faGVhZDtcbiAgICAgIGZvciAodmFyIGlpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGlpID49IDA7IGlpLS0pIHtcbiAgICAgICAgaGVhZCA9IHtcbiAgICAgICAgICB2YWx1ZTogYXJndW1lbnRzW2lpXSxcbiAgICAgICAgICBuZXh0OiBoZWFkXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fX293bmVySUQpIHtcbiAgICAgICAgdGhpcy5zaXplID0gbmV3U2l6ZTtcbiAgICAgICAgdGhpcy5faGVhZCA9IGhlYWQ7XG4gICAgICAgIHRoaXMuX19oYXNoID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl9fYWx0ZXJlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VTdGFjayhuZXdTaXplLCBoZWFkKTtcbiAgICB9O1xuXG4gICAgU3RhY2sucHJvdG90eXBlLnB1c2hBbGwgPSBmdW5jdGlvbihpdGVyKSB7XG4gICAgICBpdGVyID0gSW5kZXhlZEl0ZXJhYmxlKGl0ZXIpO1xuICAgICAgaWYgKGl0ZXIuc2l6ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIGFzc2VydE5vdEluZmluaXRlKGl0ZXIuc2l6ZSk7XG4gICAgICB2YXIgbmV3U2l6ZSA9IHRoaXMuc2l6ZTtcbiAgICAgIHZhciBoZWFkID0gdGhpcy5faGVhZDtcbiAgICAgIGl0ZXIucmV2ZXJzZSgpLmZvckVhY2goZnVuY3Rpb24odmFsdWUgKSB7XG4gICAgICAgIG5ld1NpemUrKztcbiAgICAgICAgaGVhZCA9IHtcbiAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgbmV4dDogaGVhZFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgICBpZiAodGhpcy5fX293bmVySUQpIHtcbiAgICAgICAgdGhpcy5zaXplID0gbmV3U2l6ZTtcbiAgICAgICAgdGhpcy5faGVhZCA9IGhlYWQ7XG4gICAgICAgIHRoaXMuX19oYXNoID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl9fYWx0ZXJlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VTdGFjayhuZXdTaXplLCBoZWFkKTtcbiAgICB9O1xuXG4gICAgU3RhY2sucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuc2xpY2UoMSk7XG4gICAgfTtcblxuICAgIFN0YWNrLnByb3RvdHlwZS51bnNoaWZ0ID0gZnVuY3Rpb24oLyouLi52YWx1ZXMqLykge1xuICAgICAgcmV0dXJuIHRoaXMucHVzaC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBTdGFjay5wcm90b3R5cGUudW5zaGlmdEFsbCA9IGZ1bmN0aW9uKGl0ZXIpIHtcbiAgICAgIHJldHVybiB0aGlzLnB1c2hBbGwoaXRlcik7XG4gICAgfTtcblxuICAgIFN0YWNrLnByb3RvdHlwZS5zaGlmdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMucG9wLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAgIFN0YWNrLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuc2l6ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9fb3duZXJJRCkge1xuICAgICAgICB0aGlzLnNpemUgPSAwO1xuICAgICAgICB0aGlzLl9oZWFkID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl9faGFzaCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5fX2FsdGVyZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbXB0eVN0YWNrKCk7XG4gICAgfTtcblxuICAgIFN0YWNrLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uKGJlZ2luLCBlbmQpIHtcbiAgICAgIGlmICh3aG9sZVNsaWNlKGJlZ2luLCBlbmQsIHRoaXMuc2l6ZSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICB2YXIgcmVzb2x2ZWRCZWdpbiA9IHJlc29sdmVCZWdpbihiZWdpbiwgdGhpcy5zaXplKTtcbiAgICAgIHZhciByZXNvbHZlZEVuZCA9IHJlc29sdmVFbmQoZW5kLCB0aGlzLnNpemUpO1xuICAgICAgaWYgKHJlc29sdmVkRW5kICE9PSB0aGlzLnNpemUpIHtcbiAgICAgICAgLy8gc3VwZXIuc2xpY2UoYmVnaW4sIGVuZCk7XG4gICAgICAgIHJldHVybiBJbmRleGVkQ29sbGVjdGlvbi5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLCBiZWdpbiwgZW5kKTtcbiAgICAgIH1cbiAgICAgIHZhciBuZXdTaXplID0gdGhpcy5zaXplIC0gcmVzb2x2ZWRCZWdpbjtcbiAgICAgIHZhciBoZWFkID0gdGhpcy5faGVhZDtcbiAgICAgIHdoaWxlIChyZXNvbHZlZEJlZ2luLS0pIHtcbiAgICAgICAgaGVhZCA9IGhlYWQubmV4dDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9fb3duZXJJRCkge1xuICAgICAgICB0aGlzLnNpemUgPSBuZXdTaXplO1xuICAgICAgICB0aGlzLl9oZWFkID0gaGVhZDtcbiAgICAgICAgdGhpcy5fX2hhc2ggPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX19hbHRlcmVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gbWFrZVN0YWNrKG5ld1NpemUsIGhlYWQpO1xuICAgIH07XG5cbiAgICAvLyBAcHJhZ21hIE11dGFiaWxpdHlcblxuICAgIFN0YWNrLnByb3RvdHlwZS5fX2Vuc3VyZU93bmVyID0gZnVuY3Rpb24ob3duZXJJRCkge1xuICAgICAgaWYgKG93bmVySUQgPT09IHRoaXMuX19vd25lcklEKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgaWYgKCFvd25lcklEKSB7XG4gICAgICAgIHRoaXMuX19vd25lcklEID0gb3duZXJJRDtcbiAgICAgICAgdGhpcy5fX2FsdGVyZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gbWFrZVN0YWNrKHRoaXMuc2l6ZSwgdGhpcy5faGVhZCwgb3duZXJJRCwgdGhpcy5fX2hhc2gpO1xuICAgIH07XG5cbiAgICAvLyBAcHJhZ21hIEl0ZXJhdGlvblxuXG4gICAgU3RhY2sucHJvdG90eXBlLl9faXRlcmF0ZSA9IGZ1bmN0aW9uKGZuLCByZXZlcnNlKSB7XG4gICAgICBpZiAocmV2ZXJzZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZXZlcnNlKCkuX19pdGVyYXRlKGZuKTtcbiAgICAgIH1cbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHZhciBub2RlID0gdGhpcy5faGVhZDtcbiAgICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmIChmbihub2RlLnZhbHVlLCBpdGVyYXRpb25zKyssIHRoaXMpID09PSBmYWxzZSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLm5leHQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gaXRlcmF0aW9ucztcbiAgICB9O1xuXG4gICAgU3RhY2sucHJvdG90eXBlLl9faXRlcmF0b3IgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICBpZiAocmV2ZXJzZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZXZlcnNlKCkuX19pdGVyYXRvcih0eXBlKTtcbiAgICAgIH1cbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHZhciBub2RlID0gdGhpcy5faGVhZDtcbiAgICAgIHJldHVybiBuZXcgSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgIHZhciB2YWx1ZSA9IG5vZGUudmFsdWU7XG4gICAgICAgICAgbm9kZSA9IG5vZGUubmV4dDtcbiAgICAgICAgICByZXR1cm4gaXRlcmF0b3JWYWx1ZSh0eXBlLCBpdGVyYXRpb25zKyssIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaXRlcmF0b3JEb25lKCk7XG4gICAgICB9KTtcbiAgICB9O1xuXG5cbiAgZnVuY3Rpb24gaXNTdGFjayhtYXliZVN0YWNrKSB7XG4gICAgcmV0dXJuICEhKG1heWJlU3RhY2sgJiYgbWF5YmVTdGFja1tJU19TVEFDS19TRU5USU5FTF0pO1xuICB9XG5cbiAgU3RhY2suaXNTdGFjayA9IGlzU3RhY2s7XG5cbiAgdmFyIElTX1NUQUNLX1NFTlRJTkVMID0gJ0BAX19JTU1VVEFCTEVfU1RBQ0tfX0BAJztcblxuICB2YXIgU3RhY2tQcm90b3R5cGUgPSBTdGFjay5wcm90b3R5cGU7XG4gIFN0YWNrUHJvdG90eXBlW0lTX1NUQUNLX1NFTlRJTkVMXSA9IHRydWU7XG4gIFN0YWNrUHJvdG90eXBlLndpdGhNdXRhdGlvbnMgPSBNYXBQcm90b3R5cGUud2l0aE11dGF0aW9ucztcbiAgU3RhY2tQcm90b3R5cGUuYXNNdXRhYmxlID0gTWFwUHJvdG90eXBlLmFzTXV0YWJsZTtcbiAgU3RhY2tQcm90b3R5cGUuYXNJbW11dGFibGUgPSBNYXBQcm90b3R5cGUuYXNJbW11dGFibGU7XG4gIFN0YWNrUHJvdG90eXBlLndhc0FsdGVyZWQgPSBNYXBQcm90b3R5cGUud2FzQWx0ZXJlZDtcblxuXG4gIGZ1bmN0aW9uIG1ha2VTdGFjayhzaXplLCBoZWFkLCBvd25lcklELCBoYXNoKSB7XG4gICAgdmFyIG1hcCA9IE9iamVjdC5jcmVhdGUoU3RhY2tQcm90b3R5cGUpO1xuICAgIG1hcC5zaXplID0gc2l6ZTtcbiAgICBtYXAuX2hlYWQgPSBoZWFkO1xuICAgIG1hcC5fX293bmVySUQgPSBvd25lcklEO1xuICAgIG1hcC5fX2hhc2ggPSBoYXNoO1xuICAgIG1hcC5fX2FsdGVyZWQgPSBmYWxzZTtcbiAgICByZXR1cm4gbWFwO1xuICB9XG5cbiAgdmFyIEVNUFRZX1NUQUNLO1xuICBmdW5jdGlvbiBlbXB0eVN0YWNrKCkge1xuICAgIHJldHVybiBFTVBUWV9TVEFDSyB8fCAoRU1QVFlfU1RBQ0sgPSBtYWtlU3RhY2soMCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnRyaWJ1dGVzIGFkZGl0aW9uYWwgbWV0aG9kcyB0byBhIGNvbnN0cnVjdG9yXG4gICAqL1xuICBmdW5jdGlvbiBtaXhpbihjdG9yLCBtZXRob2RzKSB7XG4gICAgdmFyIGtleUNvcGllciA9IGZ1bmN0aW9uKGtleSApIHsgY3Rvci5wcm90b3R5cGVba2V5XSA9IG1ldGhvZHNba2V5XTsgfTtcbiAgICBPYmplY3Qua2V5cyhtZXRob2RzKS5mb3JFYWNoKGtleUNvcGllcik7XG4gICAgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyAmJlxuICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhtZXRob2RzKS5mb3JFYWNoKGtleUNvcGllcik7XG4gICAgcmV0dXJuIGN0b3I7XG4gIH1cblxuICBJdGVyYWJsZS5JdGVyYXRvciA9IEl0ZXJhdG9yO1xuXG4gIG1peGluKEl0ZXJhYmxlLCB7XG5cbiAgICAvLyAjIyMgQ29udmVyc2lvbiB0byBvdGhlciB0eXBlc1xuXG4gICAgdG9BcnJheTogZnVuY3Rpb24oKSB7XG4gICAgICBhc3NlcnROb3RJbmZpbml0ZSh0aGlzLnNpemUpO1xuICAgICAgdmFyIGFycmF5ID0gbmV3IEFycmF5KHRoaXMuc2l6ZSB8fCAwKTtcbiAgICAgIHRoaXMudmFsdWVTZXEoKS5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaSkgIHsgYXJyYXlbaV0gPSB2OyB9KTtcbiAgICAgIHJldHVybiBhcnJheTtcbiAgICB9LFxuXG4gICAgdG9JbmRleGVkU2VxOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgVG9JbmRleGVkU2VxdWVuY2UodGhpcyk7XG4gICAgfSxcblxuICAgIHRvSlM6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudG9TZXEoKS5tYXAoXG4gICAgICAgIGZ1bmN0aW9uKHZhbHVlICkge3JldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUudG9KUyA9PT0gJ2Z1bmN0aW9uJyA/IHZhbHVlLnRvSlMoKSA6IHZhbHVlfVxuICAgICAgKS5fX3RvSlMoKTtcbiAgICB9LFxuXG4gICAgdG9KU09OOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnRvU2VxKCkubWFwKFxuICAgICAgICBmdW5jdGlvbih2YWx1ZSApIHtyZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlLnRvSlNPTiA9PT0gJ2Z1bmN0aW9uJyA/IHZhbHVlLnRvSlNPTigpIDogdmFsdWV9XG4gICAgICApLl9fdG9KUygpO1xuICAgIH0sXG5cbiAgICB0b0tleWVkU2VxOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgVG9LZXllZFNlcXVlbmNlKHRoaXMsIHRydWUpO1xuICAgIH0sXG5cbiAgICB0b01hcDogZnVuY3Rpb24oKSB7XG4gICAgICAvLyBVc2UgTGF0ZSBCaW5kaW5nIGhlcmUgdG8gc29sdmUgdGhlIGNpcmN1bGFyIGRlcGVuZGVuY3kuXG4gICAgICByZXR1cm4gTWFwKHRoaXMudG9LZXllZFNlcSgpKTtcbiAgICB9LFxuXG4gICAgdG9PYmplY3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgYXNzZXJ0Tm90SW5maW5pdGUodGhpcy5zaXplKTtcbiAgICAgIHZhciBvYmplY3QgPSB7fTtcbiAgICAgIHRoaXMuX19pdGVyYXRlKGZ1bmN0aW9uKHYsIGspICB7IG9iamVjdFtrXSA9IHY7IH0pO1xuICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICB9LFxuXG4gICAgdG9PcmRlcmVkTWFwOiBmdW5jdGlvbigpIHtcbiAgICAgIC8vIFVzZSBMYXRlIEJpbmRpbmcgaGVyZSB0byBzb2x2ZSB0aGUgY2lyY3VsYXIgZGVwZW5kZW5jeS5cbiAgICAgIHJldHVybiBPcmRlcmVkTWFwKHRoaXMudG9LZXllZFNlcSgpKTtcbiAgICB9LFxuXG4gICAgdG9PcmRlcmVkU2V0OiBmdW5jdGlvbigpIHtcbiAgICAgIC8vIFVzZSBMYXRlIEJpbmRpbmcgaGVyZSB0byBzb2x2ZSB0aGUgY2lyY3VsYXIgZGVwZW5kZW5jeS5cbiAgICAgIHJldHVybiBPcmRlcmVkU2V0KGlzS2V5ZWQodGhpcykgPyB0aGlzLnZhbHVlU2VxKCkgOiB0aGlzKTtcbiAgICB9LFxuXG4gICAgdG9TZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gVXNlIExhdGUgQmluZGluZyBoZXJlIHRvIHNvbHZlIHRoZSBjaXJjdWxhciBkZXBlbmRlbmN5LlxuICAgICAgcmV0dXJuIFNldChpc0tleWVkKHRoaXMpID8gdGhpcy52YWx1ZVNlcSgpIDogdGhpcyk7XG4gICAgfSxcblxuICAgIHRvU2V0U2VxOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgVG9TZXRTZXF1ZW5jZSh0aGlzKTtcbiAgICB9LFxuXG4gICAgdG9TZXE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGlzSW5kZXhlZCh0aGlzKSA/IHRoaXMudG9JbmRleGVkU2VxKCkgOlxuICAgICAgICBpc0tleWVkKHRoaXMpID8gdGhpcy50b0tleWVkU2VxKCkgOlxuICAgICAgICB0aGlzLnRvU2V0U2VxKCk7XG4gICAgfSxcblxuICAgIHRvU3RhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gVXNlIExhdGUgQmluZGluZyBoZXJlIHRvIHNvbHZlIHRoZSBjaXJjdWxhciBkZXBlbmRlbmN5LlxuICAgICAgcmV0dXJuIFN0YWNrKGlzS2V5ZWQodGhpcykgPyB0aGlzLnZhbHVlU2VxKCkgOiB0aGlzKTtcbiAgICB9LFxuXG4gICAgdG9MaXN0OiBmdW5jdGlvbigpIHtcbiAgICAgIC8vIFVzZSBMYXRlIEJpbmRpbmcgaGVyZSB0byBzb2x2ZSB0aGUgY2lyY3VsYXIgZGVwZW5kZW5jeS5cbiAgICAgIHJldHVybiBMaXN0KGlzS2V5ZWQodGhpcykgPyB0aGlzLnZhbHVlU2VxKCkgOiB0aGlzKTtcbiAgICB9LFxuXG5cbiAgICAvLyAjIyMgQ29tbW9uIEphdmFTY3JpcHQgbWV0aG9kcyBhbmQgcHJvcGVydGllc1xuXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICdbSXRlcmFibGVdJztcbiAgICB9LFxuXG4gICAgX190b1N0cmluZzogZnVuY3Rpb24oaGVhZCwgdGFpbCkge1xuICAgICAgaWYgKHRoaXMuc2l6ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gaGVhZCArIHRhaWw7XG4gICAgICB9XG4gICAgICByZXR1cm4gaGVhZCArICcgJyArIHRoaXMudG9TZXEoKS5tYXAodGhpcy5fX3RvU3RyaW5nTWFwcGVyKS5qb2luKCcsICcpICsgJyAnICsgdGFpbDtcbiAgICB9LFxuXG5cbiAgICAvLyAjIyMgRVM2IENvbGxlY3Rpb24gbWV0aG9kcyAoRVM2IEFycmF5IGFuZCBNYXApXG5cbiAgICBjb25jYXQ6IGZ1bmN0aW9uKCkge3ZhciB2YWx1ZXMgPSBTTElDRSQwLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCBjb25jYXRGYWN0b3J5KHRoaXMsIHZhbHVlcykpO1xuICAgIH0sXG5cbiAgICBpbmNsdWRlczogZnVuY3Rpb24oc2VhcmNoVmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLnNvbWUoZnVuY3Rpb24odmFsdWUgKSB7cmV0dXJuIGlzKHZhbHVlLCBzZWFyY2hWYWx1ZSl9KTtcbiAgICB9LFxuXG4gICAgZW50cmllczogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2l0ZXJhdG9yKElURVJBVEVfRU5UUklFUyk7XG4gICAgfSxcblxuICAgIGV2ZXJ5OiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIGFzc2VydE5vdEluZmluaXRlKHRoaXMuc2l6ZSk7XG4gICAgICB2YXIgcmV0dXJuVmFsdWUgPSB0cnVlO1xuICAgICAgdGhpcy5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaywgYykgIHtcbiAgICAgICAgaWYgKCFwcmVkaWNhdGUuY2FsbChjb250ZXh0LCB2LCBrLCBjKSkge1xuICAgICAgICAgIHJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXR1cm5WYWx1ZTtcbiAgICB9LFxuXG4gICAgZmlsdGVyOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCBmaWx0ZXJGYWN0b3J5KHRoaXMsIHByZWRpY2F0ZSwgY29udGV4dCwgdHJ1ZSkpO1xuICAgIH0sXG5cbiAgICBmaW5kOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQsIG5vdFNldFZhbHVlKSB7XG4gICAgICB2YXIgZW50cnkgPSB0aGlzLmZpbmRFbnRyeShwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGVudHJ5ID8gZW50cnlbMV0gOiBub3RTZXRWYWx1ZTtcbiAgICB9LFxuXG4gICAgZm9yRWFjaDogZnVuY3Rpb24oc2lkZUVmZmVjdCwgY29udGV4dCkge1xuICAgICAgYXNzZXJ0Tm90SW5maW5pdGUodGhpcy5zaXplKTtcbiAgICAgIHJldHVybiB0aGlzLl9faXRlcmF0ZShjb250ZXh0ID8gc2lkZUVmZmVjdC5iaW5kKGNvbnRleHQpIDogc2lkZUVmZmVjdCk7XG4gICAgfSxcblxuICAgIGpvaW46IGZ1bmN0aW9uKHNlcGFyYXRvcikge1xuICAgICAgYXNzZXJ0Tm90SW5maW5pdGUodGhpcy5zaXplKTtcbiAgICAgIHNlcGFyYXRvciA9IHNlcGFyYXRvciAhPT0gdW5kZWZpbmVkID8gJycgKyBzZXBhcmF0b3IgOiAnLCc7XG4gICAgICB2YXIgam9pbmVkID0gJyc7XG4gICAgICB2YXIgaXNGaXJzdCA9IHRydWU7XG4gICAgICB0aGlzLl9faXRlcmF0ZShmdW5jdGlvbih2ICkge1xuICAgICAgICBpc0ZpcnN0ID8gKGlzRmlyc3QgPSBmYWxzZSkgOiAoam9pbmVkICs9IHNlcGFyYXRvcik7XG4gICAgICAgIGpvaW5lZCArPSB2ICE9PSBudWxsICYmIHYgIT09IHVuZGVmaW5lZCA/IHYudG9TdHJpbmcoKSA6ICcnO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gam9pbmVkO1xuICAgIH0sXG5cbiAgICBrZXlzOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9faXRlcmF0b3IoSVRFUkFURV9LRVlTKTtcbiAgICB9LFxuXG4gICAgbWFwOiBmdW5jdGlvbihtYXBwZXIsIGNvbnRleHQpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCBtYXBGYWN0b3J5KHRoaXMsIG1hcHBlciwgY29udGV4dCkpO1xuICAgIH0sXG5cbiAgICByZWR1Y2U6IGZ1bmN0aW9uKHJlZHVjZXIsIGluaXRpYWxSZWR1Y3Rpb24sIGNvbnRleHQpIHtcbiAgICAgIGFzc2VydE5vdEluZmluaXRlKHRoaXMuc2l6ZSk7XG4gICAgICB2YXIgcmVkdWN0aW9uO1xuICAgICAgdmFyIHVzZUZpcnN0O1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSB7XG4gICAgICAgIHVzZUZpcnN0ID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlZHVjdGlvbiA9IGluaXRpYWxSZWR1Y3Rpb247XG4gICAgICB9XG4gICAgICB0aGlzLl9faXRlcmF0ZShmdW5jdGlvbih2LCBrLCBjKSAge1xuICAgICAgICBpZiAodXNlRmlyc3QpIHtcbiAgICAgICAgICB1c2VGaXJzdCA9IGZhbHNlO1xuICAgICAgICAgIHJlZHVjdGlvbiA9IHY7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVkdWN0aW9uID0gcmVkdWNlci5jYWxsKGNvbnRleHQsIHJlZHVjdGlvbiwgdiwgaywgYyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlZHVjdGlvbjtcbiAgICB9LFxuXG4gICAgcmVkdWNlUmlnaHQ6IGZ1bmN0aW9uKHJlZHVjZXIsIGluaXRpYWxSZWR1Y3Rpb24sIGNvbnRleHQpIHtcbiAgICAgIHZhciByZXZlcnNlZCA9IHRoaXMudG9LZXllZFNlcSgpLnJldmVyc2UoKTtcbiAgICAgIHJldHVybiByZXZlcnNlZC5yZWR1Y2UuYXBwbHkocmV2ZXJzZWQsIGFyZ3VtZW50cyk7XG4gICAgfSxcblxuICAgIHJldmVyc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIHJldmVyc2VGYWN0b3J5KHRoaXMsIHRydWUpKTtcbiAgICB9LFxuXG4gICAgc2xpY2U6IGZ1bmN0aW9uKGJlZ2luLCBlbmQpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCBzbGljZUZhY3RvcnkodGhpcywgYmVnaW4sIGVuZCwgdHJ1ZSkpO1xuICAgIH0sXG5cbiAgICBzb21lOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIHJldHVybiAhdGhpcy5ldmVyeShub3QocHJlZGljYXRlKSwgY29udGV4dCk7XG4gICAgfSxcblxuICAgIHNvcnQ6IGZ1bmN0aW9uKGNvbXBhcmF0b3IpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCBzb3J0RmFjdG9yeSh0aGlzLCBjb21wYXJhdG9yKSk7XG4gICAgfSxcblxuICAgIHZhbHVlczogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2l0ZXJhdG9yKElURVJBVEVfVkFMVUVTKTtcbiAgICB9LFxuXG5cbiAgICAvLyAjIyMgTW9yZSBzZXF1ZW50aWFsIG1ldGhvZHNcblxuICAgIGJ1dExhc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuc2xpY2UoMCwgLTEpO1xuICAgIH0sXG5cbiAgICBpc0VtcHR5OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnNpemUgIT09IHVuZGVmaW5lZCA/IHRoaXMuc2l6ZSA9PT0gMCA6ICF0aGlzLnNvbWUoZnVuY3Rpb24oKSAge3JldHVybiB0cnVlfSk7XG4gICAgfSxcblxuICAgIGNvdW50OiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIHJldHVybiBlbnN1cmVTaXplKFxuICAgICAgICBwcmVkaWNhdGUgPyB0aGlzLnRvU2VxKCkuZmlsdGVyKHByZWRpY2F0ZSwgY29udGV4dCkgOiB0aGlzXG4gICAgICApO1xuICAgIH0sXG5cbiAgICBjb3VudEJ5OiBmdW5jdGlvbihncm91cGVyLCBjb250ZXh0KSB7XG4gICAgICByZXR1cm4gY291bnRCeUZhY3RvcnkodGhpcywgZ3JvdXBlciwgY29udGV4dCk7XG4gICAgfSxcblxuICAgIGVxdWFsczogZnVuY3Rpb24ob3RoZXIpIHtcbiAgICAgIHJldHVybiBkZWVwRXF1YWwodGhpcywgb3RoZXIpO1xuICAgIH0sXG5cbiAgICBlbnRyeVNlcTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaXRlcmFibGUgPSB0aGlzO1xuICAgICAgaWYgKGl0ZXJhYmxlLl9jYWNoZSkge1xuICAgICAgICAvLyBXZSBjYWNoZSBhcyBhbiBlbnRyaWVzIGFycmF5LCBzbyB3ZSBjYW4ganVzdCByZXR1cm4gdGhlIGNhY2hlIVxuICAgICAgICByZXR1cm4gbmV3IEFycmF5U2VxKGl0ZXJhYmxlLl9jYWNoZSk7XG4gICAgICB9XG4gICAgICB2YXIgZW50cmllc1NlcXVlbmNlID0gaXRlcmFibGUudG9TZXEoKS5tYXAoZW50cnlNYXBwZXIpLnRvSW5kZXhlZFNlcSgpO1xuICAgICAgZW50cmllc1NlcXVlbmNlLmZyb21FbnRyeVNlcSA9IGZ1bmN0aW9uKCkgIHtyZXR1cm4gaXRlcmFibGUudG9TZXEoKX07XG4gICAgICByZXR1cm4gZW50cmllc1NlcXVlbmNlO1xuICAgIH0sXG5cbiAgICBmaWx0ZXJOb3Q6IGZ1bmN0aW9uKHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyKG5vdChwcmVkaWNhdGUpLCBjb250ZXh0KTtcbiAgICB9LFxuXG4gICAgZmluZEVudHJ5OiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQsIG5vdFNldFZhbHVlKSB7XG4gICAgICB2YXIgZm91bmQgPSBub3RTZXRWYWx1ZTtcbiAgICAgIHRoaXMuX19pdGVyYXRlKGZ1bmN0aW9uKHYsIGssIGMpICB7XG4gICAgICAgIGlmIChwcmVkaWNhdGUuY2FsbChjb250ZXh0LCB2LCBrLCBjKSkge1xuICAgICAgICAgIGZvdW5kID0gW2ssIHZdO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gZm91bmQ7XG4gICAgfSxcblxuICAgIGZpbmRLZXk6IGZ1bmN0aW9uKHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgdmFyIGVudHJ5ID0gdGhpcy5maW5kRW50cnkocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICAgIHJldHVybiBlbnRyeSAmJiBlbnRyeVswXTtcbiAgICB9LFxuXG4gICAgZmluZExhc3Q6IGZ1bmN0aW9uKHByZWRpY2F0ZSwgY29udGV4dCwgbm90U2V0VmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLnRvS2V5ZWRTZXEoKS5yZXZlcnNlKCkuZmluZChwcmVkaWNhdGUsIGNvbnRleHQsIG5vdFNldFZhbHVlKTtcbiAgICB9LFxuXG4gICAgZmluZExhc3RFbnRyeTogZnVuY3Rpb24ocHJlZGljYXRlLCBjb250ZXh0LCBub3RTZXRWYWx1ZSkge1xuICAgICAgcmV0dXJuIHRoaXMudG9LZXllZFNlcSgpLnJldmVyc2UoKS5maW5kRW50cnkocHJlZGljYXRlLCBjb250ZXh0LCBub3RTZXRWYWx1ZSk7XG4gICAgfSxcblxuICAgIGZpbmRMYXN0S2V5OiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIHJldHVybiB0aGlzLnRvS2V5ZWRTZXEoKS5yZXZlcnNlKCkuZmluZEtleShwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIH0sXG5cbiAgICBmaXJzdDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5maW5kKHJldHVyblRydWUpO1xuICAgIH0sXG5cbiAgICBmbGF0TWFwOiBmdW5jdGlvbihtYXBwZXIsIGNvbnRleHQpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCBmbGF0TWFwRmFjdG9yeSh0aGlzLCBtYXBwZXIsIGNvbnRleHQpKTtcbiAgICB9LFxuXG4gICAgZmxhdHRlbjogZnVuY3Rpb24oZGVwdGgpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCBmbGF0dGVuRmFjdG9yeSh0aGlzLCBkZXB0aCwgdHJ1ZSkpO1xuICAgIH0sXG5cbiAgICBmcm9tRW50cnlTZXE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBGcm9tRW50cmllc1NlcXVlbmNlKHRoaXMpO1xuICAgIH0sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uKHNlYXJjaEtleSwgbm90U2V0VmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmZpbmQoZnVuY3Rpb24oXywga2V5KSAge3JldHVybiBpcyhrZXksIHNlYXJjaEtleSl9LCB1bmRlZmluZWQsIG5vdFNldFZhbHVlKTtcbiAgICB9LFxuXG4gICAgZ2V0SW46IGZ1bmN0aW9uKHNlYXJjaEtleVBhdGgsIG5vdFNldFZhbHVlKSB7XG4gICAgICB2YXIgbmVzdGVkID0gdGhpcztcbiAgICAgIC8vIE5vdGU6IGluIGFuIEVTNiBlbnZpcm9ubWVudCwgd2Ugd291bGQgcHJlZmVyOlxuICAgICAgLy8gZm9yICh2YXIga2V5IG9mIHNlYXJjaEtleVBhdGgpIHtcbiAgICAgIHZhciBpdGVyID0gZm9yY2VJdGVyYXRvcihzZWFyY2hLZXlQYXRoKTtcbiAgICAgIHZhciBzdGVwO1xuICAgICAgd2hpbGUgKCEoc3RlcCA9IGl0ZXIubmV4dCgpKS5kb25lKSB7XG4gICAgICAgIHZhciBrZXkgPSBzdGVwLnZhbHVlO1xuICAgICAgICBuZXN0ZWQgPSBuZXN0ZWQgJiYgbmVzdGVkLmdldCA/IG5lc3RlZC5nZXQoa2V5LCBOT1RfU0VUKSA6IE5PVF9TRVQ7XG4gICAgICAgIGlmIChuZXN0ZWQgPT09IE5PVF9TRVQpIHtcbiAgICAgICAgICByZXR1cm4gbm90U2V0VmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXN0ZWQ7XG4gICAgfSxcblxuICAgIGdyb3VwQnk6IGZ1bmN0aW9uKGdyb3VwZXIsIGNvbnRleHQpIHtcbiAgICAgIHJldHVybiBncm91cEJ5RmFjdG9yeSh0aGlzLCBncm91cGVyLCBjb250ZXh0KTtcbiAgICB9LFxuXG4gICAgaGFzOiBmdW5jdGlvbihzZWFyY2hLZXkpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldChzZWFyY2hLZXksIE5PVF9TRVQpICE9PSBOT1RfU0VUO1xuICAgIH0sXG5cbiAgICBoYXNJbjogZnVuY3Rpb24oc2VhcmNoS2V5UGF0aCkge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0SW4oc2VhcmNoS2V5UGF0aCwgTk9UX1NFVCkgIT09IE5PVF9TRVQ7XG4gICAgfSxcblxuICAgIGlzU3Vic2V0OiBmdW5jdGlvbihpdGVyKSB7XG4gICAgICBpdGVyID0gdHlwZW9mIGl0ZXIuaW5jbHVkZXMgPT09ICdmdW5jdGlvbicgPyBpdGVyIDogSXRlcmFibGUoaXRlcik7XG4gICAgICByZXR1cm4gdGhpcy5ldmVyeShmdW5jdGlvbih2YWx1ZSApIHtyZXR1cm4gaXRlci5pbmNsdWRlcyh2YWx1ZSl9KTtcbiAgICB9LFxuXG4gICAgaXNTdXBlcnNldDogZnVuY3Rpb24oaXRlcikge1xuICAgICAgaXRlciA9IHR5cGVvZiBpdGVyLmlzU3Vic2V0ID09PSAnZnVuY3Rpb24nID8gaXRlciA6IEl0ZXJhYmxlKGl0ZXIpO1xuICAgICAgcmV0dXJuIGl0ZXIuaXNTdWJzZXQodGhpcyk7XG4gICAgfSxcblxuICAgIGtleU9mOiBmdW5jdGlvbihzZWFyY2hWYWx1ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuZmluZEtleShmdW5jdGlvbih2YWx1ZSApIHtyZXR1cm4gaXModmFsdWUsIHNlYXJjaFZhbHVlKX0pO1xuICAgIH0sXG5cbiAgICBrZXlTZXE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudG9TZXEoKS5tYXAoa2V5TWFwcGVyKS50b0luZGV4ZWRTZXEoKTtcbiAgICB9LFxuXG4gICAgbGFzdDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy50b1NlcSgpLnJldmVyc2UoKS5maXJzdCgpO1xuICAgIH0sXG5cbiAgICBsYXN0S2V5T2Y6IGZ1bmN0aW9uKHNlYXJjaFZhbHVlKSB7XG4gICAgICByZXR1cm4gdGhpcy50b0tleWVkU2VxKCkucmV2ZXJzZSgpLmtleU9mKHNlYXJjaFZhbHVlKTtcbiAgICB9LFxuXG4gICAgbWF4OiBmdW5jdGlvbihjb21wYXJhdG9yKSB7XG4gICAgICByZXR1cm4gbWF4RmFjdG9yeSh0aGlzLCBjb21wYXJhdG9yKTtcbiAgICB9LFxuXG4gICAgbWF4Qnk6IGZ1bmN0aW9uKG1hcHBlciwgY29tcGFyYXRvcikge1xuICAgICAgcmV0dXJuIG1heEZhY3RvcnkodGhpcywgY29tcGFyYXRvciwgbWFwcGVyKTtcbiAgICB9LFxuXG4gICAgbWluOiBmdW5jdGlvbihjb21wYXJhdG9yKSB7XG4gICAgICByZXR1cm4gbWF4RmFjdG9yeSh0aGlzLCBjb21wYXJhdG9yID8gbmVnKGNvbXBhcmF0b3IpIDogZGVmYXVsdE5lZ0NvbXBhcmF0b3IpO1xuICAgIH0sXG5cbiAgICBtaW5CeTogZnVuY3Rpb24obWFwcGVyLCBjb21wYXJhdG9yKSB7XG4gICAgICByZXR1cm4gbWF4RmFjdG9yeSh0aGlzLCBjb21wYXJhdG9yID8gbmVnKGNvbXBhcmF0b3IpIDogZGVmYXVsdE5lZ0NvbXBhcmF0b3IsIG1hcHBlcik7XG4gICAgfSxcblxuICAgIHJlc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuc2xpY2UoMSk7XG4gICAgfSxcblxuICAgIHNraXA6IGZ1bmN0aW9uKGFtb3VudCkge1xuICAgICAgcmV0dXJuIHRoaXMuc2xpY2UoTWF0aC5tYXgoMCwgYW1vdW50KSk7XG4gICAgfSxcblxuICAgIHNraXBMYXN0OiBmdW5jdGlvbihhbW91bnQpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCB0aGlzLnRvU2VxKCkucmV2ZXJzZSgpLnNraXAoYW1vdW50KS5yZXZlcnNlKCkpO1xuICAgIH0sXG5cbiAgICBza2lwV2hpbGU6IGZ1bmN0aW9uKHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIHNraXBXaGlsZUZhY3RvcnkodGhpcywgcHJlZGljYXRlLCBjb250ZXh0LCB0cnVlKSk7XG4gICAgfSxcblxuICAgIHNraXBVbnRpbDogZnVuY3Rpb24ocHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICByZXR1cm4gdGhpcy5za2lwV2hpbGUobm90KHByZWRpY2F0ZSksIGNvbnRleHQpO1xuICAgIH0sXG5cbiAgICBzb3J0Qnk6IGZ1bmN0aW9uKG1hcHBlciwgY29tcGFyYXRvcikge1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIHNvcnRGYWN0b3J5KHRoaXMsIGNvbXBhcmF0b3IsIG1hcHBlcikpO1xuICAgIH0sXG5cbiAgICB0YWtlOiBmdW5jdGlvbihhbW91bnQpIHtcbiAgICAgIHJldHVybiB0aGlzLnNsaWNlKDAsIE1hdGgubWF4KDAsIGFtb3VudCkpO1xuICAgIH0sXG5cbiAgICB0YWtlTGFzdDogZnVuY3Rpb24oYW1vdW50KSB7XG4gICAgICByZXR1cm4gcmVpZnkodGhpcywgdGhpcy50b1NlcSgpLnJldmVyc2UoKS50YWtlKGFtb3VudCkucmV2ZXJzZSgpKTtcbiAgICB9LFxuXG4gICAgdGFrZVdoaWxlOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCB0YWtlV2hpbGVGYWN0b3J5KHRoaXMsIHByZWRpY2F0ZSwgY29udGV4dCkpO1xuICAgIH0sXG5cbiAgICB0YWtlVW50aWw6IGZ1bmN0aW9uKHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIHRoaXMudGFrZVdoaWxlKG5vdChwcmVkaWNhdGUpLCBjb250ZXh0KTtcbiAgICB9LFxuXG4gICAgdmFsdWVTZXE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudG9JbmRleGVkU2VxKCk7XG4gICAgfSxcblxuXG4gICAgLy8gIyMjIEhhc2hhYmxlIE9iamVjdFxuXG4gICAgaGFzaENvZGU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX19oYXNoIHx8ICh0aGlzLl9faGFzaCA9IGhhc2hJdGVyYWJsZSh0aGlzKSk7XG4gICAgfVxuXG5cbiAgICAvLyAjIyMgSW50ZXJuYWxcblxuICAgIC8vIGFic3RyYWN0IF9faXRlcmF0ZShmbiwgcmV2ZXJzZSlcblxuICAgIC8vIGFic3RyYWN0IF9faXRlcmF0b3IodHlwZSwgcmV2ZXJzZSlcbiAgfSk7XG5cbiAgLy8gdmFyIElTX0lURVJBQkxFX1NFTlRJTkVMID0gJ0BAX19JTU1VVEFCTEVfSVRFUkFCTEVfX0BAJztcbiAgLy8gdmFyIElTX0tFWUVEX1NFTlRJTkVMID0gJ0BAX19JTU1VVEFCTEVfS0VZRURfX0BAJztcbiAgLy8gdmFyIElTX0lOREVYRURfU0VOVElORUwgPSAnQEBfX0lNTVVUQUJMRV9JTkRFWEVEX19AQCc7XG4gIC8vIHZhciBJU19PUkRFUkVEX1NFTlRJTkVMID0gJ0BAX19JTU1VVEFCTEVfT1JERVJFRF9fQEAnO1xuXG4gIHZhciBJdGVyYWJsZVByb3RvdHlwZSA9IEl0ZXJhYmxlLnByb3RvdHlwZTtcbiAgSXRlcmFibGVQcm90b3R5cGVbSVNfSVRFUkFCTEVfU0VOVElORUxdID0gdHJ1ZTtcbiAgSXRlcmFibGVQcm90b3R5cGVbSVRFUkFUT1JfU1lNQk9MXSA9IEl0ZXJhYmxlUHJvdG90eXBlLnZhbHVlcztcbiAgSXRlcmFibGVQcm90b3R5cGUuX190b0pTID0gSXRlcmFibGVQcm90b3R5cGUudG9BcnJheTtcbiAgSXRlcmFibGVQcm90b3R5cGUuX190b1N0cmluZ01hcHBlciA9IHF1b3RlU3RyaW5nO1xuICBJdGVyYWJsZVByb3RvdHlwZS5pbnNwZWN0ID1cbiAgSXRlcmFibGVQcm90b3R5cGUudG9Tb3VyY2UgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMudG9TdHJpbmcoKTsgfTtcbiAgSXRlcmFibGVQcm90b3R5cGUuY2hhaW4gPSBJdGVyYWJsZVByb3RvdHlwZS5mbGF0TWFwO1xuICBJdGVyYWJsZVByb3RvdHlwZS5jb250YWlucyA9IEl0ZXJhYmxlUHJvdG90eXBlLmluY2x1ZGVzO1xuXG4gIG1peGluKEtleWVkSXRlcmFibGUsIHtcblxuICAgIC8vICMjIyBNb3JlIHNlcXVlbnRpYWwgbWV0aG9kc1xuXG4gICAgZmxpcDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcmVpZnkodGhpcywgZmxpcEZhY3RvcnkodGhpcykpO1xuICAgIH0sXG5cbiAgICBtYXBFbnRyaWVzOiBmdW5jdGlvbihtYXBwZXIsIGNvbnRleHQpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLFxuICAgICAgICB0aGlzLnRvU2VxKCkubWFwKFxuICAgICAgICAgIGZ1bmN0aW9uKHYsIGspICB7cmV0dXJuIG1hcHBlci5jYWxsKGNvbnRleHQsIFtrLCB2XSwgaXRlcmF0aW9ucysrLCB0aGlzJDApfVxuICAgICAgICApLmZyb21FbnRyeVNlcSgpXG4gICAgICApO1xuICAgIH0sXG5cbiAgICBtYXBLZXlzOiBmdW5jdGlvbihtYXBwZXIsIGNvbnRleHQpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLFxuICAgICAgICB0aGlzLnRvU2VxKCkuZmxpcCgpLm1hcChcbiAgICAgICAgICBmdW5jdGlvbihrLCB2KSAge3JldHVybiBtYXBwZXIuY2FsbChjb250ZXh0LCBrLCB2LCB0aGlzJDApfVxuICAgICAgICApLmZsaXAoKVxuICAgICAgKTtcbiAgICB9XG5cbiAgfSk7XG5cbiAgdmFyIEtleWVkSXRlcmFibGVQcm90b3R5cGUgPSBLZXllZEl0ZXJhYmxlLnByb3RvdHlwZTtcbiAgS2V5ZWRJdGVyYWJsZVByb3RvdHlwZVtJU19LRVlFRF9TRU5USU5FTF0gPSB0cnVlO1xuICBLZXllZEl0ZXJhYmxlUHJvdG90eXBlW0lURVJBVE9SX1NZTUJPTF0gPSBJdGVyYWJsZVByb3RvdHlwZS5lbnRyaWVzO1xuICBLZXllZEl0ZXJhYmxlUHJvdG90eXBlLl9fdG9KUyA9IEl0ZXJhYmxlUHJvdG90eXBlLnRvT2JqZWN0O1xuICBLZXllZEl0ZXJhYmxlUHJvdG90eXBlLl9fdG9TdHJpbmdNYXBwZXIgPSBmdW5jdGlvbih2LCBrKSAge3JldHVybiBKU09OLnN0cmluZ2lmeShrKSArICc6ICcgKyBxdW90ZVN0cmluZyh2KX07XG5cblxuXG4gIG1peGluKEluZGV4ZWRJdGVyYWJsZSwge1xuXG4gICAgLy8gIyMjIENvbnZlcnNpb24gdG8gb3RoZXIgdHlwZXNcblxuICAgIHRvS2V5ZWRTZXE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBUb0tleWVkU2VxdWVuY2UodGhpcywgZmFsc2UpO1xuICAgIH0sXG5cblxuICAgIC8vICMjIyBFUzYgQ29sbGVjdGlvbiBtZXRob2RzIChFUzYgQXJyYXkgYW5kIE1hcClcblxuICAgIGZpbHRlcjogZnVuY3Rpb24ocHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICByZXR1cm4gcmVpZnkodGhpcywgZmlsdGVyRmFjdG9yeSh0aGlzLCBwcmVkaWNhdGUsIGNvbnRleHQsIGZhbHNlKSk7XG4gICAgfSxcblxuICAgIGZpbmRJbmRleDogZnVuY3Rpb24ocHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICB2YXIgZW50cnkgPSB0aGlzLmZpbmRFbnRyeShwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGVudHJ5ID8gZW50cnlbMF0gOiAtMTtcbiAgICB9LFxuXG4gICAgaW5kZXhPZjogZnVuY3Rpb24oc2VhcmNoVmFsdWUpIHtcbiAgICAgIHZhciBrZXkgPSB0aGlzLmtleU9mKHNlYXJjaFZhbHVlKTtcbiAgICAgIHJldHVybiBrZXkgPT09IHVuZGVmaW5lZCA/IC0xIDoga2V5O1xuICAgIH0sXG5cbiAgICBsYXN0SW5kZXhPZjogZnVuY3Rpb24oc2VhcmNoVmFsdWUpIHtcbiAgICAgIHZhciBrZXkgPSB0aGlzLmxhc3RLZXlPZihzZWFyY2hWYWx1ZSk7XG4gICAgICByZXR1cm4ga2V5ID09PSB1bmRlZmluZWQgPyAtMSA6IGtleTtcbiAgICB9LFxuXG4gICAgcmV2ZXJzZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcmVpZnkodGhpcywgcmV2ZXJzZUZhY3RvcnkodGhpcywgZmFsc2UpKTtcbiAgICB9LFxuXG4gICAgc2xpY2U6IGZ1bmN0aW9uKGJlZ2luLCBlbmQpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCBzbGljZUZhY3RvcnkodGhpcywgYmVnaW4sIGVuZCwgZmFsc2UpKTtcbiAgICB9LFxuXG4gICAgc3BsaWNlOiBmdW5jdGlvbihpbmRleCwgcmVtb3ZlTnVtIC8qLCAuLi52YWx1ZXMqLykge1xuICAgICAgdmFyIG51bUFyZ3MgPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgcmVtb3ZlTnVtID0gTWF0aC5tYXgocmVtb3ZlTnVtIHwgMCwgMCk7XG4gICAgICBpZiAobnVtQXJncyA9PT0gMCB8fCAobnVtQXJncyA9PT0gMiAmJiAhcmVtb3ZlTnVtKSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIC8vIElmIGluZGV4IGlzIG5lZ2F0aXZlLCBpdCBzaG91bGQgcmVzb2x2ZSByZWxhdGl2ZSB0byB0aGUgc2l6ZSBvZiB0aGVcbiAgICAgIC8vIGNvbGxlY3Rpb24uIEhvd2V2ZXIgc2l6ZSBtYXkgYmUgZXhwZW5zaXZlIHRvIGNvbXB1dGUgaWYgbm90IGNhY2hlZCwgc29cbiAgICAgIC8vIG9ubHkgY2FsbCBjb3VudCgpIGlmIHRoZSBudW1iZXIgaXMgaW4gZmFjdCBuZWdhdGl2ZS5cbiAgICAgIGluZGV4ID0gcmVzb2x2ZUJlZ2luKGluZGV4LCBpbmRleCA8IDAgPyB0aGlzLmNvdW50KCkgOiB0aGlzLnNpemUpO1xuICAgICAgdmFyIHNwbGljZWQgPSB0aGlzLnNsaWNlKDAsIGluZGV4KTtcbiAgICAgIHJldHVybiByZWlmeShcbiAgICAgICAgdGhpcyxcbiAgICAgICAgbnVtQXJncyA9PT0gMSA/XG4gICAgICAgICAgc3BsaWNlZCA6XG4gICAgICAgICAgc3BsaWNlZC5jb25jYXQoYXJyQ29weShhcmd1bWVudHMsIDIpLCB0aGlzLnNsaWNlKGluZGV4ICsgcmVtb3ZlTnVtKSlcbiAgICAgICk7XG4gICAgfSxcblxuXG4gICAgLy8gIyMjIE1vcmUgY29sbGVjdGlvbiBtZXRob2RzXG5cbiAgICBmaW5kTGFzdEluZGV4OiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIHZhciBlbnRyeSA9IHRoaXMuZmluZExhc3RFbnRyeShwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGVudHJ5ID8gZW50cnlbMF0gOiAtMTtcbiAgICB9LFxuXG4gICAgZmlyc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0KDApO1xuICAgIH0sXG5cbiAgICBmbGF0dGVuOiBmdW5jdGlvbihkZXB0aCkge1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIGZsYXR0ZW5GYWN0b3J5KHRoaXMsIGRlcHRoLCBmYWxzZSkpO1xuICAgIH0sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uKGluZGV4LCBub3RTZXRWYWx1ZSkge1xuICAgICAgaW5kZXggPSB3cmFwSW5kZXgodGhpcywgaW5kZXgpO1xuICAgICAgcmV0dXJuIChpbmRleCA8IDAgfHwgKHRoaXMuc2l6ZSA9PT0gSW5maW5pdHkgfHxcbiAgICAgICAgICAodGhpcy5zaXplICE9PSB1bmRlZmluZWQgJiYgaW5kZXggPiB0aGlzLnNpemUpKSkgP1xuICAgICAgICBub3RTZXRWYWx1ZSA6XG4gICAgICAgIHRoaXMuZmluZChmdW5jdGlvbihfLCBrZXkpICB7cmV0dXJuIGtleSA9PT0gaW5kZXh9LCB1bmRlZmluZWQsIG5vdFNldFZhbHVlKTtcbiAgICB9LFxuXG4gICAgaGFzOiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgaW5kZXggPSB3cmFwSW5kZXgodGhpcywgaW5kZXgpO1xuICAgICAgcmV0dXJuIGluZGV4ID49IDAgJiYgKHRoaXMuc2l6ZSAhPT0gdW5kZWZpbmVkID9cbiAgICAgICAgdGhpcy5zaXplID09PSBJbmZpbml0eSB8fCBpbmRleCA8IHRoaXMuc2l6ZSA6XG4gICAgICAgIHRoaXMuaW5kZXhPZihpbmRleCkgIT09IC0xXG4gICAgICApO1xuICAgIH0sXG5cbiAgICBpbnRlcnBvc2U6IGZ1bmN0aW9uKHNlcGFyYXRvcikge1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIGludGVycG9zZUZhY3RvcnkodGhpcywgc2VwYXJhdG9yKSk7XG4gICAgfSxcblxuICAgIGludGVybGVhdmU6IGZ1bmN0aW9uKC8qLi4uaXRlcmFibGVzKi8pIHtcbiAgICAgIHZhciBpdGVyYWJsZXMgPSBbdGhpc10uY29uY2F0KGFyckNvcHkoYXJndW1lbnRzKSk7XG4gICAgICB2YXIgemlwcGVkID0gemlwV2l0aEZhY3RvcnkodGhpcy50b1NlcSgpLCBJbmRleGVkU2VxLm9mLCBpdGVyYWJsZXMpO1xuICAgICAgdmFyIGludGVybGVhdmVkID0gemlwcGVkLmZsYXR0ZW4odHJ1ZSk7XG4gICAgICBpZiAoemlwcGVkLnNpemUpIHtcbiAgICAgICAgaW50ZXJsZWF2ZWQuc2l6ZSA9IHppcHBlZC5zaXplICogaXRlcmFibGVzLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCBpbnRlcmxlYXZlZCk7XG4gICAgfSxcblxuICAgIGtleVNlcTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gUmFuZ2UoMCwgdGhpcy5zaXplKTtcbiAgICB9LFxuXG4gICAgbGFzdDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXQoLTEpO1xuICAgIH0sXG5cbiAgICBza2lwV2hpbGU6IGZ1bmN0aW9uKHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIHNraXBXaGlsZUZhY3RvcnkodGhpcywgcHJlZGljYXRlLCBjb250ZXh0LCBmYWxzZSkpO1xuICAgIH0sXG5cbiAgICB6aXA6IGZ1bmN0aW9uKC8qLCAuLi5pdGVyYWJsZXMgKi8pIHtcbiAgICAgIHZhciBpdGVyYWJsZXMgPSBbdGhpc10uY29uY2F0KGFyckNvcHkoYXJndW1lbnRzKSk7XG4gICAgICByZXR1cm4gcmVpZnkodGhpcywgemlwV2l0aEZhY3RvcnkodGhpcywgZGVmYXVsdFppcHBlciwgaXRlcmFibGVzKSk7XG4gICAgfSxcblxuICAgIHppcFdpdGg6IGZ1bmN0aW9uKHppcHBlci8qLCAuLi5pdGVyYWJsZXMgKi8pIHtcbiAgICAgIHZhciBpdGVyYWJsZXMgPSBhcnJDb3B5KGFyZ3VtZW50cyk7XG4gICAgICBpdGVyYWJsZXNbMF0gPSB0aGlzO1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIHppcFdpdGhGYWN0b3J5KHRoaXMsIHppcHBlciwgaXRlcmFibGVzKSk7XG4gICAgfVxuXG4gIH0pO1xuXG4gIEluZGV4ZWRJdGVyYWJsZS5wcm90b3R5cGVbSVNfSU5ERVhFRF9TRU5USU5FTF0gPSB0cnVlO1xuICBJbmRleGVkSXRlcmFibGUucHJvdG90eXBlW0lTX09SREVSRURfU0VOVElORUxdID0gdHJ1ZTtcblxuXG5cbiAgbWl4aW4oU2V0SXRlcmFibGUsIHtcblxuICAgIC8vICMjIyBFUzYgQ29sbGVjdGlvbiBtZXRob2RzIChFUzYgQXJyYXkgYW5kIE1hcClcblxuICAgIGdldDogZnVuY3Rpb24odmFsdWUsIG5vdFNldFZhbHVlKSB7XG4gICAgICByZXR1cm4gdGhpcy5oYXModmFsdWUpID8gdmFsdWUgOiBub3RTZXRWYWx1ZTtcbiAgICB9LFxuXG4gICAgaW5jbHVkZXM6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdGhpcy5oYXModmFsdWUpO1xuICAgIH0sXG5cblxuICAgIC8vICMjIyBNb3JlIHNlcXVlbnRpYWwgbWV0aG9kc1xuXG4gICAga2V5U2VxOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnZhbHVlU2VxKCk7XG4gICAgfVxuXG4gIH0pO1xuXG4gIFNldEl0ZXJhYmxlLnByb3RvdHlwZS5oYXMgPSBJdGVyYWJsZVByb3RvdHlwZS5pbmNsdWRlcztcbiAgU2V0SXRlcmFibGUucHJvdG90eXBlLmNvbnRhaW5zID0gU2V0SXRlcmFibGUucHJvdG90eXBlLmluY2x1ZGVzO1xuXG5cbiAgLy8gTWl4aW4gc3ViY2xhc3Nlc1xuXG4gIG1peGluKEtleWVkU2VxLCBLZXllZEl0ZXJhYmxlLnByb3RvdHlwZSk7XG4gIG1peGluKEluZGV4ZWRTZXEsIEluZGV4ZWRJdGVyYWJsZS5wcm90b3R5cGUpO1xuICBtaXhpbihTZXRTZXEsIFNldEl0ZXJhYmxlLnByb3RvdHlwZSk7XG5cbiAgbWl4aW4oS2V5ZWRDb2xsZWN0aW9uLCBLZXllZEl0ZXJhYmxlLnByb3RvdHlwZSk7XG4gIG1peGluKEluZGV4ZWRDb2xsZWN0aW9uLCBJbmRleGVkSXRlcmFibGUucHJvdG90eXBlKTtcbiAgbWl4aW4oU2V0Q29sbGVjdGlvbiwgU2V0SXRlcmFibGUucHJvdG90eXBlKTtcblxuXG4gIC8vICNwcmFnbWEgSGVscGVyIGZ1bmN0aW9uc1xuXG4gIGZ1bmN0aW9uIGtleU1hcHBlcih2LCBrKSB7XG4gICAgcmV0dXJuIGs7XG4gIH1cblxuICBmdW5jdGlvbiBlbnRyeU1hcHBlcih2LCBrKSB7XG4gICAgcmV0dXJuIFtrLCB2XTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vdChwcmVkaWNhdGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gIXByZWRpY2F0ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG5lZyhwcmVkaWNhdGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gLXByZWRpY2F0ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHF1b3RlU3RyaW5nKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgOiBTdHJpbmcodmFsdWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVmYXVsdFppcHBlcigpIHtcbiAgICByZXR1cm4gYXJyQ29weShhcmd1bWVudHMpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVmYXVsdE5lZ0NvbXBhcmF0b3IoYSwgYikge1xuICAgIHJldHVybiBhIDwgYiA/IDEgOiBhID4gYiA/IC0xIDogMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhc2hJdGVyYWJsZShpdGVyYWJsZSkge1xuICAgIGlmIChpdGVyYWJsZS5zaXplID09PSBJbmZpbml0eSkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHZhciBvcmRlcmVkID0gaXNPcmRlcmVkKGl0ZXJhYmxlKTtcbiAgICB2YXIga2V5ZWQgPSBpc0tleWVkKGl0ZXJhYmxlKTtcbiAgICB2YXIgaCA9IG9yZGVyZWQgPyAxIDogMDtcbiAgICB2YXIgc2l6ZSA9IGl0ZXJhYmxlLl9faXRlcmF0ZShcbiAgICAgIGtleWVkID9cbiAgICAgICAgb3JkZXJlZCA/XG4gICAgICAgICAgZnVuY3Rpb24odiwgaykgIHsgaCA9IDMxICogaCArIGhhc2hNZXJnZShoYXNoKHYpLCBoYXNoKGspKSB8IDA7IH0gOlxuICAgICAgICAgIGZ1bmN0aW9uKHYsIGspICB7IGggPSBoICsgaGFzaE1lcmdlKGhhc2godiksIGhhc2goaykpIHwgMDsgfSA6XG4gICAgICAgIG9yZGVyZWQgP1xuICAgICAgICAgIGZ1bmN0aW9uKHYgKSB7IGggPSAzMSAqIGggKyBoYXNoKHYpIHwgMDsgfSA6XG4gICAgICAgICAgZnVuY3Rpb24odiApIHsgaCA9IGggKyBoYXNoKHYpIHwgMDsgfVxuICAgICk7XG4gICAgcmV0dXJuIG11cm11ckhhc2hPZlNpemUoc2l6ZSwgaCk7XG4gIH1cblxuICBmdW5jdGlvbiBtdXJtdXJIYXNoT2ZTaXplKHNpemUsIGgpIHtcbiAgICBoID0gaW11bChoLCAweENDOUUyRDUxKTtcbiAgICBoID0gaW11bChoIDw8IDE1IHwgaCA+Pj4gLTE1LCAweDFCODczNTkzKTtcbiAgICBoID0gaW11bChoIDw8IDEzIHwgaCA+Pj4gLTEzLCA1KTtcbiAgICBoID0gKGggKyAweEU2NTQ2QjY0IHwgMCkgXiBzaXplO1xuICAgIGggPSBpbXVsKGggXiBoID4+PiAxNiwgMHg4NUVCQ0E2Qik7XG4gICAgaCA9IGltdWwoaCBeIGggPj4+IDEzLCAweEMyQjJBRTM1KTtcbiAgICBoID0gc21pKGggXiBoID4+PiAxNik7XG4gICAgcmV0dXJuIGg7XG4gIH1cblxuICBmdW5jdGlvbiBoYXNoTWVyZ2UoYSwgYikge1xuICAgIHJldHVybiBhIF4gYiArIDB4OUUzNzc5QjkgKyAoYSA8PCA2KSArIChhID4+IDIpIHwgMDsgLy8gaW50XG4gIH1cblxuICB2YXIgSW1tdXRhYmxlID0ge1xuXG4gICAgSXRlcmFibGU6IEl0ZXJhYmxlLFxuXG4gICAgU2VxOiBTZXEsXG4gICAgQ29sbGVjdGlvbjogQ29sbGVjdGlvbixcbiAgICBNYXA6IE1hcCxcbiAgICBPcmRlcmVkTWFwOiBPcmRlcmVkTWFwLFxuICAgIExpc3Q6IExpc3QsXG4gICAgU3RhY2s6IFN0YWNrLFxuICAgIFNldDogU2V0LFxuICAgIE9yZGVyZWRTZXQ6IE9yZGVyZWRTZXQsXG5cbiAgICBSZWNvcmQ6IFJlY29yZCxcbiAgICBSYW5nZTogUmFuZ2UsXG4gICAgUmVwZWF0OiBSZXBlYXQsXG5cbiAgICBpczogaXMsXG4gICAgZnJvbUpTOiBmcm9tSlNcblxuICB9O1xuXG4gIHJldHVybiBJbW11dGFibGU7XG5cbn0pKTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbmV4cG9ydHMuZGVmYXVsdCA9IGFjdGl2ZUl0ZW07XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9pbW11dGFibGUgPSByZXF1aXJlKCdpbW11dGFibGUnKTtcblxudmFyIF9pbW11dGFibGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfaW1tdXRhYmxlKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoIXNlbGYpIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBjYWxsICYmICh0eXBlb2YgY2FsbCA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSA/IGNhbGwgOiBzZWxmOyB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90IFwiICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG4vLyBUT0RPOiBTcGxpdCB0aGlzIG91dCBhcyBhIHNlcGFyYXRlIHJlYWN0IGNvbXBvbmVudCBhbmQgYWRkIGFzIGEgZGVwZW5kZW5jeVxuXG5mdW5jdGlvbiBhY3RpdmVJdGVtKFdyYXBwZWRDb21wb25lbnQpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChfUmVhY3QkQ29tcG9uZW50KSB7XG4gICAgX2luaGVyaXRzKEFjdGl2ZUl0ZW0sIF9SZWFjdCRDb21wb25lbnQpO1xuXG4gICAgZnVuY3Rpb24gQWN0aXZlSXRlbShwcm9wcykge1xuICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEFjdGl2ZUl0ZW0pO1xuXG4gICAgICB2YXIgX3RoaXMgPSBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCAoQWN0aXZlSXRlbS5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKEFjdGl2ZUl0ZW0pKS5jYWxsKHRoaXMsIHByb3BzKSk7XG5cbiAgICAgIF90aGlzLnN0YXRlID0geyBpdGVtczogX3RoaXMucHJvcHMuaXRlbXMgfTtcbiAgICAgIF90aGlzLl9iaW5kSW5pdCgpO1xuICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cblxuICAgIF9jcmVhdGVDbGFzcyhBY3RpdmVJdGVtLCBbe1xuICAgICAga2V5OiAnX2JpbmRJbml0JyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBfYmluZEluaXQoKSB7XG4gICAgICAgIHRoaXMuZ2V0QWN0aXZlSXRlbSA9IHRoaXMuZ2V0QWN0aXZlSXRlbS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLnNldEFjdGl2ZUl0ZW0gPSB0aGlzLnNldEFjdGl2ZUl0ZW0uYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5nZXRBY3RpdmVJdGVtSW5kZXggPSB0aGlzLmdldEFjdGl2ZUl0ZW1JbmRleC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9oYXNGb2N1cyA9IHRoaXMuX2hhc0ZvY3VzLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUZvY3VzID0gdGhpcy5fdXBkYXRlRm9jdXMuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5faW1tdXRhYmxlQXNzZXRzID0gdGhpcy5faW1tdXRhYmxlQXNzZXRzLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX3VuRm9jdXNlZCA9IHRoaXMuX3VuRm9jdXNlZC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9oYW5kbGVycyA9IHRoaXMuX2hhbmRsZXJzLmJpbmQodGhpcyk7XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnc2V0QWN0aXZlSXRlbScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gc2V0QWN0aXZlSXRlbShpLCBlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZSAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldFN0YXRlKHsgaXRlbXM6IHRoaXMuX3VwZGF0ZUZvY3VzKHRoaXMuX3VuRm9jdXNlZCgpLCBpLCB0cnVlKS50b0pTKCkgfSk7XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnZ2V0QWN0aXZlSXRlbScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0QWN0aXZlSXRlbSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUuaXRlbXMuZmluZCh0aGlzLl9oYXNGb2N1cyk7XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnZ2V0QWN0aXZlSXRlbUluZGV4JyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRBY3RpdmVJdGVtSW5kZXgoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlLml0ZW1zLmZpbmRJbmRleCh0aGlzLl9oYXNGb2N1cyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFwicHJpdmF0ZVwiXG5cbiAgICB9LCB7XG4gICAgICBrZXk6ICdfaGFzRm9jdXMnLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9oYXNGb2N1cyhpdGVtKSB7XG4gICAgICAgIHJldHVybiBpdGVtLmZvY3VzID09IHRydWU7XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnX3VuRm9jdXNlZCcsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gX3VuRm9jdXNlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3VwZGF0ZUZvY3VzKHRoaXMuX2ltbXV0YWJsZUFzc2V0cygpLCB0aGlzLmdldEFjdGl2ZUl0ZW1JbmRleCgpLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnX3VwZGF0ZUZvY3VzJyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBfdXBkYXRlRm9jdXMobGlzdCwgaSwgc3RhdHVzKSB7XG4gICAgICAgIHJldHVybiBsaXN0LnVwZGF0ZShpLCBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgIHJldHVybiBpdGVtLnNldCgnZm9jdXMnLCBzdGF0dXMpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6ICdfaW1tdXRhYmxlQXNzZXRzJyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBfaW1tdXRhYmxlQXNzZXRzKCkge1xuICAgICAgICByZXR1cm4gbmV3IF9pbW11dGFibGUyLmRlZmF1bHQuZnJvbUpTKHRoaXMuc3RhdGUuaXRlbXMpO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ19oYW5kbGVycycsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gX2hhbmRsZXJzKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHNldEFjdGl2ZUl0ZW06IHRoaXMuc2V0QWN0aXZlSXRlbS5iaW5kKHRoaXMpLFxuICAgICAgICAgIGdldEFjdGl2ZUl0ZW06IHRoaXMuZ2V0QWN0aXZlSXRlbS5iaW5kKHRoaXMpLFxuICAgICAgICAgIGdldEFjdGl2ZUl0ZW1JbmRleDogdGhpcy5nZXRBY3RpdmVJdGVtSW5kZXguYmluZCh0aGlzKVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ3JlbmRlcicsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgICAgICByZXR1cm4gX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoV3JhcHBlZENvbXBvbmVudCwgX2V4dGVuZHMoe30sIHRoaXMucHJvcHMsIHRoaXMuc3RhdGUsIHRoaXMuX2hhbmRsZXJzKCkpKTtcbiAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gQWN0aXZlSXRlbTtcbiAgfShfcmVhY3QyLmRlZmF1bHQuQ29tcG9uZW50KTtcbn0iLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgY2l0YXRpb25SZW5kZXIgZnJvbSAnLi9jaXRlLWNpdGF0aW9uLXJlbmRlcidcblxuY2xhc3MgQ2l0YXRpb25DaGljYWdvIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcylcbiAgfVxuXG4gIG1hcHBpbmdzKCkge1xuICAgIGxldCBtYXAgPVxuICAgICAgICAgIFtcbiAgICAgICAgICAgIHtjcmVhdG9yOiB7cHJlZml4OiAnJywgc3VmZml4OiAnLicgfX0sXG4gICAgICAgICAgICB7Y3JlYXRpb25fZGF0ZToge3ByZWZpeDogJyAnLCBzdWZmaXg6ICcuICcgfX0sXG4gICAgICAgICAgICB7dGl0bGU6IHtwcmVmaXg6ICdcIicsIHN1ZmZpeDogJy5cIiAnfX0sXG4gICAgICAgICAgICB7Y29udHJpYnV0aW5nX29yZ2FuaXphdGlvbjoge3ByZWZpeDogJyAnLCBzdWZmaXg6ICcsICcgfX0sXG4gICAgICAgICAgICB7Y3VycmVudF9kYXRlOiB7cHJlZml4OiAnQWNjZXNzZWQgJywgc3VmZml4OiAnLiAnLCBmb3JtYXR0ZXJzOiBbdGhpcy5mb3JtYXRfZGF0ZV19fSxcbiAgICAgICAgICAgIHt1cmw6IHtwcmVmaXg6ICcnLCBzdWZmaXg6ICcnIH19XG4gICAgICAgICAgXVxuICAgIHJldHVybiBtYXBcbiAgfVxuXG4gIGZvcm1hdF9kYXRlKHRpbWVzdGFtcCkge1xuICAgIGxldCBkYXRlID0gbmV3IERhdGUodGltZXN0YW1wKVxuICAgIGxldCBtb250aHMgPSBbJ0phbnVhcnknLCdGZWJydWFyeScsJ01hcmNoJywnQXByaWwnLCdNYXknLCdKdW5lJywnSnVseScsJ0F1Z3VzdCcsJ1NlcHRlbWJlcicsJ09jdG9iZXInLCdOb3ZlbWJlcicsJ0RlY2VtYmVyJ11cbiAgICBsZXQgbW9udGggPSBtb250aHNbZGF0ZS5nZXRNb250aCgpXVxuICAgIGxldCB5ZWFyICA9IGRhdGUuZ2V0RnVsbFllYXIoKVxuICAgIGxldCBkYXkgPSBkYXRlLmdldERhdGUoKVxuICAgIHJldHVybiBtb250aCArICcgJyArIGRheSArICcsICcgKyB5ZWFyXG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMucmVuZGVyX2NpdGF0aW9uKHttYXBwaW5nczogdGhpcy5tYXBwaW5ncygpfSlcbiAgfVxufVxuXG5jb25zdCBwcm9wVHlwZXMgPSB7XG4gIGNyZWF0b3I6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gIGNyZWF0aW9uX2RhdGU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gIHRpdGxlOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICBjb250cmlidXRpbmdfb3JnYW5pemF0aW9uOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICB1cmw6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gIG1hcHBpbmc6IFJlYWN0LlByb3BUeXBlcy5vYmplY3Rcbn1cblxuQ2l0YXRpb25DaGljYWdvLnByb3BUeXBlcyA9IHByb3BUeXBlc1xuXG5leHBvcnQgZGVmYXVsdCBjaXRhdGlvblJlbmRlcihDaXRhdGlvbkNoaWNhZ28pIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IGNpdGF0aW9uUmVuZGVyIGZyb20gJy4vY2l0ZS1jaXRhdGlvbi1yZW5kZXInXG5cbmNsYXNzIENpdGF0aW9uQ29pbnMgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKVxuICAgIHRoaXMubWFwcGluZ3MgPSB0aGlzLm1hcHBpbmdzLmJpbmQodGhpcylcbiAgfVxuXG5cbiAgbXVsaXR2YWx1ZV9maWVsZCh2YWx1ZXMpIHtcbiAgICB2YWx1ZXMuam9pbignLCcpXG4gIH1cblxuICBtYXBwaW5ncygpIHtcbiAgICBsZXQgZGVmYXVsdE1hcHBpbmcgPSAgXG4gICAgICAgICAgW1xuICAgICAgICAgICAge2NyZWF0b3I6IHtwcmVmaXg6ICcmYW1wO3JmdC5jcmVhdG9yJywgc3VmZml4OiAnJywgZm9ybWF0dGVyczogW2VuY29kZVVSSUNvbXBvbmVudF19fSxcbiAgICAgICAgICAgIHtjcmVhdGlvbl9kYXRlOiB7cHJlZml4OiAnICcsIHN1ZmZpeDogJy4nLCBmb3JtYXR0ZXJzOiBbZW5jb2RlVVJJQ29tcG9uZW50XX19LFxuICAgICAgICAgICAge3RpdGxlOiB7cHJlZml4OiAnJmFtcDtyZnQudGl0bGU9Jywgc3VmZml4OiAnJywgZm9ybWF0dGVyczogW2VuY29kZVVSSUNvbXBvbmVudF19fSxcbiAgICAgICAgICAgIHtkZXNjcmlwdGlvbjoge3ByZWZpeDogJyZhbXA7cmZ0LmRlc2NyaXB0aW9uPScsIHN1ZmZpeDogJycsIGZvcm1hdHRlcnM6IFtlbmNvZGVVUklDb21wb25lbnRdfX0sXG4gICAgICAgICAgICB7c3ViamVjdDoge3ByZWZpeDogJyZhbXA7cmZ0LnN1YmplY3Q9Jywgc3VmZml4OiAnJyAsIGZvcm1hdHRlcnM6IFt0aGlzLm11bGl0dmFsdWVfZmllbGQsIGVuY29kZVVSSUNvbXBvbmVudF19fSxcbiAgICAgICAgICAgIHtkZXNjcmlwdGlvbjoge3ByZWZpeDogJyZhbXA7cmZ0LmRlc2NyaXB0aW9uPScsIHN1ZmZpeDogJycsIGZvcm1hdHRlcnM6IFtlbmNvZGVVUklDb21wb25lbnRdfX0sXG4gICAgICAgICAgICB7Y29udHJpYnV0aW5nX29yZ2FuaXphdGlvbjoge3ByZWZpeDogJ3B1Ymxpc2hlcicsIHN1ZmZpeDogJycsIGZvcm1hdHRlcnM6IFtlbmNvZGVVUklDb21wb25lbnRdfX0sXG4gICAgICAgICAgICB7dHlwZToge3ByZWZpeDogJyZhbXA7cmZ0LnR5cGU9Jywgc3VmZml4OiAnJywgZm9ybWF0dGVyczogW2VuY29kZVVSSUNvbXBvbmVudF19fSxcbiAgICAgICAgICAgIHtmb3JtYXQ6IHtwcmVmaXg6ICcmYW1wO3JmdC5mb3JtYXQ9Jywgc3VmZml4OiAnJywgZm9ybWF0dGVyczogW2VuY29kZVVSSUNvbXBvbmVudF19fSxcbiAgICAgICAgICAgIHtyaWdodHM6IHtwcmVmaXg6ICcmYW1wO3JmdC5yaWdodHM9Jywgc3VmZml4OiAnJywgZm9ybWF0dGVyczogW2VuY29kZVVSSUNvbXBvbmVudF19fSxcbiAgICAgICAgICAgIHt1cmw6IHtwcmVmaXg6ICcmYW1wO3JmdC5pZGVudGlmaWVyPScsIHN1ZmZpeDogJycsIGZvcm1hdHRlcnM6IFtlbmNvZGVVUklDb21wb25lbnRdfX1cbiAgICAgICAgICBdXG4gICAgcmV0dXJuIHRoaXMucHJvcHMub3ZlcnJpZGVfbWFwcGluZ3MoZGVmYXVsdE1hcHBpbmcpXG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgbGV0IHRpdGxlID0gXCJjdHhfdmVyPVozOS44OC0yMDA0JmFtcDtyZnRfdmFsX2ZtdD1pbmZvJTNBb2ZpJTJGZm10JTNBa2V2JTNBbXR4JTNBZGNcIlxuICAgIHJldHVybiB0aGlzLnByb3BzLnJlbmRlcl9jaXRhdGlvbih7cHJlZml4OiAnPHNwYW4gY2xhc3NOYW1lPVwiWjM5ODhcIiB0aXRsZT0nICsgdGl0bGUsIHN1ZmZpeDogJzwvc3Bhbj4nLCBtYXBwaW5nczogdGhpcy5tYXBwaW5ncygpLCByZW5kZXJfaHRtbDogdHJ1ZX0pXG4gIH1cbn1cblxuY29uc3QgcHJvcFR5cGVzID0ge1xuICBjcmVhdG9yOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICBjcmVhdGlvbl9kYXRlOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICB0aXRsZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgZGVzY3JpcHRpb246IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gIGNvbnRyaWJ1dGluZ19vcmdhbml6YXRpb246IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gIHR5cGU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gIGZvcm1hdDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgcmlnaHRzOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICB1cmw6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gIG1hcHBpbmc6IFJlYWN0LlByb3BUeXBlcy5vYmplY3Rcbn1cblxuQ2l0YXRpb25Db2lucy5kZWZhdWx0UHJvcHMgPSB7XG4gIG1hcHBpbmdzOiBbe31dXG59XG5cbkNpdGF0aW9uQ29pbnMucHJvcFR5cGVzID0gcHJvcFR5cGVzXG5cbmV4cG9ydCBkZWZhdWx0IGNpdGF0aW9uUmVuZGVyKENpdGF0aW9uQ29pbnMpIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IGNpdGF0aW9uUmVuZGVyIGZyb20gJy4vY2l0ZS1jaXRhdGlvbi1yZW5kZXInXG5cbmNsYXNzIENpdGF0aW9uTWxhIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcylcbiAgfVxuXG4gIGl0YWxpY2l6ZSh0ZXh0KSB7XG4gICAgcmV0dXJuICc8aT4nICsgdGV4dCArICc8L2k+J1xuICB9XG5cbiAgcmVtb3ZlUHJvdG9jb2xzKHVybCkge1xuICAgIHJldHVybiB1cmwucmVwbGFjZSgvaHR0cDpcXC9cXC98aHR0cHM6XFwvXFwvL2ksICcnKVxuICB9XG5cbiAgZm9ybWF0X2RhdGUodGltZXN0YW1wKSB7XG4gICAgbGV0IGRhdGUgPSBuZXcgRGF0ZSh0aW1lc3RhbXApXG4gICAgbGV0IG1vbnRocyA9IFsnSmFuJywnRmViLicsJ01hci4nLCdBcHIuJywnTWF5JywnSnVuZScsJ0p1bHknLCdBdWcuJywnU2VwdC4nLCdPY3QuJywnTm92LicsJ0RlYy4nXVxuICAgIGxldCBtb250aCA9IG1vbnRoc1tkYXRlLmdldE1vbnRoKCldXG4gICAgbGV0IHllYXIgID0gZGF0ZS5nZXRGdWxsWWVhcigpXG4gICAgbGV0IGRheSA9IGRhdGUuZ2V0RGF0ZSgpXG4gICAgcmV0dXJuIGRheSArICcgJyArIG1vbnRoICsgJyAnICsgeWVhclxuXG4gIH1cblxuICBtYXBwaW5ncygpIHtcbiAgICBsZXQgbWFwID0gIFxuICAgICAgICAgIFtcbiAgICAgICAgICAgIHtjcmVhdG9yOiB7cHJlZml4OiAnJywgc3VmZml4OiAnLicgfX0sXG4gICAgICAgICAgICB7dGl0bGU6IHtwcmVmaXg6ICcgJywgc3VmZml4OiAnLicsIGZvcm1hdHRlcnM6IFt0aGlzLml0YWxpY2l6ZV0gfX0sXG4gICAgICAgICAgICB7Y3JlYXRpb25fZGF0ZToge3ByZWZpeDogJyAnLCBzdWZmaXg6ICcuJyB9fSxcbiAgICAgICAgICAgIHtjb250cmlidXRpbmdfb3JnYW5pemF0aW9uOiB7cHJlZml4OiAnICcsIHN1ZmZpeDogJywgJyB9fSxcbiAgICAgICAgICAgIHt1cmw6IHtwcmVmaXg6ICcnLCBzdWZmaXg6ICcnLCBmb3JtYXR0ZXJzOiBbdGhpcy5yZW1vdmVQcm90b2NvbHNdIH19LFxuICAgICAgICAgICAge2N1cnJlbnRfZGF0ZToge3ByZWZpeDogJyBBY2Nlc3NlZCAnLCBzdWZmaXg6ICcuJywgZm9ybWF0dGVyczogW3RoaXMuZm9ybWF0X2RhdGVdIH19XG4gICAgICAgICAgXVxuICAgIHJldHVybiBtYXBcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICByZXR1cm4gdGhpcy5wcm9wcy5yZW5kZXJfY2l0YXRpb24oe21hcHBpbmdzOiB0aGlzLm1hcHBpbmdzKCksIHJlbmRlcl9odG1sOiB0cnVlfSlcbiAgfVxufVxuXG5jb25zdCBwcm9wVHlwZXMgPSB7XG4gIGNyZWF0b3I6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gIGNyZWF0aW9uX2RhdGU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gIHRpdGxlOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LFxuICBjb250cmlidXRpbmdfb3JnYW5pemF0aW9uOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICB1cmw6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gIG1hcHBpbmc6IFJlYWN0LlByb3BUeXBlcy5vYmplY3Rcbn1cblxuQ2l0YXRpb25NbGEucHJvcFR5cGVzID0gcHJvcFR5cGVzXG5cbmV4cG9ydCBkZWZhdWx0IGNpdGF0aW9uUmVuZGVyKENpdGF0aW9uTWxhKSIsImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY2l0YXRpb25SZW5kZXIoQ2l0YXRpb25Gb3JtYXQpIHtcbiAgcmV0dXJuIGNsYXNzIENpdGF0aW9uIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgc3VwZXIocHJvcHMpXG4gICAgICB0aGlzLnJlbmRlcl9jaXRhdGlvbiA9IHRoaXMucmVuZGVyX2NpdGF0aW9uLmJpbmQodGhpcylcbiAgICAgIHRoaXMuX2Zvcm1hdCA9IHRoaXMuX2Zvcm1hdC5iaW5kKHRoaXMpXG4gICAgICB0aGlzLm92ZXJyaWRlX21hcHBpbmdzID0gdGhpcy5vdmVycmlkZV9tYXBwaW5ncy5iaW5kKHRoaXMpXG4gICAgICB0aGlzLl9vdmVycmlkZV9tYXBwaW5nID0gdGhpcy5fb3ZlcnJpZGVfbWFwcGluZy5iaW5kKHRoaXMpXG4gICAgICB0aGlzLl92YWx1ZXMgPSB0aGlzLl92YWx1ZXMuYmluZCh0aGlzKVxuICAgIH1cblxuICAgIG92ZXJyaWRlX21hcHBpbmdzKG1hcHBpbmdzKSB7XG4gICAgICByZXR1cm4gbWFwcGluZ3MubWFwKCAobWFwcGluZykgPT4geyBcbiAgICAgICAgcmV0dXJuIHRoaXMuX292ZXJyaWRlX21hcHBpbmcobWFwcGluZylbMF1cbiAgICAgIH0pXG4gICAgICByZXR1cm4gbWFwcGVkXG4gICAgfVxuICAgIFxuICAgIHJlbmRlcl9jaXRhdGlvbih7IG1hcHBpbmdzID0gW10sIHJlbmRlcl9odG1sID0gZmFsc2UsIHByZWZpeCA9ICcnLCBzdWZmaXggPSAnJyB9KSB7XG4gICAgICBpZiAocmVuZGVyX2h0bWwpIHtcbiAgICAgICAgcmV0dXJuIDxzcGFuPjxkaXYgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3tfX2h0bWw6IHByZWZpeCArIHRoaXMuX3ZhbHVlcyhtYXBwaW5ncykgKyBzdWZmaXh9fSAvPjwvc3Bhbj5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiA8c3Bhbj57cHJlZml4fXt0aGlzLl92YWx1ZXMobWFwcGluZ3MpfXtwcmVmaXh9PC9zcGFuPlxuICAgICAgfVxuICAgIH1cblxuICAgIF92YWx1ZXMobWFwcGluZ3MpIHtcbiAgICAgIGxldCBhZmZpeCAgPSB0aGlzLl9hZmZpeFxuICAgICAgbGV0IGZvcm1hdCA9IHRoaXMuX2Zvcm1hdFxuICAgICAgbGV0IHByb3BzICA9IHRoaXMucHJvcHNcbiAgICAgIGxldCB2YWx1ZXMgPSBbXVxuICAgICAgbWFwcGluZ3MubWFwKGZ1bmN0aW9uKGZpZWxkLCBpKSB7XG4gICAgICAgIGxldCBmaWVsZF9uYW1lID0gT2JqZWN0LmtleXMoZmllbGQpWzBdXG4gICAgICAgIGxldCB2YWwgICAgICAgID0gcHJvcHMuZmllbGRfdmFsdWVzW2ZpZWxkX25hbWVdXG4gICAgICAgIGlmICh2YWwpe1xuICAgICAgICAgIGxldCBjb25maWcgICAgID0gZmllbGRbZmllbGRfbmFtZV1cbiAgICAgICAgICBsZXQgZm9ybWF0dGVkICA9IGZvcm1hdCh2YWwsIGNvbmZpZy5mb3JtYXR0ZXJzKVxuICAgICAgICAgIHZhbHVlcy5wdXNoKGFmZml4KGZvcm1hdHRlZCwgY29uZmlnLnByZWZpeCwgY29uZmlnLnN1ZmZpeCkpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICByZXR1cm4gdmFsdWVzLmpvaW4oJycpXG4gICAgfVxuXG4gICAgX2FmZml4KHZhbHVlLCBwcmVmaXgsIHN1ZmZpeCkge1xuICAgICAgcmV0dXJuICh2YWx1ZSkgPyBwcmVmaXggKyB2YWx1ZSArIHN1ZmZpeCA6ICcnXG4gICAgfVxuXG4gICAgX2Zvcm1hdCh2YWx1ZSwgZm9ybWF0dGVycyA9IFsodmFsdWUpID0+IHZhbHVlXSkge1xuICAgICAgcmV0dXJuIGZvcm1hdHRlcnMubWFwKGZ1bmN0aW9uKGZvcm1hdHRlcikgeyBcbiAgICAgICAgICByZXR1cm4gZm9ybWF0dGVyKHZhbHVlKSBcbiAgICAgICAgfSwgdmFsdWUpXG4gICAgfVxuXG4gICAgX292ZXJyaWRlX21hcHBpbmcobWFwcGluZykge1xuICAgICAgcmV0dXJuIHRoaXMucHJvcHMubWFwcGluZ3MubWFwKGZ1bmN0aW9uKG1hcHBpbmdfb3ZlcnJpZGUpIHtcbiAgICAgICAgaWYgKG1hcHBpbmdbT2JqZWN0LmtleXMobWFwcGluZ19vdmVycmlkZSlbMF1dKSB7XG4gICAgICAgICAgcmV0dXJuIG1hcHBpbmdfb3ZlcnJpZGVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbWFwcGluZ1xuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgIHJldHVybiA8Q2l0YXRpb25Gb3JtYXQgey4uLnRoaXMucHJvcHN9IFxuICAgICAgICAgICAgICAgIG92ZXJyaWRlX21hcHBpbmdzPXt0aGlzLm92ZXJyaWRlX21hcHBpbmdzfVxuICAgICAgICAgICAgICAgIHJlbmRlcl9jaXRhdGlvbj17dGhpcy5yZW5kZXJfY2l0YXRpb259IC8+XG4gICAgfVxuICB9XG59IiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IGNpdGF0aW9uUmVuZGVyIGZyb20gJy4vY2l0ZS1jaXRhdGlvbi1yZW5kZXInXG5cbmNsYXNzIENpdGF0aW9uV2lraXBlZGlhIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcylcbiAgfVxuXG4gIHJlbW92ZVByb3RvY29scyh1cmwpIHtcbiAgICByZXR1cm4gdXJsLnJlcGxhY2UoL2h0dHA6XFwvXFwvfGh0dHBzOlxcL1xcLy9pLCAnJylcbiAgfVxuXG4gIG1hcHBpbmdzKCkge1xuICAgIGxldCBtYXAgPSAgXG4gICAgICAgICAgW1xuICAgICAgICAgICAge3JlZl9uYW1lOiB7cHJlZml4OiAnPHJlZiBuYW1lPScsIHN1ZmZpeDogJz4ge3snIH19LFxuICAgICAgICAgICAge3VybDoge3ByZWZpeDogJ2NpdGUgd2ViIHwgdXJsPScsIHN1ZmZpeDogJyd9fSxcbiAgICAgICAgICAgIHt0eXBlOiB7cHJlZml4OiAnIHwgdGl0bGU9ICgnLCBzdWZmaXg6ICcpICd9fSxcbiAgICAgICAgICAgIHt0aXRsZToge3ByZWZpeDogJycsIHN1ZmZpeDogJywnfX0sXG4gICAgICAgICAgICB7Y3JlYXRpb25fZGF0ZToge3ByZWZpeDogJygnLCBzdWZmaXg6ICcpJyB9fSxcbiAgICAgICAgICAgIHtjcmVhdG9yOiB7cHJlZml4OiAnIHwgYXV0aG9yPScsIHN1ZmZpeDogJycgfX0sXG4gICAgICAgICAgICB7Y3VycmVudF9kYXRlOiB7cHJlZml4OiAnIHwgYWNjZXNzZGF0ZT0nLCBzdWZmaXg6ICcnIH19LFxuICAgICAgICAgICAge2NvbnRyaWJ1dGluZ19vcmdhbml6YXRpb246IHtwcmVmaXg6ICcgfCBwdWJsaXNoZXI9Jywgc3VmZml4OiAnfX0gPC9yZWY+JyB9fVxuICAgICAgICAgIF1cbiAgICByZXR1cm4gbWFwXG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMucmVuZGVyX2NpdGF0aW9uKHttYXBwaW5nczogdGhpcy5tYXBwaW5ncygpfSlcbiAgfVxufVxuXG5jb25zdCBwcm9wVHlwZXMgPSB7XG4gIHJlZl9uYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLCBcbiAgY3JlYXRvcjogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgY3JlYXRpb25fZGF0ZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgdGl0bGU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gIGNvbnRyaWJ1dGluZ19vcmdhbml6YXRpb246IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gIHVybDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgbWFwcGluZzogUmVhY3QuUHJvcFR5cGVzLm9iamVjdFxufVxuXG5DaXRhdGlvbldpa2lwZWRpYS5wcm9wVHlwZXMgPSBwcm9wVHlwZXNcblxuZXhwb3J0IGRlZmF1bHQgY2l0YXRpb25SZW5kZXIoQ2l0YXRpb25XaWtpcGVkaWEpIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IENpdGF0aW9uQ29pbnMgZnJvbSAnLi9jaXRlLWNpdGF0aW9uLWNvaW5zJ1xuaW1wb3J0IENpdGF0aW9uQ2hpY2FnbyBmcm9tICcuL2NpdGUtY2l0YXRpb24tY2hpY2FnbydcbmltcG9ydCBDaXRhdGlvbk1sYSBmcm9tICcuL2NpdGUtY2l0YXRpb24tbWxhJ1xuaW1wb3J0IENpdGF0aW9uV2lraXBlZGlhIGZyb20gJy4vY2l0ZS1jaXRhdGlvbi13aWtpcGVkaWEnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENpdGF0aW9uIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcylcblxuICAgIHRoaXMuX2NpdGF0aW9uVHlwZSA9IHRoaXMuX2NpdGF0aW9uVHlwZS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgX2NpdGF0aW9uVHlwZSgpIHtcbiAgICBjb25zdCBpdGVtID0gdGhpcy5wcm9wcy5nZXRBY3RpdmVJdGVtKCk7XG4gICAgc3dpdGNoIChpdGVtLnR5cGUpIHtcbiAgICAgIGNhc2UgJ2NoaWNhZ28nOlxuICAgICAgICByZXR1cm4gPENpdGF0aW9uQ2hpY2FnbyBjbGFzc05hbWU9XCJjaGljYWdvXCIgey4uLmZpZWxkc30gLz47XG4gICAgICBjYXNlICdtbGEnOlxuICAgICAgICByZXR1cm4gPENpdGF0aW9uTWxhIGNsYXNzTmFtZT1cIm1sYVwiIHsuLi5maWVsZHN9IC8+O1xuICAgICAgY2FzZSAnd2lraSc6XG4gICAgICAgIHJldHVybiA8Q2l0YXRpb25XaWtpcGVkaWEgY2xhc3NOYW1lPVwid2lraVwiIHsuLi5maWVsZHN9IC8+O1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIDxkaXY+Tm8gVmlld2VyIEF2YWlhbGFibGUgZm9yIHR5cGU6IHtpdGVtLnR5cGV9PC9kaXY+O1xuICAgIH1cbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICBsZXQgZmllbGRzID0gdGhpcy5wcm9wcy5maWVsZHNcbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNpdGF0aW9uXCI+XG4gICAgICAgICAge3RoaXMuX2NpdGF0aW9uVHlwZSgpfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIClcbiAgfVxufVxuXG5jb25zdCBwcm9wVHlwZXMgPSB7XG4gIGZpZWxkczogUmVhY3QuUHJvcFR5cGVzLmFycmF5LFxuICBtYXBwaW5nOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0XG59XG5cbkNpdGF0aW9uQ2hpY2Fnby5wcm9wVHlwZXMgPSBwcm9wVHlwZXMiLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERldGFpbHNGaWVsZFZhbHVlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcylcbiAgICB0aGlzLl9maWVsZCA9ICB0aGlzLl9maWVsZC5iaW5kKHRoaXMpXG4gICAgdGhpcy5fbGluayAgPSAgdGhpcy5fbGluay5iaW5kKHRoaXMpXG4gICAgdGhpcy5fZGFuZ2VyID0gdGhpcy5fZGFuZ2VyLmJpbmQodGhpcylcbiAgICB0aGlzLl9kZWxpbWl0ZXIgPSB0aGlzLl9kZWxpbWl0ZXIuYmluZCh0aGlzKVxuICAgIHRoaXMuX3RleHQgPSB0aGlzLl90ZXh0LmJpbmQodGhpcylcbiAgfVxuXG4gIF9jcmVhdGVNYXJrdXAodmFsdWUpIHtcbiAgICByZXR1cm4gKHtfX2h0bWw6IHZhbHVlfSlcbiAgfVxuXG4gIF9saW5rKCkge1xuICAgIHJldHVybiBgPGEgaHJlZj1cIiR7dGhpcy5wcm9wcy51cmx9XCI+JHt0aGlzLnByb3BzLnRleHR9PC9hPmBcbiAgfVxuXG4gIF9maWVsZCgpIHtcbiAgICBpZiAodGhpcy5wcm9wcy51cmwpIHtcbiAgICAgIHJldHVybiB0aGlzLl9kYW5nZXIodGhpcy5fbGluaygpKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5fZGFuZ2VyKHRoaXMucHJvcHMudGV4dClcbiAgICB9XG4gIH1cblxuICBfZGFuZ2VyKGh0bWwpIHtcbiAgICByZXR1cm4gPGRpdiBkYW5nZXJvdXNseVNldElubmVySFRNTD17dGhpcy5fY3JlYXRlTWFya3VwKGh0bWwpfSAvPlxuICB9XG5cbiAgX3RleHQoKSB7XG4gICAgcmV0dXJuICh0aGlzLnByb3BzLnRleHQgPT0gJ3VuZGVmaW5lZCcpID8gdGhpcy5fZGFuZ2VyKHRoaXMucHJvcHMudGV4dCkgOiAnJ1xuICB9XG5cbiAgX2RlbGltaXRlcigpIHtcbiAgICByZXR1cm4gKHRoaXMucHJvcHMuZGVsaW1pdGVyID09ICd1bmRlZmluZWQnKSA/IHRoaXMuX2Rhbmdlcih0aGlzLnByb3BzLmRlbGltaXRlcikgOiAnJ1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiA8c3Bhbj57dGhpcy5fZmllbGQoKX17dGhpcy5fZGVsaW1pdGVyKCl9PC9zcGFuPlxuICB9XG59XG5cbmNvbnN0IHByb3BUeXBlcyA9IHtcbiAgdGV4dDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICBkZWxpbWl0ZXI6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gIHVybDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xufVxuXG5EZXRhaWxzRmllbGRWYWx1ZS5wcm9wVHlwZXMgPSBwcm9wVHlwZXMiLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgRGV0YWlsc0ZpZWxkVmFsdWUgZnJvbSAnLi9jaXRlLWRldGFpbHMtZmllbGQtdmFsdWUnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERldGFpbHNGaWVsZCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpXG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgbGV0IHsgZmllbGRfdmFsdWVzLCBsYWJlbCwgZGVsaW1pdGVyfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBmaWVsZF9jbGFzcyA9IGBkZXRhaWwtZmllbGQtJHtsYWJlbC5yZXBsYWNlKC9cXHMvZywgJycpLnRvTG93ZXJDYXNlKCl9YFxuICAgIHJldHVybiAoXG4gICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtmaWVsZF9jbGFzc30+XG4gICAgICAgICAgICAgICAgPGR0IGNsYXNzTmFtZT1cImZpZWxkLWxhYmVsXCI+XG4gICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdsYWJlbCBsYWJlbC1kZWZhdWx0Jz57bGFiZWx9OjwvbGFiZWw+XG4gICAgICAgICAgICAgICAgPC9kdD5cbiAgICAgICAgICAgICAgICA8ZGQgY2xhc3NOYW1lPVwiZmllbGQtZGVmaW5pdGlvblwiPlxuICAgICAgICAgICAgICAgICAge2ZpZWxkX3ZhbHVlcy5tYXAoZnVuY3Rpb24oZmllbGRfdmFsdWUsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsaW1pdGVyID0gKGkgPCBmaWVsZF92YWx1ZXMubGVuZ3RoIC0gMSkgPyBkZWxpbWl0ZXIgOiAnJ1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKDxEZXRhaWxzRmllbGRWYWx1ZSBrZXk9e2l9IHVybD17ZmllbGRfdmFsdWUudXJsfSB0ZXh0PXtmaWVsZF92YWx1ZS50ZXh0fSBkZWxpbWl0ZXI9e2RlbGltaXRlcn0gLz4pXG4gICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICA8L2RkPlxuICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICApXG4gIH1cbn1cblxuY29uc3QgcHJvcFR5cGVzID0ge1xuICBsYWJlbDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICBkZWxpbWl0ZXI6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gIHVybDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgZmllbGRfdmFsdWVzOiBSZWFjdC5Qcm9wVHlwZXMuYXJyYXkuaXNSZXF1aXJlZFxufVxuXG5EZXRhaWxzRmllbGQucHJvcFR5cGVzID0gcHJvcFR5cGVzIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IERldGFpbHNGaWVsZCBmcm9tICcuL2NpdGUtZGV0YWlscy1maWVsZCdcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGV0YWlscyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpXG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgbGV0IHsgZmllbGRzIH0gID0gdGhpcy5wcm9wc1xuICAgIHJldHVybiAoXG4gICAgICAgIDxkbCBjbGFzc05hbWU9XCJyb3cgZGV0YWlsc1wiPlxuICAgICAgICAgIHtmaWVsZHMubWFwKGZ1bmN0aW9uKGZpZWxkLCBpKSB7XG4gICAgICAgICAgICByZXR1cm4gPERldGFpbHNGaWVsZCBrZXk9e2l9IHsuLi5maWVsZH0gLz5cbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kbD5cbiAgICAgIClcbiAgfVxufVxuXG5jb25zdCBwcm9wVHlwZXMgPSB7XG4gIGZpZWxkczogUmVhY3QuUHJvcFR5cGVzLmFycmF5LmlzUmVxdWlyZWRcbn1cblxuRGV0YWlscy5wcm9wVHlwZXMgPSBwcm9wVHlwZXMiLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENpdGVEb3dubG9hZFNvdXJjZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpXG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgbGV0IHsgbGFiZWwsIHNyYyB9ICA9IHRoaXMucHJvcHNcbiAgICByZXR1cm4gIChcbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8YSBocmVmPXtzcmN9PlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1kb3dubG9hZC1hbHRcIj48L3NwYW4+IHtsYWJlbH1cbiAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKVxuICB9XG59XG5cbmNvbnN0IHByb3BUeXBlcyA9IHtcbiAgc3JjOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gIGxhYmVsOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG59XG5cbkNpdGVEb3dubG9hZFNvdXJjZS5wcm9wVHlwZXMgPSBwcm9wVHlwZXMiLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgQ2l0ZVRodW1ibmFpbCBmcm9tICcuL2NpdGUtdGh1bWJuYWlsJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEb3dubG9hZCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpXG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgbGV0IHsgZmllbGRzLCBsYWJlbCB9ICA9IHRoaXMucHJvcHNcbiAgICByZXR1cm4gIChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3dcIj5cbiAgICAgICAgICAgICAgICB7ZmllbGRzLm1hcChmdW5jdGlvbihmaWVsZCwgaSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIDxDaXRlVGh1bWJuYWlsIGtleT17aX0gey4uLmZpZWxkfS8+XG4gICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKVxuICB9XG59XG5cbmNvbnN0IHByb3BUeXBlcyA9IHtcbiAgZmllbGRzOiBSZWFjdC5Qcm9wVHlwZXMuYXJyYXkuaXNSZXF1aXJlZFxufVxuXG5Eb3dubG9hZC5wcm9wVHlwZXMgPSBwcm9wVHlwZXMiLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENpdGVOYXZpZ2F0aW9uSXRlbSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpXG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgY29uc3QgeyBhY3RpdmUsIHNldEFjdGl2ZUl0ZW0sIGxhYmVsIH0gPSB0aGlzLnByb3BzICAgICAgXG4gICAgcmV0dXJuIChcbiAgICAgIDxsaSByb2xlPVwicHJlc2VudGF0aW9uXCIgY2xhc3NOYW1lPXthY3RpdmV9PlxuICAgICAgICA8YSBvbkNsaWNrPXtzZXRBY3RpdmVJdGVtfSBocmVmPVwiI1wiPntsYWJlbH08L2E+XG4gICAgICA8L2xpPlxuICAgIClcbiAgfVxuXG59XG5cbmNvbnN0IHByb3BUeXBlcyA9IHtcbiAgbGFiZWw6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgc2V0QWN0aXZlSXRlbTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgY2xhc3NfbmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xufVxuXG5DaXRlTmF2aWdhdGlvbkl0ZW0ucHJvcFR5cGVzID0gcHJvcFR5cGVzIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IENpdGVOYXZpZ2F0aW9uSXRlbSBmcm9tICcuL2NpdGUtbmF2aWdhdGlvbi1pdGVtJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDaXRlTmF2aWdhdGlvbiBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpXG4gICAgdGhpcy5hY3RpdmVfY2xhc3MgPSB0aGlzLmFjdGl2ZV9jbGFzcy5iaW5kKHRoaXMpXG4gICAgdGhpcy5hY3RpdmVfaW5kZXggPSB0aGlzLmFjdGl2ZV9pbmRleC5iaW5kKHRoaXMpXG4gIH1cblxuICBhY3RpdmVfaW5kZXgoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMuZ2V0QWN0aXZlSXRlbUluZGV4KClcbiAgfVxuXG4gIGFjdGl2ZV9jbGFzcyhpKSB7XG4gICAgcmV0dXJuICh0aGlzLmFjdGl2ZV9pbmRleCgpID09IGkpID8gJ2FjdGl2ZScgOiAnJ1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIGNvbnN0IHsgaXRlbXMsIGNsYXNzX25hbWUsIHNldEFjdGl2ZUl0ZW0sIGdldEFjdGl2ZUl0ZW0gfSA9IHRoaXMucHJvcHNcbiAgICBsZXQgYWN0aXZlX2NsYXNzID0gdGhpcy5hY3RpdmVfY2xhc3M7XG4gICAgdmFyIHN0eWxlID0ge31cbiAgICBpZiAoIXRoaXMucHJvcHMubmF2aWdhdGlvbikge1xuICAgICAgc3R5bGVbJ2Rpc3BsYXknXSA9ICdub25lJztcbiAgICB9XG4gICAgcmV0dXJuICg8dWwgY2xhc3NOYW1lPXsnY2l0YXRpb24tbmF2aWdhdGlvbiAnICsgY2xhc3NfbmFtZX0gc3R5bGU9e3N0eWxlfT5cbiAgICAgICAgICAgICAge2l0ZW1zLm1hcChmdW5jdGlvbihpdGVtLCBpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgIDxDaXRlTmF2aWdhdGlvbkl0ZW0gbGFiZWw9e2l0ZW0ubGFiZWx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17aX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlPXthY3RpdmVfY2xhc3MoaSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZUl0ZW09e3NldEFjdGl2ZUl0ZW0uYmluZCh0aGlzLCBpKX0gLz5cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgPC91bD4pXG4gIH1cbn1cblxuY29uc3QgcHJvcFR5cGVzID0ge1xuICBpdGVtczogUmVhY3QuUHJvcFR5cGVzLmFycmF5LmlzUmVxdWlyZWQsXG4gIHNldEFjdGl2ZUl0ZW06IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gIGdldEFjdGl2ZUl0ZW1JbmRleDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgY2xhc3NfbmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xufVxuXG5DaXRlTmF2aWdhdGlvbi5kZWZhdWx0UHJvcHMgPSB7XG4gIGNsYXNzX25hbWU6ICduYXYgbmF2LXBpbGxzJ1xufVxuXG5DaXRlTmF2aWdhdGlvbi5wcm9wVHlwZXMgPSBwcm9wVHlwZXMiLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgRG93bmxvYWRTb3VyY2UgZnJvbSAnLi9jaXRlLWRvd25sb2FkLXNvdXJjZSdcblxuY2xhc3MgQ2l0ZVRodW1ibmFpbCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpXG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgbGV0IHsgdGh1bWJuYWlsLCBzb3VyY2VzIH0gPSB0aGlzLnByb3BzXG4gICAgcmV0dXJuICAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLW1kLTIgZG93bmxvYWQtc291cmNlXCI+XG4gICAgICAgICAgICAgICAgPGltZyBjbGFzc05hbWU9XCJ0aHVtYm5haWxcIiBzcmM9e3RodW1ibmFpbH0gLz5cbiAgICAgICAgICAgICAgICB7c291cmNlcy5tYXAoKHNvdXJjZSwgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIDxEb3dubG9hZFNvdXJjZSBrZXk9e2l9IHsuLi5zb3VyY2V9IC8+XG4gICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKVxuICB9XG59XG5cbmNvbnN0IHByb3BUeXBlcyA9IHtcbiAgdGh1bWJuYWlsOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gIHNvdXJjZXM6IFJlYWN0LlByb3BUeXBlcy5hcnJheS5pc1JlcXVpcmVkXG59XG5cbkNpdGVUaHVtYm5haWwucHJvcFR5cGVzID0gcHJvcFR5cGVzXG5cbmV4cG9ydCBkZWZhdWx0IENpdGVUaHVtYm5haWxcblxuIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuXG5jb25zdCBUcmFuc2NyaXB0ID0gcHJvcHMgPT4gKDxkaXYgY2xhc3NOYW1lPVwidHJhbnNjcmlwdFwiPntwcm9wcy50cmFuc2NyaXB0fTwvZGl2PilcblxuY29uc3QgcHJvcFR5cGVzID0ge1xuICB0cmFuc2NyaXB0OiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWRcbn1cblxuVHJhbnNjcmlwdC5wcm9wVHlwZXMgPSBwcm9wVHlwZXNcblxuZXhwb3J0IGRlZmF1bHQgVHJhbnNjcmlwdCIsImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgQWN0aXZlSXRlbSBmcm9tICdyZWFjdC1hY3RpdmUtaXRlbSc7XG5cbmltcG9ydCBDaXRlTmF2aWdhdGlvbiBmcm9tICcuL2NpdGUtbmF2aWdhdGlvbic7XG5pbXBvcnQgRGV0YWlscyBmcm9tICcuL2NpdGUtZGV0YWlscyc7XG5pbXBvcnQgQ2l0YXRpb24gZnJvbSAnLi9jaXRlLWNpdGF0aW9uJztcbmltcG9ydCBEb3dubG9hZCBmcm9tICcuL2NpdGUtZG93bmxvYWQnO1xuaW1wb3J0IFRyYW5zY3JpcHQgZnJvbSAnLi9jaXRlLXRyYW5zY3JpcHQnO1xuXG5jbGFzcyBSZWFjdENpdGF0aW9uIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcblxuICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKTtcbiAgICB0aGlzLl92aWV3ZXIgPSB0aGlzLl92aWV3ZXIuYmluZCh0aGlzKTtcbiAgfVxuXG4gIF92aWV3ZXIoKSB7XG4gICAgY29uc3QgaXRlbSA9IHRoaXMucHJvcHMuZ2V0QWN0aXZlSXRlbSgpO1xuICAgIHN3aXRjaCAoaXRlbS50eXBlKSB7XG4gICAgICBjYXNlICdkZXRhaWxzJzpcbiAgICAgICAgcmV0dXJuIDxEZXRhaWxzIGZpZWxkcz17aXRlbS5maWVsZHN9IC8+O1xuICAgICAgY2FzZSAnY2l0YXRpb24nOlxuICAgICAgICByZXR1cm4gPENpdGF0aW9uIGZpZWxkcz17aXRlbS5maWVsZHN9IGNpdGF0aW9uVHlwZT17dGhpcy5wcm9wcy5jaXRhdGlvblR5cGV9IC8+O1xuICAgICAgY2FzZSAnZG93bmxvYWQnOlxuICAgICAgICByZXR1cm4gPERvd25sb2FkIGZpZWxkcz17aXRlbS5maWVsZHN9IC8+O1xuICAgICAgY2FzZSAndHJhbnNjcmlwdCc6XG4gICAgICAgIHJldHVybiA8VHJhbnNjcmlwdCB0cmFuc2NyaXB0PXtpdGVtLnRyYW5zY3JpcHR9IC8+O1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIDxkaXY+Tm8gVmlld2VyIEF2YWlhbGFibGUgZm9yIHR5cGU6IHtpdGVtLnR5cGV9PC9kaXY+O1xuICAgIH1cbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICBjb25zdCB0eXBlID0gdGhpcy5wcm9wcy5nZXRBY3RpdmVJdGVtKCkudHlwZTtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPENpdGVOYXZpZ2F0aW9uIHsuLi50aGlzLnByb3BzfSAvPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YGNpdGUtJHt0eXBlfWB9PlxuICAgICAgICAgIHt0aGlzLl92aWV3ZXIoKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG59XG5cbmNvbnN0IHByb3BUeXBlcyA9IHtcbiAgaXRlbXM6IFJlYWN0LlByb3BUeXBlcy5hcnJheS5pc1JlcXVpcmVkLFxuICBnZXRBY3RpdmVJdGVtOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxufTtcblxuUmVhY3RDaXRhdGlvbi5wcm9wVHlwZXMgPSBwcm9wVHlwZXM7XG5cbmV4cG9ydCBkZWZhdWx0IEFjdGl2ZUl0ZW0oUmVhY3RDaXRhdGlvbik7XG4iXX0=
