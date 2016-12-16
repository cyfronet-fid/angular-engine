/**
 * @ngdoc overview
 * @name engine
 *
 * @requires engine
 * @requires engine.list
 * @requires engine.document
 * @requires engine.dashboard
 * @requires engine.steps
 *
 * @description
 * Base module for angular-engine front end package
 *
 * @example
 * test
 *
 *
 */
angular.module('engine',
    ['ngRoute',
    'ngResource',
    'formly',
    'engine.formly',
    'ui.bootstrap',
    'engine.common',
    'engine.list',
    'engine.dashboard',
    'engine.steps',
    'ngMessages',
    'pascalprecht.translate',
    'engine.document'])