/**
 * @module Ink.UI.FormValidator_2
 * @author inkdev AT sapo.pt
 * @version 2
 */
Ink.createModule('Ink.UI.FormValidator', '2', [ 'Ink.UI.Aux_1','Ink.Dom.Element_1','Ink.Dom.Event_1','Ink.Dom.Selector_1','Ink.Dom.Css_1','Ink.Util.Validator_1'], function( Aux, Element, Event, Selector, Css, InkValidator ) {
    'use strict';

    /**
     * Validation Functions to be used
     * Some functions are a port from PHP, others are the 'best' solutions available
     *
     * @type {Object}
     * @private
     * @static
     */
    var validationFunctions = {

        /**
         * Checks if the value is actually defined and is not empty
         *
         * @method validationFunctions.required
         * @param  {String} value Value to be checked
         * @return {Boolean}       True case is defined, false if it's empty or not defined.
         */
        'required': function( value ){
            return ( (typeof value !== 'undefined') && ( !(/^\s*$/).test(value) ) );
        },

        /**
         * Checks if the value has a minimum length
         *
         * @method validationFunctions.min_length
         * @param  {String} value   Value to be checked
         * @param  {String|Number} minSize Number of characters that the value at least must have.
         * @return {Boolean}         True if the length of value is equal or bigger than the minimum chars defined. False if not.
         */
        'min_length': function( value, minSize ){
            return ( (typeof value === 'string') && ( value.length >= parseInt(minSize,10) ) );
        },

        /**
         * Checks if the value has a maximum length
         *
         * @method validationFunctions.max_length
         * @param  {String} value   Value to be checked
         * @param  {String|Number} maxSize Number of characters that the value at maximum can have.
         * @return {Boolean}         True if the length of value is equal or smaller than the maximum chars defined. False if not.
         */
        'max_length': function( value, maxSize ){
            return ( (typeof value === 'string') && ( value.length <= parseInt(maxSize,10) ) );
        },

        /**
         * Checks if the value has an exact length
         *
         * @method validationFunctions.exact_length
         * @param  {String} value   Value to be checked
         * @param  {String|Number} exactSize Number of characters that the value must have.
         * @return {Boolean}         True if the length of value is equal to the size defined. False if not.
         */
        'exact_length': function( value, exactSize ){
            return ( (typeof value === 'string') && ( value.length === parseInt(exactSize,10) ) );
        },

        /**
         * Checks if the value has a valid e-mail address
         *
         * @method validationFunctions.email
         * @param  {String} value   Value to be checked
         * @return {Boolean}         True if the value is a valid e-mail address. False if not.
         */
        'email': function( value ){
            return ( ( typeof value === 'string' ) && InkValidator.mail( value ) );
        },

        /**
         * Checks if the value has a valid URL
         *
         * @method validationFunctions.url
         * @param  {String} value   Value to be checked
         * @param  {Boolean} fullCheck Flag that specifies if the value must be validated as a full url (with the protocol) or not.
         * @return {Boolean}         True if the URL is considered valid. False if not.
         */
        'url': function( value, fullCheck ){
            fullCheck = fullCheck || false;
            return ( (typeof value === 'string') && InkValidator.url( value, fullCheck ) );
        },

        /**
         * Checks if the value is a valid IP. Supports ipv4 and ipv6
         *
         * @method validationFunctions.ip
         * @param  {String} value   Value to be checked
         * @param  {String} ipType Type of IP to be validated. The values are: ipv4, ipv6. By default is ipv4.
         * @return {Boolean}         True if the value is a valid IP address. False if not.
         */
        'ip': function( value, ipType ){
            if( typeof value !== 'string' ){
                return false;
            }

            return InkValidator.isIP(value, ipType);
        },

        /**
         * Checks if the value is a valid phone number. Supports several countries, based in the Ink.Util.Validator class.
         *
         * @method validationFunctions.phone
         * @param  {String} value   Value to be checked
         * @param  {String} phoneType Country's initials to specify the type of phone number to be validated. Ex: 'AO'.
         * @return {Boolean}         True if it's a valid phone number. False if not.
         */
        'phone': function( value, phoneType ){
            if( typeof value !== 'string' ){
                return false;
            }

            if( phoneType ){
                phoneType = phoneType.toUpperCase();
                if( ("is" + phoneType + "Phone") in InkValidator ){
                    return InkValidator["is" + phoneType + "Phone"]( value );
                }
            } else {
                return InkValidator.isPhone( value );
            }

            return false;
        },

        /**
         * Checks if it's a valid credit card.
         *
         * @method validationFunctions.credit_card
         * @param  {String} value   Value to be checked
         * @param  {String} cardType Type of credit card to be validated. The card types available are in the Ink.Util.Validator class.
         * @return {Boolean}         True if the value is a valid credit card number. False if not.
         */
        'credit_card': function( value, cardType ){
            if( typeof value !== 'string' ){
                return false;
            }

            return InkValidator.isCreditCard( value, cardType );
        },

        /**
         * Checks if the value is a valid date.
         *
         * @method validationFunctions.date
         * @param  {String} value   Value to be checked
         * @param  {String} format Specific format of the date.
         * @return {Boolean}         True if the value is a valid date. False if not.
         */
        'date': function( value, format ){
            return ( (typeof value === 'string' ) && InkValidator.isDate(format, value) );
        },

        /**
         * Checks if the value only contains alphabetical values.
         *
         * @method validationFunctions.alpha
         * @param  {String} value   Value to be checked
         * @return {Boolean}         True if the value is alphabetical-only. False if not.
         */
        'alpha': function( value, supportSpaces ){
            supportSpaces = supportSpaces || false;
            if( supportSpaces ){
                value = value.replace(/\ /g,'');
            }
            return ((typeof value === 'string') && /^[a-zA-Z]+$/.test(value));
        },

        /**
         * Checks if the value only contains alphabetical and numerical characters.
         *
         * @method validationFunctions.alpha_numeric
         * @param  {String} value   Value to be checked
         * @return {Boolean}         True if the value is a valid alphanumerical. False if not.
         */
        'alpha_numeric': function( value ){
            return ((typeof value === 'string') && /^[a-zA-Z0-9]+$/.test(value));
        },

        /**
         * Checks if the value only contains alphabetical, dash or underscore characteres.
         *
         * @method validationFunctions.alpha_dashes
         * @param  {String} value   Value to be checked
         * @return {Boolean}         True if the value is a valid. False if not.
         */
        'alpha_dash': function( value ){
            return ((typeof value === 'string') && /^[a-zA-Z\-\_]+$/.test(value));
        },

        /**
         * Checks if the value is a digit (an integer of length = 1).
         *
         * @method validationFunctions.digit
         * @param  {String} value   Value to be checked
         * @return {Boolean}         True if the value is a valid digit. False if not.
         */
        'digit': function( value ){
            return ((typeof value === 'string') && /^[0-9]{1}$/.test(value));
        },

        /**
         * Checks if the value is a valid integer.
         *
         * @method validationFunctions.integer
         * @param  {String} value   Value to be checked
         * @param  {String} positive Flag that specifies if the integer is must be positive (unsigned).
         * @return {Boolean}         True if the value is a valid integer. False if not.
         */
        'integer': function( value, positive ){
            if( positive ){
                return ((typeof value === 'string') && /^[0-9]+$/.test(value));
            } else {
                return ((typeof value === 'string') && /^\-?[0-9]+$/.test(value));
            }
        },

        /**
         * Checks if the value is a valid decimal number.
         *
         * @method validationFunctions.decimal
         * @param  {String} value   Value to be checked
         * @param  {String} decimalSeparator Character that splits the integer part from the decimal one. By default is '.'.
         * @param  {String} [decimalPlaces] Number of digits that the decimal part must have.
         * @param  {String} [leftDigits] Number of digits that the integer part must have, when provided.
         * @return {Boolean}         True if the value is a valid decimal number. False if not.
         */
        'decimal': function( value, decimalSeparator, decimalPlaces, leftDigits ){

            decimalSeparator = decimalSeparator || '.';

            var parcels = value.split(decimalSeparator);

            if( parcels.length !== 2 ){
                return false;
            }

            if( !validationFunctions.integer(parcels[0]) || !validationFunctions.integer(parcels[1],true) ){
                return false;
            }

            return (
                ( ( typeof leftDigits === 'undefined' ) || ( parcels[0].length === parseInt(leftDigits,10) ) )
                && ( ( typeof decimalPlaces === 'undefined' ) || ( parcels[1].length === parseInt(decimalPlaces,10) ) )
            );

        },

        /**
         * Checks if it is a numeric value.
         *
         * @method validationFunctions.numeric
         * @param  {String} value   Value to be checked
         * @param  {String} decimalSeparator Verifies if it's a valid decimal. Otherwise checks if it's a valid integer.
         * @return {Boolean}         True if the value is numeric. False if not.
         */
        'numeric': function( value, decimalSeparator ){
            decimalSeparator = decimalSeparator || '.';
            if( value.indexOf(decimalSeparator) !== -1  ){
                return validationFunctions.decimal( value, decimalSeparator );
            } else {
                return validationFunctions.integer( value );
            }
        },

        /**
         * Checks if the value is in a specific range of values.
         *
         * @method validationFunctions.range
         * @param  {String} value   Value to be checked
         * @param  {String} minValue Left limit of the range.
         * @param  {String} maxValue Right limit of the range.
         * @param  {String} [multipleOf] In case you want numbers that are only multiples of another number.
         * @return {Boolean}         True if the value is within the range. False if not.
         */
        'range': function( value, minValue, maxValue, multipleOf ){
            if( (parseInt(value,10) < parseInt(minValue,10)) || (parseInt(value,10) > parseInt(maxValue,10)) ){
                return false;
            }

            multipleOf = multipleOf || 1;

            return ( ( ( parseInt(value,10)-parseInt(minValue,10) ) % parseInt(multipleOf,10) ) === 0 );
        },

        /**
         * Checks if the value is a valid color.
         *
         * @method validationFunctions.color
         * @param  {String} value   Value to be checked
         * @return {Boolean}         True if the value is a valid color. False if not.
         */
        'color': function( value ){
            return InkValidator.isColor(value);
        },

        /**
         * Checks if the value matches the value of a different field.
         *
         * @method validationFunctions.matches
         * @param  {String} value   Value to be checked
         * @param  {String} fieldToCompare Name or ID of the field to compare.
         * @return {Boolean}         True if the values match. False if not.
         */
        'matches': function( value, fieldToCompare, arrElements ){
            return ( value === arrElements[fieldToCompare][0].getValue() );
        }

    };

    /**
     * Error messages for the validation functions above
     * @type {Object}
     * @private
     * @static
     */
    var validationMessages = {

        'required' : 'The :field filling is mandatory',
        'min_length': 'The :field must have a minimum size of :param1 characters',
        'max_length': 'The :field must have a maximum size of :param1 characters',
        'exact_length': 'The :field must have an exact size of :param1 characters',
        'email': 'The :field must have a valid e-mail address',
        'url': 'The :field must have a valid URL',
        'ip': 'The :field does not contain a valid :param1 IP address',
        'phone': 'The :field does not contain a valid :param1 phone number',
        'credit_card': 'The :field does not contain a valid :param1 credit card',
        'date': 'The :field should contain a date in the :param1 format',
        'alpha': 'The :field should only contain letters',
        'alpha_numeric': 'The :field should only contain letters or numbers',
        'alpha_dashes': 'The :field should only contain letters or dashes',
        'digit': 'The :field should only contain a digit',
        'integer': 'The :field should only contain an integer',
        'decimal': 'The :field should contain a valid decimal number',
        'numeric': 'The :field should contain a number',
        'range': 'The :field should contain a number between :param1 and :param2',
        'color': 'The :field should contain a valid color',
        'matches': 'The :field should match the field :param1',
        'validation_function_not_found': 'The rule :rule has not been defined'

    };

    /**
     * Constructor of a FormElement.
     * This type of object has particular methods to parse rules and validate them in a specific DOM Element.
     *
     * @param  {DOMElement} element DOM Element
     * @param  {Object} options Object with configuration options
     * @return {FormElement} FormElement object
     */
    var FormElement = function( element, options ){

        this._element = Aux.elOrSelector( element, 'Invalid FormElement' );
        this._errors = {};
        this._rules = {};
        this._value = null;

        this._options = Ink.extendObj( {
            label: this._getLabel()
        }, Element.data(this._element) );

        this._options = Ink.extendObj( this._options, options || {} );

    };

    /**
     * FormElement's prototype
     */
    FormElement.prototype = {

        /**
         * Function to get the label that identifies the field.
         * If it can't find one, it will use the name or the id
         * (depending on what is defined)
         *
         * @method _getLabel
         * @return {String} Label to be used in the error messages
         * @private
         */
        _getLabel: function(){

            var controlGroup = Element.findUpwardsByClass(this._element,'control-group');
            var label = Ink.s('label',controlGroup);
            if( label ){
                label = label.innerHTML;
            } else {
                label = this._element.name || this._element.id || '';
            }

            return label;
        },

        /**
         * Function to parse a rules' string.
         * Ex: required|number|max_length[30]
         *
         * @method _parseRules
         * @param  {String} rules String with the rules
         * @private
         */
        _parseRules: function( rules ){

            this._rules = {};
            rules = rules.split("|");
            var i, rulesLength = rules.length, rule, params, paramStartPos ;
            if( rulesLength > 0 ){
                for( i = 0; i < rulesLength; i++ ){
                    rule = rules[i];
                    if( !rule ){
                        continue;
                    }

                    if( ( paramStartPos = rule.indexOf('[') ) !== -1 ){
                        params = rule.substr( paramStartPos+1 );
                        params = params.split(']');
                        params = params[0];
                        params = params.split(',');
                        params.splice(0,0,this.getValue());
                        params.push(this._options.form._formElements);

                        rule = rule.substr(0,paramStartPos);

                        this._rules[rule] = params;
                    } else {
                        this._rules[rule] = [this.getValue()];
                    }
                }
            }
        },

        /**
         * Function to add an error to the FormElement's 'errors' object.
         * It basically receives the rule where the error occurred, the parameters passed to it (if any)
         * and the error message.
         * Then it replaces some tokens in the message for a more 'custom' reading
         *
         * @method _addError
         * @param  {String} rule    Rule that failed
         * @param  {String} message Message from the validationMessages object.
         * @private
         * @static
         */
        _addError: function(rule, message ){

            var params, paramsLength;

            if( rule in this._rules ){
                params = this._rules[rule];
            } else {
                params = [];
            }
            paramsLength = params.length;

            this._errors[rule] = message;
            this._errors[rule] = this._errors[rule].replace(':field',this._options.label).replace(':value',this.getValue()).replace(':rule',rule);
            for( var i = 1; i < paramsLength; i++ ){
                this._errors[rule] = this._errors[rule].replace(':param'+(i), params[i]);
            }
        },

        /**
         * Function to retrieve the element's value
         *
         * @method getValue
         * @return {mixed} The DOM Element's value
         * @public
         */
        getValue: function(){

            switch(this._element.nodeName.toLowerCase()){
                case 'select':
                    return Ink.s('option:selected',this._element).value;
                case 'textarea':
                    return this._element.innerHTML;
                case 'input':
                    if( "type" in this._element ){
                        if( (this._element.type === 'radio') && (this._element.type === 'checkbox') ){
                            if( this._element.checked ){
                                return this._element.value;
                            }
                        } else if( this._element.type !== 'file' ){
                            return this._element.value;
                        }
                    } else {
                        return this._element.value;
                    }
                    return;
                default:
                    return this._element.innerHTML;
            }
        },

        /**
         * Function that returns the constructed errors object.
         *
         * @method getErrors
         * @return {Object} Errors' object
         * @public
         */
        getErrors: function(){
            return this._errors;
        },

        /**
         * Function that returns the DOM element related to it.
         *
         * @method getElement
         * @return {Object} DOM Element
         * @public
         */
        getElement: function(){
            return this._element;
        },

        /**
         * Function used to validate the element based on the rules defined.
         * It parses the rules defined in the _options.rules property.
         *
         * @method validate
         * @return {Boolean} True if every rule was valid. False if one fails.
         * @public
         */
        validate: function(){

            this._errors = {};

            if( "rules" in this._options ){
                this._parseRules( this._options.rules );
            }

            if( ("required" in this._rules) || (this.getValue() !== '') ){
                for(var rule in this._rules){

                    if( this._rules.hasOwnProperty( rule ) && (typeof validationFunctions[rule] === 'function') ){

                        if( validationFunctions[rule].apply(this, this._rules[rule] ) === false ){

                            this._addError( rule, validationMessages[rule] || 'Error message not defined' );
                            return false;

                        }

                    } else {

                        this._addError( rule, validationMessages['validation_function_not_found'] );
                        return false;

                    }

                }
            }

            return true;

        }
    };



    /**
     * @class Ink.UI.FormValidator
     * @version 2
     * @uses Ink.Dom.Css
     * @uses Ink.Util.Validator
     * @constructor
     * @param {String|DOMElement} selector Either a CSS Selector string, or the form's DOMElement
     * @param {} [varname] [description]
     * @example
     *     Ink.requireModules( ['Ink.UI.FormValidator_2'], function( FormValidator ){
     *         var myValidator = new FormValidator( 'form' );
     *     });
     */
    var FormValidator = function( selector, options ){

        /**
         * DOMElement of the <form> being validated
         *
         * @property _rootElement
         * @type {DOMElement}
         */
        this._rootElement = Aux.elOrSelector( selector );

        /**
         * Object that will gather the form elements by name
         *
         * @property _formElements
         * @type {Object}
         */
        this._formElements = {};

        /**
         * Configuration options. Fetches the data attributes first, then the ones passed when executing the constructor.
         * By doing that, the latter will be the one with highest priority.
         *
         * @property _options
         * @type {Object}
         */
        this._options = Ink.extendObj({
            eventTrigger: 'submit',
            searchFor: 'input, select, textarea',
            beforeValidation: undefined,
            onError: undefined,
            onSuccess: undefined
        },Element.data(this._rootElement));

        this._options = Ink.extendObj( this._options, options || {} );

        // Sets an event listener for a specific event in the form, if defined.
        // By default is the 'submit' event.
        if( typeof this._options.eventTrigger === 'string' ){
            Event.observe( this._rootElement,this._options.eventTrigger, Ink.bindEvent(this.validate,this) );
        }

        this._init();
    };

    /**
     * Method used to set validation functions (either custom or ovewrite the existent ones)
     *
     * @method setRule
     * @param {String}   name         Name of the function. E.g. 'required'
     * @param {String}   errorMessage Error message to be displayed in case of returning false. E.g. 'Oops, you passed :param1 as parameter1, lorem ipsum dolor...'
     * @param {Function} cb           Function to be executed when calling this rule
     * @public
     * @static
     */
    FormValidator.setRule = function( name, errorMessage, cb ){
        validationFunctions[ name ] = cb;
        validationMessages[ name ] = errorMessage;
    };

    /**
     * Method used to get the existing defined validation functions
     *
     * @method getRules
     * @return {Object} Object with the rules defined
     * @public
     * @static
     */
    FormValidator.getRules = function(){
        return validationFunctions;
    };

    FormValidator.prototype = {
        _init: function(){

        },

        /**
         * Function that searches for the elements of the form, based in the
         * this._options.searchFor configuration.
         *
         * @method getElements
         * @return {Object} An object with the elements in the form, indexed by name/id
         * @public
         */
        getElements: function(){
            this._formElements = {};
            var formElements = Selector.select( this._options.searchFor, this._rootElement );
            if( formElements.length ){
                var i, element;
                for( i=0; i<formElements.length; i+=1 ){
                    element = formElements[i];

                    var dataAttrs = Element.data( element );

                    if( !("rules" in dataAttrs) ){
                        continue;
                    }

                    var options = {
                        form: this
                    };

                    var key;
                    if( ("name" in element) && element.name ){
                        key = element.name;
                    } else if( ("id" in element) && element.id ){
                        key = element.id;
                    } else {
                        key = 'element_' + Math.floor(Math.random()*100);
                        element.id = key;
                    }

                    if( !(key in this._formElements) ){
                        this._formElements[key] = [ new FormElement( element, options ) ];
                    } else {
                        this._formElements[key].push( new FormElement( element, options ) );
                    }
                }
            }

            return this._formElements;
        },

        /**
         * Runs the validate function of each FormElement in the this._formElements
         * object.
         * Also, based on the this._options.beforeValidation, this._options.onError
         * and this._options.onSuccess, this callbacks are executed when defined.
         *
         * @method validate
         * @param  {Event} event window.event object
         * @return {Boolean}
         * @public
         */
        validate: function( event ){
            Event.stop(event);

            if( typeof this._options.beforeValidation === 'function' ){
                this._options.beforeValidation();
            }

            this.getElements();

            var errorElements = [];

            for( var key in this._formElements ){
                if( this._formElements.hasOwnProperty(key) ){
                    for( var counter = 0; counter < this._formElements[key].length; counter+=1 ){
                         if( !this._formElements[key][counter].validate() ) {
                            errorElements.push(this._formElements[key][counter]);
                         }
                    }
                }
            }

            if( errorElements.length === 0 ){
                if( typeof this._options.onSuccess === 'function' ){
                    this._options.onSuccess();
                }
                return true;
            } else {
                if( typeof this._options.onError === 'function' ){
                    this._options.onError( errorElements );
                }
                return false;
            }
        }
    };

    /**
     * Returns the FormValidator's Object
     */
    return FormValidator;

});
