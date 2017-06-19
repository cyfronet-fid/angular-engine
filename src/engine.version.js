'use strict';

var ENGINE_COMPILATION_DATE = '@@__DATE__';
var ENGINE_VERSION = '@@__ENGINE_VERSION__';
var ENGINE_BACKEND_VERSION = '@@__ENGINE_BACKEND_VERSION__';

var ENGINE_ENV = '@@__ENV__';
var ENGINE_PRODUCTION_MODE = (ENGINE_ENV == 'production');

angular.module('engine').constant('version', ENGINE_VERSION);
angular.module('engine').constant('backendVersion', ENGINE_BACKEND_VERSION);
angular.module('engine').constant('productionMode', ENGINE_PRODUCTION_MODE);