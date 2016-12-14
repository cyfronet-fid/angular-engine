angular.module('engine.document')
    .factory('DocumentCategoryFactory', function (DocumentCategory, $engine) {
    function DocumentCategoryFactory() {
        this._categoryTypeList = [];
        this._defaultField = new DocumentField(function(){return true;}, function (field, metric) { return field; });

        this._registerBasicCategories();
    }

    DocumentCategoryFactory.prototype.register = function register(documentCategory) {
        this._categoryTypeList.push(documentCategory);
    };

    DocumentCategoryFactory.prototype.makeCategory = function makeCategory(category, ctx) {
        for(var i = 0; i < this._categoryTypeList.length; ++i) {
            if(this._categoryTypeList[i].matches(metric))
                return this._categoryTypeList[i].makeField(metricList, metric, ctx);
        }
        if(!this.allowDefaultField)
            throw new Error("DocumentFieldFactory.allowDefaultField is false but there was a metric which could not be matched to registered types: ",
                "Metric", metric, "Registered types", this._categoryTypeList);

        return this._defaultField.makeField(metricList, metric, ctx);
    };

    DocumentCategoryFactory.prototype._registerBasicCategories = function _registerBasicCategories(documentField) {
        this.register()
    };

    return new DocumentCategoryFactory();

})
    .factory('DocumentCategory', function () {
        function DocumentCategory(categoryCondition, categoryBuilder) {
            this.categoryCondition = ConditionBuilder(categoryCondition);
            this.categoryBuilder = categoryBuilder;
        }

        DocumentCategory.prototype.matches = function matches(metricCategory) {
            return this.categoryCondition(metricCategory);
        };

        DocumentCategory.prototype.makeCategory = function makeCategory(metricCategory, ctx) {
            var formlyCategory = {
                id: metricCategory.id,
                templateOptions: {
                    wrapperClass: self.categoryWrapperCSS,
                    label: metricCategory.label,
                    visualClass: metricCategory.visualClass
                }, fieldGroup: parseMetricCategories(metricCategory.children), wrapper: self.categoryWrapper
            };

            return this.fieldCustomizer(formlyCategory, ctx);
        };

        return DocumentCategory;
    })