/**
 * @module  {RedactorPlugin} ESImageEdit
 * @author  G. D. Mermigkas <yme@entersoft.gr>
 * @company Entersoft SA
 * @date 26/05/2015
 * @description
 * provides extra properties for image edit base dialog
 */
 var ESImageEditPlugin = (function (RD, $) {

    ESImageEdit.create = function create() {
        return new ESImageEdit();
    };

    /**
     * @class ESImageEditPlugin
     */
    function ESImageEdit() {

        /**
         * cache a few dom elements
         * @type {Object}
         */
        this.elements = {
            redactorEditor: null,
            editButton: null
        };

        /**
         * template for the extra tab with properties
         * @type {string}
         */
        this.propertiesTemplate = 
            '<label>Image Url</label>' +
            '<input type="text" id="redactor-esimageedit-src" readonly></input>' +
            '<label>Title</label>' +
            '<input type="text" id="redactor-esimageedit-title"></input>' +
            '<label>Alt</label>' +
            '<input type="text" id="redactor-esimageedit-alt"></input>' +
            '<div class="redactor-esimageedit-dims clearfix">' +
                '<div class="form-group">' +
                    '<label>Width</label>' +
                    '<input type="text" rel="width" id="redactor-esimageedit-width"></input>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Height</label>' +
                    '<input type="text" rel="height" id="redactor-esimageedit-height"></input>' +
                '</div>' +
                '<div class="form-group esimageedit-constrain">' +
                    '<label>Constrain</label>' +
                    '<input type="checkbox" checked id="redactor-esimageedit-constrain" value="true"></input>' +
                '</div>' +
            '</div>';

        /**
         * handy reference to the image being edited
         * @type {jQueryDomReference}
         */
        this.$image = null;

        /**
         * a local cache with image properties / metadata
         * @type {Object}
         */
        this.imageProperties = {
            width: 0,
            height: 0,
            src: null,
            title: null,
            alt: null,
            ratio: 1
        };

        /**
         * when true, image dimensions are constrained by their initial aspect ratio
         * @type {Boolean}
         */
        this.shouldConstrainDimensions = true;

        /**
         * bootstrap method
         */
        this.init = function init() {
            var redactorInstance = this;
            var _plugin = this.ESImageEdit;
            _plugin.elements.redactorEditor = this.$textarea.parent().find('.redactor-editor');
            _plugin.applyEvents.call(redactorInstance);
        };
    }

    ESImageEdit.prototype = {

        /**
         * catch `edit` button click and apply a few transormations on the resulting modal dialog
         */
        applyEvents: function _applyEvt() {
            var redactorInstance = this;
            this.ESImageEdit.elements.redactorEditor.on('click.imageedit', '#redactor-image-editter', $.proxy(this.ESImageEdit.hackEditInterface, redactorInstance));
        },

        /**
         * transforms the edit image dialog into a richer component and applies some extra event handlers
         * @param  {jQueryDomReference} e Event triggered by the `edit` button on the image
         */
        hackEditInterface: function (e) {
            //obtain reference to native edit image container
            var $modal = this.modal.getModal();
            //cache a reference to the image being edited
            this.ESImageEdit.$image = $(e.currentTarget).parent().children('img');
            this.ESImageEdit.setImageProperties(this.ESImageEdit.$image);

            //create tabs
            this.modal.createTabber($modal);
            this.modal.addTab(1, 'Linking', 'active');
            this.modal.addTab(2, 'Properties');
            //get existing modal content and wrap as first tab
            var linkingTabContent = $modal.contents().slice(1, $modal.contents().length);
            linkingTabContent.wrapAll('<div class="redactor-tab redactor-tab-1"></div>');

            //add container for second tab along with tab content
            $modal.append(
                $('<div class="redactor-tab redactor-tab-2 hide"></div>')
                .append(this.ESImageEdit.propertiesTemplate)
                .hide()
            );

            //tabs are buggy for some reason. Let's fix them
            $('#redactor-modal-tabber > a')
                .off('click')
                .on('click.esimageedit', $.proxy(this.ESImageEdit.toggleTabs, this));

            //populate the textboxes with image properties
            this.ESImageEdit.bindPropertiesToView.apply(this, [$modal]);

            //catch modal save action
            $modal
                .parent()
                .next()
                .find('.redactor-modal-btn')
                .on('click.esimageedit', $.proxy(this.ESImageEdit.save, this));

            //toggle constrain proporions flag on / off
            $modal
                .find('.redactor-esimageedit-dims input[type="checkbox"]')
                .on('click', $.proxy(this.ESImageEdit.toggleConstrainMode, this));

            //apply contrain proportions functionality
            $modal
                .find('.redactor-esimageedit-dims input[type="text"]')
                .on('change', $.proxy(this.ESImageEdit.constrainProportions, this));
        },

        /**
         * receives an image DOM element and caches some properties from it
         * @param {jQueryDomReference} $image
         */
        setImageProperties: function($image) {
            this.imageProperties.src = $image.attr('src');
            this.imageProperties.width = $image.width();
            this.imageProperties.height = $image.height();
            this.imageProperties.title = $image.attr('title');
            this.imageProperties.alt = $image.attr('alt');
            this.imageProperties.ratio =  this.imageProperties.width / this.imageProperties.height;
        },

        /**
         * populate textboxes with image properties
         * @param  {RedactorModalDomReference} $modal
         * @this {RedactorPluginInstance}
         */
        bindPropertiesToView: function($modal) {
            var imgProps = this.ESImageEdit.imageProperties;
            $modal.find('#redactor-esimageedit-src').val(imgProps.src);
            $modal.find('#redactor-esimageedit-alt').val(imgProps.alt);
            $modal.find('#redactor-esimageedit-title').val(imgProps.title);
            $modal.find('#redactor-esimageedit-width').val(imgProps.width);
            $modal.find('#redactor-esimageedit-height').val(imgProps.height);
        },

        /**
         * sets the `shouldConstrainDimensions` instance property based on input selection
         * @param  {event} e
         */
        toggleConstrainMode: function constrainMode(e) {
            var $checkbox = $(e.currentTarget);
            this.ESImageEdit.shouldConstrainDimensions = $checkbox.is(':checked');
        },

        /**
         * calculates with, height so they both abide to original image ratio
         * @param  {[type]} e [description]
         * @return {[type]}   [description]
         */
        constrainProportions: function constrain(e) {
            var $target = $(e.currentTarget);
            var ratio = this.ESImageEdit.imageProperties.ratio;
            var dimension = parseInt($target.val());
            var dimensionPropertyBeingChanged = $target.attr('rel');
            var dimensionPropertyToChange = (dimensionPropertyBeingChanged === 'width') ? 'height' : 'width';

            var constrainedDimension = (dimensionPropertyToChange === 'width') ?
                parseInt(dimension * ratio, 10) :
                parseInt(dimension / ratio, 10);
            if (isNaN(dimension)) return;

            if (this.ESImageEdit.shouldConstrainDimensions) {
                this.modal.getModal().find('#redactor-esimageedit-' + dimensionPropertyToChange).val(constrainedDimension);
            }
        },

        /**
         * saves the new editted properties
         */
        save: function() {
            var $modal = this.modal.getModal(),
                width = $modal.find('#redactor-esimageedit-width').val(),
                height = $modal.find('#redactor-esimageedit-height').val(),
                title = $modal.find('#redactor-esimageedit-title').val(),
                src = $modal.find('#redactor-esimageedit-src').val(),
                alt = $modal.find('#redactor-esimageedit-alt').val();

            this.ESImageEdit.$image
                .animate({
                    width: parseInt(width),
                    height: parseInt(height)
                }, 250)
                .attr('title', title)
                .attr('alt', alt);
        },

        /**
         * toggles tab visibility
         * @param  {event} e [description]
         */
        toggleTabs: function (e) {
            var $tab = $(e.currentTarget);
            var $modal = this.modal.getModal();
            var $tabs = $modal.find('#redactor-modal-tabber a');
            var $tabContainers = $modal.find('.redactor-tab');

            $tabContainers.removeAttr('style').addClass('hide');
            $tabs.removeClass('active');
            $tab.addClass('active');
            $modal.find('.redactor-tab-' + $tab.attr('rel').replace('tab', '')).removeClass('hide');
        }
    };

    RD.ESImageEdit = ESImageEdit.create;

 })(RedactorPlugins || {}, jQuery);