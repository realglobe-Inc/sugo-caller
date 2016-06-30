 <img src="assets/images/sugo-terminal-banner.png" alt="Title Banner"
                    height="148"
                    style="height:148px"
/>


<!---
This file is generated by ape-tmpl. Do not update manually.
--->

<!-- Badge Start -->
<a name="badges"></a>

[![Build Status][bd_travis_com_shield_url]][bd_travis_com_url]
[![npm Version][bd_npm_shield_url]][bd_npm_url]
[![JS Standard][bd_standard_shield_url]][bd_standard_url]

[bd_repo_url]: https://github.com/realglobe-Inc/sugo-terminal
[bd_travis_url]: http://travis-ci.org/realglobe-Inc/sugo-terminal
[bd_travis_shield_url]: http://img.shields.io/travis/realglobe-Inc/sugo-terminal.svg?style=flat
[bd_travis_com_url]: http://travis-ci.com/realglobe-Inc/sugo-terminal
[bd_travis_com_shield_url]: https://api.travis-ci.com/realglobe-Inc/sugo-terminal.svg?token=aeFzCpBZebyaRijpCFmm
[bd_license_url]: https://github.com/realglobe-Inc/sugo-terminal/blob/master/LICENSE
[bd_codeclimate_url]: http://codeclimate.com/github/realglobe-Inc/sugo-terminal
[bd_codeclimate_shield_url]: http://img.shields.io/codeclimate/github/realglobe-Inc/sugo-terminal.svg?style=flat
[bd_codeclimate_coverage_shield_url]: http://img.shields.io/codeclimate/coverage/github/realglobe-Inc/sugo-terminal.svg?style=flat
[bd_gemnasium_url]: https://gemnasium.com/realglobe-Inc/sugo-terminal
[bd_gemnasium_shield_url]: https://gemnasium.com/realglobe-Inc/sugo-terminal.svg
[bd_npm_url]: http://www.npmjs.org/package/sugo-terminal
[bd_npm_shield_url]: http://img.shields.io/npm/v/sugo-terminal.svg?style=flat
[bd_standard_url]: http://standardjs.com/
[bd_standard_shield_url]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg

<!-- Badge End -->


<!-- Description Start -->
<a name="description"></a>

Terminal to access remote spot

<!-- Description End -->


<!-- Overview Start -->
<a name="overview"></a>


SUGO-Terminal works a client of [SUGO-Cloud][sugo_cloud_url] and provides access on to remote spot interface as JavaScript functions.
 

<!-- Overview End -->


<!-- Sections Start -->
<a name="sections"></a>

<!-- Section from "doc/guides/00.Requirements.md.hbs" Start -->

<a name="section-doc-guides-00-requirements-md"></a>
Requirements
-----

<a href="https://nodejs.org">
  <img src="assets/images/nodejs-banner.png"
       alt="banner"
       height="40"
       style="height:40px"
  /></a>
<a href="https://docs.npmjs.com/">
  <img src="assets/images/npm-banner.png"
       alt="banner"
       height="40"
       style="height:40px"
  /></a>

+ [Node.js ( >=6.x )][node_download_url]
+ [npm ( >=3.x )][npm_url]

[node_download_url]: https://nodejs.org/en/download/
[npm_url]: https://docs.npmjs.com/


<!-- Section from "doc/guides/00.Requirements.md.hbs" End -->

<!-- Section from "doc/guides/01.Installation.md.hbs" Start -->

<a name="section-doc-guides-01-installation-md"></a>
Installation
-----

```bash
$ npm install sugo-terminal --save
```


<!-- Section from "doc/guides/01.Installation.md.hbs" End -->

<!-- Section from "doc/guides/02.Usage.md.hbs" Start -->

<a name="section-doc-guides-02-usage-md"></a>
Usage
---------

```javascript
#!/usr/bin/env node

/**
 * This is an example to use terminal to connect remote spot
 */
'use strict'

const co = require('co')
const sugoTerminal = require('sugo-terminal')

const CLOUD_URL = 'my-sugo-cloud.example.com/terminals'
const TARGET_SPOT_ID = 'my-spot-01'

co(function * () {
  let terminal = sugoTerminal(CLOUD_URL, {})

// Connect to the target spot
  let spot = yield terminal.connect(TARGET_SPOT_ID)
  let shell = spot.shell() // Get bash interface

  // Trigger ls command on remote spot
  {
    let lsResult = yield shell.exec('ls -la /opt/shared')
    console.log(lsResult)
  }

  // Pipe std out
  {
    let out = (chunk) => process.stdout.write(chunk)
    shell.on('stdout', out)
    yield shell.spawn('tail -f /var/log/app.log') // Trigger tailing without blocking
    yield new Promise((resolve) => setTimeout(() => resolve(), 3000)) // Block for duration
    shell.off('stdout', out)
  }

  // Run reboot command
  yield shell.exec('reboot')
}).catch((err) => console.error(err))


```


<!-- Section from "doc/guides/02.Usage.md.hbs" End -->


<!-- Sections Start -->


<!-- LICENSE Start -->
<a name="license"></a>

License
-------
This software is released under the [Apache-2.0 License](https://github.com/realglobe-Inc/sugo-terminal/blob/master/LICENSE).

<!-- LICENSE End -->


<!-- Links Start -->
<a name="links"></a>

Links
------

+ [sugos][sugos_url]
+ [sugo-cloud][sugo_cloud_url]
+ [sugo-spot][sugo_spot_url]

[sugos_url]: https://github.com/realglobe-Inc/sugos
[sugo_cloud_url]: https://github.com/realglobe-Inc/sugo-cloud
[sugo_spot_url]: https://github.com/realglobe-Inc/sugo-spot

<!-- Links End -->
