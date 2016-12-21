#Angular - agreemount.engine frontend integration

Front-end integration framework for agreemount.engine backend

Installing:

```
bower install angular-engine
```

Docs: <!--[http://link_to_docs]--> (TODO)

##Usage

See docs: (TODO)
<!-- [http://link_to_docs/public]-->

##Development

Plase make sure that key, cert pair is generated for the sake of development: 
(If you plan to develop using self hosted files)
```
npm run-script ssl
```


In order to run the application locally type following: 
```
npm start
```

##Testing

See docs: <!--[http://link_to_docs/developer]--> (TODO)

Testing requires running agreemount.engine backend with the appropriate
version that tested angular-engine version supports. Everything needed
to start is located in `/tests/e2e`

##Documentation

To build documentation execute (from the top repository level):
``` 
docs/build/build.sh
```
Result of the script is documentation for all angular-engine versions
created in `buid/` directory in respective dirs mirroring versions of
angular-engine package