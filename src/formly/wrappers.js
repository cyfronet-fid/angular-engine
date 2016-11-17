angular.module('engine')
    .config(function (formlyConfigProvider) {

        formlyConfigProvider.setWrapper({
            name: 'engineLabel',
            templateUrl: '/src/formly/label.tpl.html',
            // apiCheck:
            overwriteOk: true
        });
        formlyConfigProvider.setWrapper({
            name: 'engineHasError',
            templateUrl: '/src/formly/has-error.tpl.html',
            overwriteOk: true
        });
        formlyConfigProvider.setWrapper({
            name: 'category',
            templateUrl: '/src/document/category.tpl.html'
        });
    });