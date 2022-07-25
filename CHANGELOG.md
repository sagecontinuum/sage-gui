# Changelog

The following are some notable changes to the UI


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
* **admin:** manifest table ([b94a95e](https://github.com/sagecontinuum/sage-gui/commit/b94a95e7862aa9b60bedb807e7d512b387ce00d0))
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
