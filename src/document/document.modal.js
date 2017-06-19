angular.module('engine.document')
.factory('DocumentModal',
    function($resource, $uibModal, $translate, $timeout){
        return function(documentId, documentOptions, parentDocument, callback){
            var modalInstance = $uibModal.open({
                templateUrl: '/src/document/document-modal.tpl.html',
                keyboard: false,
                backdrop: 'static',

                controller: function ($scope, documentId, documentOptions, engineActionsAvailable, StepList, engineResolve, $uibModalInstance) {
                    $scope.engineResolve = engineResolve;
                    $scope.step = 0;
                    $scope.documentOptions = documentOptions;
                    $scope.parentDocument = parentDocument;
                    $scope.$scope = $scope;
                    $scope.stepList = new StepList($scope.documentOptions.document.steps);
                    $scope.document = {};
                    $scope.documentId = documentId;

                    function _canCloseModal() {
                        if($scope.documentDirty == false)
                            return true;

                        return confirm($translate.instant('Do you want to close this modal? Changes you made have not been saved.'));
                    }

                    $scope.closeModal = function () {
                        $uibModalInstance.close()
                    };

                    $scope.$on('modal.closing', function (event) {
                        if(!_canCloseModal())
                            event.preventDefault();
                    });

                    $scope.$on('engine.common.action.after', function (event, ctx) {
                        // don't close modal after save, with exception of create actions
                        // TODO - in the future release create action may close modal, and open new with created document
                        if(ctx.action.isSave() && !ctx.action.isCreate())
                            return;

                        if(ctx.result.type == 'REDIRECT') {
                            event.preventDefault();
                            // this must be done in the next digest cycle, so that form $dirty state is cleared beforehand
                            $timeout($scope.closeModal);
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