/*
MIT LICENSE
Copyright (c) 2007 Monsur Hossain (http://monsur.hossa.in)

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/

// Avoid polluting the global namespace if we're using a module loader
(function(){

    /**
     * Creates a new Cache object.
     * @param {number} maxSize The maximum size of the cache (or -1 for no max).
     * @param {boolean} debug Whether to log events to the console.log.
     * @constructor
     */
    function Cache(maxSize, debug, storage) {
        this.maxSize_ = maxSize || -1;
        this.debug_ = debug || false;
        this.storage_ = storage || new Cache.BasicCacheStorage();
    
        this.fillFactor_ = .75;
    
        this.stats_ = {};
        this.stats_['hits'] = 0;
        this.stats_['misses'] = 0;
        this.log_('Initialized cache with size ' + maxSize);
    }
    
    /**
     * An easier way to refer to the priority of a cache item
     * @enum {number}
     */
    Cache.Priority = {
      'LOW': 1,
      'NORMAL': 2,
      'HIGH': 4
    };
    
    /**
     * Basic in memory cache storage backend.
     * @constructor
     */
    Cache.BasicCacheStorage = function() {
      this.items_ = {};
      this.count_ = 0;
    }
    Cache.BasicCacheStorage.prototype.get = function(key) {
      return this.items_[key];
    }
    Cache.BasicCacheStorage.prototype.set = function(key, value) {
      if (typeof this.get(key) === "undefined")
        this.count_++;
      this.items_[key] = value;
    }
    Cache.BasicCacheStorage.prototype.size = function(key, value) {
      return this.count_;
    }
    Cache.BasicCacheStorage.prototype.remove = function(key) {
      var item = this.get(key);
      if (typeof item !== "undefined")
        this.count_--;
      delete this.items_[key];
      return item;
    }
    Cache.BasicCacheStorage.prototype.keys = function() {
      var ret = [], p;
      for (p in this.items_) ret.push(p);
      return ret;
    }
    
    /**
     * Local Storage based persistant cache storage backend.
     * If a size of -1 is used, it will purge itself when localStorage
     * is filled. This is 5MB on Chrome/Safari.
     * WARNING: The amortized cost of this cache is very low, however,
     * when a the cache fills up all of localStorage, and a purge is required, it can
     * take a few seconds to fetch all the keys and values in storage.
     * Since localStorage doesn't have namespacing, this means that even if this
     * individual cache is small, it can take this time if there are lots of other
     * other keys in localStorage.
     *
     * @param {string} namespace A string to namespace the items in localStorage. Defaults to 'default'.
     * @constructor
     */
    Cache.LocalStorageCacheStorage = function(namespace) {
      this.prefix_ = 'cache-storage.' + (namespace || 'default') + '.';
      // Regexp String Escaping from http://simonwillison.net/2006/Jan/20/escape/#p-6
      var escapedPrefix = this.prefix_.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      this.regexp_ = new RegExp('^' + escapedPrefix)
    }
    Cache.LocalStorageCacheStorage.prototype.get = function(key) {
      var item = window.localStorage[this.prefix_ + key];
      if (item) return JSON.parse(item);
      return null;
    }
    Cache.LocalStorageCacheStorage.prototype.set = function(key, value) {
      window.localStorage[this.prefix_ + key] = JSON.stringify(value);
    }
    Cache.LocalStorageCacheStorage.prototype.size = function(key, value) {
      return this.keys().length;
    }
    Cache.LocalStorageCacheStorage.prototype.remove = function(key) {
      var item = this.get(key);
      delete window.localStorage[this.prefix_ + key];
      return item;
    }
    Cache.LocalStorageCacheStorage.prototype.keys = function() {
      var ret = [], p;
      for (p in window.localStorage) {
        if (p.match(this.regexp_)) ret.push(p.replace(this.prefix_, ''));
      };
      return ret;
    }
    
    /**
     * Retrieves an item from the cache.
     * @param {string} key The key to retrieve.
     * @return {Object} The item, or null if it doesn't exist.
     */
    Cache.prototype.getItem = function(key) {
    
      // retrieve the item from the cache
      var item = this.storage_.get(key);
    
      if (item != null) {
        if (!this.isExpired_(item)) {
          // if the item is not expired
          // update its last accessed date
          item.lastAccessed = new Date().getTime();
        } else {
          // if the item is expired, remove it from the cache
          this.removeItem(key);
          item = null;
        }
      }
    
      // return the item value (if it exists), or null
      var returnVal = item ? item.value : null;
      if (returnVal) {
        this.stats_['hits']++;
        this.log_('Cache HIT for key ' + key)
      } else {
        this.stats_['misses']++;
        this.log_('Cache MISS for key ' + key)
      }
      return returnVal;
    };
    
    
    Cache._CacheItem = function(k, v, o) {
        if (!k) {
          throw new Error("key cannot be null or empty");
        }
        this.key = k;
        this.value = v;
        o = o || {};
        if (o.expirationAbsolute) {
          o.expirationAbsolute = o.expirationAbsolute.getTime();
        }
        if (!o.priority) {
          o.priority = Cache.Priority.NORMAL;
        }
        this.options = o;
        this.lastAccessed = new Date().getTime();
    };
    
    
    /**
     * Sets an item in the cache.
     * @param {string} key The key to refer to the item.
     * @param {Object} value The item to cache.
     * @param {Object} options an optional object which controls various caching
     *    options:
     *      expirationAbsolute: the datetime when the item should expire
     *      expirationSliding: an integer representing the seconds since
     *                         the last cache access after which the item
     *                         should expire
     *      priority: How important it is to leave this item in the cache.
     *                You can use the values Cache.Priority.LOW, .NORMAL, or
     *                .HIGH, or you can just use an integer.  Note that
     *                placing a priority on an item does not guarantee
     *                it will remain in cache.  It can still be purged if
     *                an expiration is hit, or if the cache is full.
     *      callback: A function that gets called when the item is purged
     *                from cache.  The key and value of the removed item
     *                are passed as parameters to the callback function.
     */
    Cache.prototype.setItem = function(key, value, options) {
    
      // add a new cache item to the cache
      if (this.storage_.get(key) != null) {
        this.removeItem(key);
      }
      this.addItem_(new Cache._CacheItem(key, value, options));
      this.log_("Setting key " + key);
    
      // if the cache is full, purge it
      if ((this.maxSize_ > 0) && (this.size() > this.maxSize_)) {
        var that = this;
        setTimeout(function() {
          that.purge_.call(that);
        }, 0);
      }
    };
    
    
    /**
     * Removes all items from the cache.
     */
    Cache.prototype.clear = function() {
      // loop through each item in the cache and remove it
      var keys = this.storage_.keys()
      for (var i = 0; i < keys.length; i++) {
        this.removeItem(keys[i]);
      }
      this.log_('Cache cleared');
    };
    
    
    /**
     * @return {Object} The hits and misses on the cache.
     */
    Cache.prototype.getStats = function() {
      return this.stats_;
    };
    
    
    /**
     * @return {string} Returns an HTML string representation of the cache.
     */
    Cache.prototype.toHtmlString = function() {
      var returnStr = this.size() + " item(s) in cache<br /><ul>";
      var keys = this.storage_.keys()
      for (var i = 0; i < keys.length; i++) {
        var item = this.storage_.get(keys[i]);
        returnStr = returnStr + "<li>" + item.key.toString() + " = " +
            item.value.toString() + "</li>";
      }
      returnStr = returnStr + "</ul>";
      return returnStr;
    };
    
    
    /**
     * Allows it to resize the Cache capacity if needed.
     * @param	{integer} newMaxSize the new max amount of stored entries within the Cache
     */
    Cache.prototype.resize = function(newMaxSize) {
      this.log_('Resizing Cache from ' + this.maxSize_ + ' to ' + newMaxSize);
      // Set new size before purging so we know how many items to purge
      var oldMaxSize = this.maxSize_
      this.maxSize_ = newMaxSize;
    
      if (newMaxSize > 0 && (oldMaxSize < 0 || newMaxSize < oldMaxSize)) {
        if (this.size() > newMaxSize) {
          // Cache needs to be purged as it does contain too much entries for the new size
          this.purge_();
        } // else if cache isn't filled up to the new limit nothing is to do
      }
      // else if newMaxSize >= maxSize nothing to do
      this.log_('Resizing done');
    }
    
    /**
     * Removes expired items from the cache.
     */
    Cache.prototype.purge_ = function() {
      var tmparray = new Array();
      var purgeSize = Math.round(this.maxSize_ * this.fillFactor_);
      if (this.maxSize_ < 0)
        purgeSize = this.size() * this.fillFactor_;
      // loop through the cache, expire items that should be expired
      // otherwise, add the item to an array
      var keys = this.storage_.keys();
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var item = this.storage_.get(key);
        if (this.isExpired_(item)) {
          this.removeItem(key);
        } else {
          tmparray.push(item);
        }
      }
    
      if (tmparray.length > purgeSize) {
        // sort this array based on cache priority and the last accessed date
        tmparray = tmparray.sort(function(a, b) {
          if (a.options.priority != b.options.priority) {
            return b.options.priority - a.options.priority;
          } else {
            return b.lastAccessed - a.lastAccessed;
          }
        });
        // remove items from the end of the array
        while (tmparray.length > purgeSize) {
          var ritem = tmparray.pop();
          this.removeItem(ritem.key);
        }
      }
      this.log_('Purged cached');
    };
    
    
    /**
     * Add an item to the cache.
     * @param {Object} item The cache item to add.
     * @private
     */
    Cache.prototype.addItem_ = function(item, attemptedAlready) {
      var cache = this;
      try {
        this.storage_.set(item.key, item);
      } catch(err) {
        if (attemptedAlready) {
          this.log_('Failed setting again, giving up: ' + err.toString());
          throw(err);
        }
        this.log_('Error adding item, purging and trying again: ' + err.toString());
        this.purge_();
        this.addItem_(item, true);
      }
    };
    
    
    /**
     * Remove an item from the cache, call the callback function (if it exists).
     * @param {String} key The key of the item to remove
     */
    Cache.prototype.removeItem = function(key) {
      var item = this.storage_.remove(key);
      this.log_("removed key " + key);
    
      // if there is a callback function, call it at the end of execution
      if (item && item.options && item.options.callback) {
        setTimeout(function() {
          item.options.callback.call(null, item.key, item.value);
        }, 0);
      }
      return item ? item.value : null;
    };
    
    /**
     * Scan through each item in the cache and remove that item if it passes the
     * supplied test.
     * @param {Function} test   A test to determine if the given item should be removed.
     *							The item will be removed if test(key, value) returns true.
     */
    Cache.prototype.removeWhere = function(test) {
        // Get a copy of the keys array - it won't be modified when we remove items from storage
        var keys = this.storage_.keys();
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var item = this.storage_.get(key);
            if(test(key, item.value) === true) {
                this.removeItem(key);
            }
        }
    };
    
    Cache.prototype.size = function() {
      return this.storage_.size();
    }
    
    
    /**
     * @param {Object} item A cache item.
     * @return {boolean} True if the item is expired
     * @private
     */
    Cache.prototype.isExpired_ = function(item) {
      var now = new Date().getTime();
      var expired = false;
      if (item.options.expirationAbsolute &&
          (item.options.expirationAbsolute < now)) {
          // if the absolute expiration has passed, expire the item
          expired = true;
      }
      if (!expired && item.options.expirationSliding) {
        // if the sliding expiration has passed, expire the item
        var lastAccess =
            item.lastAccessed + (item.options.expirationSliding * 1000);
        if (lastAccess < now) {
          expired = true;
        }
      }
      return expired;
    };
    
    
    /**
     * Logs a message to the console.log if debug is set to true.
     * @param {string} msg The message to log.
     * @private
     */
    Cache.prototype.log_ = function(msg) {
      if (this.debug_) {
        console.log(msg);
      }
    };
    
    // Establish the root object, `window` in the browser, or `global` on the server.
    var root = this;
    
    if (typeof module !== "undefined" && module.exports) {
      module.exports = Cache;
    } else if (typeof define == "function" && define.amd) {
      define(function() { return Cache; });
    } else {
      root.Cache = Cache;
    }
    
    })();