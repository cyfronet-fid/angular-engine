angular.module('engine.document')
.factory('DocumentModal',
    function($resource, $uibModal){
        return function(documentOptions, parentDocumentId, callback){
            var modalInstance = $uibModal.open({
                templateUrl: '/src/document/document-modal.tpl.html',
                controller: function ($scope, documentOptions, engineActionsAvailable, $uibModalInstance) {
                    $scope.documentOptions = documentOptions;
                    $scope.parentDocumentId = parentDocumentId;
                    $scope.validatedSteps = [];

                    $scope.engineAction = function(action) {
                        $scope.$broadcast('engine.common.action.invoke', action, $scope.closeModal);
                    };

                    $scope.closeModal = function () {
                        $uibModalInstance.close()
                    };
                },
                size: 'lg',
                resolve: {
                    documentOptions: function () {
                        return documentOptions;
                    }
                }
            });
            modalInstance.result.then(function (result) {
                if(callback)
                    callback(result);
            }, function () {
            });


        }
});