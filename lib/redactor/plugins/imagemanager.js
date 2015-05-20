if (!RedactorPlugins) var RedactorPlugins = {};

(function($) {
    
    RedactorPlugins.imagemanager = function() {
        return {
            init: function() {
                if (!this.opts.imageManagerJson) return;
                this.modal.addCallback('image', this.imagemanager.load);
            },

            load: function() {
                var $modal = this.modal.getModal();
                var self  = this;
                this.modal.createTabber($modal);
                this.modal.addTab(1, 'Upload', 'active');
                this.modal.addTab(2, 'Choose');

                //hack redactor's upload interface
                var setupUploadUI = $.proxy(function () {self.imagemanager.setupUploadUI(); }, self);
                setTimeout(setupUploadUI, 20);

                //get list of images from server
                var imagesjson = this.ESPlugin.invokeServerMethod('GetImages');
                imagesjson = JSON.parse(imagesjson);

                //build the second tab
                $('#redactor-modal-image-droparea').addClass('redactor-tab redactor-tab1');
                var $box = $('<div id="redactor-image-manager-box" style="overflow: auto; height: 300px;" class="redactor-tab redactor-tab2">').hide();
                $modal.append($box);

                //if imagesjson is ready short-circuit to display the images
                if (imagesjson) {
                    return this.imagemanager.updateImageChooser(imagesjson);
                }

                //no imagesjson exists. Let's fetch images using the options imageManagerJson url
                $.ajax({
                    dataType: "json",
                    cache: false,
                    url: this.opts.imageManagerJson,
                    success: self.imagemanager.updateImageChooser
                });
            },

            updateImageChooser: function(data) {
                $.each(data, $.proxy(function(key, val) {
                    // title
                    var thumbtitle = '';
                    if (typeof val.title !== 'undefined') thumbtitle = val.title;

                    var img = $('<img src="' + val.thumb + '" rel="' + val.image + '" title="' + thumbtitle + '" style="width: 100px; height: 75px; cursor: pointer;" />');
                    $('#redactor-image-manager-box').append(img);
                    $(img).click($.proxy(this.imagemanager.insert, this));
                }, this));
            },

            insert: function(e) {
                this.image.insert('<img src="' + $(e.target).attr('rel') + '" alt="' + $(e.target).attr('title') + '">');
            },

            setupUploadUI: function () {
                var $dropArea = $("#redactor-droparea-placeholder");
                var $input = $("#redactor-droparea input");
                var $uploadButton = $('<button class="btn btn-default button-upload">Browse</button>');
                var callUploadDialog =  $.proxy(function () {this.imagemanager.callUploadDialog(); }, this);

                //pass click callback on upload button
                $uploadButton.on('click.imagemanager.upload', callUploadDialog);

                //remove the file input and update with our own button
                $input.off('change.redactor.upload');
                $input.remove();
                $dropArea.append($uploadButton);
            },

            callUploadDialog: function () {
                this.ESPlugin.invokeServerMethod('Upload');
            }
        };
    };

})(jQuery);