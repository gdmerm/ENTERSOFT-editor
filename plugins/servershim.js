/**
 * @module  ESServerShim
 * @description 
 * Shims windows .NET methods so it can be tested on browser environments. Feature detection is employed to
 * disable the shimed methods on the actual .NET environment
 */
var ESServerShim = (function ($) {

    /**
     * a list of shimmed methods
     * @type {Object}
     */
    var serverMethods = {
        Hello: function(msg) {
            return 'Hello ' + msg;
        },

        GetImages: function() {
            return '[{"thumb": "/redactor/data/images/1.jpg", "image": "/redactor/data/images/1.jpg", "title": "1"}, {"thumb": "/redactor/data/images/2.jpg", "image": "/redactor/data/images/2.jpg", "title": "2"}, {"thumb": "/redactor/data/images/3.jpg", "image": "/redactor/data/images/3.jpg", "title": "3"}]'
        },

        Upload: function() {
            console.log('calling upload dialog');
        },

        Save: function() {
            console.log('saving...\n\n', ESPluginBridge('getPlainText'));
        }
    }

    return {
        /**
         * merges shimmed methods within the window.external object only on browser environments
         */
        mockMethods: function () {
            if (window.external.AddSearchProvider) {
                for (var key in serverMethods) {
                    if (serverMethods.hasOwnProperty(key)) {
                        window.external[key] = serverMethods[key]
                    }
                }
            }
        }
    }

})(jQuery);