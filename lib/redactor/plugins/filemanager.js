if (!RedactorPlugins) var RedactorPlugins = {};

(function($) {
    
    RedactorPlugins.esFileManager = function() {
        return {
            init: function() {
                if (!this.opts.fileManagerJson) return;
                this.modal.addCallback('file', this.esFileManager.load);
            },
            
            load: function() {
                var $modal = this.modal.getModal();
                var self = this;
                var filesjson;
                this.modal.createTabber($modal);
                this.modal.addTab(1, 'Upload', 'active');
                this.modal.addTab(2, 'Choose');

                //hack redactor's upload interface
                var setupUploadUI = $.proxy(function () {self.esFileManager.setupUploadUI(); }, self);
                setTimeout(setupUploadUI, 20);

                //get list of files from server
                try {
                    filesjson = this.ESPlugin.invokeServerMethod('GetFiles');
                    filesjson = JSON.parse(filesjson); 
                } catch(e) {
                    return window.alert('unable to fetch file list from server');
                }

                //build the second tab
                $('#redactor-modal-file-upload-box').addClass('redactor-tab redactor-tab1');
                var $box = $('<div id="redactor-file-manager-box" style="overflow: auto; height: 300px;" class="redactor-tab redactor-tab2">').hide();
                $modal.append($box);

                //if imagesjson is ready short-circuit to display the images
                if (filesjson) {
                    return this.esFileManager.updateFileChooser(filesjson);
                }

                //no files json exists, fetch files using http
                $.ajax({
                    dataType: "json",
                    cache: false,
                    url: this.opts.fileManagerJson,
                    success: self.esFileManager.updateFileChooser
                });
            },

            updateFileChooser: function(data) {
                var ul = $('<ul id="redactor-modal-list">');
                $.each(data, $.proxy(function(key, val) {
                    var a = $('<a href="#" title="' + val.title + '" rel="' + val.link + '" class="redactor-file-manager-link">' + val.title + ' <span style="font-size: 11px; color: #888;">' + val.name + '</span> <span style="position: absolute; right: 10px; font-size: 11px; color: #888;">(' + val.size + ')</span></a>');
                    var li = $('<li />');
                    a.on('click', $.proxy(this.esFileManager.insert, this));
                    li.append(a);
                    ul.append(li);
                }, this));
                $('#redactor-file-manager-box').append(ul);
            },

            setupUploadUI: function () {
                var $dropArea = $("#redactor-droparea-placeholder");
                var $input = $("#redactor-droparea input");
                var $uploadButton = $('<button class="btn btn-default button-upload">Browse</button>');
                var callUploadDialog =  $.proxy(function () {this.esFileManager.callUploadDialog(); }, this);

                //pass click callback on upload button
                $uploadButton.on('click.esFileManager.upload', callUploadDialog);

                //remove the file input and update with our own button
                $input.off('change.redactor.upload');
                $input.remove();
                $dropArea.html('').append($uploadButton);
            },

            callUploadDialog: function () {
                var images;

                try {
                    images = this.ESPlugin.invokeServerMethod('UploadFiles');
                    images = JSON.parse(images);                    
                } catch(e) {
                    return window.alert('unable to call server file dialog');
                }

                this.esFileManager.updateFileChooser(images);
                toastr.success('Upload completed successfully!');
                this.esFileManager.switchTab(1);
            },

            switchTab: function (tabIndex) {
                $('#redactor-modal-tabber a').eq(tabIndex).trigger('click');
            },

            insert: function(e) {
                e.preventDefault();
                var $target = $(e.target).closest('.redactor-file-manager-link');
                this.file.insert('<a href="' + $target.attr('rel') + '">' + $target.attr('title') + '</a>');
            }
        };
    };

})(jQuery);