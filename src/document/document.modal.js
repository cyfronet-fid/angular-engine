angular.module('engine.document')
.factory('DocumentModal',
    function($resource, $uibModal){
        return function(documentId, documentOptions, parentDocument, callback){
            var modalInstance = $uibModal.open({
                templateUrl: '/src/document/document-modal.tpl.html',
                controller: function ($scope, documentId, documentOptions, engineActionsAvailable, StepList, engineResolve, $uibModalInstance) {
                    $scope.engineResolve = engineResolve;
                    $scope.step = 0;
                    $scope.documentOptions = documentOptions;
                    $scope.parentDocument = parentDocument;
                    $scope.$scope = $scope;
                    $scope.stepList = new StepList($scope.documentOptions.document.steps);
                    $scope.document = {};
                    $scope.documentId = documentId;

                    $scope.closeModal = function () {
                        $uibModalInstance.close()
                    };

                    $scope.$on('engine.common.action.after', function (event, ctx) {
                        if(ctx.result.type == 'REDIRECT') {
                            event.preventDefault();
                            $scope.closeModal();
                        }
                    });

                    $scope.customButtons = [{label: 'Cancel', 'action': $scope.closeModal}];
                },
                size: 'lg',
                resolve: {
                    documentOptions: function () {
                        return documentOptions;
                    },
                    documentId: function () {
                        return documentId;
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