/*
 * angular-here-address-autocomplete
 *
 * Copyright (c) 2015 QNX Software Systems Limited
 * Licensed under the MIT license.
 * https://github.com/DotLinker/angular-here-address-autocomplete/blob/master/LICENSE
 */

 'use strict';

angular.module('here.geocoding', [])
	/**
	 * DI wrapper around HERE geocoding API.
	 *
	 * Note: requires the HERE Maps API to already be loaded on the page.
	 */
	.factory('hereGeoApi', ['$window', function ($window) {
        if (!$window.H) throw 'Global `H` var missing. Did you forget to include the HERE service script?';

		return new $window.H.service.Platform({
            'app_id': 'LZtAqK01VbCDbo0oAPbB',
            'app_code': 'oUpcwnGYMvi35h1bXrs4hg'
        });
	}])

	/**
	 * Autocomplete directive. Use like this:
	 *
	 * <input type="text" h-address-autocomplete ng-model="myScopeVar" />
	 */
	.directive('hAddressAutocomplete',
        [ '$parse', '$compile', '$timeout', '$document', 'hereGeoApi',
        function ($parse, $compile, $timeout, $document, platform) {

            return {
                restrict: 'A',
                require: '^ngModel',
                scope: {
                    model: '=ngModel',
                    options: '=?',
                    forceSelection: '=?',
                    customPlaces: '=?'
                },
                controller: ['$scope', function ($scope) {}],
                link: function ($scope, element, attrs, controller) {
                    var keymap = {
                            tab: 9,
                            enter: 13,
                            esc: 27,
                            up: 38,
                            down: 40
                        },
                        hotkeys = [keymap.tab, keymap.enter, keymap.esc, keymap.up, keymap.down],
                        autocompleteService = platform.getGeocodingService();

                    (function init() {
                        $scope.query = '';
                        $scope.predictions = [];
                        $scope.input = element;
                        $scope.options = $scope.options || {};

                        initAutocompleteDrawer();
                        initEvents();
                        initNgModelController();
                    }());

                    function initEvents() {
                        element.bind('keydown', onKeydown);
                        element.bind('blur', onBlur);
                        element.bind('submit', onBlur);

                        $scope.$watch('selected', select);
                    }

                    function initAutocompleteDrawer() {
                        // Drawer element used to display predictions
                        var drawerElement = angular.element('<div h-address-autocomplete-drawer></div>'),
                            body = angular.element($document[0].body),
                            $drawer;

                        drawerElement.attr({
                            input: 'input',
                            query: 'query',
                            predictions: 'predictions',
                            active: 'active',
                            selected: 'selected'
                        });

                        $drawer = $compile(drawerElement)($scope);
                        body.append($drawer);  // Append to DOM
                    }

                    function initNgModelController() {
                        controller.$parsers.push(parse);
                        controller.$formatters.push(format);
                        controller.$render = render;
                    }

                    function onKeydown(event) {
                        if ($scope.predictions.length === 0 || indexOf(hotkeys, event.which) === -1) {
                            return;
                        }

                        event.preventDefault();

                        if (event.which === keymap.down) {
                            $scope.active = ($scope.active + 1) % $scope.predictions.length;
                            $scope.$digest();
                        } else if (event.which === keymap.up) {
                            $scope.active = ($scope.active ? $scope.active : $scope.predictions.length) - 1;
                            $scope.$digest();
                        } else if (event.which === 13 || event.which === 9) {
                            if ($scope.forceSelection) {
                                $scope.active = ($scope.active === -1) ? 0 : $scope.active;
                            }

                            $scope.$apply(function () {
                                $scope.selected = $scope.active;

                                if ($scope.selected === -1) {
                                    clearPredictions();
                                }
                            });
                        } else if (event.which === 27) {
                            $scope.$apply(function () {
                                event.stopPropagation();
                                clearPredictions();
                            })
                        }
                    }

                    function onBlur(event) {
                        if ($scope.predictions.length === 0) {
                            return;
                        }

                        if ($scope.forceSelection) {
                            $scope.selected = ($scope.selected === -1) ? 0 : $scope.selected;
                        }

                        $scope.$digest();

                        $scope.$apply(function () {
                            if ($scope.selected === -1) {
                                clearPredictions();
                            }
                        });
                    }

                    function select() {
                        var prediction;

                        prediction = $scope.predictions[$scope.selected];
                        if (!prediction) return;

                        if (prediction.is_custom) {
                            $timeout(function() {
                                $scope.$apply(function () {
                                    $scope.model = prediction.place;
                                    $scope.$emit('h-address-autocomplete:select', prediction.place);
                                    $timeout(function () {
                                        controller.$viewChangeListeners.forEach(function (fn) {fn()});
                                    });
                                });
                            });
                        } else {
                            $timeout(function() {
                                $scope.$apply(function () {
                                    $scope.model = prediction.Location;
                                    $scope.$emit('h-address-autocomplete:select', prediction.Location);
                                    $timeout(function () {
                                        controller.$viewChangeListeners.forEach(function (fn) {fn()});
                                    });
                                });
                            });
                        }

                        clearPredictions();
                    }

                    function parse(viewValue) {
                        var request;

                        if (!(viewValue && isString(viewValue))) return viewValue;

                        $scope.query = viewValue;

                        request = angular.extend({ input: viewValue }, $scope.options);
                        var geocodingParams = {
                            searchText: request.input
                        };
                        autocompleteService.geocode(geocodingParams, function (result) {
                            $scope.$apply(function () {
                                var customPlacePredictions;

                                clearPredictions();

                                if ($scope.customPlaces) {
                                    customPlacePredictions = getCustomPlacePredictions($scope.query);
                                    $scope.predictions.push.apply($scope.predictions, customPlacePredictions);
                                }

                                if (result.Response.View && result.Response.View[0]) {
                                    $scope.predictions.push.apply($scope.predictions, result.Response.View[0].Result);
                                }

                                if ($scope.predictions.length > 5) {
                                    $scope.predictions.length = 5;  // trim predictions down to size
                                }
                            });
                        }, function(e) { throw e; });

                        if ($scope.forceSelection) {
                            return controller.$modelValue;
                        } else {
                            return viewValue;
                        }
                    }

                    function format(modelValue) {
                        var viewValue = "";

                        if (isString(modelValue)) {
                            viewValue = modelValue;
                        } else if (isObject(modelValue)) {
                            viewValue = modelValue.formatted_address;
                        }

                        return viewValue;
                    }

                    function render() {
                        return element.val(controller.$viewValue);
                    }

                    function clearPredictions() {
                        $scope.active = -1;
                        $scope.selected = -1;
                        $scope.predictions = [];
                    }

                    function getCustomPlacePredictions(query) {
                        var predictions = [],
                            place, match, i;

                        for (i = 0; i < $scope.customPlaces.length; i++) {
                            place = $scope.customPlaces[i];

                            match = getCustomPlaceMatches(query, place);
                            if (match.matched_substrings.length > 0) {
                                predictions.push({
                                    is_custom: true,
                                    custom_prediction_label: place.custom_prediction_label || '(Custom Non-HERE Result)',
                                    description: place.formatted_address,
                                    place: place,
                                    matched_substrings: match.matched_substrings,
                                    terms: match.terms
                                });
                            }
                        }

                        return predictions;
                    }

                    function getCustomPlaceMatches(query, place) {
                        var q = query + '',  // make a copy so we don't interfere with subsequent matches
                            terms = [],
                            matched_substrings = [],
                            fragment,
                            termFragments,
                            i;

                        termFragments = place.formatted_address.split(',');
                        for (i = 0; i < termFragments.length; i++) {
                            fragment = termFragments[i].trim();

                            if (q.length > 0) {
                                if (fragment.length >= q.length) {
                                    if (startsWith(fragment, q)) {
                                        matched_substrings.push({ length: q.length, offset: i });
                                    }
                                    q = '';  // no more matching to do
                                } else {
                                    if (startsWith(q, fragment)) {
                                        matched_substrings.push({ length: fragment.length, offset: i });
                                        q = q.replace(fragment, '').trim();
                                    } else {
                                        q = '';  // no more matching to do
                                    }
                                }
                            }

                            terms.push({
                                value: fragment,
                                offset: place.formatted_address.indexOf(fragment)
                            });
                        }

                        return {
                            matched_substrings: matched_substrings,
                            terms: terms
                        };
                    }

                    function isString(val) {
                        return Object.prototype.toString.call(val) == '[object String]';
                    }

                    function isObject(val) {
                        return Object.prototype.toString.call(val) == '[object Object]';
                    }

                    function indexOf(array, item) {
                        var i, length;

                        if (array == null) return -1;

                        length = array.length;
                        for (i = 0; i < length; i++) {
                            if (array[i] === item) return i;
                        }
                        return -1;
                    }

                    function startsWith(string1, string2) {
                        return toLower(string1).lastIndexOf(toLower(string2), 0) === 0;
                    }

                    function toLower(string) {
                        return (string == null) ? "" : string.toLowerCase();
                    }
                }
            }
        }
    ])


    .directive('hAddressAutocompleteDrawer', ['$window', '$document', function ($window, $document) {
        var TEMPLATE = [
            '<div class="pac-container" ng-if="isOpen()" ng-style="{bottom: position.bottom+\'px\', left: position.left+\'px\', width: position.width+\'px\'}" style="display: block;" role="listbox" aria-hidden="{{!isOpen()}}">',
            '  <div class="pac-item" h-address-autocomplete-prediction index="$index" prediction="prediction" query="query"',
            '       ng-repeat="prediction in predictions track by $index" ng-class="{\'pac-item-selected\': isActive($index) }"',
            '       ng-mouseenter="selectActive($index)" ng-click="selectPrediction($index)" role="option" id="{{prediction.id}}">',
            '  </div>',
            '</div>'
        ];

        return {
            restrict: 'A',
            scope:{
                input: '=',
                query: '=',
                predictions: '=',
                active: '=',
                selected: '='
            },
            template: TEMPLATE.join(''),
            link: function ($scope, element) {
                element.bind('mousedown', function (event) {
                    event.preventDefault();  // prevent blur event from firing when clicking selection
                });

                $window.onresize = function () {
                    $scope.$apply(function () {
                        $scope.position = getDrawerPosition($scope.input);
                    });
                }

                $scope.isOpen = function () {
                    return $scope.predictions.length > 0;
                };

                $scope.isActive = function (index) {
                    return $scope.active === index;
                };

                $scope.selectActive = function (index) {
                    $scope.active = index;
                };

                $scope.selectPrediction = function (index) {
                    $scope.selected = index;
                };

                $scope.$watch('predictions', function () {
                    $scope.position = getDrawerPosition($scope.input);
                }, true);

                function getDrawerPosition(element) {
                    var domEl = element[0],
                        rect = domEl.getBoundingClientRect(),
                        docEl = $document[0].documentElement,
                        body = $document[0].body,
                        bodyHeight = $document[0].body.getBoundingClientRect().height,
                        scrollTop = $window.pageYOffset || docEl.scrollTop || body.scrollTop,
                        scrollLeft = $window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

                    return {
                        width: rect.width,
                        height: rect.height,
                        bottom: bodyHeight - (rect.top + scrollTop),
                        left: rect.left + scrollLeft
                    };
                }
            }
        }
    }])

    .directive('hAddressAutocompletePrediction', [function () {
        var TEMPLATE = [
            '<span class="pac-icon pac-icon-marker"></span>',
            '<span class="pac-item-query" ng-bind-html="prediction | highlightMatched"></span>',
            '<span ng-repeat="term in prediction.terms | unmatchedTermsOnly:prediction">{{term.value | trailingComma:!$last}}&nbsp;</span>',
            '<span class="custom-prediction-label" ng-if="prediction.is_custom">&nbsp;{{prediction.custom_prediction_label}}</span>'
        ];

        return {
            restrict: 'A',
            scope:{
                index:'=',
                prediction:'=',
                query:'='
            },
            template: TEMPLATE.join('')
        }
    }])

    .filter('highlightMatched', ['$sce', function ($sce) {
        return function (prediction) {
            /*var matchedPortion = '',
                unmatchedPortion = '',
                matched;

            if (prediction.matched_substrings.length > 0 && prediction.terms.length > 0) {
                matched = prediction.matched_substrings[0];
                matchedPortion = prediction.terms[0].value.substr(matched.offset, matched.length);
                unmatchedPortion = prediction.terms[0].value.substr(matched.offset + matched.length);
            }

            return $sce.trustAsHtml('<span class="pac-matched">' + matchedPortion + '</span>' + unmatchedPortion);*/
            return $sce.trustAsHtml(prediction.Location.Address.Label);
        }
    }])

    .filter('unmatchedTermsOnly', [function () {
        return function (terms, prediction) {
            var i, term, filtered = [];

            if (terms) {
                for (i = 0; i < terms.length; i++) {
                    term = terms[i];
                    if (prediction.matched_substrings.length > 0 && term.offset > prediction.matched_substrings[0].length) {
                        filtered.push(term);
                    }
                }
            }

            return filtered;
        }
    }])

    .filter('trailingComma', [function () {
        return function (input, condition) {
            return (condition) ? input + ',' : input;
        }
    }]);


