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

* **0.6.86** Created two types of build (production & development) - for production
a couple of optimizations has been introduced which should decrease lag and increase
responsiveness of the application.

* **0.6.83** Added basic custom style to angular engine. It overrides bootstrap styles,
so in deployment bootstrap.css should be placed before angular-engine.css