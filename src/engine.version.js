'use strict';

var ENGINE_COMPILATION_DATE = '@@__DATE__';
var ENGINE_VERSION = '@@__ENGINE_VERSION__';
var ENGINE_BACKEND_VERSION = '@@__ENGINE_BACKEND_VERSION__';

angular.module('engine').value('version', ENGINE_VERSION);
angular.module('engine').value('backendVersion', ENGINE_BACKEND_VERSION);