/**
 * @module Ink.Util.I18n_1
 * @author inkdev AT sapo.pt
 */

Ink.createModule('Ink.Util.I18n', '1', [], function () {
    'use strict';

    var pattrText = /\{(\{.*?})}|(?:\{(?:(\d+)|(\w+)|(?:%s(?::(\d+))?))?})/g;

    var funcOrVal = function( ret /*, args */ ) {
        var args = Array.prototype.slice.call( arguments , 1 );

        return typeof ret === 'function' ? ret.apply( this , args ) :
                      ret !== undefined  ? ret :
                                           '';
    };

    /**
     * Creates a new internationalization helper object
     *
     * @class Ink.Util.I18n
     * @constructor
     *
     * @param {Object} dict object mapping language codes (in the form of `pt_PT`, `pt_BR`, `fr`, `en_US`, etc.) to their Object dictionaries.
     *     @param {Object} dict.(dictionaries...) 
     * @param {String} [lang='pt_PT'] language code of the target language
     *
     * @example
     *      var dictionaries = {    // This could come from a JSONP request from your server
     *          'pt_PT': {
     *              'hello': 'olá',
     *              'me': 'eu',
     *              'i have a {%s} for you': 'tenho um {%s} para ti'
     *          },
     *          'pt_BR': {
     *              'hello': 'oi',
     *              'me': 'eu',
     *              'i have a {%s} for you': 'tenho um {%s} para você'
     *          },
     *          'en_US': {
     *              langCodes: {
     *                  'Portuguese'
     *              }
     *          }  
     *      };
     *      Ink.requireModules(['Ink.Util.I18n_1'], function (I18n) {
     *          var i18n = new I18n(dictionaries, 'pt_PT');
     *          i18n.text('hello');  // returns 'olá'
     *          i18n.text('i have a {%s} for you', 'IRON SWORD'); // returns 'tenho um IRON SWORD' para ti
     *          
     *          i18n.lang('pt_BR');  // Changes language. pt_BR dictionary is loaded
     *          i18n.text('hello');  // returns 'oi'
     *
     *          i18n.lang('en_US');  // Missing language.
     *          i18n.text('hello');  // returns 'hello'. If testMode is on, returns '[hello]'
     *      });
     */
    var I18n = function( dict , lang , testMode ) {
        if ( !( this instanceof I18n ) ) { return new I18n( dict , lang , testMode ); }

        this.reset( )
            .lang( lang )
            .testMode( testMode )
            .append( dict || { } , lang );
    };

    I18n.prototype = {
        reset: function( ) {
            this._dicts    = [ ];
            this._dict     = { };
            this._testMode = false;
            this._lang     = this._gLang;

            return this;
        },
        /**
         * Adds translation strings for this helper to use.
         *
         * @method append
         * @param {Object} dict object containing language objects identified by their language code
         * @param {Boolean} [lang] .
         *
         * @example
         *     var i18n = new I18n({}, 'pt_PT');
         *     i18n.append({'pt_PT': {
         *         'sfraggles': 'braggles'
         *     }});
         *     i18n.text('sfraggles') // -> 'braggles'
         */
        append: function( dict ) {
            this._dicts.push( dict );

            this._dict = Ink.extendObj(this._dict , dict[ this._lang ] );

            return this;
        },
        /**
         * Get the language code
         *
         * @returns {String} the language code for this instance
         * @method {String} lang
         */
        /**
         * Set the language. If there are more dictionaries available in cache, they will be loaded.
         *
         * @method  lang
         * @param   lang    {String} Language code to set this instance to.
         */
        lang: function( lang ) {
            if ( !arguments.length ) { return this._lang; }

            if ( lang && this._lang !== lang ) {
                this._lang = lang;

                this._dict = { };

                for ( var i = 0, l = this._dicts.length; i < l; i++ ) {
                    this._dict = Ink.extendObj( this._dict , this._dicts[ i ][ lang ] || { } );
                }
            }

            return this;
        },
        /**
         * Get the testMode
         *
         * @returns {Boolean} the testMode for this instance
         * @method {Boolean} testMode
         */
        /**
         * Sets or unsets test mode. In test mode, unknown strings are wrapped
         * in `[ ... ]`. This is useful for debugging your application and
         * making sure all your translation keys are in place.
         *
         * @method testMode
         * @param {Boolean} bool boolean value to set the test mode to.
         */
        testMode: function( bool ) {
            if ( !arguments.length ) { return !!this._testMode; }

            if ( bool !== undefined  ) { this._testMode = !!bool; }

            return this;
        },

        getKey: function( key ) {
            var ret;
            var gLang = this._gLang;
            var lang  = this._lang;
    
            if ( key in this._dict ) {
                ret = this._dict[ key ];
            } else if ( lang === gLang && key in this._gDict ) {
                ret = this._gDict[ key ];
            } else if ( lang !== gLang ) {
                I18n.lang( lang );
    
                ret = this._gDict[ key ];
    
                I18n.lang( gLang );
            }
    
            return ret;
        },

        /**
         * Given a translation key, return a translated string, with replaced parameters.
         * When a translated string is not available, the original string is returned unchanged.
         *
         * @method {String} text
         * @param {String} str key to look for in i18n dictionary (which is returned verbatim if unknown)
         * @param {optional String} arg1 replacement #1 (replaces first {%s} and all {%s:1})
         * @param {optional String} arg2 replacement #2 (replaces second {%s} and all {%s:2})
         * @param {optional String} argn... replacement #n (replaces nth {%s} and all {%s:n})
         *
         * @example
         *     _('Gosto muito de {} e o céu é {}.', 'carros', 'azul');
         *     // returns 'Gosto muito de carros e o céu é azul.'
         *
         * @example
         *     _('O {1} é {2} como {2} é a cor do {3}.', 'carro', 'azul', 'FCP');
         *     // returns 'O carro é azul como azul é o FCP.'
         */
        text: function( str /*, replacements...*/ ) {
            if ( typeof str !== 'string' ) { return; } // Backwards-compat

            var args = Array.prototype.slice.call( arguments , 1 );
            var idx = 0;
            var isObj = typeof args[ 0 ] === 'object';

            var original = this.getKey( str );
            if ( original === undefined ) { original = this._testMode ? '[' + str + ']' : str; }
            if ( typeof original === 'number' ) { original += ''; }
             
            return (
                typeof original === 'string' ?
                    original.replace( pattrText , function( m , $1 , $2 , $3 , $4 , i ) {
                        return funcOrVal(
                            $1          ? $1 :
                            $2 || $4    ? args[ ( $2 || $4 ) - ( isObj ? 0 : 1 ) ] :
                            $3          ? args[ 0 ][ $3 ] :
                                          args[ idx++ + ( isObj ? 1 : 0 ) ] ,
                            m , $1 , $2 , $3 , $4 , i , args , idx );
                    }) :
                typeof original === 'function' ? original.apply( this , args ) :
                original instanceof Array      ? funcOrVal( original[ args[ 0 ] ] , args ) :
                typeof original === 'object'   ? funcOrVal( original[ args[ 0 ] ] , args ) :
                                                 '');
        },

        /**
         * Given a singular string, a plural string, and a number, translates
         * either the singular or plural string.
         *
         * @method ntext
         * @return {String}
         *
         * @param {String} strSin   word to use when count is 1
         * @param {String} strPlur  word to use otherwise
         * @param {Number} count    number which defines which word to use
         * @param [...]             extra arguments, to be passed to `text()`
         *
         * @example
         *     i18n.ntext('platypus', 'platypuses', 1); // returns 'ornitorrinco'
         *     i18n.ntext('platypus', 'platypuses', 2); // returns 'ornitorrincos'
         * 
         * @example
         *     // Extra arguments are passed to text()
         *     i18n.ntext('{} platypus', '{} platypuses', 1); // returns '1 ornitorrinco'
         *     i18n.ntext('{} platypus', '{} platypuses', 2); // returns '2 ornitorrincos'
         */
        ntext: function( strSin , strPlur , count ) {
            var args = Array.prototype.slice.apply( arguments );
            var original;

            if ( args.length === 2 && typeof strPlur === 'number' ) {
                original = this.getKey( strSin );
                if ( !( original instanceof Array ) ) { return ''; }

                args.splice( 0 , 1 );
                original = original[ strPlur === 1 ? 0 : 1 ];
            } else {
                args.splice( 0 , 2 );
                original = count === 1 ? strSin : strPlur;
            }

            return this.text.apply( this , [ original ].concat( args ) );
        },

        /**
         * Returns the ordinal suffix of `num` (For example, 1 > 'st', 2 > 'nd', 5 > 'th', ...).
         *
         * This works by using transforms (in the form of Objects or Functions) passed into the
         * function or found in the special key `_ordinals` in the active language dictionary.
         *
         * @method ordinal
         *
         * @param {Number}          num             Input number
         * 
         * @param {Object}          [options={}]
         *
         *    Maps for translating. Each of these options' fallback is found in the current
         *    language's dictionary. The lookup order is the following:
         *   
         *        1. `exceptions`
         *        2. `byLastDigit`
         *        3. `default`
         *   
         *    Each of these may be either an `Object` or a `Function`. If it's a function, it
         *    is called, and if the function returns a string, that is used. If it's an object,
         *    the property is looked up using `[...]`. If what is found is a string, it is used.
         *
         * @param {Object|Function} [options.byLastDigit={}]
         *    If the language requires the last digit to be considered, mappings of last digits
         *    to ordinal suffixes can be created here.
         *
         * @param {Object|Function} [options.exceptions={}]
         *    Map unique, special cases to their ordinal suffixes.
         *
         * @returns {String}        Ordinal suffix for `num`.
         *
         * @example
         *     var i18n = new I18n({
         *         pt_PT: {  // 1º, 2º, 3º, 4º, ...
         *             _ordinal: {  // The _ordinals key is special.
         *                 'default': "º" // Usually the suffix is "º" in portuguese...
         *             }
         *         },
         *         fr: {  // 1er, 2e, 3e, 4e, ...
         *             _ordinal: {  // The _ordinals key is special.
         *                 'default': "e", // Usually the suffix is "e" in french...
         *                 exceptions: {
         *                     1: "er"   // ... Except for the number one.
         *                 }
         *             }
         *         },
         *         en_US: {  // 1st, 2nd, 3rd, 4th, ..., 11th, 12th, ... 21st, 22nd...
         *             _ordinal: {
         *                 'default': "th",// Usually the digit is "th" in english...
         *                 byLastDigit: {
         *                     1: "st",  // When the last digit is 1, use "th"...
         *                     2: "nd",  // When the last digit is 2, use "nd"...
         *                     3: "rd"   // When the last digit is 3, use "rd"...
         *                 },
         *                 exceptions: { // But these numbers are special
         *                     0: "",
         *                     11: "th",
         *                     12: "th",
         *                     13: "th"
         *                 }
         *             }
         *         }
         *     }, 'pt_PT');
         *
         *     i18n.ordinal(1);    // return 'º'
         *     i18n.ordinal(2);    // return 'º'
         *     i18n.ordinal(11);   // return 'º'
         * 
         *     i18n.lang('fr');
         *     i18n.ordinal(1);    // return 'er'
         *     i18n.ordinal(2);    // return 'e'
         *     i18n.ordinal(11);   // return 'e'
         *
         *     i18n.lang('en_US');
         *     i18n.ordinal(1);    // returns 'st'
         *     i18n.ordinal(2);    // returns 'nd'
         *     i18n.ordinal(12);   // returns 'th'
         *     i18n.ordinal(22);   // returns 'nd'
         *     i18n.ordinal(3);    // returns 'rd'
         *     i18n.ordinal(4);    // returns 'th'
         *     i18n.ordinal(5);    // returns 'th'
         *
         **/
        ordinal: function( num ) {
            if ( num === undefined ) { return ''; }

            var lastDig = +num.toString( ).slice( -1 );

            var ordDict  = this.getKey( '_ordinals' );
            if ( ordDict === undefined ) { return ''; }

            if ( typeof ordDict === 'string' ) { return ordDict; }

            var ret;

            if ( typeof ordDict === 'function' ) {
                ret = ordDict( num , lastDig );

                if ( typeof ret === 'string' ) { return ret; }
            }

            if ( 'exceptions' in ordDict ) {
                ret = typeof ordDict.exceptions === 'function' ? ordDict.exceptions( num , lastDig ) :
                      num in ordDict.exceptions                ? funcOrVal( ordDict.exceptions[ num ] , num , lastDig ) :
                                                                 undefined;

                if ( typeof ret === 'string' ) { return ret; }
            }

            if ( 'byLastDigit' in ordDict ) {
                ret = typeof ordDict.byLastDigit === 'function' ? ordDict.byLastDigit( lastDig , num ) :
                      lastDig in ordDict.byLastDigit            ? funcOrVal( ordDict.byLastDigit[ lastDig ] , lastDig , num ) :
                                                                  undefined;

                if ( typeof ret === 'string' ) { return ret; }
            }

            if ( 'default' in ordDict ) {
                ret = funcOrVal( ordDict['default'] , num , lastDig );

                if ( typeof ret === 'string' ) { return ret; }
            }

            return '';
        },

        /**
         * Returns an alias to `text()`, for convenience. The resulting function is
         * traditionally assigned to "_".
         *
         * @method alias
         * @returns {Function} an alias to `text()`. You can also access the rest of the translation API through this alias.
         *
         * @example
         *     var i18n = new I18n({
         *         'pt_PT': {
         *             'hi': 'olá',
         *             '{} day': '{} dia',
         *             '{} days': '{} dias',
         *             '_ordinals': {
         *                 'default': 'º'
         *             }
         *         }
         *     }, 'pt_PT');
         *     var _ = i18n.alias();
         *     equal(_('hi'), 'olá');
         *     equal(_('{} days', 3), '3 dias');
         *     equal(_.ntext('{} day', '{} days', 2), '2 dias');
         *     equal(_.ntext('{} day', '{} days', 1), '1 dia');
         *     equal(_.ordinal(3), 'º');
         */
        alias: function( ) {
            var ret      = Ink.bind( I18n.prototype.text     , this );
            ret.ntext    = Ink.bind( I18n.prototype.ntext    , this );
            ret.append   = Ink.bind( I18n.prototype.append   , this );
            ret.ordinal  = Ink.bind( I18n.prototype.ordinal  , this );
            ret.testMode = Ink.bind( I18n.prototype.testMode , this );

            return ret;
        }
    };

    I18n.reset = function( ) {
        I18n.prototype._gDicts = [ ];
        I18n.prototype._gDict  = { };
        I18n.prototype._gLang  = 'pt_PT';
    };
    I18n.reset( );

    I18n.append = function( dict , lang ) {
        if ( lang ) {
            if ( !( lang in dict ) ) {
                var obj = { };

                obj[ lang ] = dict;

                dict = obj;
            }

            if ( lang !== I18n.prototype._gLang ) { I18n.lang( lang ); }
        }

        I18n.prototype._gDicts.push( dict );

        Ink.extendObj( I18n.prototype._gDict , dict[ I18n.prototype._gLang ] );
    };

    I18n.lang = function( lang ) {
        if ( !arguments.length ) { return I18n.prototype._gLang; }

        if ( lang && I18n.prototype._gLang !== lang ) {
            I18n.prototype._gLang = lang;

            I18n.prototype._gDict = { };

            for ( var i = 0, l = I18n.prototype._gDicts.length; i < l; i++ ) {
                Ink.extendObj( I18n.prototype._gDict , I18n.prototype._gDicts[ i ][ lang ] || { } );
            }
        }
    };
    
    return I18n;
});
