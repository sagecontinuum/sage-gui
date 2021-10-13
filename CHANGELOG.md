# Changelog

The following are some notable changes to the UI


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
