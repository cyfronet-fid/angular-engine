angular.module('engine.formly')
    .run(function (formlyConfig, $engineFormly) {

        formlyConfig.setWrapper({
            name: 'engineLabel',
            templateUrl: $engineFormly.wrapperUrls['label'],
            // apiCheck:
            overwriteOk: true
        });
        formlyConfig.setWrapper({
            name: 'engineHasError',
            templateUrl: $engineFormly.wrapperUrls['hasError'],
            overwriteOk: true
        });
        formlyConfig.setWrapper({
            name: 'category',
            templateUrl: $engineFormly.wrapperUrls['category']
        });
        formlyConfig.setWrapper({
            name: 'step',
            templateUrl: $engineFormly.wrapperUrls['step']
        });
        formlyConfig.setWrapper({
            name: 'unit',
            templateUrl: $engineFormly.wrapperUrls['unit']
        });
        formlyConfig.setWrapper({
            name: 'default',
            templateUrl: $engineFormly.wrapperUrls['default']
        });
    })
    .controller('engineFormlyWrapperCtrl', function ($scope) {
        $scope.$on('document.form.reloadingMetrics.before', function (event) {
            console.log('document.form.reloadingMetrics.before');
            $scope.loading = true;
        });
        $scope.$on('document.form.reloadingMetrics.after', function (event) {
            console.log('document.form.reloadingMetrics.after');
            $scope.loading = false;
        });
    });