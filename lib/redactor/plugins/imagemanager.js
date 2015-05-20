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

                var imagesjson = this.ESPlugin.invokeServerMethod('GetImages');
                imagesjson = JSON.parse(imagesjson);

                $('#redactor-modal-image-droparea').addClass('redactor-tab redactor-tab1');

                var $box = $('<div id="redactor-image-manager-box" style="overflow: auto; height: 300px;" class="redactor-tab redactor-tab2">').hide();
                $modal.append($box);

                if (imagesjson) {
                    return this.imagemanager.updateImageChooser(imagesjson);
                }

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
            }
        };
    };
})(jQuery);