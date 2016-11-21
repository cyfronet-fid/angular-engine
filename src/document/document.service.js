angular.module('engine.document')
.factory('DocumentModal',
    function($resource, $uibModal){
        return function(documentOptions, documentId, callback){
            var modalInstance = $uibModal.open({
                templateUrl: '/src/document/document-modal.tpl.html',
                controller: function ($scope, documentOptions, $uibModalInstance) {
                    $scope.documentOptions = documentOptions;

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