#Angular - agreemount.engine frontend integration

Front-end integration framework for agreemount.engine backend

Installing:

```
bower install angular-engine
```

##Documentation: 

Autogenerated documentation for each version is available here (you need to be connected to the VPN):
http://docker-fid.grid.cyf-kr.edu.pl:8899/


##Usage

See docs: (TODO)
<!-- [http://link_to_docs/public]-->

##Development

### Requirements<a id="requirements" name="requirements"></a>

Make sure that following packages / dependencies are satisfied before starting
development.

* nodejs (>=6.x)
* npm

Npm packages required in global scope (npm install -g):

* bower
* brunch

### Developing

Either ensure that `brunch watch` (or `brunch watch --server` if you also want to host angular-engine.js locally)
is called and actively watches file changes, or
don't forget calling `brunch build` after making changes and before commiting.

Brunch is also responsible for compiling documentation, so you can also see changes
to documentation online.

### Local HTTPS hosting

For convenience a couple of npm scripts has been added to streamline local development
for other locally deployed applications (especially those hosted by JAVA over HTTPS, 
as they refuse to pull other local resources if they are not served over HTTPS)

Make sure that key, cert pair is generated for the sake of development: 
(If you plan to develop using self hosted files)

```
npm run-script ssl
```


In order to run the application locally type following (on the https server): 
```
npm start
```
If you run `brunch watch --server` above command is not required, as it is
implicitly called by brunch.

##Testing

See docs: <!--[http://link_to_docs/developer]--> (TODO)

Testing requires running agreemount.engine backend with the appropriate
version that tested angular-engine version supports. Everything needed
to start is located in `/tests/e2e`

##Documentation

To build all documentation via build.sh script apart from standard [development requirement](#requirements) you need to ensure that your **git version is >= 2.0**

To build documentation execute (from the top repository level):
``` 
docs/build/build.sh
```
Result of the script is documentation for all angular-engine versions
created in `buid/` directory in respective dirs mirroring versions of
angular-engine package


##Changelog

* **0.7.1** (hotfix) Fixed bug with actions loading for subdocuments

* **0.7.0** Fixed bug with document's link fields in list where they would execute ng-click event AND href in some cases 
 (LINK ACTIONS)
 Fixed bug with redirects with actions from document lists.
 Fixed bug with array column type which broke if `array == null`
 **(API BREAK)** API extending list html template needs to use `document_entry.$actions` for action lists. See aproperiate templates.  

* **0.6.93** Link fields in document's list are now proper links with href, so it's possible to open documents
in new tabs.
Fixed problem where clicking steps too fast while document was in `/new` state would create duplicates

* **0.6.92** Fixed problems with multi select (showing validation errors)

* **0.6.91** Actions for the document are now visible only if document has been saved and is unmodified.
Fixed some small bugs with prompts before leaving edited document.

* **0.6.90** Added handling of `dirty` state for the document, now whether document is saved is
displayed on the side panel, and if user tries to navigate away from the document page confirmation window will
appear.

* **0.6.89** Removed console logs in production by default, they still can be turned on in the
application via $engLogProvider.setLogLevel()

* **0.6.88** Added waiting indicator on categories when additional metrics are loaded (reloaded).
 During loading time user can not input new data.

* **0.6.87** Changed all actions button to newly designed components, now double 
clicking executing action should not be possible anymore.
Additionall features:
    * Validation button not showing if document is not editable
    * Multiselects fixes (now disable works, also some other minor fixes)
    * Fixes to LINK metric

* **0.6.86** Created two types of build (production & development) - for production
a couple of optimizations has been introduced which should decrease lag and increase
responsiveness of the application.

* **0.6.83** Added basic custom style to angular engine. It overrides bootstrap styles,
so in deployment bootstrap.css should be placed before angular-engine.css