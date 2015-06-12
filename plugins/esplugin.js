/**
 * @module {function} ESPluginBridge
 * Entersoft API using Redactor module encapsulation.
 * @returns {function}
 */
var ESPluginBridge = (function (RD, console, window) {

    /**
     * [_pluginInstances description]
     * @type {Array}
     */
    var _pluginInstances = [];

    /**
     * @static create
     * factory method passed to RedactorPlugins object. 
     * Redactor uses this method internaly to obtain the plugin object.
     */
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
     * @static invokeServerMethod
     * call a windows .NET method / subprocedure
     * @param  {methodName} methodName The signature name of the server side method
     * @param {string|number|object} params Optional parameters that can be sent to the server
     */
    ESPlugin.invokeServerMethod = function (methodName, params) {
        try {
            return (arguments.length > 1) ?
                window.external[methodName](params) :
                window.external[methodName]();
        } catch(e) {
            window.alert(e);
        }
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
                name: 'getImageListButton',
                label: 'List Images',
                faclass: 'fa-photo',
                //callbackName: 'getContent',
                serverMethod: function () {
                    ESPlugin.invokeServerMethod('Hello', 'Alex');
                },
                enabled: false
            }, 
            {
                name: 'saveContentsButton',
                label: 'Save',
                faclass: 'fa-save',
                serverMethod: function () {
                    ESPlugin.invokeServerMethod('Save');
                },
                enabled: false
            },
            {
                name: 'printbutton',
                label: 'print',
                faclass: 'fa-print',
                callbackName: 'spawnPrintDialog',
                enabled: true
            }
        ];

        //inject window.console
        this.console = console;

        //track if editor is dirty
        this.editorDirty = false;

        //reference this method so it can be used from instance objects
        this.invokeServerMethod = ESPlugin.invokeServerMethod;

        /**
         * cache temporarily the content of the editor
         * @type {string|null}
         *
         * @description
         * It seems that redactor is using 15ms timeouts when setting content.
         * This means that if getContent() is called 15ms or later AFTER a setContent,
         * then the returned content is the content the user sees on his screen.
         *
         * =====================================================================
         * Case A: SetContent is followed by a getContent AFTER 15ms or more
         * =====================================================================
         * 
         *                       15ms      30ms
         *                    |-------|xxxxx|
         * setContent('hello')              --> this.code.get() // logs 'hello'
         * 
         *         //- Schema a. `getContent` is called after 15ms or more -//
         *
         * But if a getContent() is called BEFORE this 15ms time expires, then the content
         * is not the same as the content that was passed to the setContent() method. It actually
         * is the content of the current editor window which is still untouched since 
         * redactor will update itself NOT LATER than this 15ms window of time.
         *
         * ======================================================================
         * Case B: SetContent is followed by a getContent WITHIN the 15ms window
         * ======================================================================
         * 
         * Assuming that at some point in time the current redactor html content is 
         * 
         * CurrentHtmlContent = 'Hello '
         * 
         *                    0            4ms                    15ms
         *                    |------------||---------------------|
         *                    0            4ms                    X redactor will update here.
         *                    
         * setContent('hello George') --> this.code.get() // logs 'hello ' because redactor has not updated yet
         * 
         *        //- Schema b. `this.code.get()` is called sooner than the 15ms window -//
         *
         * ===================================================================
         * THE SOLUTION
         * ===================================================================
         * We use an instance property to cache the value which is set to the editor.
         * Once the editor finshes setting this value (after 15ms have passed), then
         * we reset this value to `null`. 
         *
         * IF a getContent is called prior to these 15ms time frame, then the value returned by
         * getContent() is the cached property's value and NOT the native code.get() redactor
         * method.
         *
         * Check the method stubs for getContent(), setContent() below to see the implementation.
         *
         * NOTE:
         * This solution was proposed by Alex since his .NET backend seems to be making rapid set, get
         * calls. Blame has been appointed. ;)
         */
        this.htmlbuffer = null;

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
            //handle some keyboard shortcuts
            _plugin.handleKeyboard();

            /**
             * add buttons defined in `this.interfaceButtons`
             */
            function _addButtons() {
                var buttonConfig;

                for (var i = 0,_len = _plugin.interfaceButtons.length; i<_len; i++) {
                    buttonConfig = _plugin.interfaceButtons[i];
                    if (buttonConfig.enabled) {
                        _plugin._addEditorButton.call(redactorInstance, buttonConfig);
                    }
                }
            }
        };
    }

    ESPlugin.prototype = {

        /**
         * @private
         * adds buttons on the editor instance
         * @param {object} buttonConfig The configuration on `this.interfaceButtons`
         */
        _addEditorButton: function _addEditorButton(buttonConfig) {
            var button = this.button.add(buttonConfig.name, buttonConfig.label);
            this.button.setAwesome(buttonConfig.name, buttonConfig.faclass);
            if (buttonConfig.serverMethod) {
                this.button.addCallback(button, buttonConfig.serverMethod);
            } else {
                this.button.addCallback(button, this.ESPlugin[buttonConfig.callbackName]);
            }
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
         * catches some keyboard strokes and cancels or otherwise adds extra handling
         */
        handleKeyboard: function () {
            disableF5();

            function disableF5() {
                if (window.external.AddSearchProvider) return;
                $(document).on('keydown', function (e) {
                    var code = e.which || e.keyCode;
                    if (code === 116) {
                        e.preventDefault();
                        return;
                    }
                });
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
            var editorContent;
            if (this.ESPlugin.htmlbuffer) {
                editorContent = this.ESPlugin.htmlbuffer;
            } else {
                editorContent = this.code.get();
            }
            console.log('got content: ', editorContent);
            return editorContent;
        },

        /**
         * @callback setContent
         * sets the contents of the editor
         * @this {RedactorInstance}
         * @param {string} content
         */
        setContent: function setContent(content) {
            this.ESPlugin.htmlbuffer = content;
            this.code.set(content);
            var self = this;
            setTimeout(function () { self.ESPlugin.htmlbuffer = null; }, 16);
        },

        /**
         * @callback checkDirty
         * informs whether editor is dirty
         * @return {boolean}
         */
        checkDirty: function () {
            return this.ESPlugin.editorDirty;
        },

        /**
         * @callback spawnPrintDialog
         * calls the native OS print dialog
         */
        spawnPrintDialog: function printDialog() {
            return window.print(); 
        },

        /**
         * generate a unique random id.
         * @return {string} [description]
         */
        uuid: function () {
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = (d + Math.random()*16)%16 | 0;
                d = Math.floor(d/16);
                return (c=='x' ? r : (r&0x3|0x8)).toString(16);
            });
            return uuid;
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
                client: ESPlugin.invoke,
                invokeMethod: ESPlugin.invokeMethod,
                server: ESPlugin.invokeServerMethod
            };
        }
    };

})(RedactorPlugins || {}, console, window);