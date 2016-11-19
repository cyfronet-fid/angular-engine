angular.module('engine.formly')
.provider('$engineFormly', function () {
    var self = this;

    var _typeTemplateUrls = {
        input: '/src/formly/input.tpl.html',
        select: '/src/formly/select.tpl.html',
        checkbox: '/src/formly/checkbox.tpl.html',
        radio: '/src/formly/radio.tpl.html',
        textarea: '/src/formly/textarea.tpl.html',
        multiCheckbox: '/src/formly/multiCheckbox.tpl.html'
    };
    var _wrapperTemplateUrls = {
        category: '/src/formly/category.tpl.html',
        label: '/src/formly/label.tpl.html',
        hasError: '/src/formly/has-error.tpl.html'
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