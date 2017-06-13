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

angular.module('engine',
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
    .config(function (formlyConfigProvider, formlyApiCheck, productionMode) {
        if (productionMode) {
            console.log(formlyApiCheck);
            formlyApiCheck.config.disabled = true;
            formlyConfigProvider.disableWarnings = true;
            formlyConfigProvider.extras.ngModelAttrsManipulatorPreferBound = true;
        }
    });