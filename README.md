angular-here-address-autocomplete
================

Angular directive for the HERE Geocoding Autocomplete component.

Installation
------------

Install via bower: `bower install angular-here-address-autocomplete`

Or if you're old skool, copy `src/autocomplete.js` into your project.

Then add the script to your page (be sure to include the HERE API as well):

```html
<script src="http://js.api.here.com/v3/3.0/mapsjs-core.js"></script>
<script src="http://js.api.here.com/v3/3.0/mapsjs-service.js"></script>
<script src="/bower_components/angular-here-address-autocomplete/src/autocomplete.js"></script>
```

You'll probably also want the styles:

```html
<link rel="stylesheet" href="/bower_components/angular-here-address-autocomplete/src/autocomplete.css">
```

Usage
-----

First add the dependency to your app:

```javascript
angular.module('myApp', ['here.geocoding']);
```

Then you can use the directive on text inputs like so:

```html
<input type="text" h-address-autocomplete ng-model="myScopeVar" />
```

The directive also supports the following _optional_ attributes:

* forceSelection &mdash; forces the user to select from the dropdown. Defaults to `false`.\

Issues or feature requests
--------------------------

Create a ticket [here](https://github.com/DotLinker/angular-here-address-autocomplete/issues)

Contributing
------------

Issue a pull request including any relevant testing and updated any documentation if required.
