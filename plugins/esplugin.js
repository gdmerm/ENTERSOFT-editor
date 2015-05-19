/**
 * @module {function} ESPluginBridge
 * Entersoft API using Redactor module encapsulation.
 */
var ESPluginBridge = (function (RD, console) {

    var _pluginInstances = [];

    ESPlugin.create = function () {
        return new ESPlugin(console);
    };

    /**
     * @static getInstances()
     * access the list of instances
     * @return {jQueryNodeReference[]} [description]
     */
    ESPlugin.getInstances = function () {
        return _pluginInstances;
    };

    /**
     * @static getInstance()
     * get a specific dom jquery instance where ESPlugin is enabled
     * @param  {string} elementId The textarea id where redactor is called
     */
    ESPlugin.getInstance = function (elementId) {
        if (_pluginInstances.length === 1) {
            return _pluginInstances[0];
        }

        return _pluginInstances.filter(function (element) {
            return element.attr('id') === elementId;
        })[0];
    };

    /**
     * @static invokeMethod()
     * call the $().redactor('ESPlugin.methodName', args) method
     * @param  {[type]} elementId  [description]
     * @param  {[type]} methodName [description]
     * @param  {[type]} args       [description]
     */
    ESPlugin.invokeMethod = function (elementId, methodName, args) {
        return ESPlugin.getInstance(elementId).redactor('ESPlugin.' + methodName, args);
    };

    /**
     * @static invoke
     * similar to invokeMethod() but short-circuits to first instance (ommit the elementId for single editor environments)
     * @param  {[type]} methodName [description]
     * @param  {[type]} args       [description]
     */
    ESPlugin.invoke = function (methodName, args) {
        return ESPlugin.getInstance().redactor('ESPlugin.' + methodName, args);
    };

    /**
     * @class ESPlugin
     */
    function ESPlugin(console) {
        
        /**
         * button configuration
         * @type {Array}
         */
        this.interfaceButtons = [
            {
                name: 'getHtmlButton',
                label: 'Get Html',
                faclass: 'fa-html5',
                callbackName: 'getContent'
            }
        ];

        //inject window.console
        this.console = console;

        /**
         * update the list of active instances that use the plugin
         * @param {jQueryNodeReference} instance [description]
         */
        function _addPluginInstance(instance) {
            _pluginInstances.push(instance);
        } 

        /**
         * @contructor
         * initialize the plugin (runs when redactor initializes)
         * @this {RedactorInstance} the current Redactor Instance
         * @return {[type]} [description]
         */
        this.init = function init() {
            var redactorInstance = this;
            var _plugin = this.ESPlugin;

            //update list of editor instances that use the plugin
            _addPluginInstance(this.$textarea);
            //add editor buttons
            _addButtons();

            /**
             * add buttons defined in `this.interfaceButtons`
             */
            function _addButtons() {
                var buttonConfig;

                for (var i = 0,_len = _plugin.interfaceButtons.length; i<_len; i++) {
                    buttonConfig = _plugin.interfaceButtons[i];
                    _plugin._addEditorButton.call(redactorInstance, buttonConfig);
                }
            }
        };
    }

    ESPlugin.prototype = {

        _addEditorButton: function _addEditorButton(buttonConfig) {
            var button = this.button.add(buttonConfig.name, buttonConfig.label);
            this.button.setAwesome(buttonConfig.name, buttonConfig.faclass);
            this.button.addCallback(button, this.ESPlugin[buttonConfig.callbackName]);
        },

        /**
         * @method log
         * wraps console so to prevent undefined errors
         * @this {object} The plugin object instance
         */
        log: function log() {
            if (this.console) {
                this.console.log( Array.prototype.slice.call(arguments) );
            }
        },

        /**
         * @callback getPlainText
         * strips html while keeping paragraph information
         * @this {RedactorInstance}
         * @returns {string} The content of the editor with new lines and no html tags
         */
        getPlainText: function getplaintext() {
            var html = this.code.get(),
                text = this.clean
                    .getPlainText(html)
                    .replace(/\<\/p\>/g, '\n\n'),
                stripped = this.clean.stripTags(text);

            //this.ESPlugin.log(stripped);
            return stripped;
        },

        /**
         * @callback getHtml
         * get html content from editor
         * @this {RedactorInstance}
         * @return {string} The raw html content
         */
        getContent: function getHtml() {
            this.ESPlugin.log(this.code.get());
            return this.code.get();
        },

        /**
         * @callback setContent
         * sets the contents of the editor
         * @this {RedactorInstance}
         * @param {string} content
         */
        setContent: function setContent(content) {
            this.code.set(content);
        }

    }; //ESPlugin prototype methods

    //Pass the plugin factory method to redactor
    RD.ESPlugin = ESPlugin.create;

    /**
     * @function  ESPluginBridge()
     * calls invoke() if arguments are passed or returns a public API
     * if no arguments are passed.
     */
    return function ESPluginBridge() {
        if (arguments.length > 0) {
            return ESPlugin.invoke.apply(this, arguments);
        } else {
            return {
                listInstances: ESPlugin.getInstances,
                invoke: ESPlugin.invoke,
                invokeMethod: ESPlugin.invokeMethod
            };
        }
    };

})(RedactorPlugins || {}, console);