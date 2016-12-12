angular.module('engine').controller('engineMainCtrl', function ($rootScope, engineResourceLoader) {
    $rootScope.resourcesLoaded = false;

    if(engineResourceLoader.resources == 0)
        $rootScope.resourcesLoaded = true;
    else
        $rootScope.$on('engine.common.resourcesLoaded', function () {
            $rootScope.resourcesLoaded = true;
        })
});