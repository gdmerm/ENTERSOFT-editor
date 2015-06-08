if (!RedactorPlugins) var RedactorPlugins = {};

(function($) {

    RedactorPlugins.esImageManager = function() {
        return {
            init: function() {
                if (!this.opts.imageManagerJson) return;
                this.modal.addCallback('image', this.esImageManager.load);
            },

            load: function() {
                var $modal = this.modal.getModal();
                var self  = this;
                this.modal.createTabber($modal);
                this.modal.addTab(1, 'Upload', 'active');
                this.modal.addTab(2, 'Choose');

                //hack redactor's upload interface
                var setupUploadUI = $.proxy(function () {self.esImageManager.setupUploadUI(); }, self);
                setTimeout(setupUploadUI, 20);

                //get list of images from server
                var imagesjson = this.ESPlugin.invokeServerMethod('GetImages');
                self.esImageManager.uploadedImages = imagesjson = JSON.parse(imagesjson);

                //add the tab css classes to the browse for image container so that it behaves as a tab
                $('#redactor-modal-image-droparea').addClass('redactor-tab redactor-tab1');

                //add the insert image from url html markup
                var $imageFromUrlHtml = 
                    $('<div class="redactor-esimage-image-url" id="esimage-image-url">' + 
                        '<label>Εικόνα από Url:</label>' +
                        '<input type="text" placeholder="image url">' + 
                        '<button id="button-url-image" class="btn btn-info">Εισαγωγή</button>' +
                        '<div class="or-separator">ή</div>' +
                    '</div>');
                $imageFromUrlHtml.find('#button-url-image').on('click', $.proxy(this.esImageManager.insertFromUrl, this));
                $('#redactor-modal-image-droparea').append($imageFromUrlHtml);

                //build the second tab
                var $box = $('<div id="redactor-image-manager-box" style="overflow: auto; height: 300px;" class="redactor-tab redactor-tab2">').hide();
                $modal.append($box);

                //if imagesjson is ready short-circuit to display the images
                if (imagesjson) {
                    return this.esImageManager.updateImageChooser(imagesjson);
                }

                //no imagesjson exists. Let's fetch images using the options imageManagerJson url
                $.ajax({
                    dataType: "json",
                    cache: false,
                    url: this.opts.imageManagerJson,
                    success: self.esImageManager.updateImageChooser
                });
            },

            updateImageChooser: function(data) {
                var $chooserContainer = $('#redactor-image-manager-box');

                if (typeof data === 'undefined' || data === null || data === []) {
                    //get list of images from server
                    data = this.ESPlugin.invokeServerMethod('GetImages');
                    data = this.esImageManager.uploadedImages = JSON.parse(data);
                    $chooserContainer.html('');
                } 

                $.each(data, $.proxy(function(key, val) {
                    // title
                    var thumbtitle = '';
                    if (typeof val.title !== 'undefined') thumbtitle = val.title;

                    var img = $('<img src="' + val.thumb + '" rel="' + val.image + '" title="' + thumbtitle + '" style="width: 100px; height: 75px; cursor: pointer;" />');
                    $chooserContainer.append(img);
                    $(img).click($.proxy(this.esImageManager.insert, this));
                }, this));
            },

            insert: function(e) {
                this.image.insert('<img src="' + $(e.target).attr('rel') + '" alt="' + $(e.target).attr('title') + '">');
            },

            insertFromUrl: function(e) {
                var url = $(e.target).prev().val();
                if (url === '' || typeof url !== 'string') {
                    toastr.error('Ο σύνδεσμος εικόνας δεν είναι έγκυρος');
                    return; 
                }
                this.image.insert('<img src="' + $(e.target).prev().val() + '" alt="">');
            },

            setupUploadUI: function () {
                var $dropArea = $("#redactor-droparea-placeholder");
                var $input = $("#redactor-droparea input");
                var $uploadButton = $('<button class="btn btn-default button-upload">Browse</button>');
                var callUploadDialog =  $.proxy(function () {this.esImageManager.callUploadDialog(); }, this);

                //pass click callback on upload button
                $uploadButton.on('click.esImageManager.upload', callUploadDialog);

                //remove the file input and update with our own button
                $input.off('change.redactor.upload');
                $input.remove();
                $dropArea.html('').append($uploadButton);
            },

            switchTab: function (tabIndex) {
                $('#redactor-modal-tabber a').eq(tabIndex).trigger('click');
            },

            callUploadDialog: function () {
                var images;
                toastr.options.timeOut = 30000;
                toastr.options.progressBar = true;
                toastr.info('Αναμονή για ανάρτηση εικόνας...');

                try {
                    images = this.ESPlugin.invokeServerMethod('UploadImages');
                    images = JSON.parse(images);
                    if (images.length === 0) {
                        throw new Error('Upload canceled from user');
                    }
                } catch (e) {
                    toastr.options.progressBar = false;
                    toastr.remove();
                    toastr.error(e);
                    return;
                }

                this.esImageManager.updateImageChooser(/*images*/);
                toastr.options.progressBar = false;
                toastr.options.timeOut = 5000;
                toastr.remove();
                toastr.success('Επιτυχής ανάρτηση εικόνας!');
                this.esImageManager.switchTab(1);
            }
        };
    };

})(jQuery);