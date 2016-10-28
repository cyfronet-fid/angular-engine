'use strict';

describe('Engine Frontend Sanity Tests', function () {
    var firstNumber = element(by.model('first'));
    var secondNumber = element(by.model('second'));
    var goButton = element(by.id('gobutton'));
    var latestResult = element(by.binding('latest'));

    beforeEach(function () {
        browser.get("/tests/e2e/index.html");
    });

    beforeEach(function () {
        browser.addMockModule('httpMocker', function () {
            angular.module('httpMocker', ['ngMockE2E'])
                .run(function ($httpBackend) {
                    $httpBackend.whenGET(
                        '/query/documents?queryId=proposal')
                        .respond([
                            {
                                albumId: 1,
                                id: 1,
                                title: "accusamus beatae ad",
                                url: "http://placehold.it/600/92c952",
                                thumbnailUrl: "http://placekitten.com/g/200/300"
                            }
                        ])
                })
        })
    });

    it('should have a title', function () {
        expect(browser.getTitle()).toEqual('Engine Front End App');
    });

});