class ConfirmModalCmpCtrl {

    constructor() {
    }

    $onInit() {

    }
}

app.component('confirmModalCmp', {
    bindings: {
        close: '&',
        dismiss: '&',
        resolve: '<'
    },
    controller: ConfirmModalCmpCtrl,
    templateUrl: '/src/common/confirm-modal/common.confirm-modal.tpl.html'
});

var app = angular.module('engine.common');

app.factory('engConfirm', function ($resource, $uibModal, $translate, $timeout, $engine) {
    /**
     *
     * @param title
     * @type title string
     * @param content
     * @type content string
     */
    return function engConfirm(title, content) {
        let modalInstance = $uibModal.open({
            component: 'confirmModalCmp',
            keyboard: false,
            backdrop: 'static',
            windowTopClass: $engine.GLOBAL_CSS,
            resolve: {
                title: () => title,
                content: () => content
            },
            controller: ConfirmModalCmpCtrl,
            size: 'sm',
        });
        return modalInstance.result;
    };
});
