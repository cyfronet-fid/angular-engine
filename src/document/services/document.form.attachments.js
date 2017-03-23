angular.module('engine.document').factory('engAttachment', function ($engineConfig, $http, Upload, $q) {
    var listUrl = 'attachment-list';
    var singleUrl = 'attachment';

    function EngineAttachment(documentId, metricId, isList) {
        var self = this;
        this.isList = isList || false;
        this.baseUrl = this.isList ? listUrl : singleUrl;
        this.documentId = documentId;
        this.metricId = metricId;
        this.action = null;
        this.data = null;
        this.label = 'Select file';
        this.ready = $q.all([this.loadActions(), $q.when(function () {
            if (self.documentId == null)
                return;

            return self.loadMetadata();
        }())]);
    }

    EngineAttachment.prototype.clear = function clear() {
        this.data = null;
    };

    EngineAttachment.prototype.getDownloadLink = function getDownloadLink() {
        return $engineConfig.baseUrl + this.baseUrl + '/download?documentId=' + this.documentId + '&metricId=' + this.metricId;
    };
    EngineAttachment.prototype.loadMetadata = function loadMetadata() {
        var self = this;
        this.data = null;
        return $http.get($engineConfig.baseUrl + self.baseUrl + '?documentId=' + this.documentId + '&metricId=' + this.metricId).then(function (response) {
            self.data = response.data.data;
            return response.data.data;
        }, function (response) {
            // if(response.status == 404)
            //no attachment
        });
    };
    EngineAttachment.prototype.loadActions = function loadActions() {
        var self = this;
        return $http.post($engineConfig.baseUrl + 'action/available/' + self.baseUrl + '?documentId=' + this.documentId + '&metricId=' + this.metricId).then(function (response) {
            if (response.data.data.length == 0)
                console.error("No Attachment action available for document: ", self.documentId, " and metric ", self.metricId);
            self.action = response.data.data[0];
            self.label = self.action.label;
        }, function (response) {
            //TODO ERROR MANAGEMENT
        });
    };
    EngineAttachment.prototype.upload = function upload(file) {
        var self = this;
        return Upload.upload({
            url: $engineConfig.baseUrl + '/action/invoke/' + self.baseUrl + '?documentId=' + this.documentId + '&metricId=' + this.metricId + '&actionId=' + this.action.id,
            data: {file: file}
        })
    };

    return EngineAttachment
});

angular.module('engine.document').controller('engAttachmentCtrl', function ($scope, Upload, $timeout, engAttachment) {
    var self = this;
    var STATUS = {loading: 0, uploading: 1, disabled: 2, normal: 3};

    $scope.$watch('model.' + $scope.metric.id, function (newValue, oldValue) {
        if (newValue == null || newValue == oldValue)
            return;

        if ($scope.ctx.document.id == null)
            return;

        if ($scope.attachment == null)
            return;

        $scope.attachment.loadMetadata();
    });

    $scope.getAttachmentSize = function () {
        if ($scope.attachment.data == null)
            return '- '
        return Math.floor($scope.attachment.data.length / 1024)
    };

    $scope.delete = function () {
        $scope.status = STATUS.loading;
        $scope.model[$scope.options.key] = null;
        $scope.attachment.clear();

        var event = $scope.$emit('engine.common.document.requestSave');

        event.savePromise.then(function () {
            $scope.error = null;
            $scope.status = STATUS.normal;
        }, function () {
            $scope.error = 'Could not save document';
            $scope.status = STATUS.normal;
        })
    };

    $scope.upload = function (file) {
        if (file == null)
            return;

        var event = $scope.$emit('engine.common.document.requestSave');

        event.savePromise.then(function () {
            $scope.progress = 0;
            $scope.error = null;
            $scope.status = STATUS.uploading;
            $scope.uploadPromise = $scope.attachment.upload(file).then(function (response) {
                console.log('Success ' + response.config.data.file.name + 'uploaded. Response: ' + response.data);
                $scope.status = STATUS.normal;
                $scope.error = null;

                $scope.ctx.document.metrics[$scope.metric.id] = response.data.data.redirectToDocument;

                var event = $scope.$emit('engine.common.document.requestReload');
            }, function (response) {
                //TODO HANDLE ERROR
                console.log('Error status: ' + response.status);
                $scope.status = STATUS.normal;

                $scope.error = "An error occurred during upload"

            }, function (evt) {
                $scope.progress = parseInt(100.0 * evt.loaded / evt.total);
            });
        }, function () {
            $scope.error = 'Could not save document';
            $scope.status = STATUS.normal;
        })
    };

    function _init() {
        $scope.error = null;
        $scope.STATUS = STATUS;
        $scope.status = STATUS.loading;
        if ($scope.ctx.document.id != null) {
            $scope.attachment = new engAttachment($scope.ctx.document.id, $scope.metric.id, $scope.isList);
            $scope.attachment.ready.then(function () {
                $scope.status = STATUS.normal;
            });
        } else {
            $scope.status = STATUS.disabled;
            $scope.disable = true;
        }
    }

    _init();
});

angular.module('engine.document').factory('createAttachmentCtrl', function () {
    return function (metric, ctx, isList) {
        return function ($scope, Upload, $timeout, engAttachment, $controller) {
            $scope.isList = isList;
            $scope.metric = metric;
            $scope.ctx = ctx;
            angular.extend(this, $controller('engAttachmentCtrl', {
                $scope: $scope,
                Upload: Upload,
                $timeout: $timeout,
                engAttachment: engAttachment
            }));
        };
    };
});