/**
 * Created by hn on 14-4-1.
 */

define( function ( require ) {

    var kity = require( "kity" ),
        TOPIC_POOL = {};

    var DOCUMENT_NODE_TYPE = 9;

    /**
     * A polyfill for Element.matches()
     */
    if (typeof Element !== 'undefined' && !Element.prototype.matches) {
        var proto = Element.prototype;
    
        proto.matches = proto.matchesSelector ||
                        proto.mozMatchesSelector ||
                        proto.msMatchesSelector ||
                        proto.oMatchesSelector ||
                        proto.webkitMatchesSelector;
    }
    
    /**
     * Finds the closest parent that matches a selector.
     *
     * @param {Element} element
     * @param {String} selector
     * @return {Function}
     */
    function closest (element, selector) {
        while (element && element.nodeType !== DOCUMENT_NODE_TYPE) {
            if (typeof element.matches === 'function' &&
                element.matches(selector)) {
                return element;
            }
            element = element.parentNode;
        }
    }
            /**
     * Delegates event to a selector.
     *
     * @param {Element} element
     * @param {String} selector
     * @param {String} type
     * @param {Function} callback
     * @param {Boolean} useCapture
     * @return {Object}
     */
    function _delegate(element, selector, type, callback, useCapture) {
        var listenerFn = listener.apply(this, arguments);
    
        element.addEventListener(type, listenerFn, useCapture);
    
        return {
            destroy: function() {
                element.removeEventListener(type, listenerFn, useCapture);
            }
        };
    }
    
    /**
     * Delegates event to a selector.
     *
     * @param {Element|String|Array} [elements]
     * @param {String} selector
     * @param {String} type
     * @param {Function} callback
     * @param {Boolean} useCapture
     * @return {Object}
     */
    function delegate(elements, selector, type, callback, useCapture) {
        // Handle the regular Element usage
        if (typeof elements.addEventListener === 'function') {
            return _delegate.apply(null, arguments);
        }
    
        // Handle Element-less usage, it defaults to global delegation
        if (typeof type === 'function') {
            // Use `document` as the first parameter, then apply arguments
            // This is a short way to .unshift `arguments` without running into deoptimizations
            return _delegate.bind(null, document).apply(null, arguments);
        }
    
        // Handle Selector-based usage
        if (typeof elements === 'string') {
            elements = document.querySelectorAll(elements);
        }
    
        // Handle Array-like based usage
        return Array.prototype.map.call(elements, function (element) {
            return _delegate(element, selector, type, callback, useCapture);
        });
    }
    
    /**
     * Finds closest match and invokes callback.
     *
     * @param {Element} element
     * @param {String} selector
     * @param {String} type
     * @param {Function} callback
     * @return {Function}
     */
    function listener(element, selector, type, callback) {
        return function(e) {
            e.delegateTarget = closest(e.target, selector);
    
            if (e.delegateTarget) {
                callback.call(e.delegateTarget, e);
            }
        };
    }

    var Utils = {

        ele: function ( doc, name, options ) {

            var node = null;

            if ( name === "text" ) {
                return doc.createTextNode( options );
            }

            node =  doc.createElement( name );
            options.className && ( node.className = options.className );

            if ( options.content ) {
                node.innerHTML = options.content;
            }
            return node;
        },

        getRectBox: function ( node ) {
            return node.getBoundingClientRect();
        },

        on: function ( target, type, fn ) {
            target.addEventListener(type,fn);
            return this;
        },

        delegate: function ( target, selector, type, fn ) {
            delegate(target, selector, type, fn);
            return this;
        },

        publish: function ( topic, args ) {

            var callbackList = TOPIC_POOL[ topic ];

            if ( !callbackList ) {
                return;
            }

            args = [].slice.call( arguments, 1 );

            kity.Utils.each( callbackList, function ( callback ) {

                callback.apply( null, args );

            } );

        },

        subscribe: function ( topic, callback ) {

            if ( !TOPIC_POOL[ topic ] ) {

                TOPIC_POOL[ topic ] = [];

            }

            TOPIC_POOL[ topic ].push( callback );

        },

        getClassList: function ( node ) {

            return node.classList || new ClassList( node );

        }

    };


    //注意： 仅保证兼容IE9以上
    function ClassList ( node ) {

        this.node = node;
        this.classes = node.className.replace( /^\s+|\s+$/g, '' ).split( /\s+/ );

    }

    ClassList.prototype = {

        constructor: ClassList,

        contains: function ( className ) {

            return this.classes.indexOf( className ) !== -1;

        },

        add: function ( className ) {

            if ( this.classes.indexOf( className ) == -1 ) {
                this.classes.push( className );
            }

            this._update();

            return this;

        },

        remove: function ( className ) {

            var index = this.classes.indexOf( className );

            if ( index !== -1 ) {
                this.classes.splice( index, 1 );
                this._update();
            }

            return this;
        },

        toggle: function ( className ) {

            var method = this.contains( className ) ? 'remove' : 'add';

            return this[ method ]( className );

        },

        _update: function () {

            this.node.className = this.classes.join( " " );

        }

    };

    return Utils;

} );