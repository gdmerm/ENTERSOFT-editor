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
        GetImages: function() {
            return '[{"thumb": "/redactor/data/images/1.jpg", "image": "/redactor/data/images/1.jpg", "title": "1"}, {"thumb": "/redactor/data/images/2.jpg", "image": "/redactor/data/images/2.jpg", "title": "2"}, {"thumb": "/redactor/data/images/3.jpg", "image": "/redactor/data/images/3.jpg", "title": "3"}]'
        },

        UploadImages: function() {
            console.log('calling upload dialog');
            return '[{"thumb": "/redactor/data/images/1.jpg", "image": "/redactor/data/images/1.jpg", "title": "1"}]';
        },

        Save: function() {
            console.log('saving...\n\n', ESPluginBridge('getPlainText'));
        },

        UploadFiles: function() {
            console.log('calling file dialog');
            return '[{ "title": "Some Image", "name": "1.jpg", "link": "/images/1.jpg", "size": "301Kb"  }, { "title": "My Book", "name": "my-book.pdf", "link": "/files/my-book.pdf", "size": "1MB"  }]';
        },

        GetFiles: function () {
            return '[{ "title": "EBS Manual", "name": "1.jpg", "link": "/images/1.jpg", "size": "13MB"  }, { "title": "Kamasutra", "name": "my-book.pdf", "link": "/files/my-book.pdf", "size": "4MB"  }]';
        }
    };

    return {
        /**
         * merges shimmed methods within the window.external object only on browser environments
         */
        mockMethods: function () {
            if (window.external.AddSearchProvider) {
                for (var key in serverMethods) {
                    if (serverMethods.hasOwnProperty(key)) {
                        window.external[key] = serverMethods[key];
                    }
                }
            }
        }
    };

})(jQuery);