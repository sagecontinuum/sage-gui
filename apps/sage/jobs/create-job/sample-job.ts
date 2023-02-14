const yaml =
`name: myjob
plugins:
  - name: image-sampler
    pluginSpec:
      image: registry.sagecontinuum.org/theone/imagesampler:0.3.0
      args:
        - -stream
        - bottom
nodes:
  W023:
scienceRules:
  - "schedule(image-sampler): cronjob('image-sampler', '* * * * *')"
successCriteria:
  - WallClock(1d)`


export default yaml