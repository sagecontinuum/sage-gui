
export const defaultPrompt = 'Describe what you see in detail.'

const getDefaultSpec = (prompt: string = defaultPrompt, vsn = 'W023') =>
  `
name: assistant-demo
plugins:
- name: moondream-demo
  pluginSpec:
    image: registry.sagecontinuum.org/seanshahkarami/moondream-demo:0.2.0
    args:
    - --camera
    - top_camera
    - --model
    - moondream-0_5b-int8.mf.gz
    - ${prompt}
    selector:
      zone: core
    resource:
      limit.cpu: "2"
      limit.memory: 4Gi
      request.cpu: "2"
      request.memory: 4Gi
nodeTags: []
nodes:
  ${vsn}: true
scienceRules:
- 'schedule(moondream-demo): True'
successCriteria:
- WallClock(1d)
`


export default getDefaultSpec