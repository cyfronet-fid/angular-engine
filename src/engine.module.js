/**
 * @ngdoc overview
 * @name engine
 *
 * @requires engine.list
 * @requires engine.document
 * @requires engine.dashboard
 * @requires engine.steps
 *
 * @description
 * Base module for angular-engine front end package
 *
 */

var app = angular.module('engine',
    ['ngRoute',
        'ngResource',
        'formly',
        'engine.formly',
        'ui.bootstrap',
        //required for supporting multiselect metrics
        'checklist-model',
        'engine.common',
        'engine.list',
        'engine.dashboard',
        'engine.steps',
        'ngMessages',
        'ngFileUpload',
        'pascalprecht.translate',
        'engine.document'])
/**
 * Optimizating performance in production mode
 */
app.config(function (formlyConfigProvider, formlyApiCheck, $engLogProvider, $provide, productionMode) {
    // From version 0.7.12+ api check has been disabled
    // for performance reasons
    formlyApiCheck.config.disabled = true;
    formlyConfigProvider.disableWarnings = true;
    formlyConfigProvider.extras.ngModelAttrsManipulatorPreferBound = true;

    // turn on optimization if in production mode
    if (productionMode) {
        // disable logs if in production mode
        $engLogProvider.setLogLevel('error');
    }
});

/**
 * setup hook when user tries to navigate away
 */
app.run(function ($engine, $rootScope, $engLog, $translate) {

    function onRelad() {
        $engLog.debug('engine.common.navigateAway');
        var event = $rootScope.$broadcast('engine.common.navigateAway');
        return event.defaultPrevented == true ? true : null;
    }

    if ($engine.disableOnReload == false) {
        window.onbeforeunload = onRelad;

        $rootScope.$on("$locationChangeStart", function (event, next, current) {

            //if routes differ only by GET params don't do anything
            var nextBase = next.match(/^[^?]+/);
            var currBase = current.match(/^[^?]+/);

            if(nextBase.length == 1 && currBase.length == 1 && currBase[0] == nextBase[0])
                return;

            if(onRelad() == true && confirm($translate.instant('Do you want to leave this site? Changes you made may not be saved.')) == false) {
                event.preventDefault();
            }
        });
    }
});