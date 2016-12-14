angular.module('engine.formly')
    .config(function ($engineFormlyProvider) {
        $engineFormlyProvider.setWrapperTemplateUrl('row', '/src/formly/wrappers/templates/row.tpl.html')
    })
    .run(function (formlyConfig, $engineFormly) {
        formlyConfig.setWrapper({
            name: 'row',
            templateUrl: $engineFormly.wrapperUrls['row']
        });
    });