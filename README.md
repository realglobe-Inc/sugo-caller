 <img src="assets/images/sugo-caller-banner.png" alt="Title Banner"
                    height="148"
                    style="height:148px"
/>


<!---
This file is generated by ape-tmpl. Do not update manually.
--->

<!-- Badge Start -->
<a name="badges"></a>

[![Build Status][bd_travis_shield_url]][bd_travis_url]
[![npm Version][bd_npm_shield_url]][bd_npm_url]
[![JS Standard][bd_standard_shield_url]][bd_standard_url]

[bd_repo_url]: https://github.com/realglobe-Inc/sugo-caller
[bd_travis_url]: http://travis-ci.org/realglobe-Inc/sugo-caller
[bd_travis_shield_url]: http://img.shields.io/travis/realglobe-Inc/sugo-caller.svg?style=flat
[bd_travis_com_url]: http://travis-ci.com/realglobe-Inc/sugo-caller
[bd_travis_com_shield_url]: https://api.travis-ci.com/realglobe-Inc/sugo-caller.svg?token=
[bd_license_url]: https://github.com/realglobe-Inc/sugo-caller/blob/master/LICENSE
[bd_codeclimate_url]: http://codeclimate.com/github/realglobe-Inc/sugo-caller
[bd_codeclimate_shield_url]: http://img.shields.io/codeclimate/github/realglobe-Inc/sugo-caller.svg?style=flat
[bd_codeclimate_coverage_shield_url]: http://img.shields.io/codeclimate/coverage/github/realglobe-Inc/sugo-caller.svg?style=flat
[bd_gemnasium_url]: https://gemnasium.com/realglobe-Inc/sugo-caller
[bd_gemnasium_shield_url]: https://gemnasium.com/realglobe-Inc/sugo-caller.svg
[bd_npm_url]: http://www.npmjs.org/package/sugo-caller
[bd_npm_shield_url]: http://img.shields.io/npm/v/sugo-caller.svg?style=flat
[bd_standard_url]: http://standardjs.com/
[bd_standard_shield_url]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg

<!-- Badge End -->


<!-- Description Start -->
<a name="description"></a>

Caller component of SUGOS.

<!-- Description End -->


<!-- Overview Start -->
<a name="overview"></a>


SUGO-Caller works as a client of [SUGO-Hub][s_u_g_o_hub_url] and provides accessors for remote [SUGO-Actor][s_u_g_o_actor_url] .
 

<!-- Overview End -->


<!-- Sections Start -->
<a name="sections"></a>

<!-- Section from "doc/guides/00.TOC.md.hbs" Start -->

<a name="section-doc-guides-00-t-o-c-md"></a>

Table of Contents
----------------

- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Tips](#tips)
  * [Restricting Connecting Modules](#restricting-connecting-modules)
  * [Describing a Module](#describing-a-module)
  * [Use auth](#use-auth)
- [License](#license)
- [Links](#links)


<!-- Section from "doc/guides/00.TOC.md.hbs" End -->

<!-- Section from "doc/guides/10.Requirements.md.hbs" Start -->

<a name="section-doc-guides-10-requirements-md"></a>

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

+ [Node.js ( >=7.6 )][node_download_url]
+ [npm ( >=4 )][npm_url]

[node_download_url]: https://nodejs.org/en/download/
[npm_url]: https://docs.npmjs.com/


<!-- Section from "doc/guides/10.Requirements.md.hbs" End -->

<!-- Section from "doc/guides/21.Installation.md.hbs" Start -->

<a name="section-doc-guides-21-installation-md"></a>

Installation
-----

```bash
$ npm install sugo-caller --save
```


<!-- Section from "doc/guides/21.Installation.md.hbs" End -->

<!-- Section from "doc/guides/22.Usage.md.hbs" Start -->

<a name="section-doc-guides-22-usage-md"></a>

Usage
---------

Create a caller instance with [SUGO-Hub][sugo_hub_url] url and connect to an [SUGO-Actor][sugo_actor_url] with key.

```javascript
#!/usr/bin/env node

/**
 * This is an example to use caller to connect remote actor
 */
'use strict'

const sugoCaller = require('sugo-caller')

const TARGET_ACTOR_ID = 'my-actor-01'

async function tryExample () {
  let caller = sugoCaller({
    protocol: 'https',
    hostname: 'my-sugo-hub.example.com'
  })

// Connect to the target actor
  let actor = await caller.connect(TARGET_ACTOR_ID)
  let shell = actor.get('shell') // Get bash interface

  // Trigger ls command on remote actor
  {
    let lsResult = await shell.exec('ls -la /opt/shared')
    console.log(lsResult)
  }

  // Pipe std out
  {
    let out = (chunk) => process.stdout.write(chunk)
    shell.on('stdout', out)
    await shell.spawn('tail -f /var/log/app.log') // Trigger tailing without blocking
    await new Promise((resolve) => setTimeout(() => resolve(), 3000)) // Block for duration
    shell.off('stdout', out)
  }

  // Exec reboot command
  await shell.exec('reboot')
}

tryExample().catch((err) => console.error(err))


```

For more detail, see [API Guide](./doc/api/api.md)

<!-- Section from "doc/guides/22.Usage.md.hbs" End -->

<!-- Section from "doc/guides/23.Tips.md.hbs" Start -->

<a name="section-doc-guides-23-tips-md"></a>

Tips
---------

### Restricting Connecting Modules

Sometime you would like to make sure that the connecting actor has right modules as expected.

You can pass a JSON-Schema to `expect` option when accessing a modules.
If the modules does not conform to the schema, it throws an error.

```javascript
#!/usr/bin/env node

/**
 * This is an example to restrict a module with json schema
 */
'use strict'

const sugoCaller = require('sugo-caller')

// JSON-Schema for expected spec info
const shellSchemaV2 = {
  type: 'object',
  properties: {
    name: { enum: [ 'shell' ] }, // Should be shell
    version: { pattern: '^2\.' } // Major version must be 2
    /* ... */
  }
}

async function tryRestrictExample () {
  let caller = sugoCaller({ /* ... */ })
  let actor = await caller.connect('my-actor-01')

  let shell
  try {
    shell = actor.get('shell', {
      // Pass a JSON-Schema to validate the module. Throws an error if invalid
      expect: shellSchemaV2
    })
  } catch (err) {
    console.error('Failed to access!!')
  }
  /* ... */
}

tryRestrictExample().catch((err) => console.error(err))


```


### Describing a Module

You can get module spec data via `.describe(moduleName)` of actor connection.

```javascript
#!/usr/bin/env node

/**
 * This is an example to describe a module
 */
'use strict'

const sugoCaller = require('sugo-caller')

async function tryDescribeExample () {
  let caller = sugoCaller({ /* ... */ })
  let actor = await caller.connect('my-actor-01')

  {
    let description = actor.describe('shell')
    console.log(description) // -> { name: 'shell', desc: 'Shell interface', ... }
  }

  /* ... */
}

tryDescribeExample().catch((err) => console.error(err))


```

### Use auth

You can pass auth config to SUGO-Hub by setting `auth` field on the constructor.

```javascript
#!/usr/bin/env node

/**
 * This is an example to use an auth
 * @see https://github.com/realglobe-Inc/sugo-hub#use-authentication
 */
'use strict'

const sugoCaller = require('sugo-caller')

async function tryAutyExample () {
  let caller = sugoCaller({
    protocol: 'https',
    hostname: 'my-sugo-hub.example.com',
    // Auth for hub
    auth: {
      // The structure of this field depends on `authenticate` logic implemented on SUGO-Hub
      token: 'a!09jkl3A'
    }
  })

// Connect to the target actor
  let actor = await caller.connect('my-actor-01')
  let shell = actor.get('shell') // Get bash interface
  /* ... */
}

tryAutyExample().catch((err) => console.error(err))


```


<!-- Section from "doc/guides/23.Tips.md.hbs" End -->


<!-- Sections Start -->


<!-- LICENSE Start -->
<a name="license"></a>

License
-------
This software is released under the [Apache-2.0 License](https://github.com/realglobe-Inc/sugo-caller/blob/master/LICENSE).

<!-- LICENSE End -->


<!-- Links Start -->
<a name="links"></a>

Links
------

+ [SUGO-Hub][s_u_g_o_hub_url]
+ [SUGO-Actor][s_u_g_o_actor_url]
+ [SUGOS][sugos_url]
+ [Realglobe, Inc.][realglobe,_inc__url]

[s_u_g_o_hub_url]: https://github.com/realglobe-Inc/sugo-hub
[s_u_g_o_actor_url]: https://github.com/realglobe-Inc/sugo-actor
[sugos_url]: https://github.com/realglobe-Inc/sugos
[realglobe,_inc__url]: http://realglobe.jp

<!-- Links End -->
