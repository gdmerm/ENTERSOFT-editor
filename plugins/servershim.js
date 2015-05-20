var ESServerShim = (function ($) {

    var serverMethods = {
        Hello: function(msg) {
            return 'Hello ' + msg;
        }
    }

    return {
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