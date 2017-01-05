angular.module('engine.formly')
.provider('$engineFormly', function () {
    var self = this;

    var _typeTemplateUrls = {
        input: '/src/formly/types/templates/input.tpl.html',
        select: '/src/formly/types/templates/select.tpl.html',
        checkbox: '/src/formly/types/templates/checkbox.tpl.html',
        radio: '/src/formly/types/templates/radio.tpl.html',
        radioGroup: '/src/formly/types/templates/radioGroup.tpl.html',
        textarea: '/src/formly/types/templates/textarea.tpl.html',
        datepicker: '/src/formly/types/templates/datepicker.tpl.html',
        multiCheckbox: '/src/formly/types/templates/multiCheckbox.tpl.html',
        multiSelect: '/src/formly/types/templates/multiSelect.tpl.html',
        multiSelectImage: '/src/formly/types/templates/multiSelectImage.tpl.html'
    };
    var _wrapperTemplateUrls = {
        category: '/src/formly/wrappers/templates/category.tpl.html',
        label: '/src/formly/wrappers/templates/label.tpl.html',
        hasError: '/src/formly/wrappers/templates/has-error.tpl.html',
        step: '/src/formly/wrappers/templates/step.tpl.html',
        unit: '/src/formly/wrappers/templates/unit.tpl.html',
        default: '/src/formly/wrappers/templates/default.tpl.html'
    };

    this.templateUrls = _typeTemplateUrls;
    this.wrapperUrls = _wrapperTemplateUrls;

    this.setTypeTemplateUrl = function(type, url) {
        _typeTemplateUrls[type] = url
    };

    this.setWrapperTemplateUrl = function(wrapper, url) {
        _wrapperTemplateUrls[wrapper] = url
    };


    this.$get = function () {
        return new function() {
            this.templateUrls = _typeTemplateUrls;
            this.wrapperUrls = _wrapperTemplateUrls;
        };
    };
});