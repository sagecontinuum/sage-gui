# Changelog

The following are some notable changes to the UI


## [2.5.0](https://github.com/sagecontinuum/sage-gui/compare/v2.4.0...v2.5.0) (2023-08-22)


### ⚠ BREAKING CHANGES

* change admin /status url to /nodes
* /node/<node_id> URLs will result in error page unless a valid VSN is provided instead

### Features

* add live and static gps columns to node lists ([147db45](https://github.com/sagecontinuum/sage-gui/commit/147db4599861f421ede3c6d1f14cd1b8ac59c4eb))
* add node phase tabs and url routing for use as needed in admin/portal ui; change admin /status url to /nodes; some cleanup ([4c1e3eb](https://github.com/sagecontinuum/sage-gui/commit/4c1e3eb2fbd9924e6031ae76821cf0676543eed1))
* add phase counts ([2a66915](https://github.com/sagecontinuum/sage-gui/commit/2a6691577c5ec0b01ea1ed8e3d025e6f9af33ac9))
* **admin:** add time series charts per metric ([e932d20](https://github.com/sagecontinuum/sage-gui/commit/e932d20ce6a87d9fa6c8bada88a4041b3401c271))
* **admin:** support health/sanity test filtering accross nodes (officially); related enhancements/optimizations ([0d2faa1](https://github.com/sagecontinuum/sage-gui/commit/0d2faa1ac22f35472f64dc63a2a0e333a8743124))
* **data:** deletable filter chips in query summary ([e6800a9](https://github.com/sagecontinuum/sage-gui/commit/e6800a9dd1249fdf8a9632ed6ed39d65b656caf2))
* drop legacy sensor sources; update sensor lists to use manifest ([12fc74f](https://github.com/sagecontinuum/sage-gui/commit/12fc74fa8850889e2d0873533424cff84e64837f))
* **jobs:** add job error message dialog; minor enhancements ([304ec71](https://github.com/sagecontinuum/sage-gui/commit/304ec71a3411a734ae518044040cf7328a632d37))
* **portal:** add status tooltip to node list ([2baac46](https://github.com/sagecontinuum/sage-gui/commit/2baac4663f9c2deebdba1bd281abce85aef7370f))
* refactor/consolidate node view for admin/portal/project pages ([8b91a27](https://github.com/sagecontinuum/sage-gui/commit/8b91a27cbe9362e41655ef944c7b2ffd08d12ed2))
* update node meta overview to include sensors, computes, and resources ([99358e4](https://github.com/sagecontinuum/sage-gui/commit/99358e46936cd5ecd43dbe0bfdc0f688ea4e1c03))
* use manifest computes in node status (in node listing tables); code refactoring ([fa0cd85](https://github.com/sagecontinuum/sage-gui/commit/fa0cd859c357ab8dbbb2b1882ffb1eb85ab6a19b))


### Bug Fixes

* add admin logo superscript text (and refactor) ([3186b90](https://github.com/sagecontinuum/sage-gui/commit/3186b90a836fd386c6599e3ab2da15aa5edd29dd))
* **admin:** add n/a in node list; remove pass/fail;  add status icon; improved health styling ([1ae9843](https://github.com/sagecontinuum/sage-gui/commit/1ae984322ecea266a6cb4daaa4311985560c93ca))
* **admin:** update factory view to use manifests; refactor ([8d1051c](https://github.com/sagecontinuum/sage-gui/commit/8d1051c0a5e7774873f63e6b5a353f27c900aa91))
* bump node view beehive gps query to -30d; add timestamp to node view; waggle-sensor/tickets[#79](https://github.com/sagecontinuum/sage-gui/issues/79) ([1653bcd](https://github.com/sagecontinuum/sage-gui/commit/1653bcdcf17435ee5332d53194615de5e27f1bd6))
* **data:** always show the data timeline buttons on the node view ([d2b4289](https://github.com/sagecontinuum/sage-gui/commit/d2b428968e1dbf8c21a3e45047913b4a3882040c))
* **data:** drop sage commons in favor of wifire; add sensor list on all UIs; fix node linkage on project UI ([f403053](https://github.com/sagecontinuum/sage-gui/commit/f4030534f7313e20a60615ef2ae4e13ea662d189))
* **data:** fix "Unassigned" filter on data browser; minor state improvements ([27914dc](https://github.com/sagecontinuum/sage-gui/commit/27914dc6b6c7a9e812af471f2a0924e1291dad8b))
* **data:** fix links for locally-ran plugins from timeline to query browser ([64d05fb](https://github.com/sagecontinuum/sage-gui/commit/64d05fb705487cebde1674dc9e27f5c74ccd99c5))
* **data:** fix timeline label layout/positioning issue (and some related cleanup) ([930bd28](https://github.com/sagecontinuum/sage-gui/commit/930bd2834d1509b274413da67a8cc78ad2737be2))
* fix "last updated" column; properly check against manifest computes using the host serial_no ([c239f54](https://github.com/sagecontinuum/sage-gui/commit/c239f5407a0b21037d4065a733d8181d2c31d234))
* fix metone check in sensor previews on node page; (to be generalized later) ([4f6bf6c](https://github.com/sagecontinuum/sage-gui/commit/4f6bf6c5a88e9be2338c8e6c3a8dd191a456121b))
* fix timeline "loading" skeleton effect ([f0bad21](https://github.com/sagecontinuum/sage-gui/commit/f0bad214bc158f1db27bca3cdf1a046695d3b867))
* fix/improve gps icon colors in node lists ([8ac54af](https://github.com/sagecontinuum/sage-gui/commit/8ac54af99d2012882c9ffa83429f6743c66b392a))
* include blades when filtering by sensor; (and rename function in prep for migration) ([2939aa7](https://github.com/sagecontinuum/sage-gui/commit/2939aa7eef1f693e9066b1cd8cd5170c8fcb0853))
* **jobs:** add error message to job action errors; fixes waggle-sensor/tickets[#38](https://github.com/sagecontinuum/sage-gui/issues/38) ([a79282a](https://github.com/sagecontinuum/sage-gui/commit/a79282a48641b03630b584be0fdef142c9677568))
* **jobs:** add missing map tooltip info ([345e038](https://github.com/sagecontinuum/sage-gui/commit/345e038d8b9f8eebb74eb7669302183726e9a27d))
* **jobs:** aggregate on k3s_pod_instance instead of k3s_pod_name (for newer data); some cleanup / type fixing ([8637d41](https://github.com/sagecontinuum/sage-gui/commit/8637d411b7d1830979219668fa2be57a19c06995))
* **projects:** remove extraneous url routing, fixing the sensor list; styling / add logo link ([d30eef7](https://github.com/sagecontinuum/sage-gui/commit/d30eef72bcc66c3bb4ed7bb2f6b855edbeec9636))
* update sensor list source; fix live gps reporting; put gps altitude in separate column ([47a0359](https://github.com/sagecontinuum/sage-gui/commit/47a0359390c2c1d7675df77c447344e4bd0c76a8))
* use manifests for sensor columns in node listings; refactor sensor lists ([56058c3](https://github.com/sagecontinuum/sage-gui/commit/56058c31151b87c9f491c0ab27719bc2f747213c))
* use VSNs for node urls; add node-not-found/suggested link page; some smaller UX enhancements and bug fixes ([d73d509](https://github.com/sagecontinuum/sage-gui/commit/d73d5097dfb3bde12c16f20a426bd0ed55c5da1a))

## [2.4.0](https://github.com/sagecontinuum/sage-gui/compare/v2.3.0...v2.4.0) (2023-02-23)


### Features

* **data:** add multi-node query; SAGE-1568 ([d38c2de](https://github.com/sagecontinuum/sage-gui/commit/d38c2de32600b7a039407fa32cba257017c0eb3f))
* **data:** enable charts on names query; use names based query for "recent data" links; SAGE-1590 ([e8e13ad](https://github.com/sagecontinuum/sage-gui/commit/e8e13ad949f1636dad91949758b4332a133cf731))
* **data:** show last available time (with simple link to query browser); SAGE-1590 ([c062916](https://github.com/sagecontinuum/sage-gui/commit/c0629160c0effe679dce240358c191c164beea2d))
* **jobs:** add aggregation functions to jobs form; refactor/update job related types; SAGE-1583 ([df43464](https://github.com/sagecontinuum/sage-gui/commit/df43464309682065355d4570beaf53161e59d982))
* **jobs:** add cron string input form; update spec utils; update types; SAGE-1583 ([6e6b116](https://github.com/sagecontinuum/sage-gui/commit/6e6b1166a7ac1c5ad6478a3eda79cd1a4994760b))
* **jobs:** add job spec text editing support; SAGE-1583 ([20be6f2](https://github.com/sagecontinuum/sage-gui/commit/20be6f2e0a797a20099e43d237fdefe78acd2376))
* **jobs:** add overwrite job button; also use "review job" button on form; SAGE-1660 ([f00321b](https://github.com/sagecontinuum/sage-gui/commit/f00321baef57d446ff5dcc9abc8086688cfb97ee))
* **jobs:** add resubmit button; minor bugfixes and cleanup; SAGE-1660 ([e93083f](https://github.com/sagecontinuum/sage-gui/commit/e93083f2f0f86551b48694f7e558a621ca022dea))
* **jobs:** add show and download yaml buttons; SAGE-1583 ([9fffb55](https://github.com/sagecontinuum/sage-gui/commit/9fffb5509a01cd1ca47146587f0a4a87d70f3f8d))
* **jobs:** add suspend button (and refactor actions); SAGE-1660 ([96f9844](https://github.com/sagecontinuum/sage-gui/commit/96f984419cb92bba063f70dbac1d8c0e073e942e))
* **jobs:** improvements and refactorings for text editing; add "start with job" options; autocompletion improvements; remove initial validation on the editor view; SAGE-1632; SAGE-1641 ([45f00a1](https://github.com/sagecontinuum/sage-gui/commit/45f00a139606df7222f88377dfb46d01b5f66987))
* **jobs:** job editor refactoring (part 1 of 2); SAGE-1583 ([a1f2a03](https://github.com/sagecontinuum/sage-gui/commit/a1f2a03c96172eaed223a8aa049fd9b48645f12b))
* **jobs:** list plugin params in job details; SAGE-1583 ([9c0ad8f](https://github.com/sagecontinuum/sage-gui/commit/9c0ad8fb6815ca963121cff2f4ef9587f867b3ca))
* **jobs:** prototype publish/set action forms; some cleanup; SAGE-1627 ([22650e4](https://github.com/sagecontinuum/sage-gui/commit/22650e49df499649b8e7f89d3236de8be8416bfe))
* **jobs:** some additional editor snippets; SAGE-1660 ([8313fdd](https://github.com/sagecontinuum/sage-gui/commit/8313fdd6c38fb3893bd8fa77bf70aed863052044))


### Bug Fixes

* **data:** fix error handling in commons request ([6caf8fc](https://github.com/sagecontinuum/sage-gui/commit/6caf8fcdeb0409b57402ad407a94c52b49e62230))
* **data:** fix infinite data searching bug on node pages ([11de004](https://github.com/sagecontinuum/sage-gui/commit/11de004dcb8211cffa2adc42435497b37b88021e))
* **data:** fix infinite data searching bug on node pages ([60a03f8](https://github.com/sagecontinuum/sage-gui/commit/60a03f84485c2d34af9fbc631e53a472a8824a2c))
* **data:** sort query by time for charts as well, fixing the issue when zone meta is not present for all data) ([649c6f1](https://github.com/sagecontinuum/sage-gui/commit/649c6f12addb9f299b5c5394cf8396fd6b658bb2))
* **ecr:** improve build error handling; disable builds if not approved; some minor cleanup ([93b13f4](https://github.com/sagecontinuum/sage-gui/commit/93b13f456b0e62d25ef8e68eb28031a583887c20))
* **jobs:** add note to create-job when signed out ([3ba7692](https://github.com/sagecontinuum/sage-gui/commit/3ba76927ce124abb0bee7054388a2eed85726595))
* **jobs:** don't reregister text editor snippets when changing tabs ([a76699c](https://github.com/sagecontinuum/sage-gui/commit/a76699c1eec6caaac3d294906313c6b598aae1bb))
* **jobs:** fix a couple string quotes in snippets ([0b79ce5](https://github.com/sagecontinuum/sage-gui/commit/0b79ce5f4d22e45cb3206a0949c9040531736483))
* **jobs:** fix bug in editor where all nodes are being listed ([458e5f7](https://github.com/sagecontinuum/sage-gui/commit/458e5f77a6dda68cf4460ac52ce4daf4ecf64dce))
* **jobs:** fix deselection of job in editor ([20bdb3a](https://github.com/sagecontinuum/sage-gui/commit/20bdb3ac3e49e91cd212f5ca44a6eeece8a409e8))
* **jobs:** fix public job count; minor job status/creation design changes; SAGE-1583 ([057fe8c](https://github.com/sagecontinuum/sage-gui/commit/057fe8c0117d854987e510e238356681c77d7ea8))
* **jobs:** fix sorting on times and ids; (temp) fix for listing when nodetags is used; SAGE-1660 ([9a7e487](https://github.com/sagecontinuum/sage-gui/commit/9a7e4879bcd51ed99cd74f0b3f5b7beeadcc3ae3))
* **jobs:** remove unnecessary user field from submitted job spec ([e77dc14](https://github.com/sagecontinuum/sage-gui/commit/e77dc144bad646211f0fa5022c01e0cc9bca1384))
* **jobs:** replace urls for tab routing ([84cd1d8](https://github.com/sagecontinuum/sage-gui/commit/84cd1d8db1d8cb3cdf37e4ec06265f04344b1318))
* **jobs:** rule syntax cleanup; SAGE-1583 ([c3a1a67](https://github.com/sagecontinuum/sage-gui/commit/c3a1a677d4236bcf54aa049788fa99f7baa71bad))
* **jobs:** support plugin name inputs; type/linting fixes; SAGE-1583 ([75275c1](https://github.com/sagecontinuum/sage-gui/commit/75275c13a5274c0b0667c14ddca8e31c71f37849))
* **portal:** improve IP regex in timeline data parsing ([143c401](https://github.com/sagecontinuum/sage-gui/commit/143c4016be8ef67e9aa97f79568dacbc8780c335))

## [2.3.0](https://github.com/sagecontinuum/sage-gui/compare/v2.2.0...v2.3.0) (2022-12-15)


### ⚠ BREAKING CHANGES

* refactor account view; add tabs; this breaks the existing user profile/devices urls
* rename urls /job-status/* to /jobs/*
* change /data-browser url to /query-browser

### Features

* **accounts:** add developer account tab and refactor (somewhat WIP); SAGE-1584 ([86e37c6](https://github.com/sagecontinuum/sage-gui/commit/86e37c60b6185aa5c5a420f39db6d16dd7695c08))
* add app data timeline component; WIP; SAGE-1541 ([f3e9817](https://github.com/sagecontinuum/sage-gui/commit/f3e98176a26fe31f3a3112c71501fa33bb866924))
* add some last n days buttons to timeline; minor typo fix ([cd6eed1](https://github.com/sagecontinuum/sage-gui/commit/cd6eed1c7a87c4f6a86ec6f61ea1f9126d8b3cc0))
* **admin:** add node bucket filter ([38083e4](https://github.com/sagecontinuum/sage-gui/commit/38083e4623e0f2be376e0a0ed9351221c5a93998))
* change /data-browser url to /query-browser ([caaea1c](https://github.com/sagecontinuum/sage-gui/commit/caaea1ca7bd0dde3cea5f0b083b557dc230c153e))
* **data:** add basic ontology/name based query ([293c688](https://github.com/sagecontinuum/sage-gui/commit/293c6887275c459dd3a18058f35f05f3ab4b3be2))
* **data:** add copy python snippet ([c739f15](https://github.com/sagecontinuum/sage-gui/commit/c739f15199842bfe5ee8db3df2c75a81f39d132f))
* **data:** basic mimetype filter ([4df7b45](https://github.com/sagecontinuum/sage-gui/commit/4df7b453ae2013a471b4f651c43aa92b4788dd2d))
* **data:** some special image/audio filtering ([602a8e3](https://github.com/sagecontinuum/sage-gui/commit/602a8e3b50603a948e5110ffc918b627c0ce93f8))
* **ecr:** add app view tab url params ([4f78b81](https://github.com/sagecontinuum/sage-gui/commit/4f78b81a50e1b12d88305dd699871e7eb1f3b4ba))
* **ecr:** add links to app data tab; SAGE-1541 ([b545d9d](https://github.com/sagecontinuum/sage-gui/commit/b545d9d44026ae89a62151155e5974a4c748ad1f))
* **jobs:** add "my nodes" table; SAGE-1535 ([eec074a](https://github.com/sagecontinuum/sage-gui/commit/eec074a70a93dbd201ea1c0677d975b76cfadb8a))
* **jobs:** add basic job details view (and related minor features) ([2948600](https://github.com/sagecontinuum/sage-gui/commit/2948600ac40bb336bd570eaaa2880e3f9b371fc8))
* **jobs:** add remove job(s); SAGE-1535 ([feb3795](https://github.com/sagecontinuum/sage-gui/commit/feb3795c0c04ef6aa5b523997494b131831a8aa3))
* **jobs:** add state counts/filters; ignore 'removed' by default; SAGE-1583 ([8b79ec0](https://github.com/sagecontinuum/sage-gui/commit/8b79ec08927ed89d866fef37bb8a9e2010f4f17e))
* **jobs:** add submit button, node bucket filtering, yaml spec changes; also update job data typing and some minor fixes; SAGE-1535 ([fc7d15a](https://github.com/sagecontinuum/sage-gui/commit/fc7d15acc54a8bea5ee4b23812dd6e98c2d2a968))
* **jobs:** grey out node if user can't schedule; add schedulable filter; SAGE-1583 ([940a2d2](https://github.com/sagecontinuum/sage-gui/commit/940a2d24607e4b938cc2741357915e3a4e09cdc2))
* **jobs:** some job to app and job to data query linkage ([b744b1a](https://github.com/sagecontinuum/sage-gui/commit/b744b1a16f7c7218848caf1ec56f3ff8516ae8f8))
* **portal:** add node list and sensor pages ([fa32c33](https://github.com/sagecontinuum/sage-gui/commit/fa32c33f5dc378080b06a8838928a8a95d1f6238))
* refactor account view; add tabs; this breaks the existing user profile/devices urls ([d8fe4c0](https://github.com/sagecontinuum/sage-gui/commit/d8fe4c0ba5b8d1a009f2d5b9573345828d44f637))
* revised map component; add tooltip links ([70ffbf1](https://github.com/sagecontinuum/sage-gui/commit/70ffbf175df6aa611cb99330f6d718daf76b646c))
* **sage:** add sensor list view and filtering ([f752558](https://github.com/sagecontinuum/sage-gui/commit/f752558693c444f50245b05dd05b7f7114834752))
* sign-out of all tabs (and optimize/cleanup auth stuff) ([e53a697](https://github.com/sagecontinuum/sage-gui/commit/e53a6970c50ae5c8fe3031dd7884c54e60988ee1))
* **timeline:** render y axis labels with react; SAGE-1541 ([d26584d](https://github.com/sagecontinuum/sage-gui/commit/d26584df91f72683b845a0ec52b19f828fd114c1))


### Bug Fixes

* **accounts:** use node id (for now) ([38238d0](https://github.com/sagecontinuum/sage-gui/commit/38238d0daa996e2e842f22cb6e631120907840ec))
* **data:** fix clear input in query browser(!)'; add map props typing ([1c918b4](https://github.com/sagecontinuum/sage-gui/commit/1c918b42904c13e7f40d06a5e4d2f5815f855135))
* **data:** fix table styling for media, add sort caret, fix pagination, fix match type, etc. ([67f7fa8](https://github.com/sagecontinuum/sage-gui/commit/67f7fa88d0fe4b70ea679b56679253f655f7af13))
* **data:** fix timeline skeleton typo ([9d4c864](https://github.com/sagecontinuum/sage-gui/commit/9d4c864cebd41bf2a80d6c34da0ce2fb8e42bca1))
* **ecr:** add "default" column to input list; enable sort ([5adcdbc](https://github.com/sagecontinuum/sage-gui/commit/5adcdbcdd55f542c7745be39913a7b8173a6aeda))
* **ecr:** fix app not found message ([1548dab](https://github.com/sagecontinuum/sage-gui/commit/1548dab70c0349e67a39faa85f05cb6636362a5c))
* fix options layout in table component ([4a9afed](https://github.com/sagecontinuum/sage-gui/commit/4a9afed87ea8481da931aab66b55364d84f21295))
* **jobs:** add rest of time cols ([50383ed](https://github.com/sagecontinuum/sage-gui/commit/50383ede14d94662b8b2bfd5e84f8bcd418c56e1))
* **jobs:** separate job aggregation logic; some cleanup; SAGE-1535 ([8a0efce](https://github.com/sagecontinuum/sage-gui/commit/8a0efce71f56b165142c87e7ab24508ab171e058))
* only consider .jpg in recent images ([9b51fe8](https://github.com/sagecontinuum/sage-gui/commit/9b51fe8af2348a273dd87d7d397e1ab79488c724))
* parse local dev IP addresses for timeline labels ([b94d75c](https://github.com/sagecontinuum/sage-gui/commit/b94d75c559b568b02889f409d297bafe33ee01ac))
* **reg-api:** various device reg improvements ([e6c2628](https://github.com/sagecontinuum/sage-gui/commit/e6c26285862d0a7d468c88ebb687d11305a0369f))
* rename urls /job-status/* to /jobs/* ([e2a6cc1](https://github.com/sagecontinuum/sage-gui/commit/e2a6cc101ead7c8a1d26b19dda4af3a95bdb7e0f))
* **sage:** add node view cards/styling; bug fixes ([a124816](https://github.com/sagecontinuum/sage-gui/commit/a12481673a5573cb6cc1e9421df33c2ea6086dca))
* **sage:** fix hotspot hover events ([fd6f8d7](https://github.com/sagecontinuum/sage-gui/commit/fd6f8d7f29c6b0eab9c7185eb1f280f9dce154b7))
* **ses:** align timelines; (temp) patch for data linkage ([646fd5e](https://github.com/sagecontinuum/sage-gui/commit/646fd5e6fa9f2c32d5eb2511b73cd202ede8fb56))
* **ses:** slightly better status color differentiation ([b639eb5](https://github.com/sagecontinuum/sage-gui/commit/b639eb5f0c72e7533b3a35f735bdd2f17cd67667))

## [2.2.0](https://github.com/sagecontinuum/sage-gui/compare/v2.1.0...v2.2.0) (2022-09-06)


### Features

* **user-profile:** initial user profile ([e7e5eb5](https://github.com/sagecontinuum/sage-gui/commit/e7e5eb5740f9e2e75639cce93b0b4dcc2e1b998a))


### Bug Fixes

* add ENV authURL in reg-api Dockerfile ([c9fa13f](https://github.com/sagecontinuum/sage-gui/commit/c9fa13fb303aae13d6b0e80c5cab1fbcbd109a98))
* **admin:** consider no recent metrics "offline" ([1b6eb85](https://github.com/sagecontinuum/sage-gui/commit/1b6eb85457b01b70a496b34b80b1b5afadce7c52))
* **data:** fix ontology link ([91a8987](https://github.com/sagecontinuum/sage-gui/commit/91a89870b8a84932110a1f31ae07daff088c7209))
* **data:** use a better default app filter (for now) ([ad40020](https://github.com/sagecontinuum/sage-gui/commit/ad40020dfa94edeedc9bef216a325288aa2c2ebb))
* linter + trailing slash for token url ([4ed4863](https://github.com/sagecontinuum/sage-gui/commit/4ed4863a33e07648148edcdb237c10dd4a111658))
* my waggle devices icon + dropdown menu display ([f14ad82](https://github.com/sagecontinuum/sage-gui/commit/f14ad820e6dcc3969e9fed97161282d6aee1fa2f))
* NanoList UI + regAuthCheck message ([e156c9b](https://github.com/sagecontinuum/sage-gui/commit/e156c9bd22a01fe891db3e8b8edbe74d164356ad))
* reg-api modify authURL + tmp dependency ([d773723](https://github.com/sagecontinuum/sage-gui/commit/d773723fff5fd527a348d3cc4f8909ba9bbfd7af))
* **reg-api:** fix response code ([50f0d92](https://github.com/sagecontinuum/sage-gui/commit/50f0d92fc8d1c5288c6cbded9a8519eb72bd3af1))
* **reg-api:** fix status code comparison, add username to request, formatting, ([c2c6483](https://github.com/sagecontinuum/sage-gui/commit/c2c6483ff13587208f7cd4b0384dc18e0df30dc7))
* use docs.waggle-edge.ai for doc links ([5b03f9c](https://github.com/sagecontinuum/sage-gui/commit/5b03f9c5a03d9eb04885061f65b821fecf754c01))

## [2.1.0](https://github.com/sagecontinuum/sage-gui/compare/v1.8.1...v2.1.0) (2022-07-25)


### Features

* **jobs:** allow free text (via button) in conditional rule building ([952e617](https://github.com/sagecontinuum/sage-gui/commit/952e617aed85664dc416b05657abbb13e5ee9fa1))


### Bug Fixes

* **jobs:** add docker registry url and short app names ([e72141e](https://github.com/sagecontinuum/sage-gui/commit/e72141e2acc266190d67f24d7eadc716d8b61f6d))
* **jobs:** add username; minor refactor ([f07d8f7](https://github.com/sagecontinuum/sage-gui/commit/f07d8f7e3d5a878b4fc19406615d4c030ca3ed80))
* **jobs:** fix set job name ([9cfb964](https://github.com/sagecontinuum/sage-gui/commit/9cfb964f32ab93e4edee48150d040f3c37446647))



## [2.0.0](https://github.com/sagecontinuum/sage-gui/compare/v1.8.1...v2.0.0) (2022-07-05)


### ⚠ BREAKING CHANGES

* ontology info is now at /data/ontology/:name instead of /data-browser/ontology/:name

### Features

* add commission date; SAGE-1207 ([0335c5d](https://github.com/sagecontinuum/sage-gui/commit/0335c5deb0a933a9dc31f45cbc31581a8e2dec69))
* add data page to project views ([0f7885e](https://github.com/sagecontinuum/sage-gui/commit/0f7885e4e313dca002790bd5c171838f69bd23a8))
* add disableClickOutside option; enable checkbox column (WIP) ([784a668](https://github.com/sagecontinuum/sage-gui/commit/784a668282d33be7913ae87f160cb899fdc5c829))
* add disableClickOutside option; enable checkbox column (WIP) ([54084dd](https://github.com/sagecontinuum/sage-gui/commit/54084ddc3f9cff379191dc901374c944f61ab275))
* add timeline endtime option ([e8fd68c](https://github.com/sagecontinuum/sage-gui/commit/e8fd68c903e6c7729ff3c3732a6f718185255862))
* add timeline zoom/pan controls ([a1816c0](https://github.com/sagecontinuum/sage-gui/commit/a1816c083090fba8eccaf02d87a107c025016e9c))
* **admin:** add factory completed tag (and other minor things) ([f9e23ec](https://github.com/sagecontinuum/sage-gui/commit/f9e23ec9b927cf338d3494248a9a05b4dfe326ca))
* **admin:** add simple counts to factory testing tooltips ([fe983e0](https://github.com/sagecontinuum/sage-gui/commit/fe983e090eda8fbd9bd0b4ebd8bc498c351829d9))
* **admin:** add some support for static gps data; (cleanup parsing some) ([a415f82](https://github.com/sagecontinuum/sage-gui/commit/a415f827cc2eebb28d5519b2eb2e99e0d652f2a7))
* create job form (beta) ([bcdbe18](https://github.com/sagecontinuum/sage-gui/commit/bcdbe18ed0ec3f80839137b51a02d0a548c2429b))
* **data:** add 'show versions' checkbox; some refactoring ([aa57e53](https://github.com/sagecontinuum/sage-gui/commit/aa57e538c68e7b8a526aa319e8a6d5f782e0e0d6))
* **data:** add "byApp" filtering; fix typos ([ecdf1bb](https://github.com/sagecontinuum/sage-gui/commit/ecdf1bbcdd79ba834f4fffcca25910b2c9dee15a))
* **data:** add basic start date selector; some refactoring ([45b73b3](https://github.com/sagecontinuum/sage-gui/commit/45b73b377cc1487d7530421c5b5ec00740471079))
* **data:** add date/time picker; add copy curl cmd ([0a3475a](https://github.com/sagecontinuum/sage-gui/commit/0a3475a578d8c2c2bedfa7731395817ba1b6be6c))
* **data:** add end dates for range bigger than min/hour ([9d4b92a](https://github.com/sagecontinuum/sage-gui/commit/9d4b92a2341f8bfbf8b521c10e84446e2ddb6df6))
* **data:** add node filter; minor renaming ([bd3f1aa](https://github.com/sagecontinuum/sage-gui/commit/bd3f1aa76c158f83a1826d26882734e87de1ff31))
* **data:** add simple line chart; shortcuts; minor styling ([32943c9](https://github.com/sagecontinuum/sage-gui/commit/32943c9d8481f8f68ed11cdffa4b2c5bd8e6efae))
* **data:** add simple line chart; shortcuts; minor styling ([a2ce0e5](https://github.com/sagecontinuum/sage-gui/commit/a2ce0e5e64faaa3916c18af721b28b065b28f0f2))
* **data:** add sparklines; add downsampling toggle; fix device grouping for charts ([a159d71](https://github.com/sagecontinuum/sage-gui/commit/a159d71e70c0f3f32ce889d49d265757be26fa7a))
* **data:** add timeline to node pages (and refactor) ([c323c07](https://github.com/sagecontinuum/sage-gui/commit/c323c07b79be4205531db0b619f2b1733706db72))
* **data:** add timeseries zoom ([a2b590e](https://github.com/sagecontinuum/sage-gui/commit/a2b590e7afb30dd56abd5382285d15bb545babee))
* **data:** allow any time window in urls ([bea65a3](https://github.com/sagecontinuum/sage-gui/commit/bea65a33d0a4d1edbfb80ec58901906e36b86f63))
* **data:** show inputValue (instead of using custom component) ([e623183](https://github.com/sagecontinuum/sage-gui/commit/e6231837f356e851df70ae7d91cf630f22884029))
* **ecr:** add input args tab ([9b3f606](https://github.com/sagecontinuum/sage-gui/commit/9b3f606d77b12f67888ee734a6143cb392129d5c))
* **portal:** add mdp download links ([6a23c0a](https://github.com/sagecontinuum/sage-gui/commit/6a23c0a0de3d7755dab624069fba0414ed550642))
* **portal:** use non-admin node page ([1a66f37](https://github.com/sagecontinuum/sage-gui/commit/1a66f37a267da489a917641511d6a0d6682ea61d))
* secondary node page (and refactor) ([e639c81](https://github.com/sagecontinuum/sage-gui/commit/e639c811ee7fb13b7629e8da0345e929dcf413fc))
* **ses:** revised SDR parsing, data structs, some cleanup ([dfbb102](https://github.com/sagecontinuum/sage-gui/commit/dfbb10207d1cc2e136b8c74b8688b3786380dfd0))


### Bug Fixes

* add hack for additional sensors; minor fixes ([c9ea3bc](https://github.com/sagecontinuum/sage-gui/commit/c9ea3bc9951169ea8a34578db08a87b11207cc79))
* add sensor data units (and refactor); other minor handling ([6fe9d42](https://github.com/sagecontinuum/sage-gui/commit/6fe9d426f96f3223eb5dd77ead5314cd2400a3f3))
* **admin:** add "no shield" to factory page; change phase 2 sanity/health worm to 3 days; specify columns in signoff table ([017670e](https://github.com/sagecontinuum/sage-gui/commit/017670e1aa3caa6015d97751a4cc43b67a37e8e6))
* **admin:** add "no shield" to factory page; change phase 2 sanity/health worm to 3 days; specify columns in signoff table ([f236375](https://github.com/sagecontinuum/sage-gui/commit/f236375006d4c1515631536cfcd03a1477427a97))
* **admin:** add "node does not support audio" note ([b2e70d6](https://github.com/sagecontinuum/sage-gui/commit/b2e70d617b7732eea78612357828cf3952cf3d5a))
* **admin:** cleanup pinging tear down ([0cbf104](https://github.com/sagecontinuum/sage-gui/commit/0cbf104fe17ff1c58b3aa1223e8a5e57daec6ed8))
* **admin:** fix "no data" on factory page; remove "good" chip for health/sanity ([735cffc](https://github.com/sagecontinuum/sage-gui/commit/735cffc99df183158c9975956267c9b4d20ff951))
* **admin:** fix recent sanity count (and cleanup) ([db6186c](https://github.com/sagecontinuum/sage-gui/commit/db6186cc96e59cc5f41247672a980e735a38a0f0))
* **admin:** fix thermal link ([8578d3c](https://github.com/sagecontinuum/sage-gui/commit/8578d3c5ff36a3af5ccca80271cd3550e7ba21eb))
* **admin:** sort factory pages by vsn ([e396caf](https://github.com/sagecontinuum/sage-gui/commit/e396caf13fa63916a543eeab2e41548bedc4b015))
* **admin:** sort factory pages by vsn ([74c2108](https://github.com/sagecontinuum/sage-gui/commit/74c2108ba8d159661daa7111004af2043fc37b81))
* **admin:** sort health/sanity rollups by time (in case there's node VSNs with multiple node ids ([186906c](https://github.com/sagecontinuum/sage-gui/commit/186906c6400c3694757a302364f5adb7902c61be))
* **admin:** sort health/sanity rollups by time (in case there's node VSNs with multiple node ids ([8797d8d](https://github.com/sagecontinuum/sage-gui/commit/8797d8dc3ff9307bb2dd4221fcba977cbf66c577))
* **admin:** use latest hosts for "last updated"; ignore signed-off factory nodes; ([46002df](https://github.com/sagecontinuum/sage-gui/commit/46002df0beabec0ba4cfe1cfc28576233adedcdb))
* **admin:** workaround for no vsn to node_id connection (factory view) ([68c1ada](https://github.com/sagecontinuum/sage-gui/commit/68c1ada3e2f5dd40081412a00caf12a56db88b7c))
* **data:** delete names, change window for media filters ([b516e32](https://github.com/sagecontinuum/sage-gui/commit/b516e32f566b903297e27f8d254d23c4f55f6341))
* **data:** fix "daily" links ([2d5821e](https://github.com/sagecontinuum/sage-gui/commit/2d5821e3e0faf6fb0a3c5c07be8f8dcc28dfd2de))
* **data:** fix date handling ([c7e088a](https://github.com/sagecontinuum/sage-gui/commit/c7e088a8dc92224325a5e517970b6c7a37c1ce7f))
* **data:** fix in data filtering; add select all button (WIP); temp soltuion for ECR linkage ([f78de76](https://github.com/sagecontinuum/sage-gui/commit/f78de76c591c9fd09738cbb8cc1bcb6be79846af))
* **data:** fix in data filtering; add select all button (WIP); temp soltuion for ECR linkage ([4bc553d](https://github.com/sagecontinuum/sage-gui/commit/4bc553d0402263d34827daa1b9bcb335d55b590e))
* **data:** remove redundant request ([bd23495](https://github.com/sagecontinuum/sage-gui/commit/bd2349567fcb56f2f51c442b69e54387891bfe03))
* **ecr:** allow ecr/jenkins error 500 with 'no build id' for now ([00e4085](https://github.com/sagecontinuum/sage-gui/commit/00e40857e1198604c63c22aaf4316067eb8fef77))
* fix client side pagination intial rendering ([b904bc4](https://github.com/sagecontinuum/sage-gui/commit/b904bc4b70324e3df901ff4ae786b244479e762e))
* fix node link from data browser to admin; SAGE-1207 ([87b48a0](https://github.com/sagecontinuum/sage-gui/commit/87b48a0fda9d8dc5ca0c3e39f6136898fa4ac8a9))
* fix timeline canvas height ([e841c55](https://github.com/sagecontinuum/sage-gui/commit/e841c557ece4c56f66526368e1b86fcec0f9fe70))
* fix wsn "hotspot" layout ([73b4630](https://github.com/sagecontinuum/sage-gui/commit/73b4630c299265a6b522247ff6b2e0e38255cd51))
* **portal:** add docs link on navbar ([0565aa7](https://github.com/sagecontinuum/sage-gui/commit/0565aa75768ecb64bbfb15f0eb166f31b6c49514))
* **portal:** add live gps to node page; styling; minor things ([d737460](https://github.com/sagecontinuum/sage-gui/commit/d7374606443423df0364cda547839aad9f665cd7))
* **portal:** fix limit handling in data stream charts; cancel old api requests ([10974f5](https://github.com/sagecontinuum/sage-gui/commit/10974f5966249a9c099edf692405b8bffe2fd460))
* **portal:** fix node page handling ([463faad](https://github.com/sagecontinuum/sage-gui/commit/463faad114ba25f34467d3283f8bc4d5f8261237))
* **projects:** fix for no nodes reporting ([4f3478b](https://github.com/sagecontinuum/sage-gui/commit/4f3478b21ddf7eeda5bfab94b096b2637df5f933))
* **projects:** ignore node ids with no project when filtering ([911d3a2](https://github.com/sagecontinuum/sage-gui/commit/911d3a2466af1ea3f5ff2426b066a22c908fbffc))
* properly check limit prop in table component ([e760bd6](https://github.com/sagecontinuum/sage-gui/commit/e760bd66886cf147613e4a8834477d7f6f434254))
* properly check limit prop in table component (for filtered + paginationed usecase) ([d9f0455](https://github.com/sagecontinuum/sage-gui/commit/d9f0455fbc7a9e269391cdae410cc3533f0bccbf))
* properly check limit prop in table component (for filtered + paginationed usecase) ([5a316ac](https://github.com/sagecontinuum/sage-gui/commit/5a316ac1f0460a0ff4d3f549d1de93b2781a2b88))
* remove extra dom ref in audio; minor refactor ([fa34f2e](https://github.com/sagecontinuum/sage-gui/commit/fa34f2e429d2ae10bd88e062f139165ef57f621a))
* routing fixes ([e36f671](https://github.com/sagecontinuum/sage-gui/commit/e36f671047e8bd79783288476c6cb2318f3964fa))
* **sage:** add node view > timeline error handling; use 45 day window (for now) ([e9ae8e1](https://github.com/sagecontinuum/sage-gui/commit/e9ae8e1f301a35aab0d3ac9eb474c7eabcf12958))
* temp fix to support html5 audio fallback for 'dataURL' param ([cb20809](https://github.com/sagecontinuum/sage-gui/commit/cb20809b3afe58e21cf3658673a5151612271cb4))
* use fixed positioning for progress bar (for scrolling) ([2b27b8a](https://github.com/sagecontinuum/sage-gui/commit/2b27b8ad1805fce1c07313f93de69801d6444354))


* change ontology urls ([0dbe007](https://github.com/sagecontinuum/sage-gui/commit/0dbe007fc14f82c6046b58627ad4f9359b616a53))

## [1.10.0](https://github.com/sagecontinuum/sage-gui/compare/v1.8.1...v1.9.0) (2022-03-22)


### Features

* add commission date; SAGE-1207 ([0335c5d](https://github.com/sagecontinuum/sage-gui/commit/0335c5deb0a933a9dc31f45cbc31581a8e2dec69))
* **admin:** add simple counts to factory testing tooltips ([fe983e0](https://github.com/sagecontinuum/sage-gui/commit/fe983e090eda8fbd9bd0b4ebd8bc498c351829d9))
* **admin:** add some support for static gps data; (cleanup parsing some) ([a415f82](https://github.com/sagecontinuum/sage-gui/commit/a415f827cc2eebb28d5519b2eb2e99e0d652f2a7))
* **data:** add date/time picker; add copy curl cmd ([0a3475a](https://github.com/sagecontinuum/sage-gui/commit/0a3475a578d8c2c2bedfa7731395817ba1b6be6c))
* **data:** add end dates for range bigger than min/hour ([9d4b92a](https://github.com/sagecontinuum/sage-gui/commit/9d4b92a2341f8bfbf8b521c10e84446e2ddb6df6))
* **data:** add simple line chart; shortcuts; minor styling ([a2ce0e5](https://github.com/sagecontinuum/sage-gui/commit/a2ce0e5e64faaa3916c18af721b28b065b28f0f2))
* **data:** show inputValue (instead of using custom component) ([e623183](https://github.com/sagecontinuum/sage-gui/commit/e6231837f356e851df70ae7d91cf630f22884029))
* **ses:** revised SDR parsing, data structs, some cleanup ([dfbb102](https://github.com/sagecontinuum/sage-gui/commit/dfbb10207d1cc2e136b8c74b8688b3786380dfd0))


### Bug Fixes

* **admin:** add "no shield" to factory page; change phase 2 sanity/health worm to 3 days; specify columns in signoff table ([f236375](https://github.com/sagecontinuum/sage-gui/commit/f236375006d4c1515631536cfcd03a1477427a97))
* **admin:** add "node does not support audio" note ([b2e70d6](https://github.com/sagecontinuum/sage-gui/commit/b2e70d617b7732eea78612357828cf3952cf3d5a))
* **admin:** cleanup pinging tear down ([0cbf104](https://github.com/sagecontinuum/sage-gui/commit/0cbf104fe17ff1c58b3aa1223e8a5e57daec6ed8))
* **admin:** fix "no data" on factory page; remove "good" chip for health/sanity ([735cffc](https://github.com/sagecontinuum/sage-gui/commit/735cffc99df183158c9975956267c9b4d20ff951))
* **admin:** fix recent sanity count (and cleanup) ([db6186c](https://github.com/sagecontinuum/sage-gui/commit/db6186cc96e59cc5f41247672a980e735a38a0f0))
* **admin:** fix thermal link ([8578d3c](https://github.com/sagecontinuum/sage-gui/commit/8578d3c5ff36a3af5ccca80271cd3550e7ba21eb))
* **admin:** sort factory pages by vsn ([74c2108](https://github.com/sagecontinuum/sage-gui/commit/74c2108ba8d159661daa7111004af2043fc37b81))
* **admin:** sort health/sanity rollups by time (in case there's node VSNs with multiple node ids ([8797d8d](https://github.com/sagecontinuum/sage-gui/commit/8797d8dc3ff9307bb2dd4221fcba977cbf66c577))
* **admin:** workaround for no vsn to node_id connection (factory view) ([68c1ada](https://github.com/sagecontinuum/sage-gui/commit/68c1ada3e2f5dd40081412a00caf12a56db88b7c))
* **data:** delete names, change window for media filters ([b516e32](https://github.com/sagecontinuum/sage-gui/commit/b516e32f566b903297e27f8d254d23c4f55f6341))
* fix client side pagination intial rendering ([b904bc4](https://github.com/sagecontinuum/sage-gui/commit/b904bc4b70324e3df901ff4ae786b244479e762e))
* fix node link from data browser to admin; SAGE-1207 ([87b48a0](https://github.com/sagecontinuum/sage-gui/commit/87b48a0fda9d8dc5ca0c3e39f6136898fa4ac8a9))
* remove extra dom ref in audio; minor refactor ([fa34f2e](https://github.com/sagecontinuum/sage-gui/commit/fa34f2e429d2ae10bd88e062f139165ef57f621a))
* routing fixes ([e36f671](https://github.com/sagecontinuum/sage-gui/commit/e36f671047e8bd79783288476c6cb2318f3964fa))
* temp fix to support html5 audio fallback for 'dataURL' param ([cb20809](https://github.com/sagecontinuum/sage-gui/commit/cb20809b3afe58e21cf3658673a5151612271cb4))
* use fixed positioning for progress bar (for scrolling) ([2b27b8a](https://github.com/sagecontinuum/sage-gui/commit/2b27b8ad1805fce1c07313f93de69801d6444354))

### [1.8.1](https://github.com/sagecontinuum/sage-gui/compare/v1.8.0...v1.8.1) (2022-01-20)


### Bug Fixes

* **ecr:** add ability to make app public/private when its namespace is public ([f6e8a9f](https://github.com/sagecontinuum/sage-gui/commit/f6e8a9fd5958ef70fc6d1c1abe0951bc5955f8e8))
* improve "recent data table"; add tests ([8a66ecc](https://github.com/sagecontinuum/sage-gui/commit/8a66eccfb930740c6b859d5e14110e4da1efe069))

## [1.8.0](https://github.com/sagecontinuum/sage-gui/compare/v1.7.0...v1.8.0) (2022-01-12)


### Features

* **admin:** add map marker labels and basic marker popups; marker styling; bump mapbox dep; SAGE-1172 ([2ce1329](https://github.com/sagecontinuum/sage-gui/commit/2ce1329512cf86c0badd3e1c1f05fa8eafb1c629))
* **admin:** add ontology link to "recent data"; fix typos ([a68c32a](https://github.com/sagecontinuum/sage-gui/commit/a68c32a0865234bff31d220c0f553ecc92298c6a))
* **admin:** generic node "recent data" table component ([ceb1e6c](https://github.com/sagecontinuum/sage-gui/commit/ceb1e6cdc197a72f57716dfb8288d7f5e0cb56d2))
* **ecr:** make version numbers optional; use /submit endpoint; SAGE-1172 ([2157fab](https://github.com/sagecontinuum/sage-gui/commit/2157fab19ce9c45bd7de3bb96ad0e11ad49b9755))
* **portal:** add docker pull command; add clipboard component ([26d38da](https://github.com/sagecontinuum/sage-gui/commit/26d38da3c7b2e56543d40823534561bed104cf9d))
* **portal:** add simple ontology page; fix typos/styling ([4d72d51](https://github.com/sagecontinuum/sage-gui/commit/4d72d51f61d0580c4081999adfb8925829f3548b))
* **portal:** app/plugin data browser prototype ([2982b55](https://github.com/sagecontinuum/sage-gui/commit/2982b553a1174243037f22e4456307d9942c99d1))
* **viz:** add tailHours (window) option to timeline ([42dd1a9](https://github.com/sagecontinuum/sage-gui/commit/42dd1a9699cdb656c630146bc17ab1043084bef5))


### Bug Fixes

* **admin:** add html audio fallback; add audio url option ([1969fa4](https://github.com/sagecontinuum/sage-gui/commit/1969fa438d6836beefb145e9b73f747847c63985))
* **admin:** allow no vsn on node page; other minor fixes ([ef09dea](https://github.com/sagecontinuum/sage-gui/commit/ef09dea5c2c51b20e5b547276cdc696c832894ef))
* **admin:** allow VSNs to change; ignore older VSNs ([2eb97d1](https://github.com/sagecontinuum/sage-gui/commit/2eb97d1fdae0d57385af87ee7f3670ae4ef89c88))
* **admin:** ensure there actually are health details; SAGE-1143 ([f9b9d17](https://github.com/sagecontinuum/sage-gui/commit/f9b9d17a3a53bb996e8893b843016537aa5c69a9))
* **admin:** fix filtering with commas ([ccf3f78](https://github.com/sagecontinuum/sage-gui/commit/ccf3f7837c0b56136356b2e2dfdc42752950fe18))
* **admin:** remove transition (breaking map fullscreen button); ignore table clickoutside when focused on node; slightly smaller labels; SAGE-1172 ([0bb5f0f](https://github.com/sagecontinuum/sage-gui/commit/0bb5f0fdc00a392368cee8ff09a78aef5fc147a0))
* **ecr:** handle other branches (for real); other minor changes/refactoring ([e5bed26](https://github.com/sagecontinuum/sage-gui/commit/e5bed26fdce62f795b70deb422d0e74010ea6fd6))
* **ecr:** only filter featured apps on explore view; move list of featured apps ([eb22e8b](https://github.com/sagecontinuum/sage-gui/commit/eb22e8b7825d90d4d2348188ba1f1ee819525876))
* **ecr:** remove weird, unnecessary effect (which was breaking repo url input) ([32f0dda](https://github.com/sagecontinuum/sage-gui/commit/32f0dda901047d16c725b5659aa71e5fe00f23dc))
* **ecr:** some clarity on 'create app' params; fix dropdown sorting option; SAGE-1172 ([57071f0](https://github.com/sagecontinuum/sage-gui/commit/57071f046db7f3e2e6b74405ce5a13e197c77604))
* **portal:** data preview improvements ([0b33115](https://github.com/sagecontinuum/sage-gui/commit/0b3311506fc1e2530526b984af19ce22391c729f))

## [1.7.0](https://github.com/sagecontinuum/sage-gui/compare/v1.6.0...v1.7.0) (2021-11-18)


### Features

* **admin:** add build phase filtering (using mock data) ([ffaab34](https://github.com/sagecontinuum/sage-gui/commit/ffaab349e528b99786fd731b8891678928676ac0))
* **admin:** add health/sanity sparkline summaries ([707ae84](https://github.com/sagecontinuum/sage-gui/commit/707ae84ed205db0237b10eeb56d7dfb3b3c8ec1e))
* **admin:** add node monitoring "filter nodes" config ([3daa97f](https://github.com/sagecontinuum/sage-gui/commit/3daa97f43ec727eac8a78585512fa7caa1c8489c))
* **admin:** add old image/audio warnings and relative times ([3e27395](https://github.com/sagecontinuum/sage-gui/commit/3e2739531755ddf5c7017b985eb82ed0d17dfd5b))
* **admin:** clean up display of fs util ([4e7e1dd](https://github.com/sagecontinuum/sage-gui/commit/4e7e1dd7d747380cd9753bb41ee04c02529eda79))
* **admin:** device and nodehealth charts ([fa0ce5b](https://github.com/sagecontinuum/sage-gui/commit/fa0ce5b83108311b0a1d9f500d0e2cce88a121a2))
* **admin:** nodeMeta table ([b94a95e](https://github.com/sagecontinuum/sage-gui/commit/b94a95e7862aa9b60bedb807e7d512b387ce00d0))
* **admin:** use aggregated data on "tests" page ([73ce2ab](https://github.com/sagecontinuum/sage-gui/commit/73ce2ab506ef43e61ac5adeba481906e58797f03))
* **timeline:** add margin api & matrix size function ([9b5fed4](https://github.com/sagecontinuum/sage-gui/commit/9b5fed491d45be25ba8b30c4d75bd6cc5103510a))
* **timeline:** basic legend support ([dd39e6b](https://github.com/sagecontinuum/sage-gui/commit/dd39e6b15110653feff1f0f9ea55f89635df03be))
* **timeline:** unobserve resizer; add debouncer ([2ff8d8b](https://github.com/sagecontinuum/sage-gui/commit/2ff8d8b66d1b765b9746c80a616f9897f22bf1d3))
* new timeline/heatmap viz ([ce4ab4b](https://github.com/sagecontinuum/sage-gui/commit/ce4ab4b05a2c680a9b5de887a7a861ff3ada47e7))


### Bug Fixes

* **admin:** add some storage fetch progress ([1dd12d7](https://github.com/sagecontinuum/sage-gui/commit/1dd12d7f1e0b82015f8c5defc79cd2ed28775248))
* **admin:** allow upper or lower case node urls ([10b0b88](https://github.com/sagecontinuum/sage-gui/commit/10b0b88af2a233a05755dd22dbc45a08398b4799))
* **admin:** don't crash if requests to fail ([1aff97d](https://github.com/sagecontinuum/sage-gui/commit/1aff97dd0ff683521fe1d9b2528b40491c238e1d))
* **admin:** minor type and error handling fixes ([7af26b7](https://github.com/sagecontinuum/sage-gui/commit/7af26b75a257b94fda90ef42f076e95d3a45f6da))
* **ecr:** fix/add sage.yml fetching on branch selection ([9de7967](https://github.com/sagecontinuum/sage-gui/commit/9de79678b3b03b6962b854cb8e423fff635fd701))
* **ecr:** show ecr error message in app listings ([660f967](https://github.com/sagecontinuum/sage-gui/commit/660f96746baeb22e009fb12af67dc8c58b2c1860))

## [1.6.0](https://github.com/sagecontinuum/sage-gui/compare/v1.4.0...v1.6.0) (2021-10-13)


### Features

* **admin:** add "Latest Available Audio" page ([2f3a974](https://github.com/sagecontinuum/sage-gui/commit/2f3a974fb9934dd3a8d72d0526b34af7174550e6))
* **admin:** add basic plugin status chart ([a2fcc40](https://github.com/sagecontinuum/sage-gui/commit/a2fcc40178484bf7c6bd8773f476b7425b6d76de))
* **admin:** add latest image/audio to node view ([a2bf299](https://github.com/sagecontinuum/sage-gui/commit/a2bf299dfa22fc35ce8eb0e389e9b82057661753))
* **admin:** support live geo data ([686d812](https://github.com/sagecontinuum/sage-gui/commit/686d81215bc32e49c55764ad4d7ce58f4f1d378e))
* **admin:** support non-sorting menus ([25030c7](https://github.com/sagecontinuum/sage-gui/commit/25030c7ff7b907c34979c01b949ea2ae9dc9cd37))
* **ecr:** crude version of "featured apps" ([b13f59a](https://github.com/sagecontinuum/sage-gui/commit/b13f59a4c98b93778778a5b71688507d9b84f658))


### Bug Fixes

* **admin:** add location column (and allow missing meta) ([411b2d2](https://github.com/sagecontinuum/sage-gui/commit/411b2d20cb827a3330c3802eb621c6789bd308fb))
* **admin:** exclude empty lists in plugin chart (for now) ([1202890](https://github.com/sagecontinuum/sage-gui/commit/1202890cb0330e5e8a3a22f9caedd79a5cde33c2))
* **admin:** fix sorting for undefined vals ([a1d215e](https://github.com/sagecontinuum/sage-gui/commit/a1d215e2c3700f18717846af72b115c74d1bf828))
* **admin:** fix/swap influx dash links ([c1f154c](https://github.com/sagecontinuum/sage-gui/commit/c1f154cb9b3c9060daa24f85250afead6a5b9cb2))
* **admin:** replace thermal link icon (WIP) ([cd59578](https://github.com/sagecontinuum/sage-gui/commit/cd5957810b00e97bf974c9e103685855fbf75028))
* **admin:** update docs links; minor style fixes ([64a8c0d](https://github.com/sagecontinuum/sage-gui/commit/64a8c0de91f1d1c8162ae881ffbb29db4cdce14a))
* **ecr:** improve validation ([967388c](https://github.com/sagecontinuum/sage-gui/commit/967388cbe4ad0690221cb42edc826ca21d77b557))
* **ecr:** minor display fixes ([eaa12b6](https://github.com/sagecontinuum/sage-gui/commit/eaa12b61dad74f89b76f379452bbbcc0fd3db3ea))
* **ecr:** remove build status from "explore" ([4ed3556](https://github.com/sagecontinuum/sage-gui/commit/4ed35564d888b3ec30cb60a90457b5a31fb68bcf))
* **ecr:** remove uuid references ([f42b247](https://github.com/sagecontinuum/sage-gui/commit/f42b2479454f1f7ad90884c9f25de79a6d605a4b))

## [1.5.0](https://github.com/sagecontinuum/sage-gui/compare/v1.4.0...v1.5.0) (2021-09-30)


### Features

* **admin:** add basic plugin status chart ([a2fcc40](https://github.com/sagecontinuum/sage-gui/commit/a2fcc40178484bf7c6bd8773f476b7425b6d76de))
* **admin:** support non-sorting menus ([25030c7](https://github.com/sagecontinuum/sage-gui/commit/25030c7ff7b907c34979c01b949ea2ae9dc9cd37))
* **ecr:** crude version of "featured apps" ([b13f59a](https://github.com/sagecontinuum/sage-gui/commit/b13f59a4c98b93778778a5b71688507d9b84f658))


### Bug Fixes

* **admin:** add location column (and allow missing meta) ([411b2d2](https://github.com/sagecontinuum/sage-gui/commit/411b2d20cb827a3330c3802eb621c6789bd308fb))
* **admin:** exclude empty lists in plugin chart (for now) ([1202890](https://github.com/sagecontinuum/sage-gui/commit/1202890cb0330e5e8a3a22f9caedd79a5cde33c2))
* **admin:** fix sorting for undefined vals ([a1d215e](https://github.com/sagecontinuum/sage-gui/commit/a1d215e2c3700f18717846af72b115c74d1bf828))
* **admin:** replace thermal link icon (WIP) ([cd59578](https://github.com/sagecontinuum/sage-gui/commit/cd5957810b00e97bf974c9e103685855fbf75028))

## [1.4.0](https://github.com/sagecontinuum/sage-gui/compare/v1.3.0...v1.4.0) (2021-09-15)


### Features

* **admin:** add sensor chart links, VSNs, and projects with filtering (mock) ([7e04a00](https://github.com/sagecontinuum/sage-gui/commit/7e04a00a22e4676f2a256e00eb14af9b4085a4f3))
* **admin:** highlight fs sizes at some thresholds ([f80fc09](https://github.com/sagecontinuum/sage-gui/commit/f80fc091c97dbeb84a9655bab51ce8cddbbc402e))
* **admin:** use VSNs from beehive; some configuration changes ([0eb0683](https://github.com/sagecontinuum/sage-gui/commit/0eb0683c2ab0fc550e5f8d37607204f79b86afb3))
* **ecr:** add branch selection (and fix text inputs) ([0d91e8a](https://github.com/sagecontinuum/sage-gui/commit/0d91e8a7f3105ea06ed0f99077309f63482c2bd0))
* **ecr:** add form "debug" option ([a85bb01](https://github.com/sagecontinuum/sage-gui/commit/a85bb01e1cf0709a958bf1828bc6c576878eee5f))
* **ecr:** make table search sticky ([2efca45](https://github.com/sagecontinuum/sage-gui/commit/2efca45cfe18034d0f19de3f287158933d3631f5))
* **ecr:** revise app listing and add thumbnail placeholders ([b70da67](https://github.com/sagecontinuum/sage-gui/commit/b70da67d1c56611a69ba0b67c7f51d3d2176c8ef))
* **ecr:** revised app layout (for meta); ([f5e9b74](https://github.com/sagecontinuum/sage-gui/commit/f5e9b74a453f45b80f1bf24bd8a7fc114f03752b))


### Bug Fixes

* **admin:** handle no nx sanity metrics; update data endpoint ([f1efd2b](https://github.com/sagecontinuum/sage-gui/commit/f1efd2b7e69cc7723d639705d040b2096aa5a988))
* **admin:** ignore records that don't have a node id or host ([6be4b36](https://github.com/sagecontinuum/sage-gui/commit/6be4b361d57cb0d1f8fd806ec691fa0415f4d45c))
* revised app submission ([dfbcd1d](https://github.com/sagecontinuum/sage-gui/commit/dfbcd1d544bd007c0947058a935702ff8caa5b47))
* **admin:** fix/add sanity chart height; rename api function ([198f678](https://github.com/sagecontinuum/sage-gui/commit/198f678dd815e6397bddf143c73d30da0e33ca22))
* **ecr:** allow click on action shortcuts in "my apps" ([328728d](https://github.com/sagecontinuum/sage-gui/commit/328728d5ec8e2ced93fa6c665c7066c5278c5773))
* **ecr:** don't use nested links (and fix text selection in app listing) ([01baa53](https://github.com/sagecontinuum/sage-gui/commit/01baa53007da9c67ce7d78d858e31bd440b70998))



## [1.3.0](https://github.com/sagecontinuum/sage-gui/compare/v1.2.0...v1.3.0) (2021-07-06)


### Features

* **data:** add basic data product page ([4c79ace](https://github.com/sagecontinuum/sage-gui/commit/4c79ace4321ec28e4139e37a99e5adb9a9121b77))
* **data:** add format filter; simple download btn; simple query; some styling ([d3505fe](https://github.com/sagecontinuum/sage-gui/commit/d3505fed7ac69f355e643420e4a7340bb9308862))
* **data:** add initial data prototype ([1b5a236](https://github.com/sagecontinuum/sage-gui/commit/1b5a2362e1ad4415b2fd6764130b9b87f2d41f20))
* **data:** add simple beehive data preview ([f615fd9](https://github.com/sagecontinuum/sage-gui/commit/f615fd9a3e4c3b6650f2bca7af0848d56e696267))
* **data:** add spacious list ([7d818c6](https://github.com/sagecontinuum/sage-gui/commit/7d818c60e779a7a7c385de39d33ae186169132e9))

## [1.2.0](https://github.com/sagecontinuum/sage-gui/compare/v1.1.0...v1.2.0) (2021-06-22)


### Features

* **admin:** add node details view (placeholder) ([1a5c606](https://github.com/sagecontinuum/sage-gui/commit/1a5c6069e533c98d8054de607cb88c95dc63b027))
* **admin:** add node sanity test overview chart ([2e9be5b](https://github.com/sagecontinuum/sage-gui/commit/2e9be5b5c5d6e5d171892a4f1b21d475fbeabc3f))
* **admin:** add recent sanity metric events ([2ff95ad](https://github.com/sagecontinuum/sage-gui/commit/2ff95ad797867670cb6da5fc97b06e08ef41eb3b))
* **admin:** add test heatmap ([cf59003](https://github.com/sagecontinuum/sage-gui/commit/cf59003201ee592de73b26c988748fbf78b15fb1))
* **admin:** add/fix status warning dot/tooltip ([255b116](https://github.com/sagecontinuum/sage-gui/commit/255b11605aa75ecf34898dc74e18fe28e5ddd0b6))
* add app tag build button and indicator to tag list; some restyling ([dbf5069](https://github.com/sagecontinuum/sage-gui/commit/dbf5069ca6e3e4182799e8ef037e344ea286f589))


### Bug Fixes

* **admin:** improve new status display ([a5c3ef3](https://github.com/sagecontinuum/sage-gui/commit/a5c3ef3ab80b6f35d4325b8ed6b95877d0edc5c3))
* **ecr:** fix copy config button ([1f51bff](https://github.com/sagecontinuum/sage-gui/commit/1f51bfffc175cd60cb917bc6d7765b23e754708c))
* **ecr:** set namespace to username as default ([61bcde4](https://github.com/sagecontinuum/sage-gui/commit/61bcde4a4e6ebe52941128aaf57d5a65f8a8082f))

### [1.1.1](https://github.com/sagecontinuum/sage-gui/compare/v1.1.0...v1.1.1) (2021-06-04)


### Bug Fixes

* **ecr:** fix copy config button ([1f51bff](https://github.com/sagecontinuum/sage-gui/commit/1f51bfffc175cd60cb917bc6d7765b23e754708c))
* **ecr:** set namespace to username as default ([61bcde4](https://github.com/sagecontinuum/sage-gui/commit/61bcde4a4e6ebe52941128aaf57d5a65f8a8082f))

## [1.1.0](https://github.com/sagecontinuum/sage-gui/compare/v1.0.0-alpha.0...v1.1.0) (2021-06-02)


### Features

* add (temp) signin/signout button ([7ea3ff5](https://github.com/sagecontinuum/sage-gui/commit/7ea3ff5563e83b453880f1276c41780a06513c3d))
* add some dev docs; other minor improvements ([284e962](https://github.com/sagecontinuum/sage-gui/commit/284e962b06621358b3febc0997e825a1f37f000b))
* updates for auth; update endpoints; minor fixes ([e565aa7](https://github.com/sagecontinuum/sage-gui/commit/e565aa75635383c9ae993b6a3419ed7be327c74d))


### Bug Fixes

* **admin:** add progressbar; minor styling/theme config; ([15443a0](https://github.com/sagecontinuum/sage-gui/commit/15443a0a3f31ef0a831286de285e5498057d7645))
* enable username / profile creation flow; ([eafa660](https://github.com/sagecontinuum/sage-gui/commit/eafa660d21f3f9755b7c4cdef21dcc5c835fa129))
* **ecr:** don't trigger navigation while using dialog; revert sign-in url ([092685e](https://github.com/sagecontinuum/sage-gui/commit/092685ec90f558a63d062a3f7fd5b96e12fc8adf))
* **ecr:** handle signed out case; disable actions when not signed in ([6af4d1c](https://github.com/sagecontinuum/sage-gui/commit/6af4d1c58ee02b3d327a0314bc4271735e5d4f34))
